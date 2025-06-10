// server/api/validate-share-password.post.ts
import { createError, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { shareId, password } = body

    if (!shareId || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Share ID and password are required'
      })
    }

    // Create Supabase client with service key for server-side operations
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey
    )

    // Get the shared chat
    const { data: sharedChat, error: fetchError } = await supabase
      .from('shared_chats')
      .select('password_hash, expires_at')
      .eq('id', shareId)
      .single()

    if (fetchError || !sharedChat) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Shared chat not found'
      })
    }

    // Check if expired
    if (sharedChat.expires_at && new Date(sharedChat.expires_at) < new Date()) {
      throw createError({
        statusCode: 410,
        statusMessage: 'This shared chat has expired'
      })
    }

    // Validate password
    if (!sharedChat.password_hash) {
      return { valid: true }
    }

    const isValid = await bcrypt.compare(password, sharedChat.password_hash)

    return { valid: isValid }

  } catch (error: any) {
    console.error('Password validation error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to validate password'
    })
  }
})
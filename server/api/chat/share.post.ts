import { createError, readBody } from 'h3'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Get request body
  const body = await readBody(event)
  const { sessionId, password, expiresIn } = body

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }

  const supabase = serverSupabaseClient(event)

  try {
    // Verify user owns the session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, title, messages')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Chat session not found'
      })
    }

    // Generate share ID
    const shareId = uuidv4()
    
    // Calculate expiration date
    let expiresAt = null
    if (expiresIn) {
      const expirationDate = new Date()
      switch (expiresIn) {
        case '1h':
          expirationDate.setHours(expirationDate.getHours() + 1)
          break
        case '24h':
          expirationDate.setHours(expirationDate.getHours() + 24)
          break
        case '7d':
          expirationDate.setDate(expirationDate.getDate() + 7)
          break
        case '30d':
          expirationDate.setDate(expirationDate.getDate() + 30)
          break
      }
      expiresAt = expirationDate.toISOString()
    }

    // Hash password if provided
    let hashedPassword = null
    if (password) {
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // Create shared chat entry
    const { data: sharedChat, error: shareError } = await supabase
      .from('shared_chats')
      .insert({
        id: shareId,
        session_id: sessionId,
        user_id: user.id,
        title: session.title,
        password_hash: hashedPassword,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (shareError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create share link'
      })
    }

    // Update the original session to mark it as shared
    await supabase
      .from('chat_sessions')
      .update({
        shared: true,
        share_id: shareId
      })
      .eq('id', sessionId)

    // Return share URL
    const config = useRuntimeConfig()
    const shareUrl = `${config.public.appUrl || 'http://localhost:3000'}/share/${shareId}`

    return {
      success: true,
      shareId,
      shareUrl,
      expiresAt,
      hasPassword: !!password
    }

  } catch (error: any) {
    console.error('Share API error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to share chat'
    })
  }
})
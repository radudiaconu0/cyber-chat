import { createError, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const shareId = getRouterParam(event, 'id')
  
  if (!shareId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Share ID is required'
    })
  }

  const body = await readBody(event)
  const { password } = body

  const supabase = serverSupabaseClient(event)

  try {
    // Get shared chat
    const { data: sharedChat, error: shareError } = await supabase
      .from('shared_chats')
      .select('*')
      .eq('id', shareId)
      .single()

    if (shareError || !sharedChat) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Shared chat not found'
      })
    }

    // Check if expired
    if (sharedChat.expires_at) {
      const expirationDate = new Date(sharedChat.expires_at)
      if (expirationDate < new Date()) {
        throw createError({
          statusCode: 410,
          statusMessage: 'This shared chat has expired'
        })
      }
    }

    // Check password if required
    if (sharedChat.password_hash) {
      if (!password) {
        return {
          requiresPassword: true,
          expiresAt: sharedChat.expires_at
        }
      }

      // Hash provided password
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      if (passwordHash !== sharedChat.password_hash) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Incorrect password'
        })
      }
    }

    // Get the chat session and messages
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, title, model, created_at, updated_at')
      .eq('id', sharedChat.session_id)
      .single()

    if (sessionError || !session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Chat session not found'
      })
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sharedChat.session_id)
      .order('timestamp', { ascending: true })

    if (messagesError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to load messages'
      })
    }

    // Increment view count
    await supabase
      .from('shared_chats')
      .update({ 
        view_count: (sharedChat.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', shareId)

    return {
      title: session.title,
      model: session.model,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        model: m.model
      })),
      createdAt: session.created_at,
      expiresAt: sharedChat.expires_at,
      viewCount: sharedChat.view_count + 1
    }

  } catch (error: any) {
    console.error('Share retrieval error:', error)
    
    // Re-throw if it's already a proper error
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve shared chat'
    })
  }
})
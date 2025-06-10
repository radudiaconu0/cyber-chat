// composables/useSupabaseRealtime.ts
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { ChatSession, Message } from '~/stores/main'

export const useSupabaseRealtime = () => {
  const mainStore = useMainStore()
  const supabase = useSupabaseClient()
  const dexie = useDexie()
  
  const channels = ref<RealtimeChannel[]>([])
  const isConnected = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  
  // Subscribe to chat sessions changes for a user
  const subscribeToChatSessions = async (userId: string) => {
    try {
      const channel = supabase
        .channel(`chat_sessions:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_sessions',
            filter: `user_id=eq.${userId}`
          },
          async (payload: RealtimePostgresChangesPayload<any>) => {
            await handleChatSessionChange(payload)
          }
        )
        .subscribe((status) => {
          console.log('Chat sessions subscription status:', status)
          if (status === 'SUBSCRIBED') {
            isConnected.value = true
            mainStore.setConnectionStatus('connected')
          } else if (status === 'CHANNEL_ERROR') {
            mainStore.setConnectionStatus('disconnected')
          }
        })
      
      channels.value.push(channel)
      return channel
    } catch (error) {
      console.error('Failed to subscribe to chat sessions:', error)
      mainStore.setConnectionStatus('disconnected')
    }
  }
  
  // Subscribe to messages changes for a specific session
  const subscribeToMessages = async (sessionId: string) => {
    try {
      const channel = supabase
        .channel(`messages:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `session_id=eq.${sessionId}`
          },
          async (payload: RealtimePostgresChangesPayload<any>) => {
            await handleMessageChange(payload)
          }
        )
        .subscribe((status) => {
          console.log(`Messages subscription status for ${sessionId}:`, status)
        })
      
      channels.value.push(channel)
      return channel
    } catch (error) {
      console.error('Failed to subscribe to messages:', error)
    }
  }
  
  // Handle chat session changes
  const handleChatSessionChange = async (payload: RealtimePostgresChangesPayload<any>) => {
    mainStore.setConnectionStatus('syncing')
    
    try {
      switch (payload.eventType) {
        case 'INSERT':
          await handleNewSession(payload.new)
          break
          
        case 'UPDATE':
          await handleUpdatedSession(payload.new)
          break
          
        case 'DELETE':
          await handleDeletedSession(payload.old)
          break
      }
      
      lastSyncTime.value = new Date()
      mainStore.setConnectionStatus('connected')
    } catch (error) {
      console.error('Failed to handle session change:', error)
      mainStore.setConnectionStatus('disconnected')
    }
  }
  
  // Handle message changes
  const handleMessageChange = async (payload: RealtimePostgresChangesPayload<any>) => {
    mainStore.setConnectionStatus('syncing')
    
    try {
      switch (payload.eventType) {
        case 'INSERT':
          await handleNewMessage(payload.new)
          break
          
        case 'UPDATE':
          await handleUpdatedMessage(payload.new)
          break
          
        case 'DELETE':
          await handleDeletedMessage(payload.old)
          break
      }
      
      lastSyncTime.value = new Date()
      mainStore.setConnectionStatus('connected')
    } catch (error) {
      console.error('Failed to handle message change:', error)
      mainStore.setConnectionStatus('disconnected')
    }
  }
  
  // Handle new session
  const handleNewSession = async (sessionData: any) => {
    try {
      const session: ChatSession = {
        id: sessionData.id,
        title: sessionData.title,
        messages: [],
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at),
        model: sessionData.model,
        tokenCount: sessionData.token_count || 0,
        archived: sessionData.archived || false,
        shared: sessionData.shared || false,
        shareId: sessionData.share_id
      }
      
      // Add to store if not exists
      const existingIndex = mainStore.chatSessions.findIndex(s => s.id === session.id)
      if (existingIndex === -1) {
        mainStore.chatSessions.unshift(session)
        
        // Save to Dexie
        await dexie.saveSession(session)
        
        // Subscribe to messages for this session
        await subscribeToMessages(session.id)
        
        console.log('New chat session added:', session.title)
      }
    } catch (error) {
      console.error('Failed to handle new session:', error)
    }
  }
  
  // Handle updated session
  const handleUpdatedSession = async (sessionData: any) => {
    try {
      const sessionIndex = mainStore.chatSessions.findIndex(s => s.id === sessionData.id)
      
      if (sessionIndex !== -1) {
        const updatedSession = {
          ...mainStore.chatSessions[sessionIndex],
          title: sessionData.title,
          updatedAt: new Date(sessionData.updated_at),
          tokenCount: sessionData.token_count || 0,
          archived: sessionData.archived || false,
          shared: sessionData.shared || false,
          shareId: sessionData.share_id,
          model: sessionData.model
        }
        
        mainStore.chatSessions[sessionIndex] = updatedSession
        
        // Update in Dexie
        await dexie.saveSession(updatedSession)
        
        console.log('Chat session updated:', updatedSession.title)
      }
    } catch (error) {
      console.error('Failed to handle updated session:', error)
    }
  }
  
  // Handle deleted session
  const handleDeletedSession = async (sessionData: any) => {
    try {
      mainStore.chatSessions = mainStore.chatSessions.filter(s => s.id !== sessionData.id)
      
      // Delete from Dexie
      await dexie.deleteSession(sessionData.id)
      
      // Unsubscribe from messages
      const channelIndex = channels.value.findIndex(c => c.topic === `messages:${sessionData.id}`)
      if (channelIndex !== -1) {
        await channels.value[channelIndex].unsubscribe()
        channels.value.splice(channelIndex, 1)
      }
      
      // Update current chat if necessary
      if (mainStore.currentChatId === sessionData.id) {
        mainStore.currentChatId = mainStore.chatSessions[0]?.id || null
      }
      
      console.log('Chat session deleted:', sessionData.id)
    } catch (error) {
      console.error('Failed to handle deleted session:', error)
    }
  }
  
  // Handle new message
  const handleNewMessage = async (messageData: any) => {
    try {
      const session = mainStore.chatSessions.find(s => s.id === messageData.session_id)
      
      if (session) {
        // Check if message already exists
        const existingMessage = session.messages.find(m => m.id === messageData.id)
        if (!existingMessage) {
          const message: Message = {
            id: messageData.id,
            role: messageData.role,
            content: messageData.content,
            timestamp: new Date(messageData.timestamp),
            model: messageData.model,
            streaming: false,
            error: messageData.error || false,
            attachments: messageData.attachments || [],
            metadata: messageData.metadata || {}
          }
          
          session.messages.push(message)
          session.updatedAt = new Date()
          
          // Save to Dexie
          await dexie.saveMessage(message, session.id)
          
          console.log('New message added to session:', session.title)
        }
      }
    } catch (error) {
      console.error('Failed to handle new message:', error)
    }
  }
  
  // Handle updated message
  const handleUpdatedMessage = async (messageData: any) => {
    try {
      const session = mainStore.chatSessions.find(s => s.id === messageData.session_id)
      
      if (session) {
        const messageIndex = session.messages.findIndex(m => m.id === messageData.id)
        
        if (messageIndex !== -1) {
          session.messages[messageIndex] = {
            ...session.messages[messageIndex],
            content: messageData.content,
            streaming: messageData.streaming || false,
            error: messageData.error || false,
            metadata: messageData.metadata || {}
          }
          
          // Update in Dexie
          await dexie.updateMessage(messageData.id, session.messages[messageIndex])
          
          console.log('Message updated in session:', session.title)
        }
      }
    } catch (error) {
      console.error('Failed to handle updated message:', error)
    }
  }
  
  // Handle deleted message
  const handleDeletedMessage = async (messageData: any) => {
    try {
      const session = mainStore.chatSessions.find(s => s.id === messageData.session_id)
      
      if (session) {
        session.messages = session.messages.filter(m => m.id !== messageData.id)
        session.updatedAt = new Date()
        
        // Delete from Dexie
        await dexie.db.messages.delete(messageData.id)
        
        console.log('Message deleted from session:', session.title)
      }
    } catch (error) {
      console.error('Failed to handle deleted message:', error)
    }
  }
  
  // Initialize real-time subscriptions
  const initialize = async () => {
    if (!mainStore.user) {
      console.warn('Cannot initialize realtime: no user')
      return
    }
    
    try {
      console.log('Initializing realtime subscriptions for user:', mainStore.user.id)
      
      // Subscribe to user's chat sessions
      await subscribeToChatSessions(mainStore.user.id)
      
      // Subscribe to messages for all current sessions
      for (const session of mainStore.chatSessions) {
        await subscribeToMessages(session.id)
      }
      
      console.log('Realtime subscriptions initialized')
    } catch (error) {
      console.error('Failed to initialize real-time:', error)
      mainStore.setConnectionStatus('disconnected')
    }
  }
  
  // Cleanup subscriptions
  const cleanup = async () => {
    console.log('Cleaning up realtime subscriptions')
    
    for (const channel of channels.value) {
      try {
        await channel.unsubscribe()
      } catch (error) {
        console.error('Failed to unsubscribe channel:', error)
      }
    }
    
    channels.value = []
    isConnected.value = false
    mainStore.setConnectionStatus('disconnected')
  }
  
  // Subscribe to a new session's messages
  const subscribeToNewSession = async (sessionId: string) => {
    // Check if already subscribed
    const existingChannel = channels.value.find(c => c.topic === `messages:${sessionId}`)
    if (!existingChannel) {
      await subscribeToMessages(sessionId)
    }
  }
  
  // Force sync with remote
  const syncWithRemote = async () => {
    if (!mainStore.user) return
    
    mainStore.setConnectionStatus('syncing')
    
    try {
      console.log('Syncing with remote...')
      
      // Fetch latest sessions from Supabase
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', mainStore.user.id)
        .order('updated_at', { ascending: false })
      
      if (sessionsError) throw sessionsError
      
      // Update store with latest sessions
      if (sessions) {
        for (const sessionData of sessions) {
          const existingIndex = mainStore.chatSessions.findIndex(s => s.id === sessionData.id)
          
          const session: ChatSession = {
            id: sessionData.id,
            title: sessionData.title,
            messages: existingIndex !== -1 ? mainStore.chatSessions[existingIndex].messages : [],
            createdAt: new Date(sessionData.created_at),
            updatedAt: new Date(sessionData.updated_at),
            model: sessionData.model,
            tokenCount: sessionData.token_count || 0,
            archived: sessionData.archived || false,
            shared: sessionData.shared || false,
            shareId: sessionData.share_id
          }
          
          if (existingIndex !== -1) {
            mainStore.chatSessions[existingIndex] = session
          } else {
            mainStore.chatSessions.push(session)
          }
        }
        
        // Sort by updated date
        mainStore.chatSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      }
      
      lastSyncTime.value = new Date()
      mainStore.setConnectionStatus('connected')
      console.log('Sync completed successfully')
    } catch (error) {
      console.error('Failed to sync with remote:', error)
      mainStore.setConnectionStatus('disconnected')
    }
  }
  
  return {
    channels: readonly(channels),
    isConnected: readonly(isConnected),
    lastSyncTime: readonly(lastSyncTime),
    initialize,
    cleanup,
    subscribeToNewSession,
    syncWithRemote
  }
}
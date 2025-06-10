import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { ChatSession, Message } from '~/stores/main'

interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

export const useSupabaseRealtime = () => {
  const mainStore = useMainStore()
  const { $supabase } = useNuxtApp()
  const dexie = useDexie()
  const toast = inject('toast')
  
  const channels = ref<RealtimeChannel[]>([])
  const isConnected = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  
  // Subscribe to chat sessions changes
  const subscribeToChatSessions = async (userId: string) => {
    try {
      const channel = $supabase
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
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to chat sessions')
            isConnected.value = true
          }
        })
      
      channels.value.push(channel)
    } catch (error) {
      console.error('Failed to subscribe to chat sessions:', error)
      toast('error', 'Connection Error', 'Failed to establish real-time connection')
    }
  }
  
  // Subscribe to messages changes
  const subscribeToMessages = async (sessionId: string) => {
    try {
      const channel = $supabase
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
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to messages for session ${sessionId}`)
          }
        })
      
      channels.value.push(channel)
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
    if (!mainStore.chatSessions.find(s => s.id === session.id)) {
      mainStore.chatSessions.unshift(session)
      
      // Save to Dexie
      await dexie.saveSession(session)
      
      // Subscribe to messages for this session
      await subscribeToMessages(session.id)
      
      toast('info', 'New Chat', 'A new chat session was created')
    }
  }
  
  // Handle updated session
  const handleUpdatedSession = async (sessionData: any) => {
    const sessionIndex = mainStore.chatSessions.findIndex(s => s.id === sessionData.id)
    
    if (sessionIndex !== -1) {
      const updatedSession = {
        ...mainStore.chatSessions[sessionIndex],
        title: sessionData.title,
        updatedAt: new Date(sessionData.updated_at),
        tokenCount: sessionData.token_count || 0,
        archived: sessionData.archived || false,
        shared: sessionData.shared || false,
        shareId: sessionData.share_id
      }
      
      mainStore.chatSessions[sessionIndex] = updatedSession
      
      // Update in Dexie
      await dexie.saveSession(updatedSession)
    }
  }
  
  // Handle deleted session
  const handleDeletedSession = async (sessionData: any) => {
    mainStore.chatSessions = mainStore.chatSessions.filter(s => s.id !== sessionData.id)
    
    // Delete from Dexie
    await dexie.deleteSession(sessionData.id)
    
    // Unsubscribe from messages
    const channelIndex = channels.value.findIndex(c => c.topic === `messages:${sessionData.id}`)
    if (channelIndex !== -1) {
      await channels.value[channelIndex].unsubscribe()
      channels.value.splice(channelIndex, 1)
    }
    
    if (mainStore.currentChatId === sessionData.id) {
      mainStore.currentChatId = mainStore.chatSessions[0]?.id || null
    }
    
    toast('info', 'Chat Deleted', 'A chat session was removed')
  }
  
  // Handle new message
  const handleNewMessage = async (messageData: any) => {
    const session = mainStore.chatSessions.find(s => s.id === messageData.session_id)
    
    if (session && !session.messages.find(m => m.id === messageData.id)) {
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
      
      // Show notification if not current user's message
      if (messageData.user_id !== mainStore.user?.id) {
        toast('info', 'New Message', `New message in ${session.title}`)
      }
    }
  }
  
  // Handle updated message
  const handleUpdatedMessage = async (messageData: any) => {
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
      }
    }
  }
  
  // Handle deleted message
  const handleDeletedMessage = async (messageData: any) => {
    const session = mainStore.chatSessions.find(s => s.id === messageData.session_id)
    
    if (session) {
      session.messages = session.messages.filter(m => m.id !== messageData.id)
      session.updatedAt = new Date()
    }
  }
  
  // Initialize real-time subscriptions
  const initialize = async () => {
    if (!mainStore.user) return
    
    try {
      // Subscribe to user's chat sessions
      await subscribeToChatSessions(mainStore.user.id)
      
      // Subscribe to messages for all current sessions
      for (const session of mainStore.chatSessions) {
        await subscribeToMessages(session.id)
      }
      
      mainStore.setConnectionStatus('connected')
    } catch (error) {
      console.error('Failed to initialize real-time:', error)
      mainStore.setConnectionStatus('disconnected')
    }
  }
  
  // Cleanup subscriptions
  const cleanup = async () => {
    for (const channel of channels.value) {
      await channel.unsubscribe()
    }
    channels.value = []
    isConnected.value = false
    mainStore.setConnectionStatus('disconnected')
  }
  
  // Sync with remote
  const syncWithRemote = async () => {
    if (!mainStore.user) return
    
    mainStore.setConnectionStatus('syncing')
    
    try {
      // Fetch latest sessions from Supabase
      const { data: sessions, error: sessionsError } = await $supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', mainStore.user.id)
        .order('updated_at', { ascending: false })
      
      if (sessionsError) throw sessionsError
      
      // Fetch messages for each session
      for (const sessionData of sessions) {
        const { data: messages, error: messagesError } = await $supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('timestamp', { ascending: true })
        
        if (messagesError) throw messagesError
        
        const session: ChatSession = {
          id: sessionData.id,
          title: sessionData.title,
          messages: messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            model: m.model,
            streaming: false,
            error: m.error || false,
            attachments: m.attachments || [],
            metadata: m.metadata || {}
          })),
          createdAt: new Date(sessionData.created_at),
          updatedAt: new Date(sessionData.updated_at),
          model: sessionData.model,
          tokenCount: sessionData.token_count || 0,
          archived: sessionData.archived || false,
          shared: sessionData.shared || false,
          shareId: sessionData.share_id
        }
        
        // Save to Dexie
        await dexie.saveSession(session)
      }
      
      // Sync with store
      await dexie.syncWithStore()
      
      lastSyncTime.value = new Date()
      mainStore.setConnectionStatus('connected')
      
      toast('success', 'Synced', 'Data synchronized successfully')
    } catch (error) {
      console.error('Failed to sync with remote:', error)
      mainStore.setConnectionStatus('disconnected')
      toast('error', 'Sync Failed', 'Failed to sync with server')
    }
  }
  
  // Watch for connection status changes
  if (process.client) {
    window.addEventListener('online', () => {
      if (!isConnected.value) {
        initialize()
      }
    })
    
    window.addEventListener('offline', () => {
      mainStore.setConnectionStatus('disconnected')
    })
  }
  
  return {
    isConnected: readonly(isConnected),
    lastSyncTime: readonly(lastSyncTime),
    initialize,
    cleanup,
    syncWithRemote,
    subscribeToChatSessions,
    subscribeToMessages
  }
}
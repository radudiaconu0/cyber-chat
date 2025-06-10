// plugins/init.client.ts
export default defineNuxtPlugin(async () => {
  const mainStore = useMainStore()
  
  // Initialize models first
  await mainStore.initializeModels()
  
  try {
    // Use the Supabase client from the Nuxt Supabase module
    const supabase = await useSupabaseClient()
    const user = useSupabaseUser()
    
    // Check authentication status
    const { data: { session } } = await supabase.auth.getSession()
  
    if (session?.user) {
      // Set user in store
      mainStore.setUser({
        id: session.user.id,
        email: session.user.email || '',
        displayName: session.user.user_metadata?.display_name,
        avatarUrl: session.user.user_metadata?.avatar_url
      })
      
      // Load user profile and settings
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile?.settings) {
          mainStore.updateChatSettings(profile.settings)
        }
      } catch (error) {
        console.warn('Failed to load user profile:', error)
      }
      
      // Load chat sessions
      try {
        const { data: sessions } = await supabase
          .from('chat_sessions')
          .select(`
            *,
            messages (
              id,
              role,
              content,
              timestamp,
              model,
              streaming,
              error,
              attachments,
              metadata
            )
          `)
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
        
        if (sessions) {
          sessions.forEach(sessionData => {
            const session = {
              id: sessionData.id,
              title: sessionData.title,
              model: sessionData.model,
              tokenCount: sessionData.token_count || 0,
              archived: sessionData.archived || false,
              shared: sessionData.shared || false,
              shareId: sessionData.share_id,
              createdAt: new Date(sessionData.created_at),
              updatedAt: new Date(sessionData.updated_at),
              messages: (sessionData.messages || []).map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
                model: msg.model,
                streaming: false,
                error: msg.error || false,
                attachments: msg.attachments || [],
                metadata: msg.metadata || {}
              }))
            }
            
            mainStore.addChatSession(session)
          })
        }
      } catch (error) {
        console.warn('Failed to load chat sessions:', error)
      }
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        mainStore.setUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name,
          avatarUrl: session.user.user_metadata?.avatar_url
        })
        
        // Reload data for new user
        await navigateTo('/')
        await reloadNuxtApp()
      } else if (event === 'SIGNED_OUT') {
        mainStore.setUser(null)
        mainStore.clearAllChats()
        await navigateTo('/login')
      }
    })
    
    // Apply theme
    const theme = mainStore.chatSettings.theme
    if (typeof document !== 'undefined') {
      document.documentElement.className = `theme-${theme}`
    }
  } catch (error) {
    console.error('Error during plugin initialization:', error)
  }
})
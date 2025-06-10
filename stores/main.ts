// stores/main.ts
import { defineStore } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const persistedState = createPersistedState()

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  streaming: boolean
  error: boolean
  attachments?: any[]
  metadata?: any
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: string
  tokenCount: number
  archived: boolean
  shared: boolean
  shareId?: string | null
}

export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
}

export interface ChatSettings {
  theme: string
  defaultModel: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  enableWebSearch: boolean
  enableCodeExecution: boolean
  enableReasoning: boolean
  enableAnalytics: boolean
  language: string
  autoSave: boolean
  notifications: boolean
  storeChatHistory: boolean
  syncEnabled: boolean
  shareUsageData: boolean
  openRouterKey: string
  rateLimitRequests: number
  rateLimitTokens: number
}

export interface AIModel {
  id: string
  name: string
  description: string
  contextLength: number
  maxCompletionTokens: number
  pricing: {
    prompt: number
    completion: number
    image: number
    webSearch: number
    request: number
  }
  capabilities: string[]
  category: string
  featured: boolean
  architecture: {
    tokenizer: string
    instructType: string | null
    inputModalities: string[]
    outputModalities: string[]
  }
  provider: {
    contextLength: number
    maxCompletionTokens: number
    isModerated: boolean
  }
  supportedParameters: string[]
  created: number
  perRequestLimits: any
}

type ConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'connecting'

export const useMainStore = defineStore('main', {
  state: () => ({
    // User state
    user: null as User | null,
    
    // Connection state
    connectionStatus: 'disconnected' as ConnectionStatus,
    
    // Chat state
    chatSessions: [] as ChatSession[],
    currentChatId: null as string | null,
    
    // Models state
    availableModels: [] as AIModel[],
    modelsLoading: false,
    modelsError: null as string | null,
    modelsLastFetched: null as Date | null,
    
    // UI state
    sidebarOpen: true,
    isLoading: false,
    loadingMessage: '',
    
    // Settings
    chatSettings: {
      theme: 'cyber',
      defaultModel: 'openai/gpt-4o-mini', // Default to a common model
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: '',
      enableWebSearch: false,
      enableCodeExecution: false,
      enableReasoning: false,
      enableAnalytics: true,
      language: 'en',
      autoSave: true,
      notifications: false,
      storeChatHistory: true,
      syncEnabled: true,
      shareUsageData: false,
      openRouterKey: '',
      rateLimitRequests: 20,
      rateLimitTokens: 50000
    } as ChatSettings,
    
    // Fallback models in case API fails
    fallbackModels: [
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        description: 'Most advanced multimodal flagship model',
        contextLength: 128000,
        maxCompletionTokens: 16384,
        pricing: { prompt: 5, completion: 15, image: 7.225, webSearch: 0, request: 0 },
        capabilities: ['text', 'vision', 'tools', 'reasoning'],
        category: 'multimodal',
        featured: true,
        architecture: {
          tokenizer: 'cl100k_base',
          instructType: 'chat',
          inputModalities: ['text', 'image'],
          outputModalities: ['text']
        },
        provider: {
          contextLength: 128000,
          maxCompletionTokens: 16384,
          isModerated: true
        },
        supportedParameters: ['tools', 'tool_choice', 'temperature', 'max_tokens', 'top_p'],
        created: 1716570560,
        perRequestLimits: null
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o mini',
        description: 'Affordable and intelligent small model for fast, lightweight tasks',
        contextLength: 128000,
        maxCompletionTokens: 16384,
        pricing: { prompt: 0.15, completion: 0.6, image: 0.2125, webSearch: 0, request: 0 },
        capabilities: ['text', 'vision', 'tools'],
        category: 'general',
        featured: true,
        architecture: {
          tokenizer: 'cl100k_base',
          instructType: 'chat',
          inputModalities: ['text', 'image'],
          outputModalities: ['text']
        },
        provider: {
          contextLength: 128000,
          maxCompletionTokens: 16384,
          isModerated: true
        },
        supportedParameters: ['tools', 'tool_choice', 'temperature', 'max_tokens', 'top_p'],
        created: 1721169600,
        perRequestLimits: null
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model, combining top-tier performance with improved speed',
        contextLength: 200000,
        maxCompletionTokens: 8192,
        pricing: { prompt: 3, completion: 15, image: 4.8, webSearch: 0, request: 0 },
        capabilities: ['text', 'vision', 'tools', 'reasoning'],
        category: 'reasoning',
        featured: true,
        architecture: {
          tokenizer: 'claude',
          instructType: 'claude',
          inputModalities: ['text', 'image'],
          outputModalities: ['text']
        },
        provider: {
          contextLength: 200000,
          maxCompletionTokens: 8192,
          isModerated: true
        },
        supportedParameters: ['tools', 'temperature', 'max_tokens', 'top_p'],
        created: 1719925200,
        perRequestLimits: null
      }
    ] as AIModel[]
  }),
  
  getters: {
    currentChat(): ChatSession | null {
      return this.chatSessions.find(chat => chat.id === this.currentChatId) || null
    },
    
    totalTokensUsed(): number {
      return this.chatSessions.reduce((total, session) => total + session.tokenCount, 0)
    },
    
    totalChats(): number {
      return this.chatSessions.length
    },
    
    archivedChats(): ChatSession[] {
      return this.chatSessions.filter(chat => chat.archived)
    },
    
    activeChats(): ChatSession[] {
      return this.chatSessions.filter(chat => !chat.archived)
    },
    
    sharedChats(): ChatSession[] {
      return this.chatSessions.filter(chat => chat.shared)
    },
    
    currentModel(): AIModel | null {
      if (!this.currentChat) return null
      return this.availableModels.find(model => model.id === this.currentChat!.model) || null
    },
    
    // Model getters
    featuredModels(): AIModel[] {
      return this.availableModels.filter(model => model.featured)
    },
    
    modelsByCategory(): Record<string, AIModel[]> {
      return this.availableModels.reduce((acc, model) => {
        if (!acc[model.category]) acc[model.category] = []
        acc[model.category].push(model)
        return acc
      }, {} as Record<string, AIModel[]>)
    },
    
    getModelById: (state) => (id: string): AIModel | null => {
      return state.availableModels.find(model => model.id === id) || null
    },
    
    // Connection getters
    isConnected(): boolean {
      return this.connectionStatus === 'connected'
    },
    
    isSyncing(): boolean {
      return this.connectionStatus === 'syncing'
    },
    
    modelsNeedRefresh(): boolean {
      if (!this.modelsLastFetched) return true
      const hoursSinceLastFetch = (Date.now() - this.modelsLastFetched.getTime()) / (1000 * 60 * 60)
      return hoursSinceLastFetch > 24 // Refresh daily
    }
  },
  
  actions: {
    // User actions
    setUser(user: User | null) {
      this.user = user
    },
    
    // Connection actions
    setConnectionStatus(status: ConnectionStatus) {
      this.connectionStatus = status
    },
    
    // Models actions
    async fetchModels(forceRefresh = false) {
      if (this.modelsLoading) return
      
      this.modelsLoading = true
      this.modelsError = null
      
      try {
        const response = await $fetch<AIModel[]>('/api/models', {
          query: { refresh: forceRefresh.toString() }
        })
        console.log('Fetched models:', response)
        
        if (response.length > 0 && Array.isArray(response)) {
          this.availableModels = response
          this.modelsLastFetched = new Date()
          
          // Update default model if current one doesn't exist
          if (!this.availableModels.find(m => m.id === this.chatSettings.defaultModel)) {
            const firstFeatured = this.availableModels.find(m => m.featured)
            if (firstFeatured) {
              this.chatSettings.defaultModel = firstFeatured.id
            }
          }
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error: any) {
        console.error('Failed to fetch models:', error)
        this.modelsError = error.data?.message || 'Failed to fetch models'
        
        // Use fallback models
        if (this.availableModels.length === 0) {
          this.availableModels = [...this.fallbackModels]
          console.warn('Using fallback models due to API error')
        }
      } finally {
        this.modelsLoading = false
      }
    },
    
    async refreshModels() {
      await this.fetchModels(true)
    },
    
    // Initialize models on app start
    async initializeModels() {
      if (this.availableModels.length === 0 || this.modelsNeedRefresh) {
        await this.fetchModels()
      }
    },
    
    // Chat actions
    setCurrentChat(chatId: string | null) {
      this.currentChatId = chatId
    },
    
    addChatSession(session: ChatSession) {
      const existingIndex = this.chatSessions.findIndex(s => s.id === session.id)
      if (existingIndex !== -1) {
        this.chatSessions[existingIndex] = session
      } else {
        this.chatSessions.unshift(session)
      }
    },
    
    updateChatSession(sessionId: string, updates: Partial<ChatSession>) {
      const sessionIndex = this.chatSessions.findIndex(s => s.id === sessionId)
      if (sessionIndex !== -1) {
        this.chatSessions[sessionIndex] = { ...this.chatSessions[sessionIndex], ...updates }
      }
    },
    
    removeChatSession(sessionId: string) {
      this.chatSessions = this.chatSessions.filter(s => s.id !== sessionId)
      if (this.currentChatId === sessionId) {
        this.currentChatId = this.chatSessions[0]?.id || null
      }
    },
    
    addMessageToSession(sessionId: string, message: Message) {
      const session = this.chatSessions.find(s => s.id === sessionId)
      if (session) {
        const existingIndex = session.messages.findIndex(m => m.id === message.id)
        if (existingIndex !== -1) {
          session.messages[existingIndex] = message
        } else {
          session.messages.push(message)
        }
        session.updatedAt = new Date()
      }
    },
    
    updateMessageInSession(sessionId: string, messageId: string, updates: Partial<Message>) {
      const session = this.chatSessions.find(s => s.id === sessionId)
      if (session) {
        const messageIndex = session.messages.findIndex(m => m.id === messageId)
        if (messageIndex !== -1) {
          session.messages[messageIndex] = { ...session.messages[messageIndex], ...updates }
        }
      }
    },
    
    removeMessageFromSession(sessionId: string, messageId: string) {
      const session = this.chatSessions.find(s => s.id === sessionId)
      if (session) {
        session.messages = session.messages.filter(m => m.id !== messageId)
        session.updatedAt = new Date()
      }
    },
    
    // UI actions
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    
    setSidebarOpen(open: boolean) {
      this.sidebarOpen = open
    },
    
    setLoading(loading: boolean, message = '') {
      this.isLoading = loading
      this.loadingMessage = message
    },
    
    // Settings actions
    updateChatSettings(settings: Partial<ChatSettings>) {
      this.chatSettings = { ...this.chatSettings, ...settings }
    },
    
    resetChatSettings() {
      const defaultModel = this.availableModels.find(m => m.featured)?.id || 'openai/gpt-4o-mini'
      this.chatSettings = {
        theme: 'cyber',
        defaultModel,
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: '',
        enableWebSearch: false,
        enableCodeExecution: false,
        enableReasoning: false,
        enableAnalytics: true,
        language: 'en',
        autoSave: true,
        notifications: false,
        storeChatHistory: true,
        syncEnabled: true,
        shareUsageData: false,
        openRouterKey: '',
        rateLimitRequests: 20,
        rateLimitTokens: 50000
      }
    },
    
    // Search and filter actions
    searchSessions(query: string): ChatSession[] {
      if (!query) return this.activeChats
      
      const lowercaseQuery = query.toLowerCase()
      return this.chatSessions.filter(session => 
        session.title.toLowerCase().includes(lowercaseQuery) ||
        session.messages.some(message => 
          message.content.toLowerCase().includes(lowercaseQuery)
        )
      )
    },
    
    searchModels(query: string): AIModel[] {
      if (!query) return this.availableModels
      
      const lowercaseQuery = query.toLowerCase()
      return this.availableModels.filter(model =>
        model.name.toLowerCase().includes(lowercaseQuery) ||
        model.description.toLowerCase().includes(lowercaseQuery) ||
        model.capabilities.some(cap => cap.toLowerCase().includes(lowercaseQuery))
      )
    },
    
    // Bulk actions
    archiveAllChats() {
      this.chatSessions.forEach(session => {
        session.archived = true
      })
    },
    
    unarchiveAllChats() {
      this.chatSessions.forEach(session => {
        session.archived = false
      })
    },
    
    clearAllChats() {
      this.chatSessions = []
      this.currentChatId = null
    },
    
    // Export/Import actions
    exportData() {
      return {
        user: this.user,
        chatSessions: this.chatSessions,
        chatSettings: this.chatSettings,
        availableModels: this.availableModels,
        modelsLastFetched: this.modelsLastFetched,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      }
    },
    
    importData(data: any) {
      if (data.version && data.chatSessions) {
        this.chatSessions = data.chatSessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((message: any) => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }))
        }))
      }
      
      if (data.chatSettings) {
        this.chatSettings = { ...this.chatSettings, ...data.chatSettings }
      }
      
      if (data.availableModels && Array.isArray(data.availableModels)) {
        this.availableModels = data.availableModels
      }
      
      if (data.modelsLastFetched) {
        this.modelsLastFetched = new Date(data.modelsLastFetched)
      }
    },
    
    // Statistics
    getUsageStats() {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const recentSessions = this.chatSessions.filter(
        session => session.createdAt > thirtyDaysAgo
      )
      
      const messageCount = this.chatSessions.reduce(
        (total, session) => total + session.messages.length, 0
      )
      
      const modelUsage = this.chatSessions.reduce((acc, session) => {
        const model = this.availableModels.find(m => m.id === session.model)
        const modelName = model?.name || session.model
        acc[modelName] = (acc[modelName] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return {
        totalChats: this.chatSessions.length,
        totalMessages: messageCount,
        totalTokens: this.totalTokensUsed,
        recentChats: recentSessions.length,
        archivedChats: this.archivedChats.length,
        sharedChats: this.sharedChats.length,
        modelUsage,
        averageMessagesPerChat: this.chatSessions.length > 0 
          ? Math.round(messageCount / this.chatSessions.length) 
          : 0,
        modelsAvailable: this.availableModels.length,
        featuredModels: this.featuredModels.length
      }
    }
  },
  
  // Persist state
  persist: {
    key: 'cyberchat-main-store',
    storage: persistedState,
    pick: ['chatSettings', 'sidebarOpen', 'modelsLastFetched']
  }
})
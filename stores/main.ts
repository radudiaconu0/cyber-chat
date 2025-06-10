import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  streaming?: boolean
  error?: boolean
  attachments?: Attachment[]
  metadata?: MessageMetadata
}

export interface Attachment {
  id: string
  type: 'image' | 'document' | 'code'
  name: string
  size: number
  url?: string
  content?: string
}

export interface MessageMetadata {
  tokenCount?: number
  reasoningTokens?: number
  webSearchResults?: WebSearchResult[]
  generatedImages?: string[]
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: string
  tokenCount: number
  archived?: boolean
  shared?: boolean
  shareId?: string
}

export interface Model {
  id: string
  name: string
  provider: string
  contextLength: number
  inputPrice: number
  outputPrice: number
  reasoning: boolean
  vision?: boolean
  webSearch?: boolean
  description: string
  capabilities: string[]
}

export interface ChatSettings {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  enableWebSearch: boolean
  enableReasoning: boolean
  enableAnalytics: boolean
  theme: string
}

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  timestamp?: Date
}

export const useMainStore = defineStore('main', {
  state: () => ({
    // Authentication
    user: null as any,
    isAuthenticated: false,
    
    // Chat state
    chatSessions: [] as ChatSession[],
    currentChatId: null as string | null,
    isLoading: false,
    loadingMessage: '',
    streamingMessageId: null as string | null,
    
    // Web search state
    isSearching: false,
    currentSearchQuery: '',
    
    // Models
    availableModels: [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        contextLength: 200000,
        inputPrice: 3,
        outputPrice: 15,
        reasoning: false,
        vision: true,
        webSearch: false,
        description: 'Most intelligent model, great for analysis and coding',
        capabilities: ['text', 'vision', 'code', 'analysis']
      },
      {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        contextLength: 128000,
        inputPrice: 10,
        outputPrice: 30,
        reasoning: false,
        vision: true,
        webSearch: true,
        description: 'Powerful model with vision capabilities',
        capabilities: ['text', 'vision', 'code', 'analysis']
      },
      {
        id: 'perplexity/sonar-medium-online',
        name: 'Perplexity Sonar Medium',
        provider: 'Perplexity',
        contextLength: 16000,
        inputPrice: 0.6,
        outputPrice: 1.8,
        reasoning: false,
        vision: false,
        webSearch: true,
        description: 'Built-in web search for current information',
        capabilities: ['text', 'web', 'research', 'current-events']
      },
      {
        id: 'perplexity/sonar-small-online',
        name: 'Perplexity Sonar Small',
        provider: 'Perplexity',
        contextLength: 16000,
        inputPrice: 0.2,
        outputPrice: 0.6,
        reasoning: false,
        vision: false,
        webSearch: true,
        description: 'Fast model with real-time web search',
        capabilities: ['text', 'web', 'research']
      },
      {
        id: 'openai/o1-preview',
        name: 'O1 Preview',
        provider: 'OpenAI',
        contextLength: 128000,
        inputPrice: 15,
        outputPrice: 60,
        reasoning: true,
        description: 'Advanced reasoning model for complex problems',
        capabilities: ['reasoning', 'math', 'code', 'analysis']
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5',
        provider: 'Google',
        contextLength: 1000000,
        inputPrice: 7,
        outputPrice: 21,
        reasoning: false,
        description: 'Large context window model',
        capabilities: ['text', 'images', 'video', 'audio']
      },
      {
        id: 'meta-llama/llama-3.1-405b-instruct',
        name: 'Llama 3.1 405B',
        provider: 'Meta',
        contextLength: 32000,
        inputPrice: 5,
        outputPrice: 15,
        reasoning: false,
        description: 'Open source large language model',
        capabilities: ['text', 'code', 'multilingual']
      }
    ] as Model[],
    selectedModel: 'anthropic/claude-3.5-sonnet',

    // Settings
    chatSettings: {
      temperature: 0.7,
      maxTokens: 4000,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      enableWebSearch: false,
      enableReasoning: false,
      enableAnalytics: true,
      theme: 'cyberpunk'
    } as ChatSettings,

    // UI State
    sidebarOpen: true,
    themeMode: 'dark',
    themes: [
      { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#39ff14', '#00d4ff', '#bf00ff'] },
      { id: 'neon', name: 'Neon', colors: ['#ff073a', '#39ff14', '#00d4ff'] },
      { id: 'matrix', name: 'Matrix', colors: ['#39ff14', '#003300', '#001100'] },
      { id: 'synthwave', name: 'Synthwave', colors: ['#ff00ff', '#00ffff', '#ffff00'] },
      { id: 'terminal', name: 'Terminal', colors: ['#00ff00', '#ffffff', '#000000'] }
    ],

    // Search
    webSearchResults: [] as WebSearchResult[],
    searchQuery: '',

    // Error handling
    error: null as string | null,
    connectionStatus: 'connected' as 'connected' | 'disconnected' | 'syncing'
  }),

  getters: {
    currentSession: (state) => {
      return state.chatSessions.find(session => session.id === state.currentChatId)
    },

    currentModel: (state) => {
      return state.availableModels.find(model => model.id === state.selectedModel)
    },

    isReasoningModel: (state) => {
      const model = state.availableModels.find(m => m.id === state.selectedModel)
      return model?.reasoning || false
    },

    totalTokensUsed(): number {
      return this.chatSessions.reduce((total, session) => total + (session.tokenCount || 0), 0)
    },

    currentTheme: (state) => {
      return state.themes.find(theme => theme.id === state.chatSettings.theme) || state.themes[0]
    },

    recentSessions: (state) => {
      return state.chatSessions.slice(0, 10)
    }
  },

  actions: {
    // Authentication
    async setUser(user: any) {
      this.user = user
      this.isAuthenticated = !!user
    },

    // Chat management
    createNewChat(title?: string) {
      const newChat: ChatSession = {
        id: uuidv4(),
        title: title || 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model: this.selectedModel,
        tokenCount: 0
      }
      
      this.chatSessions.unshift(newChat)
      this.currentChatId = newChat.id
      
      return newChat
    },

    selectChat(chatId: string) {
      this.currentChatId = chatId
    },

    deleteChat(chatId: string) {
      this.chatSessions = this.chatSessions.filter(chat => chat.id !== chatId)
      if (this.currentChatId === chatId) {
        this.currentChatId = this.chatSessions[0]?.id || null
      }
    },

    updateChatTitle(chatId: string, title: string) {
      const chat = this.chatSessions.find(c => c.id === chatId)
      if (chat) {
        chat.title = title
        chat.updatedAt = new Date()
      }
    },

    // Message management
    addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
      const chat = this.currentSession
      if (!chat) return

      const newMessage: Message = {
        ...message,
        id: uuidv4(),
        timestamp: new Date()
      }

      chat.messages.push(newMessage)
      chat.updatedAt = new Date()

      return newMessage
    },

    updateMessage(messageId: string, updates: Partial<Message>) {
      const chat = this.currentSession
      if (!chat) return

      const message = chat.messages.find(m => m.id === messageId)
      if (message) {
        Object.assign(message, updates)
        chat.updatedAt = new Date()
      }
    },

    // Settings management
    updateSettings(settings: Partial<ChatSettings>) {
      this.chatSettings = { ...this.chatSettings, ...settings }
    },

    setModel(modelId: string) {
      this.selectedModel = modelId
      const chat = this.currentSession
      if (chat) {
        chat.model = modelId
      }
    },

    // UI management
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },

    setLoading(loading: boolean, message?: string) {
      this.isLoading = loading
      this.loadingMessage = message || ''
    },

    setError(error: string | null) {
      this.error = error
    },

    setConnectionStatus(status: 'connected' | 'disconnected' | 'syncing') {
      this.connectionStatus = status
    },

    // Initialize
    async initialize() {
      // This will be expanded to load from Dexie/Supabase
      this.setLoading(true, 'Initializing CyberChat...')
      
      try {
        // Load user data
        // Load chat sessions
        // Initialize real-time subscriptions
        
        setTimeout(() => {
          this.setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Failed to initialize:', error)
        this.setError('Failed to initialize app')
        this.setLoading(false)
      }
    }
  },

  persist: true
})
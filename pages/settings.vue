<!-- pages/settings.vue -->
<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <NuxtLink to="/" class="text-gray-400 hover:text-white transition-colors">
          <ArrowLeftIcon class="w-6 h-6" />
        </NuxtLink>
        <h1 class="text-3xl font-bold text-white font-display">Settings</h1>
      </div>
      <p class="text-gray-400 mt-2">Customize your CyberChat experience</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Settings Navigation -->
      <nav class="lg:w-64 flex-shrink-0">
        <div class="bg-dark-200 border border-dark-300 rounded-lg p-4">
          <ul class="space-y-2">
            <li v-for="tab in settingsTabs" :key="tab.id">
              <button
                @click="activeTab = tab.id"
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3',
                  activeTab === tab.id
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'text-gray-300 hover:bg-dark-300 hover:text-white'
                ]"
              >
                <component :is="tab.icon" class="w-5 h-5" />
                <span>{{ tab.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Settings Content -->
      <div class="flex-1">
        <div class="bg-dark-200 border border-dark-300 rounded-lg p-6">
          
          <!-- General Settings -->
          <div v-if="activeTab === 'general'" class="space-y-6">
            <h2 class="text-xl font-bold text-white mb-6">General Settings</h2>
            
            <!-- Theme Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-4">Theme</label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  v-for="theme in availableThemes"
                  :key="theme.id"
                  @click="updateTheme(theme.id)"
                  :class="[
                    'p-4 rounded-lg border-2 transition-all duration-200 text-left',
                    settings.theme === theme.id
                      ? 'border-neon-green bg-neon-green/10'
                      : 'border-dark-400 hover:border-dark-300'
                  ]"
                >
                  <div class="flex items-center space-x-3 mb-2">
                    <div 
                      class="w-6 h-6 rounded-full"
                      :style="{ backgroundColor: theme.primary }"
                    ></div>
                    <span class="text-white font-medium">{{ theme.name }}</span>
                  </div>
                  <p class="text-gray-400 text-sm">{{ theme.description }}</p>
                </button>
              </div>
            </div>

            <!-- Language -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">Language</label>
              <select
                v-model="settings.language"
                @change="updateSetting('language', $event.target.value)"
                class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>

            <!-- Auto-save -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Auto-save Conversations</h3>
                <p class="text-gray-400 text-sm mt-1">Automatically save your chat history</p>
              </div>
              <ToggleSwitch 
                :value="settings.autoSave" 
                @update="updateSetting('autoSave', $event)" 
              />
            </div>

            <!-- Notifications -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Desktop Notifications</h3>
                <p class="text-gray-400 text-sm mt-1">Get notified of new messages</p>
              </div>
              <ToggleSwitch 
                :value="settings.notifications" 
                @update="updateSetting('notifications', $event)" 
              />
            </div>

            <!-- Analytics -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Usage Analytics</h3>
                <p class="text-gray-400 text-sm mt-1">Help improve CyberChat with anonymous usage data</p>
              </div>
              <ToggleSwitch 
                :value="settings.enableAnalytics" 
                @update="updateSetting('enableAnalytics', $event)" 
              />
            </div>
          </div>

          <!-- AI Settings -->
          <div v-if="activeTab === 'ai'" class="space-y-6">
            <h2 class="text-xl font-bold text-white mb-6">AI Configuration</h2>

            <!-- Default Model -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">Default Model</label>
              <select
                v-model="settings.defaultModel"
                @change="updateSetting('defaultModel', $event.target.value)"
                class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
              >
                <option v-for="model in mainStore.availableModels" :key="model.id" :value="model.id">
                  {{ model.name }} - {{ model.description }}
                </option>
              </select>
            </div>

            <!-- Temperature -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">
                Temperature ({{ settings.temperature }})
              </label>
              <input
                v-model.number="settings.temperature"
                @input="updateSetting('temperature', $event.target.value)"
                type="range"
                min="0"
                max="2"
                step="0.1"
                class="w-full accent-neon-green"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>More Focused</span>
                <span>More Creative</span>
              </div>
            </div>

            <!-- Max Tokens -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">Max Response Length</label>
              <input
                v-model.number="settings.maxTokens"
                @input="updateSetting('maxTokens', $event.target.value)"
                type="number"
                min="100"
                max="8000"
                step="100"
                class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
              />
              <p class="text-gray-400 text-sm mt-1">Higher values allow longer responses but cost more</p>
            </div>

            <!-- System Prompt -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">System Prompt</label>
              <textarea
                v-model="settings.systemPrompt"
                @input="updateSetting('systemPrompt', $event.target.value)"
                rows="4"
                placeholder="You are a helpful AI assistant..."
                class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              />
              <p class="text-gray-400 text-sm mt-1">Custom instructions for the AI</p>
            </div>

            <!-- Enable Features -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-white font-medium">Web Search</h3>
                  <p class="text-gray-400 text-sm mt-1">Allow AI to search the web for current information</p>
                </div>
                <ToggleSwitch 
                  :value="settings.enableWebSearch" 
                  @update="updateSetting('enableWebSearch', $event)" 
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-white font-medium">Code Execution</h3>
                  <p class="text-gray-400 text-sm mt-1">Enable AI to run code snippets</p>
                </div>
                <ToggleSwitch 
                  :value="settings.enableCodeExecution" 
                  @update="updateSetting('enableCodeExecution', $event)" 
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-white font-medium">Step-by-step Reasoning</h3>
                  <p class="text-gray-400 text-sm mt-1">Show AI's thinking process</p>
                </div>
                <ToggleSwitch 
                  :value="settings.enableReasoning" 
                  @update="updateSetting('enableReasoning', $event)" 
                />
              </div>
            </div>
          </div>

          <!-- API Settings -->
          <div v-if="activeTab === 'api'" class="space-y-6">
            <h2 class="text-xl font-bold text-white mb-6">API Configuration</h2>

            <!-- OpenRouter API Key -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">OpenRouter API Key</label>
              <div class="relative">
                <input
                  :type="showApiKey ? 'text' : 'password'"
                  v-model="settings.openRouterKey"
                  @input="updateSetting('openRouterKey', $event.target.value)"
                  placeholder="sk-or-..."
                  class="w-full px-4 py-2 pr-10 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
                />
                <button
                  @click="showApiKey = !showApiKey"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <component :is="showApiKey ? EyeSlashIcon : EyeIcon" class="w-5 h-5" />
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Get your API key from <a href="https://openrouter.ai" target="_blank" class="text-neon-green hover:underline">openrouter.ai</a>
              </p>
            </div>

            <!-- Test Connection -->
            <div class="flex items-center space-x-4">
              <button
                @click="testApiConnection"
                :disabled="testingConnection || !settings.openRouterKey"
                class="cyber-button text-sm disabled:opacity-50"
              >
                {{ testingConnection ? 'Testing...' : 'Test Connection' }}
              </button>
              
              <div v-if="connectionStatus" class="flex items-center space-x-2">
                <component 
                  :is="connectionStatus.success ? CheckCircleIcon : XCircleIcon" 
                  :class="[
                    'w-5 h-5',
                    connectionStatus.success ? 'text-green-500' : 'text-red-500'
                  ]" 
                />
                <span 
                  :class="[
                    'text-sm',
                    connectionStatus.success ? 'text-green-400' : 'text-red-400'
                  ]"
                >
                  {{ connectionStatus.message }}
                </span>
              </div>
            </div>

            <!-- Rate Limiting -->
            <div>
              <h3 class="text-white font-medium mb-3">Rate Limiting</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-300 mb-2">Requests per minute</label>
                  <input
                    v-model.number="settings.rateLimitRequests"
                    @input="updateSetting('rateLimitRequests', $event.target.value)"
                    type="number"
                    min="1"
                    max="100"
                    class="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-300 mb-2">Tokens per minute</label>
                  <input
                    v-model.number="settings.rateLimitTokens"
                    @input="updateSetting('rateLimitTokens', $event.target.value)"
                    type="number"
                    min="1000"
                    max="100000"
                    step="1000"
                    class="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Privacy Settings -->
          <div v-if="activeTab === 'privacy'" class="space-y-6">
            <h2 class="text-xl font-bold text-white mb-6">Privacy & Data</h2>
            
            <!-- Data Collection -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-white font-medium">Store Chat History</h3>
                  <p class="text-gray-400 text-sm mt-1">Store chat history locally and in cloud</p>
                </div>
                <ToggleSwitch 
                  :value="settings.storeChatHistory" 
                  @update="updateSetting('storeChatHistory', $event)" 
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-white font-medium">Sync Across Devices</h3>
                  <p class="text-gray-400 text-sm mt-1">Sync your chats between devices</p>
                </div>
                <ToggleSwitch 
                  :value="settings.syncEnabled" 
                  @update="updateSetting('syncEnabled', $event)" 
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-white font-medium">Share Usage Data</h3>
                  <p class="text-gray-400 text-sm mt-1">Help improve the service with anonymous usage data</p>
                </div>
                <ToggleSwitch 
                  :value="settings.shareUsageData" 
                  @update="updateSetting('shareUsageData', $event)" 
                />
              </div>
            </div>

            <!-- Data Management -->
            <div class="pt-6 border-t border-dark-300/50">
              <h3 class="text-lg font-semibold text-white mb-4">Data Management</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  @click="exportAllData"
                  class="p-4 bg-dark-300 rounded-lg hover:bg-dark-400 transition-colors border border-dark-400/50 hover:border-neon-green/50"
                >
                  <DocumentArrowDownIcon class="w-8 h-8 text-neon-green mx-auto mb-2" />
                  <h3 class="text-white font-medium">Export Data</h3>
                  <p class="text-gray-400 text-sm mt-1">Download all your chat data</p>
                </button>
                
                <button 
                  @click="clearAllData"
                  class="p-4 bg-red-900/20 border border-red-500/30 rounded-lg hover:bg-red-900/30 transition-colors"
                >
                  <TrashIcon class="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <h3 class="text-red-400 font-medium">Clear All Data</h3>
                  <p class="text-gray-400 text-sm mt-1">Delete all conversations</p>
                </button>
              </div>
            </div>
          </div>

          <!-- About -->
          <div v-if="activeTab === 'about'" class="space-y-6">
            <h2 class="text-xl font-bold text-white mb-6">About CyberChat</h2>
            
            <div class="text-center">
              <div class="w-24 h-24 bg-gradient-to-br from-neon-green to-neon-blue rounded-full mx-auto mb-4 flex items-center justify-center">
                <span class="text-2xl font-bold text-black">CC</span>
              </div>
              
              <h3 class="text-2xl font-bold text-white mb-2">CyberChat v2.0.0</h3>
              
              <div class="space-y-2 text-sm text-gray-400 mb-8">
                <p>A next-generation AI chat application</p>
                <p>Built with Nuxt.js, Supabase, and OpenRouter</p>
                <p>© 2024 CyberChat. All rights reserved.</p>
              </div>
              
              <div class="flex items-center justify-center space-x-4">
                <a href="https://github.com" target="_blank" class="text-gray-400 hover:text-white transition-colors">
                  <CodeBracketIcon class="w-6 h-6" />
                </a>
                <a href="https://twitter.com" target="_blank" class="text-gray-400 hover:text-white transition-colors">
                  <ChatBubbleLeftIcon class="w-6 h-6" />
                </a>
                <a href="mailto:support@cyberchat.app" class="text-gray-400 hover:text-white transition-colors">
                  <EnvelopeIcon class="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Save Notification -->
    <Transition name="slide-up">
      <div 
        v-if="saveNotification"
        class="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        Settings saved successfully!
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  CogIcon,
  UserIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  CodeBracketIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  CpuChipIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'default'
})

const mainStore = useMainStore()
const supabase = await useSupabaseClient()
const toast = inject('toast')

const activeTab = ref('general')
const showApiKey = ref(false)
const testingConnection = ref(false)
const connectionStatus = ref<any>(null)
const saveNotification = ref(false)

// Local settings state
const settings = ref({
  // General
  theme: 'cyber',
  language: 'en',
  autoSave: true,
  notifications: false,
  enableAnalytics: true,
  
  // AI
  defaultModel: 'openai/gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 4000,
  systemPrompt: '',
  enableWebSearch: false,
  enableCodeExecution: false,
  enableReasoning: false,
  
  // API
  openRouterKey: '',
  rateLimitRequests: 20,
  rateLimitTokens: 50000,
  
  // Privacy
  storeChatHistory: true,
  syncEnabled: true,
  shareUsageData: false
})

const settingsTabs = [
  { id: 'general', label: 'General', icon: CogIcon },
  { id: 'ai', label: 'AI Models', icon: CpuChipIcon },
  { id: 'api', label: 'API Keys', icon: CodeBracketIcon },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheckIcon },
  { id: 'about', label: 'About', icon: InformationCircleIcon }
]

const availableThemes = [
  {
    id: 'cyber',
    name: 'Cyber',
    description: 'Classic cyberpunk aesthetic',
    primary: '#39ff14'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Clean dark interface',
    primary: '#6b7280'
  },
  {
    id: 'blue',
    name: 'Ocean',
    description: 'Blue ocean vibes',
    primary: '#00d4ff'
  },
  {
    id: 'purple',
    name: 'Synthwave',
    description: 'Retro synthwave colors',
    primary: '#bf00ff'
  }
]

// Load settings on mount
onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    // Load from store first
    Object.assign(settings.value, mainStore.chatSettings)
    
    // Load user profile settings from Supabase
    if (mainStore.user) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('id', mainStore.user.id)
        .single()
      
      if (!error && data?.settings) {
        Object.assign(settings.value, data.settings)
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

const updateSetting = async (key: string, value: any) => {
  // Update local state
  settings.value[key] = value
  
  // Update store
  mainStore.updateChatSettings({ [key]: value })
  
  // Save to Supabase
  await saveSettings()
  
  // Show save notification
  showSaveNotification()
}

const updateTheme = async (themeId: string) => {
  await updateSetting('theme', themeId)
  
  // Apply theme immediately
  document.documentElement.className = `theme-${themeId}`
}

const saveSettings = async () => {
  if (!mainStore.user) return
  
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        settings: settings.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', mainStore.user.id)
    
    if (error) {
      console.error('Failed to save settings:', error)
      toast('error', 'Error', 'Failed to save settings')
    }
  } catch (error) {
    console.error('Failed to save settings:', error)
    toast('error', 'Error', 'Failed to save settings')
  }
}

const testApiConnection = async () => {
  if (!settings.value.openRouterKey) {
    connectionStatus.value = {
      success: false,
      message: 'API key is required'
    }
    return
  }
  
  testingConnection.value = true
  connectionStatus.value = null
  
  try {
    const response = await $fetch('/api/test-connection', {
      method: 'POST',
      body: {
        apiKey: settings.value.openRouterKey
      }
    })
    
    connectionStatus.value = {
      success: true,
      message: 'Connection successful!'
    }
  } catch (error: any) {
    connectionStatus.value = {
      success: false,
      message: error.data?.message || 'Connection failed'
    }
  } finally {
    testingConnection.value = false
  }
}

const exportAllData = async () => {
  try {
    const data = {
      settings: settings.value,
      chats: mainStore.chatSessions,
      exportDate: new Date().toISOString(),
      version: '2.0.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cyberchat-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast('success', 'Success', 'Data exported successfully')
  } catch (error) {
    console.error('Failed to export data:', error)
    toast('error', 'Error', 'Failed to export data')
  }
}

const clearAllData = async () => {
  const confirmed = confirm(
    'Are you sure you want to delete all your chat data? This action cannot be undone.'
  )
  
  if (!confirmed) return
  
  try {
    // Clear from Supabase
    if (mainStore.user) {
      await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', mainStore.user.id)
    }
    
    // Clear from store
    mainStore.chatSessions = []
    mainStore.currentChatId = null
    
    toast('success', 'Success', 'All data cleared')
  } catch (error) {
    console.error('Failed to clear data:', error)
    toast('error', 'Error', 'Failed to clear data')
  }
}

const showSaveNotification = () => {
  saveNotification.value = true
  setTimeout(() => {
    saveNotification.value = false
  }, 2000)
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
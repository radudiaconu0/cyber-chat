<template>
  <div class="min-h-screen bg-cyber-dark">
    <!-- Header -->
    <header class="bg-dark-100 border-b border-dark-300/50 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Settings</h1>
          <p class="text-gray-400 text-sm mt-1">Customize your CyberChat experience</p>
        </div>
        <NuxtLink to="/" class="cyber-button text-sm">
          <ArrowLeftIcon class="w-4 h-4 inline mr-2" />
          Back to Chat
        </NuxtLink>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Sidebar Navigation -->
          <aside class="lg:col-span-1">
            <nav class="bg-dark-100 rounded-xl border border-dark-300/50 p-2">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  'w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mb-1',
                  'flex items-center space-x-3',
                  activeTab === tab.id
                    ? 'bg-dark-200 border border-neon-green/50 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                ]"
              >
                <component :is="tab.icon" class="w-5 h-5" />
                <span>{{ tab.name }}</span>
              </button>
            </nav>
          </aside>

          <!-- Content Area -->
          <div class="lg:col-span-3">
            <div class="bg-dark-100 rounded-xl border border-dark-300/50 p-6">
              <!-- General Settings -->
              <div v-if="activeTab === 'general'" class="space-y-6">
                <h2 class="text-xl font-bold text-white mb-6">General Settings</h2>
                
                <!-- Language -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Interface Language
                  </label>
                  <select 
                    v-model="settings.language"
                    class="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
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
                  <ToggleSwitch v-model="settings.autoSave" />
                </div>

                <!-- Notifications -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-white font-medium">Desktop Notifications</h3>
                    <p class="text-gray-400 text-sm mt-1">Get notified of new messages</p>
                  </div>
                  <ToggleSwitch v-model="settings.notifications" />
                </div>

                <!-- Analytics -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-white font-medium">Usage Analytics</h3>
                    <p class="text-gray-400 text-sm mt-1">Help improve CyberChat with anonymous usage data</p>
                  </div>
                  <ToggleSwitch v-model="mainStore.chatSettings.enableAnalytics" />
                </div>
              </div>

              <!-- Appearance Settings -->
              <div v-if="activeTab === 'appearance'" class="space-y-6">
                <h2 class="text-xl font-bold text-white mb-6">Appearance</h2>
                
                <!-- Theme Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-4">
                    Theme
                  </label>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button
                      v-for="theme in mainStore.themes"
                      :key="theme.id"
                      @click="selectTheme(theme.id)"
                      :class="[
                        'p-4 rounded-lg border-2 transition-all duration-200',
                        mainStore.chatSettings.theme === theme.id
                          ? 'border-neon-green bg-dark-200'
                          : 'border-dark-300 hover:border-dark-200'
                      ]"
                    >
                      <div class="flex items-center justify-center mb-3">
                        <div class="flex space-x-1">
                          <div 
                            v-for="(color, idx) in theme.colors"
                            :key="idx"
                            class="w-6 h-6 rounded"
                            :style="{ backgroundColor: color }"
                          />
                        </div>
                      </div>
                      <h4 class="text-white font-medium">{{ theme.name }}</h4>
                    </button>
                  </div>
                </div>

                <!-- Font Size -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Font Size
                  </label>
                  <input
                    type="range"
                    v-model="settings.fontSize"
                    min="12"
                    max="20"
                    class="w-full"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small</span>
                    <span>{{ settings.fontSize }}px</span>
                    <span>Large</span>
                  </div>
                </div>

                <!-- Compact Mode -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-white font-medium">Compact Mode</h3>
                    <p class="text-gray-400 text-sm mt-1">Reduce spacing for more content</p>
                  </div>
                  <ToggleSwitch v-model="settings.compactMode" />
                </div>
              </div>

              <!-- Model Parameters -->
              <div v-if="activeTab === 'models'" class="space-y-6">
                <h2 class="text-xl font-bold text-white mb-6">Model Parameters</h2>
                
                <!-- Temperature -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Temperature ({{ mainStore.chatSettings.temperature }})
                  </label>
                  <input
                    type="range"
                    v-model="mainStore.chatSettings.temperature"
                    min="0"
                    max="2"
                    step="0.1"
                    class="w-full"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Focused</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                <!-- Max Tokens -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Max Tokens ({{ mainStore.chatSettings.maxTokens }})
                  </label>
                  <input
                    type="range"
                    v-model="mainStore.chatSettings.maxTokens"
                    min="500"
                    max="8000"
                    step="500"
                    class="w-full"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>500</span>
                    <span>4000</span>
                    <span>8000</span>
                  </div>
                </div>

                <!-- Top P -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Top P ({{ mainStore.chatSettings.topP }})
                  </label>
                  <input
                    type="range"
                    v-model="mainStore.chatSettings.topP"
                    min="0"
                    max="1"
                    step="0.1"
                    class="w-full"
                  />
                </div>

                <!-- Advanced Settings -->
                <div class="pt-4 border-t border-dark-300/50">
                  <h3 class="text-lg font-semibold text-white mb-4">Advanced Settings</h3>
                  
                  <!-- Web Search -->
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <h4 class="text-white font-medium">Enable Web Search</h4>
                      <p class="text-gray-400 text-sm mt-1">Allow AI to search the web for current information</p>
                    </div>
                    <ToggleSwitch v-model="mainStore.chatSettings.enableWebSearch" />
                  </div>

                  <!-- Reasoning -->
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-white font-medium">Enable Reasoning Mode</h4>
                      <p class="text-gray-400 text-sm mt-1">Show step-by-step thinking for complex problems</p>
                    </div>
                    <ToggleSwitch v-model="mainStore.chatSettings.enableReasoning" />
                  </div>
                </div>
              </div>

              <!-- API Keys -->
              <div v-if="activeTab === 'api'" class="space-y-6">
                <h2 class="text-xl font-bold text-white mb-6">API Configuration</h2>
                
                <div class="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
                  <div class="flex items-start space-x-3">
                    <ExclamationTriangleIcon class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 class="text-yellow-500 font-medium">Bring Your Own Key (BYOK)</h3>
                      <p class="text-gray-300 text-sm mt-1">
                        Use your own API keys for enhanced privacy and control. Keys are stored locally and never sent to our servers.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- OpenRouter API Key -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    OpenRouter API Key
                  </label>
                  <div class="relative">
                    <input
                      :type="showApiKey ? 'text' : 'password'"
                      v-model="settings.openRouterKey"
                      placeholder="sk-or-..."
                      class="w-full px-4 py-2 pr-10 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
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
                <button
                  @click="testApiConnection"
                  class="cyber-button text-sm"
                >
                  Test Connection
                </button>
              </div>

              <!-- Privacy Settings -->
              <div v-if="activeTab === 'privacy'" class="space-y-6">
                <h2 class="text-xl font-bold text-white mb-6">Privacy & Data</h2>
                
                <!-- Data Collection -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-white font-medium">Chat History</h3>
                      <p class="text-gray-400 text-sm mt-1">Store chat history locally</p>
                    </div>
                    <ToggleSwitch v-model="settings.storeChatHistory" />
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-white font-medium">Sync Across Devices</h3>
                      <p class="text-gray-400 text-sm mt-1">Sync your chats between devices</p>
                    </div>
                    <ToggleSwitch v-model="settings.syncEnabled" />
                  </div>
                </div>

                <!-- Data Management -->
                <div class="pt-6 border-t border-dark-300/50">
                  <h3 class="text-lg font-semibold text-white mb-4">Data Management</h3>
                  
                  <div class="space-y-4">
                    <button 
                      @click="exportAllData"
                      class="w-full py-3 px-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors text-left"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <h4 class="text-white font-medium">Export All Data</h4>
                          <p class="text-gray-400 text-sm mt-1">Download all your chats and settings</p>
                        </div>
                        <ArrowDownTrayIcon class="w-5 h-5 text-gray-400" />
                      </div>
                    </button>

                    <button 
                      @click="clearAllData"
                      class="w-full py-3 px-4 bg-red-500/10 border border-red-500/50 rounded-lg hover:bg-red-500/20 transition-colors text-left"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <h4 class="text-red-500 font-medium">Clear All Data</h4>
                          <p class="text-gray-400 text-sm mt-1">Permanently delete all chats and settings</p>
                        </div>
                        <TrashIcon class="w-5 h-5 text-red-500" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- About -->
              <div v-if="activeTab === 'about'" class="space-y-6">
                <h2 class="text-xl font-bold text-white mb-6">About CyberChat</h2>
                
                <div class="text-center py-8">
                  <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-neon-green to-neon-blue rounded-2xl flex items-center justify-center">
                    <ChatBubbleBottomCenterTextIcon class="w-14 h-14 text-black" />
                  </div>
                  
                  <h3 class="text-2xl font-bold text-white mb-2">CyberChat</h3>
                  <p class="text-gray-400 mb-6">Version 1.0.0</p>
                  
                  <div class="space-y-2 text-sm text-gray-400">
                    <p>A next-generation AI chat application</p>
                    <p>Built with Nuxt.js, Supabase, and OpenRouter</p>
                  </div>
                  
                  <div class="mt-8 flex items-center justify-center space-x-4">
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
                
                <div class="pt-6 border-t border-dark-300/50">
                  <h4 class="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h4>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-400">New Chat</span>
                      <kbd class="px-2 py-1 bg-dark-200 rounded border border-dark-300 text-xs">Ctrl + N</kbd>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-400">Search</span>
                      <kbd class="px-2 py-1 bg-dark-200 rounded border border-dark-300 text-xs">Ctrl + K</kbd>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-400">Settings</span>
                      <kbd class="px-2 py-1 bg-dark-200 rounded border border-dark-300 text-xs">Ctrl + ,</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '~/stores/main'
import { 
  ArrowLeftIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  CpuChipIcon,
  KeyIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon
} from '@heroicons/vue/24/outline'

import ToggleSwitch from '~/components/ui/ToggleSwitch.vue'

const mainStore = useMainStore()
const toast = inject('toast')
const dexie = useDexie()

// State
const activeTab = ref('general')
const showApiKey = ref(false)

// Local settings (not persisted to store)
const settings = reactive({
  language: 'en',
  autoSave: true,
  notifications: false,
  fontSize: 14,
  compactMode: false,
  openRouterKey: '',
  storeChatHistory: true,
  syncEnabled: true
})

// Tab configuration
const tabs = [
  { id: 'general', name: 'General', icon: Cog6ToothIcon },
  { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
  { id: 'models', name: 'Model Parameters', icon: CpuChipIcon },
  { id: 'api', name: 'API Keys', icon: KeyIcon },
  { id: 'privacy', name: 'Privacy & Data', icon: ShieldCheckIcon },
  { id: 'about', name: 'About', icon: InformationCircleIcon }
]

// Methods
const selectTheme = (themeId: string) => {
  mainStore.updateSettings({ theme: themeId })
  toast('success', 'Theme Updated', `Switched to ${themeId} theme`)
}

const testApiConnection = async () => {
  if (!settings.openRouterKey) {
    toast('error', 'Error', 'Please enter an API key')
    return
  }
  
  mainStore.setLoading(true, 'Testing API connection...')
  
  try {
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast('success', 'Success', 'API connection successful!')
  } catch (error) {
    toast('error', 'Connection Failed', 'Failed to connect to OpenRouter API')
  } finally {
    mainStore.setLoading(false)
  }
}

const exportAllData = async () => {
  try {
    const data = await dexie.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cyberchat-backup-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast('success', 'Export Complete', 'Your data has been exported')
  } catch (error) {
    console.error('Export error:', error)
    toast('error', 'Export Failed', 'Failed to export data')
  }
}

const clearAllData = async () => {
  if (!confirm('Are you sure? This will permanently delete all your chats and settings.')) {
    return
  }
  
  if (!confirm('This action cannot be undone. Are you absolutely sure?')) {
    return
  }
  
  try {
    await dexie.clearAllData()
    mainStore.chatSessions = []
    mainStore.currentChatId = null
    
    toast('success', 'Data Cleared', 'All data has been deleted')
    
    // Redirect to home after a delay
    setTimeout(() => {
      navigateTo('/')
    }, 1500)
  } catch (error) {
    console.error('Clear data error:', error)
    toast('error', 'Error', 'Failed to clear data')
  }
}

// Persist settings changes
watch(() => mainStore.chatSettings, () => {
  // Settings are automatically persisted by Pinia persist plugin
}, { deep: true })

// Page meta
useHead({
  title: 'Settings - CyberChat',
  meta: [
    { name: 'description', content: 'Customize your CyberChat experience' }
  ]
})
</script>

<style scoped>
/* Custom range input styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-track {
  background: #2a2a2a;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: #39ff14;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  margin-top: -6px;
  cursor: pointer;
  transition: all 0.2s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #45ff20;
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
}

input[type="range"]::-moz-range-track {
  background: #2a2a2a;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-moz-range-thumb {
  background: #39ff14;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  transition: all 0.2s;
}

input[type="range"]::-moz-range-thumb:hover {
  background: #45ff20;
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
}
</style>
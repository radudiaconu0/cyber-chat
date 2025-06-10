<!-- pages/index.vue -->
<template>
  <div class="flex flex-col h-full">
    <!-- Welcome Screen -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="max-w-4xl mx-auto text-center">
        <!-- Logo/Brand -->
        <div class="mb-8">
          <div class="w-24 h-24 bg-gradient-to-br from-neon-green to-neon-blue rounded-full mx-auto mb-6 flex items-center justify-center animate-glow">
            <span class="text-3xl font-bold text-black font-display">CC</span>
          </div>
          <h1 class="text-5xl font-bold text-white mb-4 font-display">
            Welcome to <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue">CyberChat</span>
          </h1>
          <p class="text-xl text-gray-400 max-w-2xl mx-auto">
            Next-generation AI conversations with multiple models, real-time collaboration, and advanced features.
          </p>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <!-- Start New Chat -->
          <button
            @click="startNewChat"
            class="group p-6 bg-dark-200 border border-dark-300 rounded-xl hover:border-neon-green/50 transition-all duration-300 hover:bg-dark-100"
          >
            <div class="w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-neon-green/30 transition-colors">
              <PlusIcon class="w-6 h-6 text-neon-green" />
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Start New Chat</h3>
            <p class="text-gray-400 text-sm">Begin a conversation with AI</p>
          </button>

          <!-- Browse Models -->
          <button
            @click="showModelsModal = true"
            class="group p-6 bg-dark-200 border border-dark-300 rounded-xl hover:border-neon-purple/50 transition-all duration-300 hover:bg-dark-100"
          >
            <div class="w-12 h-12 bg-neon-purple/20 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-neon-purple/30 transition-colors">
              <CpuChipIcon class="w-6 h-6 text-neon-purple" />
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Browse Models</h3>
            <p class="text-gray-400 text-sm">Explore available AI models</p>
          </button>

          <!-- View Dashboard -->
          <NuxtLink
            to="/dashboard"
            class="group p-6 bg-dark-200 border border-dark-300 rounded-xl hover:border-neon-blue/50 transition-all duration-300 hover:bg-dark-100"
          >
            <div class="w-12 h-12 bg-neon-blue/20 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-neon-blue/30 transition-colors">
              <ChartBarIcon class="w-6 h-6 text-neon-blue" />
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Dashboard</h3>
            <p class="text-gray-400 text-sm">View your usage statistics</p>
          </NuxtLink>
        </div>

        <!-- Recent Chats -->
        <div v-if="recentChats.length > 0" class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-6">Recent Conversations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NuxtLink
              v-for="chat in recentChats"
              :key="chat.id"
              :to="`/chat/${chat.id}`"
              class="group p-4 bg-dark-200 border border-dark-300 rounded-lg hover:border-neon-green/50 transition-all duration-300 text-left"
            >
              <div class="flex items-start justify-between mb-2">
                <h3 class="text-white font-medium group-hover:text-neon-green transition-colors truncate">
                  {{ chat.title }}
                </h3>
                <div class="flex items-center space-x-1 ml-2 flex-shrink-0">
                  <ShareIcon v-if="chat.shared" class="w-3 h-3 text-neon-green" />
                  <ArchiveBoxIcon v-if="chat.archived" class="w-3 h-3 text-gray-400" />
                </div>
              </div>
              <p class="text-gray-400 text-sm mb-2">
                {{ chat.messages.length }} messages • {{ formatDate(chat.updatedAt) }}
              </p>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 rounded-full bg-neon-green"></div>
                <span class="text-xs text-gray-500">{{ getModelName(chat.model) }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Features Highlight -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-neon-green to-neon-blue rounded-full mx-auto mb-4 flex items-center justify-center">
              <ChatBubbleLeftRightIcon class="w-8 h-8 text-black" />
            </div>
            <h3 class="text-white font-semibold mb-2">Multi-Model Support</h3>
            <p class="text-gray-400 text-sm">Choose from GPT-4, Claude, Gemini, and more</p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full mx-auto mb-4 flex items-center justify-center">
              <ShareIcon class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-white font-semibold mb-2">Real-time Sharing</h3>
            <p class="text-gray-400 text-sm">Share conversations with password protection</p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-green rounded-full mx-auto mb-4 flex items-center justify-center">
              <DocumentIcon class="w-8 h-8 text-black" />
            </div>
            <h3 class="text-white font-semibold mb-2">File Attachments</h3>
            <p class="text-gray-400 text-sm">Upload images, documents, and code files</p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-neon-yellow to-neon-orange rounded-full mx-auto mb-4 flex items-center justify-center">
              <BoltIcon class="w-8 h-8 text-black" />
            </div>
            <h3 class="text-white font-semibold mb-2">Advanced Features</h3>
            <p class="text-gray-400 text-sm">Web search, code execution, and reasoning</p>
          </div>
        </div>

        <!-- Getting Started -->
        <div class="bg-dark-200 border border-dark-300 rounded-xl p-8">
          <h2 class="text-2xl font-bold text-white mb-4">Getting Started</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="w-8 h-8 bg-neon-green text-black rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
              <h3 class="text-white font-medium mb-2">Choose a Model</h3>
              <p class="text-gray-400 text-sm">Select the AI model that best fits your needs</p>
            </div>
            <div class="text-center">
              <div class="w-8 h-8 bg-neon-green text-black rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
              <h3 class="text-white font-medium mb-2">Start Chatting</h3>
              <p class="text-gray-400 text-sm">Ask questions, request help, or have a conversation</p>
            </div>
            <div class="text-center">
              <div class="w-8 h-8 bg-neon-green text-black rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
              <h3 class="text-white font-medium mb-2">Share & Export</h3>
              <p class="text-gray-400 text-sm">Share your conversations or export for later use</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Models Modal -->
    <div v-if="showModelsModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-dark-200 border border-dark-300 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-dark-300/50">
          <h2 class="text-xl font-bold text-white">Available AI Models</h2>
          <button 
            @click="showModelsModal = false"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Models Grid -->
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="model in mainStore.availableModels"
            :key="model.id"
            class="p-4 bg-dark-300 border border-dark-400 rounded-lg hover:border-neon-green/50 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-white font-semibold">{{ model.name }}</h3>
                <p class="text-gray-400 text-sm mt-1">{{ model.description }}</p>
              </div>
              <button
                @click="startChatWithModel(model.id)"
                class="px-3 py-1 bg-neon-green text-black rounded text-sm hover:bg-neon-green/80 transition-colors"
              >
                Use
              </button>
            </div>
            
            <div class="space-y-2 text-xs text-gray-400">
              <div class="flex justify-between">
                <span>Context Length:</span>
                <span>{{ model.contextLength.toLocaleString() }} tokens</span>
              </div>
              <div class="flex justify-between">
                <span>Pricing:</span>
                <span>${{ model.pricing.prompt }}/${model.pricing.completion }}/1K tokens</span>
              </div>
              <div class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="capability in model.capabilities"
                  :key="capability"
                  class="px-2 py-1 bg-dark-100 rounded text-xs"
                >
                  {{ capability }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PlusIcon,
  CpuChipIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  DocumentIcon,
  BoltIcon,
  ArchiveBoxIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'default'
})

const mainStore = useMainStore()
const router = useRouter()
const supabase = useSupabaseClient()
const realtime = useSupabaseRealtime()

const showModelsModal = ref(false)

// Initialize realtime when component mounts
onMounted(async () => {
  if (mainStore.user) {
    await realtime.initialize()
  }
})

const recentChats = computed(() => {
  return mainStore.activeChats
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6)
})

const startNewChat = async () => {
  try {
    const newSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: mainStore.chatSettings.defaultModel,
      tokenCount: 0,
      archived: false,
      shared: false,
      shareId: null
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        id: newSession.id,
        user_id: mainStore.user?.id,
        title: newSession.title,
        model: newSession.model
      })
      .select()
      .single()

    if (error) throw error

    // Add to store
    mainStore.addChatSession(newSession)
    
    // Subscribe to new session's messages
    await realtime.subscribeToNewSession(newSession.id)
    
    // Navigate to new chat
    router.push(`/chat/${newSession.id}`)
  } catch (error) {
    console.error('Failed to create new chat:', error)
  }
}

const startChatWithModel = async (modelId: string) => {
  try {
    const model = mainStore.availableModels.find(m => m.id === modelId)
    const newSession = {
      id: crypto.randomUUID(),
      title: `Chat with ${model?.name || 'AI'}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: modelId,
      tokenCount: 0,
      archived: false,
      shared: false,
      shareId: null
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        id: newSession.id,
        user_id: mainStore.user?.id,
        title: newSession.title,
        model: newSession.model
      })
      .select()
      .single()

    if (error) throw error

    // Add to store
    mainStore.addChatSession(newSession)
    
    // Subscribe to new session's messages
    await realtime.subscribeToNewSession(newSession.id)
    
    // Close modal and navigate
    showModelsModal.value = false
    router.push(`/chat/${newSession.id}`)
  } catch (error) {
    console.error('Failed to create new chat:', error)
  }
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

const getModelName = (modelId: string) => {
  const model = mainStore.availableModels.find(m => m.id === modelId)
  return model?.name || modelId
}

// SEO
useHead({
  title: 'CyberChat - Next-Gen AI Chat',
  meta: [
    { name: 'description', content: 'Advanced AI chat application with multi-model support, real-time collaboration, and powerful features.' }
  ]
})
</script>

<style scoped>
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(57, 255, 20, 0.8), 0 0 40px rgba(57, 255, 20, 0.4);
  }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}
</style>
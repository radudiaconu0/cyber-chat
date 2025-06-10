<template>
  <div class="min-h-screen bg-cyber-dark">
    <!-- Header -->
    <header class="bg-dark-100 border-b border-dark-300/50 px-6 py-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-neon-green to-neon-blue rounded-lg flex items-center justify-center">
            <ChatBubbleBottomCenterTextIcon class="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-white">{{ chatTitle || 'Shared Chat' }}</h1>
            <p class="text-gray-400 text-sm">View-only mode</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <span class="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
            Shared
          </span>
          <button
            @click="copyShareLink"
            class="cyber-button text-sm"
          >
            <LinkIcon class="w-4 h-4 inline mr-2" />
            Copy Link
          </button>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-96">
      <div class="text-center">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-gray-400">Loading shared chat...</p>
      </div>
    </div>

    <!-- Password Prompt -->
    <div v-else-if="requiresPassword && !authenticated" class="flex items-center justify-center h-96">
      <div class="w-full max-w-md">
        <div class="bg-dark-100 rounded-xl border border-dark-300/50 p-8">
          <div class="text-center mb-6">
            <LockClosedIcon class="w-12 h-12 text-neon-purple mx-auto mb-3" />
            <h2 class="text-xl font-bold text-white">Password Required</h2>
            <p class="text-gray-400 text-sm mt-2">This chat is password protected</p>
          </div>
          
          <form @submit.prevent="verifyPassword" class="space-y-4">
            <div>
              <input
                v-model="password"
                type="password"
                placeholder="Enter password"
                class="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
                autofocus
              />
              <p v-if="passwordError" class="text-red-500 text-sm mt-2">
                {{ passwordError }}
              </p>
            </div>
            
            <button
              type="submit"
              :disabled="!password"
              :class="[
                'w-full py-3 rounded-lg font-medium transition-all',
                password 
                  ? 'bg-neon-purple text-white hover:bg-neon-purple/80' 
                  : 'bg-dark-300 text-gray-500 cursor-not-allowed'
              ]"
            >
              View Chat
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center h-96">
      <div class="text-center">
        <ExclamationCircleIcon class="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 class="text-xl font-bold text-white mb-2">{{ error.title }}</h2>
        <p class="text-gray-400">{{ error.message }}</p>
        <NuxtLink to="/" class="cyber-button text-sm mt-4 inline-block">
          Go to Home
        </NuxtLink>
      </div>
    </div>

    <!-- Chat Content -->
    <div v-else class="max-w-4xl mx-auto px-6 py-8">
      <!-- Expiration Warning -->
      <div v-if="expiresAt" class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
        <div class="flex items-center space-x-3">
          <ClockIcon class="w-5 h-5 text-yellow-500" />
          <p class="text-yellow-500 text-sm">
            This shared chat expires {{ formatExpiration(expiresAt) }}
          </p>
        </div>
      </div>

      <!-- Messages -->
      <div class="space-y-6">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="[
            'message-bubble',
            message.role
          ]"
        >
          <!-- Message Header -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <div 
                v-if="message.role === 'user'"
                class="w-6 h-6 bg-gradient-to-br from-neon-green to-neon-blue rounded-full flex items-center justify-center"
              >
                <UserIcon class="w-4 h-4 text-black" />
              </div>
              <div 
                v-else
                class="w-6 h-6 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full flex items-center justify-center"
              >
                <CpuChipIcon class="w-4 h-4 text-white" />
              </div>
              <span class="text-xs text-gray-400">
                {{ message.role === 'user' ? 'User' : 'Assistant' }}
              </span>
            </div>
            <span class="text-xs text-gray-500">
              {{ formatTime(message.timestamp) }}
            </span>
          </div>

          <!-- Message Content -->
          <div class="pl-8">
            <MarkdownRenderer :content="message.content" />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-12 pt-8 border-t border-dark-300/50 text-center">
        <p class="text-gray-400 text-sm mb-4">
          Want to have your own AI conversations?
        </p>
        <NuxtLink to="/" class="cyber-button">
          Try CyberChat
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ChatBubbleBottomCenterTextIcon,
  LinkIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
  ClockIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const toast = inject('toast')

// State
const loading = ref(true)
const requiresPassword = ref(false)
const authenticated = ref(false)
const password = ref('')
const passwordError = ref('')
const error = ref<{ title: string; message: string } | null>(null)

const chatTitle = ref('')
const messages = ref<any[]>([])
const expiresAt = ref<Date | null>(null)

// Load shared chat
const loadSharedChat = async () => {
  loading.value = true
  
  try {
    const { data, error: fetchError } = await $fetch(`/api/share/${route.params.id}`, {
      method: 'POST',
      body: {
        password: authenticated.value ? password.value : undefined
      }
    })

    if (fetchError) {
      throw fetchError
    }

    if (data.requiresPassword && !authenticated.value) {
      requiresPassword.value = true
      loading.value = false
      return
    }

    chatTitle.value = data.title
    messages.value = data.messages
    expiresAt.value = data.expiresAt ? new Date(data.expiresAt) : null
    
    authenticated.value = true
    loading.value = false

  } catch (err: any) {
    console.error('Failed to load shared chat:', err)
    
    if (err.statusCode === 404) {
      error.value = {
        title: 'Chat Not Found',
        message: 'This shared chat does not exist or has been removed.'
      }
    } else if (err.statusCode === 410) {
      error.value = {
        title: 'Chat Expired',
        message: 'This shared chat has expired and is no longer available.'
      }
    } else {
      error.value = {
        title: 'Error Loading Chat',
        message: 'Failed to load the shared chat. Please try again later.'
      }
    }
    
    loading.value = false
  }
}

// Verify password
const verifyPassword = async () => {
  if (!password.value) return
  
  passwordError.value = ''
  
  try {
    await loadSharedChat()
    
    if (!authenticated.value) {
      passwordError.value = 'Incorrect password'
    }
  } catch (err) {
    passwordError.value = 'Failed to verify password'
  }
}

// Copy share link
const copyShareLink = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url)
  toast('success', 'Copied', 'Share link copied to clipboard')
}

// Format expiration
const formatExpiration = (date: Date) => {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  
  if (diff <= 0) return 'now'
  
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (hours < 1) return 'in less than an hour'
  if (hours < 24) return `in ${hours} hour${hours > 1 ? 's' : ''}`
  if (days < 7) return `in ${days} day${days > 1 ? 's' : ''}`
  
  return `on ${date.toLocaleDateString()}`
}

// Format time
const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Load on mount
onMounted(() => {
  loadSharedChat()
})

// Page meta
useHead({
  title: computed(() => `${chatTitle.value || 'Shared Chat'} - CyberChat`),
  meta: [
    { name: 'description', content: 'View a shared CyberChat conversation' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<style scoped>
/* Loading spinner */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(57, 255, 20, 0.3);
  border-top: 3px solid #39ff14;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
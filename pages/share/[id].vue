<!-- pages/share/[id].vue -->
<template>
  <div class="min-h-screen bg-cyber-dark">
    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-neon-green text-sm uppercase tracking-wider">Loading Shared Chat...</p>
      </div>
    </div>

    <!-- Password Protection -->
    <div v-else-if="requiresPassword && !authenticated" class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-dark-200 border border-dark-300 rounded-lg p-8 w-full max-w-md">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-neon-green to-neon-blue rounded-full mx-auto mb-4 flex items-center justify-center">
            <LockClosedIcon class="w-8 h-8 text-black" />
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">Protected Chat</h1>
          <p class="text-gray-400">This shared chat is password protected</p>
        </div>

        <form @submit.prevent="submitPassword" class="space-y-4">
          <div>
            <input
              v-model="password"
              type="password"
              placeholder="Enter password"
              class="w-full px-4 py-3 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              :class="{ 'border-red-500': passwordError }"
            />
            <p v-if="passwordError" class="text-red-400 text-sm mt-2">{{ passwordError }}</p>
          </div>
          
          <button
            type="submit"
            :disabled="!password || isValidating"
            class="w-full cyber-button disabled:opacity-50"
          >
            {{ isValidating ? 'Validating...' : 'Access Chat' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
      <div class="text-center max-w-md">
        <div class="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
          <ExclamationTriangleIcon class="w-8 h-8 text-red-500" />
        </div>
        <h1 class="text-2xl font-bold text-red-500 mb-4">{{ error.statusMessage || 'Chat Not Found' }}</h1>
        <p class="text-gray-400 mb-6">
          This shared chat may have expired, been deleted, or the link is invalid.
        </p>
        <a href="/" class="cyber-button inline-block">
          Go to CyberChat
        </a>
      </div>
    </div>

    <!-- Shared Chat Display -->
    <div v-else-if="sharedChat" class="flex flex-col min-h-screen">
      <!-- Header -->
      <header class="bg-dark-100 border-b border-dark-300/50 p-4">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-white">{{ sharedChat.title }}</h1>
            <div class="flex items-center space-x-4 text-sm text-gray-400 mt-1">
              <span>{{ messages.length }} messages</span>
              <span>Shared {{ formatDate(new Date(sharedChat.created_at)) }}</span>
              <span>{{ sharedChat.view_count }} views</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <!-- Download Button -->
            <button
              v-if="sharedChat.metadata?.allowDownload"
              @click="downloadChat"
              class="p-2 text-gray-400 hover:text-white transition-colors"
              title="Download Chat"
            >
              <ArrowDownTrayIcon class="w-5 h-5" />
            </button>
            
            <!-- CyberChat Link -->
            <a 
              href="/"
              class="px-4 py-2 bg-neon-green text-black rounded-lg hover:bg-neon-green/80 transition-colors text-sm font-medium"
            >
              Try CyberChat
            </a>
          </div>
        </div>
      </header>

      <!-- Messages -->
      <main class="flex-1 overflow-y-auto px-4 py-6">
        <div class="max-w-4xl mx-auto space-y-6">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'message-bubble',
              message.role,
              'border rounded-lg p-4'
            ]"
          >
            <!-- Message Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div 
                  :class="[
                    'w-6 h-6 rounded-full flex items-center justify-center',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-neon-green to-neon-blue'
                      : 'bg-gradient-to-br from-neon-purple to-neon-pink'
                  ]"
                >
                  <UserIcon v-if="message.role === 'user'" class="w-4 h-4 text-black" />
                  <CpuChipIcon v-else class="w-4 h-4 text-white" />
                </div>
                <span class="text-xs text-gray-400">
                  {{ message.role === 'user' ? 'User' : 'Assistant' }}
                </span>
              </div>
              
              <!-- Timestamp -->
              <span 
                v-if="sharedChat.metadata?.showMetadata"
                class="text-xs text-gray-500"
              >
                {{ formatTimestamp(new Date(message.timestamp)) }}
              </span>
            </div>

            <!-- Message Content -->
            <div 
              class="prose prose-invert max-w-none"
              v-html="renderMarkdown(message.content)"
            />

            <!-- Attachments -->
            <div v-if="message.attachments && message.attachments.length > 0" class="mt-3">
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="attachment in message.attachments"
                  :key="attachment.id"
                  class="bg-dark-300/50 border border-dark-400 rounded-lg p-2 flex items-center space-x-2"
                >
                  <DocumentIcon class="w-4 h-4 text-neon-blue" />
                  <span class="text-sm text-gray-300">{{ attachment.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-dark-100 border-t border-dark-300/50 p-4">
        <div class="max-w-4xl mx-auto text-center text-sm text-gray-400">
          <p>
            This chat was shared using 
            <a href="/" class="text-neon-green hover:text-neon-green/80">CyberChat</a>
            - Next-generation AI conversations
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LockClosedIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  UserIcon,
  CpuChipIcon,
  DocumentIcon
} from '@heroicons/vue/24/outline'
import { marked } from 'marked'

definePageMeta({
  layout: false
})

const route = useRoute()
const supabase = await useSupabaseClient()

const shareId = route.params.id as string
const password = ref('')
const passwordError = ref('')
const isValidating = ref(false)
const requiresPassword = ref(false)
const authenticated = ref(false)

// Load shared chat data
const { data: sharedChat, pending, error } = await useLazyAsyncData(
  `shared-chat-${shareId}`,
  async () => {
    try {
      // First, get the shared chat metadata
      const { data: shareData, error: shareError } = await supabase
        .from('shared_chats')
        .select('*')
        .eq('id', shareId)
        .single()

      if (shareError || !shareData) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Shared chat not found'
        })
      }

      // Check if expired
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        throw createError({
          statusCode: 410,
          statusMessage: 'This shared chat has expired'
        })
      }

      // Check if password required
      if (shareData.password_hash) {
        requiresPassword.value = true
        if (!authenticated.value) {
          return shareData
        }
      }

      // Increment view count
      await supabase
        .from('shared_chats')
        .update({ 
          view_count: (shareData.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', shareId)

      return shareData
    } catch (error: any) {
      throw error
    }
  }
)

// Load messages for the shared chat
const { data: messages } = await useLazyAsyncData(
  `shared-chat-messages-${shareId}`,
  async () => {
    if (!sharedChat.value || (requiresPassword.value && !authenticated.value)) {
      return []
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sharedChat.value.session_id)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Failed to load messages:', error)
      return []
    }

    return data || []
  },
  {
    server: false,
    watch: [authenticated]
  }
)

const submitPassword = async () => {
  if (!password.value || !sharedChat.value) return

  isValidating.value = true
  passwordError.value = ''

  try {
    // Validate password with server
    const response = await $fetch('/api/validate-share-password', {
      method: 'POST',
      body: {
        shareId: shareId,
        password: password.value
      }
    })

    if (response.valid) {
      authenticated.value = true
      await refreshCookie()
    } else {
      passwordError.value = 'Invalid password'
    }
  } catch (error: any) {
    passwordError.value = error.data?.message || 'Failed to validate password'
  } finally {
    isValidating.value = false
  }
}

const renderMarkdown = (content: string) => {
  try {
    return marked(content, { breaks: true, gfm: true })
  } catch (error) {
    return content
  }
}

const formatDate = (date: Date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  )
}

const formatTimestamp = (date: Date) => {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const downloadChat = () => {
  if (!sharedChat.value || !messages.value) return

  const chatData = {
    title: sharedChat.value.title,
    shared_at: sharedChat.value.created_at,
    messages: messages.value.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }))
  }

  const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sharedChat.value.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO
useHead({
  title: sharedChat.value ? `${sharedChat.value.title} - Shared Chat` : 'Shared Chat',
  meta: [
    { name: 'description', content: 'View shared conversation from CyberChat' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<style scoped>
.message-bubble.user {
  @apply bg-dark-200/50 border-neon-green/30 ml-8;
}

.message-bubble.assistant {
  @apply bg-dark-100/50 border-neon-purple/30 mr-8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .message-bubble.user,
  .message-bubble.assistant {
    @apply mx-2;
  }
}
</style>
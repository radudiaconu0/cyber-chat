<!-- pages/chat/[id].vue -->
<template>
  <div class="flex flex-col h-full">
    <!-- Loading State -->
    <div v-if="pending" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-neon-green text-sm uppercase tracking-wider">Loading Chat...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center max-w-md">
        <h2 class="text-2xl font-bold text-red-500 mb-4">Chat Not Found</h2>
        <p class="text-gray-400 mb-6">This chat session doesn't exist or you don't have access to it.</p>
        <NuxtLink to="/" class="cyber-button">
          Go Back Home
        </NuxtLink>
      </div>
    </div>

    <!-- Chat Interface -->
    <div v-else-if="currentSession" class="flex flex-col h-full">
      <!-- Chat Header -->
      <header class="flex-shrink-0 p-4 bg-dark-100 border-b border-dark-300/50">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="text-gray-400 hover:text-white transition-colors">
              <ArrowLeftIcon class="w-5 h-5" />
            </NuxtLink>
            <div>
              <h1 class="text-lg font-semibold text-white">{{ currentSession.title }}</h1>
              <p class="text-sm text-gray-400">
                {{ currentSession.messages.length }} messages • {{ formatDate(currentSession.updatedAt) }}
              </p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <!-- Share Button -->
            <button 
              @click="shareChat"
              class="p-2 text-gray-400 hover:text-white transition-colors"
              title="Share Chat"
            >
              <ShareIcon class="w-5 h-5" />
            </button>
            
            <!-- More Options -->
            <div class="relative" ref="dropdownRef">
              <button 
                @click="showDropdown = !showDropdown"
                class="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <EllipsisVerticalIcon class="w-5 h-5" />
              </button>
              
              <Transition name="fade">
                <div v-if="showDropdown" class="absolute right-0 top-full mt-2 w-48 bg-dark-200 border border-dark-300 rounded-lg shadow-lg z-10">
                  <button 
                    @click="editTitle"
                    class="w-full px-4 py-2 text-left text-white hover:bg-dark-300 transition-colors flex items-center space-x-2"
                  >
                    <PencilIcon class="w-4 h-4" />
                    <span>Edit Title</span>
                  </button>
                  <button 
                    @click="exportChat"
                    class="w-full px-4 py-2 text-left text-white hover:bg-dark-300 transition-colors flex items-center space-x-2"
                  >
                    <DocumentArrowDownIcon class="w-4 h-4" />
                    <span>Export Chat</span>
                  </button>
                  <button 
                    @click="archiveChat"
                    class="w-full px-4 py-2 text-left text-white hover:bg-dark-300 transition-colors flex items-center space-x-2"
                  >
                    <ArchiveBoxIcon class="w-4 h-4" />
                    <span>Archive</span>
                  </button>
                  <hr class="border-dark-300" />
                  <button 
                    @click="deleteChat"
                    class="w-full px-4 py-2 text-left text-red-500 hover:bg-dark-300 transition-colors flex items-center space-x-2"
                  >
                    <TrashIcon class="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <!-- Messages Area -->
      <div 
        ref="messagesContainer"
        class="flex-1 overflow-y-auto px-4 py-6"
        @scroll="handleScroll"
      >
        <div class="max-w-4xl mx-auto space-y-6">
          <TransitionGroup name="message">
            <MessageBubble
              v-for="message in currentSession.messages"
              :key="message.id"
              :message="message"
              @edit="editMessage"
              @delete="deleteMessage"
              @regenerate="regenerateMessage"
            />
          </TransitionGroup>
          
          <!-- Typing Indicator -->
          <div v-if="isStreaming" class="message-bubble assistant">
            <div class="flex items-center space-x-2">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span class="text-gray-400 text-sm">AI is thinking...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <ChatInput 
        @send="sendMessage"
        @attach="handleAttachment"
        :disabled="isStreaming"
        :session-id="currentSession.id"
      />
    </div>

    <!-- Share Modal -->
    <ShareChatModal 
      v-if="showShareModal"
      :session="currentSession"
      @close="showShareModal = false"
    />

    <!-- Edit Title Modal -->
    <EditTitleModal
      v-if="showEditModal"
      :current-title="currentSession?.title"
      @close="showEditModal = false"
      @save="updateTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { 
  ArrowLeftIcon, 
  ShareIcon, 
  EllipsisVerticalIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  ArchiveBoxIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const mainStore = useMainStore()
const supabase = await useSupabaseClient()
const realtime = useSupabaseRealtime()
const toast = inject('toast')

const chatId = computed(() => route.params.id as string)
const showDropdown = ref(false)
const showShareModal = ref(false)
const showEditModal = ref(false)
const messagesContainer = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const isStreaming = ref(false)

// Load chat data
const { data: currentSession, pending, error, refresh } = await useLazyAsyncData(
  `chat-${chatId.value}`,
  async () => {
    // First check if we have it in the store
    const existingSession = mainStore.chatSessions.find(s => s.id === chatId.value)
    if (existingSession) {
      mainStore.currentChatId = chatId.value
      return existingSession
    }

    // If not in store, fetch from Supabase
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', chatId.value)
      .single()

    if (sessionError || !session) {
      throw new Error('Chat not found')
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', chatId.value)
      .order('timestamp', { ascending: true })

    if (messagesError) {
      throw new Error('Failed to load messages')
    }

    // Create session object
    const fullSession = {
      id: session.id,
      title: session.title,
      model: session.model,
      tokenCount: session.token_count || 0,
      archived: session.archived || false,
      shared: session.shared || false,
      shareId: session.share_id,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
      messages: messages.map(msg => ({
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

    // Add to store
    const existingIndex = mainStore.chatSessions.findIndex(s => s.id === chatId.value)
    if (existingIndex !== -1) {
      mainStore.chatSessions[existingIndex] = fullSession
    } else {
      mainStore.chatSessions.unshift(fullSession)
    }
    
    mainStore.currentChatId = chatId.value
    return fullSession
  },
  {
    server: false
  }
)

// Initialize realtime when component mounts
onMounted(async () => {
  if (mainStore.user && currentSession.value) {
    await realtime.initialize()
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', handleClickOutside)
  
  // Scroll to bottom
  nextTick(scrollToBottom)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for route changes
watch(chatId, async (newId) => {
  if (newId) {
    await refresh()
  }
})

const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

const formatDate = (date: Date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  )
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleScroll = () => {
  // Handle infinite scroll if needed
}

const sendMessage = async (content: string, attachments: any[] = []) => {
  if (!currentSession.value || isStreaming.value) return

  try {
    isStreaming.value = true
    
    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
      model: currentSession.value.model,
      streaming: false,
      error: false,
      attachments,
      metadata: {}
    }
    
    currentSession.value.messages.push(userMessage)
    nextTick(scrollToBottom)

    // Send to API
    const response = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        messages: currentSession.value.messages,
        model: currentSession.value.model,
        sessionId: currentSession.value.id,
        settings: mainStore.chatSettings
      }
    })

    // Handle streaming response
    // Implementation depends on your API structure
    
  } catch (error) {
    console.error('Failed to send message:', error)
    toast('error', 'Error', 'Failed to send message')
  } finally {
    isStreaming.value = false
  }
}

const handleAttachment = (file: File) => {
  // Handle file attachment
  console.log('Attaching file:', file)
}

const shareChat = () => {
  showShareModal.value = true
}

const editTitle = () => {
  showEditModal.value = true
  showDropdown.value = false
}

const updateTitle = async (newTitle: string) => {
  if (!currentSession.value) return
  
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title: newTitle })
      .eq('id', currentSession.value.id)

    if (!error) {
      currentSession.value.title = newTitle
      showEditModal.value = false
      toast('success', 'Success', 'Chat title updated')
    }
  } catch (error) {
    console.error('Failed to update title:', error)
    toast('error', 'Error', 'Failed to update title')
  }
}

const exportChat = () => {
  // Implement chat export
  showDropdown.value = false
}

const archiveChat = async () => {
  if (!currentSession.value) return
  
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ archived: true })
      .eq('id', currentSession.value.id)

    if (!error) {
      currentSession.value.archived = true
      showDropdown.value = false
      toast('success', 'Success', 'Chat archived')
      router.push('/')
    }
  } catch (error) {
    console.error('Failed to archive chat:', error)
    toast('error', 'Error', 'Failed to archive chat')
  }
}

const deleteChat = async () => {
  if (!currentSession.value || !confirm('Are you sure you want to delete this chat?')) return
  
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', currentSession.value.id)

    if (!error) {
      mainStore.chatSessions = mainStore.chatSessions.filter(s => s.id !== currentSession.value!.id)
      showDropdown.value = false
      toast('success', 'Success', 'Chat deleted')
      router.push('/')
    }
  } catch (error) {
    console.error('Failed to delete chat:', error)
    toast('error', 'Error', 'Failed to delete chat')
  }
}

const editMessage = (messageId: string) => {
  // Implement message editing
}

const deleteMessage = (messageId: string) => {
  // Implement message deletion
}

const regenerateMessage = (messageId: string) => {
  // Implement message regeneration
}
</script>
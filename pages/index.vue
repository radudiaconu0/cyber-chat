<template>
  <div class="flex flex-col h-full">
    <!-- Welcome Screen (when no chat selected) -->
    <WelcomeScreen 
      v-if="!mainStore.currentChatId"
      @start-chat="startNewChat"
    />

    <!-- Chat Interface -->
    <div v-else class="flex flex-col h-full">
      <!-- Messages Area -->
      <div 
        ref="messagesContainer"
        class="flex-1 overflow-y-auto px-4 py-6"
        @scroll="handleScroll"
      >
        <div class="max-w-4xl mx-auto space-y-6">
          <!-- Messages -->
          <TransitionGroup name="message">
            <div
              v-for="message in currentMessages"
              :key="message.id"
              :class="[
                'message-bubble fade-in-scale',
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
                    {{ message.role === 'user' ? 'You' : getModelName(message.model) }}
                  </span>
                  <!-- Web search indicator -->
                  <span 
                    v-if="message.metadata?.webSearchResults?.length"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400"
                  >
                    <GlobeAltIcon class="w-3 h-3 mr-1" />
                    Web
                  </span>
                </div>
                <span class="text-xs text-gray-500">
                  {{ formatTime(message.timestamp) }}
                </span>
              </div>

              <!-- Message Content -->
              <div class="pl-8">
                <!-- Regular message -->
                <MarkdownRenderer 
                  v-if="!message.streaming || message.content"
                  :content="message.content"
                  :streaming="message.streaming"
                />
                
                <!-- Streaming indicator -->
                <div v-else-if="message.streaming && !message.content" class="flex items-center space-x-3">
                  <div v-if="mainStore.isSearching" class="flex items-center space-x-2 text-neon-green">
                    <GlobeAltIcon class="w-4 h-4 animate-pulse" />
                    <span class="text-sm">Searching the web...</span>
                  </div>
                  <div v-else class="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>

                <!-- Attachments -->
                <div v-if="message.attachments?.length" class="mt-3 space-y-2">
                  <AttachmentPreview 
                    v-for="attachment in message.attachments"
                    :key="attachment.id"
                    :attachment="attachment"
                  />
                </div>

                <!-- Metadata (search results, etc.) -->
                <div v-if="message.metadata?.webSearchResults?.length" class="mt-3">
                  <WebSearchResults :results="message.metadata.webSearchResults" />
                </div>
              </div>

              <!-- Message Actions -->
              <div class="flex items-center space-x-2 mt-3 pl-8 opacity-0 hover:opacity-100 transition-opacity">
                <button 
                  @click="copyMessage(message.content)"
                  class="text-xs text-gray-400 hover:text-white"
                >
                  <ClipboardDocumentIcon class="w-4 h-4" />
                </button>
                <button 
                  @click="regenerateMessage(message.id)"
                  v-if="message.role === 'assistant'"
                  class="text-xs text-gray-400 hover:text-white"
                >
                  <ArrowPathIcon class="w-4 h-4" />
                </button>
                <button 
                  @click="editMessage(message.id)"
                  v-if="message.role === 'user'"
                  class="text-xs text-gray-400 hover:text-white"
                >
                  <PencilIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </TransitionGroup>

          <!-- Scroll to bottom indicator -->
          <Transition name="fade">
            <div 
              v-if="showScrollIndicator"
              class="fixed bottom-24 right-8"
            >
              <button
                @click="scrollToBottom"
                class="p-2 bg-dark-200 rounded-full border border-neon-green/50 hover:bg-dark-300 transition-all"
              >
                <ChevronDownIcon class="w-5 h-5 text-neon-green" />
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-dark-300/50 p-4 bg-dark-100">
        <div class="max-w-4xl mx-auto">
          <!-- Context indicators -->
          <div v-if="showContextIndicators" class="flex items-center space-x-4 mb-3">
            <!-- Reasoning indicator -->
            <div 
              v-if="mainStore.chatSettings.enableReasoning && mainStore.isReasoningModel"
              class="flex items-center space-x-2 text-xs text-neon-blue"
            >
              <LightBulbIcon class="w-4 h-4" />
              <span>Reasoning enabled</span>
            </div>

            <!-- Web search indicator -->
            <div 
              v-if="mainStore.chatSettings.enableWebSearch"
              class="flex items-center space-x-2 text-xs text-neon-green"
            >
              <GlobeAltIcon class="w-4 h-4" />
              <span>Web search enabled</span>
            </div>

            <!-- Attachments indicator -->
            <div 
              v-if="attachments.length > 0"
              class="flex items-center space-x-2 text-xs text-neon-purple"
            >
              <PaperClipIcon class="w-4 h-4" />
              <span>{{ attachments.length }} file(s) attached</span>
            </div>
          </div>

          <!-- Message Input -->
          <div class="relative">
            <textarea
              ref="messageInput"
              v-model="messageText"
              @keydown.enter.prevent="handleEnterKey"
              @input="handleInput"
              :placeholder="inputPlaceholder"
              :disabled="isProcessing"
              class="w-full px-4 py-3 pr-32 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 resize-none"
              rows="3"
            />

            <!-- Input Actions -->
            <div class="absolute bottom-3 right-3 flex items-center space-x-2">
              <!-- Attachment button -->
              <button
                @click="showAttachmentModal = true"
                class="p-1.5 text-gray-400 hover:text-white transition-colors"
                :disabled="isProcessing"
              >
                <PaperClipIcon class="w-5 h-5" />
              </button>

              <!-- Web search toggle -->
              <Tooltip 
                v-if="currentModelSupportsWebSearch"
                :text="mainStore.chatSettings.enableWebSearch ? 'Web search enabled' : 'Enable web search'"
                position="top"
              >
                <button
                  @click="toggleWebSearch"
                  :class="[
                    'p-1.5 transition-colors',
                    mainStore.chatSettings.enableWebSearch 
                      ? 'text-neon-green' 
                      : 'text-gray-400 hover:text-white'
                  ]"
                  :disabled="isProcessing"
                >
                  <GlobeAltIcon class="w-5 h-5" />
                </button>
              </Tooltip>

              <!-- Send button -->
              <button
                @click="sendMessage"
                :disabled="!canSend"
                :class="[
                  'px-4 py-1.5 rounded-lg font-medium transition-all',
                  canSend 
                    ? 'bg-neon-green text-black hover:bg-neon-green/80' 
                    : 'bg-dark-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                <PaperAirplaneIcon class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Character count -->
          <div class="mt-2 text-xs text-gray-500 text-right">
            {{ messageText.length }} / {{ maxMessageLength }} characters
          </div>
        </div>
      </div>
    </div>

    <!-- Attachment Modal -->
    <AttachmentModal 
      v-if="showAttachmentModal"
      @close="showAttachmentModal = false"
      @attach="handleAttachment"
    />
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '~/stores/main'
import AttachmentPreview from '~/components/chat/AttachmentPreview.vue'
import AttachmentModal from '~/components/chat/AttachmentModal.vue'
import { 
  UserIcon, 
  CpuChipIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  PencilIcon,
  ChevronDownIcon,
  LightBulbIcon
} from '@heroicons/vue/24/outline'

import WebSearchResults from '~/components/chat/WebSearchResults.vue'
import Tooltip from '~/components/ui/Tooltip.vue'

const mainStore = useMainStore()
const toast = inject('toast')
const { $api } = useNuxtApp()

// Refs
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()

// State
const messageText = ref('')
const attachments = ref<any[]>([])
const isProcessing = ref(false)
const showScrollIndicator = ref(false)
const showAttachmentModal = ref(false)
const maxMessageLength = 10000

// Computed
const currentMessages = computed(() => {
  return mainStore.currentSession?.messages || []
})

const canSend = computed(() => {
  return messageText.value.trim().length > 0 && !isProcessing.value
})

const inputPlaceholder = computed(() => {
  if (isProcessing.value) return 'Processing...'
  if (mainStore.chatSettings.enableWebSearch && currentModelSupportsWebSearch.value) {
    return 'Ask anything (web search enabled)...'
  }
  if (currentModelSupportsWebSearch.value && !mainStore.chatSettings.enableWebSearch) {
    return 'Ask anything (web search available)...'
  }
  if (mainStore.isReasoningModel) return 'Ask a complex question...'
  return 'Type your message...'
})

const showContextIndicators = computed(() => {
  return mainStore.chatSettings.enableReasoning || 
         mainStore.chatSettings.enableWebSearch || 
         attachments.value.length > 0
})

const currentModelSupportsWebSearch = computed(() => {
  return mainStore.currentModel?.webSearch || false
})

// Methods
const startNewChat = () => {
  mainStore.createNewChat('New conversation')
  messageInput.value?.focus()
}

const sendMessage = async () => {
  if (!canSend.value) return

  const content = messageText.value.trim()
  messageText.value = ''

  // Add user message
  const userMessage = mainStore.addMessage({
    role: 'user',
    content,
    attachments: [...attachments.value]
  })

  // Clear attachments
  attachments.value = []

  // Start processing
  isProcessing.value = true

  // Check if using web search model
  const isWebSearchModel = mainStore.currentModel?.webSearch && mainStore.chatSettings.enableWebSearch
  if (isWebSearchModel) {
    mainStore.isSearching = true
  }

  try {
    // Add assistant message placeholder
    const assistantMessage = mainStore.addMessage({
      role: 'assistant',
      content: '',
      model: mainStore.selectedModel,
      streaming: true
    })

    // Call API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: currentMessages.value,
        model: mainStore.selectedModel,
        settings: mainStore.chatSettings,
        sessionId: mainStore.currentChatId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    // Handle streaming response
    await handleStreamingResponse(response, assistantMessage.id)

  } catch (error) {
    console.error('Chat error:', error)
    toast('error', 'Error', 'Failed to send message')
  } finally {
    isProcessing.value = false
    mainStore.isSearching = false
  }
}

const handleStreamingResponse = async (response: any, messageId: string) => {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''
  let webSearchResults: any[] = []

  if (!reader) return

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '') continue
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') continue

          try {
            const data = JSON.parse(dataStr)
            
            if (data.content) {
              content += data.content
              // Reset search state when content starts coming
              if (mainStore.isSearching && content.length > 0) {
                mainStore.isSearching = false
              }
              mainStore.updateMessage(messageId, { 
                content, 
                streaming: true 
              })
            }

            // Handle web search results
            if (data.webSearchResults) {
              webSearchResults = data.webSearchResults
              mainStore.updateMessage(messageId, { 
                metadata: { 
                  ...mainStore.currentSession?.messages.find(m => m.id === messageId)?.metadata,
                  webSearchResults 
                } 
              })
            }
          } catch (e) {
            console.error('Failed to parse streaming data:', e)
          }
        }
      }
    }
  } finally {
    mainStore.updateMessage(messageId, { streaming: false })
    scrollToBottom()
  }
}

const handleEnterKey = (event: KeyboardEvent) => {
  if (event.shiftKey) {
    // Allow new line with Shift+Enter
    return
  }
  sendMessage()
}

const handleInput = () => {
  // Auto-resize textarea
  const textarea = messageInput.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }
}

const handleScroll = () => {
  if (!messagesContainer.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
  
  showScrollIndicator.value = !isNearBottom
}

const scrollToBottom = () => {
  if (!messagesContainer.value) return
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content)
  toast('success', 'Copied', 'Message copied to clipboard')
}

const regenerateMessage = (messageId: string) => {
  toast('info', 'Regenerate', 'Message regeneration coming soon!')
}

const editMessage = (messageId: string) => {
  toast('info', 'Edit', 'Message editing coming soon!')
}

const toggleWebSearch = () => {
  mainStore.updateSettings({ 
    enableWebSearch: !mainStore.chatSettings.enableWebSearch 
  })
}

const handleAttachment = (files: File[]) => {
  // Handle file attachments
  toast('info', 'Attachments', 'File handling coming soon!')
  showAttachmentModal.value = false
}

const getModelName = (modelId?: string) => {
  const model = mainStore.availableModels.find(m => m.id === (modelId || mainStore.selectedModel))
  return model?.name || 'Assistant'
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Lifecycle
onMounted(() => {
  scrollToBottom()
  messageInput.value?.focus()
})

// Watch for new messages
watch(() => currentMessages.value.length, () => {
  nextTick(() => scrollToBottom())
})
</script>

<style scoped>
/* Message animations */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Auto-resize textarea */
textarea {
  min-height: 80px;
  max-height: 200px;
}
</style>
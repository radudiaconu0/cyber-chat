<!-- components/MessageBubble.vue -->
<template>
  <div
    :class="[
      'message-bubble group',
      message.role,
      { 'error': message.error }
    ]"
  >
    <!-- Message Header -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-2">
        <!-- Avatar -->
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
        
        <!-- Role and Model -->
        <div class="flex items-center space-x-2">
          <span class="text-xs text-gray-400">
            {{ message.role === 'user' ? 'You' : 'Assistant' }}
          </span>
          <span v-if="message.model" class="text-xs text-gray-500">
            {{ getModelName(message.model) }}
          </span>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <!-- Copy Button -->
        <button
          @click="copyMessage"
          class="p-1 text-gray-400 hover:text-white transition-colors"
          title="Copy message"
        >
          <component :is="copied ? CheckIcon : ClipboardIcon" class="w-4 h-4" />
        </button>
        
        <!-- Edit Button (for user messages) -->
        <button
          v-if="message.role === 'user'"
          @click="$emit('edit', message.id)"
          class="p-1 text-gray-400 hover:text-white transition-colors"
          title="Edit message"
        >
          <PencilIcon class="w-4 h-4" />
        </button>
        
        <!-- Regenerate Button (for assistant messages) -->
        <button
          v-if="message.role === 'assistant'"
          @click="$emit('regenerate', message.id)"
          class="p-1 text-gray-400 hover:text-white transition-colors"
          title="Regenerate response"
        >
          <ArrowPathIcon class="w-4 h-4" />
        </button>
        
        <!-- Delete Button -->
        <button
          @click="$emit('delete', message.id)"
          class="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete message"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
        
        <!-- More Actions -->
        <div class="relative" ref="dropdownRef">
          <button
            @click="showDropdown = !showDropdown"
            class="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <EllipsisVerticalIcon class="w-4 h-4" />
          </button>
          
          <Transition name="fade">
            <div 
              v-if="showDropdown" 
              class="absolute right-0 top-full mt-2 w-40 bg-dark-200 border border-dark-300 rounded-lg shadow-lg z-10"
            >
              <button
                @click="exportMessage"
                class="w-full px-3 py-2 text-left text-white hover:bg-dark-300 transition-colors text-sm"
              >
                Export
              </button>
              <button
                @click="reportMessage"
                class="w-full px-3 py-2 text-left text-white hover:bg-dark-300 transition-colors text-sm"
              >
                Report
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Attachments Preview -->
    <div v-if="message.attachments && message.attachments.length > 0" class="mb-3">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="attachment in message.attachments"
          :key="attachment.id"
          class="bg-dark-300/50 border border-dark-400 rounded-lg p-2 flex items-center space-x-2 max-w-xs"
        >
          <component :is="getAttachmentIcon(attachment.type)" class="w-4 h-4 text-neon-blue" />
          <span class="text-sm text-gray-300 truncate">{{ attachment.name }}</span>
          <button
            v-if="attachment.url"
            @click="downloadAttachment(attachment)"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowDownTrayIcon class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Message Content -->
    <div class="message-content">
      <!-- Streaming Indicator -->
      <div v-if="message.streaming" class="flex items-center space-x-2 mb-2">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="text-gray-400 text-sm">Generating response...</span>
      </div>

      <!-- Error State -->
      <div v-if="message.error" class="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div class="flex items-center space-x-2">
          <ExclamationTriangleIcon class="w-4 h-4 text-red-500" />
          <span class="text-red-400 text-sm">Failed to generate response</span>
        </div>
      </div>

      <!-- Rendered Content -->
      <div 
        v-if="message.content"
        :class="[
          'prose prose-invert max-w-none',
          message.role === 'user' ? 'text-white' : 'text-gray-100'
        ]"
        v-html="renderedContent"
      />

      <!-- Code Execution Results -->
      <div v-if="message.metadata?.codeResults" class="mt-3">
        <div class="bg-dark-300/50 border border-dark-400 rounded-lg p-3">
          <div class="flex items-center space-x-2 mb-2">
            <CodeBracketIcon class="w-4 h-4 text-neon-green" />
            <span class="text-sm text-gray-300">Execution Result</span>
          </div>
          <pre class="text-sm text-gray-100 overflow-x-auto">{{ message.metadata.codeResults }}</pre>
        </div>
      </div>
    </div>

    <!-- Message Footer -->
    <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
      <div class="flex items-center space-x-4">
        <!-- Timestamp -->
        <span>{{ formatTimestamp(message.timestamp) }}</span>
        
        <!-- Token Count -->
        <span v-if="message.metadata?.tokenCount">
          {{ message.metadata.tokenCount }} tokens
        </span>
        
        <!-- Processing Time -->
        <span v-if="message.metadata?.processingTime">
          {{ message.metadata.processingTime }}ms
        </span>
      </div>
      
      <!-- Message Status -->
      <div class="flex items-center space-x-1">
        <CheckIcon v-if="!message.streaming && !message.error" class="w-3 h-3 text-green-500" />
        <ExclamationTriangleIcon v-else-if="message.error" class="w-3 h-3 text-red-500" />
        <div v-else-if="message.streaming" class="w-3 h-3 rounded-full bg-neon-green animate-pulse"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UserIcon,
  CpuChipIcon,
  ClipboardIcon,
  CheckIcon,
  PencilIcon,
  ArrowPathIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CodeBracketIcon,
  DocumentIcon,
  PhotoIcon
} from '@heroicons/vue/24/outline'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

interface Message {
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

const props = defineProps<{
  message: Message
}>()

const emit = defineEmits<{
  edit: [messageId: string]
  delete: [messageId: string]
  regenerate: [messageId: string]
}>()

const mainStore = useMainStore()
const toast = inject('toast')

const copied = ref(false)
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement>()

// Setup marked with syntax highlighting
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  }
}))

const renderedContent = computed(() => {
  if (!props.message.content) return ''
  
  try {
    return marked(props.message.content, {
      breaks: true,
      gfm: true
    })
  } catch (error) {
    console.error('Failed to render markdown:', error)
    return props.message.content
  }
})

const formatTimestamp = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now'
  } else if (diff < 3600000) { // Less than 1 hour
    return `${Math.floor(diff / 60000)}m ago`
  } else if (diff < 86400000) { // Less than 1 day
    return `${Math.floor(diff / 3600000)}h ago`
  } else {
    return timestamp.toLocaleDateString()
  }
}

const getModelName = (modelId: string) => {
  const model = mainStore.availableModels.find(m => m.id === modelId)
  return model?.name || modelId
}

const getAttachmentIcon = (type: string) => {
  switch (type) {
    case 'image': return PhotoIcon
    case 'code': return CodeBracketIcon
    default: return DocumentIcon
  }
}

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    toast('success', 'Copied', 'Message copied to clipboard')
    
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy message:', error)
    toast('error', 'Error', 'Failed to copy message')
  }
}

const exportMessage = () => {
  const blob = new Blob([props.message.content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `message-${props.message.id}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showDropdown.value = false
}

const reportMessage = () => {
  // Implement message reporting
  toast('info', 'Report', 'Message reported for review')
  showDropdown.value = false
}

const downloadAttachment = (attachment: any) => {
  if (attachment.url) {
    window.open(attachment.url, '_blank')
  }
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}
</script>

<style scoped>
.message-bubble {
  @apply p-4 rounded-lg border transition-all duration-200;
}

.message-bubble.user {
  @apply bg-dark-200/50 border-neon-green/30 ml-8;
}

.message-bubble.assistant {
  @apply bg-dark-100/50 border-neon-purple/30 mr-8;
}

.message-bubble.error {
  @apply border-red-500/50;
}

.typing-indicator {
  @apply flex space-x-1;
}

.typing-indicator span {
  @apply w-2 h-2 bg-neon-green rounded-full animate-bounce;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.1s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.2s;
}

/* Code block styling */
:deep(pre) {
  @apply bg-dark-300 border border-dark-400 rounded-lg p-4 overflow-x-auto;
}

:deep(code) {
  @apply bg-dark-300/50 px-1 py-0.5 rounded text-sm;
}

:deep(pre code) {
  @apply bg-transparent px-0 py-0;
}

/* Link styling */
:deep(a) {
  @apply text-neon-blue hover:text-neon-green transition-colors;
}

/* List styling */
:deep(ul), :deep(ol) {
  @apply ml-4;
}

:deep(li) {
  @apply mb-1;
}

/* Table styling */
:deep(table) {
  @apply w-full border-collapse border border-dark-400 rounded-lg overflow-hidden;
}

:deep(th), :deep(td) {
  @apply border border-dark-400 px-3 py-2;
}

:deep(th) {
  @apply bg-dark-300 font-semibold;
}

/* Blockquote styling */
:deep(blockquote) {
  @apply border-l-4 border-neon-green pl-4 ml-4 italic text-gray-300;
}
</style>
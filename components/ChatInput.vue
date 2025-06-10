<!-- components/ChatInput.vue -->
<template>
  <div class="flex-shrink-0 p-4 bg-dark-100 border-t border-dark-300/50">
    <!-- Attachments Preview -->
    <div v-if="attachments.length > 0" class="mb-4">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(attachment, index) in attachments"
          :key="index"
          class="relative bg-dark-200 border border-dark-300 rounded-lg p-3 flex items-center space-x-3 max-w-xs"
        >
          <!-- File Icon -->
          <div class="flex-shrink-0">
            <component 
              :is="getFileIcon(attachment.type)" 
              class="w-6 h-6 text-neon-blue" 
            />
          </div>
          
          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white font-medium truncate">{{ attachment.name }}</p>
            <p class="text-xs text-gray-400">{{ formatFileSize(attachment.size) }}</p>
          </div>
          
          <!-- Remove Button -->
          <button
            @click="removeAttachment(index)"
            class="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="relative">
      <div class="flex items-end space-x-4">
        <!-- Message Input -->
        <div class="flex-1 relative">
          <textarea
            ref="textareaRef"
            v-model="message"
            @keydown="handleKeydown"
            @input="adjustHeight"
            placeholder="Type your message..."
            :disabled="disabled"
            :rows="1"
            class="w-full px-4 py-3 pr-20 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 resize-none overflow-hidden min-h-[48px] max-h-32"
          />
          
          <!-- Character Count -->
          <div 
            v-if="message.length > maxLength * 0.8"
            class="absolute bottom-2 right-16 text-xs"
            :class="message.length > maxLength ? 'text-red-500' : 'text-gray-400'"
          >
            {{ message.length }}/{{ maxLength }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-2">
          <!-- Attachment Button -->
          <div class="relative">
            <input
              ref="fileInputRef"
              type="file"
              multiple
              @change="handleFileSelect"
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.js,.py,.html,.css,.md"
              class="hidden"
            />
            <button
              @click="triggerFileSelect"
              :disabled="disabled"
              class="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Attach Files"
            >
              <PaperClipIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Voice Input Button -->
          <button
            @click="toggleVoiceInput"
            :disabled="disabled"
            :class="[
              'p-2 transition-colors disabled:opacity-50',
              isRecording 
                ? 'text-red-500 animate-pulse' 
                : 'text-gray-400 hover:text-white'
            ]"
            title="Voice Input"
          >
            <MicrophoneIcon class="w-5 h-5" />
          </button>

          <!-- Send Button -->
          <button
            @click="sendMessage"
            :disabled="disabled || (!message.trim() && attachments.length === 0)"
            class="p-2 bg-neon-green text-black rounded-lg hover:bg-neon-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send Message"
          >
            <PaperAirplaneIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Command Suggestions -->
      <div 
        v-if="showSuggestions && filteredSuggestions.length > 0"
        class="absolute bottom-full left-0 right-0 mb-2 bg-dark-200 border border-dark-300 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10"
      >
        <button
          v-for="(suggestion, index) in filteredSuggestions"
          :key="suggestion.command"
          @click="selectSuggestion(suggestion)"
          :class="[
            'w-full px-4 py-2 text-left hover:bg-dark-300 transition-colors flex items-center space-x-3',
            index === selectedSuggestionIndex ? 'bg-dark-300' : ''
          ]"
        >
          <component :is="suggestion.icon" class="w-4 h-4 text-neon-green" />
          <div>
            <div class="text-white text-sm">{{ suggestion.command }}</div>
            <div class="text-gray-400 text-xs">{{ suggestion.description }}</div>
          </div>
        </button>
      </div>

      <!-- Voice Recording Indicator -->
      <div 
        v-if="isRecording"
        class="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span class="text-sm">Recording... ({{ recordingTime }}s)</span>
        <button @click="stopRecording" class="text-white hover:text-gray-200">
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PaperClipIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  CodeBracketIcon,
  SparklesIcon,
  CogIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  file: File
  url?: string
}

interface CommandSuggestion {
  command: string
  description: string
  icon: any
}

const props = defineProps<{
  disabled?: boolean
  sessionId?: string
  maxLength?: number
}>()

const emit = defineEmits<{
  send: [content: string, attachments: Attachment[]]
  attach: [file: File]
}>()

const message = ref('')
const attachments = ref<Attachment[]>([])
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const isRecording = ref(false)
const recordingTime = ref(0)
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(0)
const maxLength = props.maxLength || 4000

let mediaRecorder: MediaRecorder | null = null
let recordingInterval: NodeJS.Timeout | null = null

const commandSuggestions: CommandSuggestion[] = [
  {
    command: '/help',
    description: 'Show available commands',
    icon: QuestionMarkCircleIcon
  },
  {
    command: '/clear',
    description: 'Clear conversation history',
    icon: SparklesIcon
  },
  {
    command: '/model',
    description: 'Change AI model',
    icon: CogIcon
  },
  {
    command: '/export',
    description: 'Export conversation',
    icon: DocumentIcon
  }
]

const filteredSuggestions = computed(() => {
  if (!message.value.startsWith('/')) return []
  
  const query = message.value.slice(1).toLowerCase()
  return commandSuggestions.filter(cmd => 
    cmd.command.slice(1).toLowerCase().includes(query)
  )
})

watch(message, (newValue) => {
  showSuggestions.value = newValue.startsWith('/') && newValue.length > 1
  selectedSuggestionIndex.value = 0
})

const adjustHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 128)}px`
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      // Allow new line
      return
    } else if (showSuggestions.value && filteredSuggestions.value.length > 0) {
      // Select suggestion
      event.preventDefault()
      selectSuggestion(filteredSuggestions.value[selectedSuggestionIndex.value])
    } else {
      // Send message
      event.preventDefault()
      sendMessage()
    }
  } else if (showSuggestions.value) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedSuggestionIndex.value = Math.max(0, selectedSuggestionIndex.value - 1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedSuggestionIndex.value = Math.min(
        filteredSuggestions.value.length - 1,
        selectedSuggestionIndex.value + 1
      )
    } else if (event.key === 'Escape') {
      showSuggestions.value = false
    }
  }
}

const selectSuggestion = (suggestion: CommandSuggestion) => {
  message.value = suggestion.command + ' '
  showSuggestions.value = false
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

const sendMessage = () => {
  if ((message.value.trim() || attachments.value.length > 0) && !props.disabled) {
    emit('send', message.value.trim(), [...attachments.value])
    message.value = ''
    attachments.value = []
    adjustHeight()
  }
}

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files) return

  Array.from(files).forEach(file => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast('error', 'File Too Large', `${file.name} exceeds 10MB limit`)
      return
    }

    const attachment: Attachment = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: getFileType(file),
      file
    }

    attachments.value.push(attachment)
    emit('attach', file)
  })

  // Reset input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const getFileType = (file: File): string => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.includes('text/') || file.name.endsWith('.md')) return 'text'
  if (file.name.match(/\.(js|ts|py|html|css|json)$/)) return 'code'
  return 'document'
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image': return PhotoIcon
    case 'code': return CodeBracketIcon
    default: return DocumentIcon
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const toggleVoiceInput = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    
    const audioChunks: BlobPart[] = []
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      // Here you would typically send the audio to a speech-to-text service
      // For now, we'll just show a placeholder
      message.value += '[Voice message transcribed] '
      adjustHeight()
    }
    
    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    
    recordingInterval = setInterval(() => {
      recordingTime.value++
    }, 1000)
    
  } catch (error) {
    console.error('Failed to start recording:', error)
    toast('error', 'Recording Error', 'Could not access microphone')
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    mediaRecorder.stream.getTracks().forEach(track => track.stop())
    isRecording.value = false
    
    if (recordingInterval) {
      clearInterval(recordingInterval)
      recordingInterval = null
    }
  }
}

onMounted(() => {
  nextTick(() => {
    textareaRef.value?.focus()
  })
})

onUnmounted(() => {
  if (recordingInterval) {
    clearInterval(recordingInterval)
  }
  if (mediaRecorder) {
    mediaRecorder.stream.getTracks().forEach(track => track.stop())
  }
})
</script>
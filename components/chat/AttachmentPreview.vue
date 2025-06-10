<template>
  <div 
    @click="handleClick"
    class="inline-flex items-center space-x-2 px-3 py-2 bg-dark-200/50 rounded-lg border border-dark-300/50 hover:border-neon-green/50 cursor-pointer transition-all"
  >
    <component :is="icon" class="w-5 h-5 text-gray-400" />
    <div class="text-sm">
      <p class="text-white font-medium truncate max-w-xs">{{ attachment.name }}</p>
      <p class="text-gray-500 text-xs">{{ formatSize(attachment.size) }}</p>
    </div>
    
    <!-- Image preview thumbnail -->
    <div v-if="isImage && attachment.url" class="ml-2">
      <img 
        :src="attachment.url" 
        :alt="attachment.name"
        class="w-12 h-12 object-cover rounded"
        loading="lazy"
      />
    </div>
  </div>

  <!-- Full Image Preview Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="showPreview && isImage"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="showPreview = false"
      >
        <div class="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
        
        <div class="relative max-w-4xl max-h-[90vh]">
          <img 
            :src="attachment.url" 
            :alt="attachment.name"
            class="max-w-full max-h-[90vh] object-contain rounded-lg"
            @click.stop
          />
          
          <button
            @click="showPreview = false"
            class="absolute top-4 right-4 p-2 bg-dark-100/80 rounded-lg text-white hover:bg-dark-200 transition-colors"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
          
          <div class="absolute bottom-4 left-4 right-4 p-4 bg-dark-100/80 backdrop-blur-sm rounded-lg">
            <p class="text-white font-medium">{{ attachment.name }}</p>
            <p class="text-gray-400 text-sm">{{ formatSize(attachment.size) }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { 
  DocumentTextIcon,
  PhotoIcon,
  CodeBracketIcon,
  TableCellsIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  attachment: {
    id: string
    type: 'image' | 'document' | 'code'
    name: string
    size: number
    url?: string
    content?: string
  }
}>()

const showPreview = ref(false)

// Computed properties
const isImage = computed(() => props.attachment.type === 'image')

const icon = computed(() => {
  const icons = {
    'image': PhotoIcon,
    'document': DocumentTextIcon,
    'code': CodeBracketIcon
  }
  return icons[props.attachment.type] || DocumentTextIcon
})

// Methods
const handleClick = () => {
  if (isImage.value && props.attachment.url) {
    showPreview.value = true
  } else if (props.attachment.type === 'code' && props.attachment.content) {
    // For code files, we could open a code viewer modal
    // For now, just copy to clipboard
    navigator.clipboard.writeText(props.attachment.content)
    inject('toast')('success', 'Copied', 'Code copied to clipboard')
  } else if (props.attachment.url) {
    // For other files, download them
    downloadFile()
  }
}

const downloadFile = () => {
  if (!props.attachment.url) return
  
  const a = document.createElement('a')
  a.href = props.attachment.url
  a.download = props.attachment.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.9);
}
</style>
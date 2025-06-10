<template>
  <Teleport to="body">
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <div 
        @click.stop
        class="relative w-full max-w-lg bg-dark-100 rounded-xl border border-neon-green/50 shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-dark-300/50">
          <h2 class="text-xl font-bold text-white">Add Attachments</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Drop Zone -->
          <div
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            @dragleave="isDragging = false"
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
              isDragging 
                ? 'border-neon-green bg-neon-green/10' 
                : 'border-dark-300 hover:border-neon-green/50'
            ]"
          >
            <CloudArrowUpIcon class="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p class="text-white font-medium mb-2">Drop files here or click to browse</p>
            <p class="text-gray-400 text-sm mb-4">Support for images, documents, and code files</p>
            
            <input
              ref="fileInput"
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.csv,.json,.js,.ts,.py,.java,.cpp,.c,.h,.css,.html"
              @change="handleFileSelect"
              class="hidden"
            />
            
            <button
              @click="fileInput?.click()"
              class="cyber-button text-sm"
            >
              Browse Files
            </button>
          </div>

          <!-- Selected Files -->
          <div v-if="selectedFiles.length > 0" class="mt-6">
            <h3 class="text-white font-medium mb-3">Selected Files</h3>
            <div class="space-y-2">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="flex items-center justify-between p-3 bg-dark-200 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <component :is="getFileIcon(file.type)" class="w-5 h-5 text-gray-400" />
                  <div>
                    <p class="text-white text-sm font-medium">{{ file.name }}</p>
                    <p class="text-gray-400 text-xs">{{ formatFileSize(file.size) }}</p>
                  </div>
                </div>
                <button
                  @click="removeFile(index)"
                  class="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- File Type Info -->
          <div class="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <div class="flex items-start space-x-3">
              <InformationCircleIcon class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div class="text-sm">
                <p class="text-blue-400 font-medium mb-1">Supported File Types</p>
                <ul class="text-gray-300 space-y-1">
                  <li>• Images: JPG, PNG, GIF, WebP</li>
                  <li>• Documents: PDF, TXT, MD, DOC, DOCX</li>
                  <li>• Data: CSV, JSON, XLS, XLSX</li>
                  <li>• Code: JS, TS, PY, JAVA, C++, HTML, CSS</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end space-x-3 p-6 border-t border-dark-300/50">
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleAttach"
            :disabled="selectedFiles.length === 0"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              selectedFiles.length > 0
                ? 'bg-neon-green text-black hover:bg-neon-green/80'
                : 'bg-dark-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            Attach {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'File' : 'Files' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { 
  XMarkIcon,
  CloudArrowUpIcon,
  TrashIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  CodeBracketIcon,
  TableCellsIcon
} from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  close: []
  attach: [files: File[]]
}>()

// State
const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])
const isDragging = ref(false)

// Methods
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  
  const files = Array.from(e.dataTransfer?.files || [])
  addFiles(files)
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addFiles(files)
}

const addFiles = (files: File[]) => {
  // Filter and validate files
  const validFiles = files.filter(file => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      inject('toast')('error', 'File too large', `${file.name} exceeds 10MB limit`)
      return false
    }
    
    // Check if already selected
    if (selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      return false
    }
    
    return true
  })
  
  selectedFiles.value.push(...validFiles)
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const handleAttach = () => {
  if (selectedFiles.value.length > 0) {
    emit('attach', selectedFiles.value)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return PhotoIcon
  if (type === 'application/pdf' || type.includes('document')) return DocumentTextIcon
  if (type.includes('sheet') || type === 'text/csv') return TableCellsIcon
  if (type.includes('json') || type.includes('javascript') || type.includes('typescript')) return CodeBracketIcon
  return DocumentTextIcon
}
</script>
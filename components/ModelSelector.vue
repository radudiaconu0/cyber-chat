<template>
  <div class="relative">
    <button
      @click="showModal = !showModal"
      class="flex items-center space-x-2 px-4 py-2 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors border border-dark-300/50 hover:border-neon-green/50"
    >
      <CpuChipIcon class="w-5 h-5 text-neon-green" />
      <span class="text-sm font-medium text-white">{{ currentModel?.name || 'Select Model' }}</span>
      <ChevronDownIcon class="w-4 h-4 text-gray-400" />
    </button>

    <!-- Model Selection Modal -->
    <Transition name="modal">
      <div 
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="showModal = false"
      >
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        
        <div 
          @click.stop
          class="relative w-full max-w-3xl max-h-[80vh] overflow-hidden bg-dark-100 rounded-xl border border-neon-green/50 shadow-2xl"
        >
          <!-- Header -->
          <div class="p-6 border-b border-dark-300/50">
            <h2 class="text-2xl font-bold text-white mb-2">Select AI Model</h2>
            <p class="text-gray-400">Choose the best model for your needs</p>
          </div>

          <!-- Search -->
          <div class="p-4 border-b border-dark-300/50">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search models..."
                class="w-full pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="p-4 border-b border-dark-300/50">
            <div class="flex items-center space-x-4">
              <button
                v-for="filter in filters"
                :key="filter.id"
                @click="toggleFilter(filter.id)"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  activeFilters.includes(filter.id)
                    ? 'bg-neon-green text-black'
                    : 'bg-dark-200 text-gray-400 hover:text-white'
                ]"
              >
                <component :is="filter.icon" class="w-4 h-4 inline mr-1" />
                {{ filter.label }}
              </button>
            </div>
          </div>

          <!-- Models List -->
          <div class="overflow-y-auto max-h-[50vh] p-4">
            <div class="space-y-3">
              <div
                v-for="model in filteredModels"
                :key="model.id"
                @click="selectModel(model)"
                :class="[
                  'p-4 rounded-lg cursor-pointer transition-all duration-200',
                  'hover:bg-dark-200 hover:border-neon-green/30',
                  model.id === mainStore.selectedModel
                    ? 'bg-dark-200 border-2 border-neon-green'
                    : 'bg-dark-100 border border-dark-300/50'
                ]"
              >
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h3 class="text-lg font-semibold text-white">{{ model.name }}</h3>
                    <p class="text-sm text-gray-500">{{ model.provider }}</p>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-gray-400">Context: {{ formatTokens(model.contextLength) }}</div>
                    <div class="text-xs text-gray-500">${{ model.inputPrice }}/${{ model.outputPrice }} per 1M</div>
                  </div>
                </div>

                <p class="text-sm text-gray-400 mb-3">{{ model.description }}</p>

                <!-- Capabilities -->
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="capability in model.capabilities"
                    :key="capability"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="getCapabilityClass(capability)"
                  >
                    <component :is="getCapabilityIcon(capability)" class="w-3 h-3 mr-1" />
                    {{ capability }}
                  </span>
                </div>

                <!-- Special badges -->
                <div class="mt-3 flex items-center space-x-2">
                  <span v-if="model.reasoning" class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                    <BeakerIcon class="w-3 h-3 inline mr-1" />
                    Reasoning
                  </span>
                  <span v-if="model.vision" class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                    <EyeIcon class="w-3 h-3 inline mr-1" />
                    Vision
                  </span>
                  <span v-if="model.webSearch" class="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center">
                    <GlobeAltIcon class="w-3 h-3 mr-1" />
                    Web Search
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-dark-300/50 bg-dark-100/50">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-400">
                Selected: <span class="text-neon-green font-medium">{{ currentModel?.name }}</span>
              </p>
              <button
                @click="showModal = false"
                class="px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '~/stores/main'
import { 
  CpuChipIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
  GlobeAltIcon,
  EyeIcon,
  CodeBracketIcon,
  LanguageIcon,
  DocumentTextIcon,
  PhotoIcon,
  MusicalNoteIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

const mainStore = useMainStore()

// State
const showModal = ref(false)
const searchQuery = ref('')
const activeFilters = ref<string[]>([])

// Filters configuration
const filters = [
  { id: 'reasoning', label: 'Reasoning', icon: BeakerIcon },
  { id: 'vision', label: 'Vision', icon: EyeIcon },
  { id: 'webSearch', label: 'Web Search', icon: GlobeAltIcon },
  { id: 'code', label: 'Code', icon: CodeBracketIcon }
]

// Computed
const currentModel = computed(() => mainStore.currentModel)

const filteredModels = computed(() => {
  let models = mainStore.availableModels

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    models = models.filter(model => 
      model.name.toLowerCase().includes(query) ||
      model.provider.toLowerCase().includes(query) ||
      model.description.toLowerCase().includes(query)
    )
  }

  // Apply capability filters
  if (activeFilters.value.length > 0) {
    models = models.filter(model => {
      return activeFilters.value.every(filter => {
        if (filter === 'reasoning') return model.reasoning
        if (filter === 'vision') return model.vision
        if (filter === 'webSearch') return model.webSearch
        if (filter === 'code') return model.capabilities.includes('code')
        return true
      })
    })
  }

  return models
})

// Methods
const selectModel = (model: any) => {
  mainStore.setModel(model.id)
  showModal.value = false
}

const toggleFilter = (filterId: string) => {
  const index = activeFilters.value.indexOf(filterId)
  if (index > -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(filterId)
  }
}

const formatTokens = (tokens: number) => {
  if (tokens < 1000) return tokens.toString()
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(0)}K`
  return `${(tokens / 1000000).toFixed(1)}M`
}

const getCapabilityIcon = (capability: string) => {
  const icons: Record<string, any> = {
    'text': DocumentTextIcon,
    'code': CodeBracketIcon,
    'vision': EyeIcon,
    'images': PhotoIcon,
    'web': GlobeAltIcon,
    'reasoning': BeakerIcon,
    'multilingual': LanguageIcon,
    'audio': MusicalNoteIcon,
    'analysis': ChartBarIcon
  }
  return icons[capability] || DocumentTextIcon
}

const getCapabilityClass = (capability: string) => {
  const classes: Record<string, string> = {
    'text': 'bg-gray-500/20 text-gray-400',
    'code': 'bg-blue-500/20 text-blue-400',
    'vision': 'bg-purple-500/20 text-purple-400',
    'images': 'bg-pink-500/20 text-pink-400',
    'web': 'bg-green-500/20 text-green-400',
    'reasoning': 'bg-yellow-500/20 text-yellow-400',
    'multilingual': 'bg-indigo-500/20 text-indigo-400',
    'audio': 'bg-orange-500/20 text-orange-400',
    'analysis': 'bg-cyan-500/20 text-cyan-400'
  }
  return classes[capability] || 'bg-gray-500/20 text-gray-400'
}

// Close modal on escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showModal.value) {
      showModal.value = false
    }
  }
  window.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
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
  transform: scale(0.9) translateY(20px);
}
</style>
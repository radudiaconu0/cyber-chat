<!-- components/ModelSelector.vue -->
<template>
  <div class="relative" ref="dropdownRef">
    <!-- Model Selector Button -->
    <button
      @click="toggleDropdown"
      :disabled="mainStore.modelsLoading"
      class="flex items-center space-x-2 px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg hover:border-neon-green/50 transition-colors disabled:opacity-50"
    >
      <!-- Model Icon -->
      <CpuChipIcon class="w-4 h-4 text-neon-green" />
      
      <!-- Current Model Display -->
      <div class="flex flex-col items-start min-w-0">
        <span class="text-white text-sm font-medium truncate max-w-32">
          {{ currentModelDisplay.name }}
        </span>
        <span class="text-xs text-gray-400 truncate max-w-32">
          {{ currentModelDisplay.category }}
        </span>
      </div>
      
      <!-- Loading/Dropdown Icon -->
      <div class="flex-shrink-0">
        <div v-if="mainStore.modelsLoading" class="w-4 h-4">
          <div class="loading-spinner-small"></div>
        </div>
        <ChevronDownIcon 
          v-else
          :class="[
            'w-4 h-4 text-gray-400 transition-transform',
            showDropdown ? 'rotate-180' : ''
          ]" 
        />
      </div>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div 
        v-if="showDropdown && !mainStore.modelsLoading"
        class="absolute top-full right-0 mt-2 w-80 bg-dark-200 border border-dark-300 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden"
      >
        <!-- Search -->
        <div class="p-3 border-b border-dark-300/50">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              placeholder="Search models..."
              class="w-full pl-10 pr-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 text-sm"
            />
          </div>
        </div>

        <!-- Refresh Button -->
        <div class="px-3 py-2 border-b border-dark-300/50 flex items-center justify-between">
          <span class="text-xs text-gray-400">
            {{ mainStore.availableModels.length }} models available
          </span>
          <button
            @click="refreshModels"
            :disabled="refreshing"
            class="text-xs text-neon-green hover:text-neon-green/80 transition-colors disabled:opacity-50 flex items-center space-x-1"
          >
            <ArrowPathIcon 
              :class="[
                'w-3 h-3',
                refreshing ? 'animate-spin' : ''
              ]" 
            />
            <span>{{ refreshing ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
        </div>

        <!-- Model Categories -->
        <div class="overflow-y-auto max-h-80">
          <!-- Featured Models -->
          <div v-if="featuredModels.length > 0 && !searchQuery" class="p-3">
            <h3 class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Featured</h3>
            <div class="space-y-1">
              <ModelItem
                v-for="model in featuredModels"
                :key="model.id"
                :model="model"
                :is-selected="model.id === selectedModelId"
                @select="selectModel"
              />
            </div>
          </div>

          <!-- All Models by Category -->
          <div v-for="(models, category) in filteredModelsByCategory" :key="category" class="p-3">
            <h3 class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              {{ formatCategoryName(category) }}
            </h3>
            <div class="space-y-1">
              <ModelItem
                v-for="model in models"
                :key="model.id"
                :model="model"
                :is-selected="model.id === selectedModelId"
                @select="selectModel"
              />
            </div>
          </div>

          <!-- No Results -->
          <div v-if="Object.keys(filteredModelsByCategory).length === 0" class="p-6 text-center">
            <MagnifyingGlassIcon class="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p class="text-gray-400 text-sm">No models found</p>
            <p class="text-gray-500 text-xs mt-1">Try adjusting your search</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-dark-300/50 bg-dark-100/50">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>Last updated: {{ lastUpdatedText }}</span>
            <a 
              href="https://openrouter.ai" 
              target="_blank" 
              class="text-neon-green hover:text-neon-green/80 transition-colors"
            >
              Powered by OpenRouter
            </a>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error State -->
    <div 
      v-if="mainStore.modelsError && showDropdown"
      class="absolute top-full right-0 mt-2 w-80 bg-dark-200 border border-red-500/50 rounded-lg shadow-xl z-50 p-4"
    >
      <div class="flex items-start space-x-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-red-400 text-sm font-medium">Failed to load models</p>
          <p class="text-gray-400 text-xs mt-1">{{ mainStore.modelsError }}</p>
          <button
            @click="retryLoadModels"
            class="mt-2 text-xs text-neon-green hover:text-neon-green/80 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CpuChipIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const mainStore = useMainStore()
const dropdownRef = ref<HTMLElement>()
const showDropdown = ref(false)
const searchQuery = ref('')
const refreshing = ref(false)

// Initialize models on mount
onMounted(async () => {
  await mainStore.initializeModels()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const selectedModelId = computed(() => {
  return props.modelValue || mainStore.currentChat?.model || mainStore.chatSettings.defaultModel
})

const currentModelDisplay = computed(() => {
  const model = mainStore.getModelById(selectedModelId.value)
  if (model) {
    return {
      name: model.name,
      category: model.category
    }
  }
  return {
    name: selectedModelId.value.split('/').pop() || 'Unknown Model',
    category: 'unknown'
  }
})

const featuredModels = computed(() => {
  if (searchQuery.value) return []
  return mainStore.featuredModels.slice(0, 5) // Show top 5 featured
})

const filteredModelsByCategory = computed(() => {
  let models = mainStore.availableModels
  
  if (searchQuery.value) {
    models = mainStore.searchModels(searchQuery.value)
  }
  
  // Group by category, excluding featured if showing featured section
  const filtered = models.filter(model => 
    searchQuery.value || !model.featured
  )
  
  return filtered.reduce((acc, model) => {
    if (!acc[model.category]) acc[model.category] = []
    acc[model.category].push(model)
    return acc
  }, {} as Record<string, any[]>)
})

const lastUpdatedText = computed(() => {
  if (!mainStore.modelsLastFetched) return 'Never'
  const diff = Date.now() - mainStore.modelsLastFetched.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    searchQuery.value = ''
  }
}

const selectModel = (modelId: string) => {
  emit('update:modelValue', modelId)
  
  // Update current chat model if we're in a chat
  if (mainStore.currentChat) {
    mainStore.updateChatSession(mainStore.currentChat.id, { model: modelId })
  }
  
  // Update default model in settings
  mainStore.updateChatSettings({ defaultModel: modelId })
  
  showDropdown.value = false
}

const refreshModels = async () => {
  refreshing.value = true
  try {
    await mainStore.refreshModels()
  } finally {
    refreshing.value = false
  }
}

const retryLoadModels = async () => {
  await mainStore.fetchModels(true)
}

const formatCategoryName = (category: string) => {
  return category.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}
</script>

<script lang="ts">
// ModelItem component definition
export const ModelItem = defineComponent({
  props: {
    model: {
      type: Object as PropType<any>,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select'],
  template: `
    <button
      @click="$emit('select', model.id)"
      :class="[
        'w-full text-left p-2 rounded-lg transition-colors group',
        isSelected 
          ? 'bg-neon-green/20 border border-neon-green/50' 
          : 'hover:bg-dark-300 border border-transparent'
      ]"
    >
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <h4 :class="[
              'font-medium text-sm truncate',
              isSelected ? 'text-neon-green' : 'text-white group-hover:text-white'
            ]">
              {{ model.name }}
            </h4>
            <div v-if="model.featured" class="flex-shrink-0">
              <span class="px-1.5 py-0.5 bg-neon-green/20 text-neon-green text-xs rounded font-medium">
                Featured
              </span>
            </div>
          </div>
          <p class="text-gray-400 text-xs mt-1 line-clamp-2">
            {{ model.description }}
          </p>
          <div class="flex items-center space-x-3 mt-2">
            <span class="text-xs text-gray-500">
              {{ formatNumber(model.contextLength) }} ctx
            </span>
            <span class="text-xs text-gray-500">
              Hello
            </span>
          </div>
          <div class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="capability in model.capabilities.slice(0, 3)"
              :key="capability"
              class="px-1.5 py-0.5 bg-dark-100 text-gray-400 text-xs rounded"
            >
              {{ capability }}
            </span>
            <span
              v-if="model.capabilities.length > 3"
              class="px-1.5 py-0.5 bg-dark-100 text-gray-400 text-xs rounded"
            >
              +{{ model.capabilities.length - 3 }}
            </span>
          </div>
        </div>
      </div>
    </button>
  `,
  setup() {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toString()
    }

    return {
      formatNumber
    }
  }
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.loading-spinner-small {
  @apply w-4 h-4 border-2 border-gray-600 border-t-neon-green rounded-full animate-spin;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
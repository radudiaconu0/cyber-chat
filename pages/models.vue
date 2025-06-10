<!-- pages/models.vue -->
<template>
  <div class="max-w-7xl mx-auto p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-white font-display mb-2">AI Models</h1>
          <p class="text-gray-400">
            Explore {{ mainStore.availableModels.length }} available AI models from leading providers
          </p>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Refresh Button -->
          <button
            @click="refreshModels"
            :disabled="mainStore.modelsLoading || refreshing"
            class="flex items-center space-x-2 px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg hover:border-neon-green/50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon 
              :class="[
                'w-4 h-4',
                (mainStore.modelsLoading || refreshing) ? 'animate-spin' : ''
              ]" 
            />
            <span>{{ mainStore.modelsLoading || refreshing ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
          
          <!-- Back Button -->
          <NuxtLink to="/" class="cyber-button">
            <ArrowLeftIcon class="w-4 h-4 mr-2" />
            Back
          </NuxtLink>
        </div>
      </div>
      
      <!-- Last Updated -->
      <div class="flex items-center space-x-2 text-sm text-gray-400 mt-4">
        <ClockIcon class="w-4 h-4" />
        <span>Last updated: {{ lastUpdatedText }}</span>
        <span v-if="mainStore.modelsError" class="text-red-400">• {{ mainStore.modelsError }}</span>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-dark-200 border border-dark-300 rounded-lg p-6 mb-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="lg:col-span-2">
          <label class="block text-sm font-medium text-gray-300 mb-2">Search Models</label>
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              placeholder="Search by name, description, or capabilities..."
              class="w-full pl-10 pr-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
            />
          </div>
        </div>
        
        <!-- Category Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            v-model="selectedCategory"
            class="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
          >
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ formatCategoryName(category) }}
            </option>
          </select>
        </div>
        
        <!-- Sort By -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
          <select
            v-model="sortBy"
            class="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
          >
            <option value="featured">Featured First</option>
            <option value="name">Name A-Z</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="context">Context Length</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>
      
      <!-- Quick Filters -->
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="filter in quickFilters"
          :key="filter.key"
          @click="toggleQuickFilter(filter.key)"
          :class="[
            'px-3 py-1 text-sm rounded-lg border transition-colors',
            activeQuickFilters.includes(filter.key)
              ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
              : 'bg-dark-300 border-dark-400 text-gray-300 hover:border-gray-400'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="mainStore.modelsLoading && mainStore.availableModels.length === 0" class="text-center py-12">
      <div class="loading-spinner mx-auto mb-4"></div>
      <p class="text-gray-400">Loading models from OpenRouter...</p>
    </div>

    <!-- Models Grid -->
    <div v-else-if="filteredAndSortedModels.length > 0">
      <!-- Stats -->
      <div class="flex items-center justify-between mb-6">
        <p class="text-gray-400">
          Showing {{ filteredAndSortedModels.length }} of {{ mainStore.availableModels.length }} models
        </p>
        
        <!-- View Toggle -->
        <div class="flex items-center space-x-2">
          <button
            @click="viewMode = 'grid'"
            :class="[
              'p-2 rounded border transition-colors',
              viewMode === 'grid' 
                ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
                : 'border-dark-400 text-gray-400 hover:text-white'
            ]"
          >
            <Squares2X2Icon class="w-4 h-4" />
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'p-2 rounded border transition-colors',
              viewMode === 'list' 
                ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
                : 'border-dark-400 text-gray-400 hover:text-white'
            ]"
          >
            <ListBulletIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <!-- Grid View -->
      <div 
        v-if="viewMode === 'grid'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <ModelCard
          v-for="model in filteredAndSortedModels"
          :key="model.id"
          :model="model"
          @start-chat="startChatWithModel"
          @set-default="setAsDefault"
        />
      </div>
      
      <!-- List View -->
      <div v-else class="space-y-4">
        <ModelListItem
          v-for="model in filteredAndSortedModels"
          :key="model.id"
          :model="model"
          @start-chat="startChatWithModel"
          @set-default="setAsDefault"
        />
      </div>
    </div>

    <!-- No Results -->
    <div v-else class="text-center py-12">
      <MagnifyingGlassIcon class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 class="text-xl font-semibold text-white mb-2">No models found</h3>
      <p class="text-gray-400 mb-6">Try adjusting your search criteria or filters</p>
      <button
        @click="clearFilters"
        class="cyber-button"
      >
        Clear Filters
      </button>
    </div>

    <!-- Model Details Modal -->
    <ModelDetailsModal
      v-if="selectedModel"
      :model="selectedModel"
      @close="selectedModel = null"
      @start-chat="startChatWithModel"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'default'
})

const mainStore = useMainStore()
const router = useRouter()
const supabase = useSupabaseClient()
const toast = inject('toast')

const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('featured')
const viewMode = ref<'grid' | 'list'>('grid')
const activeQuickFilters = ref<string[]>([])
const refreshing = ref(false)
const selectedModel = ref<any>(null)

const quickFilters = [
  { key: 'featured', label: 'Featured' },
  { key: 'vision', label: 'Vision' },
  { key: 'tools', label: 'Function Calling' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'web-search', label: 'Web Search' },
  { key: 'free', label: 'Free Tier' },
  { key: 'high-context', label: 'High Context (100K+)' }
]

// Initialize models on mount
onMounted(async () => {
  if (mainStore.availableModels.length === 0) {
    await mainStore.initializeModels()
  }
})

const categories = computed(() => {
  const cats = [...new Set(mainStore.availableModels.map(m => m.category))]
  return cats.sort()
})

const lastUpdatedText = computed(() => {
  if (!mainStore.modelsLastFetched) return 'Never'
  const diff = Date.now() - mainStore.modelsLastFetched.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`
})

const filteredAndSortedModels = computed(() => {
  let models = mainStore.availableModels

  // Apply search
  if (searchQuery.value) {
    models = mainStore.searchModels(searchQuery.value)
  }

  // Apply category filter
  if (selectedCategory.value) {
    models = models.filter(m => m.category === selectedCategory.value)
  }

  // Apply quick filters
  models = models.filter(model => {
    return activeQuickFilters.value.every(filter => {
      switch (filter) {
        case 'featured':
          return model.featured
        case 'vision':
          return model.capabilities.includes('vision')
        case 'tools':
          return model.capabilities.includes('tools')
        case 'reasoning':
          return model.capabilities.includes('reasoning')
        case 'web-search':
          return model.capabilities.includes('web-search')
        case 'free':
          return model.pricing.prompt === 0 && model.pricing.completion === 0
        case 'high-context':
          return model.contextLength >= 100000
        default:
          return true
      }
    })
  })

  // Apply sorting
  models = [...models].sort((a, b) => {
    switch (sortBy.value) {
      case 'featured':
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return a.name.localeCompare(b.name)
      case 'name':
        return a.name.localeCompare(b.name)
      case 'price-low':
        return (a.pricing.prompt + a.pricing.completion) - (b.pricing.prompt + b.pricing.completion)
      case 'price-high':
        return (b.pricing.prompt + b.pricing.completion) - (a.pricing.prompt + a.pricing.completion)
      case 'context':
        return b.contextLength - a.contextLength
      case 'newest':
        return b.created - a.created
      default:
        return 0
    }
  })

  return models
})

const toggleQuickFilter = (filterKey: string) => {
  const index = activeQuickFilters.value.indexOf(filterKey)
  if (index > -1) {
    activeQuickFilters.value.splice(index, 1)
  } else {
    activeQuickFilters.value.push(filterKey)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  activeQuickFilters.value = []
  sortBy.value = 'featured'
}

const formatCategoryName = (category: string) => {
  return category.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const refreshModels = async () => {
  refreshing.value = true
  try {
    await mainStore.refreshModels()
    toast('success', 'Success', 'Models refreshed successfully')
  } catch (error) {
    toast('error', 'Error', 'Failed to refresh models')
  } finally {
    refreshing.value = false
  }
}

const startChatWithModel = async (modelId: string) => {
  try {
    const model = mainStore.getModelById(modelId)
    const newSession = {
      id: crypto.randomUUID(),
      title: `Chat with ${model?.name || 'AI'}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: modelId,
      tokenCount: 0,
      archived: false,
      shared: false,
      shareId: null
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        id: newSession.id,
        user_id: mainStore.user?.id,
        title: newSession.title,
        model: newSession.model
      })
      .select()
      .single()

    if (error) throw error

    mainStore.addChatSession(newSession)
    selectedModel.value = null
    router.push(`/chat/${newSession.id}`)
  } catch (error) {
    console.error('Failed to create chat:', error)
    toast('error', 'Error', 'Failed to create chat')
  }
}

const setAsDefault = (modelId: string) => {
  mainStore.updateChatSettings({ defaultModel: modelId })
  toast('success', 'Success', 'Default model updated')
}

// SEO
useHead({
  title: 'AI Models - CyberChat',
  meta: [
    { name: 'description', content: 'Browse and compare AI models from leading providers. Choose the perfect model for your needs.' }
  ]
})
</script>

<style scoped>
.loading-spinner {
  @apply w-8 h-8 border-4 border-gray-600 border-t-neon-green rounded-full animate-spin;
}
</style>
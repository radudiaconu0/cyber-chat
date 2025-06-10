<!-- components/models/ModelCard.vue -->
<template>
  <div class="bg-dark-200 border border-dark-300 rounded-lg p-6 hover:border-neon-green/50 transition-all duration-300 group">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 mb-2">
          <h3 class="text-white font-semibold truncate group-hover:text-neon-green transition-colors">
            {{ model.name }}
          </h3>
          <span v-if="model.featured" class="px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded font-medium">
            Featured
          </span>
        </div>
        <p class="text-gray-400 text-sm line-clamp-2 mb-3">
          {{ model.description }}
        </p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <div class="text-xs text-gray-500 mb-1">Context Length</div>
        <div class="text-white font-medium">{{ formatNumber(model.contextLength) }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-500 mb-1">Pricing (1M tokens)</div>
        <div class="text-white font-medium">
          ${{ model.pricing.prompt.toFixed(2) }}/${{ model.pricing.completion.toFixed(2) }}
        </div>
      </div>
    </div>

    <!-- Capabilities -->
    <div class="mb-4">
      <div class="text-xs text-gray-500 mb-2">Capabilities</div>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="capability in model.capabilities.slice(0, 4)"
          :key="capability"
          class="px-2 py-1 bg-dark-100 text-gray-300 text-xs rounded"
        >
          {{ capability }}
        </span>
        <span
          v-if="model.capabilities.length > 4"
          class="px-2 py-1 bg-dark-100 text-gray-400 text-xs rounded"
        >
          +{{ model.capabilities.length - 4 }}
        </span>
      </div>
    </div>

    <!-- Provider Info -->
    <div class="mb-4 text-xs text-gray-500">
      <div class="flex items-center justify-between">
        <span>{{ getProviderName(model.id) }}</span>
        <span>{{ formatCategory(model.category) }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center space-x-2">
      <button
        @click="$emit('start-chat', model.id)"
        class="flex-1 cyber-button text-sm"
      >
        Start Chat
      </button>
      <button
        @click="$emit('set-default', model.id)"
        class="px-3 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition-colors text-sm"
        title="Set as default"
      >
        <StarIcon class="w-4 h-4" />
      </button>
      <button
        @click="showDetails = true"
        class="px-3 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition-colors text-sm"
        title="View details"
      >
        <InformationCircleIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Details Modal -->
    <ModelDetailsModal
      v-if="showDetails"
      :model="model"
      @close="showDetails = false"
      @start-chat="(id) => { showDetails = false; $emit('start-chat', id) }"
    />
  </div>
</template>

<script setup lang="ts">
import { StarIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

defineProps<{
  model: any
}>()

defineEmits<{
  'start-chat': [modelId: string]
  'set-default': [modelId: string]
}>()

const showDetails = ref(false)

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const getProviderName = (modelId: string) => {
  const provider = modelId.split('/')[0]
  const providerNames: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'meta-llama': 'Meta',
    'perplexity': 'Perplexity',
    'cohere': 'Cohere',
    'mistralai': 'Mistral AI'
  }
  return providerNames[provider] || provider
}

const formatCategory = (category: string) => {
  return category.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
</script>

<script setup lang="ts">
// ModelListItem component
const ModelListItem = defineComponent({
  props: {
    model: Object as PropType<any>
  },
  emits: ['start-chat', 'set-default'],
  template: `
    <div class="bg-dark-200 border border-dark-300 rounded-lg p-6 hover:border-neon-green/50 transition-colors">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-3 mb-2">
            <h3 class="text-white font-semibold">{{ model.name }}</h3>
            <span v-if="model.featured" class="px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded font-medium">
              Featured
            </span>
            <span class="px-2 py-1 bg-dark-100 text-gray-400 text-xs rounded">
              {{ getProviderName(model.id) }}
            </span>
          </div>
          <p class="text-gray-400 text-sm mb-3 max-w-2xl">{{ model.description }}</p>
          
          <div class="flex items-center space-x-6 text-sm">
            <div>
              <span class="text-gray-500">Context:</span>
              <span class="text-white ml-2">{{ formatNumber(model.contextLength) }} tokens</span>
            </div>
            <div>
              <span class="text-gray-500">Pricing:</span>
              <span class="text-white ml-2">$\\{{ model.pricing.prompt.toFixed(2) }}/$\\{{ model.pricing.completion.toFixed(2) }}/1M</span>
            </div>
            <div>
              <span class="text-gray-500">Category:</span>
              <span class="text-white ml-2">{{ formatCategory(model.category) }}</span>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2 mt-3">
            <span
              v-for="capability in model.capabilities"
              :key="capability"
              class="px-2 py-1 bg-dark-100 text-gray-300 text-xs rounded"
            >
              {{ capability }}
            </span>
          </div>
        </div>
        
        <div class="flex items-center space-x-2 ml-6">
          <button
            @click="$emit('start-chat', model.id)"
            class="cyber-button text-sm"
          >
            Start Chat
          </button>
          <button
            @click="$emit('set-default', model.id)"
            class="px-3 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition-colors"
            title="Set as default"
          >
            <StarIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  `,
  setup(props) {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toString()
    }

    const getProviderName = (modelId: string) => {
      const provider = modelId.split('/')[0]
      const providerNames: Record<string, string> = {
        'openai': 'OpenAI',
        'anthropic': 'Anthropic',
        'google': 'Google',
        'meta-llama': 'Meta',
        'perplexity': 'Perplexity',
        'cohere': 'Cohere',
        'mistralai': 'Mistral AI'
      }
      return providerNames[provider] || provider
    }

    const formatCategory = (category: string) => {
      return category.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return {
      formatNumber,
      getProviderName,
      formatCategory
    }
  }
})

// ModelDetailsModal component
const ModelDetailsModal = defineComponent({
  props: {
    model: Object as PropType<any>
  },
  emits: ['close', 'start-chat'],
  template: `
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-dark-200 border border-dark-300 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-dark-300/50">
          <div class="flex items-center space-x-3">
            <h2 class="text-xl font-bold text-white">{{ model.name }}</h2>
            <span v-if="model.featured" class="px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded font-medium">
              Featured
            </span>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="p-6">
          <!-- Description -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-2">Description</h3>
            <p class="text-gray-300">{{ model.description }}</p>
          </div>

          <!-- Key Specs -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div class="bg-dark-300 rounded-lg p-4">
              <div class="text-neon-green text-2xl font-bold">{{ formatNumber(model.contextLength) }}</div>
              <div class="text-gray-400 text-sm">Context Length</div>
            </div>
            <div class="bg-dark-300 rounded-lg p-4">
              <div class="text-neon-blue text-2xl font-bold">{{ formatNumber(model.maxCompletionTokens) }}</div>
              <div class="text-gray-400 text-sm">Max Output</div>
            </div>
            <div class="bg-dark-300 rounded-lg p-4">
              <div class="text-neon-purple text-2xl font-bold">$\\{{ model.pricing.prompt.toFixed(3) }}</div>
              <div class="text-gray-400 text-sm">Input Price/1M</div>
            </div>
            <div class="bg-dark-300 rounded-lg p-4">
              <div class="text-neon-pink text-2xl font-bold">$\\{{ model.pricing.completion.toFixed(3) }}</div>
              <div class="text-gray-400 text-sm">Output Price/1M</div>
            </div>
          </div>

          <!-- Capabilities -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-3">Capabilities</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="capability in model.capabilities"
                :key="capability"
                class="px-3 py-2 bg-neon-green/20 text-neon-green rounded-lg text-sm font-medium"
              >
                {{ capability }}
              </span>
            </div>
          </div>

          <!-- Technical Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 class="text-white font-medium mb-3">Architecture</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Tokenizer:</span>
                  <span class="text-white">{{ model.architecture.tokenizer }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Instruction Type:</span>
                  <span class="text-white">{{ model.architecture.instructType || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Input Modalities:</span>
                  <span class="text-white">{{ model.architecture.inputModalities.join(', ') }}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="text-white font-medium mb-3">Provider Info</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Provider:</span>
                  <span class="text-white">{{ getProviderName(model.id) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Category:</span>
                  <span class="text-white">{{ formatCategory(model.category) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Moderated:</span>
                  <span class="text-white">{{ model.provider.isModerated ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Supported Parameters -->
          <div class="mb-6">
            <h4 class="text-white font-medium mb-3">Supported Parameters</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="param in model.supportedParameters"
                :key="param"
                class="px-2 py-1 bg-dark-100 text-gray-300 rounded text-sm"
              >
                {{ param }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-4">
            <button
              @click="$emit('start-chat', model.id)"
              class="cyber-button"
            >
              Start Chat with {{ model.name }}
            </button>
            <button
              @click="$emit('close')"
              class="px-4 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toString()
    }

    const getProviderName = (modelId: string) => {
      const provider = modelId.split('/')[0]
      const providerNames: Record<string, string> = {
        'openai': 'OpenAI',
        'anthropic': 'Anthropic',
        'google': 'Google',
        'meta-llama': 'Meta',
        'perplexity': 'Perplexity',
        'cohere': 'Cohere',
        'mistralai': 'Mistral AI'
      }
      return providerNames[provider] || provider
    }

    const formatCategory = (category: string) => {
      return category.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return {
      formatNumber,
      getProviderName,
      formatCategory
    }
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
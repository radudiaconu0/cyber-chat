<template>
  <div class="mt-4 p-4 bg-dark-200/50 rounded-lg border border-neon-green/20">
    <div class="flex items-center space-x-2 mb-3">
      <GlobeAltIcon class="w-5 h-5 text-neon-green" />
      <h4 class="text-sm font-medium text-white">Web Search Results</h4>
    </div>
    
    <div class="space-y-3">
      <a
        v-for="(result, index) in results"
        :key="index"
        :href="result.url"
        target="_blank"
        rel="noopener noreferrer"
        class="block p-3 bg-dark-100/50 rounded-lg hover:bg-dark-100 transition-colors group"
      >
        <h5 class="text-sm font-medium text-neon-green group-hover:text-neon-blue transition-colors line-clamp-1">
          {{ result.title }}
        </h5>
        <p class="text-xs text-gray-400 mt-1 line-clamp-2">
          {{ result.snippet }}
        </p>
        <div class="flex items-center space-x-2 mt-2">
          <LinkIcon class="w-3 h-3 text-gray-500" />
          <span class="text-xs text-gray-500 truncate">{{ formatUrl(result.url) }}</span>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GlobeAltIcon, LinkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  results: Array<{
    title: string
    url: string
    snippet: string
    timestamp?: Date
  }>
}>()

// Format URL for display
const formatUrl = (url: string) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}
</script>

<style scoped>
/* Line clamp utilities */
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
<template>
  <div class="bg-dark-100 rounded-xl border border-dark-300/50 p-6 hover:border-neon-green/30 transition-all duration-300">
    <div class="flex items-start justify-between mb-4">
      <div class="p-2 bg-dark-200 rounded-lg">
        <component :is="icon" :class="['w-6 h-6', color]" />
      </div>
      <span 
        v-if="change"
        :class="[
          'text-xs font-medium px-2 py-1 rounded-full',
          change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        ]"
      >
        {{ change }}
      </span>
    </div>
    
    <div>
      <h3 class="text-gray-400 text-sm font-medium mb-1">{{ title }}</h3>
      <p class="text-2xl font-bold text-white stat-value">{{ value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string
  change?: string
  icon: any
  color: string
}>()
</script>

<style scoped>
@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-value {
  animation: countUp 0.6s ease-out;
}
</style>
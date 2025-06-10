<template>
  <div class="space-y-3">
    <TransitionGroup name="activity">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start space-x-4 p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors"
      >
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-dark-300 rounded-lg flex items-center justify-center">
            <component 
              :is="activity.icon" 
              :class="[
                'w-5 h-5',
                activity.type === 'session' ? 'text-neon-green' : 'text-neon-blue'
              ]"
            />
          </div>
        </div>
        
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium truncate">
            {{ activity.title }}
          </p>
          <p class="text-gray-500 text-xs mt-1">
            {{ formatTimestamp(activity.timestamp) }}
          </p>
        </div>
        
        <div class="flex-shrink-0">
          <span 
            :class="[
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              getActivityBadgeClass(activity.type)
            ]"
          >
            {{ activity.type }}
          </span>
        </div>
      </div>
    </TransitionGroup>
    
    <div v-if="activities.length === 0" class="text-center py-8">
      <ClockIcon class="w-12 h-12 text-gray-600 mx-auto mb-3" />
      <p class="text-gray-400">No recent activity</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ClockIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  activities: Array<{
    id: string
    type: string
    title: string
    timestamp: Date
    icon: any
  }>
}>()

// Format timestamp to relative time
const formatTimestamp = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== new Date(timestamp).getFullYear() ? 'numeric' : undefined
  })
}

// Get badge class based on activity type
const getActivityBadgeClass = (type: string) => {
  const classes = {
    'session': 'bg-green-500/20 text-green-400',
    'message': 'bg-blue-500/20 text-blue-400',
    'share': 'bg-purple-500/20 text-purple-400',
    'export': 'bg-yellow-500/20 text-yellow-400',
    'delete': 'bg-red-500/20 text-red-400'
  }
  
  return classes[type] || 'bg-gray-500/20 text-gray-400'
}
</script>

<style scoped>
/* Activity list animations */
.activity-enter-active,
.activity-leave-active {
  transition: all 0.3s ease;
}

.activity-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.activity-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.activity-move {
  transition: transform 0.3s ease;
}
</style>
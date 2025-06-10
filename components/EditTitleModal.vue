<!-- components/EditTitleModal.vue -->
<template>
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-dark-200 border border-dark-300 rounded-lg w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-dark-300/50">
        <h2 class="text-xl font-bold text-white">Edit Chat Title</h2>
        <button 
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <form @submit.prevent="saveTitle" class="p-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Chat Title
            </label>
            <input
              ref="titleInput"
              v-model="newTitle"
              type="text"
              placeholder="Enter chat title"
              maxlength="100"
              class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              @keydown.escape="$emit('close')"
            />
            <p class="text-xs text-gray-400 mt-1">
              {{ newTitle.length }}/100 characters
            </p>
          </div>

          <!-- Suggested Titles -->
          <div v-if="suggestedTitles.length > 0">
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Suggested Titles
            </label>
            <div class="space-y-2">
              <button
                v-for="title in suggestedTitles"
                :key="title"
                @click="newTitle = title"
                type="button"
                class="w-full text-left px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-300 hover:bg-dark-400 hover:border-neon-green/50 transition-colors"
              >
                {{ title }}
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 mt-6">
          <button
            @click="$emit('close')"
            type="button"
            class="px-4 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition-colors"
          >
            Cancel
          </button>
          <button
            :disabled="!newTitle.trim() || newTitle === currentTitle"
            type="submit"
            class="px-4 py-2 bg-neon-green text-black rounded-lg hover:bg-neon-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  currentTitle: string
}>()

const emit = defineEmits<{
  close: []
  save: [title: string]
}>()

const newTitle = ref(props.currentTitle)
const titleInput = ref<HTMLInputElement>()

// Generate suggested titles based on common patterns
const suggestedTitles = computed(() => {
  const suggestions = []
  const now = new Date()
  
  // Time-based suggestions
  const timeOfDay = now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'
  suggestions.push(`${timeOfDay} Chat`)
  
  // Date-based suggestions
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  suggestions.push(`Chat ${dateStr}`)
  
  // Generic suggestions
  suggestions.push('Quick Question', 'Research Session', 'Brainstorming', 'Planning Discussion')
  
  // Filter out current title
  return suggestions.filter(title => title !== props.currentTitle)
})

const saveTitle = () => {
  if (newTitle.value.trim() && newTitle.value !== props.currentTitle) {
    emit('save', newTitle.value.trim())
  }
}

onMounted(() => {
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
})
</script>
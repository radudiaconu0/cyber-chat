<template>
  <div class="relative inline-block">
    <div @mouseenter="show = true" @mouseleave="show = false">
      <slot />
    </div>
    
    <Transition name="tooltip">
      <div
        v-if="show"
        :class="[
          'absolute z-50 px-3 py-2 text-xs text-white bg-dark-100 rounded-lg shadow-lg border border-dark-300/50',
          'whitespace-nowrap max-w-xs',
          positionClasses
        ]"
      >
        {{ text }}
        <div 
          :class="[
            'absolute w-2 h-2 bg-dark-100 border-dark-300/50 transform rotate-45',
            arrowClasses
          ]"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}>()

const show = ref(false)

const positionClasses = computed(() => {
  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }
  return positions[props.position || 'top']
})

const arrowClasses = computed(() => {
  const arrows = {
    top: 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 border-t border-l',
    bottom: 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-b border-r',
    left: 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 border-t border-r',
    right: 'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border-b border-l'
  }
  return arrows[props.position || 'top']
})
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
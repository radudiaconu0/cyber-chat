<!-- components/ui/ToggleSwitch.vue -->
<template>
  <button
    @click="toggle"
    :class="[
      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neon-green focus:ring-offset-2 focus:ring-offset-dark-200',
      value ? 'bg-neon-green' : 'bg-gray-600'
    ]"
    role="switch"
    :aria-checked="value"
  >
    <span class="sr-only">Toggle setting</span>
    <span
      :class="[
        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        value ? 'translate-x-5' : 'translate-x-0'
      ]"
    />
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: boolean
}>()

const emit = defineEmits<{
  update: [value: boolean]
}>()

const toggle = () => {
  emit('update', !props.value)
}
</script>
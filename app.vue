<!-- app.vue -->
<template>
  <div 
    :class="[
      'min-h-screen bg-cyber-dark',
      `theme-${mainStore.chatSettings.theme}`
    ]"
  >
    <!-- Matrix Background Effect -->
    <div class="matrix-bg" v-if="showMatrixEffect">
      <div 
        v-for="i in 50" 
        :key="i"
        class="matrix-char"
        :style="{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 20}s`,
          fontSize: `${Math.random() * 10 + 10}px`
        }"
      >
        {{ randomMatrixChar() }}
      </div>
    </div>

    <!-- Main Layout -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Loading Overlay -->
    <Transition name="fade">
      <div 
        v-if="mainStore.isLoading"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div class="text-center">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-neon-green text-sm uppercase tracking-wider">
            {{ mainStore.loadingMessage || 'Loading...' }}
          </p>
        </div>
      </div>
    </Transition>

    <!-- Toast Notifications -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'p-4 rounded-lg backdrop-blur-md border max-w-sm',
            getToastClass(toast.type)
          ]"
        >
          <div class="flex items-start">
            <component 
              :is="getToastIcon(toast.type)" 
              class="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
            />
            <div>
              <h4 class="font-semibold text-sm">{{ toast.title }}</h4>
              <p class="text-xs mt-1 opacity-90">{{ toast.message }}</p>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Connection Status Indicator -->
    <Transition name="slide-up">
      <div 
        v-if="showConnectionStatus"
        class="fixed bottom-4 left-4 px-4 py-2 rounded-lg bg-dark-200/90 backdrop-blur-sm border border-neon-yellow/50"
      >
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full animate-pulse"
               :class="{
                 'bg-neon-yellow': mainStore.connectionStatus === 'syncing',
                 'bg-red-500': mainStore.connectionStatus === 'disconnected'
               }">
          </div>
          <span class="text-xs uppercase tracking-wider">
            {{ connectionStatusText }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

const mainStore = useMainStore()

// Toast system
const toasts = ref<any[]>([])
let toastId = 0

const addToast = (type: string, title: string, message: string) => {
  const toast = {
    id: ++toastId,
    type,
    title,
    message
  }
  
  toasts.value.push(toast)
  
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === toast.id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }, 5000)
}

// Provide toast function globally
provide('toast', addToast)

const getToastClass = (type: string) => {
  const classes = {
    success: 'bg-green-500/20 border-green-500/50 text-green-100',
    error: 'bg-red-500/20 border-red-500/50 text-red-100',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-100'
  }
  return classes[type] || classes.info
}

const getToastIcon = (type: string) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  }
  return icons[type] || InformationCircleIcon
}

// Matrix effect
const showMatrixEffect = computed(() => {
  return mainStore.chatSettings.theme === 'cyber' && process.client
})

const randomMatrixChar = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  return chars[Math.floor(Math.random() * chars.length)]
}

// Connection status
const showConnectionStatus = computed(() => {
  return mainStore.user && mainStore.connectionStatus !== 'connected'
})

const connectionStatusText = computed(() => {
  switch (mainStore.connectionStatus) {
    case 'syncing': return 'Syncing...'
    case 'disconnected': return 'Offline'
    case 'connecting': return 'Connecting...'
    default: return 'Connected'
  }
})

// Apply theme on mount
onMounted(() => {
  if (process.client) {
    document.documentElement.className = `theme-${mainStore.chatSettings.theme}`
  }
})

// Watch for theme changes
watch(() => mainStore.chatSettings.theme, (newTheme) => {
  if (process.client) {
    document.documentElement.className = `theme-${newTheme}`
  }
})

// Error handling
const handleError = (error: any) => {
  console.error('App error:', error)
  addToast('error', 'Error', error.message || 'An unexpected error occurred')
}

// Global error handler
if (process.client) {
  window.addEventListener('error', (event) => {
    handleError(event.error)
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason)
    event.preventDefault()
  })
}

// SEO
useHead({
  titleTemplate: '%s - CyberChat',
  htmlAttrs: {
    lang: 'en'
  },
  meta: [
    { name: 'robots', content: 'index, follow' },
    { name: 'author', content: 'CyberChat' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'CyberChat' }
  ]
})
</script>

<style>
/* Matrix background animation */
.matrix-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: -1;
  opacity: 0.1;
}

.matrix-char {
  position: absolute;
  color: #39ff14;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  animation: matrix-fall 20s linear infinite;
}

@keyframes matrix-fall {
  to {
    transform: translateY(100vh);
  }
}

/* Theme variables */
.theme-cyber {
  --primary-color: #39ff14;
  --secondary-color: #00d4ff;
}

.theme-dark {
  --primary-color: #6b7280;
  --secondary-color: #9ca3af;
}

.theme-blue {
  --primary-color: #00d4ff;
  --secondary-color: #0ea5e9;
}

.theme-purple {
  --primary-color: #bf00ff;
  --secondary-color: #a855f7;
}

/* Loading spinner */
.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #39ff14;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
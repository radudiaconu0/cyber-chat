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
        v-if="mainStore.connectionStatus !== 'connected'"
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
            {{ mainStore.connectionStatus === 'syncing' ? 'Syncing...' : 'Offline' }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores/main'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'

const mainStore = useMainStore()
const toasts = ref([])
const showMatrixEffect = ref(false)

// Toast system
const showToast = (type, title, message) => {
  const id = Date.now()
  toasts.value.push({ id, type, title, message })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 5000)
}

const getToastClass = (type) => {
  const classes = {
    success: 'bg-green-500/10 border-green-500/50 text-green-500',
    error: 'bg-red-500/10 border-red-500/50 text-red-500',
    warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500',
    info: 'bg-blue-500/10 border-blue-500/50 text-blue-500'
  }
  return classes[type] || classes.info
}

const getToastIcon = (type) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  }
  return icons[type] || icons.info
}

// Matrix effect character generator
const randomMatrixChar = () => {
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  return chars[Math.floor(Math.random() * chars.length)]
}

// Expose toast system globally
provide('toast', showToast)

// Theme management
onMounted(() => {
  // Apply theme
  document.documentElement.classList.add(`theme-${mainStore.chatSettings.theme}`)
  
  // Enable matrix effect based on theme
  showMatrixEffect.value = mainStore.chatSettings.theme === 'cyberpunk' || 
                          mainStore.chatSettings.theme === 'matrix'
  
  // Initialize stores
  mainStore.initialize()
})

// Watch for theme changes
watch(() => mainStore.chatSettings.theme, (newTheme, oldTheme) => {
  document.documentElement.classList.remove(`theme-${oldTheme}`)
  document.documentElement.classList.add(`theme-${newTheme}`)
  showMatrixEffect.value = newTheme === 'cyberpunk' || newTheme === 'matrix'
})

// SEO
useHead({
  title: 'CyberChat - Next-Gen AI Chat',
  meta: [
    { name: 'description', content: 'Advanced AI chatbot with multiple models, reasoning, and web search capabilities' },
    { name: 'theme-color', content: '#39ff14' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
  ]
})
</script>

<style scoped>
/* Loading Spinner */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(57, 255, 20, 0.3);
  border-top: 3px solid #39ff14;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Toast Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Up Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* Theme-specific styles */
.theme-cyberpunk {
  --primary-color: #39ff14;
  --secondary-color: #00d4ff;
  --accent-color: #bf00ff;
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
}

.theme-neon {
  --primary-color: #ff073a;
  --secondary-color: #39ff14;
  --accent-color: #00d4ff;
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
}

.theme-matrix {
  --primary-color: #39ff14;
  --secondary-color: #003300;
  --accent-color: #001100;
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --text-primary: #39ff14;
  --text-secondary: #227722;
}

.theme-synthwave {
  --primary-color: #ff00ff;
  --secondary-color: #00ffff;
  --accent-color: #ffff00;
  --bg-primary: #1a0a1a;
  --bg-secondary: #2a1a2a;
  --text-primary: #ffffff;
  --text-secondary: #ffccff;
}

.theme-terminal {
  --primary-color: #00ff00;
  --secondary-color: #ffffff;
  --accent-color: #ffff00;
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --text-primary: #00ff00;
  --text-secondary: #ccffcc;
}
</style>
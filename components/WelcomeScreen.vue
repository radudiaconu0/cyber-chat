<template>
  <div class="flex items-center justify-center h-full p-8">
    <div class="max-w-4xl w-full text-center">
      <!-- Logo & Title -->
      <div class="mb-12 animate-fadeIn">
        <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-neon-green to-neon-blue rounded-2xl flex items-center justify-center cyber-glow">
          <ChatBubbleBottomCenterTextIcon class="w-14 h-14 text-black" />
        </div>
        
        <h1 class="text-5xl font-display font-bold mb-4 glitch" data-text="CyberChat">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple">
            CyberChat
          </span>
        </h1>
        
        <p class="text-xl text-gray-400 mb-8">
          Experience the future of AI conversation with 
          <span class="text-neon-green">{{ mainStore.availableModels.length }}+</span> models
        </p>

        <!-- Quick Stats -->
        <div class="flex items-center justify-center space-x-8 mb-8">
          <div class="text-center">
            <div class="text-2xl font-bold text-neon-green animate-counter">
              {{ mainStore.chatSessions.length }}
            </div>
            <div class="text-xs text-gray-500 uppercase tracking-wider">Chats</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-neon-blue animate-counter">
              {{ totalMessages }}
            </div>
            <div class="text-xs text-gray-500 uppercase tracking-wider">Messages</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-neon-purple animate-counter">
              {{ formatTokens(mainStore.totalTokensUsed) }}
            </div>
            <div class="text-xs text-gray-500 uppercase tracking-wider">Tokens</div>
          </div>
        </div>

        <!-- CTA Button -->
        <button
          @click="$emit('start-chat')"
          class="cyber-button text-lg px-8 py-4 cyber-glow"
        >
          <span class="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon class="w-6 h-6" />
            <span>Start Your First Chat</span>
            <ArrowRightIcon class="w-5 h-5" />
          </span>
        </button>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div
          v-for="(feature, index) in features"
          :key="feature.id"
          class="group p-6 bg-dark-200/50 backdrop-blur-sm rounded-xl border border-neon-green/20 hover:border-neon-green/50 transition-all duration-300 hover:transform hover:scale-105"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-neon-green/20 to-neon-blue/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <component :is="feature.icon" class="w-6 h-6" :class="feature.iconColor" />
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">{{ feature.title }}</h3>
            <p class="text-gray-400 text-sm leading-relaxed">{{ feature.description }}</p>
          </div>
          
          <!-- Feature badge -->
          <div v-if="feature.badge" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
               :class="feature.badgeClass">
            {{ feature.badge }}
          </div>
        </div>
      </div>

      <!-- Models Showcase -->
      <div class="mb-12">
        <h2 class="text-3xl font-bold text-white mb-8">
          Choose from <span class="text-neon-green">{{ mainStore.availableModels.length }}+</span> AI Models
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="model in featuredModels"
            :key="model.id"
            class="p-4 bg-dark-200/30 rounded-lg border border-dark-300/50 hover:border-neon-green/30 transition-all"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <h4 class="font-semibold text-white">{{ model.name }}</h4>
                <p class="text-xs text-gray-500">{{ model.provider }}</p>
              </div>
              <div class="flex space-x-1">
                <span 
                  v-for="capability in model.capabilities.slice(0, 3)" 
                  :key="capability"
                  class="px-2 py-0.5 text-xs rounded-full bg-dark-300/50 text-gray-400"
                >
                  {{ capability }}
                </span>
              </div>
            </div>
            <p class="text-sm text-gray-400">{{ model.description }}</p>
          </div>
        </div>
      </div>

      <!-- Keyboard Shortcuts -->
      <div class="text-center text-xs text-gray-500">
        <span class="inline-flex items-center space-x-2">
          <kbd class="px-2 py-1 bg-dark-200 rounded border border-dark-300">Ctrl</kbd>
          <span>+</span>
          <kbd class="px-2 py-1 bg-dark-200 rounded border border-dark-300">N</kbd>
          <span class="mx-2">New Chat</span>
        </span>
        <span class="mx-4">•</span>
        <span class="inline-flex items-center space-x-2">
          <kbd class="px-2 py-1 bg-dark-200 rounded border border-dark-300">Ctrl</kbd>
          <span>+</span>
          <kbd class="px-2 py-1 bg-dark-200 rounded border border-dark-300">K</kbd>
          <span class="mx-2">Search</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '~/stores/main'
import { 
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  CpuChipIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  SparklesIcon,
  BeakerIcon,
  ShieldCheckIcon,
  BoltIcon,
  CubeIcon
} from '@heroicons/vue/24/outline'

const mainStore = useMainStore()

// Computed
const totalMessages = computed(() => {
  return mainStore.chatSessions.reduce((total, session) => 
    total + session.messages.length, 0
  )
})

const featuredModels = computed(() => {
  return mainStore.availableModels.slice(0, 6)
})

// Features data
const features = [
  {
    id: 'multi-model',
    icon: CpuChipIcon,
    iconColor: 'text-neon-green',
    title: 'Multi-Model Support',
    description: 'Access cutting-edge AI models from OpenAI, Anthropic, Google, and more',
    badge: 'NEW',
    badgeClass: 'bg-neon-green/20 text-neon-green'
  },
  {
    id: 'web-search',
    icon: GlobeAltIcon,
    iconColor: 'text-neon-blue',
    title: 'Web Search',
    description: 'Enable real-time web search to get the most current information',
    badge: 'BETA',
    badgeClass: 'bg-neon-blue/20 text-neon-blue'
  },
  {
    id: 'reasoning',
    icon: BeakerIcon,
    iconColor: 'text-neon-purple',
    title: 'Advanced Reasoning',
    description: 'Leverage reasoning models for complex problem-solving and analysis'
  },
  {
    id: 'attachments',
    icon: DocumentTextIcon,
    iconColor: 'text-neon-pink',
    title: 'File Attachments',
    description: 'Upload images, documents, and code files for AI analysis'
  },
  {
    id: 'realtime-sync',
    icon: BoltIcon,
    iconColor: 'text-yellow-500',
    title: 'Real-time Sync',
    description: 'Seamless synchronization across all your devices instantly'
  },
  {
    id: 'privacy',
    icon: ShieldCheckIcon,
    iconColor: 'text-green-500',
    title: 'Privacy First',
    description: 'Your conversations are encrypted and never used for training'
  },
  {
    id: 'customization',
    icon: CubeIcon,
    iconColor: 'text-indigo-500',
    title: 'Full Customization',
    description: 'Personalize themes, settings, and model parameters'
  },
  {
    id: 'export',
    icon: SparklesIcon,
    iconColor: 'text-orange-500',
    title: 'Export & Share',
    description: 'Export chats, create shareable links, and collaborate'
  }
]

// Methods
const formatTokens = (tokens: number) => {
  if (tokens < 1000) return tokens.toString()
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`
  return `${(tokens / 1000000).toFixed(1)}M`
}

// Emit
defineEmits(['start-chat'])
</script>

<style scoped>
/* Glitch effect for title */
.glitch {
  position: relative;
}

.glitch:before,
.glitch:after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch:before {
  animation: glitch-1 0.5s infinite;
  color: #ff073a;
  z-index: -1;
}

.glitch:after {
  animation: glitch-2 0.5s infinite;
  color: #00d4ff;
  z-index: -2;
}

@keyframes glitch-1 {
  0%, 14%, 15%, 49%, 50%, 99%, 100% {
    transform: translate3d(0, 0, 0);
  }
  1%, 2% {
    transform: translate3d(-1px, 0, 0);
  }
  62%, 63% {
    transform: translate3d(1px, 0, 0);
  }
}

@keyframes glitch-2 {
  6%, 7%, 47%, 48%, 52%, 53%, 99%, 100% {
    transform: translate3d(0, 0, 0);
  }
  8%, 9% {
    transform: translate3d(-1px, 0, 0);
  }
  54%, 55% {
    transform: translate3d(1px, 0, 0);
  }
}

/* Feature cards hover effect */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

/* Stagger animation for feature cards */
.fade-in-scale {
  animation: fadeInScale 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInScale {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Counter animation */
.animate-counter {
  transition: all 0.3s ease;
}

/* Cyber glow effect */
.cyber-glow:hover {
  box-shadow: 
    0 0 20px rgba(57, 255, 20, 0.5),
    0 0 40px rgba(57, 255, 20, 0.3),
    0 0 60px rgba(57, 255, 20, 0.1);
}

/* Grid animations */
.grid > * {
  animation: slideInUp 0.6s ease-out forwards;
  opacity: 0;
}

.grid > *:nth-child(1) { animation-delay: 0.1s; }
.grid > *:nth-child(2) { animation-delay: 0.2s; }
.grid > *:nth-child(3) { animation-delay: 0.3s; }
.grid > *:nth-child(4) { animation-delay: 0.4s; }
.grid > *:nth-child(5) { animation-delay: 0.5s; }
.grid > *:nth-child(6) { animation-delay: 0.6s; }

/* Responsive adjustments */
@media (max-width: 768px) {
  .glitch {
    font-size: 2.5rem;
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
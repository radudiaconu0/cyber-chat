<template>
  <div class="flex h-screen bg-cyber-dark overflow-hidden">
    <!-- Sidebar -->
    <Transition name="slide-left">
      <aside 
        v-if="mainStore.sidebarOpen" 
        class="w-64 bg-dark-100 border-r border-dark-300/50 flex flex-col"
      >
        <!-- Logo & Header -->
        <div class="p-4 border-b border-dark-300/50">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-neon-green to-neon-blue rounded-lg flex items-center justify-center">
              <ChatBubbleBottomCenterTextIcon class="w-6 h-6 text-black" />
            </div>
            <h1 class="text-xl font-display font-bold text-white glitch" data-text="CyberChat">
              CyberChat
            </h1>
          </div>
        </div>

        <!-- New Chat Button -->
        <div class="p-4">
          <button 
            @click="createNewChat"
            class="w-full cyber-button text-sm"
          >
            <PlusIcon class="w-4 h-4 inline mr-2" />
            New Chat
          </button>
        </div>

        <!-- Chat List -->
        <div class="flex-1 overflow-y-auto px-4 pb-4">
          <div class="space-y-2">
            <TransitionGroup name="list">
              <div
                v-for="chat in sortedChats"
                :key="chat.id"
                @click="mainStore.selectChat(chat.id)"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-all duration-200 group',
                  'hover:bg-dark-200/50 hover:border-neon-green/30',
                  chat.id === mainStore.currentChatId 
                    ? 'bg-dark-200 border border-neon-green/50' 
                    : 'border border-transparent'
                ]"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-white truncate">
                      {{ chat.title }}
                    </h3>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ formatDate(chat.updatedAt) }}
                    </p>
                  </div>
                  <button
                    @click.stop="deleteChat(chat.id)"
                    class="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <TrashIcon class="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <!-- User Menu -->
        <div class="p-4 border-t border-dark-300/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full flex items-center justify-center">
                <UserIcon class="w-5 h-5 text-white" />
              </div>
              <span class="text-sm text-white">
                {{ mainStore.user?.email || 'Guest' }}
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <NuxtLink to="/settings" class="text-gray-400 hover:text-white transition-colors">
                <Cog6ToothIcon class="w-5 h-5" />
              </NuxtLink>
              <button @click="toggleSidebar" class="text-gray-400 hover:text-white transition-colors">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </Transition>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header Bar -->
      <header class="h-14 bg-dark-100 border-b border-dark-300/50 flex items-center px-4">
        <button 
          v-if="!mainStore.sidebarOpen"
          @click="toggleSidebar"
          class="mr-4 text-gray-400 hover:text-white transition-colors"
        >
          <Bars3Icon class="w-6 h-6" />
        </button>

        <!-- Model Selector -->
        <div class="flex items-center space-x-4">
          <ModelSelector />
          
          <!-- Quick Actions -->
          <div class="flex items-center space-x-2 ml-auto">
            <NuxtLink 
              to="/dashboard"
              class="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChartBarIcon class="w-5 h-5 inline mr-1" />
              Dashboard
            </NuxtLink>
            
            <button 
              @click="shareCurrentChat"
              v-if="mainStore.currentSession"
              class="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ShareIcon class="w-5 h-5 inline mr-1" />
              Share
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-hidden">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '~/stores/main'
import { 
  ChatBubbleBottomCenterTextIcon, 
  PlusIcon, 
  TrashIcon, 
  UserIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
  ChartBarIcon,
  ShareIcon 
} from '@heroicons/vue/24/outline'

const mainStore = useMainStore()
const toast = inject('toast')

// Sorted chats (most recent first)
const sortedChats = computed(() => {
  return [...mainStore.chatSessions].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
})

// Create new chat
const createNewChat = () => {
  mainStore.createNewChat()
  toast('success', 'New Chat', 'Created a new chat session')
}

// Delete chat
const deleteChat = (chatId: string) => {
  if (confirm('Are you sure you want to delete this chat?')) {
    mainStore.deleteChat(chatId)
    toast('info', 'Chat Deleted', 'Chat session has been removed')
  }
}

// Toggle sidebar
const toggleSidebar = () => {
  mainStore.toggleSidebar()
}

// Share current chat
const shareCurrentChat = () => {
  toast('info', 'Share Chat', 'Chat sharing coming soon!')
}

// Format date
const formatDate = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`
  
  return new Date(date).toLocaleDateString()
}
</script>

<style scoped>
/* Slide animations */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(-100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

/* List animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Scrollbar styling for chat list */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(57, 255, 20, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(57, 255, 20, 0.5);
}
</style>
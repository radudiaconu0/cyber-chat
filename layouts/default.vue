<!-- layouts/default.vue -->
<template>
  <div class="h-screen flex overflow-hidden">
    <!-- Sidebar -->
    <Transition name="slide-x">
      <aside 
        v-if="mainStore.sidebarOpen" 
        class="w-80 bg-dark-100 border-r border-dark-300/50 flex flex-col"
      >
        <!-- Sidebar Header -->
        <div class="p-4 border-b border-dark-300/50">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold text-white font-display">CyberChat</h1>
            <button 
              @click="toggleSidebar"
              class="text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          
          <!-- New Chat Button -->
          <button
            @click="startNewChat"
            class="w-full mt-4 cyber-button flex items-center justify-center space-x-2"
          >
            <PlusIcon class="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>

        <!-- Search -->
        <div class="p-4 border-b border-dark-300/50">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              placeholder="Search chats..."
              class="w-full pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
            />
          </div>
        </div>

        <!-- Chat List -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-2 space-y-1">
            <TransitionGroup name="list">
              <NuxtLink
                v-for="chat in filteredChats"
                :key="chat.id"
                :to="`/chat/${chat.id}`"
                class="group block p-3 rounded-lg hover:bg-dark-200 transition-colors"
                :class="[
                  route.params.id === chat.id 
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
                      {{ formatDate(chat.updatedAt) }} • {{ chat.messages.length }} messages
                    </p>
                    
                    <!-- Chat Status Indicators -->
                    <div class="flex items-center space-x-2 mt-1">
                      <div 
                        v-if="chat.shared"
                        class="flex items-center space-x-1 text-xs text-neon-green"
                      >
                        <ShareIcon class="w-3 h-3" />
                        <span>Shared</span>
                      </div>
                      <div 
                        v-if="chat.archived"
                        class="flex items-center space-x-1 text-xs text-gray-400"
                      >
                        <ArchiveBoxIcon class="w-3 h-3" />
                        <span>Archived</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Chat Actions -->
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex space-x-1">
                    <button
                      @click.prevent="shareChat(chat)"
                      class="text-gray-400 hover:text-neon-green transition-colors"
                      title="Share Chat"
                    >
                      <ShareIcon class="w-3 h-3" />
                    </button>
                    <button
                      @click.prevent="deleteChat(chat.id)"
                      class="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Chat"
                    >
                      <TrashIcon class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </NuxtLink>
            </TransitionGroup>
            
            <!-- Empty State -->
            <div v-if="filteredChats.length === 0" class="text-center py-8">
              <ChatBubbleLeftRightIcon class="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p class="text-gray-400 text-sm">
                {{ searchQuery ? 'No chats found' : 'No chats yet' }}
              </p>
              <button
                v-if="!searchQuery"
                @click="startNewChat"
                class="mt-2 text-neon-green hover:text-neon-green/80 text-sm"
              >
                Start your first conversation
              </button>
            </div>
          </div>
        </div>

        <!-- User Menu -->
        <div class="p-4 border-t border-dark-300/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full flex items-center justify-center">
                <UserIcon class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white truncate">
                  {{ mainStore.user?.email || 'Guest' }}
                </p>
                <p class="text-xs text-gray-400">
                  {{ connectionStatusText }}
                </p>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <NuxtLink 
                to="/dashboard" 
                class="text-gray-400 hover:text-white transition-colors"
                title="Dashboard"
              >
                <ChartBarIcon class="w-4 h-4" />
              </NuxtLink>
              <NuxtLink 
                to="/settings" 
                class="text-gray-400 hover:text-white transition-colors"
                title="Settings"
              >
                <Cog6ToothIcon class="w-4 h-4" />
              </NuxtLink>
              <button 
                @click="logout"
                class="text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon class="w-4 h-4" />
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

        <!-- Breadcrumbs -->
        <nav class="flex items-center space-x-2 text-sm">
          <NuxtLink to="/" class="text-gray-400 hover:text-white transition-colors">
            Home
          </NuxtLink>
          <span v-if="currentChat" class="text-gray-600">/</span>
          <span v-if="currentChat" class="text-white truncate max-w-xs">
            {{ currentChat.title }}
          </span>
        </nav>

        <!-- Header Actions -->
        <div class="ml-auto flex items-center space-x-4">
          <!-- Model Selector -->
          <ModelSelector v-if="currentChat" />
          
          <!-- Connection Status -->
          <div class="flex items-center space-x-2">
            <div 
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': mainStore.connectionStatus === 'connected',
                'bg-yellow-500 animate-pulse': mainStore.connectionStatus === 'syncing',
                'bg-red-500': mainStore.connectionStatus === 'disconnected'
              }"
            ></div>
            <span class="text-xs text-gray-400 hidden sm:inline">
              {{ connectionStatusText }}
            </span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-hidden">
        <slot />
      </div>
    </main>

    <!-- Mobile Sidebar Overlay -->
    <Transition name="fade">
      <div 
        v-if="mainStore.sidebarOpen"
        @click="closeSidebar"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      />
    </Transition>

    <!-- Share Modal -->
    <ShareChatModal
      v-if="showShareModal && chatToShare"
      :session="chatToShare"
      @close="showShareModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  TrashIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'

const mainStore = useMainStore()
const route = useRoute()
const router = useRouter()
const nuxt_app = useNuxtApp()
console.log(nuxt_app)
const supabase = await useSupabaseClient()
const realtime = useSupabaseRealtime()
const toast = inject('toast')

const searchQuery = ref('')
const showShareModal = ref(false)
const chatToShare = ref<any>(null)

// Initialize realtime connection when user is available
watchEffect(async () => {
  if (mainStore.user && mainStore.chatSessions.length > 0) {
    await realtime.initialize()
  }
})

// Cleanup realtime when component unmounts
onUnmounted(async () => {
  await realtime.cleanup()
})

const filteredChats = computed(() => {
  let chats = mainStore.chatSessions.filter(chat => !chat.archived)
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    chats = chats.filter(chat => 
      chat.title.toLowerCase().includes(query) ||
      chat.messages.some(msg => msg.content.toLowerCase().includes(query))
    )
  }
  
  return chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
})

const currentChat = computed(() => {
  if (!route.params.id) return null
  return mainStore.chatSessions.find(chat => chat.id === route.params.id)
})

const connectionStatusText = computed(() => {
  switch (mainStore.connectionStatus) {
    case 'connected': return 'Online'
    case 'syncing': return 'Syncing...'
    case 'disconnected': return 'Offline'
    default: return 'Connecting...'
  }
})

const toggleSidebar = () => {
  mainStore.sidebarOpen = !mainStore.sidebarOpen
}

const closeSidebar = () => {
  mainStore.sidebarOpen = false
}

const startNewChat = async () => {
  try {
    const newSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: mainStore.chatSettings.defaultModel,
      tokenCount: 0,
      archived: false,
      shared: false,
      shareId: null
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        id: newSession.id,
        user_id: mainStore.user?.id,
        title: newSession.title,
        model: newSession.model
      })
      .select()
      .single()

    if (error) throw error

    // Add to store
    mainStore.chatSessions.unshift(newSession)
    
    // Navigate to new chat
    router.push(`/chat/${newSession.id}`)
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      mainStore.sidebarOpen = false
    }
  } catch (error) {
    console.error('Failed to create new chat:', error)
    toast('error', 'Error', 'Failed to create new chat')
  }
}

const shareChat = (chat: any) => {
  chatToShare.value = chat
  showShareModal.value = true
}

const deleteChat = async (chatId: string) => {
  if (!confirm('Are you sure you want to delete this chat?')) return

  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId)

    if (!error) {
      mainStore.chatSessions = mainStore.chatSessions.filter(chat => chat.id !== chatId)
      
      // Redirect if we're currently viewing this chat
      if (route.params.id === chatId) {
        router.push('/')
      }
      
      toast('success', 'Success', 'Chat deleted')
    }
  } catch (error) {
    console.error('Failed to delete chat:', error)
    toast('error', 'Error', 'Failed to delete chat')
  }
}

const logout = async () => {
  try {
    await supabase.auth.signOut()
    await realtime.cleanup()
    router.push('/login')
  } catch (error) {
    console.error('Failed to logout:', error)
    toast('error', 'Error', 'Failed to logout')
  }
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Handle keyboard shortcuts
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'n':
          event.preventDefault()
          startNewChat()
          break
        case 'k':
          event.preventDefault()
          document.querySelector('input[placeholder="Search chats..."]')?.focus()
          break
        case ',':
          event.preventDefault()
          router.push('/settings')
          break
        case 'b':
          event.preventDefault()
          toggleSidebar()
          break
      }
    }
  }

  document.addEventListener('keydown', handleKeydown)
  
  return () => {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
/* Sidebar animations */
.slide-x-enter-active,
.slide-x-leave-active {
  transition: transform 0.3s ease;
}

.slide-x-enter-from {
  transform: translateX(-100%);
}

.slide-x-leave-to {
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

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile responsive adjustments */
@media (max-width: 1024px) {
  aside {
    @apply fixed inset-y-0 left-0 z-50;
  }
}
</style>
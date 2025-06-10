<!-- components/ShareChatModal.vue -->
<template>
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-dark-200 border border-dark-300 rounded-lg w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-dark-300/50">
        <h2 class="text-xl font-bold text-white">Share Chat</h2>
        <button 
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Chat Info -->
        <div class="bg-dark-100 border border-dark-300/50 rounded-lg p-4">
          <h3 class="font-semibold text-white mb-2">{{ session.title }}</h3>
          <div class="text-sm text-gray-400 space-y-1">
            <p>{{ session.messages.length }} messages</p>
            <p>Created {{ formatDate(session.createdAt) }}</p>
            <p>Model: {{ getModelName(session.model) }}</p>
          </div>
        </div>

        <!-- Share Options -->
        <div class="space-y-4">
          <!-- Password Protection -->
          <div>
            <label class="flex items-center space-x-3">
              <input
                v-model="shareOptions.requirePassword"
                type="checkbox"
                class="w-4 h-4 bg-dark-300 border-dark-400 rounded focus:ring-neon-green focus:ring-2"
              />
              <span class="text-white">Require password to view</span>
            </label>
            
            <div v-if="shareOptions.requirePassword" class="mt-3">
              <input
                v-model="shareOptions.password"
                type="password"
                placeholder="Enter password"
                class="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              />
            </div>
          </div>

          <!-- Expiration -->
          <div>
            <label class="block text-white mb-3">Link expires</label>
            <select
              v-model="shareOptions.expiresIn"
              class="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
            >
              <option value="1hour">1 hour</option>
              <option value="1day">1 day</option>
              <option value="1week">1 week</option>
              <option value="1month">1 month</option>
              <option value="never">Never</option>
            </select>
          </div>

          <!-- View Permissions -->
          <div>
            <label class="block text-white mb-3">Permissions</label>
            <div class="space-y-2">
              <label class="flex items-center space-x-3">
                <input
                  v-model="shareOptions.allowDownload"
                  type="checkbox"
                  class="w-4 h-4 bg-dark-300 border-dark-400 rounded focus:ring-neon-green focus:ring-2"
                />
                <span class="text-gray-300">Allow downloading chat</span>
              </label>
              <label class="flex items-center space-x-3">
                <input
                  v-model="shareOptions.showMetadata"
                  type="checkbox"
                  class="w-4 h-4 bg-dark-300 border-dark-400 rounded focus:ring-neon-green focus:ring-2"
                />
                <span class="text-gray-300">Show message timestamps</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Generated Link -->
        <div v-if="shareLink" class="space-y-3">
          <label class="block text-white">Share Link</label>
          <div class="flex items-center space-x-2">
            <input
              :value="shareLink"
              readonly
              class="flex-1 px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none"
            />
            <button
              @click="copyLink"
              class="px-4 py-2 bg-neon-green text-black rounded-lg hover:bg-neon-green/80 transition-colors"
            >
              <component :is="copied ? CheckIcon : ClipboardIcon" class="w-4 h-4" />
            </button>
          </div>
          
          <!-- QR Code -->
          <div class="flex justify-center mt-4">
            <div class="bg-white p-4 rounded-lg">
              <canvas ref="qrCanvas" class="w-32 h-32"></canvas>
            </div>
          </div>
        </div>

        <!-- Share Stats (if already shared) -->
        <div v-if="session.shared && shareStats" class="bg-dark-100 border border-dark-300/50 rounded-lg p-4">
          <h4 class="font-semibold text-white mb-2">Share Statistics</h4>
          <div class="text-sm text-gray-400 space-y-1">
            <p>Views: {{ shareStats.viewCount }}</p>
            <p>Last viewed: {{ shareStats.lastViewed ? formatDate(new Date(shareStats.lastViewed)) : 'Never' }}</p>
            <p>Created: {{ formatDate(new Date(shareStats.createdAt)) }}</p>
          </div>
        </div>

        <!-- Warning -->
        <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <ExclamationTriangleIcon class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-yellow-200">
              <p class="font-medium mb-1">Sharing Notice</p>
              <p>Anyone with this link will be able to view this conversation. Make sure you trust the recipients.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between p-6 border-t border-dark-300/50">
        <button
          v-if="session.shared"
          @click="revokeShare"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Revoke Share
        </button>
        <div v-else></div>
        
        <div class="flex items-center space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="createShare"
            :disabled="isCreating || (shareOptions.requirePassword && !shareOptions.password)"
            class="px-4 py-2 bg-neon-green text-black rounded-lg hover:bg-neon-green/80 transition-colors disabled:opacity-50"
          >
            {{ isCreating ? 'Creating...' : session.shared ? 'Update Share' : 'Create Share Link' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  XMarkIcon,
  ClipboardIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

interface ShareOptions {
  requirePassword: boolean
  password: string
  expiresIn: string
  allowDownload: boolean
  showMetadata: boolean
}

const props = defineProps<{
  session: any
}>()

const emit = defineEmits<{
  close: []
}>()

const supabase = await useSupabaseClient()
const mainStore = useMainStore()
const toast = inject('toast')

const shareOptions = ref<ShareOptions>({
  requirePassword: false,
  password: '',
  expiresIn: '1week',
  allowDownload: true,
  showMetadata: true
})

const shareLink = ref('')
const copied = ref(false)
const isCreating = ref(false)
const shareStats = ref<any>(null)
const qrCanvas = ref<HTMLCanvasElement>()

// Load existing share data if chat is already shared
onMounted(async () => {
  if (props.session.shared && props.session.shareId) {
    await loadShareData()
    shareLink.value = `${window.location.origin}/share/${props.session.shareId}`
    generateQRCode()
  }
})

const loadShareData = async () => {
  try {
    const { data, error } = await supabase
      .from('shared_chats')
      .select('*')
      .eq('session_id', props.session.id)
      .single()

    if (!error && data) {
      shareStats.value = data
      shareOptions.value.requirePassword = !!data.password_hash
      shareOptions.value.allowDownload = data.metadata?.allowDownload ?? true
      shareOptions.value.showMetadata = data.metadata?.showMetadata ?? true
      
      // Determine expiration setting
      if (data.expires_at) {
        const expiresAt = new Date(data.expires_at)
        const now = new Date()
        const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        if (diffHours <= 1) shareOptions.value.expiresIn = '1hour'
        else if (diffHours <= 24) shareOptions.value.expiresIn = '1day'
        else if (diffHours <= 168) shareOptions.value.expiresIn = '1week'
        else if (diffHours <= 720) shareOptions.value.expiresIn = '1month'
        else shareOptions.value.expiresIn = 'never'
      } else {
        shareOptions.value.expiresIn = 'never'
      }
    }
  } catch (error) {
    console.error('Failed to load share data:', error)
  }
}

const createShare = async () => {
  if (isCreating.value) return
  
  isCreating.value = true
  
  try {
    const expiresAt = calculateExpirationDate(shareOptions.value.expiresIn)
    
    const response = await $fetch('/api/chat/share', {
      method: 'POST',
      body: {
        sessionId: props.session.id,
        password: shareOptions.value.requirePassword ? shareOptions.value.password : undefined,
        expiresAt,
        metadata: {
          allowDownload: shareOptions.value.allowDownload,
          showMetadata: shareOptions.value.showMetadata
        }
      }
    })
    
    if (response.success) {
      shareLink.value = response.shareUrl
      props.session.shared = true
      props.session.shareId = response.shareId
      
      // Update store
      const sessionIndex = mainStore.chatSessions.findIndex(s => s.id === props.session.id)
      if (sessionIndex !== -1) {
        mainStore.chatSessions[sessionIndex].shared = true
        mainStore.chatSessions[sessionIndex].shareId = response.shareId
      }
      
      await loadShareData()
      generateQRCode()
      
      toast('success', 'Success', 'Share link created successfully')
    }
  } catch (error: any) {
    console.error('Failed to create share:', error)
    toast('error', 'Error', error.data?.message || 'Failed to create share link')
  } finally {
    isCreating.value = false
  }
}

const revokeShare = async () => {
  if (!confirm('Are you sure you want to revoke this share link? It will no longer be accessible.')) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('shared_chats')
      .delete()
      .eq('session_id', props.session.id)

    if (!error) {
      // Update session
      await supabase
        .from('chat_sessions')
        .update({ shared: false, share_id: null })
        .eq('id', props.session.id)
      
      props.session.shared = false
      props.session.shareId = null
      shareLink.value = ''
      
      // Update store
      const sessionIndex = mainStore.chatSessions.findIndex(s => s.id === props.session.id)
      if (sessionIndex !== -1) {
        mainStore.chatSessions[sessionIndex].shared = false
        mainStore.chatSessions[sessionIndex].shareId = null
      }
      
      toast('success', 'Success', 'Share link revoked')
      emit('close')
    }
  } catch (error) {
    console.error('Failed to revoke share:', error)
    toast('error', 'Error', 'Failed to revoke share link')
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copied.value = true
    toast('success', 'Copied', 'Share link copied to clipboard')
    
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy link:', error)
    toast('error', 'Error', 'Failed to copy link')
  }
}

const calculateExpirationDate = (expiresIn: string): Date | null => {
  if (expiresIn === 'never') return null
  
  const now = new Date()
  switch (expiresIn) {
    case '1hour':
      return new Date(now.getTime() + 60 * 60 * 1000)
    case '1day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case '1week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case '1month':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    default:
      return null
  }
}

const generateQRCode = () => {
  if (!qrCanvas.value || !shareLink.value) return
  
  // Simple QR code generation (you might want to use a proper QR library)
  const canvas = qrCanvas.value
  const ctx = canvas.getContext('2d')!
  
  canvas.width = 128
  canvas.height = 128
  
  // Fill with white
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 128, 128)
  
  // Simple pattern (replace with actual QR generation)
  ctx.fillStyle = '#000000'
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * 8, j * 8, 8, 8)
      }
    }
  }
  
  // Add text fallback
  ctx.fillStyle = '#666666'
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('QR Code', 64, 70)
}

const formatDate = (date: Date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  )
}

const getModelName = (modelId: string) => {
  const model = mainStore.availableModels.find(m => m.id === modelId)
  return model?.name || modelId
}
</script>
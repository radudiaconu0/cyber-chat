<!-- pages/login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-cyber-dark p-4">
    <div class="max-w-md w-full bg-dark-200 border border-dark-300 rounded-lg p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-neon-green to-neon-blue rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="text-2xl font-bold text-black font-display">CC</span>
        </div>
        <h1 class="text-2xl font-bold text-white font-display">Welcome to CyberChat</h1>
        <p class="text-gray-400 mt-2">Sign in to continue</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-gray-400">Signing in...</p>
      </div>

      <!-- Auth Forms -->
      <div v-else>
        <!-- Sign In Form -->
        <form v-if="mode === 'signin'" @submit.prevent="signIn" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" class="w-full cyber-button">
            Sign In
          </button>
        </form>

        <!-- Sign Up Form -->
        <form v-else @submit.prevent="signUp" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="6"
              class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" class="w-full cyber-button">
            Sign Up
          </button>
        </form>

        <!-- Error Message -->
        <div v-if="error" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p class="text-red-400 text-sm">{{ error }}</p>
        </div>

        <!-- Mode Toggle -->
        <div class="mt-6 text-center">
          <button
            @click="toggleMode"
            class="text-neon-green hover:text-neon-green/80 text-sm transition-colors"
          >
            {{ mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in" }}
          </button>
        </div>

        <!-- Demo Mode -->
        <div class="mt-6 pt-6 border-t border-dark-300/50 text-center">
          <p class="text-gray-400 text-sm mb-3">Or try the demo</p>
          <button
            @click="enterDemoMode"
            class="w-full px-4 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const mainStore = useMainStore()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

// Redirect if already authenticated
watch(user, (newUser) => {
  if (newUser) {
    router.push('/')
  }
}, { immediate: true })

const signIn = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (authError) {
      error.value = authError.message
    } else {
      router.push('/')
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

const signUp = async () => {
  if (loading.value) return
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const { error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })
    
    if (authError) {
      error.value = authError.message
    } else {
      error.value = 'Check your email for confirmation link!'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin'
  error.value = ''
  password.value = ''
  confirmPassword.value = ''
}

const enterDemoMode = () => {
  // Set a demo user
  mainStore.setUser({
    id: 'demo-user',
    email: 'demo@cyberchat.app',
    displayName: 'Demo User'
  })
  
  router.push('/')
}

// SEO
useHead({
  title: 'Login - CyberChat',
  meta: [
    { name: 'description', content: 'Sign in to CyberChat - Next-generation AI conversations' }
  ]
})
</script>

<style scoped>
.loading-spinner {
  @apply w-8 h-8 border-4 border-gray-600 border-t-neon-green rounded-full animate-spin;
}
</style>
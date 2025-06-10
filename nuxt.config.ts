export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-06-10',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxt/fonts',
    '@nuxtjs/supabase'
  ],
  
  css: ['~/assets/css/main.css'],
  
  googleFonts: {
    families: {
      'JetBrains+Mono': [300, 400, 500, 600, 700],
      'Orbitron': [400, 500, 600, 700, 800, 900]
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
    preload: true
  },
  
  app: {
    head: {
      title: 'CyberChat - Next-Gen AI Chat',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Advanced AI chat application with multi-model support' },
        { name: 'theme-color', content: '#39ff14' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },
  
  runtimeConfig: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      openRouterApiKey: process.env.OPENROUTER_API_KEY || ''
    }
  },
  
  nitro: {
    experimental: {
      wasm: true
    }
  },
  vite: {
    optimizeDeps: {
      include: ['highlight.js', 'marked', 'uuid', 'dexie']
    }
  }
})
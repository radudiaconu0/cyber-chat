// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const mainStore = useMainStore()
  
  // Allow access to login page
  if (to.path === '/login') {
    return
  }
  
  // Allow access to public share pages
  if (to.path.startsWith('/share/')) {
    return
  }
  
  // Check if user is authenticated or in demo mode
  if (!user.value && !mainStore.user) {
    return navigateTo('/login')
  }
})
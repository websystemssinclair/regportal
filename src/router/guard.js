import { useAuthStore } from '@/stores/auth'

export function roleGuard(to) {
  if (import.meta.env.VITE_SKIP_AUTH === 'true') return true

  const requiredRoles = to.meta.roles
  if (!requiredRoles?.length) return true

  const auth = useAuthStore()
  if (!auth.isAuthenticated) return { name: 'login' }
  if (!requiredRoles.includes(auth.currentRole)) return { name: '403' }

  return true
}

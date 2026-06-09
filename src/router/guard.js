import { useAuthStore } from '@/stores/auth'
import { useMaintenanceStore } from '@/stores/maintenance'

export function maintenanceGuard(to) {
  const maintenance = useMaintenanceStore()
  if (maintenance.mode !== 'site') return true
  if (to.name === 'maintenance') return true

  const auth = useAuthStore()
  if (auth.isAdmin) return true

  return { name: 'maintenance' }
}

export function roleGuard(to) {
  if (import.meta.env.VITE_SKIP_AUTH === 'true') return true

  const requiredRoles = to.meta.roles
  if (!requiredRoles?.length) return true

  const auth = useAuthStore()
  if (!auth.isAuthenticated) return { name: 'login' }
  if (!requiredRoles.includes(auth.currentRole)) return { name: '403' }

  return true
}

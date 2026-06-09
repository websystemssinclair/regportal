import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { maintenanceGuard } from '@/router/guard'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useAuthStore } from '@/stores/auth'

function makeRoute(name = 'home') {
  return { name, meta: {}, fullPath: `/${name}` }
}

describe('maintenanceGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('allows navigation when there is no maintenance mode', () => {
    const result = maintenanceGuard(makeRoute())
    expect(result).toBe(true)
  })

  it('allows navigation in backend mode (no redirect)', () => {
    const store = useMaintenanceStore()
    store.setStatus({ mode: 'backend', publicMessage: 'Maintenance.' })

    const result = maintenanceGuard(makeRoute())
    expect(result).toBe(true)
  })

  it('redirects Visitor to maintenance page in site mode', () => {
    const store = useMaintenanceStore()
    store.setStatus({ mode: 'site', publicMessage: 'Down for maintenance.' })

    const result = maintenanceGuard(makeRoute('home'))
    expect(result).toEqual({ name: 'maintenance' })
  })

  it('redirects Student to maintenance page in site mode', () => {
    const maintenance = useMaintenanceStore()
    maintenance.setStatus({ mode: 'site', publicMessage: 'Down for maintenance.' })
    const auth = useAuthStore()
    auth.isAuthenticated = true
    auth.currentRole = 'Student'

    const result = maintenanceGuard(makeRoute('home'))
    expect(result).toEqual({ name: 'maintenance' })
  })

  it('allows Admin through in site mode', () => {
    const maintenance = useMaintenanceStore()
    maintenance.setStatus({ mode: 'site', publicMessage: 'Down for maintenance.' })
    const auth = useAuthStore()
    auth.isAuthenticated = true
    auth.currentRole = 'Admin'

    const result = maintenanceGuard(makeRoute('home'))
    expect(result).toBe(true)
  })

  it('allows Developer through in site mode', () => {
    const maintenance = useMaintenanceStore()
    maintenance.setStatus({ mode: 'site', publicMessage: 'Down for maintenance.' })
    const auth = useAuthStore()
    auth.isAuthenticated = true
    auth.currentRole = 'Developer'

    const result = maintenanceGuard(makeRoute('home'))
    expect(result).toBe(true)
  })

  it('does not redirect when already on the maintenance route', () => {
    const store = useMaintenanceStore()
    store.setStatus({ mode: 'site', publicMessage: 'Down.' })

    const result = maintenanceGuard(makeRoute('maintenance'))
    expect(result).toBe(true)
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMaintenanceStore } from '@/stores/maintenance'

describe('maintenanceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('defaults to no maintenance mode', () => {
    const store = useMaintenanceStore()
    expect(store.mode).toBeNull()
    expect(store.publicMessage).toBe('')
    expect(store.isBackendDown).toBe(false)
  })

  it('isBackendDown is true when mode is backend', () => {
    const store = useMaintenanceStore()
    store.setStatus({ mode: 'backend', publicMessage: 'System maintenance in progress.' })
    expect(store.isBackendDown).toBe(true)
  })

  it('isBackendDown is false when mode is site', () => {
    const store = useMaintenanceStore()
    store.setStatus({ mode: 'site', publicMessage: 'Site is down for maintenance.' })
    expect(store.isBackendDown).toBe(false)
  })
})

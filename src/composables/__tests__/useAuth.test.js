import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '@/composables/useAuth'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getApiToken: vi.fn(),
}))

vi.mock('@/router', () => ({
  default: { replace: vi.fn() },
}))

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.unstubAllEnvs()
  })

  it('exposes user, role, isAuthenticated as computed refs and login/logout as functions', () => {
    const auth = useAuth()

    expect(auth.user.value).toBeNull()
    expect(auth.role.value).toBe('Visitor')
    expect(auth.isAuthenticated.value).toBe(false)
    expect(typeof auth.login).toBe('function')
    expect(typeof auth.logout).toBe('function')
  })

  it('reflects store state reactively', () => {
    const store = useAuthStore()
    const auth = useAuth()

    store.isAuthenticated = true
    store.currentRole = 'Admin'

    expect(auth.isAuthenticated.value).toBe(true)
    expect(auth.role.value).toBe('Admin')
  })
})

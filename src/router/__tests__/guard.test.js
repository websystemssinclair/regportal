import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { roleGuard } from '@/router/guard'
import { useAuthStore } from '@/stores/auth'

function makeRoute(meta = {}) {
  return {
    meta,
    fullPath: '/test',
    name: 'test',
    path: '/test',
    params: {},
    query: {},
    hash: '',
    matched: [],
    redirectedFrom: undefined,
  }
}

describe('roleGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('allows navigation when route has no roles meta', () => {
    const result = roleGuard(makeRoute())
    expect(result).toBe(true)
  })

  it('redirects to login when unauthenticated and route requires roles', () => {
    const result = roleGuard(makeRoute({ roles: ['Student'] }))
    expect(result).toEqual({ name: 'login' })
  })

  it('redirects to 403 when authenticated but wrong role', () => {
    const auth = useAuthStore()
    auth.isAuthenticated = true
    auth.currentRole = 'Admin'

    const result = roleGuard(makeRoute({ roles: ['Student'] }))
    expect(result).toEqual({ name: '403' })
  })

  it('allows navigation when authenticated with correct role', () => {
    const auth = useAuthStore()
    auth.isAuthenticated = true
    auth.currentRole = 'Student'

    const result = roleGuard(makeRoute({ roles: ['Student'] }))
    expect(result).toBe(true)
  })

  it('bypasses guard when VITE_SKIP_AUTH is true', () => {
    vi.stubEnv('VITE_SKIP_AUTH', 'true')

    const result = roleGuard(makeRoute({ roles: ['Student'] }))
    expect(result).toBe(true)

    vi.unstubAllEnvs()
  })
})

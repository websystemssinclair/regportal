import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getApiToken: vi.fn(),
}))

vi.mock('@/router', () => ({
  default: { replace: vi.fn() },
}))

import { sendSamlRequest, retrieveUserFromSaml } from '@/services/authService'
import router from '@/router'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('login()', () => {
    it('saves current URL to sessionStorage then redirects to SSO', async () => {
      const location = { href: 'http://localhost/search' }
      vi.stubGlobal('location', location)
      sendSamlRequest.mockResolvedValue({ data: 'ABC123' })

      const store = useAuthStore()
      await store.login()

      expect(sessionStorage.getItem('regportal:returnTo')).toBe('http://localhost/search')
      expect(location.href).toBe(
        'https://sso.sinclair.edu/EasyConnect/REST/default.aspx?ID=ABC123',
      )
    })
  })

  describe('handleCallback()', () => {
    const samlResponse = {
      success: true,
      targetUrl: 'search',
      firstName: 'Brian',
      lastName: 'Cooney',
      email: 'Brian.Cooney@sinclair.edu',
      tartanId: 521272,
      username: 'brian.cooney',
      imageLink: 'https://tartanimages.sinclair.edu/0521272.jpg',
      availableRoles: [{ role: 'Student', roleId: '10', access: [] }],
      currentRole: '',
      isActive: 1,
    }

    it('populates user and sets isAuthenticated after callback', async () => {
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual({
        firstName: 'Brian',
        lastName: 'Cooney',
        email: 'Brian.Cooney@sinclair.edu',
        tartanId: 521272,
        username: 'brian.cooney',
        imageLink: 'https://tartanimages.sinclair.edu/0521272.jpg',
      })
    })

    it('assigns Student role when availableRoles contains Student', async () => {
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.currentRole).toBe('Student')
    })

    it('assigns Developer role when Developer is present regardless of other roles', async () => {
      retrieveUserFromSaml.mockResolvedValue({
        data: {
          ...samlResponse,
          availableRoles: [
            { role: 'Student', roleId: '10', access: [] },
            { role: 'Admin', roleId: '50', access: [] },
            { role: 'Developer', roleId: '81', access: [] },
          ],
        },
      })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.currentRole).toBe('Developer')
    })

    it('assigns Admin when Admin and Student are present but no Developer', async () => {
      retrieveUserFromSaml.mockResolvedValue({
        data: {
          ...samlResponse,
          availableRoles: [
            { role: 'Student', roleId: '10', access: [] },
            { role: 'Admin', roleId: '50', access: [] },
          ],
        },
      })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.currentRole).toBe('Admin')
    })

    it('defaults to Visitor when availableRoles is empty', async () => {
      retrieveUserFromSaml.mockResolvedValue({
        data: { ...samlResponse, availableRoles: [] },
      })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.currentRole).toBe('Visitor')
    })

    it('restores returnTo URL from sessionStorage and clears it', async () => {
      sessionStorage.setItem('regportal:returnTo', 'http://localhost/courses')
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(router.replace).toHaveBeenCalledWith('http://localhost/courses')
      expect(sessionStorage.getItem('regportal:returnTo')).toBeNull()
    })

    it('falls back to targetUrl route when sessionStorage has no returnTo', async () => {
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(router.replace).toHaveBeenCalledWith({ name: 'search' })
    })
  })

  describe('logout()', () => {
    it('clears user, role, and isAuthenticated; removes sessionStorage key; redirects to home', async () => {
      const store = useAuthStore()
      store.isAuthenticated = true
      store.currentRole = 'Student'
      store.user = { firstName: 'Brian' }
      sessionStorage.setItem('regportal:returnTo', 'http://localhost/courses')

      store.logout()

      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.currentRole).toBe('Visitor')
      expect(sessionStorage.getItem('regportal:returnTo')).toBeNull()
      expect(router.replace).toHaveBeenCalledWith({ name: 'home' })
    })
  })

  describe('VITE_SKIP_AUTH=true', () => {
    it('pre-populates store with Developer mock user on init', () => {
      vi.stubEnv('VITE_SKIP_AUTH', 'true')

      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(true)
      expect(store.currentRole).toBe('Developer')
      expect(store.user).toMatchObject({
        firstName: 'Dev',
        lastName: 'User',
        email: 'dev@sinclair.edu',
        tartanId: 0,
        username: 'dev',
        imageLink: '',
      })
    })
  })
})

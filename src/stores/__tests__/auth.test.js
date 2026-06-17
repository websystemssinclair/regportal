import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getApiToken: vi.fn(),
  getUserData: vi.fn(),
}))

vi.mock('@/stores/cart', () => ({
  useCartStore: vi.fn(),
}))

vi.mock('@/router', () => ({
  default: { replace: vi.fn() },
}))

import { sendSamlRequest, retrieveUserFromSaml, getUserData } from '@/services/authService'
import { useCartStore } from '@/stores/cart'
import router from '@/router'

const mockCart = (overrides = {}) =>
  useCartStore.mockReturnValue({ mergeOnLogin: vi.fn(), ...overrides })

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    mockCart()
    getUserData.mockResolvedValue({ data: { success: true, user: { colleagueToken: 'TOKEN', shoppingCart: [] } } })
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

  describe('initial state', () => {
    it('initializes currentCourses to []', () => {
      const store = useAuthStore()
      expect(store.currentCourses).toEqual([])
    })

    it('initializes waitlist to []', () => {
      const store = useAuthStore()
      expect(store.waitlist).toEqual([])
    })

    it('initializes completedCourses to []', () => {
      const store = useAuthStore()
      expect(store.completedCourses).toEqual([])
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

    it('calls getUserData with tartanId and username from SAML response', async () => {
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(getUserData).toHaveBeenCalledWith({ tartanId: 521272, username: 'brian.cooney' })
    })

    it('stores colleagueToken from getUserData response', async () => {
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })
      getUserData.mockResolvedValue({ data: { success: true, user: { colleagueToken: 'MY_TOKEN', shoppingCart: [] } } })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.colleagueToken).toBe('MY_TOKEN')
    })

    it('calls cartStore.mergeOnLogin with shoppingCart before navigation', async () => {
      const shoppingCart = [{ CourseKey: 'BACKEND1' }]
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })
      getUserData.mockResolvedValue({ data: { success: true, user: { colleagueToken: 'TOKEN', shoppingCart } } })
      const cartMock = { mergeOnLogin: vi.fn() }
      mockCart(cartMock)

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(cartMock.mergeOnLogin).toHaveBeenCalledWith(shoppingCart)
      const mergeCallOrder = cartMock.mergeOnLogin.mock.invocationCallOrder[0]
      const navCallOrder = router.replace.mock.invocationCallOrder[0]
      expect(mergeCallOrder).toBeLessThan(navCallOrder)
    })

    it('login still succeeds and colleagueToken stays null when getUserData fails', async () => {
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })
      getUserData.mockRejectedValue(new Error('network error'))
      const cartMock = { mergeOnLogin: vi.fn() }
      mockCart(cartMock)

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.isAuthenticated).toBe(true)
      expect(store.colleagueToken).toBeNull()
      expect(cartMock.mergeOnLogin).not.toHaveBeenCalled()
      expect(router.replace).toHaveBeenCalled()
    })

    it('stores currentCourses from getUserData response', async () => {
      const currentCourses = [{ CourseKey: '352085', Term: '26SU', Days: '', StartTime: '' }]
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })
      getUserData.mockResolvedValue({ data: { success: true, user: { colleagueToken: 'TOKEN', shoppingCart: [], currentCourses, waitlist: [] } } })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.currentCourses).toEqual(currentCourses)
    })

    it('stores waitlist from getUserData response', async () => {
      const waitlist = [{ CourseKey: '352086', Term: '26SU', Days: '', StartTime: '' }]
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })
      getUserData.mockResolvedValue({ data: { success: true, user: { colleagueToken: 'TOKEN', shoppingCart: [], currentCourses: [], waitlist } } })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.waitlist).toEqual(waitlist)
    })

    it('stores completedCourses from getUserData response', async () => {
      const completedCourses = [{ courseCode: 'ACC-1210', SubjectCode: 'ACC', CourseNo: '1210', Title: 'Intro to Financial Accounting' }]
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })
      getUserData.mockResolvedValue({ data: { success: true, user: { colleagueToken: 'TOKEN', shoppingCart: [], completedCourses } } })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.completedCourses).toEqual(completedCourses)
    })

    it('completedCourses stays [] when getUserData fails', async () => {
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })
      getUserData.mockRejectedValue(new Error('network error'))
      mockCart({ mergeOnLogin: vi.fn() })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.completedCourses).toEqual([])
    })

    it('currentCourses and waitlist stay [] when getUserData fails', async () => {
      retrieveUserFromSaml.mockResolvedValue({ data: samlResponse })
      getUserData.mockRejectedValue(new Error('network error'))
      mockCart({ mergeOnLogin: vi.fn() })

      const store = useAuthStore()
      await store.handleCallback('SAML_ID')

      expect(store.currentCourses).toEqual([])
      expect(store.waitlist).toEqual([])
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

    it('clears currentCourses, waitlist, and completedCourses on logout', () => {
      const store = useAuthStore()
      store.currentCourses = [{ CourseKey: '111' }]
      store.waitlist = [{ CourseKey: '222' }]
      store.completedCourses = [{ courseCode: 'ACC-1210' }]

      store.logout()

      expect(store.currentCourses).toEqual([])
      expect(store.waitlist).toEqual([])
      expect(store.completedCourses).toEqual([])
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

    it('initializes currentCourses, waitlist, sectionErrors, and colleagueToken so ScheduleView mounts cleanly', () => {
      vi.stubEnv('VITE_SKIP_AUTH', 'true')

      const store = useAuthStore()

      expect(store.currentCourses).toEqual([])
      expect(store.waitlist).toEqual([])
      expect(store.sectionErrors).toEqual({})
      expect(store.colleagueToken).toBeNull()
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRegisterNow } from '@/composables/useRegisterNow'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

vi.mock('@/services/registrationService', () => ({
  registerSections: vi.fn(),
}))

vi.mock('@/services/cartService', () => ({
  saveCart: vi.fn(),
}))

vi.mock('@/services/sectionsService', () => ({
  getAvailability: vi.fn(),
}))

vi.mock('@/router', () => ({
  default: { replace: vi.fn() },
}))

vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))

import { registerSections } from '@/services/registrationService'
import { saveCart } from '@/services/cartService'

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  Term: '26SU',
  SubjectCode: 'ACC',
  CourseNo: '1210',
  SectionNo: '100',
  CreditHours: 3,
  status: 'Open',
  waitListAllowed: 'N',
  ...overrides,
})

const successResponse = (errors = []) => ({
  data: {
    results: 1,
    success: true,
    rows: [{ message: 'Registration completed successfully', errors }],
  },
})

function seedAuth(authStore) {
  authStore.isAuthenticated = true
  authStore.currentRole = 'Student'
  authStore.user = { firstName: 'Jane', lastName: 'Doe', tartanId: 521272, username: 'jane.doe', email: 'jane@sinclair.edu', imageLink: '' }
  authStore.colleagueToken = 'TOKEN-123'
}

describe('useRegisterNow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    saveCart.mockResolvedValue({})
  })

  describe('registerNow() — success outcome', () => {
    it('sets sectionResults to success with message Registered on add', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { registerNow, sectionResults } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', status: 'Open' }))

      expect(sectionResults['111']).toEqual({ status: 'success', message: 'Registered' })
    })

    it('sets sectionResults to success with message Waitlisted on waitlist', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { registerNow, sectionResults } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', status: 'Waitlist', waitListAllowed: 'Y' }))

      expect(sectionResults['111']).toEqual({ status: 'success', message: 'Waitlisted' })
    })
  })

  describe('registerNow() — cart removal', () => {
    it('removes the section from the cart if it is present', async () => {
      const authStore = useAuthStore()
      const cartStore = useCartStore()
      seedAuth(authStore)
      cartStore.sections = [makeSection({ CourseKey: '111' })]
      registerSections.mockResolvedValue(successResponse())

      const { registerNow } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', status: 'Open' }))

      expect(cartStore.sections).toHaveLength(0)
    })

    it('does not call removeRegistered when section is not in the cart', async () => {
      const authStore = useAuthStore()
      const cartStore = useCartStore()
      seedAuth(authStore)
      cartStore.sections = []
      registerSections.mockResolvedValue(successResponse())

      const removeRegisteredSpy = vi.spyOn(cartStore, 'removeRegistered')
      const { registerNow } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', status: 'Open' }))

      expect(removeRegisteredSpy).not.toHaveBeenCalled()
    })
  })

  describe('registerNow() — error outcome', () => {
    it('sets sectionResults to error with message from API error row', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse([
        { CourseKey: '111', SectionNo: '100', CourseNumber: 'ACC-1210', SubjectCode: 'ACC', Message: 'Section is full' },
      ]))

      const { registerNow, sectionResults } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', status: 'Open' }))

      expect(sectionResults['111']).toEqual({ status: 'error', message: 'Section is full' })
    })

    it('sets sectionResults to error on network throw', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockRejectedValue(new Error('Network error'))

      const { registerNow, sectionResults } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', status: 'Open' }))

      expect(sectionResults['111']).toEqual({ status: 'error', message: 'Network error' })
    })
  })

  describe('registerNow() — in-flight state', () => {
    it('adds courseKey to registeringSections during the request and removes it after', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)

      let capturedDuringFlight
      registerSections.mockImplementation(async () => {
        capturedDuringFlight = true
        return successResponse()
      })

      const { registerNow, registeringSections } = useRegisterNow()

      let inFlightDuringCall = false
      registerSections.mockImplementation(async () => {
        inFlightDuringCall = registeringSections.has('111')
        return successResponse()
      })

      await registerNow(makeSection({ CourseKey: '111', status: 'Open' }))

      expect(inFlightDuringCall).toBe(true)
      expect(registeringSections.has('111')).toBe(false)
    })

    it('clears registeringSections even when the request throws', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockRejectedValue(new Error('Network error'))

      const { registerNow, registeringSections } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', status: 'Open' }))

      expect(registeringSections.has('111')).toBe(false)
    })
  })

  describe('dismissResult()', () => {
    it('removes the result entry so the button is restored', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { registerNow, dismissResult, sectionResults } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', status: 'Open' }))
      expect(sectionResults['111']).toBeDefined()

      dismissResult('111')
      expect(sectionResults['111']).toBeUndefined()
    })
  })

  describe('reset()', () => {
    it('clears all sectionResults and registeringSections', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)

      let resolveRequest
      registerSections.mockImplementation(() => new Promise((res) => { resolveRequest = res }))

      const { registerNow, reset, sectionResults, registeringSections } = useRegisterNow()

      // start a request but don't await — captures in-flight state
      const pending = registerNow(makeSection({ CourseKey: '111', status: 'Open' }))
      expect(registeringSections.has('111')).toBe(true)

      // resolve the request so it settles cleanly
      resolveRequest(successResponse())
      await pending

      expect(sectionResults['111']).toBeDefined()

      reset()
      expect(Object.keys(sectionResults)).toHaveLength(0)
      expect(registeringSections.size).toBe(0)
    })
  })

  describe('registerNow() — action detection', () => {
    it('calls registerSections with Action: add for an Open section', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { registerNow } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '111', CreditHours: 3, status: 'Open' }))

      expect(registerSections).toHaveBeenCalledWith(expect.objectContaining({
        sections: [{ SectionId: '111', Action: 'add', Credits: 3 }],
      }))
    })

    it('calls registerSections with Action: waitlist for a Waitlist section', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { registerNow } = useRegisterNow()
      await registerNow(makeSection({ CourseKey: '222', CreditHours: 2, status: 'Waitlist', waitListAllowed: 'Y' }))

      expect(registerSections).toHaveBeenCalledWith(expect.objectContaining({
        sections: [{ SectionId: '222', Action: 'waitlist', Credits: 2 }],
      }))
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartRegistration } from '@/composables/useCartRegistration'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

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
  LongName: 'Intro Accounting',
  SectionNo: '100',
  CreditHours: 3,
  status: 'Open',
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

describe('useCartRegistration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    saveCart.mockResolvedValue({})
  })

  describe('register() — all fail', () => {
    it('leaves failed sections in the cart and populates sectionErrors on the store', async () => {
      const cartStore = useCartStore()
      const authStore = useAuthStore()
      seedAuth(authStore)

      cartStore.sections = [
        makeSection({ CourseKey: '111', status: 'Open' }),
      ]

      registerSections.mockResolvedValue({
        data: {
          results: 1,
          success: false,
          rows: [{
            message: 'Registration failed',
            errors: [{ CourseKey: '111', SectionNo: '100', CourseNumber: 'ACC-1210', SubjectCode: 'ACC', Message: 'Section is full' }],
          }],
        },
      })

      const { register } = useCartRegistration()
      await register('26SU', [{ sectionId: '111', action: 'add' }])

      expect(cartStore.sections).toHaveLength(1)
      expect(cartStore.sectionErrors['111']).toBe('Section is full')
    })
  })

  describe('register() — partial success', () => {
    it('removes succeeded sections and leaves failed ones with errors', async () => {
      const cartStore = useCartStore()
      const authStore = useAuthStore()
      seedAuth(authStore)

      cartStore.sections = [
        makeSection({ CourseKey: '111', status: 'Open' }),
        makeSection({ CourseKey: '222', status: 'Open' }),
      ]

      registerSections.mockResolvedValue({
        data: {
          results: 1,
          success: false,
          rows: [{
            message: 'Partial registration',
            errors: [{ CourseKey: '222', SectionNo: '200', CourseNumber: 'MAT-1470', SubjectCode: 'MAT', Message: 'Time conflict' }],
          }],
        },
      })

      const { register } = useCartRegistration()
      await register('26SU', [
        { sectionId: '111', action: 'add' },
        { sectionId: '222', action: 'add' },
      ])

      expect(cartStore.sections.map((s) => s.CourseKey)).toEqual(['222'])
      expect(cartStore.sectionErrors['222']).toBe('Time conflict')
      expect(cartStore.sectionErrors['111']).toBeUndefined()
    })
  })

  describe('register() — loading state', () => {
    it('adds termId to registeringTerms on the store during flight, removes it after', async () => {
      const cartStore = useCartStore()
      const authStore = useAuthStore()
      seedAuth(authStore)
      cartStore.sections = [makeSection({ CourseKey: '111' })]

      let capturedDuringFlight
      registerSections.mockImplementation(async () => {
        capturedDuringFlight = [...cartStore.registeringTerms]
        return successResponse()
      })

      const { register } = useCartRegistration()
      await register('26SU', [{ sectionId: '111', action: 'add' }])

      expect(capturedDuringFlight).toContain('26SU')
      expect(cartStore.registeringTerms).not.toContain('26SU')
    })

    it('clears registeringTerms even when the request throws', async () => {
      const cartStore = useCartStore()
      const authStore = useAuthStore()
      seedAuth(authStore)
      cartStore.sections = [makeSection({ CourseKey: '111' })]

      registerSections.mockRejectedValue(new Error('Network error'))

      const { register } = useCartRegistration()
      await expect(register('26SU', [{ sectionId: '111', action: 'add' }])).rejects.toThrow()

      expect(cartStore.registeringTerms).not.toContain('26SU')
    })
  })

  describe('register() — all succeed', () => {
    it('removes all submitted sections from the cart when all succeed', async () => {
      const cartStore = useCartStore()
      const authStore = useAuthStore()
      seedAuth(authStore)

      cartStore.sections = [
        makeSection({ CourseKey: '111', status: 'Open' }),
        makeSection({ CourseKey: '222', status: 'Open', Term: '26SU' }),
      ]

      registerSections.mockResolvedValue(successResponse())

      const { register } = useCartRegistration()
      await register('26SU', [
        { sectionId: '111', action: 'add' },
        { sectionId: '222', action: 'add' },
      ])

      expect(cartStore.sections).toHaveLength(0)
    })

    it('calls registerSections with the correct API payload', async () => {
      const cartStore = useCartStore()
      const authStore = useAuthStore()
      seedAuth(authStore)

      cartStore.sections = [
        makeSection({ CourseKey: '352071', CreditHours: 4, status: 'Open' }),
      ]

      registerSections.mockResolvedValue(successResponse())

      const { register } = useCartRegistration()
      await register('26SU', [{ sectionId: '352071', action: 'add' }])

      expect(registerSections).toHaveBeenCalledWith({
        token: 'TOKEN-123',
        studentId: 521272,
        username: 'jane.doe',
        password: '',
        sections: [{ SectionId: '352071', Action: 'add', Credits: 4 }],
      })
    })
  })
})

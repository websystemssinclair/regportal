import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useCartRegistration } from '@/composables/useCartRegistration'
import { useCartStore } from '@/stores/cart'
import { useSectionErrorStore } from '@/stores/sectionErrors'

vi.mock('@/composables/useRegistration')
vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
vi.mock('@/services/sectionsService', () => ({ getAvailability: vi.fn() }))
vi.mock('@/router', () => ({ default: { replace: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))

import { useRegistration } from '@/composables/useRegistration'
import { saveCart } from '@/services/cartService'

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  Term: '26SU',
  CreditHours: 3,
  status: 'Open',
  ...overrides,
})

describe('useCartRegistration', () => {
  let mockExecute, mockResults, mockPending

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    saveCart.mockResolvedValue({})

    mockResults = reactive({})
    mockPending = reactive(new Set())
    mockExecute = vi.fn()
    vi.mocked(useRegistration).mockReturnValue({
      execute: mockExecute,
      results: mockResults,
      pending: mockPending,
    })
  })

  describe('register() — credits resolution', () => {
    it('resolves credits from cartStore.sections and passes them to execute', async () => {
      const cartStore = useCartStore()
      cartStore.sections = [makeSection({ CourseKey: '111', CreditHours: 4 })]

      mockExecute.mockImplementation(async (sections) => {
        for (const { sectionId } of sections) mockResults[String(sectionId)] = { status: 'success', message: 'Registered' }
      })

      const { register } = useCartRegistration()
      await register('26SU', [{ sectionId: '111', action: 'add' }])

      expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '111', action: 'add', credits: 4 }])
    })

    it('uses 0 credits for sections not found in cartStore', async () => {
      const cartStore = useCartStore()
      cartStore.sections = []

      mockExecute.mockImplementation(async (sections) => {
        for (const { sectionId } of sections) mockResults[String(sectionId)] = { status: 'success', message: 'Registered' }
      })

      const { register } = useCartRegistration()
      await register('26SU', [{ sectionId: '999', action: 'add' }])

      expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '999', action: 'add', credits: 0 }])
    })
  })

  describe('register() — cart removal on success', () => {
    it('removes succeeded sections from cartStore, leaves failed ones', async () => {
      const cartStore = useCartStore()
      cartStore.sections = [
        makeSection({ CourseKey: '111' }),
        makeSection({ CourseKey: '222' }),
      ]

      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Registered' }
        mockResults['222'] = { status: 'error', message: 'Section is full' }
      })

      const { register } = useCartRegistration()
      await register('26SU', [
        { sectionId: '111', action: 'add' },
        { sectionId: '222', action: 'add' },
      ])

      expect(cartStore.sections.map((s) => s.CourseKey)).toEqual(['222'])
    })

    it('removes all sections when all succeed', async () => {
      const cartStore = useCartStore()
      cartStore.sections = [makeSection({ CourseKey: '111' }), makeSection({ CourseKey: '222' })]

      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Registered' }
        mockResults['222'] = { status: 'success', message: 'Registered' }
      })

      const { register } = useCartRegistration()
      await register('26SU', [
        { sectionId: '111', action: 'add' },
        { sectionId: '222', action: 'add' },
      ])

      expect(cartStore.sections).toHaveLength(0)
    })
  })

  describe('register() — sectionErrorStore on failure', () => {
    it('writes failed section errors to sectionErrorStore', async () => {
      const cartStore = useCartStore()
      const sectionErrorStore = useSectionErrorStore()
      cartStore.sections = [makeSection({ CourseKey: '222' })]

      mockExecute.mockImplementation(async () => {
        mockResults['222'] = { status: 'error', message: 'Time conflict' }
      })

      const { register } = useCartRegistration()
      await register('26SU', [{ sectionId: '222', action: 'add' }])

      expect(sectionErrorStore.errors['222']).toBe('Time conflict')
    })

    it('does not write errors for succeeded sections', async () => {
      const cartStore = useCartStore()
      const sectionErrorStore = useSectionErrorStore()
      cartStore.sections = [makeSection({ CourseKey: '111' })]

      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Registered' }
      })

      const { register } = useCartRegistration()
      await register('26SU', [{ sectionId: '111', action: 'add' }])

      expect(sectionErrorStore.errors['111']).toBeUndefined()
    })
  })

  describe('register() — network error (execute throws)', () => {
    it('returns { succeeded: 0, termError: message } when execute throws', async () => {
      const cartStore = useCartStore()
      cartStore.sections = [makeSection({ CourseKey: '111' })]
      mockExecute.mockRejectedValue(new Error('Network Error'))

      const { register } = useCartRegistration()
      const result = await register('26SU', [{ sectionId: '111', action: 'add' }])

      expect(result).toEqual({ succeeded: 0, termError: 'Registration failed — please try again.' })
    })

    it('does not write to sectionErrorStore when execute throws', async () => {
      const cartStore = useCartStore()
      const sectionErrorStore = useSectionErrorStore()
      cartStore.sections = [makeSection({ CourseKey: '111' })]
      mockExecute.mockRejectedValue(new Error('Network Error'))

      const { register } = useCartRegistration()
      await register('26SU', [{ sectionId: '111', action: 'add' }])

      expect(Object.keys(sectionErrorStore.errors)).toHaveLength(0)
    })
  })

  describe('register() — return value', () => {
    it('returns { succeeded: count } with count of sections that succeeded', async () => {
      const cartStore = useCartStore()
      cartStore.sections = [
        makeSection({ CourseKey: '111' }),
        makeSection({ CourseKey: '222' }),
        makeSection({ CourseKey: '333' }),
      ]

      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Registered' }
        mockResults['222'] = { status: 'success', message: 'Registered' }
        mockResults['333'] = { status: 'error', message: 'Section is full' }
      })

      const { register } = useCartRegistration()
      const result = await register('26SU', [
        { sectionId: '111', action: 'add' },
        { sectionId: '222', action: 'add' },
        { sectionId: '333', action: 'add' },
      ])

      expect(result).toEqual({ succeeded: 2 })
    })
  })

  describe('pending exposure', () => {
    it('exposes the pending Set from useRegistration', () => {
      const { pending } = useCartRegistration()
      expect(pending).toBe(mockPending)
    })
  })

  describe('isTermRegistering()', () => {
    it('returns true during execute for the registered termId and false afterward', async () => {
      const cartStore = useCartStore()
      cartStore.sections = [makeSection({ CourseKey: '111' })]

      let capturedDuringFlight
      mockExecute.mockImplementation(async () => {
        capturedDuringFlight = isTermRegistering('26SU')
        mockResults['111'] = { status: 'success', message: 'Registered' }
      })

      const { register, isTermRegistering } = useCartRegistration()
      await register('26SU', [{ sectionId: '111', action: 'add' }])

      expect(capturedDuringFlight).toBe(true)
      expect(isTermRegistering('26SU')).toBe(false)
    })

    it('returns false for a different termId than the one registering', async () => {
      const cartStore = useCartStore()
      cartStore.sections = [makeSection({ CourseKey: '111' })]

      let capturedDuringFlight
      mockExecute.mockImplementation(async () => {
        capturedDuringFlight = isTermRegistering('27FA')
        mockResults['111'] = { status: 'success', message: 'Registered' }
      })

      const { register, isTermRegistering } = useCartRegistration()
      await register('26SU', [{ sectionId: '111', action: 'add' }])

      expect(capturedDuringFlight).toBe(false)
    })
  })
})

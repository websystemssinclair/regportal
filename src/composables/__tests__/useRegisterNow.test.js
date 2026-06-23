import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRegisterNow } from '@/composables/useRegisterNow'
import { useCartStore } from '@/stores/cart'

const { mockResults, mockPending, mockExecute, mockDismissResult, mockReset } = vi.hoisted(() => ({
  mockResults: {},
  mockPending: new Set(),
  mockExecute: vi.fn(),
  mockDismissResult: vi.fn(),
  mockReset: vi.fn(),
}))

vi.mock('@/composables/useRegistration', () => ({
  useRegistration: () => ({
    results: mockResults,
    pending: mockPending,
    execute: mockExecute,
    dismissResult: mockDismissResult,
    reset: mockReset,
  }),
}))

vi.mock('@/services/cartService', () => ({
  saveCart: vi.fn(),
}))

vi.mock('@/services/sectionsService', () => ({
  getAvailability: vi.fn(),
}))

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  CreditHours: 3,
  status: 'Open',
  ...overrides,
})

describe('useRegisterNow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    Object.keys(mockResults).forEach((k) => delete mockResults[k])
    mockPending.clear()
  })

  describe('action derivation', () => {
    it('calls execute with action "add" when status is Open', async () => {
      mockExecute.mockResolvedValue(undefined)
      const { registerNow } = useRegisterNow()
      await registerNow(makeSection({ status: 'Open' }))
      expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '111', action: 'add', credits: 3 }])
    })

    it('calls execute with action "waitlist" when status is not Open', async () => {
      mockExecute.mockResolvedValue(undefined)
      const { registerNow } = useRegisterNow()
      await registerNow(makeSection({ status: 'Waitlist' }))
      expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '111', action: 'waitlist', credits: 3 }])
    })
  })

  describe('cart removal', () => {
    it('removes section from cart when execute resolves with success', async () => {
      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Registered' }
      })
      const cartStore = useCartStore()
      cartStore.sections = [makeSection()]

      const { registerNow } = useRegisterNow()
      await registerNow(makeSection({ status: 'Open' }))

      expect(cartStore.sections).toHaveLength(0)
    })

    it('does not call removeRegistered when section is absent from cart', async () => {
      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Registered' }
      })
      const cartStore = useCartStore()
      cartStore.sections = []
      const removeRegisteredSpy = vi.spyOn(cartStore, 'removeRegistered')

      const { registerNow } = useRegisterNow()
      await registerNow(makeSection({ status: 'Open' }))

      expect(removeRegisteredSpy).not.toHaveBeenCalled()
    })
  })

  describe('aliases', () => {
    it('sectionResults is the same object as results from useRegistration', () => {
      const { sectionResults } = useRegisterNow()
      expect(sectionResults).toBe(mockResults)
    })

    it('registeringSections is the same object as pending from useRegistration', () => {
      const { registeringSections } = useRegisterNow()
      expect(registeringSections).toBe(mockPending)
    })
  })
})

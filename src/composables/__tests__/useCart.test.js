import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCart } from '@/composables/useCart'
import { useCartStore } from '@/stores/cart'

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/services/cartService', () => ({
  saveCart: vi.fn(),
  buildSavePayload: vi.fn(() => ({ mocked: 'payload' })),
}))

vi.mock('@/services/sectionsService', () => ({
  getAvailability: vi.fn(),
}))

vi.mock('@/router', () => ({ default: { replace: vi.fn() } }))

import { useAuthStore } from '@/stores/auth'
import { saveCart } from '@/services/cartService'

const STORAGE_KEY = 'regportal:cart'

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  CreditHours: 3,
  status: 'Open',
  ...overrides,
})

const mockAuth = (overrides = {}) =>
  useAuthStore.mockReturnValue({
    isAuthenticated: false,
    colleagueToken: null,
    user: null,
    ...overrides,
  })

const authenticatedAuth = () =>
  mockAuth({ isAuthenticated: true, colleagueToken: 'TOKEN', user: { tartanId: 521272, username: 'brian.cooney' } })

describe('useCart', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    mockAuth()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('add() — authenticated', () => {
    it('calls saveCart and does NOT write localStorage', () => {
      authenticatedAuth()
      saveCart.mockResolvedValue({})

      const cart = useCart()
      cart.add(makeSection({ CourseKey: 'AAA' }))

      expect(saveCart).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('add() — Visitor', () => {
    it('writes localStorage and does NOT call saveCart', () => {
      const cart = useCart()
      cart.add(makeSection({ CourseKey: 'AAA' }))

      expect(saveCart).not.toHaveBeenCalled()
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1)
    })
  })

  describe('remove() — authenticated', () => {
    it('calls saveCart and does NOT write localStorage', () => {
      authenticatedAuth()
      saveCart.mockResolvedValue({})
      const cartStore = useCartStore()
      cartStore.sections = [makeSection({ CourseKey: 'AAA' })]

      const cart = useCart()
      cart.remove('AAA')

      expect(saveCart).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('remove() — Visitor', () => {
    it('writes localStorage and does NOT call saveCart', () => {
      const cartStore = useCartStore()
      cartStore.sections = [makeSection({ CourseKey: 'AAA' })]

      const cart = useCart()
      cart.remove('AAA')

      expect(saveCart).not.toHaveBeenCalled()
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    })
  })

  describe('removeRegistered() — authenticated', () => {
    it('calls saveCart and does NOT write localStorage', () => {
      authenticatedAuth()
      saveCart.mockResolvedValue({})
      const cartStore = useCartStore()
      cartStore.sections = [makeSection({ CourseKey: 'AAA' })]

      const cart = useCart()
      cart.removeRegistered(['AAA'])

      expect(saveCart).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('mergeOnLogin() — with carryover', () => {
    it('calls saveCart when local sections are carried over', () => {
      authenticatedAuth()
      saveCart.mockResolvedValue({})
      localStorage.setItem(STORAGE_KEY, JSON.stringify([makeSection({ CourseKey: 'LOCAL1' })]))

      const cart = useCart()
      cart.mergeOnLogin([])

      expect(saveCart).toHaveBeenCalledTimes(1)
    })
  })

  describe('mergeOnLogin() — server cart only', () => {
    it('does NOT call saveCart when no local sections to carry over', () => {
      const cart = useCart()
      cart.mergeOnLogin([makeSection({ CourseKey: 'BACKEND1' })])

      expect(saveCart).not.toHaveBeenCalled()
    })
  })

  describe('mergeOnLogin() — empty both', () => {
    it('is a no-op', () => {
      const cart = useCart()
      cart.mergeOnLogin([])

      expect(saveCart).not.toHaveBeenCalled()
    })
  })
})

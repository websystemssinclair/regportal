import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { useReferenceStore } from '@/stores/reference'

vi.mock('@/services/sectionsService', () => ({
  getAvailability: vi.fn(),
}))

vi.mock('@/services/cartService', () => ({
  saveCart: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

import { getAvailability } from '@/services/sectionsService'
import { saveCart } from '@/services/cartService'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEY = 'regportal:cart'

const makeSection = (overrides = {}) => ({
  CourseKey: '352071',
  Term: '26SU',
  SubjectCode: 'ACC                           ',
  CourseNo: '1210                          ',
  LongName: 'Introduction to Financial Accounting',
  SectionNo: '5T1',
  status: 'Open',
  waitListAllowed: 'N',
  ...overrides,
})

const mockAuth = (overrides = {}) =>
  useAuthStore.mockReturnValue({ isAuthenticated: false, colleagueToken: null, user: null, ...overrides })

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    mockAuth()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('groupedSections', () => {
    function seedTerms(refStore) {
      refStore.terms = [
        { id: '26SU', termName: 'Summer Semester', toView: 'D' },
        { id: '26FA', termName: 'Fall Semester', toView: 'Y' },
        { id: '27SP', termName: 'Spring Semester', toView: 'F' },
        { id: '25FA', termName: 'Old Fall', toView: 'N' },
      ]
    }

    it('sorts sections within a term by SubjectCode.trim() + CourseNo.trim() ascending', () => {
      const refStore = useReferenceStore()
      seedTerms(refStore)
      const store = useCartStore()

      store.add(makeSection({ CourseKey: 'Z', Term: '26SU', SubjectCode: 'MAT  ', CourseNo: '1470  ' }))
      store.add(makeSection({ CourseKey: 'A', Term: '26SU', SubjectCode: 'ACC  ', CourseNo: '1210  ' }))
      store.add(makeSection({ CourseKey: 'M', Term: '26SU', SubjectCode: 'ENG  ', CourseNo: '1101  ' }))

      const { current } = store.groupedSections
      const termGroup = current.find((g) => g.termId === '26SU')

      expect(termGroup.sections.map((s) => s.CourseKey)).toEqual(['A', 'M', 'Z'])
    })

    it('places sections from D/Y/N terms into current and F terms into future', () => {
      const refStore = useReferenceStore()
      seedTerms(refStore)
      const store = useCartStore()

      store.add(makeSection({ CourseKey: 'A', Term: '26SU' }))
      store.add(makeSection({ CourseKey: 'B', Term: '26FA' }))
      store.add(makeSection({ CourseKey: 'C', Term: '27SP' }))
      store.add(makeSection({ CourseKey: 'D', Term: '25FA' }))

      const { current, future } = store.groupedSections

      const currentKeys = current.flatMap((g) => g.sections.map((s) => s.CourseKey))
      const futureKeys = future.flatMap((g) => g.sections.map((s) => s.CourseKey))

      expect(currentKeys.sort()).toEqual(['A', 'B', 'D'])
      expect(futureKeys).toEqual(['C'])
    })
  })

  describe('loadAvailability()', () => {
    it('calls getAvailability with all CourseKeys and overlays status onto each section', async () => {
      getAvailability.mockResolvedValue({
        data: {
          results: 2,
          success: true,
          rows: [
            { courseKey: 'AAA', status: 'Closed' },
            { courseKey: 'BBB', status: 'Open' },
          ],
        },
      })

      const store = useCartStore()
      store.add(makeSection({ CourseKey: 'AAA', status: 'Open' }))
      store.add(makeSection({ CourseKey: 'BBB', status: 'Open' }))

      await store.loadAvailability()

      expect(getAvailability).toHaveBeenCalledWith('AAA,BBB')
      expect(store.sections.find((s) => s.CourseKey === 'AAA').status).toBe('Closed')
      expect(store.sections.find((s) => s.CourseKey === 'BBB').status).toBe('Open')
    })

    it('leaves sections visible when their key is not in the availability response', async () => {
      getAvailability.mockResolvedValue({
        data: { results: 0, success: true, rows: [] },
      })

      const store = useCartStore()
      store.add(makeSection({ CourseKey: 'STALE', status: 'Open' }))

      await store.loadAvailability()

      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].CourseKey).toBe('STALE')
    })
  })

  describe('remove() — auth-aware', () => {
    it('calls saveCart and does NOT write localStorage when authenticated', () => {
      mockAuth({ isAuthenticated: true, colleagueToken: 'TOKEN', user: { tartanId: 521272, username: 'brian.cooney' } })
      saveCart.mockResolvedValue({})
      const store = useCartStore()
      store.sections = [makeSection({ CourseKey: 'AAA' })]
      store.remove('AAA')
      expect(saveCart).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('remove()', () => {
    it('removes the section matching CourseKey and updates localStorage', () => {
      const store = useCartStore()
      store.add(makeSection({ CourseKey: 'AAA' }))
      store.add(makeSection({ CourseKey: 'BBB' }))

      store.remove('AAA')

      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].CourseKey).toBe('BBB')
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
      expect(stored[0].CourseKey).toBe('BBB')
    })
  })

  describe('mergeOnLogin()', () => {
    it('skips entirely when both localStorage and shoppingCart are empty', () => {
      const store = useCartStore()
      store.mergeOnLogin([])
      expect(store.sections).toHaveLength(0)
      expect(saveCart).not.toHaveBeenCalled()
      expect(store.mergeCarryOver).toBeNull()
    })

    it('carries localStorage sections into empty shoppingCart, saves, and sets mergeCarryOver', async () => {
      mockAuth({ isAuthenticated: true, colleagueToken: 'TOKEN', user: { tartanId: 521272, username: 'brian.cooney' } })
      localStorage.setItem(STORAGE_KEY, JSON.stringify([
        makeSection({ CourseKey: 'LOCAL1' }),
        makeSection({ CourseKey: 'LOCAL2' }),
      ]))
      saveCart.mockResolvedValue({})
      const store = useCartStore()
      store.mergeOnLogin([])
      expect(store.sections.map((s) => s.CourseKey)).toEqual(['LOCAL1', 'LOCAL2'])
      expect(saveCart).toHaveBeenCalledTimes(1)
      expect(store.mergeCarryOver).toBe(2)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('shoppingCart version wins for duplicate CourseKey and does not increment carry-over count', () => {
      mockAuth({ isAuthenticated: true, colleagueToken: 'TOKEN', user: { tartanId: 521272, username: 'brian.cooney' } })
      const localVersion = makeSection({ CourseKey: 'DUP', LongName: 'Local Version', status: 'Closed' })
      const backendVersion = makeSection({ CourseKey: 'DUP', LongName: 'Backend Version', status: 'Open' })
      localStorage.setItem(STORAGE_KEY, JSON.stringify([localVersion, makeSection({ CourseKey: 'LOCAL_ONLY' })]))
      saveCart.mockResolvedValue({})
      const store = useCartStore()
      store.mergeOnLogin([backendVersion])
      const dup = store.sections.find((s) => s.CourseKey === 'DUP')
      expect(dup.LongName).toBe('Backend Version')
      expect(dup.status).toBe('Open')
      expect(store.mergeCarryOver).toBe(1)
    })

    it('merges non-overlapping localStorage into shoppingCart and sets mergeCarryOver to localStorage count', () => {
      mockAuth({ isAuthenticated: true, colleagueToken: 'TOKEN', user: { tartanId: 521272, username: 'brian.cooney' } })
      localStorage.setItem(STORAGE_KEY, JSON.stringify([
        makeSection({ CourseKey: 'LOCAL1' }),
        makeSection({ CourseKey: 'LOCAL2' }),
      ]))
      saveCart.mockResolvedValue({})
      const backendSections = [makeSection({ CourseKey: 'BACKEND1' })]
      const store = useCartStore()
      store.mergeOnLogin(backendSections)
      expect(store.sections.map((s) => s.CourseKey).sort()).toEqual(['BACKEND1', 'LOCAL1', 'LOCAL2'])
      expect(store.mergeCarryOver).toBe(2)
    })

    it('loads sections from shoppingCart when localStorage is empty — no saveCart, no toast', () => {
      const backendSections = [makeSection({ CourseKey: 'BACKEND1' }), makeSection({ CourseKey: 'BACKEND2' })]
      const store = useCartStore()
      store.mergeOnLogin(backendSections)
      expect(store.sections).toHaveLength(2)
      expect(store.sections.map((s) => s.CourseKey)).toEqual(['BACKEND1', 'BACKEND2'])
      expect(saveCart).not.toHaveBeenCalled()
      expect(store.mergeCarryOver).toBeNull()
    })
  })

  describe('dismissError()', () => {
    it('removes the error for the given courseKey and leaves others intact', () => {
      const store = useCartStore()
      store.sectionErrors = { '111': 'Section is full', '222': 'Time conflict' }

      store.dismissError('111')

      expect(store.sectionErrors['111']).toBeUndefined()
      expect(store.sectionErrors['222']).toBe('Time conflict')
    })
  })

  describe('add() — auth-aware', () => {
    it('calls saveCart and does NOT write localStorage when authenticated', () => {
      mockAuth({ isAuthenticated: true, colleagueToken: 'TOKEN', user: { tartanId: 521272, username: 'brian.cooney' } })
      saveCart.mockResolvedValue({})
      const store = useCartStore()
      store.add(makeSection({ CourseKey: 'NEW' }))
      expect(saveCart).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('writes localStorage and does NOT call saveCart for Visitor', () => {
      const store = useCartStore()
      store.add(makeSection({ CourseKey: 'NEW' }))
      expect(saveCart).not.toHaveBeenCalled()
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1)
    })
  })

  describe('add()', () => {
    it('persists the full section payload to localStorage under regportal:cart', () => {
      const store = useCartStore()
      const section = makeSection()

      store.add(section)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({ CourseKey: '352071', LongName: 'Introduction to Financial Accounting' })
    })

    it('is a no-op when the section CourseKey is already in the cart', () => {
      const store = useCartStore()
      const section = makeSection()

      store.add(section)
      store.add(makeSection({ SectionNo: 'DUPLICATE' }))

      expect(store.sections).toHaveLength(1)
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1)
    })
  })
})

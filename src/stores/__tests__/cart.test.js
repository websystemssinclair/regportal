import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { useReferenceStore } from '@/stores/reference'

vi.mock('@/services/sectionsService', () => ({
  getAvailability: vi.fn(),
}))

import { getAvailability } from '@/services/sectionsService'

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

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
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

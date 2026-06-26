import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import BooklistView from '@/views/BooklistView.vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useReferenceStore } from '@/stores/reference'
import * as booklistService from '@/services/booklistService'

vi.mock('@/services/booklistService', () => ({
  getBooksByTerm: vi.fn(),
  getBooksBySection: vi.fn(),
}))
vi.mock('@/router', () => ({ default: { replace: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
vi.mock('@/services/sectionsService', () => ({
  getAvailability: vi.fn().mockResolvedValue({ data: { rows: [] } }),
}))
vi.mock('@/services/referenceService', () => ({
  getReferenceData: vi.fn().mockResolvedValue({
    data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '' },
  }),
}))

const BOOK = {
  Title: 'Accounting Fundamentals',
  Author: 'SMITH',
  ISBN: 9781234567890,
  Required: 'Required',
  CourseResult: 'SUCCESS',
  SubjectCode: 'ACC',
  CourseNo: '1100',
  SectionNo: '101',
  Term: '26/SU',
}

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  Term: '26SU',
  SubjectCode: 'ACC',
  CourseNo: '1100',
  SectionNo: '101',
  LongName: 'Intro Accounting',
  ...overrides,
})

describe('BooklistView — aggregate view', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.mocked(booklistService.getBooksByTerm).mockResolvedValue({ data: [] })

    const refStore = useReferenceStore()
    refStore.terms = [{ id: '26SU', termName: 'Summer 2026', toView: 'Y' }]
  })

  function mountView() {
    return mount(BooklistView, { global: { plugins: [pinia] } })
  }

  describe('empty state', () => {
    it('shows empty state when no sections', () => {
      const wrapper = mountView()
      expect(wrapper.text()).toContain('No sections to show')
    })
  })

  describe('registered sections (pre-loaded books)', () => {
    it('shows books from currentCourses.booklist', async () => {
      useAuthStore().currentCourses = [makeSection({ booklist: [BOOK] })]
      const wrapper = mountView()
      await nextTick()
      expect(wrapper.text()).toContain('Accounting Fundamentals')
      expect(wrapper.text()).toContain('SMITH')
      expect(wrapper.text()).toContain('9781234567890')
    })

    it('shows No books required when booklist is empty', async () => {
      useAuthStore().currentCourses = [makeSection({ booklist: [] })]
      const wrapper = mountView()
      await nextTick()
      expect(wrapper.text()).toContain('No books required')
    })

    it('shows term group with Buy Books button', async () => {
      useAuthStore().currentCourses = [makeSection({ booklist: [] })]
      const wrapper = mountView()
      await nextTick()
      expect(wrapper.text()).toContain('Buy Books at eCampus Store')
    })
  })

  describe('waitlisted sections', () => {
    it('shows books from waitlist.booklist', async () => {
      useAuthStore().waitlist = [makeSection({ booklist: [BOOK] })]
      const wrapper = mountView()
      await nextTick()
      expect(wrapper.text()).toContain('Accounting Fundamentals')
    })
  })

  describe('deduplication', () => {
    it('skips cart section when CourseKey matches a registered section', async () => {
      useAuthStore().currentCourses = [makeSection({ CourseKey: '111', booklist: [BOOK] })]
      useCartStore().sections = [makeSection({ CourseKey: '111' })]
      const wrapper = mountView()
      await nextTick()
      // Should only appear once in the DOM
      const text = wrapper.text()
      const count = (text.match(/ACC-1100-101/g) ?? []).length
      expect(count).toBe(1)
      expect(booklistService.getBooksByTerm).not.toHaveBeenCalled()
    })

    it('shows waitlisted section and skips cart duplicate', async () => {
      useAuthStore().waitlist = [makeSection({ CourseKey: '111', booklist: [] })]
      useCartStore().sections = [makeSection({ CourseKey: '111' })]
      const wrapper = mountView()
      await nextTick()
      const count = (wrapper.text().match(/ACC-1100-101/g) ?? []).length
      expect(count).toBe(1)
      expect(booklistService.getBooksByTerm).not.toHaveBeenCalled()
    })
  })

  describe('cart-only sections (API fetch)', () => {
    it('calls getBooksByTerm for cart-only sections', async () => {
      useCartStore().sections = [makeSection()]
      mountView()
      await nextTick()
      expect(booklistService.getBooksByTerm).toHaveBeenCalledWith(
        ['ACC-1100-101'],
        '26SU',
      )
    })

    it('shows fetched books after API call resolves', async () => {
      vi.mocked(booklistService.getBooksByTerm).mockResolvedValue({ data: [BOOK] })
      useCartStore().sections = [makeSection()]
      const wrapper = mountView()
      await flushPromises()
      expect(wrapper.text()).toContain('Accounting Fundamentals')
    })

    it('shows No books required when API returns empty', async () => {
      vi.mocked(booklistService.getBooksByTerm).mockResolvedValue({ data: [] })
      useCartStore().sections = [makeSection()]
      const wrapper = mountView()
      await flushPromises()
      expect(wrapper.text()).toContain('No books required')
    })

    it('shows No books required when API call fails', async () => {
      vi.mocked(booklistService.getBooksByTerm).mockRejectedValue(new Error('Network error'))
      useCartStore().sections = [makeSection()]
      const wrapper = mountView()
      await flushPromises()
      expect(wrapper.text()).toContain('No books required')
    })

    it('ignores rows with non-SUCCESS CourseResult', async () => {
      vi.mocked(booklistService.getBooksByTerm).mockResolvedValue({
        data: [{ ...BOOK, CourseResult: 'ERROR' }],
      })
      useCartStore().sections = [makeSection()]
      const wrapper = mountView()
      await flushPromises()
      expect(wrapper.text()).not.toContain('Accounting Fundamentals')
      expect(wrapper.text()).toContain('No books required')
    })
  })

  describe('ecampus URL', () => {
    it('Buy Books button links to ecampus with correct term format', async () => {
      useAuthStore().currentCourses = [makeSection({ booklist: [] })]
      const wrapper = mountView()
      await nextTick()
      const link = wrapper.find('[data-testid="buy-books-btn"]')
      expect(link.attributes('href')).toContain('semestername=26/SU')
      expect(link.attributes('href')).toContain('courses=ACC')
      expect(link.attributes('href')).toContain('courses3=101')
    })

    it('zero-pads CourseNo to 4 digits in ecampus URL', async () => {
      useAuthStore().currentCourses = [
        makeSection({ SubjectCode: 'CIS', CourseNo: '164', SectionNo: '100', booklist: [] }),
      ]
      const wrapper = mountView()
      await nextTick()
      const link = wrapper.find('[data-testid="buy-books-btn"]')
      expect(link.attributes('href')).toContain('courses2=0164')
    })
  })

  describe('term grouping', () => {
    it('groups sections from different terms separately', async () => {
      const refStore = useReferenceStore()
      refStore.terms = [
        { id: '26SU', termName: 'Summer 2026', toView: 'Y' },
        { id: '26FA', termName: 'Fall 2026', toView: 'F' },
      ]
      useAuthStore().currentCourses = [
        makeSection({ CourseKey: '111', Term: '26SU', booklist: [] }),
        makeSection({ CourseKey: '222', Term: '26FA', booklist: [] }),
      ]
      const wrapper = mountView()
      await nextTick()
      expect(wrapper.find('[data-testid="term-group-26SU"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="term-group-26FA"]').exists()).toBe(true)
    })
  })
})

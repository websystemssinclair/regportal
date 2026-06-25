import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BooklistModal from '@/components/BooklistModal.vue'
import * as booklistService from '@/services/booklistService'

vi.mock('@/services/booklistService', () => ({
  getBooksBySection: vi.fn(),
}))

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  Term: '26SU',
  SubjectCode: 'ACC',
  CourseNo: '1210',
  SectionNo: '100',
  LongName: 'Intro Accounting',
  ...overrides,
})

describe('BooklistModal', () => {
  beforeEach(() => {
    vi.mocked(booklistService.getBooksBySection).mockResolvedValue({ data: [] })
  })

  it('calls getBooksBySection when section has booklist: []', async () => {
    const section = makeSection({ booklist: [] })
    mount(BooklistModal, { props: { section }, attachTo: document.body })
    await flushPromises()
    expect(booklistService.getBooksBySection).toHaveBeenCalledWith(
      'ACC', '1210', '26SU', '100',
    )
  })

  it('calls getBooksBySection when section has no booklist property', async () => {
    const section = makeSection()
    mount(BooklistModal, { props: { section }, attachTo: document.body })
    await flushPromises()
    expect(booklistService.getBooksBySection).toHaveBeenCalledWith(
      'ACC', '1210', '26SU', '100',
    )
  })

  describe('error state', () => {
    it('shows error message and not "No books required" when fetch rejects', async () => {
      vi.mocked(booklistService.getBooksBySection).mockRejectedValue(new Error('network error'))
      const wrapper = mount(BooklistModal, { props: { section: makeSection() }, attachTo: document.body })
      await flushPromises()
      expect(wrapper.text()).toContain("Couldn't load books")
      expect(wrapper.text()).not.toContain('No books required')
    })

    it('shows "No books required" and not error message when fetch resolves with empty array', async () => {
      vi.mocked(booklistService.getBooksBySection).mockResolvedValue({ data: [] })
      const wrapper = mount(BooklistModal, { props: { section: makeSection() }, attachTo: document.body })
      await flushPromises()
      expect(wrapper.text()).toContain('No books required')
      expect(wrapper.text()).not.toContain("Couldn't load books")
    })
  })
})

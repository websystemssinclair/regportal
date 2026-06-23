import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import CartView from '@/views/CartView.vue'
import { useCartStore } from '@/stores/cart'
import { useReferenceStore } from '@/stores/reference'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useCartRegistration } from '@/composables/useCartRegistration'
import { useSectionErrorStore } from '@/stores/sectionErrors'
import { useToast } from 'primevue/usetoast'

vi.mock('@/composables/useCartRegistration')
vi.mock('primevue/usetoast', () => ({ useToast: vi.fn() }))
vi.mock('@/router', () => ({ default: { replace: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
vi.mock('@/services/sectionsService', () => ({ getAvailability: vi.fn().mockResolvedValue({ data: { rows: [] } }) }))
vi.mock('@/services/referenceService', () => ({ getReferenceData: vi.fn().mockResolvedValue({ data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '' } }) }))

const TERM_CURRENT = '26SU'
const TERM_FUTURE = '27FA'

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  Term: TERM_CURRENT,
  SubjectCode: 'ACC',
  CourseNo: '1210',
  SectionNo: '100',
  LongName: 'Intro Accounting',
  CreditHours: 3,
  status: 'Open',
  waitListAllowed: 'N',
  Faculty: 'Smith',
  Days: 'MWF',
  StartTime: '09:00',
  EndTime: '09:50',
  ...overrides,
})

describe('CartView — registration actions', () => {
  let pinia
  let registerMock
  let toastAddMock

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    registerMock = vi.fn().mockResolvedValue({ succeeded: 1 })
    vi.mocked(useCartRegistration).mockReturnValue({ register: registerMock, isTermRegistering: () => false })

    toastAddMock = vi.fn()
    vi.mocked(useToast).mockReturnValue({ add: toastAddMock })

    const refStore = useReferenceStore()
    refStore.terms = [
      { id: TERM_CURRENT, termName: 'Summer 2026', toView: 'Y' },
      { id: TERM_FUTURE, termName: 'Fall 2027', toView: 'F' },
    ]
  })

  function mountView() {
    return mount(CartView, { global: { plugins: [pinia] } })
  }

  describe('Add / Waitlist button visibility', () => {
    it('shows Add button for Open section in current term', () => {
      useCartStore().sections = [makeSection({ status: 'Open' })]
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Add')
    })

    it('shows Waitlist button for Closed/Waitlist section in current term', () => {
      useCartStore().sections = [makeSection({ status: 'Closed', waitListAllowed: 'Y' })]
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Waitlist')
      expect(wrapper.text()).not.toContain('Add')
    })

    it('shows no action button for Cancelled section', () => {
      useCartStore().sections = [makeSection({ status: 'Cancelled' })]
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Add')
      expect(wrapper.text()).not.toContain('Waitlist')
    })

    it('shows no action button for Closed section with no waitlist', () => {
      useCartStore().sections = [makeSection({ status: 'Closed', waitListAllowed: 'N' })]
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Add')
      expect(wrapper.text()).not.toContain('Waitlist')
    })

    it('shows no action button for future-term section', () => {
      useCartStore().sections = [makeSection({ Term: TERM_FUTURE, status: 'Open' })]
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Add')
      expect(wrapper.text()).not.toContain('Waitlist')
    })
  })

  describe('Register All button', () => {
    it('shows Register All button in current term header when actionable sections exist', () => {
      useCartStore().sections = [makeSection({ status: 'Open' })]
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Register All')
    })

    it('hides Register All when no actionable sections in term', () => {
      useCartStore().sections = [makeSection({ status: 'Cancelled' })]
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Register All')
    })

    it('hides Register All for future-term groups', () => {
      useCartStore().sections = [makeSection({ Term: TERM_FUTURE, status: 'Open' })]
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Register All')
    })
  })

  describe('registerSection() wiring', () => {
    it('calls register with correct termId and add action when Add is clicked', async () => {
      const sec = makeSection({ CourseKey: '111', status: 'Open' })
      useCartStore().sections = [sec]
      const wrapper = mountView()
      const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add')
      await addBtn?.trigger('click')
      expect(registerMock).toHaveBeenCalledWith(TERM_CURRENT, [{ sectionId: '111', action: 'add' }])
    })

    it('calls register with waitlist action when Waitlist is clicked', async () => {
      const sec = makeSection({ CourseKey: '222', status: 'Closed', waitListAllowed: 'Y' })
      useCartStore().sections = [sec]
      const wrapper = mountView()
      const wlBtn = wrapper.findAll('button').find((b) => b.text() === 'Waitlist')
      await wlBtn?.trigger('click')
      expect(registerMock).toHaveBeenCalledWith(TERM_CURRENT, [{ sectionId: '222', action: 'waitlist' }])
    })

    it('calls register with all actionable sections when Register All is clicked', async () => {
      useCartStore().sections = [
        makeSection({ CourseKey: '111', status: 'Open' }),
        makeSection({ CourseKey: '222', SectionNo: '200', status: 'Closed', waitListAllowed: 'Y' }),
        makeSection({ CourseKey: '333', SectionNo: '300', status: 'Cancelled' }),
      ]
      const wrapper = mountView()
      const regAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Register All')
      await regAllBtn?.trigger('click')
      expect(registerMock).toHaveBeenCalledWith(TERM_CURRENT, [
        { sectionId: '111', action: 'add' },
        { sectionId: '222', action: 'waitlist' },
      ])
    })
  })

  describe('toast on success', () => {
    it('shows toast with section count after successful register', async () => {
      registerMock.mockResolvedValue({ succeeded: 2 })
      useCartStore().sections = [
        makeSection({ CourseKey: '111', status: 'Open' }),
        makeSection({ CourseKey: '222', SectionNo: '200', status: 'Open' }),
      ]
      const wrapper = mountView()
      const regAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Register All')
      await regAllBtn?.trigger('click')
      await nextTick()
      expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        summary: 'Registered for 2 section(s)',
      }))
    })

    it('does not show toast when all sections fail', async () => {
      registerMock.mockResolvedValue({ succeeded: 0 })
      useCartStore().sections = [makeSection({ status: 'Open' })]
      const wrapper = mountView()
      const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add')
      await addBtn?.trigger('click')
      await nextTick()
      expect(toastAddMock).not.toHaveBeenCalled()
    })
  })

  describe('inline error and dismiss', () => {
    it('shows inline error replacing action button when sectionErrors has entry', async () => {
      useCartStore().sections = [makeSection({ CourseKey: '111', status: 'Open' })]
      useSectionErrorStore().set('111', 'Time conflict')
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Time conflict')
      expect(wrapper.text()).toContain('Dismiss')
      expect(wrapper.text()).not.toContain('Add')
    })

    it('calls dismiss with courseKey when Dismiss is clicked', async () => {
      useCartStore().sections = [makeSection({ CourseKey: '111', status: 'Open' })]
      useSectionErrorStore().set('111', 'Time conflict')
      const wrapper = mountView()
      const dismissBtn = wrapper.findAll('button').find((b) => b.text() === 'Dismiss')
      await dismissBtn?.trigger('click')
      expect(useSectionErrorStore().errors['111']).toBeUndefined()
    })
  })

  describe('in-flight state', () => {
    it('disables Add button while isTermRegistering returns true for the termId', async () => {
      useCartStore().sections = [makeSection({ status: 'Open' })]
      vi.mocked(useCartRegistration).mockReturnValue({
        register: registerMock,
        isTermRegistering: (id) => id === TERM_CURRENT,
      })
      const wrapper = mountView()
      const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add')
      expect(addBtn?.attributes('disabled')).toBeDefined()
    })

    it('disables Register All button while isTermRegistering returns true for the termId', async () => {
      useCartStore().sections = [makeSection({ status: 'Open' })]
      vi.mocked(useCartRegistration).mockReturnValue({
        register: registerMock,
        isTermRegistering: (id) => id === TERM_CURRENT,
      })
      const wrapper = mountView()
      const regAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Register All')
      expect(regAllBtn?.attributes('disabled')).toBeDefined()
    })
  })

  describe('maintenance mode', () => {
    it('shows maintenance banner when isBackendDown', () => {
      useMaintenanceStore().setStatus({ mode: 'backend', publicMessage: 'System is down' })
      useCartStore().sections = [makeSection({ status: 'Open' })]
      const wrapper = mountView()
      expect(wrapper.text()).toContain('System is down')
    })

    it('shows fallback message when publicMessage is empty', () => {
      useMaintenanceStore().setStatus({ mode: 'backend', publicMessage: '' })
      useCartStore().sections = [makeSection({ status: 'Open' })]
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Registration is temporarily unavailable')
    })

    it('disables Add button when isBackendDown', () => {
      useMaintenanceStore().setStatus({ mode: 'backend', publicMessage: '' })
      useCartStore().sections = [makeSection({ status: 'Open' })]
      const wrapper = mountView()
      const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add')
      expect(addBtn?.attributes('disabled')).toBeDefined()
    })

    it('disables Register All button when isBackendDown', () => {
      useMaintenanceStore().setStatus({ mode: 'backend', publicMessage: '' })
      useCartStore().sections = [makeSection({ status: 'Open' })]
      const wrapper = mountView()
      const regAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Register All')
      expect(regAllBtn?.attributes('disabled')).toBeDefined()
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, reactive, nextTick } from 'vue'
import SearchView from '@/views/SearchView.vue'
import { useAuthStore } from '@/stores/auth'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useRegisterNow } from '@/composables/useRegisterNow'
import { useCardExpansion } from '@/composables/useCardExpansion'
import { useSearch } from '@/composables/useSearch'

vi.mock('@/composables/useRegisterNow')
vi.mock('@/composables/useSearch')
vi.mock('@/composables/useCardExpansion')
vi.mock('@/router', () => ({ default: { replace: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
vi.mock('@/services/sectionsService', () => ({
  getAvailability: vi.fn(),
  searchCourses: vi.fn(),
}))

const COURSE_ID = 'ACC-1210-26SU'

const makeCourse = () => ({
  id: COURSE_ID,
  SubjectCode: 'ACC ',
  CourseNumber: '1210',
  LongName: 'Intro Accounting',
  Term: '26SU',
  isOpen: true,
  minCreditHours: 3,
  maxCreditHours: 3,
  isF2F: true,
  isVirtual: false,
  isHybrid: false,
  isFlexpace: false,
  preReqs: 'None',
  Description: 'An intro course',
})

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  SectionNo: '100',
  CreditHours: 3,
  status: 'Open',
  waitListAllowed: 'N',
  openSeats: 5,
  seatCapacity: 25,
  Faculty: 'Smith',
  Days: 'MWF',
  StartTime: '09:00',
  EndTime: '09:50',
  iconTitle: 'Face to Face',
  location: 'Main Campus',
  building: 'Building A',
  ...overrides,
})

describe('SearchView — section row actions', () => {
  let pinia
  let registerNowMock
  let sectionsList

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.stubGlobal('scrollTo', vi.fn())

    sectionsList = [makeSection()]

    registerNowMock = {
      sectionResults: reactive({}),
      registeringSections: reactive(new Set()),
      registerNow: vi.fn(),
      dismissResult: vi.fn(),
      reset: vi.fn(),
    }

    vi.mocked(useRegisterNow).mockReturnValue(registerNowMock)

    vi.mocked(useSearch).mockReturnValue({
      filters: reactive({
        keyword: '', term: '', subjectCode: 'ANY', termFormat: 'all', building: 'any',
        timeChoice: 'segments', segOptions: 'any', rangeStart: '06:00', rangeEnd: '23:00',
        daysOfWeek: 'M,T,W,R,F,S,U', creditHoursMin: 0, creditHoursMax: 15,
        courseList: 'any', page: 1, start: 0, limit: 50,
      }),
      results: ref([makeCourse()]),
      total: ref(1),
      isLoading: ref(false),
      error: ref(null),
      fetch: vi.fn(),
    })

    vi.mocked(useCardExpansion).mockReturnValue({
      expanded: ref(COURSE_ID),
      sectionsByCard: ref({ [COURSE_ID]: sectionsList }),
      detailsByCard: ref({}),
      loadingCard: ref(null),
      sectionErrors: ref({}),
      visibleSections: ref({}),
      toggleCard: vi.fn(),
      showAllSections: vi.fn(),
      sectionsToShow: vi.fn((id) => id === COURSE_ID ? sectionsList : []),
      reset: vi.fn(),
    })
  })

  function mountView() {
    return mount(SearchView, { global: { plugins: [pinia] } })
  }

  function seedStudent(authStore) {
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', lastName: 'Doe', tartanId: 521272, username: 'jane.doe', email: 'jane@sinclair.edu', imageLink: '' }
    authStore.colleagueToken = 'TOKEN-123'
  }

  function seedVisitor() {
    const auth = useAuthStore()
    auth.isAuthenticated = false
    auth.currentRole = 'Visitor'
    auth.user = null
  }

  function seedAdmin() {
    const auth = useAuthStore()
    auth.isAuthenticated = true
    auth.currentRole = 'Admin'
    auth.user = { firstName: 'Ad', lastName: 'Min', tartanId: 0, username: 'admin', email: 'admin@sinclair.edu', imageLink: '' }
    auth.colleagueToken = 'ADM-TOKEN'
  }

  describe('Register Now / Waitlist Now button visibility', () => {
    it('shows Register Now button for Student on Open section', () => {
      seedStudent(useAuthStore())
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Register Now')
    })

    it('shows Waitlist Now button for Student on Waitlist section', () => {
      seedStudent(useAuthStore())
      sectionsList[0] = makeSection({ status: 'Waitlist', waitListAllowed: 'Y' })
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Waitlist Now')
      expect(wrapper.text()).not.toContain('Register Now')
    })

    it('shows neither button for Student on Cancelled section', () => {
      seedStudent(useAuthStore())
      sectionsList[0] = makeSection({ status: 'Cancelled' })
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Register Now')
      expect(wrapper.text()).not.toContain('Waitlist Now')
    })

    it('shows neither button for Student on Closed section with no waitlist', () => {
      seedStudent(useAuthStore())
      sectionsList[0] = makeSection({ status: 'Closed', waitListAllowed: 'N' })
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Register Now')
      expect(wrapper.text()).not.toContain('Waitlist Now')
    })

    it('hides both buttons and shows no Visitor CTA for Admin', () => {
      seedAdmin()
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Register Now')
      expect(wrapper.text()).not.toContain('Sign in to register')
    })
  })

  describe('Visitor CTA', () => {
    it('shows Sign in to register link for Visitor on Open section', () => {
      seedVisitor()
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Sign in to register')
    })

    it('shows Sign in to register link for Visitor on Waitlist section', () => {
      seedVisitor()
      sectionsList[0] = makeSection({ status: 'Waitlist', waitListAllowed: 'Y' })
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Sign in to register')
    })

    it('hides Sign in to register for Visitor on Cancelled section', () => {
      seedVisitor()
      sectionsList[0] = makeSection({ status: 'Cancelled' })
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Sign in to register')
    })

    it('calls authStore.login() when Visitor clicks Sign in to register', async () => {
      seedVisitor()
      const auth = useAuthStore()
      const loginSpy = vi.spyOn(auth, 'login').mockResolvedValue()
      const wrapper = mountView()
      await wrapper.find('button.text-xs.text-\\[\\#ac1a2f\\]').trigger('click')
      expect(loginSpy).toHaveBeenCalled()
    })
  })

  describe('Success outcome', () => {
    it('replaces both action buttons with Registered badge on success', async () => {
      seedStudent(useAuthStore())
      const wrapper = mountView()
      registerNowMock.sectionResults['111'] = { status: 'success', message: 'Registered' }
      await nextTick()
      expect(wrapper.text()).toContain('Registered')
      expect(wrapper.text()).not.toContain('Register Now')
      expect(wrapper.text()).not.toContain('Add to Cart')
    })

    it('replaces both action buttons with Waitlisted badge on waitlist success', async () => {
      seedStudent(useAuthStore())
      sectionsList[0] = makeSection({ status: 'Waitlist', waitListAllowed: 'Y' })
      const wrapper = mountView()
      registerNowMock.sectionResults['111'] = { status: 'success', message: 'Waitlisted' }
      await nextTick()
      expect(wrapper.text()).toContain('Waitlisted')
      expect(wrapper.text()).not.toContain('Waitlist Now')
      expect(wrapper.text()).not.toContain('Add to Cart')
    })
  })

  describe('Error outcome', () => {
    it('shows inline error message and Dismiss button on error', async () => {
      seedStudent(useAuthStore())
      const wrapper = mountView()
      registerNowMock.sectionResults['111'] = { status: 'error', message: 'Time conflict' }
      await nextTick()
      expect(wrapper.text()).toContain('Time conflict')
      expect(wrapper.text()).toContain('Dismiss')
      expect(wrapper.text()).not.toContain('Register Now')
    })

    it('calls dismissResult with courseKey when Dismiss is clicked', async () => {
      seedStudent(useAuthStore())
      const wrapper = mountView()
      registerNowMock.sectionResults['111'] = { status: 'error', message: 'Time conflict' }
      await nextTick()
      await wrapper.find('button.text-xs.text-gray-400').trigger('click')
      expect(registerNowMock.dismissResult).toHaveBeenCalledWith('111')
    })
  })

  describe('In-flight state', () => {
    it('disables Register Now button while section courseKey is in registeringSections', async () => {
      seedStudent(useAuthStore())
      const wrapper = mountView()
      registerNowMock.registeringSections.add('111')
      await nextTick()
      const btn = wrapper.findAll('button').find((b) => b.text() === 'Register Now')
      expect(btn?.attributes('disabled')).toBeDefined()
    })
  })

  describe('Maintenance mode', () => {
    it('disables Register Now button when maintenanceStore.isBackendDown', async () => {
      seedStudent(useAuthStore())
      useMaintenanceStore().setStatus({ mode: 'backend', publicMessage: '' })
      const wrapper = mountView()
      const btn = wrapper.findAll('button').find((b) => b.text() === 'Register Now')
      expect(btn?.attributes('disabled')).toBeDefined()
    })
  })

  describe('registerNow() wiring', () => {
    it('calls registerNow with the section when Register Now is clicked', async () => {
      seedStudent(useAuthStore())
      const wrapper = mountView()
      const btn = wrapper.findAll('button').find((b) => b.text() === 'Register Now')
      await btn?.trigger('click')
      expect(registerNowMock.registerNow).toHaveBeenCalledWith(sectionsList[0])
    })
  })

  describe('reset() on search reset', () => {
    it('calls resetRegisterNow when Search button is clicked', async () => {
      seedStudent(useAuthStore())
      const wrapper = mountView()
      const searchBtn = wrapper.findAll('button').find((b) => b.text() === 'Search')
      await searchBtn?.trigger('click')
      expect(registerNowMock.reset).toHaveBeenCalled()
    })
  })
})

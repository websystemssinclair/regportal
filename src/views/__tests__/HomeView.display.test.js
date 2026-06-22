import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, reactive } from 'vue'
import HomeView from '@/views/HomeView.vue'
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
  building: 'Building A',
  SectionLoc: '',
  regEndDate: '12/31/2099 23:59',
  regStartDate: '01/01/2026 00:00',
  isFuture: false,
  additionalSched: [],
  otherFee: 0,
  labFee: 0,
  printedComments: '',
  startDate: '',
  endDate: '',
  restrictions: '',
  satLocation: '',
  isFlexpace: 0,
  ...overrides,
})

describe('HomeView — status badges', () => {
  let pinia
  let sectionsList

  function setupMocks(section) {
    sectionsList = [section]

    vi.mocked(useRegisterNow).mockReturnValue({
      sectionResults: reactive({}),
      registeringSections: reactive(new Set()),
      registerNow: vi.fn(),
      dismissResult: vi.fn(),
      reset: vi.fn(),
    })

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
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.stubGlobal('scrollTo', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function mountWithSection(overrides = {}) {
    const section = makeSection(overrides)
    setupMocks(section)
    return mount(HomeView, { global: { plugins: [pinia] } })
  }

  it('renders "Cancelled" for a Cancelled section', () => {
    const wrapper = mountWithSection({ status: 'Cancelled' })
    expect(wrapper.text()).toContain('Cancelled')
  })

  it('renders "Waitlist Available" for a Closed section with waitlist', () => {
    const wrapper = mountWithSection({ status: 'Closed', waitListAllowed: 'Y' })
    expect(wrapper.text()).toContain('Waitlist Available')
  })

  it('renders "Closed" for a Closed section without waitlist', () => {
    const wrapper = mountWithSection({ status: 'Closed', waitListAllowed: 'N' })
    expect(wrapper.text()).toContain('Closed')
    expect(wrapper.text()).not.toContain('Waitlist Available')
  })

  it('renders "Registration Closed" for an Open section past regEndDate', () => {
    const wrapper = mountWithSection({ status: 'Open', regEndDate: '01/01/2020 00:00', openSeats: 5 })
    expect(wrapper.text()).toContain('Registration Closed')
  })

  it('renders "Open · X seats" as integer for an Open section with seats', () => {
    const wrapper = mountWithSection({ status: 'Open', openSeats: 7.0, regEndDate: '12/31/2099 23:59' })
    expect(wrapper.text()).toContain('Open · 7 seats')
    expect(wrapper.text()).not.toContain('7.0')
  })

  it('renders no badge text for an Open section with 0 seats', () => {
    const wrapper = mountWithSection({ status: 'Open', openSeats: 0, regEndDate: '12/31/2099 23:59' })
    expect(wrapper.text()).not.toContain('Open ·')
    expect(wrapper.text()).not.toContain('Registration Closed')
    expect(wrapper.text()).not.toContain('Waitlist Available')
  })

  describe('regExpired grace window', () => {
    const NOW = new Date('2026-06-22T12:00:00')

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW)
    })

    it('SectionLoc-320 section 1 day past deadline is NOT expired (grace window)', () => {
      // deadline was yesterday — 1 day ago, within 2-day grace
      const wrapper = mountWithSection({
        status: 'Open',
        openSeats: 5,
        SectionLoc: '320',
        regEndDate: '06/21/2026 11:59',
      })
      expect(wrapper.text()).not.toContain('Registration Closed')
      expect(wrapper.text()).toContain('Open · 5 seats')
    })

    it('SectionLoc-320 section 3 days past deadline shows "Registration Closed"', () => {
      // deadline was 3 days ago — past the 2-day grace
      const wrapper = mountWithSection({
        status: 'Open',
        openSeats: 5,
        SectionLoc: '320',
        regEndDate: '06/19/2026 11:59',
      })
      expect(wrapper.text()).toContain('Registration Closed')
    })

    it('SectionLoc-321 section 1 day past deadline shows "Registration Closed" (no grace)', () => {
      const wrapper = mountWithSection({
        status: 'Open',
        openSeats: 5,
        SectionLoc: '321',
        regEndDate: '06/21/2026 11:59',
      })
      expect(wrapper.text()).toContain('Registration Closed')
    })
  })
})

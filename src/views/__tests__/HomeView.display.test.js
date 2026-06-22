import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, reactive } from 'vue'
import HomeView from '@/views/HomeView.vue'
import { useRegisterNow } from '@/composables/useRegisterNow'
import { useCardExpansion } from '@/composables/useCardExpansion'
import { useSearch } from '@/composables/useSearch'
import { useAuthStore } from '@/stores/auth'

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

let pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  vi.stubGlobal('scrollTo', vi.fn())
})

function setupMocks(section) {
  const sectionsList = [section]

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

function mountWithSection(overrides = {}) {
  const section = makeSection(overrides)
  setupMocks(section)
  return mount(HomeView, { global: { plugins: [pinia] } })
}

describe('HomeView — status badges', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

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

  describe('regExpired defensive guards', () => {
    it('treats missing regEndDate as not expired', () => {
      const wrapper = mountWithSection({ status: 'Open', openSeats: 5, regEndDate: undefined })
      expect(wrapper.text()).not.toContain('Registration Closed')
      expect(wrapper.text()).toContain('Open · 5 seats')
    })

    it('treats empty string regEndDate as not expired', () => {
      const wrapper = mountWithSection({ status: 'Open', openSeats: 5, regEndDate: '' })
      expect(wrapper.text()).not.toContain('Registration Closed')
      expect(wrapper.text()).toContain('Open · 5 seats')
    })

    it('treats malformed regEndDate as not expired', () => {
      const wrapper = mountWithSection({ status: 'Open', openSeats: 5, regEndDate: 'not-a-date' })
      expect(wrapper.text()).not.toContain('Registration Closed')
      expect(wrapper.text()).toContain('Open · 5 seats')
    })
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

describe('HomeView — location display', () => {
  it('SectionLoc 320 renders "Online Learning" with no room', () => {
    const wrapper = mountWithSection({ SectionLoc: '320', building: 'WWW', satLocation: '' })
    expect(wrapper.text()).toContain('Online Learning')
    expect(wrapper.text()).not.toContain('WWW')
  })

  it('isFlexpace truthy (numeric 1) renders "FlexPace" regardless of SectionLoc', () => {
    const wrapper = mountWithSection({ isFlexpace: 1, SectionLoc: '320', building: 'WWW' })
    expect(wrapper.text()).toContain('FlexPace')
    expect(wrapper.text()).not.toContain('Online Learning')
  })

  it('isFlexpace truthy (boolean true) renders "FlexPace"', () => {
    const wrapper = mountWithSection({ isFlexpace: true, SectionLoc: '320', building: 'WWW' })
    expect(wrapper.text()).toContain('FlexPace')
    expect(wrapper.text()).not.toContain('Online Learning')
  })

  it('SectionLoc 321 renders "Online Learning with Meeting Times"', () => {
    const wrapper = mountWithSection({ SectionLoc: '321', building: 'WWW' })
    expect(wrapper.text()).toContain('Online Learning with Meeting Times')
  })

  it('SectionLoc 345 renders "Online Learning with Meeting Times"', () => {
    const wrapper = mountWithSection({ SectionLoc: '345', building: 'WWW' })
    expect(wrapper.text()).toContain('Online Learning with Meeting Times')
  })

  it('building RMTzzz renders "Blended Learning"', () => {
    const wrapper = mountWithSection({ SectionLoc: '', building: 'RMTzzz', satLocation: '' })
    expect(wrapper.text()).toContain('Blended Learning')
  })

  it('building VIRzzz renders "Blended Learning"', () => {
    const wrapper = mountWithSection({ SectionLoc: '', building: 'VIRzzz', satLocation: '' })
    expect(wrapper.text()).toContain('Blended Learning')
  })

  it('satLocation RMTzzz renders "Blended Learning" even when building differs', () => {
    const wrapper = mountWithSection({ SectionLoc: '110', building: 'WING101', satLocation: 'RMTzzz' })
    expect(wrapper.text()).toContain('Blended Learning')
    expect(wrapper.text()).not.toContain('Centerville Campus · WING101')
  })

  it('SectionLoc 110 renders "Centerville Campus · <room>"', () => {
    const wrapper = mountWithSection({ SectionLoc: '110', building: 'BLDG101', satLocation: '' })
    expect(wrapper.text()).toContain('Centerville Campus · BLDG101')
  })

  it('SectionLoc 329 renders "Centerville Campus · <room>"', () => {
    const wrapper = mountWithSection({ SectionLoc: '329', building: 'RM5', satLocation: '' })
    expect(wrapper.text()).toContain('Centerville Campus · RM5')
  })

  it('SectionLoc 310 renders "Huber Heights Learning Center · <room>"', () => {
    const wrapper = mountWithSection({ SectionLoc: '310', building: 'HH101', satLocation: '' })
    expect(wrapper.text()).toContain('Huber Heights Learning Center · HH101')
  })

  it('SectionLoc 300 renders "Englewood Learning Center · <room>"', () => {
    const wrapper = mountWithSection({ SectionLoc: '300', building: 'ENG1', satLocation: '' })
    expect(wrapper.text()).toContain('Englewood Learning Center · ENG1')
  })

  it('SectionLoc 210 renders "Preble County Learning Center · <room>"', () => {
    const wrapper = mountWithSection({ SectionLoc: '210', building: 'PC1', satLocation: '' })
    expect(wrapper.text()).toContain('Preble County Learning Center · PC1')
  })

  it('SectionLoc 200 renders "Courseview Campus Center (Mason) · <room>"', () => {
    const wrapper = mountWithSection({ SectionLoc: '200', building: 'CV1', satLocation: '' })
    expect(wrapper.text()).toContain('Courseview Campus Center (Mason) · CV1')
  })

  it('SectionLoc 330 renders "Other Off Campus Location · <room>"', () => {
    const wrapper = mountWithSection({ SectionLoc: '330', building: 'EXT1', satLocation: '' })
    expect(wrapper.text()).toContain('Other Off Campus Location · EXT1')
  })

  it('SectionLoc OFF renders "Other Off Campus Location · <room>"', () => {
    const wrapper = mountWithSection({ SectionLoc: 'OFF', building: 'EXT2', satLocation: '' })
    expect(wrapper.text()).toContain('Other Off Campus Location · EXT2')
  })

  it('empty SectionLoc renders room only (no campus label)', () => {
    const wrapper = mountWithSection({ SectionLoc: '', building: 'SC101', satLocation: '' })
    expect(wrapper.text()).toContain('SC101')
    expect(wrapper.text()).not.toContain('Campus · SC101')
    expect(wrapper.text()).not.toContain('Learning Center · SC101')
  })

  it('satLocation non-empty renders instead of building', () => {
    const wrapper = mountWithSection({ SectionLoc: '110', building: 'BLDG', satLocation: 'Room 42' })
    expect(wrapper.text()).toContain('Centerville Campus · Room 42')
    expect(wrapper.text()).not.toContain('BLDG')
  })

  it('zzz suffix stripped from building', () => {
    const wrapper = mountWithSection({ SectionLoc: '', building: 'SC101zzz', satLocation: '' })
    expect(wrapper.text()).toContain('SC101')
    expect(wrapper.text()).not.toContain('zzz')
  })

  it('zzz suffix stripped from satLocation', () => {
    const wrapper = mountWithSection({ SectionLoc: '110', building: 'BLDG', satLocation: 'Room5zzz' })
    expect(wrapper.text()).toContain('Room5')
    expect(wrapper.text()).not.toContain('zzz')
  })

  it('iconTitle no longer appears on the section row', () => {
    const wrapper = mountWithSection({ SectionLoc: '', building: 'SC101', satLocation: '', iconTitle: 'ICON_SENTINEL' })
    expect(wrapper.text()).not.toContain('ICON_SENTINEL')
  })
})

describe('HomeView — additional schedule rows', () => {
  it('renders a second meeting row for one additionalSched entry', () => {
    const wrapper = mountWithSection({
      additionalSched: [{ Days: 'TR', startTime: '01:00 PM', endTime: '04:30 PM', building: 'LAB1', satLocation: '' }],
    })
    expect(wrapper.text()).toContain('TR')
    expect(wrapper.text()).toContain('LAB1')
  })

  it('renders two additional rows for two additionalSched entries', () => {
    const wrapper = mountWithSection({
      additionalSched: [
        { Days: 'TR', startTime: '01:00 PM', endTime: '04:30 PM', building: 'LAB1', satLocation: '' },
        { Days: 'F', startTime: '09:00 AM', endTime: '10:00 AM', building: 'BLDG2', satLocation: '' },
      ],
    })
    expect(wrapper.text()).toContain('TR')
    expect(wrapper.text()).toContain('LAB1')
    expect(wrapper.text()).toContain('F')
    expect(wrapper.text()).toContain('BLDG2')
  })

  it('renders no additional rows for empty additionalSched', () => {
    const wrapper = mountWithSection({ additionalSched: [] })
    expect(wrapper.text()).not.toContain('LAB1')
  })

  it('additional row shows entry Days, formatted time, and stripped room', () => {
    const wrapper = mountWithSection({
      additionalSched: [{ Days: 'TR', startTime: '01:00 PM', endTime: '04:30 PM', building: 'LAB1zzz', satLocation: '' }],
    })
    expect(wrapper.text()).toContain('TR')
    expect(wrapper.text()).toContain('1:00–4:30 PM')
    expect(wrapper.text()).toContain('LAB1')
    expect(wrapper.text()).not.toContain('zzz')
  })

  it('additional row uses satLocation instead of building when non-empty', () => {
    const wrapper = mountWithSection({
      additionalSched: [{ Days: 'TR', startTime: '01:00 PM', endTime: '04:30 PM', building: 'BLDG', satLocation: 'Room 42' }],
    })
    expect(wrapper.text()).toContain('Room 42')
    expect(wrapper.text()).not.toContain('BLDG')
  })

  it('does not use startTimeDisplay or endTimeDisplay from additionalSched entries', () => {
    const wrapper = mountWithSection({
      additionalSched: [{
        Days: 'TR',
        startTime: '01:00 PM', endTime: '04:30 PM',
        startTimeDisplay: 'a01:00 PM', endTimeDisplay: 'a04:30 PM',
        building: 'LAB1', satLocation: '',
      }],
    })
    expect(wrapper.text()).not.toContain('a01:00')
    expect(wrapper.text()).not.toContain('a04:30')
    expect(wrapper.text()).toContain('1:00–4:30 PM')
  })
})

describe('HomeView — time formatting', () => {
  it('same-meridiem times render as "1:00–4:30 PM"', () => {
    const wrapper = mountWithSection({ StartTime: '01:00 PM', EndTime: '04:30 PM' })
    expect(wrapper.text()).toContain('1:00–4:30 PM')
    expect(wrapper.text()).not.toContain('01:00 PM')
  })

  it('different-meridiem times render as "11:00 AM–1:00 PM"', () => {
    const wrapper = mountWithSection({ StartTime: '11:00 AM', EndTime: '01:00 PM' })
    expect(wrapper.text()).toContain('11:00 AM–1:00 PM')
  })
})

describe('HomeView — date formatting', () => {
  it('formatDate("08/24/2026") renders as "Aug 24, 2026"', () => {
    const wrapper = mountWithSection({ startDate: '08/24/2026' })
    expect(wrapper.text()).toContain('Aug 24, 2026')
  })
})

describe('HomeView — action button gating', () => {
  it('isFuture section shows "Add to Cart"', () => {
    const wrapper = mountWithSection({ isFuture: true, status: 'Open', openSeats: 5 })
    expect(wrapper.text()).toContain('Add to Cart')
  })

  it('isFuture section does not show "Register Now" for authenticated student', async () => {
    const wrapper = mountWithSection({ isFuture: true, status: 'Open', openSeats: 5 })
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Register Now')
  })

  it('isFuture section shows "Registration opens" hint', () => {
    const wrapper = mountWithSection({ isFuture: true, status: 'Open', regStartDate: '01/01/2026 00:00' })
    expect(wrapper.text()).toContain('Registration opens')
  })

  it('"Registration opens" date formatted as "Aug 24, 2026"', () => {
    const wrapper = mountWithSection({ isFuture: true, status: 'Open', regStartDate: '08/24/2026 00:00' })
    expect(wrapper.text()).toContain('Registration opens Aug 24, 2026')
  })

  it('isFuture section does not show "Sign in to register" for unauthenticated user', () => {
    const wrapper = mountWithSection({ isFuture: true, status: 'Open', openSeats: 5 })
    expect(wrapper.text()).not.toContain('Sign in to register')
  })

  it('regExpired section shows "Add to Cart"', () => {
    const wrapper = mountWithSection({ status: 'Open', regEndDate: '01/01/2020 00:00', openSeats: 5 })
    expect(wrapper.text()).toContain('Add to Cart')
  })

  it('regExpired section does not show "Register Now" for authenticated student', async () => {
    const wrapper = mountWithSection({ status: 'Open', regEndDate: '01/01/2020 00:00', openSeats: 5 })
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Register Now')
  })

  it('regExpired section does not show "Registration opens" hint', () => {
    const wrapper = mountWithSection({ status: 'Open', regEndDate: '01/01/2020 00:00', openSeats: 5 })
    expect(wrapper.text()).not.toContain('Registration opens')
  })

  it('regExpired section does not show "Sign in to register" for unauthenticated user', () => {
    const wrapper = mountWithSection({ status: 'Open', regEndDate: '01/01/2020 00:00', openSeats: 5 })
    expect(wrapper.text()).not.toContain('Sign in to register')
  })

  it('Cancelled section does not show "Add to Cart"', () => {
    const wrapper = mountWithSection({ status: 'Cancelled' })
    expect(wrapper.text()).not.toContain('Add to Cart')
  })

  it('normal Open section shows "Register Now" for authenticated student', async () => {
    const wrapper = mountWithSection({ status: 'Open', openSeats: 5, regEndDate: '12/31/2099 23:59', isFuture: false })
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Register Now')
  })

  it('Closed+waitlist section with regExpired does not show "Waitlist Now" for authenticated student', async () => {
    const wrapper = mountWithSection({ status: 'Closed', waitListAllowed: 'Y', regEndDate: '01/01/2020 00:00' })
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Waitlist Now')
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick, reactive } from 'vue'
import ProgramDetailView from '@/views/ProgramDetailView.vue'
import { useReferenceStore } from '@/stores/reference'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useRegisterNow } from '@/composables/useRegisterNow'
import { useBuilderCourses } from '@/composables/useBuilderCourses'

vi.mock('@/composables/useRegisterNow')
vi.mock('@/composables/useBuilderCourses')

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { programCode: 'ACC.S.AAS' } })),
}))
vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
vi.mock('@/services/programsService', () => ({
  getProgram: vi.fn(),
}))
vi.mock('@/services/sectionsService', () => ({
  getCourseSections: vi.fn(),
}))
vi.mock('@/services/referenceService', () => ({
  getReferenceData: vi.fn().mockResolvedValue({
    data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '', careers: [], programs: [] },
  }),
}))

import { getProgram } from '@/services/programsService'
import { getCourseSections } from '@/services/sectionsService'
import router from '@/router'

const PROGRAM = {
  programName: 'Accounting',
  certificateType: 'Associate of Applied Science',
  description: 'Accountants prepare financial reports.',
  accreditation: 'Accredited by ACBSP.',
  creditHours: '64 Credit Hours',
  department: 'Accounting',
  division: 'Business and Public Services',
  programCode: 'ACC.S.AAS',
  programcourses: [
    { dspType: 'Course', creditHours: 3.0, LongName: 'Introduction to Financial Accounting', CourseCode: 'ACC-1210' },
    { dspType: 'Course', creditHours: 3.0, LongName: 'Intro to Managerial Accounting', CourseCode: 'ACC-1220' },
    { dspType: 'Add.Req', creditHours: 3.0, LongName: 'COM 2211 OR COM 2225', CourseCode: '' },
    { dspType: 'Elective', creditHours: 3.0, LongName: 'Accounting Elective', CourseCode: '' },
  ],
}

const SECTIONS = [
  {
    SectionNo: '100',
    CourseKey: '111',
    Faculty: 'Smith, John',
    Days: 'MW',
    StartTime: '9:00 AM',
    EndTime: '10:15 AM',
    Building: 'SCC',
    Status: 'Open',
    status: 'Open',
    openSeats: 5,
    SeatsAvailable: 5,
    TotalSeats: 25,
    SectionLoc: '110',
    waitListAllowed: 'N',
    isFuture: false,
    regStartDate: '08/24/2026 00:00',
    regEndDate: '12/31/2099 23:59',
    additionalSched: [{ Days: 'F', startTime: '9:00 AM', endTime: '10:00 AM', satLocation: '' }],
    printedComments: 'Lab required on Fridays',
    startDate: '8/25/2026',
    endDate: '12/14/2026',
    otherFee: '25.00',
    labFee: '10.00',
    specialProperty: 'Y',
    restrictions: 'Independent Study Eligible',
  },
]

let pinia
let mockBuilderAdd

function mountView() {
  return mount(ProgramDetailView, {
    global: {
      plugins: [pinia],
    },
  })
}

describe('ProgramDetailView', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()

    getProgram.mockResolvedValue({ data: { success: true, rows: [PROGRAM] } })
    getCourseSections.mockResolvedValue({ data: { rows: SECTIONS } })

    const refStore = useReferenceStore()
    refStore.terms = [{ id: '26SU', termName: 'Summer 2026', toView: 'D' }]

    vi.mocked(useRegisterNow).mockReturnValue({
      sectionResults: reactive({}),
      registeringSections: reactive(new Set()),
      registerNow: vi.fn(),
      dismissResult: vi.fn(),
      reset: vi.fn(),
    })

    mockBuilderAdd = vi.fn()
    vi.mocked(useBuilderCourses).mockReturnValue({
      add: mockBuilderAdd,
      remove: vi.fn(),
      clear: vi.fn(),
      codes: { value: [] },
    })
  })

  it('renders program name and metadata after load', async () => {
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toContain('Accounting')
    expect(wrapper.text()).toContain('Associate of Applied Science')
    expect(wrapper.text()).toContain('64 Credit Hours')
    expect(wrapper.text()).toContain('Business and Public Services')
  })

  it('renders Course rows with expand chevron', async () => {
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const courseRows = wrapper.findAll('[data-testid="course-row"]')
    expect(courseRows).toHaveLength(2)
  })

  it('renders Add.Req rows as plain text with no expand or action buttons', async () => {
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const addReqRows = wrapper.findAll('[data-testid="addreq-row"]')
    expect(addReqRows).toHaveLength(1)
    expect(addReqRows[0].text()).toContain('COM 2211 OR COM 2225')
    expect(addReqRows[0].find('button').exists()).toBe(false)
  })

  it('renders Elective rows as plain text with no expand or action buttons', async () => {
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const electiveRows = wrapper.findAll('[data-testid="elective-row"]')
    expect(electiveRows).toHaveLength(1)
    expect(electiveRows[0].text()).toContain('Accounting Elective')
    expect(electiveRows[0].find('button').exists()).toBe(false)
  })

  it('clicking a Course row calls getCourseSections with the D-term', async () => {
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const courseRow = wrapper.find('[data-testid="course-row"]')
    await courseRow.trigger('click')
    await nextTick()
    expect(getCourseSections).toHaveBeenCalledWith('ACC', '1210', '26SU')
  })

  it('expanded Course row shows section details', async () => {
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const courseRow = wrapper.find('[data-testid="course-row"]')
    await courseRow.trigger('click')
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toContain('Smith, John')
    expect(wrapper.text()).toContain('MW')
  })

  describe('section action buttons', () => {
    let sectionResults, dismissResult

    beforeEach(() => {
      sectionResults = reactive({})
      dismissResult = vi.fn()
      vi.mocked(useRegisterNow).mockReturnValue({
        sectionResults,
        registeringSections: reactive(new Set()),
        registerNow: vi.fn(),
        dismissResult,
        reset: vi.fn(),
      })
    })

    async function expandFirstCourse(authOverrides = {}) {
      Object.assign(useAuthStore(), authOverrides)
      const wrapper = mountView()
      await nextTick()
      await nextTick()
      const courseRow = wrapper.find('[data-testid="course-row"]')
      await courseRow.trigger('click')
      await nextTick()
      await nextTick()
      return wrapper
    }

    function firstRow(wrapper) {
      return wrapper.find('[data-testid="section-row"]')
    }

    it('Student sees Add to Cart on an open actionable Section', async () => {
      const wrapper = await expandFirstCourse({ isAuthenticated: true, currentRole: 'Student' })
      expect(firstRow(wrapper).text()).toContain('Add to Cart')
    })

    it('Student sees In Cart indicator when Section is already in cart', async () => {
      useCartStore().sections = [{ CourseKey: '111' }]
      const wrapper = await expandFirstCourse({ isAuthenticated: true, currentRole: 'Student' })
      const row = firstRow(wrapper)
      expect(row.text()).toContain('In Cart')
      expect(row.text()).not.toContain('Add to Cart')
    })

    it('Student sees Register Now on an open actionable Section', async () => {
      const wrapper = await expandFirstCourse({ isAuthenticated: true, currentRole: 'Student' })
      expect(firstRow(wrapper).text()).toContain('Register Now')
    })

    it('Student sees Waitlist Now on a closed waitlistable Section', async () => {
      getCourseSections.mockResolvedValue({
        data: { rows: [{ ...SECTIONS[0], status: 'Closed', waitListAllowed: 'Y' }] },
      })
      const wrapper = await expandFirstCourse({ isAuthenticated: true, currentRole: 'Student' })
      expect(firstRow(wrapper).text()).toContain('Waitlist Now')
    })

    it('Register Now button is disabled during a maintenance window', async () => {
      useMaintenanceStore().mode = 'backend'
      const wrapper = await expandFirstCourse({ isAuthenticated: true, currentRole: 'Student' })
      const row = firstRow(wrapper)
      const buttons = row.findAll('button')
      const registerBtn = buttons.find((b) => b.text() === 'Register Now')
      expect(registerBtn?.attributes('disabled')).not.toBeUndefined()
    })

    it('Future section shows "Registration opens [date]" instead of action buttons', async () => {
      getCourseSections.mockResolvedValue({
        data: { rows: [{ ...SECTIONS[0], isFuture: true, regStartDate: '08/24/2026 00:00' }] },
      })
      const wrapper = await expandFirstCourse()
      const row = firstRow(wrapper)
      expect(row.text()).toContain('Registration opens Aug 24, 2026')
      expect(row.text()).not.toContain('Add to Cart')
      expect(row.text()).not.toContain('Register Now')
    })

    it('shows per-Section success message after registration', async () => {
      sectionResults['111'] = { status: 'success', message: 'Registered' }
      const wrapper = await expandFirstCourse({ isAuthenticated: true, currentRole: 'Student' })
      expect(firstRow(wrapper).text()).toContain('Registered')
    })

    it('shows per-Section error message with Dismiss after failed registration', async () => {
      sectionResults['111'] = { status: 'error', message: 'Section is full' }
      const wrapper = await expandFirstCourse({ isAuthenticated: true, currentRole: 'Student' })
      const row = firstRow(wrapper)
      expect(row.text()).toContain('Section is full')
      expect(row.text()).toContain('Dismiss')
    })

    it('Visitor sees no Cart or Register Now buttons', async () => {
      const wrapper = await expandFirstCourse({ isAuthenticated: false, currentRole: 'Visitor' })
      const row = firstRow(wrapper)
      expect(row.text()).not.toContain('Add to Cart')
      expect(row.text()).not.toContain('Register Now')
    })

    it('Unauthenticated user sees "Sign in to register" on an actionable Section', async () => {
      const wrapper = await expandFirstCourse({ isAuthenticated: false, currentRole: 'Visitor' })
      expect(firstRow(wrapper).text()).toContain('Sign in to register')
    })
  })

  describe('checkbox multi-select and action bar', () => {
    it('Course rows render a checkbox; Add.Req and Elective rows do not', async () => {
      const wrapper = mountView()
      await nextTick()
      await nextTick()
      expect(wrapper.findAll('[data-testid="course-checkbox"]')).toHaveLength(2)
      expect(wrapper.find('[data-testid="addreq-row"]').find('[data-testid="course-checkbox"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="elective-row"]').find('[data-testid="course-checkbox"]').exists()).toBe(false)
    })

    it('"Add selected to builder" bar is disabled when no courses are checked', async () => {
      const wrapper = mountView()
      await nextTick()
      await nextTick()
      const bar = wrapper.find('[data-testid="add-to-builder-bar"]')
      expect(bar.attributes('disabled')).not.toBeUndefined()
    })

    it('"Add selected to builder" bar label shows count of checked courses', async () => {
      const wrapper = mountView()
      await nextTick()
      await nextTick()
      await wrapper.find('[data-testid="course-checkbox"]').setChecked(true)
      const bar = wrapper.find('[data-testid="add-to-builder-bar"]')
      expect(bar.text()).toContain('Add selected to builder (1)')
    })

    it('clicking the bar calls useBuilderCourses.add() with selected course codes', async () => {
      const wrapper = mountView()
      await nextTick()
      await nextTick()
      await wrapper.find('[data-testid="course-checkbox"]').setChecked(true)
      await wrapper.find('[data-testid="add-to-builder-bar"]').trigger('click')
      expect(mockBuilderAdd).toHaveBeenCalledWith(['ACC-1210'])
    })

    it('clicking the bar navigates to /schedule-builder', async () => {
      const wrapper = mountView()
      await nextTick()
      await nextTick()
      await wrapper.find('[data-testid="course-checkbox"]').setChecked(true)
      await wrapper.find('[data-testid="add-to-builder-bar"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith('/schedule-builder')
    })
  })

  it('shows Completed badge for Student with matching completedCourses', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'
    authStore.isAuthenticated = true
    authStore.completedCourses = [{ courseCode: 'ACC-1210' }]

    const wrapper = mountView()
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toContain('Completed')
  })

  it('does not show Completed badge for Visitor', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Visitor'
    authStore.completedCourses = [{ courseCode: 'ACC-1210' }]

    const wrapper = mountView()
    await nextTick()
    await nextTick()
    expect(wrapper.text()).not.toContain('Completed')
  })

  it('getProgram is called with the programCode from route params', async () => {
    mountView()
    await nextTick()
    expect(getProgram).toHaveBeenCalledWith('ACC-S-AAS')
  })

  describe('enriched section row display', () => {
    async function expandFirstCourse() {
      const wrapper = mountView()
      await nextTick()
      await nextTick()
      const courseRow = wrapper.find('[data-testid="course-row"]')
      await courseRow.trigger('click')
      await nextTick()
      await nextTick()
      return wrapper.find('[data-testid="section-row"]')
    }

    it('renders human-readable location via sectionLocation', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('Centerville Campus')
    })

    it('renders meeting time via formatTimeRange', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('9:00')
      expect(row.text()).toContain('10:15')
    })

    it('renders additional meeting slots from additionalSched', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('F')
      expect(row.text()).toContain('9:00')
    })

    it('renders printed comments when present', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('Lab required on Fridays')
    })

    it('renders start and end dates when present', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('Aug 25, 2026')
      expect(row.text()).toContain('Dec 14, 2026')
    })

    it('renders lab fee badge when labFee is truthy', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('$10.00')
    })

    it('renders other fee badge when otherFee is truthy', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('$25.00')
    })

    it('renders Independent Study badge when restrictions contains "independent"', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('Independent Study')
    })

    it('renders Learning Community badge when specialProperty is "Y"', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('Learning Community')
    })

    it('renders seat availability badge from seatBadge', async () => {
      const row = await expandFirstCourse()
      expect(row.text()).toContain('Open · 5 seats')
    })
  })
})

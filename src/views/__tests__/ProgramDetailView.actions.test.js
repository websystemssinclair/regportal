import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import ProgramDetailView from '@/views/ProgramDetailView.vue'
import { useReferenceStore } from '@/stores/reference'
import { useAuthStore } from '@/stores/auth'

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

  it('section rows have no action buttons', async () => {
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const courseRow = wrapper.find('[data-testid="course-row"]')
    await courseRow.trigger('click')
    await nextTick()
    await nextTick()
    const sectionRows = wrapper.findAll('[data-testid="section-row"]')
    expect(sectionRows.length).toBeGreaterThan(0)
    for (const row of sectionRows) {
      expect(row.find('button').exists()).toBe(false)
    }
  })

  it('"Add to Schedule Builder" button on Course row navigates with query param', async () => {
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const addBtn = wrapper.find('[data-testid="add-to-schedule-btn"]')
    await addBtn.trigger('click')
    expect(router.push).toHaveBeenCalledWith('/schedule-builder?course=ACC-1210')
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

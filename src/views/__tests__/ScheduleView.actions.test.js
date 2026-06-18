import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import ScheduleView from '@/views/ScheduleView.vue'
import { useAuthStore } from '@/stores/auth'
import { useReferenceStore } from '@/stores/reference'
import { useSectionErrorStore } from '@/stores/sectionErrors'

vi.mock('@/composables/useScheduleRegistration')
vi.mock('@/router', () => ({ default: { replace: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/stores/cart', () => ({
  useCartStore: vi.fn(() => ({ mergeOnLogin: vi.fn(), sections: [] })),
}))
vi.mock('@/services/referenceService', () => ({
  getReferenceData: vi.fn().mockResolvedValue({ data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '' } }),
}))

import { useScheduleRegistration } from '@/composables/useScheduleRegistration'

const TERM_D = '26SU'
const TERM_Y = '26FA'

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  Term: TERM_D,
  SubjectCode: 'ACC',
  CourseNo: '1100',
  SectionNo: '100',
  LongName: 'Survey of Accounting',
  CreditHours: 3,
  Faculty: 'Hodges',
  Days: 'MWF',
  StartTime: '09:00 AM',
  EndTime: '09:50 AM',
  waitListAllowed: 'N',
  ...overrides,
})

describe('ScheduleView — term selector', () => {
  let pinia
  let dropMock
  let waitlistDropMock

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    dropMock = vi.fn().mockResolvedValue(undefined)
    waitlistDropMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useScheduleRegistration).mockReturnValue({ drop: dropMock, waitlistDrop: waitlistDropMock })

    const refStore = useReferenceStore()
    refStore.terms = [
      { id: TERM_D, termName: 'Summer 2026', toView: 'D' },
      { id: TERM_Y, termName: 'Fall 2026', toView: 'Y' },
    ]
  })

  function mountView() {
    return mount(ScheduleView, { global: { plugins: [pinia] } })
  }

  function seedStudent(sections = [], waitlisted = []) {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', tartanId: 521272, username: 'jane.doe' }
    authStore.currentCourses = sections
    authStore.waitlist = waitlisted
  }

  it('hides term selector when only one D/Y term has registrations', () => {
    seedStudent([makeSection({ Term: TERM_D })])
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="term-selector"]').exists()).toBe(false)
  })

  it('shows term selector when multiple D/Y terms have registrations', () => {
    seedStudent([makeSection({ Term: TERM_D }), makeSection({ CourseKey: '222', Term: TERM_Y })])
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="term-selector"]').exists()).toBe(true)
  })

  it('defaults to status-D term', () => {
    seedStudent([makeSection({ Term: TERM_D }), makeSection({ CourseKey: '222', Term: TERM_Y })])
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Summer 2026')
  })
})

describe('ScheduleView — weekly grid', () => {
  let pinia
  let dropMock
  let waitlistDropMock

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    dropMock = vi.fn().mockResolvedValue(undefined)
    waitlistDropMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useScheduleRegistration).mockReturnValue({ drop: dropMock, waitlistDrop: waitlistDropMock })

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_D, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleView, { global: { plugins: [pinia] } })
  }

  function seedStudent(sections = [], waitlisted = []) {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', tartanId: 521272, username: 'jane.doe' }
    authStore.currentCourses = sections
    authStore.waitlist = waitlisted
  }

  it('omits online/async sections (no Days) from the grid', () => {
    seedStudent([makeSection({ Days: '', StartTime: '' })])
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="grid-block"]').exists()).toBe(false)
  })

  it('omits online/async sections (no StartTime) from the grid', () => {
    seedStudent([makeSection({ Days: 'MWF', StartTime: '' })])
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="grid-block"]').exists()).toBe(false)
  })

  it('shows count note when sections are omitted from grid', () => {
    seedStudent([makeSection({ Days: '', StartTime: '' })])
    const wrapper = mountView()
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('not shown')
  })

  it('renders a grid block for sections with meeting times', () => {
    seedStudent([makeSection({ Days: 'MWF', StartTime: '09:00 AM', EndTime: '09:50 AM' })])
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="grid-block"]').exists()).toBe(true)
  })

  it('does not show omitted count note when all sections have meeting times', () => {
    seedStudent([makeSection({ Days: 'MWF', StartTime: '09:00 AM', EndTime: '09:50 AM' })])
    const wrapper = mountView()
    expect(wrapper.text()).not.toContain('not shown')
  })
})

describe('ScheduleView — summary list', () => {
  let pinia
  let dropMock
  let waitlistDropMock

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    dropMock = vi.fn().mockResolvedValue(undefined)
    waitlistDropMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useScheduleRegistration).mockReturnValue({ drop: dropMock, waitlistDrop: waitlistDropMock })

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_D, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleView, { global: { plugins: [pinia] } })
  }

  function seedStudent(sections = [], waitlisted = []) {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', tartanId: 521272, username: 'jane.doe' }
    authStore.currentCourses = sections
    authStore.waitlist = waitlisted
  }

  it('shows all registered sections in summary list including online/async', () => {
    seedStudent([
      makeSection({ CourseKey: '111', Days: '', StartTime: '', LongName: 'Online Course' }),
    ])
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Online Course')
  })

  it('shows waitlisted sections in summary list', () => {
    seedStudent([], [makeSection({ CourseKey: '222', LongName: 'Waitlisted Course' })])
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Waitlisted Course')
  })

  it('shows Drop button for registered sections', () => {
    seedStudent([makeSection({ CourseKey: '111' })])
    const wrapper = mountView()
    const dropBtn = wrapper.findAll('button').find((b) => b.text() === 'Drop')
    expect(dropBtn).toBeTruthy()
  })

  it('shows Waitlist Drop button for waitlisted sections', () => {
    seedStudent([], [makeSection({ CourseKey: '222' })])
    const wrapper = mountView()
    const wlDropBtn = wrapper.findAll('button').find((b) => b.text() === 'Waitlist Drop')
    expect(wlDropBtn).toBeTruthy()
  })
})

describe('ScheduleView — drop confirmation', () => {
  let pinia
  let dropMock
  let waitlistDropMock

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    dropMock = vi.fn().mockResolvedValue(undefined)
    waitlistDropMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useScheduleRegistration).mockReturnValue({ drop: dropMock, waitlistDrop: waitlistDropMock })

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_D, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleView, { global: { plugins: [pinia] } })
  }

  function seedStudent(sections = [], waitlisted = []) {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', tartanId: 521272, username: 'jane.doe' }
    authStore.currentCourses = sections
    authStore.waitlist = waitlisted
  }

  it('clicking Drop shows confirmation dialog without calling drop()', async () => {
    seedStudent([makeSection({ CourseKey: '111' })])
    const wrapper = mountView()
    const dropBtn = wrapper.findAll('button').find((b) => b.text() === 'Drop')
    await dropBtn.trigger('click')
    expect(dropMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Are you sure')
  })

  it('clicking Confirm calls drop() with the sectionId', async () => {
    seedStudent([makeSection({ CourseKey: '111' })])
    const wrapper = mountView()
    const dropBtn = wrapper.findAll('button').find((b) => b.text() === 'Drop')
    await dropBtn.trigger('click')
    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Yes, Drop')
    await confirmBtn.trigger('click')
    expect(dropMock).toHaveBeenCalledWith('111')
  })

  it('clicking Cancel dismisses dialog without calling drop()', async () => {
    seedStudent([makeSection({ CourseKey: '111' })])
    const wrapper = mountView()
    const dropBtn = wrapper.findAll('button').find((b) => b.text() === 'Drop')
    await dropBtn.trigger('click')
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(dropMock).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Are you sure')
  })

  it('clicking Waitlist Drop shows confirmation dialog', async () => {
    seedStudent([], [makeSection({ CourseKey: '222' })])
    const wrapper = mountView()
    const wlBtn = wrapper.findAll('button').find((b) => b.text() === 'Waitlist Drop')
    await wlBtn.trigger('click')
    expect(waitlistDropMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Are you sure')
  })

  it('clicking Confirm on Waitlist Drop calls waitlistDrop()', async () => {
    seedStudent([], [makeSection({ CourseKey: '222' })])
    const wrapper = mountView()
    const wlBtn = wrapper.findAll('button').find((b) => b.text() === 'Waitlist Drop')
    await wlBtn.trigger('click')
    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Yes, Drop')
    await confirmBtn.trigger('click')
    expect(waitlistDropMock).toHaveBeenCalledWith('222')
  })
})

describe('ScheduleView — stale selectedTermId (issue 22)', () => {
  let pinia
  let dropMock

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    dropMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useScheduleRegistration).mockReturnValue({ drop: dropMock, waitlistDrop: vi.fn() })

    const refStore = useReferenceStore()
    refStore.terms = [
      { id: TERM_D, termName: 'Summer 2026', toView: 'D' },
      { id: TERM_Y, termName: 'Fall 2026', toView: 'Y' },
    ]
  })

  function mountView() {
    return mount(ScheduleView, { global: { plugins: [pinia] } })
  }

  it('resets selectedTermId when selected term loses all courses', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', tartanId: 521272, username: 'jane.doe' }
    authStore.currentCourses = [
      makeSection({ CourseKey: '111', Term: TERM_D, LongName: 'Summer Course' }),
      makeSection({ CourseKey: '222', Term: TERM_Y, LongName: 'Fall Course' }),
    ]
    authStore.waitlist = []

    const wrapper = mountView()

    const selector = wrapper.find('[data-testid="term-selector"]')
    await selector.setValue(TERM_Y)
    await nextTick()

    // Drop the only fall course
    authStore.currentCourses = authStore.currentCourses.filter((s) => s.Term !== TERM_Y)
    await nextTick()

    // selectedTermId should have reset — now showing summer courses
    expect(wrapper.text()).toContain('Summer Course')
    expect(wrapper.text()).not.toContain('Fall Course')
  })
})

describe('ScheduleView — double-drop race (issue 23)', () => {
  let pinia
  let dropMock

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    dropMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useScheduleRegistration).mockReturnValue({ drop: dropMock, waitlistDrop: vi.fn() })

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_D, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleView, { global: { plugins: [pinia] } })
  }

  function seedStudent(sections = [], waitlisted = []) {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', tartanId: 521272, username: 'jane.doe' }
    authStore.currentCourses = sections
    authStore.waitlist = waitlisted
  }

  it('Drop button is disabled while drop is in-flight', async () => {
    let resolveDrop
    dropMock.mockImplementationOnce(() => new Promise((resolve) => { resolveDrop = resolve }))

    seedStudent([makeSection({ CourseKey: '111' })])
    const wrapper = mountView()

    const dropBtn = wrapper.findAll('button').find((b) => b.text() === 'Drop')
    await dropBtn.trigger('click')

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Yes, Drop')
    await confirmBtn.trigger('click')
    await nextTick()

    const dropBtnDuring = wrapper.findAll('button').find((b) => b.text() === 'Drop')
    expect(dropBtnDuring?.element.disabled).toBe(true)

    resolveDrop()
    await nextTick()
    await nextTick()

    const dropBtnAfter = wrapper.findAll('button').find((b) => b.text() === 'Drop')
    expect(dropBtnAfter?.element.disabled).toBe(false)
  })

  it('sections not being dropped remain enabled', async () => {
    let resolveDrop
    dropMock.mockImplementationOnce(() => new Promise((resolve) => { resolveDrop = resolve }))

    seedStudent([
      makeSection({ CourseKey: '111', LongName: 'Course A' }),
      makeSection({ CourseKey: '222', LongName: 'Course B' }),
    ])
    const wrapper = mountView()

    // Trigger drop on course 111 only
    const dropBtns = wrapper.findAll('button').filter((b) => b.text() === 'Drop')
    await dropBtns[0].trigger('click')
    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Yes, Drop')
    await confirmBtn.trigger('click')
    await nextTick()

    // Course 222's drop button should still be enabled
    const allDropBtns = wrapper.findAll('button').filter((b) => b.text() === 'Drop')
    const enabledBtn = allDropBtns.find((b) => !b.element.disabled)
    expect(enabledBtn).toBeTruthy()

    resolveDrop()
    await nextTick()
  })
})

describe('ScheduleView — inline errors', () => {
  let pinia
  let dropMock

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    dropMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useScheduleRegistration).mockReturnValue({ drop: dropMock, waitlistDrop: vi.fn() })

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_D, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleView, { global: { plugins: [pinia] } })
  }

  function seedStudent(sections = []) {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', tartanId: 521272, username: 'jane.doe' }
    authStore.currentCourses = sections
    authStore.waitlist = []
  }

  it('shows inline error when sectionErrors has an entry for the section', () => {
    seedStudent([makeSection({ CourseKey: '111' })])
    useSectionErrorStore().set('111', 'Cannot drop after deadline')
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Cannot drop after deadline')
    expect(wrapper.text()).toContain('Dismiss')
  })

  it('calls dismiss when Dismiss is clicked', async () => {
    seedStudent([makeSection({ CourseKey: '111' })])
    useSectionErrorStore().set('111', 'Cannot drop after deadline')
    const wrapper = mountView()
    const dismissBtn = wrapper.findAll('button').find((b) => b.text() === 'Dismiss')
    await dismissBtn.trigger('click')
    expect(useSectionErrorStore().errors['111']).toBeUndefined()
  })
})

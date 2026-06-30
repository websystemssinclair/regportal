import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, computed, reactive, nextTick } from 'vue'
import ScheduleBuilderView from '@/views/ScheduleBuilderView.vue'
import { useReferenceStore } from '@/stores/reference'
import { useAuthStore } from '@/stores/auth'
import { useScheduleBuilder } from '@/composables/useScheduleBuilder'
import { useRegisterSchedule } from '@/composables/useRegisterSchedule'

vi.mock('@/composables/useBuilderCourses', () => ({
  useBuilderCourses: () => ({ codes: { value: [] }, add: vi.fn(), remove: vi.fn(), clear: vi.fn() }),
}))
vi.mock('@/composables/useScheduleBuilder')
vi.mock('@/composables/useRegisterSchedule')
vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useRoute: vi.fn(() => ({ query: {} })) }
})
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
vi.mock('@/services/sectionsService', () => ({
  searchCourses: vi.fn().mockResolvedValue({ data: { rows: [], results: 0 } }),
  getCourseSections: vi.fn().mockResolvedValue({ data: { rows: [] } }),
  getAvailability: vi.fn(),
}))
vi.mock('@/services/referenceService', () => ({
  getReferenceData: vi.fn().mockResolvedValue({
    data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '' },
  }),
}))

import router from '@/router'

const TERM_ID = '26SU'

let buildMock
let selectScheduleMock
let registerScheduleMock
let schedulesRef
let scheduleResultsObj
let registeringSchedulesSet

function seedComposable(overrides = {}) {
  buildMock = vi.fn()
  selectScheduleMock = vi.fn()
  registerScheduleMock = vi.fn()
  schedulesRef = ref(overrides.schedules ?? [])
  scheduleResultsObj = reactive(overrides.scheduleResults ?? {})
  registeringSchedulesSet = reactive(overrides.registeringSchedules ?? new Set())

  vi.mocked(useScheduleBuilder).mockReturnValue({
    schedules: schedulesRef,
    isBuilding: ref(false),
    error: ref(null),
    count: computed(() => schedulesRef.value.length),
    build: buildMock,
    selectSchedule: selectScheduleMock,
    getCredits: vi.fn(() => 3),
  })

  vi.mocked(useRegisterSchedule).mockReturnValue({
    scheduleResults: scheduleResultsObj,
    registeringSchedules: registeringSchedulesSet,
    registerSchedule: registerScheduleMock,
    reset: vi.fn(),
  })
}

describe('ScheduleBuilderView — select schedule', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('clicking "Select Schedule" calls selectSchedule with the schedule and navigates to /cart', async () => {
    const fakeSchedule = [{ id: '111', subjectCode: 'ACC', courseNo: '1100', days: ['M'], startMin: 540, endMin: 630 }]
    seedComposable({ schedules: [fakeSchedule] })

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    const btn = wrapper.find('[data-testid="select-schedule-btn"]')
    expect(btn.exists()).toBe(true)

    await btn.trigger('click')

    expect(selectScheduleMock).toHaveBeenCalledWith(fakeSchedule)
    expect(router.push).toHaveBeenCalledWith('/cart')
  })

  it('renders one schedule card per schedule result', async () => {
    const fakeSchedule = [{ id: '111', subjectCode: 'ACC', courseNo: '1100', days: [], startMin: null, endMin: null }]
    seedComposable({ schedules: [fakeSchedule, fakeSchedule] })

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    expect(wrapper.findAll('[data-testid="schedule-card"]')).toHaveLength(2)
  })

  it('shows empty state when no schedules', () => {
    seedComposable({ schedules: [] })
    const wrapper = mountView()
    expect(wrapper.findAll('[data-testid="schedule-card"]')).toHaveLength(0)
  })
})

describe('ScheduleBuilderView — soft-cap warning', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    seedComposable()

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('does not show soft-cap warning with 7 or fewer courses', async () => {
    const wrapper = mountView()
    for (let i = 0; i < 7; i++) {
      wrapper.vm.selectedCourses.push({ subjectCode: 'ACC', courseNo: `110${i}`, longName: 'Test', rawSections: [] })
    }
    await nextTick()
    expect(wrapper.find('[data-testid="soft-cap-warning"]').exists()).toBe(false)
  })

  it('shows soft-cap warning when more than 7 courses are selected', async () => {
    const wrapper = mountView()
    for (let i = 0; i < 8; i++) {
      wrapper.vm.selectedCourses.push({ subjectCode: 'ACC', courseNo: `110${i}`, longName: 'Test', rawSections: [] })
    }
    await nextTick()
    expect(wrapper.find('[data-testid="soft-cap-warning"]').exists()).toBe(true)
  })
})

describe('ScheduleBuilderView — build button', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    seedComposable()

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('shows a build button', () => {
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="build-button"]').exists()).toBe(true)
  })

  it('clicking build button calls build() with selected courses and filters', async () => {
    const wrapper = mountView()
    wrapper.vm.selectedCourses.push({
      subjectCode: 'ACC', courseNo: '1100', longName: 'Test', rawSections: [],
    })
    await nextTick()
    await wrapper.find('[data-testid="build-button"]').trigger('click')
    expect(buildMock).toHaveBeenCalledWith(wrapper.vm.selectedCourses, expect.any(Object))
  })
})

describe('ScheduleBuilderView — location filter', () => {
  let pinia

  const LOCATIONS = [
    { building: "All Locations", id: "any" },
    { building: "Sinclair Dayton Campus", id: "SCC" },
    { building: "Centerville Campus", id: "CENT" },
    { building: "Courseview Campus Center - Mason", id: "CvCC" },
    { building: "Online", id: "WWW" },
    { building: "Off Campus Locations", id: "other" }
  ]

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    seedComposable()

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
    refStore.locations = LOCATIONS
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('renders a location dropdown when locations are available', () => {
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="location-filter"]').exists()).toBe(true)
  })

  it('renders one option per location entry', () => {
    const wrapper = mountView()
    const options = wrapper.findAll('[data-testid="location-filter"] option')
    expect(options).toHaveLength(LOCATIONS.length)
    expect(options[0].text()).toBe('All Locations')
    expect(options[1].text()).toBe('Sinclair Dayton Campus')
  })

  it('passes the selected location as filters.location when build is triggered', async () => {
    const wrapper = mountView()
    await wrapper.find('[data-testid="location-filter"]').setValue('SCC')
    wrapper.vm.selectedCourses.push({ subjectCode: 'ACC', courseNo: '1100', longName: 'Test', rawSections: [] })
    await nextTick()
    await wrapper.find('[data-testid="build-button"]').trigger('click')
    expect(buildMock).toHaveBeenCalledWith(
      wrapper.vm.selectedCourses,
      expect.objectContaining({ location: 'SCC' }),
    )
  })

  it('does not render location dropdown when no locations in store', () => {
    const refStore = useReferenceStore()
    refStore.locations = []
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="location-filter"]').exists()).toBe(false)
  })
})

describe('ScheduleBuilderView — Register Now', () => {
  let pinia
  const fakeSchedule = [{ id: '111', subjectCode: 'ACC', courseNo: '1100', days: ['M'], startMin: 540, endMin: 630 }]

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    seedComposable({ schedules: [fakeSchedule] })

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('does not show Register Now button for Visitor', async () => {
    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    expect(wrapper.find('[data-testid="register-now-btn"]').exists()).toBe(false)
  })

  it('shows Register Now button for Student', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'
    authStore.isAuthenticated = true

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    expect(wrapper.find('[data-testid="register-now-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-now-btn"]').text()).toBe('Register Now')
  })

  it('calls registerSchedule with schedule and index when Register Now is clicked', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    await wrapper.find('[data-testid="register-now-btn"]').trigger('click')
    expect(registerScheduleMock).toHaveBeenCalledWith(fakeSchedule, '111', expect.any(Function))
  })

  it('shows Registering… and disables button when in flight', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'
    registeringSchedulesSet.add('111')

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    const btn = wrapper.find('[data-testid="register-now-btn"]')
    expect(btn.text()).toBe('Registering…')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows per-section results and hides button after successful registration', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'
    scheduleResultsObj['111'] = { '111': { status: 'registered', message: 'Registered' } }

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    expect(wrapper.find('[data-testid="register-now-btn"]').exists()).toBe(false)
    const results = wrapper.findAll('[data-testid="register-section-result"]')
    expect(results).toHaveLength(1)
    expect(results[0].text()).toContain('ACC-1100')
    expect(results[0].text()).toContain('Registered')
  })

  it('shows card-level error and keeps button for availability fetch failure', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'
    scheduleResultsObj['111'] = { _error: 'Could not check seat availability. Please try again.' }

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    expect(wrapper.find('[data-testid="register-card-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-card-error"]').text()).toContain('Could not check seat availability')
    expect(wrapper.find('[data-testid="register-now-btn"]').exists()).toBe(true)
  })
})

describe('ScheduleBuilderView — schedule summary', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('each card renders a schedule-summary element', async () => {
    const schedule = [
      { id: '101', subjectCode: 'ACC', courseNo: '1100', days: ['M', 'W', 'F'], startMin: 540, endMin: 630, creditHours: 3, termFormat: 'Full Term', building: 'Dayton' },
    ]
    seedComposable({ schedules: [schedule, schedule] })

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    const cards = wrapper.findAll('[data-testid="schedule-card"]')
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      expect(card.find('[data-testid="schedule-summary"]').exists()).toBe(true)
    }
  })

  it('summary text matches the expected format', async () => {
    const schedule = [
      { id: '101', subjectCode: 'ACC', courseNo: '1100', days: ['M', 'W', 'F'], startMin: 540, endMin: 630, creditHours: 3, termFormat: 'Full Term', building: 'Dayton' },
      { id: '102', subjectCode: 'ENG', courseNo: '1100', days: [], startMin: null, endMin: null, creditHours: 3, termFormat: 'Full Term', building: null },
    ]
    seedComposable({ schedules: [schedule] })

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    const summary = wrapper.find('[data-testid="schedule-summary"]')
    expect(summary.text()).toBe('MWF + Online · 6 cr · Full Term · Dayton')
  })

  it('summary shows "Multiple" when schedule spans 3+ distinct term formats', async () => {
    const schedule = [
      { id: '101', subjectCode: 'ACC', courseNo: '1100', days: ['M'], startMin: 540, endMin: 630, creditHours: 3, termFormat: 'Full Term', building: 'Dayton' },
      { id: '102', subjectCode: 'ENG', courseNo: '1100', days: ['T'], startMin: 540, endMin: 630, creditHours: 3, termFormat: 'A Term', building: 'Dayton' },
      { id: '103', subjectCode: 'MAT', courseNo: '1470', days: ['W'], startMin: 540, endMin: 630, creditHours: 3, termFormat: 'B Term', building: 'Dayton' },
    ]
    seedComposable({ schedules: [schedule] })

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    expect(wrapper.find('[data-testid="schedule-summary"]').text()).toContain('Multiple')
  })

  it('summary omits "+ Online" when all sections have campus days', async () => {
    const schedule = [
      { id: '101', subjectCode: 'ACC', courseNo: '1100', days: ['M', 'W', 'F'], startMin: 540, endMin: 630, creditHours: 3, termFormat: 'Full Term', building: 'Dayton' },
    ]
    seedComposable({ schedules: [schedule] })

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    expect(wrapper.find('[data-testid="schedule-summary"]').text()).not.toContain('+ Online')
  })
})

describe('ScheduleBuilderView — schedule sort order', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('renders schedules in fewest-campus-days order', async () => {
    const scheduleMany = [
      { id: '1', subjectCode: 'ACC', courseNo: '1100', days: ['M', 'T', 'W', 'R', 'F'], startMin: 540, endMin: 630, creditHours: 3, termFormat: 'Full Term', building: 'Dayton' },
    ]
    const scheduleFew = [
      { id: '2', subjectCode: 'ENG', courseNo: '1100', days: [], startMin: null, endMin: null, creditHours: 3, termFormat: 'Full Term', building: null },
    ]
    // scheduleFew (0 campus days) should sort before scheduleMany (5 campus days)
    seedComposable({ schedules: [scheduleMany, scheduleFew] })

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    const summaries = wrapper.findAll('[data-testid="schedule-summary"]')
    expect(summaries).toHaveLength(2)
    // First card should be the online-only schedule (fewer campus days)
    expect(summaries[0].text()).toContain('Online')
    expect(summaries[1].text()).toContain('MTWRF')
  })
})

describe('ScheduleBuilderView — section detail rows', () => {
  let pinia

  const inPerson = {
    id: '111',
    subjectCode: 'ACC',
    courseNo: '1100',
    sectionNo: '100',
    longName: 'Intro Accounting',
    days: ['M', 'W', 'F'],
    startMin: 540,
    endMin: 630,
    building: 'Bldg A',
    faculty: 'Smith',
    creditHours: 3,
    termFormat: 'Full',
  }

  const online = {
    id: '222',
    subjectCode: 'ENG',
    courseNo: '1100',
    sectionNo: '200',
    longName: 'English Comp',
    days: [],
    startMin: null,
    endMin: null,
    building: null,
    faculty: 'Jones',
    creditHours: 3,
    termFormat: 'Full',
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('renders one schedule-section-row per section in each card', async () => {
    seedComposable({ schedules: [[inPerson, online]] })
    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    expect(wrapper.findAll('[data-testid="schedule-section-row"]')).toHaveLength(2)
  })

  it('each row shows the section ID in subjectCode-courseNo-sectionNo format', async () => {
    seedComposable({ schedules: [[inPerson]] })
    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    const row = wrapper.find('[data-testid="schedule-section-row"]')
    expect(row.text()).toContain('ACC-1100-100')
  })

  it('online sections render "Online" text in their row', async () => {
    seedComposable({ schedules: [[inPerson, online]] })
    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    const rows = wrapper.findAll('[data-testid="schedule-section-row"]')
    expect(rows[0].text()).not.toContain('Online')
    expect(rows[1].text()).toContain('Online')
  })

  it('online rows show "—" in the building column; in-person rows show building value', async () => {
    seedComposable({ schedules: [[inPerson, online]] })
    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    const rows = wrapper.findAll('[data-testid="schedule-section-row"]')
    expect(rows[0].text()).toContain('Bldg A')
    expect(rows[1].text()).toContain('—')
  })

  it('two cards each render one row per section independently', async () => {
    seedComposable({ schedules: [[inPerson], [online]] })
    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()

    const cards = wrapper.findAll('[data-testid="schedule-card"]')
    expect(cards[0].findAll('[data-testid="schedule-section-row"]')).toHaveLength(1)
    expect(cards[1].findAll('[data-testid="schedule-section-row"]')).toHaveLength(1)
  })
})

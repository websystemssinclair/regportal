import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, computed, reactive, nextTick } from 'vue'
import ScheduleBuilderView from '@/views/ScheduleBuilderView.vue'
import { useReferenceStore } from '@/stores/reference'
import { useAuthStore } from '@/stores/auth'
import { useScheduleBuilder } from '@/composables/useScheduleBuilder'

vi.mock('@/composables/useScheduleBuilder')
vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))
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
    scheduleResults: scheduleResultsObj,
    registeringSchedules: registeringSchedulesSet,
    registerSchedule: registerScheduleMock,
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
    { id: 'any', building: 'All Locations' },
    { id: 'SCC', building: 'Sinclair Dayton Campus' },
    { id: 'CENT', building: 'Centerville Campus' },
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
    expect(registerScheduleMock).toHaveBeenCalledWith(fakeSchedule, 0)
  })

  it('shows Registering… and disables button when in flight', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'
    registeringSchedulesSet.add(0)

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
    scheduleResultsObj[0] = { '111': { status: 'registered', message: 'Registered' } }

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
    scheduleResultsObj[0] = { _error: 'Could not check seat availability. Please try again.' }

    const wrapper = mountView()
    wrapper.vm.hasBuilt = true
    await nextTick()
    expect(wrapper.find('[data-testid="register-card-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-card-error"]').text()).toContain('Could not check seat availability')
    expect(wrapper.find('[data-testid="register-now-btn"]').exists()).toBe(true)
  })
})

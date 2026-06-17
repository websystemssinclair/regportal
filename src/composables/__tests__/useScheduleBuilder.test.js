import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScheduleBuilder } from '@/composables/useScheduleBuilder'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { getAvailability } from '@/services/sectionsService'
import { registerSections } from '@/services/registrationService'

vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
vi.mock('@/services/sectionsService', () => ({ getAvailability: vi.fn() }))
vi.mock('@/services/registrationService', () => ({ registerSections: vi.fn() }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))

const DEFAULT_FILTERS = {
  rangeStart: 480,
  rangeEnd: 1320,
  days: ['M', 'T', 'W', 'R', 'F'],
  termFormat: 'all',
  location: 'any',
}

const rawSection = (overrides = {}) => ({
  CourseKey: '111',
  Term: '26SU',
  SubjectCode: 'ACC',
  CourseNo: '1100',
  LongName: 'Intro Accounting',
  SectionNo: '100',
  CreditHours: 3,
  Faculty: 'Smith',
  Days: 'MWF',
  StartTime: '09:00',
  EndTime: '09:50',
  TermFormat: 'LEC',
  Building: 'BLDG-A',
  ...overrides,
})

let mockWorkerInstance

beforeEach(() => {
  setActivePinia(createPinia())
  mockWorkerInstance = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
  }
  vi.stubGlobal('Worker', vi.fn(() => mockWorkerInstance))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('useScheduleBuilder — build()', () => {
  it('starts as not building with no schedules', () => {
    const { schedules, isBuilding, count } = useScheduleBuilder()
    expect(schedules.value).toEqual([])
    expect(isBuilding.value).toBe(false)
    expect(count.value).toBe(0)
  })

  it('sets isBuilding true and posts message to worker when build() is called', () => {
    const { isBuilding, build } = useScheduleBuilder()
    const course = { rawSections: [rawSection()] }
    build([course], DEFAULT_FILTERS)
    expect(isBuilding.value).toBe(true)
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'build' }),
    )
  })

  it('posts normalized sections and filters to the worker', () => {
    const { build } = useScheduleBuilder()
    const sec = rawSection({ CourseKey: '999', Days: 'MWF', StartTime: '09:00', EndTime: '09:50' })
    build([{ rawSections: [sec] }], DEFAULT_FILTERS)

    const [msg] = mockWorkerInstance.postMessage.mock.calls[0]
    expect(msg.type).toBe('build')
    expect(msg.courses).toHaveLength(1)
    expect(msg.courses[0][0]).toMatchObject({
      id: '999',
      days: ['M', 'W', 'F'],
      startMin: expect.any(Number),
      endMin: expect.any(Number),
    })
    expect(msg.filters).toEqual(DEFAULT_FILTERS)
  })

  it('clears isBuilding and populates schedules when worker posts result', () => {
    const { schedules, isBuilding, build } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    const fakeSchedules = [[{ id: '111' }]]
    mockWorkerInstance.onmessage({ data: { type: 'result', schedules: fakeSchedules } })

    expect(isBuilding.value).toBe(false)
    expect(schedules.value).toEqual(fakeSchedules)
  })

  it('sets error and clears isBuilding when worker posts error', () => {
    const { error, isBuilding, build } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    mockWorkerInstance.onmessage({ data: { type: 'error', message: 'Worker crashed' } })

    expect(isBuilding.value).toBe(false)
    expect(error.value).toBe('Worker crashed')
  })

  it('terminates the previous worker when build() is called again', () => {
    const { build } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)
    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1)
  })

  it('count reflects schedules length after result', () => {
    const { count, build } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)
    mockWorkerInstance.onmessage({ data: { type: 'result', schedules: [['a'], ['b'], ['c']] } })
    expect(count.value).toBe(3)
  })
})

describe('useScheduleBuilder — selectSchedule()', () => {
  it('adds raw sections to cart for each normalized section in the schedule', () => {
    const { build, selectSchedule } = useScheduleBuilder()
    const raw1 = rawSection({ CourseKey: '111' })
    const raw2 = rawSection({ CourseKey: '222' })
    build([{ rawSections: [raw1] }, { rawSections: [raw2] }], DEFAULT_FILTERS)

    const cartStore = useCartStore()
    vi.spyOn(cartStore, 'add')

    const normalizedSchedule = [{ id: '111' }, { id: '222' }]
    selectSchedule(normalizedSchedule)

    expect(cartStore.add).toHaveBeenCalledWith(raw1)
    expect(cartStore.add).toHaveBeenCalledWith(raw2)
  })

  it('ignores ids not found in the cache', () => {
    const { build, selectSchedule } = useScheduleBuilder()
    build([{ rawSections: [rawSection({ CourseKey: '111' })] }], DEFAULT_FILTERS)

    const cartStore = useCartStore()
    vi.spyOn(cartStore, 'add')

    selectSchedule([{ id: '999' }])  // 999 not in cache
    expect(cartStore.add).not.toHaveBeenCalled()
  })
})

describe('useScheduleBuilder — registerSchedule()', () => {
  const normalizedSec = { id: '111', subjectCode: 'ACC', courseNo: '1100', days: ['M'], startMin: 540, endMin: 630 }
  const schedule = [normalizedSec]

  function setupAuth() {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.currentRole = 'Student'
    authStore.user = { firstName: 'Jane', lastName: 'Doe', email: 'jane@sinclair.edu', tartanId: 12345, username: 'jdoe', imageLink: '' }
    authStore.colleagueToken = 'tok-abc'
    return authStore
  }

  beforeEach(() => {
    vi.mocked(getAvailability).mockReset()
    vi.mocked(registerSections).mockReset()
  })

  it('sets scheduleResults._error on availability fetch failure', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockRejectedValue(new Error('Network error'))

    const { build, registerSchedule, scheduleResults } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    expect(scheduleResults[0]).toEqual({ _error: 'Could not check seat availability. Please try again.' })
    expect(registerSections).not.toHaveBeenCalled()
  })

  it('calls registerSections with add action for Open sections', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { build, registerSchedule } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    const payload = vi.mocked(registerSections).mock.calls[0][0]
    expect(payload.sections[0].Action).toBe('add')
    expect(payload.sections[0].SectionId).toBe('111')
  })

  it('calls registerSections with waitlist action for non-Open sections', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Closed' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { build, registerSchedule } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    const payload = vi.mocked(registerSections).mock.calls[0][0]
    expect(payload.sections[0].Action).toBe('waitlist')
  })

  it('sets registered result on successful registration', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { build, registerSchedule, scheduleResults } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    expect(scheduleResults[0]['111']).toEqual({ status: 'registered', message: 'Registered' })
  })

  it('sets waitlisted result when action was waitlist', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Waitlisted' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { build, registerSchedule, scheduleResults } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    expect(scheduleResults[0]['111']).toEqual({ status: 'waitlisted', message: 'Waitlisted' })
  })

  it('sets error message for section returned in errors array', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockResolvedValue({
      data: { rows: [{ errors: [{ CourseKey: '111', Message: 'Section full' }] }] },
    })

    const { build, registerSchedule, scheduleResults } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    expect(scheduleResults[0]['111']).toEqual({ status: 'error', message: 'Section full' })
  })

  it('sets _error on registerSections failure', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockRejectedValue(new Error('500'))

    const { build, registerSchedule, scheduleResults } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    expect(scheduleResults[0]).toEqual({ _error: 'Registration failed. Please try again.' })
  })

  it('removes scheduleIndex from registeringSchedules after completion', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { build, registerSchedule, registeringSchedules } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    expect(registeringSchedules.has(0)).toBe(false)
  })

  it('sets _error and removes from registeringSchedules when authStore.user is null', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'
    authStore.user = null
    vi.mocked(getAvailability).mockResolvedValue({
      data: { rows: [{ CourseKey: '111', Status: 'Open' }] },
    })

    const { build, registerSchedule, scheduleResults, registeringSchedules } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    expect(scheduleResults[0]?._error).toBeDefined()
    expect(registeringSchedules.has(0)).toBe(false)
  })

  it('sets _error when availability response is missing a section key', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({
      data: { rows: [{ CourseKey: '999', Status: 'Open' }] }, // '111' not included
    })

    const { build, registerSchedule, scheduleResults } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    await registerSchedule(schedule, 0)

    expect(scheduleResults[0]?._error).toBeDefined()
    expect(registerSections).not.toHaveBeenCalled()
  })

  it('does not clear registeringSchedules when build() is called mid-flight', () => {
    const { build, registeringSchedules } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)
    registeringSchedules.add(0)

    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    expect(registeringSchedules.has(0)).toBe(true)
  })

  it('preserves scheduleResults when build() is called — clears only when worker responds', () => {
    const { build, scheduleResults } = useScheduleBuilder()
    scheduleResults[0] = { '111': { status: 'registered', message: 'Registered' } }

    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    // scheduleResults NOT cleared yet — worker hasn't responded
    expect(Object.keys(scheduleResults)).toHaveLength(1)

    // Worker responds → now cleared
    mockWorkerInstance.onmessage({ data: { type: 'result', schedules: [] } })
    expect(Object.keys(scheduleResults)).toHaveLength(0)
  })

  it('discards stale result when build() fires mid-registration', async () => {
    setupAuth()
    let resolveAvailability
    vi.mocked(getAvailability).mockReturnValue(
      new Promise((resolve) => { resolveAvailability = resolve }),
    )
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { build, registerSchedule, scheduleResults } = useScheduleBuilder()
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    const registerPromise = registerSchedule(schedule, 0)

    // Build fires mid-flight (new gen)
    build([{ rawSections: [rawSection()] }], DEFAULT_FILTERS)

    // Resolve availability after the new build
    resolveAvailability({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    await registerPromise

    // Stale result must not land on any card
    expect(scheduleResults[0]).toBeUndefined()
  })
})

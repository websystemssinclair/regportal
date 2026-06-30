import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScheduleBuilder } from '@/composables/useScheduleBuilder'
import { useCartStore } from '@/stores/cart'

vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
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
  Building: 'BLDG-A',
  comments: '',
  flexFlag: '',
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
      sectionNo: expect.any(String),
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

describe('useScheduleBuilder — termFormat derivation', () => {
  const termFormatOf = (overrides) => {
    const { build } = useScheduleBuilder()
    build([{ rawSections: [rawSection(overrides)] }], DEFAULT_FILTERS)
    const [msg] = mockWorkerInstance.postMessage.mock.calls[0]
    return msg.courses[0][0].termFormat
  }

  it('derives Full when comments is empty and flexFlag is empty', () => {
    expect(termFormatOf({ comments: '', flexFlag: '' })).toBe('Full')
  })

  it('derives A from comments containing "A Term" (case-insensitive)', () => {
    expect(termFormatOf({ comments: 'A TERM', flexFlag: 'Y' })).toBe('A')
    expect(termFormatOf({ comments: 'a term', flexFlag: 'Y' })).toBe('A')
  })

  it('derives B from comments containing "B Term"', () => {
    expect(termFormatOf({ comments: 'B Term', flexFlag: 'Y' })).toBe('B')
  })

  it('derives 12 from comments containing "12 Week"', () => {
    expect(termFormatOf({ comments: '12 Week Term', flexFlag: 'Y' })).toBe('12')
  })

  it('derives ST when flexFlag is Y but no A/B/12 comment', () => {
    expect(termFormatOf({ comments: '', flexFlag: 'Y' })).toBe('ST')
  })

  it('derives Full when flexFlag is empty and comments has unrelated text', () => {
    expect(termFormatOf({ comments: 'Some other note', flexFlag: '' })).toBe('Full')
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

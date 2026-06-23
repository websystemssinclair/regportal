import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useRegisterSchedule } from '@/composables/useRegisterSchedule'
import { useAuthStore } from '@/stores/auth'
import { getAvailability } from '@/services/sectionsService'

vi.mock('@/composables/useRegistration')
vi.mock('@/services/sectionsService', () => ({ getAvailability: vi.fn() }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))

import { useRegistration } from '@/composables/useRegistration'

const schedule = [{ id: '111', subjectCode: 'ACC', courseNo: '1100', days: ['M'], startMin: 540, endMin: 630 }]
const getCredits = () => 3

describe('useRegisterSchedule — registerSchedule()', () => {
  let mockExecute, mockResults

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockResults = reactive({})
    mockExecute = vi.fn()
    vi.mocked(useRegistration).mockReturnValue({
      execute: mockExecute,
      results: mockResults,
    })
  })

  it('sets scheduleResults._error on availability fetch failure', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockRejectedValue(new Error('Network error'))

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]).toEqual({ _error: 'Could not check seat availability. Please try again.' })
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('calls execute with add action for Open sections', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    mockExecute.mockImplementation(async () => {
      mockResults['111'] = { status: 'success', message: 'Registered' }
    })

    const { registerSchedule } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '111', action: 'add', credits: 3 }])
  })

  it('calls execute with waitlist action for non-Open sections', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Closed' }] } })
    mockExecute.mockImplementation(async () => {
      mockResults['111'] = { status: 'success', message: 'Waitlisted' }
    })

    const { registerSchedule } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '111', action: 'waitlist', credits: 3 }])
  })

  it('sets registered result on successful add', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    mockExecute.mockImplementation(async () => {
      mockResults['111'] = { status: 'success', message: 'Registered' }
    })

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]['111']).toEqual({ status: 'registered', message: 'Registered' })
  })

  it('sets waitlisted result when action was waitlist', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Waitlisted' }] } })
    mockExecute.mockImplementation(async () => {
      mockResults['111'] = { status: 'success', message: 'Waitlisted' }
    })

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]['111']).toEqual({ status: 'waitlisted', message: 'Waitlisted' })
  })

  it('sets error result for section returned with error status', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    mockExecute.mockImplementation(async () => {
      mockResults['111'] = { status: 'error', message: 'Section full' }
    })

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]['111']).toEqual({ status: 'error', message: 'Section full' })
  })

  it('removes scheduleIndex from registeringSchedules after completion', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [] } })
    mockExecute.mockResolvedValue(undefined)

    const { registerSchedule, registeringSchedules } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(registeringSchedules.has(0)).toBe(false)
  })

  it('sets _error and removes from registeringSchedules when authStore.user is null', async () => {
    const authStore = useAuthStore()
    authStore.user = null
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })

    const { registerSchedule, scheduleResults, registeringSchedules } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]?._error).toBeDefined()
    expect(registeringSchedules.has(0)).toBe(false)
  })

  it('sets _error when availability response is missing a section key', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockResolvedValue({
      data: { rows: [{ CourseKey: '999', Status: 'Open' }] },
    })

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]?._error).toBeDefined()
    expect(mockExecute).not.toHaveBeenCalled()
  })
})

describe('useRegisterSchedule — reset()', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(useRegistration).mockReturnValue({
      execute: vi.fn().mockResolvedValue(undefined),
      results: reactive({ '111': { status: 'success', message: 'Registered' } }),
    })
  })

  it('clears scheduleResults and registeringSchedules', async () => {
    const authStore = useAuthStore()
    authStore.user = { tartanId: 1, username: 'jdoe' }
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })

    const { registerSchedule, scheduleResults, registeringSchedules, reset } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)
    expect(Object.keys(scheduleResults)).toHaveLength(1)

    reset()

    expect(Object.keys(scheduleResults)).toHaveLength(0)
    expect(registeringSchedules.size).toBe(0)
  })
})

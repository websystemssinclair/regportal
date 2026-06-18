import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRegisterSchedule } from '@/composables/useRegisterSchedule'
import { useAuthStore } from '@/stores/auth'
import { getAvailability } from '@/services/sectionsService'
import { registerSections } from '@/services/registrationService'

vi.mock('@/services/sectionsService', () => ({ getAvailability: vi.fn() }))
vi.mock('@/services/registrationService', () => ({ registerSections: vi.fn() }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))

const schedule = [{ id: '111', subjectCode: 'ACC', courseNo: '1100', days: ['M'], startMin: 540, endMin: 630 }]
const getCredits = () => 3

function setupAuth() {
  const authStore = useAuthStore()
  authStore.isAuthenticated = true
  authStore.currentRole = 'Student'
  authStore.user = { firstName: 'Jane', lastName: 'Doe', email: 'jane@sinclair.edu', tartanId: 12345, username: 'jdoe', imageLink: '' }
  authStore.colleagueToken = 'tok-abc'
  return authStore
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(getAvailability).mockReset()
  vi.mocked(registerSections).mockReset()
})

describe('useRegisterSchedule — registerSchedule()', () => {
  it('sets scheduleResults._error on availability fetch failure', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockRejectedValue(new Error('Network error'))

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]).toEqual({ _error: 'Could not check seat availability. Please try again.' })
    expect(registerSections).not.toHaveBeenCalled()
  })

  it('calls registerSections with add action for Open sections', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { registerSchedule } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    const payload = vi.mocked(registerSections).mock.calls[0][0]
    expect(payload.sections[0].Action).toBe('add')
    expect(payload.sections[0].SectionId).toBe('111')
  })

  it('calls registerSections with waitlist action for non-Open sections', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Closed' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { registerSchedule } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    const payload = vi.mocked(registerSections).mock.calls[0][0]
    expect(payload.sections[0].Action).toBe('waitlist')
  })

  it('sets registered result on successful registration', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]['111']).toEqual({ status: 'registered', message: 'Registered' })
  })

  it('sets waitlisted result when action was waitlist', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Waitlisted' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]['111']).toEqual({ status: 'waitlisted', message: 'Waitlisted' })
  })

  it('sets error message for section returned in errors array', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockResolvedValue({
      data: { rows: [{ errors: [{ CourseKey: '111', Message: 'Section full' }] }] },
    })

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]['111']).toEqual({ status: 'error', message: 'Section full' })
  })

  it('sets _error on registerSections failure', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockRejectedValue(new Error('500'))

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]).toEqual({ _error: 'Registration failed. Please try again.' })
  })

  it('removes scheduleIndex from registeringSchedules after completion', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { registerSchedule, registeringSchedules } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(registeringSchedules.has(0)).toBe(false)
  })

  it('sets _error and removes from registeringSchedules when authStore.user is null', async () => {
    const authStore = useAuthStore()
    authStore.currentRole = 'Student'
    authStore.user = null
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })

    const { registerSchedule, scheduleResults, registeringSchedules } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]?._error).toBeDefined()
    expect(registeringSchedules.has(0)).toBe(false)
  })

  it('sets _error when availability response is missing a section key', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({
      data: { rows: [{ CourseKey: '999', Status: 'Open' }] }, // '111' not included
    })

    const { registerSchedule, scheduleResults } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)

    expect(scheduleResults[0]?._error).toBeDefined()
    expect(registerSections).not.toHaveBeenCalled()
  })
})

describe('useRegisterSchedule — reset()', () => {
  it('clears scheduleResults and registeringSchedules', async () => {
    setupAuth()
    vi.mocked(getAvailability).mockResolvedValue({ data: { rows: [{ CourseKey: '111', Status: 'Open' }] } })
    vi.mocked(registerSections).mockResolvedValue({ data: { rows: [{ errors: [] }] } })

    const { registerSchedule, scheduleResults, registeringSchedules, reset } = useRegisterSchedule()
    await registerSchedule(schedule, 0, getCredits)
    expect(Object.keys(scheduleResults)).toHaveLength(1)

    reset()

    expect(Object.keys(scheduleResults)).toHaveLength(0)
    expect(registeringSchedules.size).toBe(0)
  })
})

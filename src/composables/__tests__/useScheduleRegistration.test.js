import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScheduleRegistration } from '@/composables/useScheduleRegistration'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/registrationService', () => ({
  registerSections: vi.fn(),
}))

vi.mock('@/router', () => ({
  default: { replace: vi.fn() },
}))

vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))

vi.mock('@/stores/cart', () => ({
  useCartStore: vi.fn(() => ({ mergeOnLogin: vi.fn(), sections: [] })),
}))

import { registerSections } from '@/services/registrationService'

const makeSection = (overrides = {}) => ({
  CourseKey: '111',
  Term: '26SU',
  SubjectCode: 'ACC',
  CourseNo: '1100',
  LongName: 'Survey of Accounting',
  SectionNo: '100',
  CreditHours: 3,
  Days: 'MWF',
  StartTime: '09:00 AM',
  EndTime: '09:50 AM',
  Faculty: 'Hodges',
  ...overrides,
})

const successResponse = (errors = []) => ({
  data: {
    results: 1,
    success: true,
    rows: [{ message: 'Registration completed successfully', errors }],
  },
})

const errorResponse = (courseKey, message) => ({
  data: {
    results: 1,
    success: false,
    rows: [{
      message: 'Registration failed',
      errors: [{ CourseKey: courseKey, SectionNo: '100', CourseNumber: 'ACC-1100', SubjectCode: 'ACC', Message: message }],
    }],
  },
})

function seedAuth(authStore) {
  authStore.isAuthenticated = true
  authStore.currentRole = 'Student'
  authStore.user = { firstName: 'Jane', lastName: 'Doe', tartanId: 521272, username: 'jane.doe', email: 'jane@sinclair.edu', imageLink: '' }
  authStore.colleagueToken = 'TOKEN-123'
}

describe('useScheduleRegistration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('drop()', () => {
    it('calls registerSections with action:drop and correct payload', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '352085', CreditHours: 3 })]
      registerSections.mockResolvedValue(successResponse())

      const { drop } = useScheduleRegistration()
      await drop('352085')

      expect(registerSections).toHaveBeenCalledWith({
        token: 'TOKEN-123',
        studentId: 521272,
        username: 'jane.doe',
        password: '',
        sections: [{ SectionId: '352085', Action: 'drop', Credits: 3 }],
      })
    })

    it('removes section from currentCourses on success', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      registerSections.mockResolvedValue(successResponse())

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(authStore.currentCourses).toHaveLength(0)
    })

    it('records error on authStore.sectionErrors when drop fails', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      registerSections.mockResolvedValue(errorResponse('111', 'Cannot drop after deadline'))

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(authStore.currentCourses).toHaveLength(1)
      expect(authStore.sectionErrors['111']).toBe('Cannot drop after deadline')
    })

    it('does not affect waitlist', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      authStore.waitlist = [makeSection({ CourseKey: '222' })]
      registerSections.mockResolvedValue(successResponse())

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(authStore.waitlist).toHaveLength(1)
      expect(authStore.waitlist[0].CourseKey).toBe('222')
    })
  })

  describe('waitlistDrop()', () => {
    it('calls registerSections with action:waitlistDrop', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      registerSections.mockResolvedValue(successResponse())

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(registerSections).toHaveBeenCalledWith(expect.objectContaining({
        sections: [expect.objectContaining({ SectionId: '333', Action: 'waitlistDrop' })],
      }))
    })

    it('removes section from waitlist on success', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      registerSections.mockResolvedValue(successResponse())

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(authStore.waitlist).toHaveLength(0)
    })

    it('records error on authStore.sectionErrors when waitlistDrop fails', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      registerSections.mockResolvedValue(errorResponse('333', 'Waitlist drop failed'))

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(authStore.waitlist).toHaveLength(1)
      expect(authStore.sectionErrors['333']).toBe('Waitlist drop failed')
    })

    it('does not affect currentCourses', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      registerSections.mockResolvedValue(successResponse())

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(authStore.currentCourses).toHaveLength(1)
      expect(authStore.currentCourses[0].CourseKey).toBe('111')
    })
  })

  describe('network error handling (issue 20)', () => {
    it('sets sectionErrors when drop() network call rejects', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      registerSections.mockRejectedValue(new Error('Network Error'))

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(authStore.sectionErrors['111']).toMatch(/network error/i)
      expect(authStore.currentCourses).toHaveLength(1)
    })

    it('sets sectionErrors when waitlistDrop() network call rejects', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      registerSections.mockRejectedValue(new Error('Network Error'))

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(authStore.sectionErrors['333']).toMatch(/network error/i)
      expect(authStore.waitlist).toHaveLength(1)
    })
  })

  describe('missing rows in API response (issue 21)', () => {
    it('does not throw when response has no rows key', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      registerSections.mockResolvedValue({ data: { results: 1, success: true } })

      const { drop } = useScheduleRegistration()
      await expect(drop('111')).resolves.toBeUndefined()
      expect(authStore.currentCourses).toHaveLength(0)
    })

    it('does not throw when rows is undefined', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      registerSections.mockResolvedValue({ data: { rows: undefined } })

      const { drop } = useScheduleRegistration()
      await expect(drop('111')).resolves.toBeUndefined()
      expect(authStore.currentCourses).toHaveLength(0)
    })

    it('does not throw when rows is empty array', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      registerSections.mockResolvedValue({ data: { rows: [] } })

      const { drop } = useScheduleRegistration()
      await expect(drop('111')).resolves.toBeUndefined()
      expect(authStore.currentCourses).toHaveLength(0)
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useScheduleRegistration } from '@/composables/useScheduleRegistration'
import { useAuthStore } from '@/stores/auth'
import { useSectionErrorStore } from '@/stores/sectionErrors'

vi.mock('@/composables/useRegistration')

vi.mock('@/router', () => ({ default: { replace: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))

import { useRegistration } from '@/composables/useRegistration'

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

describe('useScheduleRegistration', () => {
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

  describe('drop() — credits resolution', () => {
    it('resolves credits from authStore.currentCourses and passes them to execute', async () => {
      const authStore = useAuthStore()
      authStore.currentCourses = [makeSection({ CourseKey: '352085', CreditHours: 4 })]
      mockExecute.mockImplementation(async () => {
        mockResults['352085'] = { status: 'success', message: 'Dropped' }
      })

      const { drop } = useScheduleRegistration()
      await drop('352085')

      expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '352085', action: 'drop', credits: 4 }])
    })

    it('resolves credits from authStore.waitlist when section is there', async () => {
      const authStore = useAuthStore()
      authStore.currentCourses = []
      authStore.waitlist = [makeSection({ CourseKey: '111', CreditHours: 2 })]
      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Dropped' }
      })

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '111', action: 'drop', credits: 2 }])
    })

    it('uses 0 credits when section not found in either list', async () => {
      const authStore = useAuthStore()
      authStore.currentCourses = []
      authStore.waitlist = []
      mockExecute.mockImplementation(async () => {
        mockResults['999'] = { status: 'success', message: 'Dropped' }
      })

      const { drop } = useScheduleRegistration()
      await drop('999')

      expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '999', action: 'drop', credits: 0 }])
    })
  })

  describe('drop() — success', () => {
    it('splices section from authStore.currentCourses on success', async () => {
      const authStore = useAuthStore()
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Dropped' }
      })

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(authStore.currentCourses).toHaveLength(0)
    })

    it('does not affect authStore.waitlist on drop success', async () => {
      const authStore = useAuthStore()
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      authStore.waitlist = [makeSection({ CourseKey: '222' })]
      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'success', message: 'Dropped' }
      })

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(authStore.waitlist).toHaveLength(1)
      expect(authStore.waitlist[0].CourseKey).toBe('222')
    })
  })

  describe('drop() — failure', () => {
    it('writes error to sectionErrorStore on failure', async () => {
      const authStore = useAuthStore()
      const sectionErrorStore = useSectionErrorStore()
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'error', message: 'Cannot drop after deadline' }
      })

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(sectionErrorStore.errors['111']).toBe('Cannot drop after deadline')
    })

    it('does not splice currentCourses on failure', async () => {
      const authStore = useAuthStore()
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      mockExecute.mockImplementation(async () => {
        mockResults['111'] = { status: 'error', message: 'Cannot drop after deadline' }
      })

      const { drop } = useScheduleRegistration()
      await drop('111')

      expect(authStore.currentCourses).toHaveLength(1)
    })
  })

  describe('waitlistDrop() — credits resolution', () => {
    it('resolves credits from authStore.waitlist and passes them to execute', async () => {
      const authStore = useAuthStore()
      authStore.waitlist = [makeSection({ CourseKey: '333', CreditHours: 3 })]
      mockExecute.mockImplementation(async () => {
        mockResults['333'] = { status: 'success', message: 'Removed from waitlist' }
      })

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(mockExecute).toHaveBeenCalledWith([{ sectionId: '333', action: 'waitlistDrop', credits: 3 }])
    })
  })

  describe('waitlistDrop() — success', () => {
    it('splices section from authStore.waitlist on success', async () => {
      const authStore = useAuthStore()
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      mockExecute.mockImplementation(async () => {
        mockResults['333'] = { status: 'success', message: 'Removed from waitlist' }
      })

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(authStore.waitlist).toHaveLength(0)
    })

    it('does not affect authStore.currentCourses on waitlistDrop success', async () => {
      const authStore = useAuthStore()
      authStore.currentCourses = [makeSection({ CourseKey: '111' })]
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      mockExecute.mockImplementation(async () => {
        mockResults['333'] = { status: 'success', message: 'Removed from waitlist' }
      })

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(authStore.currentCourses).toHaveLength(1)
      expect(authStore.currentCourses[0].CourseKey).toBe('111')
    })
  })

  describe('waitlistDrop() — failure', () => {
    it('writes error to sectionErrorStore on failure', async () => {
      const authStore = useAuthStore()
      const sectionErrorStore = useSectionErrorStore()
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      mockExecute.mockImplementation(async () => {
        mockResults['333'] = { status: 'error', message: 'Waitlist drop failed' }
      })

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(sectionErrorStore.errors['333']).toBe('Waitlist drop failed')
    })

    it('does not splice waitlist on failure', async () => {
      const authStore = useAuthStore()
      authStore.waitlist = [makeSection({ CourseKey: '333' })]
      mockExecute.mockImplementation(async () => {
        mockResults['333'] = { status: 'error', message: 'Waitlist drop failed' }
      })

      const { waitlistDrop } = useScheduleRegistration()
      await waitlistDrop('333')

      expect(authStore.waitlist).toHaveLength(1)
    })
  })
})

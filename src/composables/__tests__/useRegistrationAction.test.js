import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRegistrationAction } from '@/composables/useRegistrationAction'
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

import { registerSections } from '@/services/registrationService'

const successResponse = (errors = []) => ({
  data: {
    results: 1,
    success: true,
    rows: [{ message: 'Registration completed successfully', errors }],
  },
})

function seedAuth(authStore) {
  authStore.isAuthenticated = true
  authStore.currentRole = 'Student'
  authStore.user = { firstName: 'Jane', lastName: 'Doe', tartanId: 521272, username: 'jane.doe', email: 'jane@sinclair.edu', imageLink: '' }
  authStore.colleagueToken = 'TOKEN-123'
}

describe('useRegistrationAction', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('register() — wire payload', () => {
    it('builds the correct API payload from section inputs and auth store credentials', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { register } = useRegistrationAction()
      await register([{ sectionId: '352071', action: 'add', credits: 4 }])

      expect(registerSections).toHaveBeenCalledWith({
        token: 'TOKEN-123',
        studentId: 521272,
        username: 'jane.doe',
        password: '',
        sections: [{ SectionId: '352071', Action: 'add', Credits: 4 }],
      })
    })

    it('parses tartanId as an integer', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      authStore.user.tartanId = '521272'
      registerSections.mockResolvedValue(successResponse())

      const { register } = useRegistrationAction()
      await register([{ sectionId: '111', action: 'add', credits: 3 }])

      const { studentId } = registerSections.mock.calls[0][0]
      expect(typeof studentId).toBe('number')
      expect(studentId).toBe(521272)
    })

    it('maps multiple sections into the sections array', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { register } = useRegistrationAction()
      await register([
        { sectionId: '111', action: 'add', credits: 3 },
        { sectionId: '222', action: 'waitlist', credits: 2 },
      ])

      const { sections } = registerSections.mock.calls[0][0]
      expect(sections).toEqual([
        { SectionId: '111', Action: 'add', Credits: 3 },
        { SectionId: '222', Action: 'waitlist', Credits: 2 },
      ])
    })
  })

  describe('register() — result normalization', () => {
    it('returns all section ids in succeeded when errors array is empty', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { register } = useRegistrationAction()
      const { succeeded, errors } = await register([
        { sectionId: '111', action: 'add', credits: 3 },
        { sectionId: '222', action: 'add', credits: 2 },
      ])

      expect(succeeded.has('111')).toBe(true)
      expect(succeeded.has('222')).toBe(true)
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('excludes failed section ids from succeeded and populates errors map', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse([
        { CourseKey: '222', SectionNo: '200', CourseNumber: 'MAT-1470', SubjectCode: 'MAT', Message: 'Section is full' },
      ]))

      const { register } = useRegistrationAction()
      const { succeeded, errors } = await register([
        { sectionId: '111', action: 'add', credits: 3 },
        { sectionId: '222', action: 'add', credits: 2 },
      ])

      expect(succeeded.has('111')).toBe(true)
      expect(succeeded.has('222')).toBe(false)
      expect(errors['222']).toBe('Section is full')
      expect(errors['111']).toBeUndefined()
    })

    it('returns empty succeeded and all errors when all sections fail', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse([
        { CourseKey: '111', SectionNo: '100', CourseNumber: 'ACC-1100', SubjectCode: 'ACC', Message: 'Prereq not met' },
      ]))

      const { register } = useRegistrationAction()
      const { succeeded, errors } = await register([
        { sectionId: '111', action: 'add', credits: 3 },
      ])

      expect(succeeded.size).toBe(0)
      expect(errors['111']).toBe('Prereq not met')
    })
  })

  describe('register() — response edge cases', () => {
    it('treats missing rows key as all-success', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue({ data: { results: 1, success: true } })

      const { register } = useRegistrationAction()
      const { succeeded } = await register([{ sectionId: '111', action: 'add', credits: 3 }])

      expect(succeeded.has('111')).toBe(true)
    })

    it('treats empty rows array as all-success', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue({ data: { rows: [] } })

      const { register } = useRegistrationAction()
      const { succeeded } = await register([{ sectionId: '111', action: 'add', credits: 3 }])

      expect(succeeded.has('111')).toBe(true)
    })

    it('propagates network errors to the caller', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockRejectedValue(new Error('Network error'))

      const { register } = useRegistrationAction()
      await expect(register([{ sectionId: '111', action: 'add', credits: 3 }])).rejects.toThrow('Network error')
    })
  })
})

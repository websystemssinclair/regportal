import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRegistration } from '@/composables/useRegistration'
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

describe('useRegistration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('execute() — partial and full failure', () => {
    it('marks succeeded entries success and failed entries error with backend message', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse([
        { CourseKey: '222', SectionNo: '200', CourseNumber: 'MAT-1470', SubjectCode: 'MAT', Message: 'Section is full' },
      ]))

      const { execute, results } = useRegistration()
      await execute([
        { sectionId: '111', action: 'add', credits: 3 },
        { sectionId: '222', action: 'add', credits: 2 },
      ])

      expect(results['111']).toEqual({ status: 'success', message: 'Registered' })
      expect(results['222']).toEqual({ status: 'error', message: 'Section is full' })
    })

    it('marks all entries error when all fail', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse([
        { CourseKey: '111', SectionNo: '100', CourseNumber: 'ACC-1100', SubjectCode: 'ACC', Message: 'Prereq not met' },
      ]))

      const { execute, results } = useRegistration()
      await execute([{ sectionId: '111', action: 'add', credits: 3 }])

      expect(results['111']).toEqual({ status: 'error', message: 'Prereq not met' })
    })
  })

  describe('execute() — network error', () => {
    it('rejects with the thrown error on network failure', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockRejectedValue(new Error('Network Error'))

      const { execute } = useRegistration()
      await expect(execute([
        { sectionId: '111', action: 'add', credits: 3 },
        { sectionId: '222', action: 'add', credits: 2 },
      ])).rejects.toThrow('Network Error')
    })
  })

  describe('execute() — pending Set', () => {
    it('contains all submitted section IDs during flight and is empty after', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)

      let capturedDuringFlight
      registerSections.mockImplementation(async () => {
        capturedDuringFlight = new Set(pending)
        return successResponse()
      })

      const { execute, pending } = useRegistration()
      await execute([
        { sectionId: '111', action: 'add', credits: 3 },
        { sectionId: '222', action: 'add', credits: 2 },
      ])

      expect(capturedDuringFlight.has('111')).toBe(true)
      expect(capturedDuringFlight.has('222')).toBe(true)
      expect(pending.size).toBe(0)
    })

    it('clears pending even when the network call throws', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockRejectedValue(new Error('Network Error'))

      const { execute, pending } = useRegistration()
      await expect(execute([{ sectionId: '111', action: 'add', credits: 3 }])).rejects.toThrow()

      expect(pending.size).toBe(0)
    })
  })

  describe('dismissResult()', () => {
    it('removes one entry from results and leaves others', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { execute, results, dismissResult } = useRegistration()
      await execute([
        { sectionId: '111', action: 'add', credits: 3 },
        { sectionId: '222', action: 'add', credits: 2 },
      ])

      dismissResult('111')

      expect(results['111']).toBeUndefined()
      expect(results['222']).toBeDefined()
    })
  })

  describe('reset()', () => {
    it('clears all results and pending', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)

      let resolveRequest
      registerSections.mockImplementation(() => new Promise((res) => { resolveRequest = res }))

      const { execute, results, pending, reset } = useRegistration()
      const inflight = execute([{ sectionId: '111', action: 'add', credits: 3 }])
      expect(pending.has('111')).toBe(true)

      resolveRequest(successResponse())
      await inflight

      expect(results['111']).toBeDefined()

      reset()
      expect(Object.keys(results)).toHaveLength(0)
      expect(pending.size).toBe(0)
    })
  })

  describe('execute() — success messages per action', () => {
    it('sets results to Registered for action:add', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { execute, results } = useRegistration()
      await execute([{ sectionId: '111', action: 'add', credits: 3 }])

      expect(results['111']).toEqual({ status: 'success', message: 'Registered' })
    })

    it('sets results to Waitlisted for action:waitlist', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { execute, results } = useRegistration()
      await execute([{ sectionId: '111', action: 'waitlist', credits: 3 }])

      expect(results['111']).toEqual({ status: 'success', message: 'Waitlisted' })
    })

    it('sets results to Dropped for action:drop', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { execute, results } = useRegistration()
      await execute([{ sectionId: '111', action: 'drop', credits: 3 }])

      expect(results['111']).toEqual({ status: 'success', message: 'Dropped' })
    })

    it('sets results to Removed from waitlist for action:waitlistDrop', async () => {
      const authStore = useAuthStore()
      seedAuth(authStore)
      registerSections.mockResolvedValue(successResponse())

      const { execute, results } = useRegistration()
      await execute([{ sectionId: '111', action: 'waitlistDrop', credits: 3 }])

      expect(results['111']).toEqual({ status: 'success', message: 'Removed from waitlist' })
    })
  })
})

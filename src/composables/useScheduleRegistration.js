import { useAuthStore } from '@/stores/auth'
import { registerSections } from '@/services/registrationService'

export function useScheduleRegistration() {
  const authStore = useAuthStore()

  function _buildPayload(sectionId, action) {
    const allSections = [...authStore.currentCourses, ...authStore.waitlist]
    const sec = allSections.find((s) => s.CourseKey === sectionId)
    return {
      token: authStore.colleagueToken,
      studentId: parseInt(authStore.user.tartanId),
      username: authStore.user.username,
      password: '',
      sections: [{ SectionId: sectionId, Action: action, Credits: sec?.CreditHours ?? 0 }],
    }
  }

  function _applyResult(data, sectionId, source) {
    const errors = data.rows?.[0]?.errors ?? []
    const failedKeys = new Set(errors.map((e) => String(e.CourseKey)))
    if (!failedKeys.has(String(sectionId))) {
      const idx = source.findIndex((s) => s.CourseKey === sectionId)
      if (idx !== -1) source.splice(idx, 1)
    } else {
      for (const err of errors) {
        authStore.sectionErrors[String(err.CourseKey)] = err.Message
      }
    }
  }

  async function drop(sectionId) {
    const payload = _buildPayload(sectionId, 'drop')
    try {
      const { data } = await registerSections(payload)
      _applyResult(data, sectionId, authStore.currentCourses)
    } catch {
      authStore.sectionErrors[String(sectionId)] = 'Network error — drop failed. Please try again.'
    }
  }

  async function waitlistDrop(sectionId) {
    const payload = _buildPayload(sectionId, 'waitlistDrop')
    try {
      const { data } = await registerSections(payload)
      _applyResult(data, sectionId, authStore.waitlist)
    } catch {
      authStore.sectionErrors[String(sectionId)] = 'Network error — drop failed. Please try again.'
    }
  }

  return { drop, waitlistDrop }
}

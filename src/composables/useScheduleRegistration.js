import { useAuthStore } from '@/stores/auth'
import { useRegistrationAction } from '@/composables/useRegistrationAction'
import { useSectionErrorStore } from '@/stores/sectionErrors'

export function useScheduleRegistration() {
  const authStore = useAuthStore()
  const sectionErrorStore = useSectionErrorStore()
  const { register } = useRegistrationAction()

  async function drop(sectionId) {
    const allSections = [...authStore.currentCourses, ...authStore.waitlist]
    const sec = allSections.find((s) => s.CourseKey === sectionId)
    try {
      const { succeeded, errors } = await register([
        { sectionId, action: 'drop', credits: sec?.CreditHours ?? 0 },
      ])
      if (succeeded.has(String(sectionId))) {
        const idx = authStore.currentCourses.findIndex((s) => s.CourseKey === sectionId)
        if (idx !== -1) authStore.currentCourses.splice(idx, 1)
      } else {
        for (const [key, msg] of Object.entries(errors)) {
          sectionErrorStore.set(key, msg)
        }
      }
    } catch {
      sectionErrorStore.set(sectionId, 'Network error — drop failed. Please try again.')
    }
  }

  async function waitlistDrop(sectionId) {
    const allSections = [...authStore.currentCourses, ...authStore.waitlist]
    const sec = allSections.find((s) => s.CourseKey === sectionId)
    try {
      const { succeeded, errors } = await register([
        { sectionId, action: 'waitlistDrop', credits: sec?.CreditHours ?? 0 },
      ])
      if (succeeded.has(String(sectionId))) {
        const idx = authStore.waitlist.findIndex((s) => s.CourseKey === sectionId)
        if (idx !== -1) authStore.waitlist.splice(idx, 1)
      } else {
        for (const [key, msg] of Object.entries(errors)) {
          sectionErrorStore.set(key, msg)
        }
      }
    } catch {
      sectionErrorStore.set(sectionId, 'Network error — drop failed. Please try again.')
    }
  }

  return { drop, waitlistDrop }
}

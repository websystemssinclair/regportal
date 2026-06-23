import { useAuthStore } from '@/stores/auth'
import { useRegistration } from '@/composables/useRegistration'
import { useSectionErrorStore } from '@/stores/sectionErrors'

export function useScheduleRegistration() {
  const authStore = useAuthStore()
  const sectionErrorStore = useSectionErrorStore()
  const { execute, results } = useRegistration()

  async function drop(sectionId) {
    const allSections = [...authStore.currentCourses, ...authStore.waitlist]
    const sec = allSections.find((s) => s.CourseKey === sectionId)
    await execute([{ sectionId, action: 'drop', credits: sec?.CreditHours ?? 0 }])
    const id = String(sectionId)
    if (results[id]?.status === 'success') {
      const idx = authStore.currentCourses.findIndex((s) => s.CourseKey === sectionId)
      if (idx !== -1) authStore.currentCourses.splice(idx, 1)
    } else if (results[id]?.status === 'error') {
      sectionErrorStore.set(id, results[id].message)
    }
  }

  async function waitlistDrop(sectionId) {
    const allSections = [...authStore.currentCourses, ...authStore.waitlist]
    const sec = allSections.find((s) => s.CourseKey === sectionId)
    await execute([{ sectionId, action: 'waitlistDrop', credits: sec?.CreditHours ?? 0 }])
    const id = String(sectionId)
    if (results[id]?.status === 'success') {
      const idx = authStore.waitlist.findIndex((s) => s.CourseKey === sectionId)
      if (idx !== -1) authStore.waitlist.splice(idx, 1)
    } else if (results[id]?.status === 'error') {
      sectionErrorStore.set(id, results[id].message)
    }
  }

  return { drop, waitlistDrop }
}

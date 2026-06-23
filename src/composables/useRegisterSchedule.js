import { reactive } from 'vue'
import { getAvailability } from '@/services/sectionsService'
import { useRegistration } from '@/composables/useRegistration'
import { useAuthStore } from '@/stores/auth'

export function useRegisterSchedule() {
  const scheduleResults = reactive({})
  const registeringSchedules = reactive(new Set())

  async function registerSchedule(schedule, scheduleIndex, getCredits) {
    registeringSchedules.add(scheduleIndex)
    try {
      const courseKeys = schedule.map((s) => s.id)
      let availabilityMap = {}

      try {
        const { data } = await getAvailability(courseKeys.join(','))
        for (const row of data.rows ?? []) {
          availabilityMap[String(row.CourseKey)] = row.Status
        }
      } catch {
        scheduleResults[scheduleIndex] = { _error: 'Could not check seat availability. Please try again.' }
        return
      }

      const missingKey = schedule.find((sec) => !(String(sec.id) in availabilityMap))
      if (missingKey) {
        scheduleResults[scheduleIndex] = { _error: 'Could not check seat availability. Please try again.' }
        return
      }

      const authStore = useAuthStore()
      if (!authStore.user) {
        scheduleResults[scheduleIndex] = { _error: 'Registration failed. Please try again.' }
        return
      }

      const { execute, results } = useRegistration()
      const sections = schedule.map((sec) => ({
        sectionId: sec.id,
        action: availabilityMap[String(sec.id)] === 'Open' ? 'add' : 'waitlist',
        credits: getCredits(sec.id),
      }))

      await execute(sections)

      const result = {}
      for (const sec of schedule) {
        const key = String(sec.id)
        const r = results[key]
        if (r?.status === 'error') {
          result[key] = { status: 'error', message: r.message }
        } else {
          const action = sections.find((s) => String(s.sectionId) === key)?.action
          result[key] = {
            status: action === 'waitlist' ? 'waitlisted' : 'registered',
            message: action === 'waitlist' ? 'Waitlisted' : 'Registered',
          }
        }
      }
      scheduleResults[scheduleIndex] = result
    } finally {
      registeringSchedules.delete(scheduleIndex)
    }
  }

  function reset() {
    for (const key in scheduleResults) delete scheduleResults[key]
    registeringSchedules.clear()
  }

  return { scheduleResults, registeringSchedules, registerSchedule, reset }
}

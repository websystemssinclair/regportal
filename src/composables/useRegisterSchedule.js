import { reactive } from 'vue'
import { getAvailability } from '@/services/sectionsService'
import { useRegistrationAction } from '@/composables/useRegistrationAction'
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

      const { register } = useRegistrationAction()
      const sections = schedule.map((sec) => ({
        sectionId: sec.id,
        action: availabilityMap[String(sec.id)] === 'Open' ? 'add' : 'waitlist',
        credits: getCredits(sec.id),
      }))

      const { succeeded, errors: errorMap } = await register(sections)

      const result = {}
      for (const sec of schedule) {
        const key = String(sec.id)
        if (errorMap[key]) {
          result[key] = { status: 'error', message: errorMap[key] }
        } else {
          const action = sections.find((s) => String(s.sectionId) === key)?.action
          result[key] = {
            status: action === 'waitlist' ? 'waitlisted' : 'registered',
            message: action === 'waitlist' ? 'Waitlisted' : 'Registered',
          }
        }
      }
      scheduleResults[scheduleIndex] = result
    } catch {
      scheduleResults[scheduleIndex] = { _error: 'Registration failed. Please try again.' }
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

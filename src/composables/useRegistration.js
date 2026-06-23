import { reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { registerSections } from '@/services/registrationService'

const SUCCESS_MESSAGES = {
  add: 'Registered',
  waitlist: 'Waitlisted',
  drop: 'Dropped',
  waitlistDrop: 'Removed from waitlist',
}

export function useRegistration() {
  const results = reactive({})
  const pending = reactive(new Set())

  async function execute(sections) {
    const authStore = useAuthStore()
    for (const { sectionId } of sections) pending.add(String(sectionId))

    try {
      const payload = {
        token: authStore.colleagueToken,
        studentId: parseInt(authStore.user.tartanId),
        username: authStore.user.username,
        password: '',
        sections: sections.map(({ sectionId, action, credits }) => ({
          SectionId: sectionId,
          Action: action,
          Credits: credits,
        })),
      }
      const { data } = await registerSections(payload)
      const errors = data.rows?.[0]?.errors ?? []
      const errorMap = {}
      for (const err of errors) {
        errorMap[String(err.CourseKey)] = err.Message
      }
      for (const { sectionId, action } of sections) {
        const id = String(sectionId)
        if (errorMap[id]) {
          results[id] = { status: 'error', message: errorMap[id] }
        } else {
          results[id] = { status: 'success', message: SUCCESS_MESSAGES[action] ?? 'Done' }
        }
      }
    } catch {
      for (const { sectionId } of sections) {
        results[String(sectionId)] = { status: 'error', message: 'Registration failed — please try again.' }
      }
    } finally {
      for (const { sectionId } of sections) pending.delete(String(sectionId))
    }
  }

  function dismissResult(sectionId) {
    delete results[String(sectionId)]
  }

  function reset() {
    Object.keys(results).forEach((k) => delete results[k])
    pending.clear()
  }

  return { execute, results, pending, dismissResult, reset }
}

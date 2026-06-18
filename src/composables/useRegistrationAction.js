import { useAuthStore } from '@/stores/auth'
import { registerSections } from '@/services/registrationService'

export function useRegistrationAction() {
  const authStore = useAuthStore()

  async function register(sections) {
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
    const succeeded = new Set(
      sections.map((s) => String(s.sectionId)).filter((id) => !errorMap[id]),
    )
    return { succeeded, errors: errorMap }
  }

  return { register }
}

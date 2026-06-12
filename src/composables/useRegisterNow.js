import { reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { registerSections } from '@/services/registrationService'

export function useRegisterNow() {
  const sectionResults = reactive({})
  const registeringSections = reactive(new Set())

  async function registerNow(sec) {
    const courseKey = String(sec.CourseKey)
    const action = sec.status === 'Open' ? 'add' : 'waitlist'
    const authStore = useAuthStore()
    const cartStore = useCartStore()
    registeringSections.add(courseKey)
    try {
      const payload = {
        token: authStore.colleagueToken,
        studentId: parseInt(authStore.user.tartanId),
        username: authStore.user.username,
        password: '',
        sections: [{ SectionId: courseKey, Action: action, Credits: sec.CreditHours ?? 0 }],
      }
      const { data } = await registerSections(payload)
      const errors = data.rows[0]?.errors ?? []
      const sectionError = errors.find((e) => String(e.CourseKey) === courseKey)
      if (sectionError) {
        sectionResults[courseKey] = { status: 'error', message: sectionError.Message }
      } else {
        sectionResults[courseKey] = { status: 'success', message: action === 'add' ? 'Registered' : 'Waitlisted' }
        if (cartStore.sections.some((s) => String(s.CourseKey) === courseKey)) {
          cartStore.removeRegistered([courseKey])
        }
      }
    } catch (e) {
      sectionResults[courseKey] = { status: 'error', message: e.message ?? 'Registration failed' }
    } finally {
      registeringSections.delete(courseKey)
    }
  }

  function dismissResult(courseKey) {
    delete sectionResults[String(courseKey)]
  }

  function reset() {
    Object.keys(sectionResults).forEach((k) => delete sectionResults[k])
    registeringSections.clear()
  }

  return { sectionResults, registeringSections, registerNow, dismissResult, reset }
}

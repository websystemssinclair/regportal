import { reactive } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useRegistrationAction } from '@/composables/useRegistrationAction'

export function useRegisterNow() {
  const sectionResults = reactive({})
  const registeringSections = reactive(new Set())

  async function registerNow(sec) {
    const courseKey = String(sec.CourseKey)
    const action = sec.status === 'Open' ? 'add' : 'waitlist'
    const cartStore = useCartStore()
    const { register } = useRegistrationAction()
    registeringSections.add(courseKey)
    try {
      const { succeeded, errors } = await register([
        { sectionId: courseKey, action, credits: sec.CreditHours ?? 0 },
      ])
      if (succeeded.has(courseKey)) {
        sectionResults[courseKey] = { status: 'success', message: action === 'add' ? 'Registered' : 'Waitlisted' }
        if (cartStore.sections.some((s) => String(s.CourseKey) === courseKey)) {
          cartStore.removeRegistered([courseKey])
        }
      } else {
        sectionResults[courseKey] = { status: 'error', message: errors[courseKey] ?? 'Registration failed' }
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

import { useRegistration } from '@/composables/useRegistration'
import { useCartStore } from '@/stores/cart'

export function useRegisterNow() {
  const { execute, results, pending, dismissResult, reset } = useRegistration()

  const sectionResults = results
  const registeringSections = pending

  async function registerNow(sec) {
    const courseKey = String(sec.CourseKey)
    const action = sec.status === 'Open' ? 'add' : 'waitlist'

    await execute([{ sectionId: courseKey, action, credits: sec.CreditHours ?? 0 }])

    if (results[courseKey]?.status === 'success') {
      const cartStore = useCartStore()
      if (cartStore.sections.some((s) => String(s.CourseKey) === courseKey)) {
        cartStore.removeRegistered([courseKey])
      }
    }
  }

  return { sectionResults, registeringSections, registerNow, dismissResult, reset }
}

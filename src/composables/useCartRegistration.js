import { useCartStore } from '@/stores/cart'
import { useRegistrationAction } from '@/composables/useRegistrationAction'
import { useSectionErrorStore } from '@/stores/sectionErrors'

export function useCartRegistration() {
  const cartStore = useCartStore()
  const sectionErrorStore = useSectionErrorStore()
  const { register: doRegister } = useRegistrationAction()

  async function register(termId, registrations) {
    cartStore.registeringTerms.push(termId)
    try {
      const sections = registrations.map(({ sectionId, action }) => {
        const sec = cartStore.sections.find((s) => s.CourseKey === sectionId)
        return { sectionId, action, credits: sec?.CreditHours ?? 0 }
      })
      const { succeeded, errors } = await doRegister(sections)
      cartStore.removeRegistered([...succeeded])
      for (const [key, msg] of Object.entries(errors)) {
        sectionErrorStore.set(key, msg)
      }
      return { succeeded: succeeded.size }
    } finally {
      cartStore.registeringTerms = cartStore.registeringTerms.filter((t) => t !== termId)
    }
  }

  return { register }
}

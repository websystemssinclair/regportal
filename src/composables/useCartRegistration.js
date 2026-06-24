import { reactive } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useCart } from '@/composables/useCart'
import { useRegistration } from '@/composables/useRegistration'
import { useSectionErrorStore } from '@/stores/sectionErrors'

export function useCartRegistration() {
  const cartStore = useCartStore()
  const cart = useCart()
  const sectionErrorStore = useSectionErrorStore()
  const { execute, pending, results } = useRegistration()
  const registeringTermIds = reactive(new Set())

  function isTermRegistering(termId) {
    return registeringTermIds.has(termId)
  }

  async function register(termId, registrations) {
    registeringTermIds.add(termId)
    try {
      const sections = registrations.map(({ sectionId, action }) => {
        const sec = cartStore.sections.find((s) => s.CourseKey === sectionId)
        return { sectionId, action, credits: sec?.CreditHours ?? 0 }
      })
      await execute(sections)

      const succeededIds = registrations
        .map(({ sectionId }) => String(sectionId))
        .filter((id) => results[id]?.status === 'success')

      cart.removeRegistered(succeededIds)

      for (const { sectionId } of registrations) {
        const id = String(sectionId)
        if (results[id]?.status === 'error') {
          sectionErrorStore.set(id, results[id].message)
        }
      }

      return { succeeded: succeededIds.length }
    } finally {
      registeringTermIds.delete(termId)
    }
  }

  return { register, pending, isTermRegistering }
}

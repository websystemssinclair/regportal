import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { registerSections } from '@/services/registrationService'

export function useCartRegistration() {
  const cartStore = useCartStore()
  const authStore = useAuthStore()

  function _buildPayload(registrations) {
    const studentId = parseInt(authStore.user.tartanId)
    const sections = registrations.map(({ sectionId, action }) => {
      const sec = cartStore.sections.find((s) => s.CourseKey === sectionId)
      return { SectionId: sectionId, Action: action, Credits: sec?.CreditHours ?? 0 }
    })
    return {
      token: authStore.colleagueToken,
      studentId,
      username: authStore.user.username,
      password: '',
      sections,
    }
  }

  async function register(termId, registrations) {
    cartStore.registeringTerms.push(termId)
    try {
      const payload = _buildPayload(registrations)
      const { data } = await registerSections(payload)
      const errors = data.rows[0]?.errors ?? []
      const failedKeys = new Set(errors.map((e) => String(e.CourseKey)))
      const succeededIds = registrations
        .map((r) => r.sectionId)
        .filter((id) => !failedKeys.has(String(id)))
      cartStore.removeRegistered(succeededIds)
      for (const err of errors) {
        cartStore.sectionErrors[String(err.CourseKey)] = err.Message
      }
      return { succeeded: succeededIds.length }
    } finally {
      cartStore.registeringTerms = cartStore.registeringTerms.filter((t) => t !== termId)
    }
  }

  return { register }
}

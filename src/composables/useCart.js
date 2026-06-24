import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { saveCart, buildSavePayload } from '@/services/cartService'

const STORAGE_KEY = 'regportal:cart'

export function useCart() {
  const cartStore = useCartStore()
  const authStore = useAuthStore()

  function persist() {
    if (authStore.isAuthenticated) {
      saveCart(buildSavePayload(cartStore.sections, {
        tartanId: authStore.user.tartanId,
        colleagueToken: authStore.colleagueToken,
        username: authStore.user.username,
      }))
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartStore.sections))
    }
  }

  function add(section) {
    const before = cartStore.sections.length
    cartStore.add(section)
    if (cartStore.sections.length === before) return
    persist()
  }

  function remove(courseKey) {
    cartStore.remove(courseKey)
    persist()
  }

  function removeRegistered(courseKeys) {
    cartStore.removeRegistered(courseKeys)
    persist()
  }

  function mergeOnLogin(shoppingCart) {
    cartStore.mergeOnLogin(shoppingCart)
    if (cartStore.mergeCarryOver > 0) {
      saveCart(buildSavePayload(cartStore.sections, {
        tartanId: authStore.user.tartanId,
        colleagueToken: authStore.colleagueToken,
        username: authStore.user.username,
      }))
    }
  }

  function loadAvailability() {
    return cartStore.loadAvailability()
  }

  return {
    sections: computed(() => cartStore.sections),
    mergeCarryOver: computed(() => cartStore.mergeCarryOver),
    add,
    remove,
    removeRegistered,
    mergeOnLogin,
    loadAvailability,
  }
}

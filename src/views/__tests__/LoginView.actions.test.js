import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import { useCart } from '@/composables/useCart'

vi.mock('@/composables/useCart', () => ({ useCart: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

import { useRoute, useRouter } from 'vue-router'

const routerMock = { replace: vi.fn() }
const cartMock = { mergeOnLogin: vi.fn() }

describe('LoginView', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    vi.mocked(useCart).mockReturnValue(cartMock)
    vi.mocked(useRouter).mockReturnValue(routerMock)
  })

  function mountView() {
    return mount(LoginView, { global: { plugins: [pinia] } })
  }

  describe('when ID query param is present', () => {
    beforeEach(() => {
      vi.mocked(useRoute).mockReturnValue({ query: { ID: 'SAML_ID' } })
    })

    it('calls mergeOnLogin with the shoppingCart returned by handleCallback', async () => {
      const shoppingCart = [{ CourseKey: 'ACC-1210' }]
      const store = useAuthStore()
      store.handleCallback = vi.fn().mockResolvedValue({ shoppingCart, targetUrl: { name: 'search' } })
      cartMock.mergeOnLogin.mockResolvedValue(undefined)

      mountView()
      await nextTick()
      await nextTick()

      expect(cartMock.mergeOnLogin).toHaveBeenCalledWith(shoppingCart)
    })

    it('navigates to targetUrl after mergeOnLogin completes', async () => {
      const targetUrl = { name: 'search' }
      const store = useAuthStore()
      store.handleCallback = vi.fn().mockResolvedValue({ shoppingCart: [], targetUrl })
      cartMock.mergeOnLogin.mockResolvedValue(undefined)

      mountView()
      await nextTick()
      await nextTick()

      const mergeOrder = cartMock.mergeOnLogin.mock.invocationCallOrder[0]
      const navOrder = routerMock.replace.mock.invocationCallOrder[0]
      expect(mergeOrder).toBeLessThan(navOrder)
      expect(routerMock.replace).toHaveBeenCalledWith(targetUrl)
    })

    it('skips mergeOnLogin and still navigates when handleCallback returns null shoppingCart', async () => {
      const targetUrl = { name: 'search' }
      const store = useAuthStore()
      store.handleCallback = vi.fn().mockResolvedValue({ shoppingCart: null, targetUrl })

      mountView()
      await nextTick()
      await nextTick()

      expect(cartMock.mergeOnLogin).not.toHaveBeenCalled()
      expect(routerMock.replace).toHaveBeenCalledWith(targetUrl)
    })
  })

  describe('when no ID query param', () => {
    it('calls auth.login() instead of handleCallback', async () => {
      vi.mocked(useRoute).mockReturnValue({ query: {} })
      const store = useAuthStore()
      store.handleCallback = vi.fn()
      store.login = vi.fn()

      mountView()
      await nextTick()

      expect(store.login).toHaveBeenCalled()
      expect(store.handleCallback).not.toHaveBeenCalled()
    })
  })
})

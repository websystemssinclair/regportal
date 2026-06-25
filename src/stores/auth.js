import { defineStore } from 'pinia'
import { sendSamlRequest, retrieveUserFromSaml, getUserData } from '@/services/authService'
import { useSectionErrorStore } from '@/stores/sectionErrors'

const SSO_BASE = 'https://sso.sinclair.edu/EasyConnect/REST/default.aspx'
const RETURN_TO_KEY = 'regportal:returnTo'
const ROLE_PRIORITY = ['Developer', 'Admin', 'Student', 'Visitor']

function resolveRole(availableRoles) {
  const roles = availableRoles.map((r) => r.role)
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? 'Visitor'
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return {
      isAuthenticated: true,
      currentRole: 'Developer',
      user: { firstName: 'Dev', lastName: 'User', email: 'dev@sinclair.edu', tartanId: 0, username: 'dev', imageLink: '' },
      apiKey: null,
      colleagueToken: null,
      currentCourses: [],
      completedCourses: [],
      waitlist: [],
    }
    }
    return {
    isAuthenticated: false,
    currentRole: 'Visitor',
    user: null,
    apiKey: null,
    colleagueToken: null,
    currentCourses: [],
    completedCourses: [],
    waitlist: [],
    }
  },
  getters: {
    isAdmin: (state) => state.currentRole === 'Admin' || state.currentRole === 'Developer',
    isStudent: (state) => state.currentRole === 'Student',
  },
  actions: {
    async login() {
      sessionStorage.setItem(RETURN_TO_KEY, window.location.pathname + window.location.search + window.location.hash)
      const { data: id } = await sendSamlRequest()
      window.location.href = `${SSO_BASE}?ID=${id}`
    },

    async handleCallback(samlId) {
      const { data } = await retrieveUserFromSaml(samlId)
      this.user = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        tartanId: data.tartanId,
        username: data.username,
        imageLink: data.imageLink,
      }
      this.currentRole = resolveRole(data.availableRoles)
      this.isAuthenticated = true

      let shoppingCart = null
      try {
        const { data: userData } = await getUserData({ tartanId: data.tartanId, username: data.username })
        this.colleagueToken = userData.user.colleagueToken
        this.currentCourses = userData.user.currentCourses ?? []
        this.completedCourses = userData.user.completedCourses ?? []
        this.waitlist = userData.user.waitlist ?? []
        shoppingCart = userData.user.shoppingCart
      } catch {
        // login succeeds; cart merge deferred until re-login
      }

      const returnTo = sessionStorage.getItem(RETURN_TO_KEY)
      sessionStorage.removeItem(RETURN_TO_KEY)
      return { shoppingCart, targetUrl: returnTo ?? { name: data.targetUrl } }
    },

    logout() {
      this.isAuthenticated = false
      this.user = null
      this.currentRole = 'Visitor'
      this.currentCourses = []
      this.completedCourses = []
      this.waitlist = []
      useSectionErrorStore().clear()
      sessionStorage.removeItem(RETURN_TO_KEY)
    },
  },
})

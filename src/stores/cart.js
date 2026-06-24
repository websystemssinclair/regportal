import { defineStore } from 'pinia'
import { getAvailability } from '@/services/sectionsService'
import { saveCart, buildSavePayload } from '@/services/cartService'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEY = 'regportal:cart'

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function writeStorage(sections) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections))
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    sections: readStorage(),
    mergeCarryOver: null,
  }),
  getters: {},
  actions: {
    _buildSavePayload() {
      const auth = useAuthStore()
      return buildSavePayload(this.sections, {
        tartanId: auth.user.tartanId,
        colleagueToken: auth.colleagueToken,
        username: auth.user.username,
      })
    },
    add(section) {
      if (this.sections.some((s) => s.CourseKey === section.CourseKey)) return
      this.sections.push(section)
      const auth = useAuthStore()
      if (auth.isAuthenticated) {
        saveCart(this._buildSavePayload())
      } else {
        writeStorage(this.sections)
      }
    },
    remove(courseKey) {
      this.sections = this.sections.filter((s) => s.CourseKey !== courseKey)
      const auth = useAuthStore()
      if (auth.isAuthenticated) {
        saveCart(this._buildSavePayload())
      } else {
        writeStorage(this.sections)
      }
    },
    mergeOnLogin(shoppingCart) {
      const local = readStorage()
      if (!local.length && !shoppingCart.length) return

      const map = new Map(shoppingCart.map((s) => [s.CourseKey, s]))
      let carryOverCount = 0
      for (const sec of local) {
        if (!map.has(sec.CourseKey)) {
          map.set(sec.CourseKey, sec)
          carryOverCount++
        }
      }

      localStorage.removeItem(STORAGE_KEY)
      this.sections = [...map.values()]

      if (carryOverCount > 0) {
        saveCart(this._buildSavePayload())
        this.mergeCarryOver = carryOverCount
      }
    },
    removeRegistered(courseKeys) {
      const keySet = new Set(courseKeys.map(String))
      this.sections = this.sections.filter((s) => !keySet.has(String(s.CourseKey)))
      const auth = useAuthStore()
      if (auth.isAuthenticated) {
        saveCart(this._buildSavePayload())
      } else {
        writeStorage(this.sections)
      }
    },
    async loadAvailability() {
      if (!this.sections.length) return
      const courseKeys = this.sections.map((s) => s.CourseKey).join(',')
      const { data } = await getAvailability(courseKeys)
      const rows = data.rows ?? []
      const statusMap = Object.fromEntries(rows.map((r) => [r.courseKey, r.status]))
      for (const sec of this.sections) {
        if (statusMap[sec.CourseKey] !== undefined) {
          sec.status = statusMap[sec.CourseKey]
        }
      }
    },
  },
})

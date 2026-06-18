import { defineStore } from 'pinia'
import { getAvailability } from '@/services/sectionsService'
import { saveCart } from '@/services/cartService'
import { useAuthStore } from '@/stores/auth'
import { useReferenceStore } from '@/stores/reference'

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
    registeringTerms: [],
  }),
  getters: {
    groupedSections(state) {
      const refStore = useReferenceStore()
      const termMap = Object.fromEntries(refStore.terms.map((t) => [t.id, t]))

      const current = {}
      const future = {}

      for (const sec of state.sections) {
        const term = termMap[sec.Term]
        const toView = term?.toView ?? 'Y'
        const bucket = toView === 'F' ? future : current
        if (!bucket[sec.Term]) bucket[sec.Term] = []
        bucket[sec.Term].push(sec)
      }

      const sortSections = (arr) =>
        [...arr].sort((a, b) => {
          const keyA = (a.SubjectCode ?? '').trim() + (a.CourseNo ?? '').trim()
          const keyB = (b.SubjectCode ?? '').trim() + (b.CourseNo ?? '').trim()
          return keyA < keyB ? -1 : keyA > keyB ? 1 : 0
        })

      return {
        current: Object.entries(current).map(([termId, sections]) => ({ termId, sections: sortSections(sections) })),
        future: Object.entries(future).map(([termId, sections]) => ({ termId, sections: sortSections(sections) })),
      }
    },
  },
  actions: {
    _buildSavePayload() {
      const auth = useAuthStore()
      const studentId = parseInt(auth.user.tartanId)
      return {
        token: auth.colleagueToken,
        studentId,
        username: auth.user.username,
        password: '',
        sections: this.sections.map((s) => ({ Credits: s.CreditHours, SectionId: s.CourseKey, StudentId: studentId })),
      }
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

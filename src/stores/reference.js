import { defineStore } from 'pinia'
import { getReferenceData } from '@/services/referenceService'

export const useReferenceStore = defineStore('reference', {
  state: () => ({
    _loaded: false,
    keyDates: [],
    intro: '',
    maintenance: [],
    terms: [],
    locations: [],
    currentTerm: '',
    careers: [],
    programs: [],
  }),
  getters: {
    upcomingKeyDates: (state) => {
      const today = new Date().toISOString().slice(0, 10)
      return state.keyDates
        .filter((d) => d.keyDate >= today)
        .sort((a, b) => (a.keyDate < b.keyDate ? -1 : 1))
    },
  },
  actions: {
    async load() {
      if (this._loaded) return
      this._loaded = true
      const { data } = await getReferenceData()
      this.keyDates = data.keyDates
      this.intro = data.intro
      this.maintenance = data.maintenance
      this.terms = data.terms ?? []
      this.locations = data.locations ?? []
      this.currentTerm = data.currentTerm ?? ''
      this.careers = data.careers ?? []
      this.programs = data.programs ?? []
    },
  },
})

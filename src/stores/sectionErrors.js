import { defineStore } from 'pinia'

export const useSectionErrorStore = defineStore('sectionErrors', {
  state: () => ({
    errors: {},
  }),
  actions: {
    set(courseKey, message) {
      this.errors[String(courseKey)] = message
    },
    dismiss(courseKey) {
      delete this.errors[String(courseKey)]
    },
    clear() {
      this.errors = {}
    },
  },
})

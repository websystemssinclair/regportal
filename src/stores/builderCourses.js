import { defineStore } from 'pinia'

export const STORAGE_KEY = 'regportal:builder:courses'

function readStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const useBuilderCoursesStore = defineStore('builderCourses', {
  state: () => ({
    codes: readStorage(),
  }),
  actions: {
    add(newCodes) {
      for (const code of newCodes) {
        if (!this.codes.includes(code)) {
          this.codes.push(code)
        }
      }
    },
    remove(code) {
      this.codes = this.codes.filter((c) => c !== code)
    },
    clear() {
      this.codes = []
    },
  },
})

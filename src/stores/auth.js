import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    currentRole: 'Visitor',
    user: null,
    apiKey: null,
  }),
  getters: {
    isAdmin: (state) => state.currentRole === 'Admin' || state.currentRole === 'Developer',
    isStudent: (state) => state.currentRole === 'Student',
  },
})

import { defineStore } from 'pinia'

export const useMaintenanceStore = defineStore('maintenance', {
  state: () => ({
    mode: null,
    publicMessage: '',
  }),
  getters: {
    isBackendDown: (state) => state.mode === 'backend',
  },
  actions: {
    setStatus({ mode, publicMessage }) {
      this.mode = mode
      this.publicMessage = publicMessage
    },
  },
})

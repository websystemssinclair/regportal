import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import App from './App.vue'
import router from './router'
import { RegPortalPreset } from './presets'
import { getApiToken } from './services/authService'
import { setApiKey } from './http/client'
import { useMaintenanceStore } from './stores/maintenance'
import { useReferenceStore } from './stores/reference'
import './style.css'

const MAINT_TYPE_MAP = { regular: 'site', webadvisor: 'backend' }

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, { unstyled: true, pt: RegPortalPreset })
app.use(ToastService)

getApiToken()
  .then(({ data }) => {
    if (data?.token) setApiKey(data.token)
  })
  .catch(() => {})
  .then(() => useReferenceStore().load())
  .then(() => {
    const [active] = useReferenceStore().maintenance
    if (active) {
      useMaintenanceStore().setStatus({
        mode: MAINT_TYPE_MAP[active.maintType] ?? null,
        publicMessage: active.maintCopy,
      })
    }
  })
  .catch(() => {})
  .finally(() => app.mount('#app'))

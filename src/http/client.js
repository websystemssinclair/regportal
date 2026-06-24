import axios from 'axios'

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_APP_PATH}`,
  headers: { 'Content-Type': 'application/json' },
})

export function setApiKey(token) {
  apiClient.defaults.params = { ...apiClient.defaults.params, apikey: token }
}

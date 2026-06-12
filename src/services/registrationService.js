import { apiClient } from '@/http/client'

export const registerSections = (payload) => apiClient.post('registration', payload)

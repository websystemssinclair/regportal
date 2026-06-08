import { apiClient } from '@/http/client'

export const registerSections = (actions) => apiClient.post('registration', { actions })

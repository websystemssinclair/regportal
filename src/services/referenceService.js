import { apiClient } from '@/http/client'

export const getReferenceData = () => apiClient.get('/reference.StaticData')

import { apiClient } from '@/http/client'

export const getProgram = (programCode) => apiClient.get(`programs/${programCode}`)

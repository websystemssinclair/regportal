import { apiClient } from '@/http/client'

export const getPrograms = () => apiClient.get('programs')

export const getProgramCourses = (programId) => apiClient.get(`programs/${programId}/courses`)

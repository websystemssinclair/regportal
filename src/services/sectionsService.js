import { apiClient } from '@/http/client'

export const searchSections = (params) => apiClient.get('sections', { params })

export const getSectionDetails = (sectionId) => apiClient.get(`sections/${sectionId}`)

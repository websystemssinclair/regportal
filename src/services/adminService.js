import { apiClient } from '@/http/client'

export const getTerms = () => apiClient.get('admin/terms')

export const getImportantDates = () => apiClient.get('admin/importantDates')

export const getMaintenanceMode = () => apiClient.get('admin/maintenanceMode')

import { apiClient } from '@/http/client'

export const saveCart = (payload) => apiClient.post('ShoppingCart', payload)

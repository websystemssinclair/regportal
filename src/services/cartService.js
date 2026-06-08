import { apiClient } from '@/http/client'

export const getCart = () => apiClient.get('cart')

export const addToCart = (sectionId) => apiClient.post('cart', { sectionId })

export const removeFromCart = (sectionId) => apiClient.delete(`cart/${sectionId}`)

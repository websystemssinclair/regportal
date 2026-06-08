import { describe, it, expect } from 'vitest'
import { apiClient } from '@/http/client'

describe('apiClient', () => {
  it('uses VITE_API_BASE_URL + VITE_API_APP_PATH as baseURL', () => {
    const expected = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_APP_PATH}`
    expect(apiClient.defaults.baseURL).toBe(expected)
  })
})

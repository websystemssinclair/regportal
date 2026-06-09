import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/http/client'
import { getReferenceData } from '@/services/referenceService'

vi.mock('@/http/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getReferenceData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /reference.StaticData on the apiClient', () => {
    apiClient.get.mockResolvedValue({ data: {} })
    getReferenceData()
    expect(apiClient.get).toHaveBeenCalledWith('/reference.StaticData')
  })

  it('returns the response from the apiClient', async () => {
    const payload = { intro: '<p>Welcome</p>', keyDates: [] }
    apiClient.get.mockResolvedValue({ data: payload })
    const result = await getReferenceData()
    expect(result.data).toEqual(payload)
  })
})

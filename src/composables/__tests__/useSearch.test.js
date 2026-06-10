import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSearch } from '@/composables/useSearch'

vi.mock('@/services/sectionsService', () => ({
  searchCourses: vi.fn(),
}))

import { searchCourses } from '@/services/sectionsService'

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes results, total, isLoading, error, filters, and fetch', async () => {
    searchCourses.mockResolvedValue({ data: { results: 0, rows: [] } })

    const search = useSearch()
    expect(search.results.value).toEqual([])
    expect(search.total.value).toBe(0)
    expect(search.isLoading.value).toBe(false)
    expect(search.error.value).toBeNull()
    expect(typeof search.fetch).toBe('function')
    expect(search.filters).toBeDefined()
  })

  it('fetch() calls searchCourses with the current filters', async () => {
    searchCourses.mockResolvedValue({ data: { results: 0, rows: [] } })
    const { filters, fetch } = useSearch()
    filters.keyword = 'biology'
    filters.term = '26FA'
    await fetch()
    expect(searchCourses).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'biology', term: '26FA' }))
  })

  it('fetch() populates results and total on success', async () => {
    const rows = [{ id: '1', LongName: 'Survey of Accounting', SubjectCode: 'ACC' }]
    searchCourses.mockResolvedValue({ data: { results: 534, rows } })
    const { results, total, fetch } = useSearch()
    await fetch()
    expect(results.value).toEqual(rows)
    expect(total.value).toBe(534)
  })

  it('fetch() sets isLoading true during the call then false after', async () => {
    let loadingDuring = null
    searchCourses.mockImplementation(async () => {
      loadingDuring = true
      return { data: { results: 0, rows: [] } }
    })
    const { isLoading, fetch } = useSearch()
    await fetch()
    expect(loadingDuring).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  it('fetch() sets error and clears results on failure', async () => {
    const boom = new Error('network error')
    searchCourses.mockRejectedValue(boom)
    const { results, error, fetch } = useSearch()
    results.value = [{ id: '1' }]
    await fetch()
    expect(error.value).toBe(boom)
    expect(results.value).toEqual([])
  })

  it('re-fetch with updated filters uses the new values', async () => {
    searchCourses.mockResolvedValue({ data: { results: 0, rows: [] } })
    const { filters, fetch } = useSearch()
    filters.subjectCode = 'ENG'
    await fetch()
    expect(searchCourses).toHaveBeenCalledWith(expect.objectContaining({ subjectCode: 'ENG' }))
    filters.subjectCode = 'ART'
    await fetch()
    expect(searchCourses).toHaveBeenLastCalledWith(expect.objectContaining({ subjectCode: 'ART' }))
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/http/client'
import { searchCourses, getCourseDetails, getCourseSections } from '@/services/sectionsService'

vi.mock('@/http/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('sectionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('searchCourses', () => {
    it('calls GET /Courses with the provided params', () => {
      apiClient.get.mockResolvedValue({ data: { results: 0, rows: [] } })
      const params = { keyword: 'accounting', term: '26FA', page: 1, limit: 50 }
      searchCourses(params)
      expect(apiClient.get).toHaveBeenCalledWith('Courses', { params })
    })
  })

  describe('getCourseDetails', () => {
    it('calls GET /Courses/{subject}/{number}/{term}', () => {
      apiClient.get.mockResolvedValue({ data: { results: 1, rows: [] } })
      getCourseDetails('ACC', '1100', '26SU')
      expect(apiClient.get).toHaveBeenCalledWith('Courses/ACC/1100/26SU')
    })
  })

  describe('getCourseSections', () => {
    it('calls GET /Sections/{subject}/{number}/{term} with the provided params', () => {
      apiClient.get.mockResolvedValue({ data: { results: 0, rows: [] } })
      const params = { term: '26SU', subjectCode: 'ACC' }
      getCourseSections('ACC', '1100', '26SU', params)
      expect(apiClient.get).toHaveBeenCalledWith('Sections/ACC/1100/26SU', { params })
    })
  })
})

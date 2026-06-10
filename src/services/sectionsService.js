import { apiClient } from '@/http/client'

export const searchCourses = (params) => apiClient.get('Courses', { params })

export const getCourseDetails = (subject, number, term) =>
  apiClient.get(`Courses/${subject}/${number}/${term}`)

export const getCourseSections = (subject, number, term, params) =>
  apiClient.get(`Sections/${subject}/${number}/${term}`, { params })

import { apiClient } from '@/http/client'

export const getBooksByTerm = (courseCodes, term) =>
  apiClient.post('Books', { courseCodes, term })

export const getBooksBySection = (subjectCode, courseNumber, term, sectionNo) =>
  apiClient.get(`Books/${subjectCode}/${courseNumber}/${term}/${sectionNo}`)

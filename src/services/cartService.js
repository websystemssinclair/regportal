import { apiClient } from '@/http/client'

export const buildSavePayload = (sections, { tartanId, colleagueToken, username }) => {
  const studentId = parseInt(tartanId)
  return {
    token: colleagueToken,
    studentId,
    username,
    password: '',
    sections: sections.map((s) => ({ Credits: s.CreditHours, SectionId: s.CourseKey, StudentId: studentId })),
  }
}

export const saveCart = (payload) => apiClient.post('ShoppingCart', payload)

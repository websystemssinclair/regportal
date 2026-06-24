import { describe, it, expect } from 'vitest'
import { buildSavePayload } from '@/services/cartService'

const makeCreds = (overrides = {}) => ({
  tartanId: '521272',
  colleagueToken: 'TOKEN',
  username: 'brian.cooney',
  ...overrides,
})

const makeSection = (overrides = {}) => ({
  CourseKey: '352071',
  CreditHours: 3,
  ...overrides,
})

describe('buildSavePayload(sections, creds)', () => {
  it('sets token from creds.colleagueToken', () => {
    const payload = buildSavePayload([], makeCreds({ colleagueToken: 'MY_TOKEN' }))
    expect(payload.token).toBe('MY_TOKEN')
  })

  it('parses tartanId as an integer for studentId', () => {
    const payload = buildSavePayload([], makeCreds({ tartanId: '521272' }))
    expect(payload.studentId).toBe(521272)
    expect(typeof payload.studentId).toBe('number')
  })

  it('sets username from creds.username', () => {
    const payload = buildSavePayload([], makeCreds({ username: 'brian.cooney' }))
    expect(payload.username).toBe('brian.cooney')
  })

  it('maps each section to { Credits, SectionId, StudentId }', () => {
    const sections = [
      makeSection({ CourseKey: 'A1', CreditHours: 3 }),
      makeSection({ CourseKey: 'B2', CreditHours: 4 }),
    ]
    const payload = buildSavePayload(sections, makeCreds({ tartanId: '521272' }))
    expect(payload.sections).toEqual([
      { Credits: 3, SectionId: 'A1', StudentId: 521272 },
      { Credits: 4, SectionId: 'B2', StudentId: 521272 },
    ])
  })
})

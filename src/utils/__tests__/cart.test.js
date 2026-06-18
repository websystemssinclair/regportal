import { describe, it, expect } from 'vitest'
import { groupSectionsByTerm } from '@/utils/cart'

const TERMS = [
  { id: '26SU', termName: 'Summer 2026', toView: 'D' },
  { id: '26FA', termName: 'Fall 2026',   toView: 'Y' },
  { id: '27SP', termName: 'Spring 2027', toView: 'F' },
  { id: '25FA', termName: 'Fall 2025',   toView: 'N' },
]

const sec = (overrides = {}) => ({
  CourseKey: 'K',
  Term: '26SU',
  SubjectCode: 'ACC  ',
  CourseNo: '1100  ',
  ...overrides,
})

describe('groupSectionsByTerm', () => {
  it('returns empty current and future for no sections', () => {
    const { current, future } = groupSectionsByTerm([], TERMS)
    expect(current).toEqual([])
    expect(future).toEqual([])
  })

  it('places D-term sections into current', () => {
    const { current } = groupSectionsByTerm([sec({ CourseKey: 'A', Term: '26SU' })], TERMS)
    expect(current).toHaveLength(1)
    expect(current[0].termId).toBe('26SU')
    expect(current[0].sections[0].CourseKey).toBe('A')
  })

  it('places Y-term sections into current', () => {
    const { current } = groupSectionsByTerm([sec({ CourseKey: 'B', Term: '26FA' })], TERMS)
    expect(current[0].termId).toBe('26FA')
  })

  it('places N-term sections into current', () => {
    const { current } = groupSectionsByTerm([sec({ CourseKey: 'D', Term: '25FA' })], TERMS)
    expect(current[0].termId).toBe('25FA')
  })

  it('places F-term sections into future', () => {
    const { future } = groupSectionsByTerm([sec({ CourseKey: 'C', Term: '27SP' })], TERMS)
    expect(future).toHaveLength(1)
    expect(future[0].termId).toBe('27SP')
    expect(future[0].sections[0].CourseKey).toBe('C')
  })

  it('routes mixed terms to correct buckets', () => {
    const sections = [
      sec({ CourseKey: 'A', Term: '26SU' }),
      sec({ CourseKey: 'B', Term: '26FA' }),
      sec({ CourseKey: 'C', Term: '27SP' }),
      sec({ CourseKey: 'D', Term: '25FA' }),
    ]
    const { current, future } = groupSectionsByTerm(sections, TERMS)
    const currentKeys = current.flatMap((g) => g.sections.map((s) => s.CourseKey)).sort()
    const futureKeys = future.flatMap((g) => g.sections.map((s) => s.CourseKey))
    expect(currentKeys).toEqual(['A', 'B', 'D'])
    expect(futureKeys).toEqual(['C'])
  })

  it('defaults unknown terms to current (toView treated as Y)', () => {
    const { current, future } = groupSectionsByTerm([sec({ CourseKey: 'X', Term: 'UNKNOWN' })], TERMS)
    expect(current.flatMap((g) => g.sections.map((s) => s.CourseKey))).toContain('X')
    expect(future).toHaveLength(0)
  })

  it('sorts sections within a term by SubjectCode + CourseNo ascending', () => {
    const sections = [
      sec({ CourseKey: 'Z', Term: '26SU', SubjectCode: 'MAT  ', CourseNo: '1470  ' }),
      sec({ CourseKey: 'A', Term: '26SU', SubjectCode: 'ACC  ', CourseNo: '1210  ' }),
      sec({ CourseKey: 'M', Term: '26SU', SubjectCode: 'ENG  ', CourseNo: '1101  ' }),
    ]
    const { current } = groupSectionsByTerm(sections, TERMS)
    const keys = current.find((g) => g.termId === '26SU').sections.map((s) => s.CourseKey)
    expect(keys).toEqual(['A', 'M', 'Z'])
  })

  it('groups sections from the same term under one entry', () => {
    const sections = [
      sec({ CourseKey: '1', Term: '26SU', SubjectCode: 'ACC  ', CourseNo: '1100  ' }),
      sec({ CourseKey: '2', Term: '26SU', SubjectCode: 'ENG  ', CourseNo: '1101  ' }),
    ]
    const { current } = groupSectionsByTerm(sections, TERMS)
    expect(current).toHaveLength(1)
    expect(current[0].sections).toHaveLength(2)
  })

  it('produces separate term groups for different terms in the same bucket', () => {
    const sections = [
      sec({ CourseKey: 'A', Term: '26SU' }),
      sec({ CourseKey: 'B', Term: '26FA' }),
    ]
    const { current } = groupSectionsByTerm(sections, TERMS)
    expect(current).toHaveLength(2)
  })

  it('does not mutate the input sections array', () => {
    const sections = [sec({ CourseKey: 'A', Term: '26SU' })]
    const original = [...sections]
    groupSectionsByTerm(sections, TERMS)
    expect(sections).toEqual(original)
  })

  it('handles sections with no terms list — defaults all to current', () => {
    const sections = [sec({ CourseKey: 'A', Term: '26SU' })]
    const { current, future } = groupSectionsByTerm(sections, [])
    expect(current).toHaveLength(1)
    expect(future).toHaveLength(0)
  })
})

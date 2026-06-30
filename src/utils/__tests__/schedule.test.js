import { describe, it, expect } from 'vitest'
import { summarizeSchedule, gridRange, sortByCampusDays } from '@/utils/schedule'

const sec = (overrides = {}) => ({
  days: ['M', 'W', 'F'],
  startMin: 540,
  endMin: 590,
  creditHours: 3,
  termFormat: 'Full',
  building: 'Dayton',
  ...overrides,
})

describe('sortByCampusDays', () => {
  it('places schedules with fewer unique campus days first', () => {
    const mwf = [sec({ days: ['M', 'W', 'F'] })]
    const mw = [sec({ days: ['M', 'W'] })]
    const m = [sec({ days: ['M'] })]
    const sorted = sortByCampusDays([mwf, mw, m])
    expect(sorted[0]).toBe(m)
    expect(sorted[1]).toBe(mw)
    expect(sorted[2]).toBe(mwf)
  })

  it('treats online-only schedules as 0 campus days and sorts them first', () => {
    const online = [sec({ days: [] })]
    const inPerson = [sec({ days: ['M', 'W', 'F'] })]
    const sorted = sortByCampusDays([inPerson, online])
    expect(sorted[0]).toBe(online)
  })

  it('is stable — equal campus-day counts preserve original order', () => {
    const a = [sec({ days: ['M', 'W'] })]
    const b = [sec({ days: ['T', 'R'] })]
    const c = [sec({ days: ['M', 'F'] })]
    const sorted = sortByCampusDays([a, b, c])
    expect(sorted[0]).toBe(a)
    expect(sorted[1]).toBe(b)
    expect(sorted[2]).toBe(c)
  })
})

describe('gridRange', () => {
  it('returns min startMin and max endMin across sections with meeting times', () => {
    const sections = [
      sec({ startMin: 540, endMin: 590 }),
      sec({ startMin: 780, endMin: 870 }),
      sec({ startMin: 480, endMin: 530 }),
    ]
    expect(gridRange(sections)).toEqual({ minMin: 480, maxMin: 870 })
  })

  it('returns fallback range when all sections are online (no startMin)', () => {
    const sections = [sec({ startMin: null, endMin: null, days: [] })]
    expect(gridRange(sections)).toEqual({ minMin: 480, maxMin: 1320 })
  })
})

describe('summarizeSchedule', () => {
  it('returns sorted day union across all in-person sections', () => {
    const sections = [
      sec({ days: ['M', 'W'] }),
      sec({ days: ['F'] }),
    ]
    expect(summarizeSchedule(sections).days).toEqual(['M', 'W', 'F'])
  })

  it('sets hasOnline true when any section has empty days', () => {
    const sections = [sec({ days: ['M', 'W', 'F'] }), sec({ days: [] })]
    expect(summarizeSchedule(sections).hasOnline).toBe(true)
  })

  it('sets hasOnline false when all sections have meeting days', () => {
    const sections = [sec({ days: ['M', 'W', 'F'] }), sec({ days: ['T', 'R'] })]
    expect(summarizeSchedule(sections).hasOnline).toBe(false)
  })

  it('sums credit hours across all sections', () => {
    const sections = [sec({ creditHours: 3 }), sec({ creditHours: 4 }), sec({ creditHours: 1 })]
    expect(summarizeSchedule(sections).totalCredits).toBe(8)
  })

  it('deduplicates term types and lists up to 2 distinct values', () => {
    const sections = [
      sec({ termFormat: 'Full' }),
      sec({ termFormat: 'A' }),
      sec({ termFormat: 'Full' }),
    ]
    const { termTypes } = summarizeSchedule(sections)
    expect(termTypes).toHaveLength(2)
    expect(termTypes).toContain('Full')
    expect(termTypes).toContain('A')
  })

  it('returns ["Multiple"] for term types when 3 or more distinct values', () => {
    const sections = [
      sec({ termFormat: 'Full' }),
      sec({ termFormat: 'A' }),
      sec({ termFormat: 'B' }),
    ]
    expect(summarizeSchedule(sections).termTypes).toEqual(['Multiple'])
  })

  it('deduplicates locations and returns ["Multiple"] at 3+', () => {
    const two = [sec({ building: 'Dayton' }), sec({ building: 'Mason' })]
    expect(summarizeSchedule(two).locations).toHaveLength(2)

    const three = [
      sec({ building: 'Dayton' }),
      sec({ building: 'Mason' }),
      sec({ building: 'Courseview' }),
    ]
    expect(summarizeSchedule(three).locations).toEqual(['Multiple'])
  })

  it('excludes null building values from locations', () => {
    const sections = [sec({ building: 'Dayton' }), sec({ building: null })]
    expect(summarizeSchedule(sections).locations).toEqual(['Dayton'])
  })
})

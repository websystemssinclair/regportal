import { describe, it, expect } from 'vitest'
import {
  conflicts,
  conflictsWithAny,
  matchesLocation,
  applyFilters,
  buildSchedules,
} from '@/workers/scheduleWorker'

const sec = (id, days, startMin, endMin, overrides = {}) => ({
  id,
  days,
  startMin,
  endMin,
  termFormat: 'LEC',
  building: 'BLDG-A',
  creditHours: 3,
  subjectCode: 'ACC',
  courseNo: '1100',
  longName: 'Intro Accounting',
  faculty: 'Smith',
  ...overrides,
})

const DEFAULT_FILTERS = {
  rangeStart: 360,  // 6am
  rangeEnd: 1380,   // 11pm
  days: ['M', 'T', 'W', 'R', 'F', 'S', 'U'],
  termFormat: 'all',
  location: 'any',
}

// --- conflicts() ---

describe('conflicts()', () => {
  it('returns true when sections overlap on a shared day', () => {
    const a = sec('1', ['M', 'W'], 540, 630)   // 9:00-10:30
    const b = sec('2', ['M'], 600, 690)          // 10:00-11:30
    expect(conflicts(a, b)).toBe(true)
  })

  it('returns false when times do not overlap', () => {
    const a = sec('1', ['M'], 480, 570)  // 8:00-9:30
    const b = sec('2', ['M'], 600, 690)  // 10:00-11:30
    expect(conflicts(a, b)).toBe(false)
  })

  it('returns false for back-to-back sections (half-open interval)', () => {
    const a = sec('1', ['M'], 480, 570)  // 8:00-9:30
    const b = sec('2', ['M'], 570, 660)  // 9:30-11:00
    expect(conflicts(a, b)).toBe(false)
  })

  it('returns false when sections meet on different days', () => {
    const a = sec('1', ['M', 'W'], 540, 630)
    const b = sec('2', ['T', 'R'], 540, 630)
    expect(conflicts(a, b)).toBe(false)
  })

  it('returns false when either section is online (null startMin)', () => {
    const a = sec('1', [], null, null)
    const b = sec('2', ['M'], 540, 630)
    expect(conflicts(a, b)).toBe(false)
    expect(conflicts(b, a)).toBe(false)
  })

  it('returns false when both sections are online', () => {
    const a = sec('1', [], null, null)
    const b = sec('2', [], null, null)
    expect(conflicts(a, b)).toBe(false)
  })
})

// --- conflictsWithAny() ---

describe('conflictsWithAny()', () => {
  it('returns false when placed is empty', () => {
    expect(conflictsWithAny(sec('1', ['M'], 540, 630), [])).toBe(false)
  })

  it('returns false when section does not conflict with any placed section', () => {
    const placed = [sec('2', ['M'], 480, 540), sec('3', ['T'], 540, 630)]
    expect(conflictsWithAny(sec('1', ['M'], 600, 690), placed)).toBe(false)
  })

  it('returns true when section conflicts with at least one placed section', () => {
    const placed = [
      sec('2', ['M'], 480, 540),
      sec('3', ['T'], 540, 630),
      sec('4', ['M'], 550, 640),  // overlaps with candidate on M
    ]
    expect(conflictsWithAny(sec('1', ['M'], 520, 610), placed)).toBe(true)
  })
})

// --- matchesLocation() ---

describe('matchesLocation()', () => {
  it('matches any section when location is "any"', () => {
    expect(matchesLocation({ location: 'SCC' }, 'any')).toBe(true)
    expect(matchesLocation({ location: '' }, 'any')).toBe(true)
    expect(matchesLocation({ location: null }, 'any')).toBe(true)
  })

  it('SCC matches sections with empty or null location (main campus default)', () => {
    expect(matchesLocation({ location: '' }, 'SCC')).toBe(true)
    expect(matchesLocation({ location: null }, 'SCC')).toBe(true)
  })

  it('SCC does not match sections with a non-empty location code', () => {
    expect(matchesLocation({ location: 'CENT' }, 'SCC')).toBe(false)
    expect(matchesLocation({ location: 'WWW' }, 'SCC')).toBe(false)
  })

  it('CvCC matches location codes starting with CvCC or CV', () => {
    expect(matchesLocation({ location: 'CvCC' }, 'CvCC')).toBe(true)
    expect(matchesLocation({ location: 'CvCC-101' }, 'CvCC')).toBe(true)
    expect(matchesLocation({ location: 'CV123' }, 'CvCC')).toBe(true)
  })

  it('CvCC matches known alias location codes', () => {
    for (const alias of ['KHS', 'VOA', 'VALC', 'AMC', 'WCCC', 'WCCS', 'GHSA']) {
      expect(matchesLocation({ location: alias }, 'CvCC')).toBe(true)
    }
  })

  it('CvCC does not match unrelated location codes', () => {
    expect(matchesLocation({ location: 'SCC' }, 'CvCC')).toBe(false)
    expect(matchesLocation({ location: '' }, 'CvCC')).toBe(false)
  })

  it('other locations match by prefix (e.g. WWW matches WWWzzz)', () => {
    expect(matchesLocation({ location: 'WWWzzz' }, 'WWW')).toBe(true)
    expect(matchesLocation({ location: 'CENT-202' }, 'CENT')).toBe(true)
  })

  it('other locations do not match a different prefix', () => {
    expect(matchesLocation({ location: 'SCC' }, 'WWW')).toBe(false)
    expect(matchesLocation({ location: '' }, 'CENT')).toBe(false)
  })
})

// --- applyFilters() ---

describe('applyFilters()', () => {
  it('returns all sections when no filters are active', () => {
    const sections = [
      sec('1', ['M', 'W'], 540, 630),
      sec('2', ['T', 'R'], 480, 570),
    ]
    expect(applyFilters(sections, DEFAULT_FILTERS)).toHaveLength(2)
  })

  it('excludes sections starting before rangeStart', () => {
    const sections = [
      sec('1', ['M'], 300, 420),  // 5am-7am — before 6am filter
      sec('2', ['M'], 480, 570),  // 8am-9:30am — within range
    ]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, rangeStart: 420 }) // 7am filter
    expect(result.map((s) => s.id)).toEqual(['2'])
  })

  it('excludes sections ending after rangeEnd', () => {
    const sections = [
      sec('1', ['M'], 1320, 1440),  // ends past 11pm
      sec('2', ['M'], 540, 630),
    ]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, rangeEnd: 1380 })
    expect(result.map((s) => s.id)).toEqual(['2'])
  })

  it('passes online sections (null startMin) regardless of time range', () => {
    const sections = [sec('1', [], null, null)]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, rangeStart: 480, rangeEnd: 720 })
    expect(result).toHaveLength(1)
  })

  it('excludes sections that meet on disallowed days', () => {
    const sections = [
      sec('1', ['M', 'W', 'F'], 540, 630),
      sec('2', ['T', 'R'], 540, 630),   // T/R not allowed
    ]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, days: ['M', 'W', 'F'] })
    expect(result.map((s) => s.id)).toEqual(['1'])
  })

  it('passes online sections (empty days) regardless of day filter', () => {
    const sections = [sec('1', [], null, null)]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, days: ['M'] })
    expect(result).toHaveLength(1)
  })

  it('excludes sections with a disallowed termFormat', () => {
    const sections = [
      sec('1', ['M'], 540, 630, { termFormat: 'ONL' }),
      sec('2', ['M'], 540, 630, { termFormat: 'LEC' }),
    ]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, termFormat: 'LEC' })
    expect(result.map((s) => s.id)).toEqual(['2'])
  })

  it('passes all termFormats when filter is "all"', () => {
    const sections = [
      sec('1', ['M'], 540, 630, { termFormat: 'ONL' }),
      sec('2', ['M'], 540, 630, { termFormat: 'LEC' }),
    ]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, termFormat: 'all' })
    expect(result).toHaveLength(2)
  })

  it('ST filter excludes Full term but passes A, B, 12, and ST sections', () => {
    const sections = [
      sec('1', ['M'], 540, 630, { termFormat: 'Full' }),
      sec('2', ['M'], 540, 630, { termFormat: 'A' }),
      sec('3', ['M'], 540, 630, { termFormat: 'B' }),
      sec('4', ['M'], 540, 630, { termFormat: '12' }),
      sec('5', ['M'], 540, 630, { termFormat: 'ST' }),
    ]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, termFormat: 'ST' })
    expect(result.map((s) => s.id)).toEqual(['2', '3', '4', '5'])
  })

  it('excludes sections not matching the location filter', () => {
    const sections = [
      sec('1', ['M'], 540, 630, { location: 'CENT' }),
      sec('2', ['M'], 540, 630, { location: 'WWW' }),
    ]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, location: 'CENT' })
    expect(result.map((s) => s.id)).toEqual(['1'])
  })

  it('passes all locations when filter is "any"', () => {
    const sections = [
      sec('1', ['M'], 540, 630, { location: 'CENT' }),
      sec('2', ['M'], 540, 630, { location: 'WWW' }),
    ]
    const result = applyFilters(sections, { ...DEFAULT_FILTERS, location: 'any' })
    expect(result).toHaveLength(2)
  })
})

// --- buildSchedules() ---

describe('buildSchedules()', () => {
  it('returns empty array when no courses provided', () => {
    expect(buildSchedules([], DEFAULT_FILTERS)).toEqual([])
  })

  it('returns one schedule per section for a single course', () => {
    const courseSections = [[sec('1', ['M'], 540, 630), sec('2', ['T'], 540, 630)]]
    const result = buildSchedules(courseSections, DEFAULT_FILTERS)
    expect(result).toHaveLength(2)
  })

  it('returns all valid combinations for two non-conflicting courses', () => {
    const course1 = [sec('1a', ['M'], 480, 570), sec('1b', ['T'], 480, 570)]
    const course2 = [sec('2a', ['W'], 480, 570), sec('2b', ['R'], 480, 570)]
    const result = buildSchedules([course1, course2], DEFAULT_FILTERS)
    expect(result).toHaveLength(4)
  })

  it('excludes combinations where sections conflict', () => {
    const course1 = [sec('1', ['M', 'W', 'F'], 540, 630)]
    const course2 = [
      sec('2a', ['M', 'W', 'F'], 540, 630),  // conflicts with course1
      sec('2b', ['T', 'R'], 480, 570),         // no conflict
    ]
    const result = buildSchedules([course1, course2], DEFAULT_FILTERS)
    expect(result).toHaveLength(1)
    expect(result[0].map((s) => s.id)).toEqual(['1', '2b'])
  })

  it('returns empty array when no valid non-conflicting combination exists', () => {
    const course1 = [sec('1', ['M', 'W', 'F'], 540, 630)]
    const course2 = [sec('2', ['M', 'W', 'F'], 540, 630)]  // always conflicts
    expect(buildSchedules([course1, course2], DEFAULT_FILTERS)).toEqual([])
  })

  it('stops at max (50 by default)', () => {
    // 10 sections per course on different days — no conflicts, 100 combos, stop at 50
    // start at 480 (8am), step 70min, 50min duration — all within 6am-11pm range
    const course1 = Array.from({ length: 10 }, (_, i) =>
      sec(String(i), ['M'], 480 + i * 70, 480 + i * 70 + 50),
    )
    const course2 = Array.from({ length: 10 }, (_, i) =>
      sec(String(i + 10), ['T'], 480 + i * 70, 480 + i * 70 + 50),
    )
    const result = buildSchedules([course1, course2], DEFAULT_FILTERS)
    expect(result).toHaveLength(50)
  })

  it('respects a custom max', () => {
    const course1 = Array.from({ length: 5 }, (_, i) =>
      sec(String(i), ['M'], 480 + i * 70, 480 + i * 70 + 50),
    )
    const course2 = Array.from({ length: 5 }, (_, i) =>
      sec(String(i + 5), ['T'], 480 + i * 70, 480 + i * 70 + 50),
    )
    const result = buildSchedules([course1, course2], DEFAULT_FILTERS, 3)
    expect(result).toHaveLength(3)
  })

  it('applies filters before combining', () => {
    // course1 has one section that passes filter, one that doesn't
    const course1 = [
      sec('1a', ['M'], 540, 630),  // 9am-10:30am — passes
      sec('1b', ['M'], 200, 300),  // before rangeStart — filtered out
    ]
    const course2 = [sec('2', ['T'], 480, 570)]
    const result = buildSchedules([course1, course2], { ...DEFAULT_FILTERS, rangeStart: 480 })
    expect(result).toHaveLength(1)
    expect(result[0][0].id).toBe('1a')
  })

  it('includes online sections in every valid schedule', () => {
    const course1 = [sec('1', [], null, null)]  // online — never conflicts
    const course2 = [sec('2', [], null, null)]  // online
    const result = buildSchedules([course1, course2], DEFAULT_FILTERS)
    expect(result).toHaveLength(1)
    expect(result[0].map((s) => s.id)).toEqual(['1', '2'])
  })
})

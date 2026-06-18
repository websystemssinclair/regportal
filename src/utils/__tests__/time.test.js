import { describe, it, expect } from 'vitest'
import { parseTimeMinutes, formatMinutes, formatTime } from '@/utils/time'

describe('parseTimeMinutes', () => {
  it('parses a 12-hour AM time', () => {
    expect(parseTimeMinutes('9:00 AM')).toBe(540)
  })

  it('parses a 12-hour PM time', () => {
    expect(parseTimeMinutes('2:30 PM')).toBe(870)
  })

  it('parses noon correctly (12:00 PM = 720)', () => {
    expect(parseTimeMinutes('12:00 PM')).toBe(720)
  })

  it('parses midnight correctly (12:00 AM = 0)', () => {
    expect(parseTimeMinutes('12:00 AM')).toBe(0)
  })

  it('parses a 24-hour time with no period', () => {
    expect(parseTimeMinutes('14:30')).toBe(870)
  })

  it('parses a time with lowercase am/pm', () => {
    expect(parseTimeMinutes('9:00 am')).toBe(540)
  })

  it('parses a time with no space before period', () => {
    expect(parseTimeMinutes('9:00AM')).toBe(540)
  })

  it('returns null for an empty string', () => {
    expect(parseTimeMinutes('')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(parseTimeMinutes(null)).toBeNull()
  })

  it('returns null for an unrecognised format', () => {
    expect(parseTimeMinutes('not-a-time')).toBeNull()
  })
})

describe('formatMinutes', () => {
  it('formats a morning time', () => {
    expect(formatMinutes(540)).toBe('9:00am')
  })

  it('formats an afternoon time', () => {
    expect(formatMinutes(870)).toBe('2:30pm')
  })

  it('formats noon', () => {
    expect(formatMinutes(720)).toBe('12:00pm')
  })

  it('formats midnight', () => {
    expect(formatMinutes(0)).toBe('12:00am')
  })

  it('pads minutes with a leading zero', () => {
    expect(formatMinutes(545)).toBe('9:05am')
  })
})

describe('formatTime', () => {
  it('parses and formats a valid AM time string', () => {
    expect(formatTime('9:00 AM')).toBe('9:00am')
  })

  it('parses and formats a valid PM time string', () => {
    expect(formatTime('2:30 PM')).toBe('2:30pm')
  })

  it('returns the original string when parsing fails', () => {
    expect(formatTime('TBA')).toBe('TBA')
  })

  it('returns empty string for null input', () => {
    expect(formatTime(null)).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(formatTime(undefined)).toBe('')
  })
})

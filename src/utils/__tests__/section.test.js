import { describe, it, expect, vi, afterEach } from 'vitest'
import { isActionable, seatBadge, statusBadgeClass } from '@/utils/section'

const sec = (overrides = {}) => ({
  status: 'Open',
  waitListAllowed: 'N',
  isFuture: false,
  ...overrides,
})

describe('isActionable', () => {
  afterEach(() => vi.useRealTimers())

  it('Open section with no regEndDate is actionable', () => {
    expect(isActionable(sec())).toBe(true)
  })

  it('Open section with regEndDate in the future is actionable', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00'))
    expect(isActionable(sec({ regEndDate: '01/15/2025 23:59' }))).toBe(true)
  })

  it('Open section with regEndDate in the past is not actionable', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-20T00:00:00'))
    expect(isActionable(sec({ regEndDate: '01/15/2025 23:59' }))).toBe(false)
  })

  it('SectionLoc 320 with regEndDate 1 day past is actionable (2-day grace window)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-17T12:00:00'))
    expect(isActionable(sec({ regEndDate: '01/16/2025 23:59', SectionLoc: '320' }))).toBe(true)
  })

  it('SectionLoc 320 with regEndDate 3 days past is not actionable', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-20T12:00:00'))
    expect(isActionable(sec({ regEndDate: '01/16/2025 23:59', SectionLoc: '320' }))).toBe(false)
  })

  it('Open section with isFuture true is not actionable', () => {
    expect(isActionable(sec({ isFuture: true }))).toBe(false)
  })

  it('Cancelled section with waitListAllowed Y is not actionable', () => {
    expect(isActionable(sec({ status: 'Cancelled', waitListAllowed: 'Y' }))).toBe(false)
  })

  it('Closed section with waitListAllowed Y and no regEndDate is actionable', () => {
    expect(isActionable(sec({ status: 'Closed', waitListAllowed: 'Y' }))).toBe(true)
  })
})

describe('seatBadge', () => {
  afterEach(() => vi.useRealTimers())

  it('Cancelled section returns Cancelled badge', () => {
    expect(seatBadge(sec({ status: 'Cancelled' }))).toEqual({
      cls: 'bg-gray-100 text-gray-500',
      label: 'Cancelled',
    })
  })

  it('Closed + waitListAllowed Y returns Waitlist Available badge', () => {
    expect(seatBadge(sec({ status: 'Closed', waitListAllowed: 'Y' }))).toEqual({
      cls: 'bg-amber-100 text-amber-800',
      label: 'Waitlist Available',
    })
  })

  it('Closed + waitListAllowed N returns Closed badge', () => {
    expect(seatBadge(sec({ status: 'Closed', waitListAllowed: 'N' }))).toEqual({
      cls: 'bg-red-100 text-red-700',
      label: 'Closed',
    })
  })

  it('Open + regExpired returns Registration Closed badge even when openSeats > 0', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-20T00:00:00'))
    expect(seatBadge(sec({ regEndDate: '01/15/2025 23:59', openSeats: 10 }))).toEqual({
      cls: 'bg-gray-100 text-gray-500',
      label: 'Registration Closed',
    })
  })

  it('Open + openSeats > 0 returns Open seats badge with floored count', () => {
    expect(seatBadge(sec({ openSeats: 5.7 }))).toEqual({
      cls: 'bg-green-100 text-green-800',
      label: 'Open · 5 seats',
    })
  })

  it('Open + openSeats 0 returns empty badge', () => {
    expect(seatBadge(sec({ openSeats: 0 }))).toEqual({ cls: '', label: '' })
  })
})

describe('statusBadgeClass', () => {
  it('Open returns green classes', () => {
    expect(statusBadgeClass('Open')).toBe('bg-green-100 text-green-800')
  })

  it('Waitlist returns yellow classes', () => {
    expect(statusBadgeClass('Waitlist')).toBe('bg-yellow-100 text-yellow-800')
  })

  it('Closed returns red classes', () => {
    expect(statusBadgeClass('Closed')).toBe('bg-red-100 text-red-800')
  })
})

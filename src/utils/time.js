/**
 * Parses a time string ("9:00 AM", "14:30") into total minutes since midnight.
 * Returns null for empty or unrecognised input.
 */
export function parseTimeMinutes(timeStr) {
  if (!timeStr) return null
  const trimmed = timeStr.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return null
  let h = parseInt(match[1])
  const m = parseInt(match[2])
  const period = match[3]?.toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h * 60 + m
}

/**
 * Formats a minutes-since-midnight value into a display string ("9:00am", "2:30pm").
 */
export function formatMinutes(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  const period = h >= 12 ? 'pm' : 'am'
  const displayH = h > 12 ? h - 12 : h || 12
  return `${displayH}:${String(m).padStart(2, '0')}${period}`
}

/**
 * Parses a time string and formats it for display.
 * Returns the original string (or '') when parsing fails.
 */
export function formatTime(timeStr) {
  const m = parseTimeMinutes(timeStr)
  return m === null ? (timeStr ?? '') : formatMinutes(m)
}

export function formatTimeRange(start, end) {
  if (!start) return ''
  const stripZero = (t) => t.replace(/^0(\d)/, '$1')
  const s = stripZero(start)
  if (!end) return s
  const e = stripZero(end)
  const startAMPM = /AM$/i.test(start.trim()) ? 'AM' : /PM$/i.test(start.trim()) ? 'PM' : null
  const endAMPM = /AM$/i.test(end.trim()) ? 'AM' : /PM$/i.test(end.trim()) ? 'PM' : null
  if (startAMPM && endAMPM && startAMPM === endAMPM) {
    return `${s.replace(/\s*(AM|PM)$/i, '').trim()}–${e}`
  }
  return `${s}–${e}`
}

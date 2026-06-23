function parseRegDate(dateStr) {
  const [datePart, timePart = '00:00'] = dateStr.split(' ')
  const [month, day, year] = datePart.split('/').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

function regExpired(sec, now = new Date()) {
  if (!sec.regEndDate) return false
  const deadline = parseRegDate(sec.regEndDate)
  if (isNaN(deadline.getTime())) return false
  if (sec.SectionLoc === '320') {
    return deadline < new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  }
  return deadline < now
}

export function isActionable(sec) {
  const canRegister = (sec.status === 'Open') || (sec.waitListAllowed === 'Y' && sec.status !== 'Cancelled')
  return canRegister && !regExpired(sec) && !sec.isFuture
}

export function seatBadge(s) {
  if (s.status === 'Cancelled') return { cls: 'bg-gray-100 text-gray-500', label: 'Cancelled' }
  if (s.status === 'Closed') {
    return s.waitListAllowed === 'Y'
      ? { cls: 'bg-amber-100 text-amber-800', label: 'Waitlist Available' }
      : { cls: 'bg-red-100 text-red-700', label: 'Closed' }
  }
  if (regExpired(s)) return { cls: 'bg-gray-100 text-gray-500', label: 'Registration Closed' }
  if (s.openSeats > 0) return { cls: 'bg-green-100 text-green-800', label: `Open · ${Math.floor(s.openSeats)} seats` }
  return { cls: '', label: '' }
}

export function statusBadgeClass(status) {
  if (status === 'Open') return 'bg-green-100 text-green-800'
  if (status === 'Waitlist') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

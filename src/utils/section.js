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

export const SECTION_LOC_LABELS = {
  '110': 'Centerville Campus', '329': 'Centerville Campus',
  '310': 'Huber Heights Learning Center', '328': 'Huber Heights Learning Center',
  '300': 'Englewood Learning Center', '327': 'Englewood Learning Center',
  '210': 'Preble County Learning Center',
  '200': 'Courseview Campus Center (Mason)', '326': 'Courseview Campus Center (Mason)',
  '330': 'Other Off Campus Location', 'OFF': 'Other Off Campus Location',
}

export function stripZzz(val) {
  return (val || '').replace(/zzz$/i, '').trim()
}

export function sectionRoom(sec) {
  return sec.satLocation ? stripZzz(sec.satLocation) : stripZzz(sec.building)
}

export function sectionLocation(sec) {
  if (sec.isFlexpace) return 'FlexPace'
  if (sec.SectionLoc === '320') return 'Online Learning'
  if (sec.SectionLoc === '321' || sec.SectionLoc === '345') return 'Online Learning with Meeting Times'
  const room = sectionRoom(sec)
  if (room === 'RMT' || room === 'VIR') return 'Blended Learning'
  const campus = SECTION_LOC_LABELS[sec.SectionLoc]
  if (campus) return room ? `${campus} · ${room}` : campus
  return room ? `Downtown Dayton Campus · ${room}` : 'Downtown Dayton Campus'
}

const DAY_ORDER = ['M', 'T', 'W', 'R', 'F', 'S', 'U']

export function summarizeSchedule(sections) {
  const daySet = new Set()
  let hasOnline = false
  let totalCredits = 0
  const termSet = new Set()
  const locSet = new Set()

  for (const s of sections) {
    if (!s.days || s.days.length === 0) {
      hasOnline = true
    } else {
      for (const d of s.days) daySet.add(d)
    }
    totalCredits += s.creditHours ?? 0
    if (s.termFormat != null) termSet.add(s.termFormat)
    if (s.building != null) locSet.add(s.building)
  }

  const days = DAY_ORDER.filter((d) => daySet.has(d))

  const collapse = (set) => {
    const arr = [...set]
    return arr.length >= 3 ? ['Multiple'] : arr
  }

  return {
    days,
    hasOnline,
    totalCredits,
    termTypes: collapse(termSet),
    locations: collapse(locSet),
  }
}

export function gridRange(sections) {
  let minMin = Infinity
  let maxMin = -Infinity
  for (const s of sections) {
    if (s.startMin != null && s.endMin != null) {
      if (s.startMin < minMin) minMin = s.startMin
      if (s.endMin > maxMin) maxMin = s.endMin
    }
  }
  if (minMin === Infinity) return { minMin: 480, maxMin: 1320 }
  return { minMin, maxMin }
}

export function sortByCampusDays(schedules) {
  const score = (schedule) => {
    const days = new Set()
    for (const s of schedule) {
      if (s.days && s.days.length > 0) {
        for (const d of s.days) days.add(d)
      }
    }
    return days.size
  }
  return [...schedules].sort((a, b) => score(a) - score(b))
}

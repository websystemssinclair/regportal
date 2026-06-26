export function conflicts(a, b) {
  if (a.startMin === null || b.startMin === null) return false
  if (!a.days.some((d) => b.days.includes(d))) return false
  return a.startMin < b.endMin && b.startMin < a.endMin
}

export function conflictsWithAny(section, placed) {
  return placed.some((p) => conflicts(section, p))
}

const CVCC_ALIASES = ['KHS', 'VOA', 'VALC', 'AMC', 'WCCC', 'WCCS', 'GHSA']

export function matchesLocation(sec, _location) {
  if (!_location || _location === 'any') return true
  const location = sec.location ?? ''
  if (_location === 'SCC') return !location
  if (_location === 'CvCC') {
    return location.startsWith('CvCC') || location.startsWith('CV') || CVCC_ALIASES.includes(location)
  }
  return location.startsWith(_location)
}

export function applyFilters(sections, filters) {
  return sections.filter((sec) => {
    if (sec.startMin !== null) {
      if (sec.startMin < filters.rangeStart || sec.endMin > filters.rangeEnd) return false
    }
    if (sec.days.length > 0) {
      if (!sec.days.every((d) => filters.days.includes(d))) return false
    }
    if (filters.termFormat && filters.termFormat !== 'all') {
      if (filters.termFormat === 'ST') {
        if (sec.termFormat === 'Full') return false
      } else {
        if (sec.termFormat !== filters.termFormat) return false
      }
    }
    if (!matchesLocation(sec, filters.location)) return false
    return true
  })
}

export function buildSchedules(allCourseSections, filters, max = 50) {
  if (!allCourseSections.length) return []
  const results = []

  function bt(courseIdx, partial) {
    if (results.length >= max) return
    if (courseIdx === allCourseSections.length) {
      results.push([...partial])
      return
    }
    for (const section of applyFilters(allCourseSections[courseIdx], filters)) {
      if (!conflictsWithAny(section, partial)) {
        partial.push(section)
        bt(courseIdx + 1, partial)
        partial.pop()
      }
    }
  }

  bt(0, [])
  return results
}

self.onmessage = function ({ data }) {
  if (data.type !== 'build') return
  try {
    const schedules = buildSchedules(data.courses, data.filters)
    self.postMessage({ type: 'result', schedules })
  } catch (e) {
    self.postMessage({ type: 'error', message: e.message })
  }
}

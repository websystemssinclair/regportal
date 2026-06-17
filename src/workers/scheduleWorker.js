export function conflicts(a, b) {
  if (a.startMin === null || b.startMin === null) return false
  if (!a.days.some((d) => b.days.includes(d))) return false
  return a.startMin < b.endMin && b.startMin < a.endMin
}

export function conflictsWithAny(section, placed) {
  return placed.some((p) => conflicts(section, p))
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
      if (sec.termFormat !== filters.termFormat) return false
    }
    if (filters.building && filters.building !== 'any') {
      if (sec.building !== filters.building) return false
    }
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

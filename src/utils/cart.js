function sortSections(arr) {
  return [...arr].sort((a, b) => {
    const keyA = (a.SubjectCode ?? '').trim() + (a.CourseNo ?? '').trim()
    const keyB = (b.SubjectCode ?? '').trim() + (b.CourseNo ?? '').trim()
    return keyA < keyB ? -1 : keyA > keyB ? 1 : 0
  })
}

/**
 * Groups cart sections into current and future buckets using term metadata.
 *
 * @param {object[]} sections - Raw cart sections (each has a `Term` field).
 * @param {object[]} terms    - Term records from the reference store ({ id, toView }).
 * @returns {{ current: { termId, sections }[], future: { termId, sections }[] }}
 */
export function groupSectionsByTerm(sections, terms) {
  const termMap = Object.fromEntries(terms.map((t) => [t.id, t]))

  const current = {}
  const future = {}

  for (const sec of sections) {
    const term = termMap[sec.Term]
    const toView = term?.toView ?? 'Y'
    const bucket = toView === 'F' ? future : current
    if (!bucket[sec.Term]) bucket[sec.Term] = []
    bucket[sec.Term].push(sec)
  }

  return {
    current: Object.entries(current).map(([termId, secs]) => ({ termId, sections: sortSections(secs) })),
    future: Object.entries(future).map(([termId, secs]) => ({ termId, sections: sortSections(secs) })),
  }
}

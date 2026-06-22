import { ref } from 'vue'
import { getCourseSections, getCourseDetails } from '@/services/sectionsService'

export function useCardExpansion(filters) {
  const expanded = ref(null)
  const sectionsByCard = ref({})
  const detailsByCard = ref({})
  const loadingCard = ref(null)
  const sectionErrors = ref({})
  const visibleSections = ref({})
  let generation = 0

  async function toggleCard(course) {
    if (expanded.value === course.id) { expanded.value = null; return }
    expanded.value = course.id
    if (sectionsByCard.value[course.id]) return
    loadingCard.value = course.id
    const myGen = generation
    try {
      const subject = (course.SubjectCode ?? '').trim()
      const number = (course.CourseNumber ?? '').trim()
      const term = course.Term
      const [sectionsResult, detailsResult] = await Promise.allSettled([
        getCourseSections(subject, number, term, {
          building: filters.building,
          daysOfWeek: filters.daysOfWeek,
          timeChoice: filters.timeChoice,
          segOptions: filters.segOptions,
          rangeStart: filters.rangeStart,
          rangeEnd: filters.rangeEnd,
          creditHoursMin: filters.creditHoursMin,
          creditHoursMax: filters.creditHoursMax,
          termFormat: filters.termFormat,
        }),
        getCourseDetails(subject, number, term),
      ])
      if (generation !== myGen) return
      if (sectionsResult.status === 'rejected') throw sectionsResult.reason
      sectionsByCard.value[course.id] = sectionsResult.value.data.rows ?? []
      if (detailsResult.status === 'fulfilled') {
        detailsByCard.value[course.id] = detailsResult.value.data
      }
      delete sectionErrors.value[course.id]
    } catch {
      if (generation === myGen) sectionErrors.value[course.id] = true
    } finally {
      if (generation === myGen && loadingCard.value === course.id) loadingCard.value = null
    }
  }

  function showAllSections(id) { visibleSections.value[id] = true }

  function sectionsToShow(id) {
    const now = new Date()
    function isExpired(sec) {
      if (!sec.regEndDate) return false
      const [datePart, timePart = '00:00'] = sec.regEndDate.split(' ')
      const [m, d, y] = datePart.split('/').map(Number)
      const [h, min] = timePart.split(':').map(Number)
      const deadline = new Date(y, m - 1, d, h, min)
      if (isNaN(deadline.getTime())) return false
      return sec.SectionLoc === '320'
        ? deadline < new Date(now - 2 * 86400000)
        : deadline < now
    }
    const all = [...(sectionsByCard.value[id] ?? [])].sort((a, b) => {
      const expA = isExpired(a), expB = isExpired(b)
      if (expA !== expB) return expA - expB
      return (b.status === 'Open') - (a.status === 'Open')
    })
    return visibleSections.value[id] ? all : all.slice(0, 20)
  }

  function reset() {
    generation++
    expanded.value = null
    sectionsByCard.value = {}
    detailsByCard.value = {}
    loadingCard.value = null
    sectionErrors.value = {}
    visibleSections.value = {}
  }

  return {
    expanded,
    sectionsByCard,
    detailsByCard,
    loadingCard,
    sectionErrors,
    visibleSections,
    toggleCard,
    showAllSections,
    sectionsToShow,
    reset,
  }
}

import { ref, reactive } from 'vue'
import { searchCourses } from '@/services/sectionsService'

export function useSearch() {
  const results = ref([])
  const total = ref(0)
  const isLoading = ref(false)
  const error = ref(null)

  const filters = reactive({
    keyword: '',
    term: '',
    subjectCode: 'ANY',
    termFormat: 'all',
    building: 'any',
    timeChoice: 'segments',
    segOptions: 'any',
    rangeStart: '06:00',
    rangeEnd: '23:00',
    daysOfWeek: 'M,T,W,R,F,S,U',
    creditHoursMin: 0,
    creditHoursMax: 15,
    courseList: 'any',
    page: 1,
    start: 0,
    limit: 50,
  })

  let fetchGen = 0

  async function fetch() {
    const myGen = ++fetchGen
    isLoading.value = true
    error.value = null
    try {
      const { data } = await searchCourses(filters)
      if (fetchGen !== myGen) return
      results.value = data.rows ?? []
      total.value = data.results
    } catch (e) {
      if (fetchGen !== myGen) return
      error.value = e
      results.value = []
      total.value = 0
    } finally {
      if (fetchGen === myGen) isLoading.value = false
    }
  }

  return { filters, results, total, isLoading, error, fetch }
}

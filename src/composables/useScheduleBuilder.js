import { ref, computed, onUnmounted } from 'vue'
import { useCartStore } from '@/stores/cart'

function parseTimeMinutes(timeStr) {
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

function normalizeSection(sec) {
  return {
    id: sec.CourseKey,
    days: (sec.Days ?? '').split('').filter(Boolean),
    startMin: parseTimeMinutes(sec.StartTime),
    endMin: parseTimeMinutes(sec.EndTime),
    termFormat: sec.TermFormat ?? sec.termFormat ?? null,
    building: sec.Building ?? sec.building ?? null,
    creditHours: sec.CreditHours,
    subjectCode: (sec.SubjectCode ?? '').trim(),
    courseNo: (sec.CourseNo ?? '').trim(),
    longName: sec.LongName,
    faculty: sec.Faculty,
  }
}

export function useScheduleBuilder() {
  const schedules = ref([])
  const isBuilding = ref(false)
  const error = ref(null)
  const count = computed(() => schedules.value.length)

  const _sectionCache = new Map()
  let _worker = null

  function build(coursesWithSections, filters) {
    _sectionCache.clear()
    for (const course of coursesWithSections) {
      for (const sec of course.rawSections) {
        _sectionCache.set(String(sec.CourseKey), sec)
      }
    }

    const allCourseSections = coursesWithSections.map((c) =>
      c.rawSections.map(normalizeSection),
    )

    if (_worker) _worker.terminate()
    _worker = new Worker(
      new URL('../workers/scheduleWorker.js', import.meta.url),
      { type: 'module' },
    )

    isBuilding.value = true
    error.value = null

    _worker.onmessage = ({ data }) => {
      isBuilding.value = false
      if (data.type === 'result') schedules.value = data.schedules
      else if (data.type === 'error') error.value = data.message
    }

    _worker.onerror = (e) => {
      isBuilding.value = false
      error.value = e.message ?? 'Worker error'
    }

    _worker.postMessage({ type: 'build', courses: allCourseSections, filters })
  }

  function selectSchedule(schedule) {
    const cartStore = useCartStore()
    for (const normalizedSec of schedule) {
      const raw = _sectionCache.get(String(normalizedSec.id))
      if (raw) cartStore.add(raw)
    }
  }

  onUnmounted(() => {
    if (_worker) _worker.terminate()
  })

  return { schedules, isBuilding, error, count, build, selectSchedule }
}

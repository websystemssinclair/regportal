import { ref, reactive, computed, onUnmounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { getAvailability } from '@/services/sectionsService'
import { registerSections } from '@/services/registrationService'

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

  const scheduleResults = reactive({})
  const registeringSchedules = reactive(new Set())

  const _sectionCache = new Map()
  let _worker = null
  let _buildGen = 0

  function build(coursesWithSections, filters) {
    _buildGen++
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
      if (data.type === 'result') {
        for (const key in scheduleResults) delete scheduleResults[key]
        schedules.value = data.schedules
      } else if (data.type === 'error') {
        error.value = data.message
      }
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

  async function registerSchedule(schedule, scheduleIndex) {
    const authStore = useAuthStore()
    const gen = _buildGen
    registeringSchedules.add(scheduleIndex)

    try {
      const courseKeys = schedule.map((s) => s.id)
      let availabilityMap = {}

      try {
        const { data } = await getAvailability(courseKeys.join(','))
        for (const row of data.rows ?? []) {
          availabilityMap[String(row.CourseKey)] = row.Status
        }
      } catch {
        if (gen === _buildGen) {
          scheduleResults[scheduleIndex] = { _error: 'Could not check seat availability. Please try again.' }
        }
        return
      }

      if (gen !== _buildGen) return

      const missingKey = schedule.find((sec) => !(String(sec.id) in availabilityMap))
      if (missingKey) {
        scheduleResults[scheduleIndex] = { _error: 'Could not check seat availability. Please try again.' }
        return
      }

      if (!authStore.user) {
        scheduleResults[scheduleIndex] = { _error: 'Registration failed. Please try again.' }
        return
      }

      const registrations = schedule.map((sec) => ({
        sectionId: sec.id,
        action: availabilityMap[String(sec.id)] === 'Open' ? 'add' : 'waitlist',
      }))

      const payload = {
        token: authStore.colleagueToken,
        studentId: parseInt(authStore.user.tartanId),
        username: authStore.user.username,
        password: '',
        sections: registrations.map(({ sectionId, action }) => {
          const raw = _sectionCache.get(String(sectionId))
          return { SectionId: sectionId, Action: action, Credits: raw?.CreditHours ?? 0 }
        }),
      }

      const { data } = await registerSections(payload)
      if (gen !== _buildGen) return

      const errors = data.rows?.[0]?.errors ?? []
      const failedMap = {}
      for (const err of errors) {
        failedMap[String(err.CourseKey)] = err.Message
      }

      const result = {}
      for (const sec of schedule) {
        const key = String(sec.id)
        if (failedMap[key]) {
          result[key] = { status: 'error', message: failedMap[key] }
        } else {
          const action = registrations.find((r) => String(r.sectionId) === key)?.action
          result[key] = {
            status: action === 'waitlist' ? 'waitlisted' : 'registered',
            message: action === 'waitlist' ? 'Waitlisted' : 'Registered',
          }
        }
      }
      scheduleResults[scheduleIndex] = result
    } catch {
      if (gen === _buildGen) {
        scheduleResults[scheduleIndex] = { _error: 'Registration failed. Please try again.' }
      }
    } finally {
      registeringSchedules.delete(scheduleIndex)
    }
  }

  onUnmounted(() => {
    if (_worker) _worker.terminate()
  })

  return { schedules, isBuilding, error, count, build, selectSchedule, scheduleResults, registeringSchedules, registerSchedule }
}

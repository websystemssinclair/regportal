<template>
  <div class="min-h-screen bg-canvas">

    <div class="mx-auto max-w-6xl px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Schedule Builder</h1>
        <span class="text-sm text-gray-500">{{ selectedTermName }}</span>
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

        <!-- Left panel: course input + filters -->
        <div class="space-y-4">

          <!-- Course typeahead -->
          <div>
            <label class="mb-1 block text-sm font-semibold text-gray-700">Add Courses</label>
            <div class="relative">
              <input
                data-testid="course-search-input"
                v-model="searchQuery"
                @input="onSearchInput"
                @focus="showDropdown = true"
                @blur="onSearchBlur"
                type="text"
                placeholder="Search by subject or keyword…"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-crimson focus:outline-none"
              />
              <ul
                v-if="showDropdown && searchResults.length"
                class="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
              >
                <li
                  v-for="course in searchResults"
                  :key="course.id ?? (course.SubjectCode + course.CourseNumber)"
                  class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                  @mousedown.prevent="addCourse(course)"
                >
                  {{ course.SubjectCode?.trim() }}-{{ course.CourseNumber }} — {{ course.LongName }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Selected course chips -->
          <div v-if="selectedCourses.length" class="flex flex-wrap gap-2">
            <span
              v-for="(course, idx) in selectedCourses"
              :key="idx"
              data-testid="course-chip"
              class="flex items-center gap-1.5 rounded-full bg-crimson px-3 py-1 text-xs font-medium text-white"
            >
              {{ course.subjectCode }}-{{ course.courseNo }}
              <button
                @click="removeCourse(idx)"
                class="ml-0.5 rounded-full hover:text-white/70"
                :aria-label="`Remove ${course.subjectCode}-${course.courseNo}`"
              >&times;</button>
            </span>
            <button
              data-testid="clear-builder-btn"
              @click="clearAllCourses"
              class="self-center text-xs text-gray-500 underline hover:text-gray-700"
            >Clear all</button>
          </div>

          <!-- Soft-cap warning -->
          <!-- TODO: confirm copy with product -->
          <p
            v-if="selectedCourses.length > 7"
            data-testid="soft-cap-warning"
            class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            Adding more than 7 courses may significantly increase build time and reduce the number of valid schedules found.
          </p>

          <!-- Filters -->
          <div class="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <h2 class="text-sm font-semibold text-gray-700">Filters</h2>

            <!-- Term selector -->
            <div v-if="registrationTerms.length > 1">
              <label class="mb-1 block text-xs font-medium text-gray-500">Term</label>
              <select
                data-testid="term-selector"
                v-model="selectedTermId"
                aria-label="Select term"
                class="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
              >
                <option
                  v-for="term in sortedRegistrationTerms"
                  :key="term.id"
                  :value="term.id"
                >{{ term.termName }}{{ term.toView === 'F' ? ' (Future)' : '' }}</option>
              </select>
            </div>

            <!-- Time range presets -->
            <div>
              <p class="mb-1.5 text-xs font-medium text-gray-500">Time of Day</p>
              <div class="flex gap-2">
                <button
                  v-for="preset in TIME_PRESETS"
                  :key="preset.label"
                  @click="applyPreset(preset)"
                  :aria-pressed="isActivePreset(preset)"
                  class="rounded-md border border-gray-200 px-2 py-1 touch:py-3.5 touch:px-4 text-xs hover:bg-gray-50"
                  :class="isActivePreset(preset) ? 'border-crimson bg-crimson/5 text-crimson font-semibold' : 'text-gray-600'"
                >{{ preset.label }}</button>
              </div>
            </div>

            <!-- Time range slider -->
            <div>
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{{ formatMinutes(filters.rangeStart) }}</span>
                <span>{{ formatMinutes(filters.rangeEnd) }}</span>
              </div>
              <div class="space-y-1">
                <input
                  type="range"
                  v-model.number="filters.rangeStart"
                  :min="360"
                  :max="1380"
                  :step="30"
                  aria-label="Earliest start time"
                  class="w-full accent-crimson"
                />
                <input
                  type="range"
                  v-model.number="filters.rangeEnd"
                  :min="360"
                  :max="1380"
                  :step="30"
                  aria-label="Latest end time"
                  class="w-full accent-crimson"
                />
              </div>
            </div>

            <!-- Day checkboxes -->
            <div>
              <p class="mb-1.5 text-xs font-medium text-gray-500">Days</p>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="day in ALL_DAYS"
                  :key="day.value"
                  class="flex cursor-pointer items-center gap-1 text-xs"
                >
                  <input
                    type="checkbox"
                    :value="day.value"
                    v-model="filters.days"
                    class="accent-crimson"
                  />
                  {{ day.label }}
                </label>
              </div>
            </div>

            <!-- Location -->
            <div v-if="locations.length">
              <label class="mb-1 block text-xs font-medium text-gray-500">Location</label>
              <select
                data-testid="location-filter"
                v-model="filters.location"
                class="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
              >
                <option
                  v-for="loc in locations"
                  :key="loc.id"
                  :value="loc.id"
                >{{ loc.building }}</option>
              </select>
            </div>

            <!-- Term Part -->
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">Term Part</label>
              <select v-model="filters.termFormat" class="w-full rounded-md border border-gray-200 px-2 py-1 text-sm">
                <option v-for="o in TERM_FORMAT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
          </div>

          <!-- Build button -->
          <button
            data-testid="build-button"
            @click="triggerBuild"
            :disabled="!selectedCourses.length || !resolvedTermId"
            class="w-full rounded-xl bg-crimson px-4 py-3 text-sm font-semibold text-white transition hover:bg-crimson-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isBuilding ? 'Building…' : 'Build Schedules' }}
          </button>

          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        </div>

        <!-- Right panel: results -->
        <div>
          <p v-if="!hasBuilt" class="py-12 text-center text-sm text-gray-500">
            Add courses and click Build Schedules to see options.
          </p>

          <p v-else-if="isBuilding" class="py-12 text-center text-sm text-gray-500">
            Building schedules…
          </p>

          <p v-else-if="!schedules.length" class="py-12 text-center text-sm text-gray-500">
            No conflict-free schedules found. Try adjusting your filters or courses.
          </p>

          <div v-else>
            <p class="mb-4 text-sm text-gray-500">{{ count }} schedule{{ count === 1 ? '' : 's' }} found</p>
            <div class="grid grid-cols-1 gap-4">
              <div
                v-for="schedule in sortedSchedules"
                :key="scheduleKey(schedule)"
                data-testid="schedule-card"
                class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <!-- Summary line -->
                <p data-testid="schedule-summary" class="mb-2 text-xs text-gray-600">{{ summaryFor(schedule) }}</p>

                <!-- Two-column layout: mini-grid left, detail panel right -->
                <div class="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <!-- Left: mini-grid -->
                  <div class="flex gap-px overflow-hidden rounded border border-gray-100 bg-gray-100" style="height: 120px">
                    <div
                      v-for="day in GRID_DAYS"
                      :key="day"
                      class="relative flex flex-1 flex-col bg-white"
                    >
                      <div class="flex-shrink-0 py-0.5 text-center text-[9px] font-medium text-gray-500">{{ day }}</div>
                      <div class="relative flex-1">
                        <div
                          v-for="sec in blocksForDay(schedule, day)"
                          :key="sec.id"
                          class="absolute left-0.5 right-0.5 overflow-hidden rounded bg-crimson px-0.5 text-[8px] text-white"
                          :style="blockStyle(sec)"
                        >{{ sec.subjectCode }}-{{ sec.courseNo }}</div>
                      </div>
                    </div>
                  </div>
                  <!-- Right: section detail rows -->
                  <div class="overflow-x-auto">
                    <table class="min-w-full text-[11px] text-gray-700">
                      <tbody class="divide-y divide-gray-50">
                        <tr
                          v-for="sec in schedule"
                          :key="sec.id"
                          data-testid="schedule-section-row"
                        >
                          <td class="py-0.5 pr-2 font-mono whitespace-nowrap font-medium text-gray-900">{{ sec.subjectCode }}-{{ sec.courseNo }}-{{ sec.sectionNo }}</td>
                          <td class="py-0.5 pr-2 truncate max-w-[120px]">{{ sec.longName }}</td>
                          <td class="py-0.5 pr-2 whitespace-nowrap">{{ sectionDaysTime(sec) }}</td>
                          <td class="py-0.5 pr-2 whitespace-nowrap">{{ isOnlineSection(sec) ? '—' : (sec.building ?? '—') }}</td>
                          <td class="py-0.5 whitespace-nowrap">{{ sec.faculty }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  data-testid="select-schedule-btn"
                  @click="onSelectSchedule(schedule)"
                  class="w-full rounded-lg bg-crimson px-3 py-1.5 touch:py-3.5 text-xs font-semibold text-white hover:bg-crimson-dark"
                >
                  Select Schedule
                </button>

                <!-- Register Now — Students only -->
                <div v-if="authStore.isStudent" class="mt-2">
                  <p
                    v-if="scheduleResults[scheduleKey(schedule)]?._error"
                    data-testid="register-card-error"
                    class="mb-1 text-xs text-red-600"
                  >{{ scheduleResults[scheduleKey(schedule)]._error }}</p>

                  <ul v-else-if="scheduleResults[scheduleKey(schedule)]" class="mb-2 space-y-0.5">
                    <li
                      v-for="sec in schedule"
                      :key="sec.id"
                      data-testid="register-section-result"
                      class="text-[11px]"
                    >
                      {{ sec.subjectCode }}-{{ sec.courseNo }} —
                      <span :class="scheduleResults[scheduleKey(schedule)][String(sec.id)]?.status === 'error' ? 'text-red-600' : 'text-green-700'">
                        {{ scheduleResults[scheduleKey(schedule)][String(sec.id)]?.message }}
                      </span>
                    </li>
                  </ul>

                  <button
                    v-if="!scheduleResults[scheduleKey(schedule)] || scheduleResults[scheduleKey(schedule)]._error"
                    data-testid="register-now-btn"
                    @click="onRegisterSchedule(schedule, scheduleKey(schedule))"
                    :disabled="registeringSchedules.has(scheduleKey(schedule))"
                    class="w-full rounded-lg border border-crimson bg-white px-3 py-1.5 touch:py-3.5 text-xs font-semibold text-crimson hover:bg-crimson hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  >
                    {{ registeringSchedules.has(scheduleKey(schedule)) ? 'Registering…' : 'Register Now' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useReferenceStore } from '@/stores/reference'
import { useAuthStore } from '@/stores/auth'
import { searchCourses, getCourseSections } from '@/services/sectionsService'
import { useScheduleBuilder } from '@/composables/useScheduleBuilder'
import { useRegisterSchedule } from '@/composables/useRegisterSchedule'
import { useBuilderCourses } from '@/composables/useBuilderCourses'
import router from '@/router'
import { formatMinutes, formatDays, formatTimeRange } from '@/utils/time'
import { sortByCampusDays, summarizeSchedule } from '@/utils/schedule'

const GRID_DAYS = ['M', 'T', 'W', 'R', 'F']
const GRID_START = 360   // 6am
const GRID_SPAN = 900    // 15 hours (6am-9pm)

const TIME_PRESETS = [
  { label: 'Mornings', start: 360, end: 720 },
  { label: 'Afternoons', start: 720, end: 1020 },
  { label: 'Evenings', start: 1020, end: 1380 },
]

const ALL_DAYS = [
  { value: 'M', label: 'Mon' },
  { value: 'T', label: 'Tue' },
  { value: 'W', label: 'Wed' },
  { value: 'R', label: 'Thu' },
  { value: 'F', label: 'Fri' },
]

const TERM_FORMAT_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Full', label: 'Full Term' },
  { value: 'A', label: 'A Term' },
  { value: 'B', label: 'B Term' },
  { value: '12', label: '12 Week' },
  { value: 'ST', label: 'All Short Term' },
]

    const referenceStore = useReferenceStore()
    const authStore = useAuthStore()
    const { schedules, isBuilding, error, count, build, selectSchedule, getCredits } = useScheduleBuilder()
    const { scheduleResults, registeringSchedules, registerSchedule, reset: resetRegistration } = useRegisterSchedule()

    const sortedSchedules = computed(() => sortByCampusDays(schedules.value))

    function summaryFor(schedule) {
      const { days, hasOnline, totalCredits, termTypes, locations } = summarizeSchedule(schedule)
      const daysStr = days.length
        ? days.join('') + (hasOnline ? ' + Online' : '')
        : hasOnline ? 'Online' : ''
      const creditsStr = totalCredits + ' cr'
      const termStr = termTypes.join(' · ')
      const locStr = locations.join(' · ')
      return [daysStr, creditsStr, termStr, locStr].filter(Boolean).join(' · ')
    }
    const builderCourses = useBuilderCourses()
    const locations = computed(() => referenceStore.locations)

    const registrationTerms = computed(() =>
      referenceStore.terms.filter((t) => t.toView === 'D' || t.toView === 'Y' || t.toView === 'F'),
    )
    const defaultTermId = computed(() => {
      const d = registrationTerms.value.find((t) => t.toView === 'D')
      return (d ?? registrationTerms.value[0])?.id ?? null
    })
    const selectedTermId = ref(null)
    watch(defaultTermId, (id) => {
      if (!selectedTermId.value && id) selectedTermId.value = id
    }, { immediate: true })
    const resolvedTermId = computed(() => selectedTermId.value ?? defaultTermId.value)

    const sortedRegistrationTerms = computed(() => {
      const order = { D: 0, Y: 1, F: 2 }
      return [...registrationTerms.value].sort((a, b) => (order[a.toView] ?? 3) - (order[b.toView] ?? 3))
    })

    const selectedTermName = computed(() =>
      registrationTerms.value.find((t) => t.id === resolvedTermId.value)?.termName ?? '',
    )

    const selectedCourses = ref([])
    const searchQuery = ref('')
    const searchResults = ref([])
    const showDropdown = ref(false)
    let searchDebounce = null

    const filters = reactive({
      rangeStart: 480,
      rangeEnd: 1320,
      days: ['M', 'T', 'W', 'R', 'F'],
      termFormat: 'all',
      location: 'any',
    })

    const hasBuilt = ref(false)

    function triggerBuild() {
      hasBuilt.value = true
      resetRegistration()
      build(selectedCourses.value, { ...filters })
    }

    watch(filters, () => {
      if (hasBuilt.value && selectedCourses.value.length > 0) {
        resetRegistration()
        build(selectedCourses.value, { ...filters })
      }
    }, { deep: true })

    watch(resolvedTermId, async (newTerm) => {
      if (!newTerm || !selectedCourses.value.length) return
      await Promise.all(selectedCourses.value.map(async (course, idx) => {
        const { data } = await getCourseSections(course.subjectCode, course.courseNo, newTerm)
        selectedCourses.value[idx].rawSections = data.rows ?? []
      }))
    })

    async function onSearchInput() {
      clearTimeout(searchDebounce)
      if (!searchQuery.value.trim()) { searchResults.value = []; return }
      searchDebounce = setTimeout(async () => {
        try {
          const { data } = await searchCourses({
            keyword: searchQuery.value,
            term: resolvedTermId.value,
            limit: 20,
          })
          searchResults.value = data.rows ?? []
        } catch {
          searchResults.value = []
        }
      }, 250)
    }

    function onSearchBlur() {
      setTimeout(() => { showDropdown.value = false }, 150)
    }

    async function addCourse(course) {
      const subjectCode = (course.SubjectCode ?? '').trim()
      const courseNo = course.CourseNumber ?? course.CourseNo ?? ''
      const alreadyAdded = selectedCourses.value.some(
        (c) => c.subjectCode === subjectCode && c.courseNo === courseNo,
      )
      if (alreadyAdded) { showDropdown.value = false; searchQuery.value = ''; return }

      let rawSections = []
      if (resolvedTermId.value) {
        try {
          const { data } = await getCourseSections(subjectCode, courseNo, resolvedTermId.value)
          rawSections = data.rows ?? []
        } catch {
          rawSections = []
        }
      }

      selectedCourses.value.push({
        subjectCode,
        courseNo,
        longName: course.LongName ?? '',
        rawSections,
      })

      searchQuery.value = ''
      showDropdown.value = false
      searchResults.value = []
    }

    function removeCourse(idx) {
      const course = selectedCourses.value[idx]
      builderCourses.remove(`${course.subjectCode}-${course.courseNo}`)
      selectedCourses.value.splice(idx, 1)
    }

    function clearAllCourses() {
      builderCourses.clear()
      selectedCourses.value = []
    }

    function applyPreset(preset) {
      filters.rangeStart = preset.start
      filters.rangeEnd = preset.end
    }

    function isActivePreset(preset) {
      return filters.rangeStart === preset.start && filters.rangeEnd === preset.end
    }

    function isOnlineSection(sec) {
      return sec.days.length === 0 || sec.startMin === null
    }

    function sectionDaysTime(sec) {
      if (isOnlineSection(sec)) return 'Online'
      const days = formatDays(sec.days.join(''))
      const time = formatTimeRange(formatMinutes(sec.startMin), formatMinutes(sec.endMin))
      return `${days} ${time}`.trim()
    }

    function blocksForDay(schedule, day) {
      return schedule.filter((s) => s.days.includes(day) && s.startMin !== null)
    }

    function blockStyle(sec) {
      const top = Math.max(0, ((sec.startMin - GRID_START) / GRID_SPAN) * 100)
      const height = Math.max(4, ((sec.endMin - sec.startMin) / GRID_SPAN) * 100)
      return { top: `${top}%`, height: `${height}%` }
    }

    function onSelectSchedule(schedule) {
      selectSchedule(schedule)
      router.push('/cart')
    }

    function scheduleKey(schedule) {
      return schedule.map((s) => s.id).sort().join('|')
    }

    function onRegisterSchedule(schedule, key) {
      registerSchedule(schedule, key, getCredits)
    }

    onMounted(async () => {
      for (const code of builderCourses.codes.value) {
        const dashIdx = code.indexOf('-')
        if (dashIdx < 1) continue
        const subject = code.slice(0, dashIdx)
        const number = code.slice(dashIdx + 1)
        await addCourse({ SubjectCode: subject, CourseNumber: number, LongName: code })
      }
    })

</script>

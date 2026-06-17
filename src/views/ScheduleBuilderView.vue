<template>
  <div class="min-h-screen bg-gray-50">

    <div class="bg-[#ac1a2f] px-4 py-5">
      <div class="mx-auto flex max-w-6xl items-center gap-4">
        <h1 class="text-xl font-bold text-white">Schedule Builder</h1>
        <select
          v-if="registrationTerms.length > 1"
          data-testid="term-selector"
          v-model="selectedTermId"
          class="ml-auto rounded border-0 bg-white/20 px-3 py-1 text-sm text-white"
        >
          <option
            v-for="term in registrationTerms"
            :key="term.id"
            :value="term.id"
            class="text-gray-900"
          >{{ term.termName }}</option>
        </select>
        <span v-else-if="registrationTerms.length === 1" class="ml-auto text-sm text-white/80">
          {{ registrationTerms[0].termName }}
        </span>
      </div>
    </div>

    <div class="mx-auto max-w-6xl px-4 py-6">
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
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#ac1a2f] focus:outline-none"
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
              class="flex items-center gap-1.5 rounded-full bg-[#ac1a2f] px-3 py-1 text-xs font-medium text-white"
            >
              {{ course.subjectCode }}-{{ course.courseNo }}
              <button
                @click="removeCourse(idx)"
                class="ml-0.5 rounded-full hover:text-white/70"
                aria-label="Remove course"
              >&times;</button>
            </span>
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

            <!-- Time range presets -->
            <div>
              <p class="mb-1.5 text-xs font-medium text-gray-500">Time of Day</p>
              <div class="flex gap-2">
                <button
                  v-for="preset in TIME_PRESETS"
                  :key="preset.label"
                  @click="applyPreset(preset)"
                  class="rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                  :class="isActivePreset(preset) ? 'border-[#ac1a2f] bg-[#ac1a2f]/5 text-[#ac1a2f] font-semibold' : 'text-gray-600'"
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
                  class="w-full accent-[#ac1a2f]"
                />
                <input
                  type="range"
                  v-model.number="filters.rangeEnd"
                  :min="360"
                  :max="1380"
                  :step="30"
                  class="w-full accent-[#ac1a2f]"
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
                    class="accent-[#ac1a2f]"
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

            <!-- Modality -->
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">Modality</label>
              <select v-model="filters.termFormat" class="w-full rounded-md border border-gray-200 px-2 py-1 text-sm">
                <option value="all">Any</option>
                <option value="LEC">Lecture (In-Person)</option>
                <option value="ONL">Online</option>
                <option value="HYB">Hybrid</option>
                <option value="WEB">Web-Enhanced</option>
              </select>
            </div>
          </div>

          <!-- Build button -->
          <button
            data-testid="build-button"
            @click="triggerBuild"
            :disabled="!selectedCourses.length || !resolvedTermId"
            class="w-full rounded-xl bg-[#ac1a2f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8e1627] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isBuilding ? 'Building…' : 'Build Schedules' }}
          </button>

          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        </div>

        <!-- Right panel: results -->
        <div>
          <p v-if="!hasBuilt" class="py-12 text-center text-sm text-gray-400">
            Add courses and click Build Schedules to see options.
          </p>

          <p v-else-if="isBuilding" class="py-12 text-center text-sm text-gray-400">
            Building schedules…
          </p>

          <p v-else-if="!schedules.length" class="py-12 text-center text-sm text-gray-400">
            No conflict-free schedules found. Try adjusting your filters or courses.
          </p>

          <div v-else>
            <p class="mb-4 text-sm text-gray-500">{{ count }} schedule{{ count === 1 ? '' : 's' }} found</p>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                v-for="(schedule, idx) in schedules"
                :key="idx"
                data-testid="schedule-card"
                class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <!-- Mini-grid -->
                <div class="mb-2 flex gap-px overflow-hidden rounded border border-gray-100 bg-gray-100" style="height: 120px">
                  <div
                    v-for="day in GRID_DAYS"
                    :key="day"
                    class="relative flex flex-1 flex-col bg-white"
                  >
                    <div class="flex-shrink-0 py-0.5 text-center text-[9px] font-medium text-gray-400">{{ day }}</div>
                    <div class="relative flex-1">
                      <div
                        v-for="sec in blocksForDay(schedule, day)"
                        :key="sec.id"
                        class="absolute left-0.5 right-0.5 overflow-hidden rounded bg-[#ac1a2f] px-0.5 text-[8px] text-white"
                        :style="blockStyle(sec)"
                      >{{ sec.subjectCode }}-{{ sec.courseNo }}</div>
                    </div>
                  </div>
                </div>

                <!-- Course list -->
                <p class="mb-2 text-[11px] text-gray-500">
                  {{ schedule.map((s) => `${s.subjectCode}-${s.courseNo}`).join(' · ') }}
                </p>

                <button
                  data-testid="select-schedule-btn"
                  @click="onSelectSchedule(schedule)"
                  class="w-full rounded-lg bg-[#ac1a2f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#8e1627]"
                >
                  Select Schedule
                </button>

                <!-- Register Now — Students only -->
                <div v-if="authStore.isStudent" class="mt-2">
                  <p
                    v-if="scheduleResults[idx]?._error"
                    data-testid="register-card-error"
                    class="mb-1 text-xs text-red-600"
                  >{{ scheduleResults[idx]._error }}</p>

                  <ul v-else-if="scheduleResults[idx]" class="mb-2 space-y-0.5">
                    <li
                      v-for="sec in schedule"
                      :key="sec.id"
                      data-testid="register-section-result"
                      class="text-[11px]"
                    >
                      {{ sec.subjectCode }}-{{ sec.courseNo }} —
                      <span :class="scheduleResults[idx][String(sec.id)]?.status === 'error' ? 'text-red-600' : 'text-green-700'">
                        {{ scheduleResults[idx][String(sec.id)]?.message }}
                      </span>
                    </li>
                  </ul>

                  <button
                    v-if="!scheduleResults[idx] || scheduleResults[idx]._error"
                    data-testid="register-now-btn"
                    @click="onRegisterSchedule(schedule, idx)"
                    :disabled="registeringSchedules.has(idx)"
                    class="w-full rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  >
                    {{ registeringSchedules.has(idx) ? 'Registering…' : 'Register Now' }}
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

<script>
import { ref, reactive, computed, watch } from 'vue'
import { useReferenceStore } from '@/stores/reference'
import { useAuthStore } from '@/stores/auth'
import { searchCourses, getCourseSections } from '@/services/sectionsService'
import { useScheduleBuilder } from '@/composables/useScheduleBuilder'
import router from '@/router'

const GRID_DAYS = ['M', 'T', 'W', 'R', 'F']
const GRID_START = 480   // 8am
const GRID_SPAN = 600    // 10 hours (8am-6pm)

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

function formatMinutes(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  const period = h >= 12 ? 'pm' : 'am'
  const displayH = h > 12 ? h - 12 : h || 12
  return `${displayH}:${String(m).padStart(2, '0')}${period}`
}

export default {
  name: 'ScheduleBuilderView',
  setup() {
    const referenceStore = useReferenceStore()
    const authStore = useAuthStore()
    const { schedules, isBuilding, error, count, build, selectSchedule, scheduleResults, registeringSchedules, registerSchedule } = useScheduleBuilder()
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
      build(selectedCourses.value, { ...filters })
    }

    watch(filters, () => {
      if (hasBuilt.value && selectedCourses.value.length > 0) {
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
      selectedCourses.value.splice(idx, 1)
    }

    function applyPreset(preset) {
      filters.rangeStart = preset.start
      filters.rangeEnd = preset.end
    }

    function isActivePreset(preset) {
      return filters.rangeStart === preset.start && filters.rangeEnd === preset.end
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

    function onRegisterSchedule(schedule, idx) {
      registerSchedule(schedule, idx)
    }

    return {
      registrationTerms,
      locations,
      selectedTermId,
      selectedCourses,
      searchQuery,
      searchResults,
      showDropdown,
      filters,
      schedules,
      isBuilding,
      error,
      count,
      hasBuilt,
      GRID_DAYS,
      TIME_PRESETS,
      ALL_DAYS,
      triggerBuild,
      onSearchInput,
      onSearchBlur,
      addCourse,
      removeCourse,
      applyPreset,
      isActivePreset,
      blocksForDay,
      blockStyle,
      onSelectSchedule,
      resolvedTermId,
      formatMinutes,
      authStore,
      scheduleResults,
      registeringSchedules,
      onRegisterSchedule,
    }
  },
}
</script>

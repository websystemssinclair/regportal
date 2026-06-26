<script setup>
import { ref, computed, watch } from 'vue'
import DOMPurify from 'dompurify'
import { useReferenceStore } from '@/stores/reference'
import { useSearch } from '@/composables/useSearch'
import { useCardExpansion } from '@/composables/useCardExpansion'
import { useRegisterNow } from '@/composables/useRegisterNow'
import { useCartStore } from '@/stores/cart'
import { useCart } from '@/composables/useCart'
import { useAuthStore } from '@/stores/auth'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { isActionable, seatBadge, sectionLocation, sectionRoom } from '@/utils/section'
import { formatTimeRange, formatDays } from '@/utils/time'

const reference = useReferenceStore()
const tickerPaused = ref(false)

const sanitizedIntro = computed(() => DOMPurify.sanitize(reference.intro))
const upcomingKeyDates = computed(() => reference.upcomingKeyDates)
const tickerItems = computed(() => [...upcomingKeyDates.value, ...upcomingKeyDates.value])

function formatKeyDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    .format(new Date(year, month - 1, day))
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = parseRegDate(dateStr)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d)
}


const { filters, results, total, isLoading, error, fetch } = useSearch()
const sortedResults = computed(() =>
  [...results.value].sort((a, b) => (b.isOpen === 'true') - (a.isOpen === 'true'))
)
const {
  expanded,
  sectionsByCard,
  detailsByCard,
  loadingCard,
  sectionErrors,
  visibleSections,
  toggleCard,
  showAllSections,
  sectionsToShow,
  reset: resetExpansion,
} = useCardExpansion(filters)
const { sectionResults, registeringSections, registerNow, dismissResult, reset: resetRegisterNow } = useRegisterNow()

const cartStore = useCartStore()
const cart = useCart()
const authStore = useAuthStore()
const maintenanceStore = useMaintenanceStore()
const drawerOpen = ref(false)
const filterDrawerRef = ref(null)

const totalPages = computed(() => Math.ceil(total.value / filters.limit) || 1)
const pageWindow = computed(() => {
  const lo = Math.max(1, filters.page - 2)
  const hi = Math.min(totalPages.value, filters.page + 2)
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
})
const defaultTermId = computed(() => reference.terms.find(t => t.toView === 'D')?.id ?? null)
watch(defaultTermId, (id) => {
  if (id && !filters.term) filters.term = id
}, { immediate: true })

// fallow-ignore-next-line complexity
const activeFilterCount = computed(() => {
  let n = 0
  if (filters.keyword) n++
  if (filters.subjectCode && filters.subjectCode !== 'ANY') n++
  if (filters.termFormat !== 'all') n++
  if (filters.building !== 'any') n++
  if (filters.segOptions !== 'any') n++
  if (filters.creditHoursMin > 0 || filters.creditHoursMax < 15) n++
  if (selectedDays.value.length < DAYS.length) n++
  return n
})

const TERM_FORMAT_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Full', label: 'Full Term' },
  { value: 'A', label: 'A Term' },
  { value: 'B', label: 'B Term' },
  { value: '12', label: '12 Week' },
  { value: 'ST', label: 'All Short Term' },
]

const BUILDING_OPTIONS = [
  { value: 'any', label: 'All Locations' },
  { value: 'SCC', label: 'Sinclair Dayton Campus' },
  { value: 'CENT', label: 'Centerville Campus' },
  { value: 'CvCC', label: 'Courseview Campus Center' },
  { value: 'WWW', label: 'Online' },
  { value: 'other', label: 'Off Campus' },
]

const SEG_OPTIONS = [
  { value: 'any', label: 'Any Time' },
  { value: 'mornings', label: 'Mornings (6am–noon)' },
  { value: 'afternoons', label: 'Afternoons (noon–5pm)' },
  { value: 'evenings', label: 'Evenings (5pm–11pm)' },
]

const DAYS = ['M', 'T', 'W', 'R', 'F', 'S', 'U']
const DAY_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri', S: 'Sat', U: 'Sun' }

const selectedDays = ref(['M', 'T', 'W', 'R', 'F', 'S', 'U'])
watch(selectedDays, (days) => { filters.daysOfWeek = days.join(',') }, { deep: true })

function toggleDay(d) {
  const i = selectedDays.value.indexOf(d)
  i === -1 ? selectedDays.value.push(d) : selectedDays.value.splice(i, 1)
}

function runSearch(resetPage = true) {
  if (resetPage) { filters.page = 1; filters.start = 0 }
  resetExpansion()
  resetRegisterNow()
  fetch()
}

function goPage(n) {
  filters.page = n
  filters.start = (n - 1) * filters.limit
  resetExpansion()
  resetRegisterNow()
  fetch()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}


function parseRegDate(dateStr) {
  const [datePart, timePart = '00:00'] = dateStr.split(' ')
  const [month, day, year] = datePart.split('/').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}


function closeDrawer() {
  drawerOpen.value = false
}

const { handleKeydown: drawerKeydown } = useFocusTrap(filterDrawerRef, drawerOpen, closeDrawer)

fetch()
</script>

<template>
  <div class="flex min-h-screen flex-col">

    <!-- Hero: intro (scrolls away) -->
    <div class="bg-white px-4 pb-3 pt-8">
      <div class="mx-auto max-w-3xl">
        <div
          v-if="reference.intro"
          class="intro-banner mb-5 text-sm leading-relaxed text-gray-700"
          v-html="sanitizedIntro"
        />
        <h1 v-else class="mb-5 text-center text-2xl font-semibold text-gray-800">
          What would you like to learn?
        </h1>
      </div>
    </div>

    <!-- Search bar (sticky) -->
    <div class="sticky top-14 z-30 bg-white px-4 py-3 shadow-sm">
      <div class="mx-auto max-w-3xl">
        <div class="flex flex-wrap gap-2">
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="What would you like to learn?"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-crimson sm:flex-1"
            @keydown.enter="runSearch()"
          />
          <select
            v-model="filters.term"
            @change="runSearch"
            aria-label="Select term"
            class="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-crimson sm:flex-none sm:shrink-0"
          >
            <option
              v-for="term in reference.terms.filter(t => ['D','Y','F'].includes(t.toView)).sort((a, b) => ['D','Y','F'].indexOf(a.toView) - ['D','Y','F'].indexOf(b.toView))"
              :key="term.id"
              :value="term.id"
            >{{ term.termName }}{{ term.toView === 'F' ? ' (Future)' : '' }}</option>
          </select>
          <button
            @click="drawerOpen = true"
            class="relative flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span class="hidden sm:inline">Filters</span>
            <span
              v-if="activeFilterCount"
              aria-hidden="true"
              class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-white"
            >{{ activeFilterCount }}</span>
            <span v-if="activeFilterCount" class="sr-only">, {{ activeFilterCount }} active {{ activeFilterCount === 1 ? 'filter' : 'filters' }}</span>
          </button>
          <button
            @click="runSearch()"
            :disabled="isLoading"
            class="shrink-0 rounded-lg bg-crimson px-5 py-3 text-sm font-bold text-white hover:bg-crimson-dark transition-colors shadow-sm disabled:opacity-60"
          >
            Search
          </button>
        </div>
      </div>
      <p v-if="!isLoading && total" class="mt-3 text-center text-xs text-gray-500">
        {{ total.toLocaleString() }} courses available
      </p>
    </div>

    <!-- Key dates ticker + results count (scrolls away) -->
    <div class="bg-white px-4 pb-6">
      <div class="mx-auto max-w-3xl">
        <div
          v-if="upcomingKeyDates.length"
          class="mt-4 rounded bg-canvas motion-safe:overflow-hidden motion-reduce:overflow-x-auto"
          aria-label="Important Dates"
          role="region"
          @mouseenter="tickerPaused = true"
          @mouseleave="tickerPaused = false"
        >
          <div
            class="ticker-track flex w-max"
            :class="{ 'ticker-paused': tickerPaused }"
          >
            <span
              v-for="(date, i) in tickerItems"
              :key="`${date.id}-${i}`"
              class="shrink-0 whitespace-nowrap px-6 py-2 text-xs font-medium text-crimson"
            >
              {{ date.description }} &bull; {{ formatKeyDate(date.keyDate) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter drawer backdrop -->
    <transition name="fade">
      <div v-if="drawerOpen" class="fixed inset-0 z-40 bg-black/30" aria-hidden="true" @click="closeDrawer" />
    </transition>

    <!-- Filter drawer -->
    <aside
      ref="filterDrawerRef"
      :class="drawerOpen ? 'translate-x-0' : 'translate-x-full'"
      :aria-hidden="!drawerOpen"
      class="fixed right-0 top-0 z-50 h-full w-full max-w-80 overflow-y-auto bg-white shadow-2xl transition-transform duration-200 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-drawer-title"
      @keydown="drawerKeydown"
    >
      <div class="flex items-center justify-between mb-5">
        <h2 id="filter-drawer-title" class="font-semibold text-gray-900">Filters</h2>
        <button
          @click="closeDrawer"
          class="text-2xl leading-none text-gray-500 hover:text-gray-700"
          aria-label="Close filters"
        >&times;</button>
      </div>

      <div class="space-y-5 text-sm">
        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Subject Code</label>
          <select v-model="filters.subjectCode"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson">
            <option v-for="code in reference.subjectCodes" :key="code.id" :value="code.id">{{ code.dspValue }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Term Part</label>
          <select v-model="filters.termFormat"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson">
            <option v-for="o in TERM_FORMAT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Location</label>
          <select v-model="filters.building"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson">
            <option v-for="o in BUILDING_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Time of Day</label>
          <select v-model="filters.segOptions"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson"
            @change="filters.timeChoice = 'segments'">
            <option v-for="o in SEG_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Days of Week</label>
          <div class="flex gap-1.5 flex-wrap">
            <button
              v-for="d in DAYS" :key="d"
              @click="toggleDay(d)"
              :aria-pressed="selectedDays.includes(d)"
              :class="selectedDays.includes(d)
                ? 'bg-crimson text-white border-crimson'
                : 'bg-white text-gray-600 border-gray-300 hover:border-crimson'"
              class="rounded border px-2.5 py-1 touch:py-3.5 touch:px-4 text-xs font-medium transition-colors"
            >{{ DAY_LABELS[d] }}</button>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Credit Hours</label>
          <div class="flex items-center gap-2">
            <input v-model.number="filters.creditHoursMin" type="number" min="0" max="15"
              aria-label="Minimum credit hours"
              class="w-16 rounded border border-gray-300 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-crimson" />
            <span class="text-gray-500">to</span>
            <input v-model.number="filters.creditHoursMax" type="number" min="0" max="15"
              aria-label="Maximum credit hours"
              class="w-16 rounded border border-gray-300 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-crimson" />
          </div>
        </div>

        <button
          @click="closeDrawer(); runSearch()"
          class="w-full rounded bg-crimson py-2.5 font-medium text-white hover:bg-crimson-dark transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </aside>

    <!-- Results -->
    <main class="flex-1 bg-canvas px-4 py-6">
      <div class="mx-auto max-w-4xl">

        <!-- Error -->
        <div v-if="error" class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load courses. Please try again.
        </div>

        <!-- Loading skeleton -->
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-lg bg-white" />
        </div>

        <!-- Empty state -->
        <div v-else-if="!results.length && !error"
          class="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-500">
          <p class="text-lg font-medium">No courses found</p>
          <p class="mt-1 text-sm">Try a broader search — there are thousands of courses waiting.</p>
        </div>

        <!-- Course card list -->
        <ul v-else class="space-y-3">
          <li v-for="course in sortedResults" :key="course.id"
            class="rounded-lg border border-gray-200 bg-white shadow-sm">

            <!-- Card header (click to expand) -->
            <button
              :class="expanded === course.id ? 'rounded-t-lg' : 'rounded-lg'"
              class="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              @click="toggleCard(course)"
              :aria-expanded="expanded === course.id"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-mono text-sm font-bold text-crimson">
                      {{ (course.SubjectCode ?? '').trim() }}-{{ (course.CourseNumber ?? '').trim() }}
                    </span>
                    <span class="font-semibold text-gray-900 text-sm">{{ course.LongName }}</span>
                    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {{ course.minCreditHours === course.maxCreditHours
                        ? course.minCreditHours
                        : `${course.minCreditHours}–${course.maxCreditHours}` }} cr
                    </span>
                    <span class="flex items-center gap-1">
                      <span v-if="course.proficiencyExamAvailable === 'Y'" class="group relative inline-block">
                        <img src="@/assets/new_prof_exam_icon.png" class="h-5 w-5" alt="Proficiency Testing Available" />
                        <span class="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-64 rounded bg-gray-900 px-2 py-1.5 text-xs font-normal text-white group-hover:block">Proficiency testing is available for this class! Qualified students may earn credit via testing without enrolling in the class. Please call 937-512-3700 to schedule an appointment with an Academic Advisor to learn more.</span>
                      </span>
                      <span v-if="course.isF2F" class="group relative inline-block">
                        <img src="@/assets/new_f2f_modality_icon.png" class="h-5 w-5" alt="In Person" />
                        <span class="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-64 rounded bg-gray-900 px-2 py-1.5 text-xs font-normal text-white group-hover:block">In Person - Course meets in person on scheduled days and times.</span>
                      </span>
                      <span v-if="course.isFlexpace" class="group relative inline-block">
                        <img src="@/assets/new_flexpace_modality_icon.png" class="h-5 w-5" alt="FlexPace" />
                        <span class="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-64 rounded bg-gray-900 px-2 py-1.5 text-xs font-normal text-white group-hover:block">FlexPace - Complete work independently online when it fits your schedule, without weekly due dates. Requires self-motivation as well as a computer and high-speed Internet, Webcam and Microphone.</span>
                      </span>
                      <span v-if="course.isHybrid" class="group relative inline-block">
                        <img src="@/assets/new_blended_f2f-online_icon.png" class="h-5 w-5" alt="Blended" />
                        <span class="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-64 rounded bg-gray-900 px-2 py-1.5 text-xs font-normal text-white group-hover:block">Blended - Course meets in person on scheduled days and times with additional online content. Check the schedule to confirm the days and times your class will meet in-person. Requires computer with high-speed Internet, Webcam and Microphone.</span>
                      </span>
                      <span v-if="course.isVirtual" class="group relative inline-block">
                        <img src="@/assets/new_virtual_modality_icon.png" class="h-5 w-5" alt="Online with meeting times" />
                        <span class="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-64 rounded bg-gray-900 px-2 py-1.5 text-xs font-normal text-white group-hover:block">Online with scheduled meeting times - Course meets online during scheduled days and times, with additional online content. Check the schedule to confirm the days and times your class will meet online. Requires computer with high-speed Internet, Webcam and Microphone.</span>
                      </span>
                      <span v-if="!course.isF2F && !course.isVirtual && !course.isHybrid && !course.isFlexpace" class="group relative inline-block">
                        <img src="@/assets/new_online_modality_icon.png" class="h-5 w-5" alt="Online Learning" />
                        <span class="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-64 rounded bg-gray-900 px-2 py-1.5 text-xs font-normal text-white group-hover:block">Online with no scheduled meeting times - Complete work online when it fits your schedule, while adhering to weekly deadlines. No scheduled meeting times. Requires computer with high-speed Internet, Webcam and Microphone.</span>
                      </span>
                    </span>
                  </div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span v-if="course.preReqs && course.preReqs !== 'None'" class="text-gray-600">
                      Prereq: {{ course.preReqs }}
                    </span>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <span
                    :class="course.isOpen == 'true' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                    class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >{{ course.isOpen == 'true' ? 'Open' : 'Closed' }}</span>
                  <svg
                    :class="expanded === course.id ? 'rotate-180' : ''"
                    class="h-4 w-4 text-gray-500 transition-transform"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            <!-- Expanded: course details + section rows -->
            <div v-if="expanded === course.id" class="rounded-b-lg border-t border-gray-100 bg-gray-50">
              <!-- Course details -->
              <div class="px-5 py-3 border-b border-gray-100">
                <p class="text-xs text-gray-600 leading-relaxed">{{ course.Description }}</p>
                <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span v-if="course.preReqs && course.preReqs !== 'None'" class="text-gray-600">
                    <strong>Prereq:</strong> {{ course.preReqs }}
                  </span>
                  <span v-if="detailsByCard[course.id]?.coReqs && detailsByCard[course.id].coReqs !== 'None'" class="text-gray-600">
                    <strong>Coreq:</strong> {{ detailsByCard[course.id].coReqs }}
                  </span>
                  <a v-if="detailsByCard[course.id]?.topicLink" :href="detailsByCard[course.id].topicLink" target="_blank" rel="noopener"
                    class="text-crimson hover:underline">Topic link ↗</a>
                  <a v-if="detailsByCard[course.id]?.previewLink" :href="detailsByCard[course.id].previewLink" target="_blank" rel="noopener"
                    class="text-crimson hover:underline">Course preview ↗</a>
                </div>
              </div>

              <!-- Sections loading -->
              <div v-if="loadingCard === course.id" class="px-5 py-4 text-sm text-gray-500">
                Loading sections…
              </div>

              <!-- Sections error -->
              <div v-else-if="sectionErrors[course.id]" class="px-5 py-4 text-sm text-red-500">
                Failed to load sections. Collapse and re-expand to retry.
              </div>

              <!-- Sections empty -->
              <div v-else-if="sectionsByCard[course.id]?.length === 0"
                class="px-5 py-4 text-sm text-gray-500">
                No sections available for this term.
              </div>

              <!-- Section rows -->
              <ul v-else class="divide-y divide-gray-100">
                <li v-for="sec in sectionsToShow(course.id)" :key="sec.SectionNo"
                  class="flex items-start justify-between gap-3 px-5 py-3 hover:bg-white transition-colors">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-end gap-2 text-sm">
                      <span class="font-mono font-semibold text-crimson">{{ sec.SectionNo }}</span>
                      <span class="text-gray-600">{{ sectionLocation(sec) }}</span>
                      <span class="ms-0.5 text-xs text-gray-500">
                        {{ formatDays(sec.Days) || 'Online' }}
                        <template v-if="sec.StartTime">{{ formatTimeRange(sec.StartTime, sec.EndTime) }}</template>
                      </span>
                    </div>
                    <div
                      v-for="(entry, i) in sec.additionalSched"
                      :key="i"
                      class="mt-0.5 text-xs text-gray-500"
                    >
                      {{ formatDays(entry.Days) }} {{ formatTimeRange(entry.startTime, entry.endTime) }}
                      <template v-if="sectionRoom(entry)"> · {{ sectionRoom(entry) }}</template>
                    </div>
                    <p v-if="sec.Faculty" class="mt-0.5 text-xs text-gray-500">Faculty: {{ sec.Faculty }}</p>
                    <p v-if="sec.printedComments" class="mt-0.5 text-xs text-gray-500">{{ sec.printedComments }}</p>
                    <p v-if="sec.startDate && !/CBE/i.test(sec.restrictions || '')" class="mt-0.5 text-xs text-gray-500">
                      Runs: {{ formatDate(sec.startDate) }}{{ sec.endDate ? ` – ${formatDate(sec.endDate)}` : '' }}
                    </p>
                    <div v-if="sec.otherFee || sec.labFee || /independent/i.test(sec.restrictions) || sec.specialProperty === 'Y'" class="mt-0.5 flex flex-wrap gap-1">
                      <span v-if="sec.otherFee" class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">+ ${{ sec.otherFee }} fee</span>
                      <span v-if="sec.labFee" class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">+ ${{ sec.labFee }} fee</span>
                      <span v-if="/independent/i.test(sec.restrictions)" class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">Independent Study</span>
                      <span v-if="sec.specialProperty === 'Y'" class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">Learning Community</span>
                    </div>
                    <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <!-- TODO:
                        - add link to booklist modal
                        - add link to master syllabus (ex: https://apps.sinclair.edu/syllabus/index.cfm?subjectCode=ACC&courseNo=1210&term=26FA) modal(?)
                        -->
                    </div>
                  </div>
                  <div class="flex shrink-0 flex-col items-end gap-1.5">
                    <span v-for="b in [seatBadge(sec)]" :key="'b'" :class="b.cls" class="rounded-full px-2.5 py-0.5 text-xs font-medium">{{ b.label }}</span>
                    <template v-if="sectionResults[sec.CourseKey]?.status === 'success'">
                      <span class="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
                        {{ sectionResults[sec.CourseKey].message }}
                      </span>
                    </template>
                    <template v-else>
                      <template v-if="sec.status == 'Open' && isActionable(sec)">
                        <button
                          v-if="!cartStore.sections.some((c) => c.CourseKey === sec.CourseKey)"
                          @click="cart.add(sec)"
                          class="rounded border border-crimson px-3 py-1.5 touch:py-3.5 touch:px-4 text-xs font-medium text-crimson hover:bg-crimson hover:text-white transition-colors"
                        >
                          Add to Cart
                        </button>
                        <span
                          v-else
                          class="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500"
                        >
                          In Cart
                        </span>
                      </template>
                      <template v-if="authStore.isStudent && isActionable(sec)">
                        <template v-if="sectionResults[sec.CourseKey]?.status === 'error'">
                          <span class="text-xs text-red-600">{{ sectionResults[sec.CourseKey].message }}</span>
                          <button
                            @click="dismissResult(sec.CourseKey)"
                            class="text-xs text-gray-500 underline hover:text-gray-600"
                          >Dismiss</button>
                        </template>
                        <button
                          v-else
                          @click="registerNow(sec)"
                          :disabled="registeringSections.has(sec.CourseKey) || maintenanceStore.isBackendDown"
                          class="rounded bg-crimson px-3 py-1.5 touch:py-3.5 touch:px-4 text-xs font-medium text-white hover:bg-crimson-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {{ sec.status === 'Open' ? 'Register Now' : 'Waitlist Now' }}
                        </button>
                      </template>
                      <button
                        v-else-if="!authStore.isAuthenticated && isActionable(sec)"
                        @click="authStore.login()"
                        class="text-xs text-crimson hover:underline"
                      >Sign in to register</button>
                      <span
                        v-else-if="sec.isFuture"
                        class="text-xs text-gray-500"
                      >Registration opens {{ formatDate(sec.regStartDate) }}</span>
                    </template>
                  </div>
                </li>
              </ul>

              <!-- Show all sections -->
              <div
                v-if="sectionsByCard[course.id]?.length > 20 && !visibleSections[course.id]"
                class="border-t border-gray-100 px-5 py-3 text-center"
              >
                <button
                  @click="showAllSections(course.id)"
                  class="text-sm text-crimson hover:underline"
                >
                  Show all {{ sectionsByCard[course.id].length }} sections
                </button>
              </div>
            </div>
          </li>
        </ul>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span aria-live="polite" aria-atomic="true">Page {{ filters.page }} of {{ totalPages }}</span>
          <nav aria-label="Search results pages" class="flex gap-1">
            <button
              :disabled="filters.page <= 1 || isLoading"
              @click="goPage(filters.page - 1)"
              aria-label="Previous page"
              class="rounded border border-gray-300 px-3 py-1.5 touch:py-3 hover:bg-gray-50 disabled:opacity-40"
            >← Prev</button>
            <button
              v-for="p in pageWindow" :key="p"
              @click="goPage(p)"
              :disabled="isLoading"
              :aria-label="'Page ' + p"
              :aria-current="p === filters.page ? 'page' : undefined"
              :class="p === filters.page
                ? 'border-crimson bg-crimson text-white'
                : 'border-gray-300 hover:bg-gray-50'"
              class="rounded border px-3 py-1.5 touch:py-3"
            >{{ p }}</button>
            <button
              :disabled="filters.page >= totalPages || isLoading"
              @click="goPage(filters.page + 1)"
              aria-label="Next page"
              class="rounded border border-gray-300 px-3 py-1.5 touch:py-3 hover:bg-gray-50 disabled:opacity-40"
            >Next →</button>
          </nav>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-canvas border-t border-gray-200 px-4 py-4 text-center text-xs text-gray-500">
      &copy; {{ new Date().getFullYear() }} Sinclair College
    </footer>
  </div>
</template>

<style scoped>
.intro-banner :deep(p) {
  margin-bottom: 0.75rem;
}
.intro-banner :deep(p:last-child) {
  margin-bottom: 0;
}

.ticker-track {
  will-change: transform;
  animation: scroll-ticker 30s linear infinite;
}

.ticker-track.ticker-paused {
  animation-play-state: paused;
}

@keyframes scroll-ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Reduced-motion: stop the marquee and let users scroll the dates instead
   of seeing it stuck at translateX(-50%) (which the global 0.01ms rule
   would cause for an infinite-loop animation). */
@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    animation: none;
    /* Truncated first item is still readable; no overflow needed since
       the parent already clips, but scrolling is enabled on the wrapper. */
  }
}
</style>

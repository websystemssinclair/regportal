<script setup>
import { ref, computed, watch } from 'vue'
import DOMPurify from 'dompurify'
import { useReferenceStore } from '@/stores/reference'
import { useSearch } from '@/composables/useSearch'
import { useCardExpansion } from '@/composables/useCardExpansion'
import { useRegisterNow } from '@/composables/useRegisterNow'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useMaintenanceStore } from '@/stores/maintenance'

const reference = useReferenceStore()
const tickerPaused = ref(false)

const sanitizedIntro = computed(() => DOMPurify.sanitize(reference.intro))
const upcomingKeyDates = computed(() => reference.upcomingKeyDates)
const tickerItems = computed(() => [...upcomingKeyDates.value, ...upcomingKeyDates.value])

function formatDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    .format(new Date(year, month - 1, day))
}

const { filters, results, total, isLoading, error, fetch } = useSearch()
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
const authStore = useAuthStore()
const maintenanceStore = useMaintenanceStore()
const drawerOpen = ref(false)

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

function isActionable(sec) {
  return sec.status === 'Open' || (sec.waitListAllowed === 'Y' && sec.status !== 'Cancelled')
}

function modalityText(c) {
  return [c.isF2F && 'F2F', c.isVirtual && 'Virtual', c.isHybrid && 'Hybrid', c.isFlexpace && 'Flexpace']
    .filter(Boolean).join(' · ') || 'Online'
}

function seatBadgeClass(s) {
  if (s.status === 'Cancelled') return 'bg-gray-100 text-gray-500'
  if (s.status === 'Open') return 'bg-green-100 text-green-800'
  return s.waitListAllowed === 'Y' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
}

function seatBadgeLabel(s) {
  if (s.status === 'Cancelled') return 'Cancelled'
  if (s.status === 'Open') return `Open · ${s.openSeats}/${s.seatCapacity}`
  return s.waitListAllowed === 'Y' ? `Waitlist · ${s.openSeats}/${s.seatCapacity}` : `Closed · ${s.openSeats}/${s.seatCapacity}`
}

fetch()
</script>

<template>
  <div class="flex min-h-screen flex-col">

    <!-- Hero -->
    <div class="bg-white px-4 pb-6 pt-8">
      <div class="mx-auto max-w-3xl">

        <!-- Intro text -->
        <div
          v-if="reference.intro"
          class="intro-banner mb-5 text-sm leading-relaxed text-gray-700"
          v-html="sanitizedIntro"
        />
        <h1 v-else class="mb-5 text-center text-2xl font-semibold text-gray-800">
          What would you like to learn?
        </h1>

        <!-- Search bar -->
        <div class="flex gap-2">
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="What would you like to learn?"
            class="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-crimson"
            @keydown.enter="runSearch()"
          />
          <select
            v-model="filters.term"
            class="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-crimson"
          >
            <option
              v-for="term in reference.terms.filter(t => ['D','Y','F'].includes(t.toView))"
              :key="term.id"
              :value="term.id"
            >{{ term.termName }}{{ term.toView === 'F' ? ' (Future)' : '' }}</option>
          </select>
          <button
            @click="drawerOpen = true"
            class="relative flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            <span
              v-if="activeFilterCount"
              class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-white"
            >{{ activeFilterCount }}</span>
          </button>
          <button
            @click="runSearch()"
            :disabled="isLoading"
            class="rounded-lg bg-crimson px-5 py-3 text-sm font-bold text-white hover:bg-crimson-dark transition-colors shadow-sm disabled:opacity-60"
          >
            Search
          </button>
        </div>

        <!-- Key dates ticker -->
        <div
          v-if="upcomingKeyDates.length"
          class="mt-4 overflow-hidden rounded bg-canvas"
          aria-label="Important Dates"
          role="marquee"
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
              {{ date.description }} &bull; {{ formatDate(date.keyDate) }}
            </span>
          </div>
        </div>

        <!-- Results count -->
        <p v-if="!isLoading && total" class="mt-3 text-center text-xs text-gray-400">
          {{ total.toLocaleString() }} courses available
        </p>
      </div>
    </div>

    <!-- Filter drawer backdrop -->
    <transition name="fade">
      <div v-if="drawerOpen" class="fixed inset-0 z-40 bg-black/30" @click="drawerOpen = false" />
    </transition>

    <!-- Filter drawer -->
    <aside
      :class="drawerOpen ? 'translate-x-0' : 'translate-x-full'"
      class="fixed right-0 top-0 z-50 h-full w-80 overflow-y-auto bg-white shadow-2xl transition-transform duration-200 p-6"
      aria-label="Search filters"
    >
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-semibold text-gray-900">Filters</h2>
        <button @click="drawerOpen = false" class="text-2xl leading-none text-gray-400 hover:text-gray-700">&times;</button>
      </div>

      <div class="space-y-5 text-sm">
        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Subject Code</label>
          <input v-model="filters.subjectCode" type="text" placeholder="e.g. ACC, ENG, ART"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson" />
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
              class="w-16 rounded border border-gray-300 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-crimson" />
            <span class="text-gray-400">to</span>
            <input v-model.number="filters.creditHoursMax" type="number" min="0" max="15"
              class="w-16 rounded border border-gray-300 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-crimson" />
          </div>
        </div>

        <button
          @click="drawerOpen = false; runSearch()"
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
          class="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-400">
          <p class="text-lg font-medium">No courses found</p>
          <p class="mt-1 text-sm">Try a broader search — there are thousands of courses waiting.</p>
        </div>

        <!-- Course card list -->
        <ul v-else class="space-y-3">
          <li v-for="course in results" :key="course.id"
            class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">

            <!-- Card header (click to expand) -->
            <button
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
                  </div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{{ modalityText(course) }}</span>
                    <span v-if="course.preReqs && course.preReqs !== 'None'" class="text-amber-600">
                      Prereq: {{ course.preReqs }}
                    </span>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <span
                    :class="course.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                    class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >{{ course.isOpen ? 'Open' : 'Closed' }}</span>
                  <svg
                    :class="expanded === course.id ? 'rotate-180' : ''"
                    class="h-4 w-4 text-gray-400 transition-transform"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            <!-- Expanded: course details + section rows -->
            <div v-if="expanded === course.id" class="border-t border-gray-100 bg-gray-50">
              <!-- Course details -->
              <div class="px-5 py-3 border-b border-gray-100">
                <p class="text-xs text-gray-600 leading-relaxed">{{ course.Description }}</p>
                <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span v-if="course.preReqs && course.preReqs !== 'None'" class="text-amber-700">
                    <strong>Prereq:</strong> {{ course.preReqs }}
                  </span>
                  <span v-if="detailsByCard[course.id]?.coReqs && detailsByCard[course.id].coReqs !== 'None'" class="text-amber-700">
                    <strong>Coreq:</strong> {{ detailsByCard[course.id].coReqs }}
                  </span>
                  <a v-if="detailsByCard[course.id]?.topicLink" :href="detailsByCard[course.id].topicLink" target="_blank" rel="noopener"
                    class="text-crimson hover:underline">Topic link ↗</a>
                  <a v-if="detailsByCard[course.id]?.previewLink" :href="detailsByCard[course.id].previewLink" target="_blank" rel="noopener"
                    class="text-crimson hover:underline">Course preview ↗</a>
                </div>
              </div>

              <!-- Sections loading -->
              <div v-if="loadingCard === course.id" class="px-5 py-4 text-sm text-gray-400">
                Loading sections…
              </div>

              <!-- Sections error -->
              <div v-else-if="sectionErrors[course.id]" class="px-5 py-4 text-sm text-red-500">
                Failed to load sections. Collapse and re-expand to retry.
              </div>

              <!-- Sections empty -->
              <div v-else-if="sectionsByCard[course.id]?.length === 0"
                class="px-5 py-4 text-sm text-gray-400">
                No sections available for this term.
              </div>

              <!-- Section rows -->
              <ul v-else class="divide-y divide-gray-100">
                <li v-for="sec in sectionsToShow(course.id)" :key="sec.SectionNo"
                  class="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white transition-colors">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                      <span class="font-mono font-semibold text-gray-800">{{ sec.SectionNo }}</span>
                      <span class="text-gray-600">{{ sec.Faculty }}</span>
                      <span class="text-gray-500">
                        {{ sec.Days || 'Online' }}
                        <template v-if="sec.StartTime">{{ sec.StartTime }}–{{ sec.EndTime }}</template>
                      </span>
                    </div>
                    <p class="mt-0.5 text-xs text-gray-400">{{ sec.iconTitle }} · {{ sec.location || sec.building }}</p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <span :class="seatBadgeClass(sec)" class="rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {{ seatBadgeLabel(sec) }}
                    </span>
                    <template v-if="sectionResults[sec.CourseKey]?.status === 'success'">
                      <span class="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
                        {{ sectionResults[sec.CourseKey].message }}
                      </span>
                    </template>
                    <template v-else>
                      <button
                        v-if="!cartStore.sections.some((c) => c.CourseKey === sec.CourseKey)"
                        @click="cartStore.add(sec)"
                        class="rounded bg-crimson px-3 py-1.5 touch:py-3.5 touch:px-4 text-xs font-medium text-white hover:bg-crimson-dark transition-colors"
                      >
                        Add to Cart
                      </button>
                      <span
                        v-else
                        class="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500"
                      >
                        In Cart
                      </span>
                      <template v-if="authStore.isStudent && isActionable(sec)">
                        <template v-if="sectionResults[sec.CourseKey]?.status === 'error'">
                          <span class="text-xs text-red-600">{{ sectionResults[sec.CourseKey].message }}</span>
                          <button
                            @click="dismissResult(sec.CourseKey)"
                            class="text-xs text-gray-400 underline hover:text-gray-600"
                          >Dismiss</button>
                        </template>
                        <button
                          v-else
                          @click="registerNow(sec)"
                          :disabled="registeringSections.has(sec.CourseKey) || maintenanceStore.isBackendDown"
                          class="rounded border border-crimson px-3 py-1.5 touch:py-3.5 touch:px-4 text-xs font-medium text-crimson hover:bg-crimson hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {{ sec.status === 'Open' ? 'Register Now' : 'Waitlist Now' }}
                        </button>
                      </template>
                      <button
                        v-else-if="!authStore.isAuthenticated && isActionable(sec)"
                        @click="authStore.login()"
                        class="text-xs text-crimson hover:underline"
                      >Sign in to register</button>
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
          <span>Page {{ filters.page }} of {{ totalPages }}</span>
          <div class="flex gap-1">
            <button
              :disabled="filters.page <= 1 || isLoading"
              @click="goPage(filters.page - 1)"
              class="rounded border border-gray-300 px-3 py-1.5 touch:py-3 hover:bg-gray-50 disabled:opacity-40"
            >← Prev</button>
            <button
              v-for="p in pageWindow" :key="p"
              @click="goPage(p)"
              :disabled="isLoading"
              :class="p === filters.page
                ? 'border-crimson bg-crimson text-white'
                : 'border-gray-300 hover:bg-gray-50'"
              class="rounded border px-3 py-1.5 touch:py-3"
            >{{ p }}</button>
            <button
              :disabled="filters.page >= totalPages || isLoading"
              @click="goPage(filters.page + 1)"
              class="rounded border border-gray-300 px-3 py-1.5 touch:py-3 hover:bg-gray-50 disabled:opacity-40"
            >Next →</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-canvas border-t border-gray-200 px-4 py-4 text-center text-xs text-gray-400">
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
</style>

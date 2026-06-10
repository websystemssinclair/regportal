<script setup>
import { ref, computed, watch } from 'vue'
import { useSearch } from '@/composables/useSearch'
import { useCardExpansion } from '@/composables/useCardExpansion'

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

const drawerOpen = ref(false)

const totalPages = computed(() => Math.ceil(total.value / filters.limit) || 1)
const activeFilterCount = computed(() => {
  let n = 0
  if (filters.keyword) n++
  if (filters.subjectCode && filters.subjectCode !== 'ANY') n++
  if (filters.termFormat !== 'all') n++
  if (filters.building !== 'any') n++
  if (filters.segOptions !== 'any') n++
  if (filters.creditHoursMin > 0 || filters.creditHoursMax < 15) n++
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
  fetch()
}

function goPage(n) {
  filters.page = n
  filters.start = (n - 1) * filters.limit
  resetExpansion()
  fetch()
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
  <div class="min-h-screen bg-gray-100">
    <!-- Hero search bar -->
    <div class="bg-[#ac1a2f] px-4 py-8">
      <div class="mx-auto max-w-3xl">
        <h1 class="mb-4 text-2xl font-bold text-white text-center">Find a Course</h1>
        <div class="flex gap-2">
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="Search by keyword, course code, or subject…"
            class="flex-1 rounded-lg border-0 px-4 py-3 text-sm shadow focus:outline-none focus:ring-2 focus:ring-white/50"
            @keydown.enter="runSearch()"
          />
          <button
            @click="drawerOpen = true"
            class="relative flex items-center gap-2 rounded-lg bg-white/20 px-4 py-3 text-sm font-medium text-white hover:bg-white/30 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            <span
              v-if="activeFilterCount"
              class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#ac1a2f]"
            >{{ activeFilterCount }}</span>
          </button>
          <button
            @click="runSearch()"
            :disabled="isLoading"
            class="rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#ac1a2f] hover:bg-gray-50 transition-colors shadow disabled:opacity-60"
          >
            Search
          </button>
        </div>
        <p v-if="!isLoading && total" class="mt-3 text-center text-xs text-white/60">
          {{ total.toLocaleString() }} courses found · {{ filters.term || 'All Terms' }}
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
          <label class="mb-1.5 block font-medium text-gray-700">Term</label>
          <input v-model="filters.term" type="text" placeholder="e.g. 26FA"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ac1a2f]" />
          <p class="mt-1 text-xs text-gray-400">Format: YYTT — e.g. 26FA, 27SP, 27SU</p>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Subject Code</label>
          <input v-model="filters.subjectCode" type="text" placeholder="e.g. ACC, ENG, ART"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ac1a2f]" />
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Term Part</label>
          <select v-model="filters.termFormat"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ac1a2f]">
            <option v-for="o in TERM_FORMAT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Location</label>
          <select v-model="filters.building"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ac1a2f]">
            <option v-for="o in BUILDING_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Time of Day</label>
          <select v-model="filters.segOptions"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ac1a2f]"
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
                ? 'bg-[#ac1a2f] text-white border-[#ac1a2f]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-[#ac1a2f]'"
              class="rounded border px-2.5 py-1 text-xs font-medium transition-colors"
            >{{ DAY_LABELS[d] }}</button>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block font-medium text-gray-700">Credit Hours</label>
          <div class="flex items-center gap-2">
            <input v-model.number="filters.creditHoursMin" type="number" min="0" max="15"
              class="w-16 rounded border border-gray-300 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-[#ac1a2f]" />
            <span class="text-gray-400">to</span>
            <input v-model.number="filters.creditHoursMax" type="number" min="0" max="15"
              class="w-16 rounded border border-gray-300 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-[#ac1a2f]" />
          </div>
        </div>

        <button
          @click="drawerOpen = false; runSearch()"
          class="w-full rounded bg-[#ac1a2f] py-2.5 font-medium text-white hover:bg-[#8e1526] transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </aside>

    <!-- Results -->
    <main class="mx-auto max-w-4xl px-4 py-6">
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
        <p class="mt-1 text-sm">Try adjusting your filters or search terms.</p>
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
                  <span class="font-mono text-sm font-bold text-[#ac1a2f]">
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
                  :class="(course.isOpen === true || course.isOpen === 'true') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                  class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                >{{ (course.isOpen === true || course.isOpen === 'true') ? 'Open' : 'Closed' }}</span>
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
                  class="text-[#ac1a2f] hover:underline">Topic link ↗</a>
                <a v-if="detailsByCard[course.id]?.previewLink" :href="detailsByCard[course.id].previewLink" target="_blank" rel="noopener"
                  class="text-[#ac1a2f] hover:underline">Course preview ↗</a>
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
                  <button
                    class="rounded bg-[#ac1a2f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8e1526] transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </li>
            </ul>

            <!-- Show all sections button -->
            <div
              v-if="sectionsByCard[course.id]?.length > 20 && !visibleSections[course.id]"
              class="border-t border-gray-100 px-5 py-3 text-center"
            >
              <button
                @click="showAllSections(course.id)"
                class="text-sm text-[#ac1a2f] hover:underline"
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
            class="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
          >← Prev</button>
          <button
            v-for="p in totalPages" :key="p"
            v-show="Math.abs(p - filters.page) <= 2"
            @click="goPage(p)"
            :disabled="isLoading"
            :class="p === filters.page
              ? 'border-[#ac1a2f] bg-[#ac1a2f] text-white'
              : 'border-gray-300 hover:bg-gray-50'"
            class="rounded border px-3 py-1.5"
          >{{ p }}</button>
          <button
            :disabled="filters.page >= totalPages || isLoading"
            @click="goPage(filters.page + 1)"
            class="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
          >Next →</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

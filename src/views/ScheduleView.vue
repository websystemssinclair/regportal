<template>
  <div class="min-h-screen bg-[#f6f5f4]">

    <div
      v-if="pendingAction"
      data-testid="confirm-dialog"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <p class="mb-4 text-sm">
          Are you sure you want to drop <strong>{{ pendingAction.label }}</strong>?
        </p>
        <div class="flex gap-3">
          <button
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            @click="confirmAction"
          >Yes, Drop</button>
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            @click="pendingAction = null"
          >Cancel</button>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-5xl px-4 py-4">

      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">My Schedule</h1>
        <select
          v-if="registrationTerms.length > 1"
          data-testid="term-selector"
          v-model="selectedTermId"
          class="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700"
        >
          <option
            v-for="term in registrationTerms"
            :key="term.id"
            :value="term.id"
          >{{ term.termName }}</option>
        </select>
        <span v-else-if="registrationTerms.length === 1" class="text-sm text-gray-500">
          {{ registrationTerms[0].termName }}
        </span>
      </div>

      <div v-if="!summaryList.length"
        class="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-400 mb-6">
        <p class="text-lg font-medium">Nothing here yet — head to Courses to find something to register for.</p>
      </div>

      <!-- Mobile: day-picker strip → selected-day cards → collapsible full list -->
      <div class="md:hidden">
        <div class="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="day in DAYS"
            :key="day"
            class="h-10 w-10 flex-shrink-0 rounded-full text-sm font-bold transition-all"
            :class="selectedDay === day
              ? 'scale-110 bg-[#ac1a2f] text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            @click="selectedDay = day"
          >{{ DAY_LABELS[day] }}</button>
        </div>

        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {{ DAY_LONG_LABELS[selectedDay] }}
        </p>

        <div
          v-if="!selectedDayCourses.length"
          class="mb-4 rounded-xl bg-gray-100 px-4 py-6 text-center text-sm text-gray-400"
        >
          Nothing scheduled this day
        </div>
        <div
          v-for="block in selectedDayCourses"
          :key="block.courseKey"
          class="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-white"
          :class="block.isWaitlisted ? 'bg-amber-500' : 'bg-[#ac1a2f]'"
        >
          <div class="flex-1">
            <div class="text-sm font-semibold">{{ block.label }}</div>
            <div v-if="block.timeLabel" class="mt-0.5 text-xs opacity-80">{{ block.timeLabel }}</div>
          </div>
          <span v-if="block.isWaitlisted" class="flex-shrink-0 rounded bg-black/20 px-2 py-0.5 text-xs">Waitlisted</span>
        </div>

        <details class="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <summary class="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium">
            All Registered Courses
          </summary>
          <div class="border-t border-gray-100">
            <div v-if="!summaryList.length" class="px-4 py-6 text-center text-sm text-gray-400">No registrations</div>
            <div
              v-for="entry in summaryList"
              :key="entry.courseKey"
              class="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-sm font-medium">{{ entry.label }}</span>
                  <span v-if="entry.isWaitlisted" class="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Waitlisted</span>
                </div>
                <div class="mt-0.5 text-xs text-gray-500">{{ entry.faculty }}</div>
                <div class="text-xs text-gray-400">{{ entry.days || 'Online' }}</div>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <button
                  class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600"
                  @click="activeBooksSection = entry.section"
                >Books</button>
                <template v-if="authStore.sectionErrors[entry.courseKey]">
                  <span class="text-xs text-red-600">{{ authStore.sectionErrors[entry.courseKey] }}</span>
                  <button
                    class="ml-1 text-xs text-gray-500 hover:text-gray-700"
                    @click="authStore.dismissError(entry.courseKey)"
                  >Dismiss</button>
                </template>
                <button
                  v-else-if="!entry.isWaitlisted"
                  class="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  :disabled="droppingSections.has(entry.courseKey)"
                  @click="startDrop(entry)"
                >Drop</button>
                <button
                  v-else
                  class="rounded border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                  :disabled="droppingSections.has(entry.courseKey)"
                  @click="startWaitlistDrop(entry)"
                >Waitlist Drop</button>
              </div>
            </div>
          </div>
        </details>
      </div>

      <!-- Desktop: full-bleed grid + toggleable right panel -->
      <div class="relative hidden md:block">
        <div class="overflow-x-auto transition-all" :class="showListPanel ? 'mr-72' : ''">
          <div
            class="flex gap-px overflow-hidden rounded border border-gray-200 bg-gray-200"
            style="height: 600px"
          >
            <div
              v-for="day in DAYS"
              :key="day"
              class="flex min-w-[80px] flex-1 flex-col bg-white"
            >
              <div class="flex-shrink-0 border-b border-gray-100 py-1.5 text-center text-xs font-medium text-gray-400">
                {{ DAY_SHORT_LABELS[day] }}
              </div>
              <div class="relative flex-1">
                <div
                  v-for="block in gridBlocks.filter(b => b.days.includes(day))"
                  :key="block.courseKey"
                  data-testid="grid-block"
                  class="absolute left-1 right-1 overflow-hidden rounded-lg px-2 py-1 text-xs text-white shadow-sm"
                  :class="block.isWaitlisted ? 'bg-amber-500' : 'bg-[#ac1a2f]'"
                  :style="{ top: block.top + '%', height: Math.max(block.height, 4) + '%' }"
                >
                  <div class="font-semibold">{{ block.label }}</div>
                  <div v-if="block.timeLabel" class="text-[10px] opacity-80">{{ block.timeLabel }}</div>
                </div>
              </div>
            </div>
          </div>
          <p v-if="omittedCount > 0" class="mt-1.5 text-xs text-gray-500">
            {{ omittedCount }} section(s) not shown (online/async)
          </p>
        </div>

        <button
          class="fixed right-4 top-24 z-30 flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-xs text-white shadow-lg transition-colors hover:bg-gray-700"
          @click="showListPanel = !showListPanel"
        >
          {{ showListPanel ? '✕ Close' : '≡ Courses' }}
        </button>

        <Transition name="panel-slide">
          <div
            v-if="showListPanel"
            class="fixed bottom-0 right-0 top-0 z-20 w-72 overflow-y-auto border-l border-gray-200 bg-white pt-14 shadow-2xl"
          >
            <div class="border-b border-gray-100 px-4 py-3">
              <h2 class="text-sm font-semibold">Registered Courses</h2>
            </div>
            <div v-if="!summaryList.length" class="px-4 py-10 text-center text-sm text-gray-400">No registrations</div>
            <div
              v-for="entry in summaryList"
              :key="entry.courseKey"
              class="border-b border-gray-100 px-4 py-3 last:border-b-0"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-sm font-medium">{{ entry.label }}</span>
                    <span v-if="entry.isWaitlisted" class="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Waitlisted</span>
                  </div>
                  <div class="mt-0.5 text-xs text-gray-500">{{ entry.faculty }}</div>
                  <div class="text-xs text-gray-400">{{ entry.days || 'Online' }}</div>
                </div>
                <div class="mt-0.5 flex shrink-0 flex-col items-end gap-1">
                  <button
                    class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600"
                    @click="activeBooksSection = entry.section"
                  >Books</button>
                  <template v-if="authStore.sectionErrors[entry.courseKey]">
                    <span class="text-xs text-red-600">{{ authStore.sectionErrors[entry.courseKey] }}</span>
                    <button
                      class="ml-1 text-xs text-gray-500"
                      @click="authStore.dismissError(entry.courseKey)"
                    >Dismiss</button>
                  </template>
                  <button
                    v-else-if="!entry.isWaitlisted"
                    class="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    :disabled="droppingSections.has(entry.courseKey)"
                    @click="startDrop(entry)"
                  >Drop</button>
                  <button
                    v-else
                    class="rounded border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                    :disabled="droppingSections.has(entry.courseKey)"
                    @click="startWaitlistDrop(entry)"
                  >Waitlist Drop</button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

    </div>

    <BooklistModal
      v-if="activeBooksSection"
      :section="activeBooksSection"
      @close="activeBooksSection = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReferenceStore } from '@/stores/reference'
import { useScheduleRegistration } from '@/composables/useScheduleRegistration'
import BooklistModal from '@/components/BooklistModal.vue'

const DAYS = ['M', 'T', 'W', 'R', 'F', 'S', 'U']
const DAY_LABELS = { M: 'M', T: 'T', W: 'W', R: 'R', F: 'F', S: 'S', U: 'U' }
const DAY_SHORT_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri', S: 'Sat', U: 'Sun' }
const DAY_LONG_LABELS = { M: 'Monday', T: 'Tuesday', W: 'Wednesday', R: 'Thursday', F: 'Friday', S: 'Saturday', U: 'Sunday' }
const GRID_START_MINUTES = 6 * 60
const GRID_SPAN_MINUTES = 18 * 60

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

function toGridPercent(minutes) {
  return ((minutes - GRID_START_MINUTES) / GRID_SPAN_MINUTES) * 100
}

function formatTime(timeStr) {
  const m = parseTimeMinutes(timeStr)
  if (m === null) return timeStr ?? ''
  const h = Math.floor(m / 60)
  const min = m % 60
  const period = h >= 12 ? 'pm' : 'am'
  const displayH = h > 12 ? h - 12 : h || 12
  return `${displayH}:${String(min).padStart(2, '0')}${period}`
}

    const authStore = useAuthStore()
    const referenceStore = useReferenceStore()
    const { drop, waitlistDrop } = useScheduleRegistration()

    const selectedDay = ref('M')
    const showListPanel = ref(false)

    const registrationTerms = computed(() => {
      const termIds = new Set([
        ...authStore.currentCourses.map((s) => s.Term),
        ...authStore.waitlist.map((s) => s.Term),
      ])
      return referenceStore.terms.filter(
        (t) => (t.toView === 'D' || t.toView === 'Y') && termIds.has(t.id),
      )
    })

    const defaultTermId = computed(() => {
      const dTerm = registrationTerms.value.find((t) => t.toView === 'D')
      return (dTerm ?? registrationTerms.value[0])?.id ?? null
    })

    const selectedTermId = ref(null)
    watch(registrationTerms, (terms) => {
      if (selectedTermId.value !== null && !terms.some((t) => t.id === selectedTermId.value)) {
        selectedTermId.value = null
      }
    })
    const resolvedTermId = computed(() => selectedTermId.value ?? defaultTermId.value)

    const termCourses = computed(() =>
      authStore.currentCourses.filter((s) => s.Term === resolvedTermId.value),
    )
    const termWaitlisted = computed(() =>
      authStore.waitlist.filter((s) => s.Term === resolvedTermId.value),
    )

    function sectionHasMeetingTime(sec) {
      return !!(sec.Days?.trim() && sec.StartTime?.trim())
    }

    function buildBlocks(sections, isWaitlisted) {
      return sections
        .filter(sectionHasMeetingTime)
        .map((sec) => {
          const startMin = parseTimeMinutes(sec.StartTime)
          const endMin = parseTimeMinutes(sec.EndTime)
          const top = startMin !== null ? Math.max(0, toGridPercent(startMin)) : 0
          const rawHeight =
            startMin !== null && endMin !== null
              ? ((endMin - startMin) / GRID_SPAN_MINUTES) * 100
              : 5
          const height = Math.min(rawHeight, 100 - top)
          const code = sec.SubjectCode?.trim()
          const num = sec.CourseNo?.trim()
          const label = (code && num) ? `${code}-${num}` : (sec.LongName?.slice(0, 20) ?? sec.CourseKey)
          return {
            courseKey: sec.CourseKey,
            days: (sec.Days ?? '').split(''),
            label,
            timeLabel:
              sec.StartTime && sec.EndTime
                ? `${formatTime(sec.StartTime)}–${formatTime(sec.EndTime)}`
                : '',
            top,
            height,
            isWaitlisted,
          }
        })
    }

    const gridBlocks = computed(() => [
      ...buildBlocks(termCourses.value, false),
      ...buildBlocks(termWaitlisted.value, true),
    ])

    const omittedCount = computed(() => {
      const all = [...termCourses.value, ...termWaitlisted.value]
      return all.filter((s) => !sectionHasMeetingTime(s)).length
    })

    const summaryList = computed(() => {
      const registered = termCourses.value.map((sec) => ({
        courseKey: sec.CourseKey,
        label: sec.LongName,
        faculty: sec.Faculty,
        days: sec.Days,
        startTime: sec.StartTime,
        endTime: sec.EndTime,
        isWaitlisted: false,
        section: sec,
      }))
      const waitlisted = termWaitlisted.value.map((sec) => ({
        courseKey: sec.CourseKey,
        label: sec.LongName,
        faculty: sec.Faculty,
        days: sec.Days,
        startTime: sec.StartTime,
        endTime: sec.EndTime,
        isWaitlisted: true,
        section: sec,
      }))
      return [...registered, ...waitlisted]
    })

    const selectedDayCourses = computed(() =>
      gridBlocks.value.filter((b) => b.days.includes(selectedDay.value)),
    )

    const activeBooksSection = ref(null)

    const pendingAction = ref(null)
    const droppingSections = reactive(new Set())

    function startDrop(entry) {
      pendingAction.value = { courseKey: entry.courseKey, action: 'drop', label: entry.label }
    }

    function startWaitlistDrop(entry) {
      pendingAction.value = { courseKey: entry.courseKey, action: 'waitlistDrop', label: entry.label }
    }

    async function confirmAction() {
      if (!pendingAction.value) return
      const { courseKey, action } = pendingAction.value
      pendingAction.value = null
      droppingSections.add(courseKey)
      try {
        if (action === 'drop') {
          await drop(courseKey)
        } else {
          await waitlistDrop(courseKey)
        }
      } finally {
        droppingSections.delete(courseKey)
      }
    }

</script>

<style scoped>
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.2s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
}
</style>

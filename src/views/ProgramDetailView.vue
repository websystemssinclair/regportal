<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useReferenceStore } from '@/stores/reference'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useCart } from '@/composables/useCart'
import { useRegisterNow } from '@/composables/useRegisterNow'
import { getProgram } from '@/services/programsService'
import { getCourseSections } from '@/services/sectionsService'
import router from '@/router'
import { isActionable, seatBadge, sectionLocation, sectionRoom } from '@/utils/section'
import { formatDays, formatTimeRange } from '@/utils/time'

const route = useRoute()
const referenceStore = useReferenceStore()
const authStore = useAuthStore()
const cartStore = useCartStore()
const maintenanceStore = useMaintenanceStore()
const cart = useCart()
const { sectionResults, registeringSections, registerNow, dismissResult } = useRegisterNow()

const program = ref(null)
const isLoading = ref(true)
const error = ref(null)

const expandedCourses = ref(new Set())
const sectionsByCode = ref({})
const loadingSections = ref(new Set())

const dTermId = computed(() => referenceStore.terms.find((t) => t.toView === 'D')?.id ?? null)

const completedCodesSet = computed(() => {
  if (!authStore.isAuthenticated || authStore.currentRole === 'Visitor') return new Set()
  return new Set(authStore.completedCourses.map((c) => c.courseCode))
})

onMounted(async () => {
  try {
    const code = route.params.programCode.replace(/\./g, '-')
    const { data } = await getProgram(code)
    program.value = data.rows?.[0] ?? null
  } catch (e) {
    error.value = 'Failed to load program.'
  } finally {
    isLoading.value = false
  }
})

async function toggleCourse(course) {
  const code = course.CourseCode
  if (expandedCourses.value.has(code)) {
    expandedCourses.value.delete(code)
    return
  }
  expandedCourses.value.add(code)
  if (sectionsByCode.value[code]) return

  const [subject, number] = code.split('-')
  if (!subject || !number || !dTermId.value) {
    sectionsByCode.value[code] = []
    return
  }

  loadingSections.value.add(code)
  try {
    const { data } = await getCourseSections(subject, number, dTermId.value)
    sectionsByCode.value[code] = data.rows ?? []
  } catch {
    sectionsByCode.value[code] = []
  } finally {
    loadingSections.value.delete(code)
  }
}

function addToScheduleBuilder(courseCode) {
  router.push(`/schedule-builder?course=${courseCode}`)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split(' ')[0].split('/')
  if (parts.length !== 3) return dateStr
  const [month, day, year] = parts.map(Number)
  const d = new Date(year, month - 1, day)
  if (isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d)
}

</script>

<template>
  <div class="min-h-screen bg-canvas">
    <div class="mx-auto max-w-4xl px-4 py-6">
      <router-link to="/programs" class="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">← Programs</router-link>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 mb-6">{{ program?.programName ?? 'Program Detail' }}</h1>
      <div v-if="isLoading" class="py-12 text-center text-sm text-gray-500">Loading…</div>
      <div v-else-if="error" class="py-12 text-center text-sm text-red-600">{{ error }}</div>

      <template v-else-if="program">
        <!-- Program metadata -->
        <div class="mb-6 rounded-xl border border-gray-200 bg-white px-6 py-5 space-y-3">
          <div>
            <span class="text-lg font-semibold text-gray-900">{{ program.programName }}</span>
            <span v-if="program.certificateType" class="ml-2 text-sm text-gray-500">— {{ program.certificateType }}</span>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div v-if="program.creditHours">
              <span class="font-medium text-gray-600">Credit Hours:</span>
              <span class="ml-1 text-gray-800">{{ program.creditHours }}</span>
            </div>
            <div v-if="program.department">
              <span class="font-medium text-gray-600">Department:</span>
              <span class="ml-1 text-gray-800">{{ program.department }}</span>
            </div>
            <div v-if="program.division">
              <span class="font-medium text-gray-600">Division:</span>
              <span class="ml-1 text-gray-800">{{ program.division }}</span>
            </div>
          </div>
          <p v-if="program.description" class="text-sm text-gray-700 leading-relaxed">{{ program.description }}</p>
          <p v-if="program.accreditation" class="text-xs text-gray-500 italic">{{ program.accreditation }}</p>
        </div>

        <!-- Course list -->
        <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <h2 class="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">Required Courses</h2>

          <div
            v-for="(course, idx) in program.programcourses"
            :key="idx"
            class="border-b border-gray-100 last:border-b-0"
          >
            <!-- Course row (actionable) -->
            <template v-if="course.dspType === 'Course'">
              <div
                data-testid="course-row"
                @click="toggleCourse(course)"
                class="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span class="text-xs text-gray-500 transition-transform" :class="expandedCourses.has(course.CourseCode) ? 'rotate-90' : ''">▶</span>
                <span class="flex-1 text-sm text-gray-800">
                  <span class="font-medium">{{ course.CourseCode }}</span>
                  — {{ course.LongName }}
                </span>
                <span class="shrink-0 text-xs text-gray-500">{{ course.creditHours }} cr</span>
                <span
                  v-if="completedCodesSet.has(course.CourseCode)"
                  class="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                >
                  Completed
                </span>
                <button
                  data-testid="add-to-schedule-btn"
                  @click.stop="addToScheduleBuilder(course.CourseCode)"
                  class="shrink-0 rounded-md bg-crimson px-3 py-1.5 touch:py-3.5 touch:px-4 text-xs font-medium text-white hover:bg-crimson-dark transition-colors"
                >
                  Add to Schedule Builder
                </button>
              </div>

              <!-- Sections accordion -->
              <div v-if="expandedCourses.has(course.CourseCode)" class="bg-gray-50 px-6 pb-3">
                <div v-if="loadingSections.has(course.CourseCode)" class="py-3 text-xs text-gray-500">Loading sections…</div>
                <div v-else-if="!sectionsByCode[course.CourseCode]?.length" class="py-3 text-xs text-gray-500">No D-term sections available.</div>
                <div
                  v-else
                  v-for="sec in sectionsByCode[course.CourseCode]"
                  :key="sec.SectionNo"
                  data-testid="section-row"
                  class="flex items-start justify-between gap-3 py-2 text-xs text-gray-700 border-b border-gray-200 last:border-b-0"
                >
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-mono font-medium text-gray-900">Sec {{ sec.SectionNo }}</span>
                      <span class="text-gray-600">{{ sectionLocation(sec) }}</span>
                      <span class="text-gray-500">
                        {{ formatDays(sec.Days) || 'Online' }}
                        <template v-if="sec.StartTime">{{ formatTimeRange(sec.StartTime, sec.EndTime) }}</template>
                      </span>
                    </div>
                    <div
                      v-for="(entry, i) in sec.additionalSched"
                      :key="i"
                      class="mt-0.5 text-gray-500"
                    >
                      {{ formatDays(entry.Days) }} {{ formatTimeRange(entry.startTime, entry.endTime) }}
                      <template v-if="sectionRoom(entry)"> · {{ sectionRoom(entry) }}</template>
                    </div>
                    <p v-if="sec.Faculty" class="mt-0.5 text-gray-500">{{ sec.Faculty }}</p>
                    <p v-if="sec.printedComments" class="mt-0.5 text-gray-500">{{ sec.printedComments }}</p>
                    <p v-if="sec.startDate" class="mt-0.5 text-gray-500">
                      Runs: {{ formatDate(sec.startDate) }}{{ sec.endDate ? ` – ${formatDate(sec.endDate)}` : '' }}
                    </p>
                    <div v-if="sec.otherFee || sec.labFee || /independent/i.test(sec.restrictions || '') || sec.specialProperty === 'Y'" class="mt-0.5 flex flex-wrap gap-1">
                      <span v-if="sec.otherFee" class="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">+ ${{ sec.otherFee }} fee</span>
                      <span v-if="sec.labFee" class="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">+ ${{ sec.labFee }} fee</span>
                      <span v-if="/independent/i.test(sec.restrictions || '')" class="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">Independent Study</span>
                      <span v-if="sec.specialProperty === 'Y'" class="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">Learning Community</span>
                    </div>
                  </div>
                  <div class="shrink-0 flex flex-col items-end gap-1.5">
                    <span
                      v-for="b in [seatBadge(sec)]" :key="'b'"
                      :class="b.cls"
                      class="rounded-full px-2.5 py-0.5 font-medium"
                    >{{ b.label }}</span>
                    <template v-if="sectionResults[sec.CourseKey]?.status === 'success'">
                      <span class="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
                        {{ sectionResults[sec.CourseKey].message }}
                      </span>
                    </template>
                    <template v-else>
                      <template v-if="authStore.isStudent && sec.status === 'Open' && isActionable(sec)">
                        <button
                          v-if="!cartStore.sections.some((c) => c.CourseKey === sec.CourseKey)"
                          @click="cart.add(sec)"
                          class="rounded border border-crimson px-3 py-1.5 text-xs font-medium text-crimson hover:bg-crimson hover:text-white transition-colors"
                        >Add to Cart</button>
                        <span v-else class="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">In Cart</span>
                      </template>
                      <template v-if="authStore.isStudent && isActionable(sec)">
                        <template v-if="sectionResults[sec.CourseKey]?.status === 'error'">
                          <span class="text-xs text-red-600">{{ sectionResults[sec.CourseKey].message }}</span>
                          <button @click="dismissResult(sec.CourseKey)" class="text-xs text-gray-500 underline hover:text-gray-600">Dismiss</button>
                        </template>
                        <button
                          v-else
                          @click="registerNow(sec)"
                          :disabled="registeringSections.has(String(sec.CourseKey)) || maintenanceStore.isBackendDown"
                          class="rounded bg-crimson px-3 py-1.5 text-xs font-medium text-white hover:bg-crimson-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >{{ sec.status === 'Open' ? 'Register Now' : 'Waitlist Now' }}</button>
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
                </div>
              </div>
            </template>

            <!-- Add.Req row (plain text) -->
            <div
              v-else-if="course.dspType === 'Add.Req'"
              data-testid="addreq-row"
              class="px-4 py-3 text-sm text-gray-600 italic"
            >
              {{ course.LongName }}
              <span class="ml-1 text-xs text-gray-500">({{ course.creditHours }} cr)</span>
            </div>

            <!-- Elective row (plain text) -->
            <div
              v-else-if="course.dspType === 'Elective'"
              data-testid="elective-row"
              class="px-4 py-3 text-sm text-gray-600 italic"
            >
              {{ course.LongName }}
              <span class="ml-1 text-xs text-gray-500">({{ course.creditHours }} cr)</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

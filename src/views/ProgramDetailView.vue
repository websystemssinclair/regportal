<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useReferenceStore } from '@/stores/reference'
import { useAuthStore } from '@/stores/auth'
import { getProgram } from '@/services/programsService'
import { getCourseSections } from '@/services/sectionsService'
import router from '@/router'

const route = useRoute()
const referenceStore = useReferenceStore()
const authStore = useAuthStore()

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
    const { data } = await getProgram(route.params.programCode)
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

function seatBadgeClass(status) {
  if (status === 'Open') return 'bg-green-100 text-green-800'
  if (status === 'Waitlist') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-[#ac1a2f] px-4 py-5">
      <div class="mx-auto max-w-4xl flex items-center gap-3">
        <router-link to="/programs" class="text-white/70 hover:text-white text-sm">← Programs</router-link>
        <h1 class="text-xl font-bold text-white">{{ program?.programName ?? 'Program Detail' }}</h1>
      </div>
    </div>

    <div class="mx-auto max-w-4xl px-4 py-6">
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
                <span class="text-xs text-gray-400 transition-transform" :class="expandedCourses.has(course.CourseCode) ? 'rotate-90' : ''">▶</span>
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
                  class="shrink-0 rounded-md bg-[#ac1a2f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8e1526] transition-colors"
                >
                  Add to Schedule Builder
                </button>
              </div>

              <!-- Sections accordion -->
              <div v-if="expandedCourses.has(course.CourseCode)" class="bg-gray-50 px-6 pb-3">
                <div v-if="loadingSections.has(course.CourseCode)" class="py-3 text-xs text-gray-400">Loading sections…</div>
                <div v-else-if="!sectionsByCode[course.CourseCode]?.length" class="py-3 text-xs text-gray-400">No D-term sections available.</div>
                <div
                  v-else
                  v-for="sec in sectionsByCode[course.CourseCode]"
                  :key="sec.SectionNo"
                  data-testid="section-row"
                  class="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-xs text-gray-700 border-b border-gray-200 last:border-b-0"
                >
                  <span class="font-medium text-gray-900">Sec {{ sec.SectionNo }}</span>
                  <span v-if="sec.Faculty">{{ sec.Faculty }}</span>
                  <span v-if="sec.Days">{{ sec.Days }} {{ sec.StartTime }}–{{ sec.EndTime }}</span>
                  <span v-if="sec.Building">{{ sec.Building }}</span>
                  <span
                    class="rounded-full px-2 py-0.5 font-medium"
                    :class="seatBadgeClass(sec.Status)"
                  >{{ sec.Status }}</span>
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
              <span class="ml-1 text-xs text-gray-400">({{ course.creditHours }} cr)</span>
            </div>

            <!-- Elective row (plain text) -->
            <div
              v-else-if="course.dspType === 'Elective'"
              data-testid="elective-row"
              class="px-4 py-3 text-sm text-gray-600 italic"
            >
              {{ course.LongName }}
              <span class="ml-1 text-xs text-gray-400">({{ course.creditHours }} cr)</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

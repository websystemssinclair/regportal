<script setup>
import { ref, computed } from 'vue'
import { useReferenceStore } from '@/stores/reference'

const referenceStore = useReferenceStore()

const searchQuery = ref('')
const selectedCareerId = ref(null)

const uniquePrograms = computed(() => {
  const seen = new Set()
  return referenceStore.programs.filter((p) => {
    if (seen.has(p.programCode)) return false
    seen.add(p.programCode)
    return true
  })
})

const filteredPrograms = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return uniquePrograms.value.filter((p) => {
    const matchesName = !q || p.programName.toLowerCase().includes(q)
    const matchesCareer = selectedCareerId.value === null || p.careerId === selectedCareerId.value
    return matchesName && matchesCareer
  })
})

const careerMap = computed(() => {
  const m = {}
  for (const c of referenceStore.careers) m[c.id] = c.careerName
  return m
})

function toggleCareer(id) {
  selectedCareerId.value = selectedCareerId.value === id ? null : id
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <div class="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 mb-6">Programs</h1>
      <!-- Name search -->
      <input
        data-testid="program-search-input"
        v-model="searchQuery"
        type="text"
        placeholder="Search programs…"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-crimson focus:outline-none"
      />

      <!-- Career filter chips -->
      <div v-if="referenceStore.careers.length" class="flex flex-wrap gap-2">
        <button
          v-for="career in referenceStore.careers"
          :key="career.id"
          data-testid="career-filter-chip"
          @click="toggleCareer(career.id)"
          class="rounded-full border px-3 py-1 touch:py-3.5 touch:px-4 text-xs font-medium transition-colors"
          :class="selectedCareerId === career.id
            ? 'border-crimson bg-crimson text-white'
            : 'border-gray-300 bg-white text-gray-700 hover:border-crimson hover:text-crimson'"
        >
          {{ career.careerName }}
        </button>
      </div>

      <!-- Programs list -->
      <div class="space-y-2">
        <div
          v-for="program in filteredPrograms"
          :key="program.programCode"
          data-testid="program-card"
          class="rounded-xl border border-gray-200 bg-white hover:border-crimson hover:shadow-sm transition-[border-color,box-shadow]"
        >
          <router-link
            data-testid="program-link"
            :to="`/programs/${program.programCode}`"
            class="flex items-center justify-between gap-3 px-4 py-3 text-inherit no-underline"
          >
            <span class="text-sm font-medium text-gray-900">{{ program.programName }}</span>
            <span
              v-if="careerMap[program.careerId]"
              class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {{ careerMap[program.careerId] }}
            </span>
          </router-link>
        </div>

        <p v-if="!filteredPrograms.length" class="py-8 text-center text-sm text-gray-500">
          No programs match that search. Try clearing the filter.
        </p>
      </div>
    </div>
  </div>
</template>

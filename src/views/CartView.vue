<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useCart } from '@/composables/useCart'
import { useReferenceStore } from '@/stores/reference'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useCartRegistration } from '@/composables/useCartRegistration'
import { useSectionErrorStore } from '@/stores/sectionErrors'
import { useToast } from 'primevue/usetoast'
import BooklistModal from '@/components/BooklistModal.vue'
import { groupSectionsByTerm } from '@/utils/cart'
import { isActionable } from '@/utils/section'
import { formatTimeRange, formatDays } from '@/utils/time'

const cartStore = useCartStore()
const cart = useCart()
const refStore = useReferenceStore()
const maintenanceStore = useMaintenanceStore()
const sectionErrorStore = useSectionErrorStore()
const { register, isTermRegistering } = useCartRegistration()
const toast = useToast()

onMounted(async () => {
  await cartStore.loadAvailability()
})

function termName(termId) {
  const t = refStore.terms.find((t) => t.id === termId)
  return t ? `${t.termName} (${termId})` : termId
}

function availBadgeClass(sec) {
  if (sec.status === 'Cancelled') return 'bg-gray-100 text-gray-500'
  if (sec.status === 'Open') return 'bg-green-100 text-green-800'
  return sec.waitListAllowed === 'Y' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
}

function availBadgeLabel(sec) {
  if (sec.status === 'Cancelled') return 'Cancelled'
  if (sec.status === 'Open') return 'Open'
  return sec.waitListAllowed === 'Y' ? 'Closed / Waitlist' : 'Closed'
}

function actionableInTerm(group) {
  return group.sections.filter(isActionable)
}

async function registerSection(termId, sec) {
  const action = sec.status === 'Open' ? 'add' : 'waitlist'
  const { succeeded } = await register(termId, [{ sectionId: sec.CourseKey, action }])
  if (succeeded > 0) toast.add({ severity: 'success', summary: `Registered for ${succeeded} section(s)`, life: 4000 })
}

const activeBooksSection = ref(null)
const groupedSections = computed(() => groupSectionsByTerm(cartStore.sections, refStore.terms))

async function registerAll(group) {
  const registrations = actionableInTerm(group).map((sec) => ({
    sectionId: sec.CourseKey,
    action: sec.status === 'Open' ? 'add' : 'waitlist',
  }))
  if (!registrations.length) return
  const { succeeded } = await register(group.termId, registrations)
  if (succeeded > 0) toast.add({ severity: 'success', summary: `Registered for ${succeeded} section(s)`, life: 4000 })
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <main class="mx-auto max-w-3xl px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">My Cart</h1>
        <router-link
          to="/booklist"
          class="text-sm text-crimson underline hover:text-crimson-dark"
        >View Booklist</router-link>
      </div>
      <!-- Maintenance banner -->
      <div
        v-if="maintenanceStore.isBackendDown"
        class="mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        {{ maintenanceStore.publicMessage || 'Registration is temporarily unavailable' }}
      </div>

      <div v-if="!cartStore.sections.length"
        class="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-500">
        <p class="text-lg font-medium">Your cart is empty — let's find your next class.</p>
      </div>

      <template v-else>
        <template v-for="meta in [
          { label: 'Current', groups: groupedSections.current },
          { label: 'Future', groups: groupedSections.future },
        ]" :key="meta.label">
          <section v-if="meta.groups.length" class="mb-6">
            <h2 class="mb-3 text-sm font-semibold text-gray-700">{{ meta.label }} Terms</h2>

            <div v-for="group in meta.groups" :key="group.termId" class="mb-4">
              <h3 class="mb-2 flex items-center justify-between rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">
                <span>{{ termName(group.termId) }}</span>
                <button
                  v-if="meta.label === 'Current' && actionableInTerm(group).length > 0"
                  @click="registerAll(group)"
                  :disabled="isTermRegistering(group.termId) || maintenanceStore.isBackendDown"
                  class="rounded bg-crimson px-2.5 py-0.5 touch:py-3.5 touch:px-4 text-xs font-medium text-white hover:bg-crimson-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >Register All</button>
              </h3>

              <ul class="space-y-2">
                <li v-for="sec in group.sections" :key="sec.CourseKey"
                  class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                      <span class="font-mono font-semibold text-crimson">
                        {{ (sec.SubjectCode ?? '').trim() }}-{{ (sec.CourseNo ?? '').trim() }}-{{ sec.SectionNo }}
                      </span>
                      <span class="text-gray-700">{{ sec.LongName }}</span>
                    </div>
                    <p class="mt-0.5 text-xs text-gray-500">
                      {{ sec.Faculty || '' }}
                      <template v-if="sec.Days">· {{ formatDays(sec.Days) }}</template>
                      <template v-if="sec.StartTime"> · {{ formatTimeRange(sec.StartTime, sec.EndTime) }}</template>
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <span :class="availBadgeClass(sec)" class="rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {{ availBadgeLabel(sec) }}
                    </span>
                    <!-- Inline error (replaces action buttons) -->
                    <template v-if="sectionErrorStore.errors[sec.CourseKey]">
                      <span class="text-xs text-red-600">{{ sectionErrorStore.errors[sec.CourseKey] }}</span>
                      <button
                        @click="sectionErrorStore.dismiss(sec.CourseKey)"
                        class="text-xs text-gray-500 underline hover:text-gray-600"
                      >Dismiss</button>
                    </template>
                    <!-- Action buttons (Current term, actionable, no error) -->
                    <button
                      v-else-if="meta.label === 'Current' && isActionable(sec)"
                      @click="registerSection(group.termId, sec)"
                      :disabled="isTermRegistering(group.termId) || maintenanceStore.isBackendDown"
                      class="rounded bg-crimson px-2.5 py-1 touch:py-3.5 touch:px-4 text-xs font-medium text-white hover:bg-crimson-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >{{ sec.status === 'Open' ? 'Add' : 'Waitlist' }}</button>
                    <button
                      @click="activeBooksSection = sec"
                      class="rounded border border-gray-300 px-2.5 py-1 touch:py-3.5 touch:px-4 text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >Books</button>
                    <button
                      @click="cart.remove(sec.CourseKey)"
                      class="rounded border border-gray-300 px-2.5 py-1 touch:py-3.5 touch:px-4 text-xs text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </template>
      </template>
    </main>

    <BooklistModal
      v-if="activeBooksSection"
      :section="activeBooksSection"
      @close="activeBooksSection = null"
    />
  </div>
</template>

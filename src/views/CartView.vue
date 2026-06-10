<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useReferenceStore } from '@/stores/reference'

const cartStore = useCartStore()
const refStore = useReferenceStore()

onMounted(async () => {
  if (!refStore.terms.length) await refStore.load()
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
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="bg-[#ac1a2f] px-4 py-8">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-2xl font-bold text-white text-center">My Cart</h1>
      </div>
    </div>

    <main class="mx-auto max-w-3xl px-4 py-6">
      <div v-if="!cartStore.sections.length"
        class="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-400">
        <p class="text-lg font-medium">Your cart is empty</p>
        <p class="mt-1 text-sm">Search for courses and add sections to get started.</p>
      </div>

      <template v-else>
        <template v-for="meta in [
          { label: 'Current', groups: cartStore.groupedSections.current },
          { label: 'Future', groups: cartStore.groupedSections.future },
        ]" :key="meta.label">
          <section v-if="meta.groups.length" class="mb-6">
            <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{{ meta.label }}</h2>

            <div v-for="group in meta.groups" :key="group.termId" class="mb-4">
              <h3 class="mb-2 rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">
                {{ termName(group.termId) }}
              </h3>

              <ul class="space-y-2">
                <li v-for="sec in group.sections" :key="sec.CourseKey"
                  class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                      <span class="font-mono font-semibold text-[#ac1a2f]">
                        {{ (sec.SubjectCode ?? '').trim() }}-{{ (sec.CourseNo ?? '').trim() }}-{{ sec.SectionNo }}
                      </span>
                      <span class="text-gray-700">{{ sec.LongName }}</span>
                    </div>
                    <p class="mt-0.5 text-xs text-gray-400">
                      {{ sec.Faculty || '' }}
                      <template v-if="sec.Days">· {{ sec.Days }}</template>
                      <template v-if="sec.StartTime">{{ sec.StartTime }}–{{ sec.EndTime }}</template>
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <span :class="availBadgeClass(sec)" class="rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {{ availBadgeLabel(sec) }}
                    </span>
                    <button
                      @click="cartStore.remove(sec.CourseKey)"
                      class="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
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
  </div>
</template>

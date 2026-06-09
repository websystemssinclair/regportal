<script setup>
import { ref, computed } from 'vue'
import DOMPurify from 'dompurify'
import { useReferenceStore } from '@/stores/reference'

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
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-6">
    <section
      v-if="reference.intro"
      class="intro-banner mb-6 rounded border-l-4 border-[#ac1a2f] bg-white p-4 text-sm leading-relaxed text-gray-800"
      v-html="sanitizedIntro"
    />

    <div
      v-if="upcomingKeyDates.length"
      class="overflow-hidden rounded bg-[#ac1a2f]"
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
          class="shrink-0 whitespace-nowrap px-6 py-2.5 text-sm font-medium text-white"
        >
          {{ date.description }} &bull; {{ formatDate(date.keyDate) }}
        </span>
      </div>
    </div>
  </main>
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
</style>

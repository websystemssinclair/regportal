<template>
  <main class="min-h-screen bg-canvas flex flex-col items-center justify-center pb-16 px-6">
    <div class="w-full max-w-[420px] flex flex-col items-center text-center">

      <!-- Identity anchor — no nav on this route -->
      <p class="text-crimson font-semibold text-lg tracking-tight mb-12">Sinclair</p>

      <!-- Maintenance status indicator -->
      <span
        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 border border-amber-200 mb-5"
        aria-hidden="true"
      >
        <svg
          class="w-5 h-5 text-amber-600"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </span>

      <!-- Heading -->
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 mb-3">
        Site Maintenance
      </h1>

      <!-- Dynamic message with fallback -->
      <p class="text-sm text-gray-600 leading-relaxed max-w-sm mb-8">
        {{ displayMessage }}
      </p>

      <!-- Support contact -->
      <a
        href="mailto:websystems@sinclair.edu"
        class="text-xs text-gray-500 hover:text-gray-600 motion-safe:transition-colors underline underline-offset-2 decoration-gray-300 hover:decoration-gray-500"
      >Contact IT Support</a>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useMaintenanceStore } from '@/stores/maintenance'

const store = useMaintenanceStore()

const displayMessage = computed(() =>
  store.publicMessage || 'We\'ll be back shortly. Thank you for your patience.'
)
</script>

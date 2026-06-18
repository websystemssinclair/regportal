<template>
  <main class="p-8">
    <h1 class="text-2xl font-bold">Site Maintenance</h1>
    <p v-if="message" class="mt-4">{{ message }}</p>
  </main>
</template>

<script setup>
import { useMaintenanceStore } from '@/stores/maintenance'

const store = useMaintenanceStore()
const message = store.publicMessage
</script>

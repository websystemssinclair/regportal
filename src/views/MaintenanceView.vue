<template>
  <main class="p-8">
    <h1 class="text-2xl font-bold">Site Maintenance</h1>
    <p v-if="message" class="mt-4">{{ message }}</p>
  </main>
</template>

<script>
import { useMaintenanceStore } from '@/stores/maintenance'

export default {
  setup() {
    const store = useMaintenanceStore()
    return { message: store.publicMessage }
  },
}
</script>

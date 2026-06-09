<template>
  <main class="p-8">
    <h1 class="text-2xl font-bold">Redirecting to login...</h1>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

onMounted(() => {
  const id = route.query.ID
  if (id) {
    auth.handleCallback(id)
  } else {
    auth.login()
  }
})
</script>

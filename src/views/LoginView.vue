<template>
  <main class="p-8">
    <h1 class="text-2xl font-bold">Redirecting to login...</h1>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCart } from '@/composables/useCart'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCart()

onMounted(async () => {
  const id = route.query.ID
  if (id) {
    const { shoppingCart, targetUrl } = await auth.handleCallback(id)
    if (shoppingCart !== null) await cart.mergeOnLogin(shoppingCart)
    router.replace(targetUrl)
  } else {
    auth.login()
  }
})
</script>

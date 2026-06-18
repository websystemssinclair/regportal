<script setup>
import { watch, onMounted } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useReferenceStore } from '@/stores/reference'
import { useCartStore } from '@/stores/cart'
import AppNav from '@/components/AppNav.vue'

const referenceStore = useReferenceStore()
const cartStore = useCartStore()
const toast = useToast()

onMounted(() => referenceStore.load())

watch(
  () => cartStore.mergeCarryOver,
  (count) => {
    if (count == null) return
    toast.add({ severity: 'success', summary: `${count} section${count === 1 ? '' : 's'} added to your Cart`, life: 4000 })
    cartStore.mergeCarryOver = null
  },
)
</script>

<template>
  <AppNav />
  <Toast />
  <RouterView />
</template>

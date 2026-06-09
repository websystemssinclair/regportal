<script setup>
import { onMounted } from 'vue'
import { useReferenceStore } from '@/stores/reference'

const referenceStore = useReferenceStore()
onMounted(() => referenceStore.load())
</script>

<template>
  <RouterView />
</template>

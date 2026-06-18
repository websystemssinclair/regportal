<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()

const drawerOpen = ref(false)

const HIDDEN_ROUTES = new Set(['login', '403', 'maintenance'])

function isActive(path) {
  return route.path.startsWith(path)
}

function closeDrawer() {
  drawerOpen.value = false
}
</script>

<template>
  <template v-if="!HIDDEN_ROUTES.has(route.name)">
    <nav class="sticky top-0 z-50 bg-white border-b border-black/10">
      <div class="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">

        <!-- Wordmark -->
        <RouterLink to="/" class="text-crimson font-semibold text-lg tracking-tight">
          Sinclair
        </RouterLink>

        <!-- Desktop center links -->
        <div class="hidden md:flex items-center gap-6 text-sm font-medium">
          <RouterLink
            to="/"
            :class="route.path === '/' ? 'text-crimson' : 'text-gray-600 hover:text-gray-900 transition-colors'"
          >Courses</RouterLink>
          <RouterLink
            to="/programs"
            :class="isActive('/programs') ? 'text-crimson' : 'text-gray-600 hover:text-gray-900 transition-colors'"
          >Programs</RouterLink>
          <RouterLink
            to="/schedule-builder"
            :class="isActive('/schedule-builder') ? 'text-crimson' : 'text-gray-600 hover:text-gray-900 transition-colors'"
          >Schedule Builder</RouterLink>
          <RouterLink
            to="/my-schedule"
            :class="isActive('/my-schedule') ? 'text-crimson' : 'text-gray-600 hover:text-gray-900 transition-colors'"
          >My Schedule</RouterLink>
        </div>

        <!-- Desktop right -->
        <div class="hidden md:flex items-center gap-3">
          <RouterLink to="/cart" class="relative p-1 text-gray-600 hover:text-gray-900 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            <span
              v-if="cartStore.sections.length"
              class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-crimson text-white text-[10px] font-medium flex items-center justify-center leading-none"
            >{{ cartStore.sections.length }}</span>
          </RouterLink>

          <span v-if="authStore.isAuthenticated" class="text-sm font-medium text-gray-700">
            {{ authStore.user.firstName }}
          </span>
          <button
            v-else
            @click="authStore.login()"
            class="bg-crimson text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-crimson-dark transition-colors"
          >Sign In</button>
        </div>

        <!-- Mobile hamburger -->
        <button
          class="md:hidden p-1 text-gray-600 hover:text-gray-900"
          :aria-label="drawerOpen ? 'Close menu' : 'Open menu'"
          @click="drawerOpen = !drawerOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path v-if="!drawerOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile drawer -->
      <Transition name="fade">
        <div v-if="drawerOpen" class="md:hidden border-t border-black/10 bg-white px-4 py-4 flex flex-col gap-4">
          <RouterLink
            to="/"
            :class="['text-sm font-medium', route.path === '/' ? 'text-crimson' : 'text-gray-700']"
            @click="closeDrawer"
          >Courses</RouterLink>
          <RouterLink
            to="/programs"
            :class="['text-sm font-medium', isActive('/programs') ? 'text-crimson' : 'text-gray-700']"
            @click="closeDrawer"
          >Programs</RouterLink>
          <RouterLink
            to="/schedule-builder"
            :class="['text-sm font-medium', isActive('/schedule-builder') ? 'text-crimson' : 'text-gray-700']"
            @click="closeDrawer"
          >Schedule Builder</RouterLink>
          <RouterLink
            to="/my-schedule"
            :class="['text-sm font-medium', isActive('/my-schedule') ? 'text-crimson' : 'text-gray-700']"
            @click="closeDrawer"
          >My Schedule</RouterLink>
          <RouterLink
            to="/cart"
            :class="['text-sm font-medium flex items-center gap-2', isActive('/cart') ? 'text-crimson' : 'text-gray-700']"
            @click="closeDrawer"
          >
            Cart
            <span
              v-if="cartStore.sections.length"
              class="min-w-[18px] h-[18px] px-1 rounded-full bg-crimson text-white text-[10px] font-medium flex items-center justify-center leading-none"
            >{{ cartStore.sections.length }}</span>
          </RouterLink>
          <div class="pt-2 border-t border-gray-100">
            <span v-if="authStore.isAuthenticated" class="text-sm font-medium text-gray-700">
              {{ authStore.user.firstName }}
            </span>
            <button
              v-else
              @click="authStore.login(); closeDrawer()"
              class="bg-crimson text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-crimson-dark transition-colors"
            >Sign In</button>
          </div>
        </div>
      </Transition>
    </nav>

    <!-- Backdrop: closes drawer on tap outside -->
    <Teleport to="body">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 z-40 md:hidden"
        @click="closeDrawer"
      />
    </Teleport>
  </template>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

import { createRouter, createWebHistory } from 'vue-router'
import { maintenanceGuard, roleGuard } from './guard'

const routes = [
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
  },
  {
    path: '/programs',
    name: 'programs',
    component: () => import('@/views/ProgramsListView.vue'),
  },
  {
    path: '/programs/:programCode',
    name: 'program-detail',
    component: () => import('@/views/ProgramDetailView.vue'),
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/CartView.vue'),
  },
  {
    path: '/schedule-builder',
    name: 'schedule-builder',
    component: () => import('@/views/ScheduleBuilderView.vue'),
  },
  {
    path: '/my-schedule',
    name: 'my-schedule',
    component: () => import('@/views/ScheduleView.vue'),
    meta: { roles: ['Student', 'Admin', 'Developer'] },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/ForbiddenView.vue'),
  },
  {
    path: '/maintenance',
    name: 'maintenance',
    component: () => import('@/views/MaintenanceView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(maintenanceGuard)
router.beforeEach(roleGuard)

export default router

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, computed, reactive, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import ScheduleBuilderView from '@/views/ScheduleBuilderView.vue'
import { useReferenceStore } from '@/stores/reference'
import { useBuilderCourses } from '@/composables/useBuilderCourses'
import { useScheduleBuilder } from '@/composables/useScheduleBuilder'
import { useRegisterSchedule } from '@/composables/useRegisterSchedule'

vi.mock('@/composables/useBuilderCourses')
vi.mock('@/composables/useScheduleBuilder')
vi.mock('@/composables/useRegisterSchedule')
vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useRoute: vi.fn(() => ({ query: {} })) }
})
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))
vi.mock('@/services/sectionsService', () => ({
  searchCourses: vi.fn().mockResolvedValue({ data: { rows: [], results: 0 } }),
  getCourseSections: vi.fn().mockResolvedValue({ data: { rows: [] } }),
  getAvailability: vi.fn(),
}))
vi.mock('@/services/referenceService', () => ({
  getReferenceData: vi.fn().mockResolvedValue({
    data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '' },
  }),
}))

const TERM_ID = '26SU'

function seedScheduleComposables() {
  vi.mocked(useScheduleBuilder).mockReturnValue({
    schedules: ref([]),
    isBuilding: ref(false),
    error: ref(null),
    count: computed(() => 0),
    build: vi.fn(),
    selectSchedule: vi.fn(),
    getCredits: vi.fn(() => 3),
  })
  vi.mocked(useRegisterSchedule).mockReturnValue({
    scheduleResults: reactive({}),
    registeringSchedules: reactive(new Set()),
    registerSchedule: vi.fn(),
    reset: vi.fn(),
  })
}

function seedBuilderCourses(codes = []) {
  const codesRef = ref(codes)
  const addMock = vi.fn()
  const removeMock = vi.fn()
  const clearMock = vi.fn()
  vi.mocked(useBuilderCourses).mockReturnValue({
    codes: codesRef,
    add: addMock,
    remove: removeMock,
    clear: clearMock,
  })
  return { codesRef, addMock, removeMock, clearMock }
}

describe('ScheduleBuilderView — persistence via useBuilderCourses', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    seedScheduleComposables()

    const refStore = useReferenceStore()
    refStore.terms = [{ id: TERM_ID, termName: 'Summer 2026', toView: 'D' }]
  })

  function mountView() {
    return mount(ScheduleBuilderView, { global: { plugins: [pinia] } })
  }

  it('on mount with persisted codes, chips appear for each code', async () => {
    seedBuilderCourses(['ACC-1210', 'MAT-1470'])
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.findAll('[data-testid="course-chip"]')).toHaveLength(2)
  })

  it('"Clear all" button is hidden when no courses are selected', async () => {
    seedBuilderCourses([])
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.find('[data-testid="clear-builder-btn"]').exists()).toBe(false)
  })

  it('"Clear all" button is visible when at least one course is selected', async () => {
    seedBuilderCourses(['ACC-1210'])
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    expect(wrapper.find('[data-testid="clear-builder-btn"]').exists()).toBe(true)
  })

  it('clicking "Clear all" calls useBuilderCourses.clear() and removes all chips', async () => {
    const { clearMock } = seedBuilderCourses(['ACC-1210'])
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    await wrapper.find('[data-testid="clear-builder-btn"]').trigger('click')
    expect(clearMock).toHaveBeenCalledOnce()
    expect(wrapper.findAll('[data-testid="course-chip"]')).toHaveLength(0)
  })

  it('clicking chip × calls useBuilderCourses.remove() with the code', async () => {
    const { removeMock } = seedBuilderCourses(['ACC-1210'])
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    await wrapper.find('[data-testid="course-chip"] button').trigger('click')
    expect(removeMock).toHaveBeenCalledWith('ACC-1210')
  })
})

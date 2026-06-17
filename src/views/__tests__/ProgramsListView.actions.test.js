import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import ProgramsListView from '@/views/ProgramsListView.vue'
import { useReferenceStore } from '@/stores/reference'

vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  sendSamlRequest: vi.fn(),
  retrieveUserFromSaml: vi.fn(),
  getUserData: vi.fn(),
}))
vi.mock('@/services/referenceService', () => ({
  getReferenceData: vi.fn().mockResolvedValue({
    data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '', careers: [], programs: [] },
  }),
}))
vi.mock('@/services/cartService', () => ({ saveCart: vi.fn() }))

const CAREERS = [
  { id: 12, careerName: 'Business & Information Technology' },
  { id: 9, careerName: 'Health Sciences' },
]

const PROGRAMS = [
  { programCode: 'ACC.S.AAS', programName: 'Accounting (AAS)', careerId: 12 },
  { programCode: 'ACC.S.CRT', programName: 'Accounting (Certificate)', careerId: 12 },
  { programCode: 'NUR.S.AAS', programName: 'Nursing (AAS)', careerId: 9 },
  { programCode: 'BIO.S.AAS', programName: 'Biology (AAS)', careerId: 9 },
]

let pinia

function mountView() {
  return mount(ProgramsListView, {
    global: {
      plugins: [pinia],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('ProgramsListView', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()

    const refStore = useReferenceStore()
    refStore.careers = CAREERS
    refStore.programs = PROGRAMS
  })

  it('renders all unique programs on load', async () => {
    const wrapper = mountView()
    await nextTick()
    const cards = wrapper.findAll('[data-testid="program-card"]')
    expect(cards).toHaveLength(4)
  })

  it('deduplicates programs by programCode', async () => {
    const refStore = useReferenceStore()
    refStore.programs = [
      ...PROGRAMS,
      { programCode: 'ACC.S.AAS', programName: 'Accounting (AAS) duplicate', careerId: 12 },
    ]
    const wrapper = mountView()
    await nextTick()
    const cards = wrapper.findAll('[data-testid="program-card"]')
    expect(cards).toHaveLength(4)
  })

  it('filters programs by name search', async () => {
    const wrapper = mountView()
    await nextTick()
    const input = wrapper.find('[data-testid="program-search-input"]')
    await input.setValue('accounting')
    await nextTick()
    const cards = wrapper.findAll('[data-testid="program-card"]')
    expect(cards).toHaveLength(2)
    expect(wrapper.text()).toContain('Accounting (AAS)')
    expect(wrapper.text()).toContain('Accounting (Certificate)')
  })

  it('name filter is case-insensitive', async () => {
    const wrapper = mountView()
    await nextTick()
    const input = wrapper.find('[data-testid="program-search-input"]')
    await input.setValue('NURSING')
    await nextTick()
    expect(wrapper.findAll('[data-testid="program-card"]')).toHaveLength(1)
  })

  it('renders career filter chips for each career', async () => {
    const wrapper = mountView()
    await nextTick()
    const chips = wrapper.findAll('[data-testid="career-filter-chip"]')
    expect(chips).toHaveLength(2)
  })

  it('clicking a career chip filters programs to that career', async () => {
    const wrapper = mountView()
    await nextTick()
    const chips = wrapper.findAll('[data-testid="career-filter-chip"]')
    await chips[1].trigger('click') // Health Sciences (id=9)
    await nextTick()
    const cards = wrapper.findAll('[data-testid="program-card"]')
    expect(cards).toHaveLength(2)
    expect(wrapper.text()).toContain('Nursing (AAS)')
    expect(wrapper.text()).toContain('Biology (AAS)')
  })

  it('clicking the active career chip deselects it and shows all programs again', async () => {
    const wrapper = mountView()
    await nextTick()
    const chips = wrapper.findAll('[data-testid="career-filter-chip"]')
    await chips[0].trigger('click') // select
    await chips[0].trigger('click') // deselect
    await nextTick()
    expect(wrapper.findAll('[data-testid="program-card"]')).toHaveLength(4)
  })

  it('name filter and career filter combine with AND logic', async () => {
    const wrapper = mountView()
    await nextTick()
    const chips = wrapper.findAll('[data-testid="career-filter-chip"]')
    await chips[0].trigger('click') // Business & IT (id=12)
    const input = wrapper.find('[data-testid="program-search-input"]')
    await input.setValue('accounting')
    await nextTick()
    expect(wrapper.findAll('[data-testid="program-card"]')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Nursing')
  })

  it('each program card shows a career badge with the career name', async () => {
    const wrapper = mountView()
    await nextTick()
    const cards = wrapper.findAll('[data-testid="program-card"]')
    const firstCardText = cards[0].text()
    expect(firstCardText).toContain('Business & Information Technology')
  })

  it('each program card links to /programs/:programCode', async () => {
    const wrapper = mountView()
    await nextTick()
    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links[0].props('to')).toBe('/programs/ACC.S.AAS')
  })
})

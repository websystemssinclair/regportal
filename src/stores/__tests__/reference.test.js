import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReferenceStore } from '@/stores/reference'

vi.mock('@/services/referenceService', () => ({
  getReferenceData: vi.fn(),
}))

import { getReferenceData } from '@/services/referenceService'

describe('referenceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('defaults to empty keyDates, empty intro, empty maintenance, empty terms, empty locations, and empty currentTerm', () => {
    const store = useReferenceStore()
    expect(store.keyDates).toEqual([])
    expect(store.intro).toBe('')
    expect(store.maintenance).toEqual([])
    expect(store.terms).toEqual([])
    expect(store.locations).toEqual([])
    expect(store.currentTerm).toBe('')
  })

  describe('upcomingKeyDates', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-09'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('is empty when keyDates is empty', () => {
      const store = useReferenceStore()
      expect(store.upcomingKeyDates).toEqual([])
    })

    it('sorts remaining dates ascending by date', () => {
      const store = useReferenceStore()
      store.keyDates = [
        { id: '2', description: 'Later', keyDate: '2026-08-01' },
        { id: '1', description: 'Sooner', keyDate: '2026-06-15' },
      ]
      const result = store.upcomingKeyDates
      expect(result[0].keyDate).toBe('2026-06-15')
      expect(result[1].keyDate).toBe('2026-08-01')
    })

    it('excludes dates before today', () => {
      const store = useReferenceStore()
      store.keyDates = [
        { id: '1', description: 'Past event', keyDate: '2026-06-08' },
        { id: '2', description: 'Future event', keyDate: '2026-06-15' },
      ]
      expect(store.upcomingKeyDates).toEqual([
        { id: '2', description: 'Future event', keyDate: '2026-06-15' },
      ])
    })
  })

  it('load() populates keyDates, intro, and maintenance from the response', async () => {
    const keyDates = [{ id: '1', description: 'Last day to drop', keyDate: '2026-08-01' }]
    const intro = '<p>Welcome to Sinclair.</p>'
    const maintenance = [{ id: '1', maintCopy: 'Down for maintenance.', maintType: 'regular', startTime: '6/1/2026 10:00:00', endTime: '6/1/2026 12:00:00' }]
    getReferenceData.mockResolvedValue({ data: { keyDates, intro, maintenance, terms: [], currentTerm: '' } })

    const store = useReferenceStore()
    await store.load()

    expect(store.keyDates).toEqual(keyDates)
    expect(store.intro).toBe(intro)
    expect(store.maintenance).toEqual(maintenance)
  })

  it('load() populates terms and currentTerm from the response', async () => {
    const terms = [
      { id: '26SU', termName: 'Summer Semester', toView: 'D' },
      { id: '26FA', termName: 'Fall Semester', toView: 'Y' },
      { id: '27SP', termName: 'Spring Semester', toView: 'F' },
    ]
    const currentTerm = '26SU'
    getReferenceData.mockResolvedValue({ data: { keyDates: [], intro: '', maintenance: [], terms, currentTerm } })

    const store = useReferenceStore()
    await store.load()

    expect(store.terms).toEqual(terms)
    expect(store.currentTerm).toBe(currentTerm)
  })

  it('load() populates locations from the response', async () => {
    const locations = [
      { id: 'any', building: 'All Locations' },
      { id: 'SCC', building: 'Sinclair Dayton Campus' },
      { id: 'CENT', building: 'Centerville Campus' },
    ]
    getReferenceData.mockResolvedValue({ data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '', locations } })

    const store = useReferenceStore()
    await store.load()

    expect(store.locations).toEqual(locations)
  })

  it('load() defaults locations to [] when not present in response', async () => {
    getReferenceData.mockResolvedValue({ data: { keyDates: [], intro: '', maintenance: [], terms: [], currentTerm: '' } })

    const store = useReferenceStore()
    await store.load()

    expect(store.locations).toEqual([])
  })
})

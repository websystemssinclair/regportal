import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCardExpansion } from '@/composables/useCardExpansion'

vi.mock('@/services/sectionsService', () => ({
  getCourseSections: vi.fn(),
  getCourseDetails: vi.fn(),
}))

import { getCourseSections, getCourseDetails } from '@/services/sectionsService'

const course = { id: 'c1', SubjectCode: 'ACC ', CourseNumber: '1100 ', Term: '26FA' }

function makeFilters() {
  return {
    building: 'any',
    daysOfWeek: 'M,T,W,R,F,S,U',
    timeChoice: 'segments',
    segOptions: 'any',
    rangeStart: '06:00',
    rangeEnd: '23:00',
    creditHoursMin: 0,
    creditHoursMax: 15,
    termFormat: 'all',
  }
}

describe('useCardExpansion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCourseSections.mockResolvedValue({ data: { rows: [] } })
    getCourseDetails.mockResolvedValue({ data: {} })
  })

  it('toggleCard() calls getCourseSections with trimmed subject/number and current filters', async () => {
    const { toggleCard } = useCardExpansion(makeFilters())
    await toggleCard(course)
    expect(getCourseSections).toHaveBeenCalledWith('ACC', '1100', '26FA', expect.objectContaining({
      building: 'any',
      termFormat: 'all',
    }))
  })

  it('toggleCard() calls getCourseDetails with trimmed subject/number/term', async () => {
    const { toggleCard } = useCardExpansion(makeFilters())
    await toggleCard(course)
    expect(getCourseDetails).toHaveBeenCalledWith('ACC', '1100', '26FA')
  })

  it('toggleCard() stores course details in detailsByCard keyed by course id', async () => {
    const detail = { coReqs: 'MAT 1470', topicLink: 'https://example.com', previewLink: '' }
    getCourseDetails.mockResolvedValue({ data: detail })
    const { toggleCard, detailsByCard } = useCardExpansion(makeFilters())
    await toggleCard(course)
    expect(detailsByCard.value[course.id]).toEqual(detail)
  })

  it('re-expanding the same card does not re-fetch sections or details', async () => {
    const { toggleCard } = useCardExpansion(makeFilters())
    await toggleCard(course)   // expand
    await toggleCard(course)   // collapse
    await toggleCard(course)   // re-expand
    expect(getCourseSections).toHaveBeenCalledTimes(1)
    expect(getCourseDetails).toHaveBeenCalledTimes(1)
  })

  it('toggleCard() collapses the card when it is already expanded', async () => {
    const { toggleCard, expanded } = useCardExpansion(makeFilters())
    await toggleCard(course)
    expect(expanded.value).toBe(course.id)
    await toggleCard(course)
    expect(expanded.value).toBeNull()
  })

  it('loadingCard is set to course.id during fetch and null after', async () => {
    let loadingDuring = null
    getCourseSections.mockImplementation(async () => {
      loadingDuring = 'c1'
      return { data: { rows: [] } }
    })
    const { toggleCard, loadingCard } = useCardExpansion(makeFilters())
    await toggleCard(course)
    expect(loadingDuring).toBe(course.id)
    expect(loadingCard.value).toBeNull()
  })

  it('toggleCard() records a section error when the fetch fails', async () => {
    getCourseSections.mockRejectedValue(new Error('network error'))
    const { toggleCard, sectionErrors } = useCardExpansion(makeFilters())
    await toggleCard(course)
    expect(sectionErrors.value[course.id]).toBe(true)
  })

  it('sectionsToShow returns first 20 rows; showAllSections reveals all', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ SectionNo: `${i + 1}` }))
    getCourseSections.mockResolvedValue({ data: { rows } })
    const { toggleCard, sectionsToShow, showAllSections } = useCardExpansion(makeFilters())
    await toggleCard(course)
    expect(sectionsToShow(course.id)).toHaveLength(20)
    showAllSections(course.id)
    expect(sectionsToShow(course.id)).toHaveLength(25)
  })
})

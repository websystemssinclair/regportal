import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBuilderCourses } from '@/composables/useBuilderCourses'

const STORAGE_KEY = 'regportal:builder:courses'

describe('useBuilderCourses', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('add()', () => {
    it('adds a new code to the list', () => {
      const { codes, add } = useBuilderCourses()
      add(['ACC-1210'])
      expect(codes.value).toContain('ACC-1210')
    })

    it('does not duplicate a code already in the list', () => {
      const { codes, add } = useBuilderCourses()
      add(['ACC-1210'])
      add(['ACC-1210'])
      expect(codes.value).toHaveLength(1)
    })

    it('adds multiple codes in one call', () => {
      const { codes, add } = useBuilderCourses()
      add(['ACC-1210', 'MAT-1470'])
      expect(codes.value).toEqual(expect.arrayContaining(['ACC-1210', 'MAT-1470']))
      expect(codes.value).toHaveLength(2)
    })

    it('writes codes to localStorage after adding', () => {
      const { add } = useBuilderCourses()
      add(['ACC-1210'])
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toContain('ACC-1210')
    })

    it('treats a bare string as a single code, not individual characters', () => {
      const { codes, add } = useBuilderCourses()
      add('ACC-1210')
      expect(codes.value).toEqual(['ACC-1210'])
    })

    it('does not write localStorage when all codes are already present', () => {
      const { add } = useBuilderCourses()
      add(['ACC-1210'])
      const spy = vi.spyOn(localStorage, 'setItem')
      add(['ACC-1210'])
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('remove()', () => {
    it('removes the matching code and leaves others untouched', () => {
      const { codes, add, remove } = useBuilderCourses()
      add(['ACC-1210', 'MAT-1470'])
      remove('ACC-1210')
      expect(codes.value).not.toContain('ACC-1210')
      expect(codes.value).toContain('MAT-1470')
    })

    it('writes the updated list to localStorage after removing', () => {
      const { add, remove } = useBuilderCourses()
      add(['ACC-1210', 'MAT-1470'])
      remove('ACC-1210')
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).not.toContain('ACC-1210')
    })
  })

  describe('clear()', () => {
    it('empties the list', () => {
      const { codes, add, clear } = useBuilderCourses()
      add(['ACC-1210', 'MAT-1470'])
      clear()
      expect(codes.value).toHaveLength(0)
    })

    it('writes the empty list to localStorage after clearing', () => {
      const { add, clear } = useBuilderCourses()
      add(['ACC-1210'])
      clear()
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(0)
    })
  })

  describe('init from localStorage', () => {
    it('reads existing codes on init so a second instance sees the same state', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['ACC-1210', 'MAT-1470']))
      setActivePinia(createPinia())
      const { codes } = useBuilderCourses()
      expect(codes.value).toEqual(expect.arrayContaining(['ACC-1210', 'MAT-1470']))
    })

    it('initialises to empty array when localStorage contains non-array JSON', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }))
      setActivePinia(createPinia())
      const { codes } = useBuilderCourses()
      expect(codes.value).toEqual([])
    })

    it('two live instances share reactive state without a reload', () => {
      const a = useBuilderCourses()
      const b = useBuilderCourses()
      a.add(['ACC-1210'])
      expect(b.codes.value).toContain('ACC-1210')
    })
  })

  describe('error resilience', () => {
    it('does not throw when localStorage.setItem is unavailable', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })
      const { add } = useBuilderCourses()
      expect(() => add(['ACC-1210'])).not.toThrow()
    })
  })
})

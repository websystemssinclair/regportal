import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSectionErrorStore } from '@/stores/sectionErrors'

describe('useSectionErrorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with an empty errors map', () => {
    const store = useSectionErrorStore()
    expect(store.errors).toEqual({})
  })

  describe('set()', () => {
    it('stores a message keyed by courseKey', () => {
      const store = useSectionErrorStore()
      store.set('111', 'Section is full')
      expect(store.errors['111']).toBe('Section is full')
    })

    it('coerces numeric courseKey to string', () => {
      const store = useSectionErrorStore()
      store.set(111, 'Section is full')
      expect(store.errors['111']).toBe('Section is full')
    })

    it('overwrites an existing error for the same key', () => {
      const store = useSectionErrorStore()
      store.set('111', 'First message')
      store.set('111', 'Updated message')
      expect(store.errors['111']).toBe('Updated message')
    })
  })

  describe('dismiss()', () => {
    it('removes the error for the given courseKey', () => {
      const store = useSectionErrorStore()
      store.set('111', 'Section is full')
      store.dismiss('111')
      expect(store.errors['111']).toBeUndefined()
    })

    it('leaves other errors intact', () => {
      const store = useSectionErrorStore()
      store.set('111', 'Section is full')
      store.set('222', 'Time conflict')
      store.dismiss('111')
      expect(store.errors['222']).toBe('Time conflict')
    })

    it('is a no-op when the key does not exist', () => {
      const store = useSectionErrorStore()
      expect(() => store.dismiss('999')).not.toThrow()
    })
  })

  describe('clear()', () => {
    it('removes all errors', () => {
      const store = useSectionErrorStore()
      store.set('111', 'Section is full')
      store.set('222', 'Time conflict')
      store.clear()
      expect(store.errors).toEqual({})
    })

    it('is a no-op on an already-empty store', () => {
      const store = useSectionErrorStore()
      expect(() => store.clear()).not.toThrow()
      expect(store.errors).toEqual({})
    })
  })
})

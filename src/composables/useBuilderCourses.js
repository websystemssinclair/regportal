import { storeToRefs } from 'pinia'
import { useBuilderCoursesStore, STORAGE_KEY } from '@/stores/builderCourses'

export function useBuilderCourses() {
  const store = useBuilderCoursesStore()
  const { codes } = storeToRefs(store)

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.codes))
    } catch {
      // localStorage unavailable (quota exceeded, private browsing)
    }
  }

  function add(input) {
    const list = Array.isArray(input) ? input : [input]
    const before = store.codes.length
    store.add(list)
    if (store.codes.length === before) return
    persist()
  }

  function remove(code) {
    store.remove(code)
    persist()
  }

  function clear() {
    store.clear()
    persist()
  }

  return {
    codes,
    add,
    remove,
    clear,
  }
}

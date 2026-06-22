import { ref, watch, nextTick } from 'vue'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(containerRef, isOpen, onEscape) {
  const previousFocus = ref(null)

  watch(isOpen, async (open) => {
    if (open) {
      previousFocus.value = document.activeElement
      await nextTick()
      containerRef.value?.querySelector(FOCUSABLE)?.focus()
    } else {
      previousFocus.value?.focus()
      previousFocus.value = null
    }
  })

  function handleKeydown(e) {
    if (!isOpen.value) return
    if (e.key === 'Escape') {
      onEscape?.()
      return
    }
    if (e.key !== 'Tab' || !containerRef.value) return
    const focusable = Array.from(containerRef.value.querySelectorAll(FOCUSABLE))
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return { handleKeydown }
}

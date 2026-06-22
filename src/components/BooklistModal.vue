<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getBooksBySection } from '@/services/booklistService'

const props = defineProps({
  section: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const books = ref([])
const loading = ref(false)
const modalRef = ref(null)
const closeButtonRef = ref(null)
const previousFocus = ref(null)

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
    return
  }
  if (e.key !== 'Tab' || !modalRef.value) return
  const focusable = Array.from(modalRef.value.querySelectorAll(FOCUSABLE))
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

function buildEcampusUrl() {
  const s = props.section
  const term = s.Term
  const semestername = `${term.slice(0, 2)}/${term.slice(2)}`
  const subject = s.SubjectCode.trim()
  const courseNo = s.CourseNo.trim().padStart(4, '0')
  const sectionNo = String(s.SectionNo).trim()
  return `https://www.ecampus.com/autocourselist.asp?sintschoolid=6373&semestername=${semestername}&courses=${subject}&courses2=${courseNo}&courses3=${sectionNo}`
}

onMounted(async () => {
  previousFocus.value = document.activeElement
  closeButtonRef.value?.focus()
  document.addEventListener('keydown', handleKeydown)

  if (Array.isArray(props.section.booklist)) {
    books.value = props.section.booklist
    return
  }
  loading.value = true
  try {
    const { data } = await getBooksBySection(
      props.section.SubjectCode.trim(),
      props.section.CourseNo.trim(),
      props.section.Term,
      String(props.section.SectionNo).trim(),
    )
    const rows = Array.isArray(data) ? data : []
    books.value = rows.filter((r) => r.CourseResult === 'SUCCESS')
  } catch {
    books.value = []
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  previousFocus.value?.focus()
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="emit('close')"
    data-testid="booklist-modal"
  >
    <div
      ref="modalRef"
      class="w-full max-w-lg rounded-xl bg-white shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booklist-modal-title"
    >
      <div class="flex items-start justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Books</p>
          <h2 id="booklist-modal-title" class="mt-0.5 text-sm font-semibold text-gray-800">
            {{ section.SubjectCode.trim() }}-{{ section.CourseNo.trim() }}-{{ section.SectionNo }}
            <span class="font-normal text-gray-500">· {{ section.LongName }}</span>
          </h2>
        </div>
        <button
          ref="closeButtonRef"
          @click="emit('close')"
          class="ml-4 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >✕</button>
      </div>

      <div class="px-5 py-4">
        <div v-if="loading" class="py-6 text-center text-sm text-gray-500">Loading books…</div>

        <p v-else-if="!books.length" class="py-4 text-sm text-gray-500">No books required</p>

        <div v-else class="space-y-3">
          <div
            v-for="book in books"
            :key="book.ISBN"
            class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <p class="text-sm font-medium text-gray-800">{{ book.Title }}</p>
            <div class="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
              <span>{{ book.Author }}</span>
              <span>ISBN {{ book.ISBN }}</span>
              <span
                :class="book.Required === 'Required' ? 'text-crimson font-medium' : 'text-gray-500'"
              >{{ book.Required }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-100 px-5 py-3">
        <a
          :href="buildEcampusUrl()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block rounded bg-crimson px-4 py-2 touch:py-3.5 text-xs font-medium text-white hover:bg-crimson-dark transition-colors"
        >Buy Books at Campus Store</a>
      </div>
    </div>
  </div>
</template>

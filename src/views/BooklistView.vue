<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useReferenceStore } from '@/stores/reference'
import { getBooksByTerm } from '@/services/booklistService'

const authStore = useAuthStore()
const cartStore = useCartStore()
const refStore = useReferenceStore()

const cartBooksByKey = ref({})
const loading = ref(false)

function sectionKey(sec) {
  return `${sec.SubjectCode.trim()}-${sec.CourseNo.trim()}-${String(sec.SectionNo).trim()}`
}

const termGroups = computed(() => {
  const registeredKeys = new Set(authStore.currentCourses.map((s) => s.CourseKey))
  const waitlistedKeys = new Set(authStore.waitlist.map((s) => s.CourseKey))

  const items = []

  for (const sec of authStore.currentCourses) {
    items.push({ section: sec, books: sec.booklist ?? [], isCart: false })
  }
  for (const sec of authStore.waitlist) {
    if (!registeredKeys.has(sec.CourseKey)) {
      items.push({ section: sec, books: sec.booklist ?? [], isCart: false })
    }
  }
  for (const sec of cartStore.sections) {
    if (!registeredKeys.has(sec.CourseKey) && !waitlistedKeys.has(sec.CourseKey)) {
      const key = sectionKey(sec)
      const books = cartBooksByKey.value[key] ?? null
      items.push({ section: sec, books, isCart: true })
    }
  }

  const grouped = {}
  for (const item of items) {
    const term = item.section.Term
    if (!grouped[term]) grouped[term] = []
    grouped[term].push(item)
  }

  return Object.entries(grouped).map(([termId, sections]) => ({ termId, sections }))
})

function termLabel(termId) {
  const t = refStore.terms.find((t) => t.id === termId)
  return t ? `${t.termName} (${termId})` : termId
}

function sectionLabel(sec) {
  return `${sec.SubjectCode.trim()}-${sec.CourseNo.trim()}-${sec.SectionNo}`
}

function buildEcampusUrl(sections) {
  if (!sections.length) return '#'
  const term = sections[0].section.Term
  const semestername = `${term.slice(0, 2)}/${term.slice(2)}`
  const courses = sections.map((i) => i.section.SubjectCode.trim()).join('|')
  const courses2 = sections.map((i) => i.section.CourseNo.trim().padStart(4, '0')).join('|')
  const courses3 = sections.map((i) => String(i.section.SectionNo).trim()).join('|')
  return `https://www.ecampus.com/autocourselist.asp?sintschoolid=6373&semestername=${semestername}&courses=${courses}&courses2=${courses2}&courses3=${courses3}`
}

onMounted(async () => {
  const registeredKeys = new Set(authStore.currentCourses.map((s) => s.CourseKey))
  const waitlistedKeys = new Set(authStore.waitlist.map((s) => s.CourseKey))

  const cartOnly = cartStore.sections.filter(
    (s) => !registeredKeys.has(s.CourseKey) && !waitlistedKeys.has(s.CourseKey),
  )
  if (!cartOnly.length) return

  const byTerm = {}
  for (const sec of cartOnly) {
    if (!byTerm[sec.Term]) byTerm[sec.Term] = []
    byTerm[sec.Term].push(sec)
  }

  loading.value = true
  try {
    await Promise.all(
      Object.entries(byTerm).map(async ([term, sections]) => {
        const courseCodes = sections.map(
          (s) => `${s.SubjectCode.trim()}-${s.CourseNo.trim()}-${s.SectionNo}`,
        )
        const updates = {}
        for (const sec of sections) {
          updates[sectionKey(sec)] = []
        }
        try {
          const { data } = await getBooksByTerm(courseCodes, term)
          const rows = Array.isArray(data?.rows) ? data.rows : []
          for (const row of rows) {
            if (row.CourseResult !== 'SUCCESS') continue
            const key = `${row.SubjectCode.trim()}-${row.CourseNo.trim()}-${row.SectionNo.trim()}`
            if (!updates[key]) updates[key] = []
            updates[key].push(row)
          }
        } catch {
          // leave updates as empty arrays (no books)
        }
        Object.assign(cartBooksByKey.value, updates)
      }),
    )
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <main class="mx-auto max-w-3xl px-4 py-6">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 mb-6">My Booklist</h1>
      <div
        v-if="!termGroups.length"
        class="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-500"
      >
        <p class="text-lg font-medium">No sections to show</p>
        <p class="mt-1 text-sm">Add sections to your cart or register to see your booklist.</p>
      </div>

      <div v-if="loading" class="mb-4 text-center text-sm text-gray-500">
        Loading books for cart sections…
      </div>

      <section
        v-for="group in termGroups"
        :key="group.termId"
        class="mb-8"
        :data-testid="`term-group-${group.termId}`"
      >
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {{ termLabel(group.termId) }}
        </h2>

        <div class="space-y-3">
          <div
            v-for="item in group.sections"
            :key="item.section.CourseKey"
            class="rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <p class="text-sm font-semibold text-crimson">
              {{ sectionLabel(item.section) }}
              <span class="font-normal text-gray-600">· {{ item.section.LongName }}</span>
            </p>

            <div v-if="item.books === null" class="mt-2 text-xs text-gray-500">
              Loading books…
            </div>
            <p v-else-if="!item.books.length" class="mt-2 text-xs text-gray-500">
              No books required
            </p>
            <div v-else class="mt-2 space-y-2">
              <div
                v-for="book in item.books"
                :key="book.ISBN"
                class="text-xs text-gray-700"
              >
                <span class="font-medium">{{ book.Title }}</span>
                <span class="mx-1 text-gray-500">·</span>
                <span>{{ book.Author }}</span>
                <span class="mx-1 text-gray-500">·</span>
                <span>ISBN {{ book.ISBN }}</span>
                <span
                  class="ml-1"
                  :class="book.Required === 'Required' ? 'text-crimson font-medium' : 'text-gray-500'"
                >{{ book.Required }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 text-right">
          <a
            :href="buildEcampusUrl(group.sections)"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block rounded bg-crimson px-4 py-2 touch:py-3.5 text-xs font-medium text-white hover:bg-crimson-dark transition-colors"
            data-testid="buy-books-btn"
          >Buy Books at eCampus Store</a>
        </div>
      </section>
    </main>
  </div>
</template>

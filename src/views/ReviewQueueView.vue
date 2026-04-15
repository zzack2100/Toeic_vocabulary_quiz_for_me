<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '../components/common/SectionCard.vue'
import { useReviewStore } from '../stores/review'
import { useVocabularyStore } from '../stores/vocabulary'
import { formatDateLabel } from '../utils/date'

const reviewStore = useReviewStore()
const vocabularyStore = useVocabularyStore()

const dueWords = computed(() => vocabularyStore.getWordsByIds(reviewStore.dueWordIds))

function exportAllWordsToTxt() {
  const text = vocabularyStore.words
    .map((w) => `${w.word}, ${w.translation_zh_TW}`)
    .join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'toeic_vocabulary_export.txt'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <span class="badge">{{ reviewStore.dueCount }} words due</span>
        <h1 class="page-title">Review queue</h1>
        <p class="page-subtitle">Simplified spaced repetition uses timestamps and interval days stored per word.</p>
      </div>
      <div class="button-row">
        <button class="button button--ghost" @click="reviewStore.calculateDueWords(vocabularyStore.words)">
          Recalculate
        </button>
        <button class="button button--ghost" @click="exportAllWordsToTxt()">
          Export .txt
        </button>
      </div>
    </header>

    <SectionCard title="Due items" subtitle="Words whose next review date is now or overdue.">
      <div v-if="dueWords.length > 0" class="list">
        <article v-for="word in dueWords" :key="word.id">
          <strong>{{ word.word }}</strong>
          <p class="muted">{{ word.translation_zh_TW }}</p>
          <p class="muted">Next review: {{ formatDateLabel(word.memory.next_review_date) }}</p>
        </article>
      </div>
      <p v-else class="muted">No words are currently due.</p>
    </SectionCard>
  </section>
</template>
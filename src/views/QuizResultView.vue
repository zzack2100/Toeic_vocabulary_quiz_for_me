<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionCard from '../components/common/SectionCard.vue'
import { useQuizStore } from '../stores/quiz'
import { useVocabularyStore } from '../stores/vocabulary'

const quizStore = useQuizStore()
const vocabularyStore = useVocabularyStore()

const incorrectItems = computed(() =>
  quizStore.reviewEntries
    .filter((entry) => entry.result === 'incorrect')
    .map((entry) => ({
      ...entry,
      word: vocabularyStore.getWordById(entry.wordId),
    })),
)
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <span class="badge">{{ quizStore.score }} / {{ quizStore.questions.length }}</span>
        <h1 class="page-title">Result snapshot</h1>
        <p class="page-subtitle">The current scaffold already updates memory intervals and notebook state on submit.</p>
      </div>
    </header>

    <div class="grid grid--two">
      <SectionCard title="Summary" subtitle="Immediate post-quiz evaluation.">
        <div class="list">
          <p><strong>Score:</strong> {{ quizStore.score }}</p>
          <p><strong>Incorrect:</strong> {{ incorrectItems.length }}</p>
          <p><strong>Status:</strong> {{ quizStore.isSubmitted ? 'Submitted' : 'Draft' }}</p>
          <p><strong>Due quota used:</strong> {{ quizStore.selectionSummary.due }}</p>
          <p><strong>Mistake quota used:</strong> {{ quizStore.selectionSummary.mistake }}</p>
          <p><strong>Fresh quota used:</strong> {{ quizStore.selectionSummary.fresh }}</p>
          <p><strong>Fallback fill:</strong> {{ quizStore.selectionSummary.fallback }}</p>
        </div>
        <div class="button-row" style="margin-top: 18px">
          <RouterLink class="button" to="/mistakes">Open mistake notebook</RouterLink>
          <RouterLink class="button button--ghost" to="/review">Open due queue</RouterLink>
        </div>
      </SectionCard>

      <SectionCard title="Incorrect answers" subtitle="These entries are now prioritized for future sessions.">
        <div class="list" v-if="incorrectItems.length > 0">
          <article v-for="item in incorrectItems" :key="item.wordId">
            <strong>{{ item.word?.word ?? item.wordId }}</strong>
            <p class="muted">Correct: {{ item.correctAnswer }}</p>
            <p class="muted">Selected: {{ item.selectedAnswer || 'No answer' }}</p>
          </article>
        </div>
        <p v-else class="muted">No incorrect answers in the current result set.</p>
      </SectionCard>
    </div>
  </section>
</template>
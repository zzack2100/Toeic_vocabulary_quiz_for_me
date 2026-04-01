<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import SectionCard from '../components/common/SectionCard.vue'
import QuizQuestionCard from '../components/quiz/QuizQuestionCard.vue'
import { useQuizStore } from '../stores/quiz'
import { useVocabularyStore } from '../stores/vocabulary'

const router = useRouter()
const route = useRoute()
const quizStore = useQuizStore()
const vocabularyStore = useVocabularyStore()
const activeFilter = ref<'all' | 'incorrect' | 'correct'>('all')

const showRedirectNotice = computed(() => route.query.redirect === 'daily-locked')

onMounted(() => {
  if (vocabularyStore.words.length === 0) {
    return
  }

  const snapshot = quizStore.restoreSavedQuiz()

  if (!snapshot) {
    router.replace('/')
    return
  }

  if (!snapshot.isSubmitted) {
    router.replace('/quiz/daily')
  }
})

const reviewCards = computed(() =>
  quizStore.questions.map((question, index) => {
    const reviewEntry = quizStore.reviewEntries.find((entry) => entry.wordId === question.wordId)
    const word = vocabularyStore.getWordById(question.wordId)

    return {
      index,
      question,
      reviewEntry,
      word,
    }
  }),
)

const incorrectItems = computed(() =>
  reviewCards.value.filter((item) => item.reviewEntry?.result === 'incorrect'),
)

const correctItems = computed(() =>
  reviewCards.value.filter((item) => item.reviewEntry?.result === 'correct'),
)

const reviewFilters = computed(() => [
  { value: 'all' as const, label: `All (${reviewCards.value.length})`, icon: '•' },
  { value: 'incorrect' as const, label: `Incorrect only (${incorrectItems.value.length})`, icon: '✕' },
  { value: 'correct' as const, label: `Correct only (${correctItems.value.length})`, icon: '✓' },
])

const filteredReviewCards = computed(() => {
  if (activeFilter.value === 'incorrect') {
    return reviewCards.value.filter((item) => item.reviewEntry?.result === 'incorrect')
  }

  if (activeFilter.value === 'correct') {
    return reviewCards.value.filter((item) => item.reviewEntry?.result === 'correct')
  }

  return reviewCards.value
})

const summaryItems = computed(() => [
  {
    label: 'Score',
    value: `${quizStore.score} / ${quizStore.questions.length}`,
    icon: '•',
    tone: 'neutral',
  },
  {
    label: 'Correct',
    value: `${correctItems.value.length}`,
    icon: '✓',
    tone: 'correct',
  },
  {
    label: 'Incorrect',
    value: `${incorrectItems.value.length}`,
    icon: '✕',
    tone: 'incorrect',
  },
  {
    label: 'Status',
    value: quizStore.isSubmitted ? 'Submitted' : 'Draft',
    icon: '•',
    tone: 'neutral',
  },
  {
    label: 'Due quota used',
    value: `${quizStore.selectionSummary.due}`,
    icon: '•',
    tone: 'neutral',
  },
  {
    label: 'Mistake quota used',
    value: `${quizStore.selectionSummary.mistake}`,
    icon: '✕',
    tone: 'incorrect',
  },
  {
    label: 'Fresh quota used',
    value: `${quizStore.selectionSummary.fresh}`,
    icon: '✓',
    tone: 'correct',
  },
  {
    label: 'Fallback fill',
    value: `${quizStore.selectionSummary.fallback}`,
    icon: '•',
    tone: 'neutral',
  },
])
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

    <div class="submitted-banner" role="status" aria-live="polite">
      <span class="submitted-banner__icon" aria-hidden="true">•</span>
      <div class="submitted-banner__copy">
        <strong class="submitted-banner__title">Today&apos;s quiz is locked after submission.</strong>
        <p class="submitted-banner__text">
          Re-entering the daily quiz will bring you back here so progress, spacing intervals, and mistake tracking are only applied once per day.
        </p>
        <p v-if="showRedirectNotice" class="submitted-banner__notice">
          You were redirected here because today&apos;s quiz has already been submitted.
        </p>
      </div>
      <div class="submitted-banner__actions">
        <RouterLink class="button button--ghost" to="/review">Review due words</RouterLink>
        <RouterLink class="button button--ghost" to="/mistakes">Inspect mistakes</RouterLink>
      </div>
    </div>

    <div class="grid grid--two">
      <SectionCard title="Summary" subtitle="Immediate post-quiz evaluation.">
        <div class="summary-list">
          <article
            v-for="item in summaryItems"
            :key="item.label"
            class="summary-item"
            :class="`summary-item--${item.tone}`"
          >
            <span class="summary-item__icon" aria-hidden="true">{{ item.icon }}</span>
            <div class="summary-item__copy">
              <span class="summary-item__label">{{ item.label }}</span>
              <strong class="summary-item__value">{{ item.value }}</strong>
            </div>
          </article>
        </div>
        <div class="button-row" style="margin-top: 18px">
          <RouterLink class="button" to="/mistakes">Open mistake notebook</RouterLink>
          <RouterLink class="button button--ghost" to="/review">Open due queue</RouterLink>
        </div>
      </SectionCard>

      <SectionCard title="Incorrect answers" subtitle="These entries are now prioritized for future sessions.">
        <div class="list" v-if="incorrectItems.length > 0">
          <article v-for="item in incorrectItems" :key="item.question.wordId">
            <strong>{{ item.word?.word ?? item.question.wordId }}</strong>
            <p class="muted">Correct: {{ item.reviewEntry?.correctAnswer }}</p>
            <p class="muted">Selected: {{ item.reviewEntry?.selectedAnswer || 'No answer' }}</p>
          </article>
        </div>
        <p v-else class="muted">No incorrect answers in the current result set.</p>
      </SectionCard>
    </div>

    <SectionCard
      title="Question review"
      subtitle="Each card now shows the selected option alongside the correct answer after submission."
      style="margin-top: 18px"
    >
      <template #header>
        <div class="review-filter-group" aria-label="Review filters" role="tablist">
          <button
            v-for="filter in reviewFilters"
            :key="filter.value"
            type="button"
            class="review-filter"
            :class="{ 'review-filter--active': activeFilter === filter.value }"
            :aria-pressed="activeFilter === filter.value"
            @click="activeFilter = filter.value"
          >
            <span class="review-filter__icon" aria-hidden="true">{{ filter.icon }}</span>
            {{ filter.label }}
          </button>
        </div>
      </template>

      <div class="result-review-list">
        <QuizQuestionCard
          v-for="item in filteredReviewCards"
          :key="item.question.wordId"
          :question="item.question"
          :question-number="item.index + 1"
          :total-questions="quizStore.questions.length"
          :selected-answer="item.reviewEntry?.selectedAnswer || undefined"
          :correct-answer="item.reviewEntry?.correctAnswer"
          :show-feedback="true"
          :part-of-speech="item.word?.part_of_speech"
          :definition="item.word?.translation_zh_TW"
          :example-sentence="item.word?.example_sentence"
        />
      </div>
      <p v-if="filteredReviewCards.length === 0" class="muted result-review-empty">
        No questions match the current filter.
      </p>
    </SectionCard>
  </section>
</template>

<style scoped>
.submitted-banner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  margin-bottom: 18px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-lg);
  background:
    linear-gradient(180deg, var(--banner-gradient-start), var(--banner-gradient-end)),
    var(--surface);
  box-shadow: var(--shadow-soft);
}

.submitted-banner__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 1rem;
  line-height: 1;
}

.submitted-banner__copy {
  display: grid;
  gap: 4px;
}

.submitted-banner__title {
  color: var(--text-main);
  font-size: 1rem;
}

.submitted-banner__text {
  margin: 0;
  color: var(--text-muted);
}

.submitted-banner__notice {
  margin: 4px 0 0;
  color: var(--accent-strong);
  font-size: 0.95rem;
}

.submitted-banner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: end;
}

.summary-list {
  display: grid;
  gap: 12px;
}

.summary-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  background: var(--surface);
}

.summary-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  font-size: 0.95rem;
  line-height: 1;
  background: var(--tone-neutral-soft);
  color: var(--text-muted);
}

.summary-item__copy {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.summary-item__label {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.summary-item__value {
  color: var(--text-main);
  font-size: 1rem;
}

.summary-item--correct .summary-item__icon {
  background: var(--tone-success-strong-soft);
  color: var(--success);
}

.summary-item--incorrect .summary-item__icon {
  background: var(--tone-danger-strong-soft);
  color: var(--danger);
}

.review-filter-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.review-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  padding: 8px 14px;
  transition:
    background-color var(--transition-speed-fast) ease,
    border-color var(--transition-speed-fast) ease,
    color var(--transition-speed-fast) ease,
    transform var(--transition-speed-fast) ease;
}

.review-filter:hover {
  transform: translateY(-1px);
  background: var(--surface-hover);
  border-color: var(--accent);
  color: var(--text-main);
}

.review-filter--active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-strong);
}

.review-filter__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  font-size: 0.95rem;
  line-height: 1;
}

.result-review-list {
  display: grid;
  gap: 18px;
}

.result-review-empty {
  margin: 18px 0 0;
}

@media (max-width: 720px) {
  .submitted-banner {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .submitted-banner__actions {
    justify-content: start;
  }

  .summary-item__copy {
    flex-direction: column;
    align-items: start;
  }
}
</style>
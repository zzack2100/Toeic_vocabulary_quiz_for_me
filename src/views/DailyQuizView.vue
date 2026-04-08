<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SectionCard from '../components/common/SectionCard.vue'
import QuizQuestionCard from '../components/quiz/QuizQuestionCard.vue'
import { useQuizStore } from '../stores/quiz'
import { useSettingsStore } from '../stores/settings'
import { useVocabularyStore } from '../stores/vocabulary'

const router = useRouter()
const quizStore = useQuizStore()
const settingsStore = useSettingsStore()
const vocabularyStore = useVocabularyStore()

onMounted(() => {
  if (vocabularyStore.words.length > 0 && quizStore.questions.length === 0) {
    quizStore.initializeDailyQuiz()
  }
})

const currentQuestion = computed(() => quizStore.currentQuestion)
const currentWord = computed(() =>
  currentQuestion.value ? vocabularyStore.getWordById(currentQuestion.value.wordId) : undefined,
)
const selectedAnswer = computed(() =>
  currentQuestion.value ? quizStore.answers[currentQuestion.value.wordId] : undefined,
)

function handleSubmit() {
  if (quizStore.isSubmitted) {
    router.push('/quiz/result')
    return
  }

  quizStore.submitQuiz()
  router.push('/quiz/result')
}

function confirmAndSubmit() {
  const answered = Object.keys(quizStore.answers).length
  const total = quizStore.questions.length

  if (answered < total) {
    if (!window.confirm(`You have answered ${answered} of ${total} questions. Submit anyway?`)) {
      return
    }
  }

  handleSubmit()
}
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <span class="badge">{{ quizStore.progressPercent }}% answered</span>
        <h1 class="page-title">Daily quiz</h1>
        <p class="page-subtitle">
          Stored locally per day. Current target size: {{ settingsStore.quizSize }} questions.
        </p>
      </div>
      <div class="button-row">
        <button class="button button--ghost" @click="quizStore.startNewSession()">Regenerate</button>
        <button class="button" :disabled="quizStore.questions.length === 0 || quizStore.isSubmitted" @click="handleSubmit">
          Submit quiz
        </button>
      </div>
    </header>

    <SectionCard
      v-if="currentQuestion"
      title="Question panel"
      subtitle="Multiple-choice translation selection with Local Storage persistence."
    >
      <div class="grid grid--stats" style="margin-bottom: 20px">
        <div class="quiz-metric-card">
          <span class="quiz-metric-card__label">Due</span>
          <strong class="quiz-metric-card__value">{{ quizStore.selectionSummary.due }}</strong>
        </div>
        <div class="quiz-metric-card">
          <span class="quiz-metric-card__label">Mistake</span>
          <strong class="quiz-metric-card__value">{{ quizStore.selectionSummary.mistake }}</strong>
        </div>
        <div class="quiz-metric-card">
          <span class="quiz-metric-card__label">Fresh</span>
          <strong class="quiz-metric-card__value">{{ quizStore.selectionSummary.fresh }}</strong>
        </div>
        <div class="quiz-metric-card">
          <span class="quiz-metric-card__label">Fallback</span>
          <strong class="quiz-metric-card__value">{{ quizStore.selectionSummary.fallback }}</strong>
        </div>
      </div>

      <QuizQuestionCard
        :question="currentQuestion"
        :question-number="quizStore.currentIndex + 1"
        :total-questions="quizStore.questions.length"
        :selected-answer="selectedAnswer"
        :part-of-speech="currentWord?.part_of_speech"
        :example-sentence="currentWord?.example_sentence"
        @select="quizStore.answerQuestion(currentQuestion.wordId, $event)"
      />

      <div class="button-row" style="margin-top: 20px">
        <button class="button button--ghost" @click="quizStore.goToQuestion(quizStore.currentIndex - 1)">
          Previous
        </button>
        <button
          v-if="quizStore.currentIndex < quizStore.questions.length - 1"
          class="button button--ghost"
          @click="quizStore.goToQuestion(quizStore.currentIndex + 1)"
        >
          Next
        </button>
        <button
          v-else
          class="button"
          :disabled="quizStore.isSubmitted"
          @click="confirmAndSubmit"
        >
          Submit Quiz
        </button>
      </div>
    </SectionCard>

    <SectionCard
      v-else
      title="No quiz generated yet"
      subtitle="The app will build one from the ranked vocabulary pool."
    >
      <div class="button-row">
        <button class="button" @click="quizStore.initializeDailyQuiz()">Build daily quiz</button>
      </div>
    </SectionCard>
  </section>
</template>

<style scoped>
.quiz-metric-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-muted);
}

.quiz-metric-card__label {
  color: var(--text-muted);
  font-size: 0.92rem;
}

.quiz-metric-card__value {
  color: var(--text-main);
  font-size: 1.75rem;
  line-height: 1;
}
</style>
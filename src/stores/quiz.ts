import { defineStore } from 'pinia'
import { storageService } from '../services/storageService'
import { buildQuizFromIds, buildQuizQuestions, summarizeQuizFromIds } from '../utils/quizGenerator'
import { getTodayKey } from '../utils/date'
import { updateMemoryMetadata } from '../utils/spacedRepetition'
import { useMistakesStore } from './mistakes'
import { useReviewStore } from './review'
import { useSettingsStore } from './settings'
import { useVocabularyStore } from './vocabulary'
import type { DailyQuizSnapshot, QuizCompositionSummary, QuizQuestion, QuizReviewEntry } from '../types/quiz'

function createEmptySelectionSummary(): QuizCompositionSummary {
  return {
    due: 0,
    mistake: 0,
    fresh: 0,
    fallback: 0,
    total: 0,
  }
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    quizDate: null as string | null,
    questions: [] as QuizQuestion[],
    selectionSummary: createEmptySelectionSummary() as QuizCompositionSummary,
    currentIndex: 0,
    answers: {} as Record<string, string>,
    isSubmitted: false,
    score: 0,
  }),
  getters: {
    currentQuestion: (state) => state.questions[state.currentIndex] ?? null,
    answeredCount: (state) => Object.keys(state.answers).length,
    progressPercent(): number {
      return this.questions.length === 0 ? 0 : Math.round((this.answeredCount / this.questions.length) * 100)
    },
    incorrectQuestionIds(): string[] {
      return this.questions
        .filter((question) => this.answers[question.wordId] !== question.correctAnswer)
        .map((question) => question.wordId)
    },
    reviewEntries(): QuizReviewEntry[] {
      return this.questions.map((question) => {
        const selectedAnswer = this.answers[question.wordId] ?? null
        const result = selectedAnswer === question.correctAnswer ? 'correct' : 'incorrect'

        return {
          wordId: question.wordId,
          selectedAnswer,
          correctAnswer: question.correctAnswer,
          result,
        }
      })
    },
  },
  actions: {
    loadSavedQuiz() {
      const snapshot = storageService.getDailyQuiz()

      if (!snapshot || snapshot.date !== getTodayKey()) {
        return null
      }

      this.quizDate = snapshot.date
      this.answers = snapshot.answers
      this.currentIndex = snapshot.currentIndex
      this.isSubmitted = snapshot.isSubmitted
      this.score = snapshot.score
      this.selectionSummary =
        snapshot.selectionSummary ?? summarizeQuizFromIds(useVocabularyStore().words, snapshot.questionIds)
      return snapshot
    },
    initializeDailyQuiz() {
      const vocabularyStore = useVocabularyStore()
      const settingsStore = useSettingsStore()
      const snapshot = this.loadSavedQuiz()

      if (snapshot) {
        this.questions = buildQuizFromIds(vocabularyStore.words, snapshot.questionIds)
        return
      }

      this.quizDate = getTodayKey()
      const { questions, summary } = buildQuizQuestions(vocabularyStore.words, settingsStore.quizSize)
      this.questions = questions
      this.selectionSummary = summary
      this.currentIndex = 0
      this.answers = {}
      this.isSubmitted = false
      this.score = 0
      this.persistSnapshot()
    },
    answerQuestion(wordId: string, selectedOption: string) {
      this.answers = {
        ...this.answers,
        [wordId]: selectedOption,
      }
      this.persistSnapshot()
    },
    goToQuestion(index: number) {
      if (index < 0 || index >= this.questions.length) {
        return
      }

      this.currentIndex = index
      this.persistSnapshot()
    },
    submitQuiz() {
      const vocabularyStore = useVocabularyStore()
      const settingsStore = useSettingsStore()
      const mistakesStore = useMistakesStore()
      const reviewStore = useReviewStore()

      let nextScore = 0

      this.questions.forEach((question) => {
        const selectedAnswer = this.answers[question.wordId] ?? ''
        const isCorrect = selectedAnswer === question.correctAnswer
        const word = vocabularyStore.getWordById(question.wordId)

        if (!word) {
          return
        }

        if (isCorrect) {
          nextScore += 1
          if (word.memory.is_in_mistake_notebook) {
            mistakesStore.resolveMistake(word.id)
          }
        } else {
          mistakesStore.markMistake(word.id, selectedAnswer)
        }

        const updatedMemory = updateMemoryMetadata(
          word.memory,
          isCorrect ? 'correct' : 'incorrect',
          settingsStore.resetMemoryOnWrong,
        )

        vocabularyStore.updateWordMemory(word.id, {
          ...updatedMemory,
          is_in_mistake_notebook: !isCorrect || updatedMemory.is_in_mistake_notebook,
        })
      })

      this.score = nextScore
      this.isSubmitted = true
      reviewStore.calculateDueWords(vocabularyStore.words)
      this.persistSnapshot()
    },
    resetQuiz() {
      this.quizDate = null
      this.questions = []
      this.selectionSummary = createEmptySelectionSummary()
      this.currentIndex = 0
      this.answers = {}
      this.isSubmitted = false
      this.score = 0
      storageService.clearDailyQuiz()
    },
    persistSnapshot() {
      const snapshot: DailyQuizSnapshot = {
        date: this.quizDate ?? getTodayKey(),
        questionIds: this.questions.map((question) => question.wordId),
        selectionSummary: this.selectionSummary,
        answers: this.answers,
        currentIndex: this.currentIndex,
        isSubmitted: this.isSubmitted,
        score: this.score,
      }

      storageService.saveDailyQuiz(snapshot)
    },
  },
})
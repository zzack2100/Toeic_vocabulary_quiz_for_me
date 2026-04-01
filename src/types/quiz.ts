import type { QuizResult } from './vocabulary'

export interface QuizCompositionSummary {
  due: number
  mistake: number
  fresh: number
  fallback: number
  total: number
}

export interface QuizQuestion {
  wordId: string
  prompt: string
  correctAnswer: string
  options: string[]
}

export interface DailyQuizSnapshot {
  date: string
  questionIds: string[]
  selectionSummary: QuizCompositionSummary
  answers: Record<string, string>
  currentIndex: number
  isSubmitted: boolean
  score: number
}

export interface QuizReviewEntry {
  wordId: string
  selectedAnswer: string | null
  correctAnswer: string
  result: QuizResult
}
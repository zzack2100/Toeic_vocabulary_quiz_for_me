import type { DailyQuizSnapshot } from '../types/quiz'
import type { MistakeNotebook, ProgressMap, VocabularySeed } from '../types/vocabulary'

const KEYS = {
  progress: 'toeic.vocab.progress',
  dailyQuiz: 'toeic.quiz.daily',
  mistakes: 'toeic.mistakes',
  settings: 'toeic.settings',
  customVocabulary: 'toeic.vocab.custom',
  activityHistory: 'toeic.activity.history',
}

function parseJson<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, payload: T) {
  window.localStorage.setItem(key, JSON.stringify(payload))
}

export const storageService = {
  getProgress(): ProgressMap {
    return parseJson(KEYS.progress, {})
  },
  saveProgress(progress: ProgressMap) {
    writeJson(KEYS.progress, progress)
  },
  getDailyQuiz(): DailyQuizSnapshot | null {
    return parseJson<DailyQuizSnapshot | null>(KEYS.dailyQuiz, null)
  },
  saveDailyQuiz(snapshot: DailyQuizSnapshot) {
    writeJson(KEYS.dailyQuiz, snapshot)
  },
  clearDailyQuiz() {
    window.localStorage.removeItem(KEYS.dailyQuiz)
  },
  getMistakes(): MistakeNotebook {
    return parseJson(KEYS.mistakes, {})
  },
  saveMistakes(notebook: MistakeNotebook) {
    writeJson(KEYS.mistakes, notebook)
  },
  getSettings<T extends object>(fallback: T): T {
    return parseJson(KEYS.settings, fallback)
  },
  saveSettings<T extends object>(settings: T) {
    writeJson(KEYS.settings, settings)
  },
  getCustomVocabulary(): VocabularySeed[] {
    return parseJson(KEYS.customVocabulary, [])
  },
  saveCustomVocabulary(words: VocabularySeed[]) {
    writeJson(KEYS.customVocabulary, words)
  },
  resetAll() {
    window.localStorage.removeItem(KEYS.progress)
    window.localStorage.removeItem(KEYS.dailyQuiz)
    window.localStorage.removeItem(KEYS.mistakes)
    window.localStorage.removeItem(KEYS.settings)
    window.localStorage.removeItem(KEYS.activityHistory)
  },
  getActivityHistory(): string[] {
    return parseJson(KEYS.activityHistory, [])
  },
  recordActivity(timestamp: string) {
    const history = parseJson<string[]>(KEYS.activityHistory, [])
    history.push(timestamp)
    writeJson(KEYS.activityHistory, history)
  },
}
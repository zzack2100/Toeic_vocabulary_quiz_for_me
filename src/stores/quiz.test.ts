import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQuizStore } from './quiz'
import { useSettingsStore } from './settings'
import { useVocabularyStore } from './vocabulary'
import { storageService } from '../services/storageService'
import { summarizeQuizFromIds } from '../utils/quizGenerator'
import type { MemoryMetadata, ToeicWord } from '../types/vocabulary'

function createStorageMock() {
  const store = new Map<string, string>()

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
  }
}

function createMemory(overrides: Partial<MemoryMetadata> = {}): MemoryMetadata {
  return {
    memory_level: 0,
    last_reviewed_date: null,
    interval_days: 0,
    next_review_date: null,
    times_seen: 0,
    times_correct: 0,
    times_incorrect: 0,
    is_in_mistake_notebook: false,
    last_result: null,
    ...overrides,
  }
}

function createWord(id: string, memory: MemoryMetadata, partOfSpeech = 'noun'): ToeicWord {
  return {
    id,
    word: `word-${id}`,
    translation_zh_TW: `translation-${id}`,
    part_of_speech: partOfSpeech,
    example_sentence: `Example sentence for ${id}.`,
    difficulty: 'medium',
    tags: ['test'],
    memory,
  }
}

describe('useQuizStore persisted selection summary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('window', {
      localStorage: createStorageMock(),
    })
  })

  it('matches selected question IDs when bucket targets are filled exactly', () => {
    const vocabularyStore = useVocabularyStore()
    const settingsStore = useSettingsStore()
    const quizStore = useQuizStore()

    settingsStore.quizSize = 10
    vocabularyStore.words = [
      ...Array.from({ length: 5 }, (_, index) =>
        createWord(`due-${index}`, createMemory({ next_review_date: null, times_seen: 3 })),
      ),
      ...Array.from({ length: 3 }, (_, index) =>
        createWord(
          `mistake-${index}`,
          createMemory({
            next_review_date: '2099-01-01T00:00:00.000Z',
            is_in_mistake_notebook: true,
            times_seen: 4,
            times_incorrect: 2,
          }),
          'verb',
        ),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        createWord(
          `fresh-${index}`,
          createMemory({
            next_review_date: '2099-01-01T00:00:00.000Z',
            times_seen: 0,
          }),
          'adjective',
        ),
      ),
    ]

    quizStore.initializeDailyQuiz()

    const snapshot = storageService.getDailyQuiz()
    expect(snapshot).not.toBeNull()
    expect(snapshot?.questionIds).toHaveLength(10)
    expect(snapshot?.selectionSummary).toEqual({
      due: 5,
      mistake: 3,
      fresh: 2,
      fallback: 0,
      total: 10,
    })

    const derivedSummary = summarizeQuizFromIds(vocabularyStore.words, snapshot!.questionIds)
    expect(derivedSummary).toEqual({
      due: snapshot!.selectionSummary.due,
      mistake: snapshot!.selectionSummary.mistake,
      fresh: snapshot!.selectionSummary.fresh,
      fallback: 0,
      total: snapshot!.selectionSummary.total,
    })
  })

  it('keeps due, mistake, and fresh counts aligned with saved question IDs when fallback fill is used', () => {
    const vocabularyStore = useVocabularyStore()
    const settingsStore = useSettingsStore()
    const quizStore = useQuizStore()

    settingsStore.quizSize = 10
    vocabularyStore.words = [
      ...Array.from({ length: 2 }, (_, index) =>
        createWord(`due-${index}`, createMemory({ next_review_date: null, times_seen: 5 })),
      ),
      createWord(
        'mistake-0',
        createMemory({
          next_review_date: '2099-01-01T00:00:00.000Z',
          is_in_mistake_notebook: true,
          times_seen: 6,
          times_incorrect: 3,
        }),
        'verb',
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        createWord(
          `fresh-${index}`,
          createMemory({
            next_review_date: '2099-01-01T00:00:00.000Z',
            times_seen: 0,
          }),
          'adjective',
        ),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        createWord(
          `fallback-${index}`,
          createMemory({
            next_review_date: '2099-01-01T00:00:00.000Z',
            times_seen: 8,
            memory_level: 4,
          }),
        ),
      ),
    ]

    quizStore.initializeDailyQuiz()

    const snapshot = storageService.getDailyQuiz()
    expect(snapshot).not.toBeNull()
    expect(snapshot?.questionIds).toHaveLength(10)
    expect(snapshot?.selectionSummary.fallback).toBe(5)
    expect(snapshot?.selectionSummary.total).toBe(10)

    const derivedSummary = summarizeQuizFromIds(vocabularyStore.words, snapshot!.questionIds)
    expect(derivedSummary.due).toBe(snapshot!.selectionSummary.due)
    expect(derivedSummary.mistake).toBe(snapshot!.selectionSummary.mistake)
    expect(derivedSummary.fresh).toBe(snapshot!.selectionSummary.fresh)
    expect(derivedSummary.total).toBe(snapshot!.selectionSummary.total)
    expect(snapshot!.selectionSummary.due + snapshot!.selectionSummary.mistake + snapshot!.selectionSummary.fresh).toBe(
      snapshot!.selectionSummary.total,
    )
  })
})

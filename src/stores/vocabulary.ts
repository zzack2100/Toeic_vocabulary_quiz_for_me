import { defineStore } from 'pinia'
import { fetchVocabulary } from '../services/vocabularyService'
import { storageService } from '../services/storageService'
import type { MemoryMetadata, ProgressMap, ToeicWord } from '../types/vocabulary'

interface VocabularyState {
  words: ToeicWord[]
  isLoaded: boolean
  lastLoadedAt: string | null
  errorMessage: string | null
}

export const useVocabularyStore = defineStore('vocabulary', {
  state: (): VocabularyState => ({
    words: [],
    isLoaded: false,
    lastLoadedAt: null,
    errorMessage: null,
  }),
  getters: {
    totalWords: (state) => state.words.length,
    learnedWords: (state) => state.words.filter((word) => word.memory.times_correct > 0).length,
    newWords: (state) => state.words.filter((word) => word.memory.times_seen === 0).length,
  },
  actions: {
    async loadVocabulary() {
      this.errorMessage = null
      try {
        this.words = await fetchVocabulary()
        this.isLoaded = true
        this.lastLoadedAt = new Date().toISOString()
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Unknown loading error.'
      }
    },
    getWordById(id: string) {
      return this.words.find((word) => word.id === id)
    },
    getWordsByIds(ids: string[]) {
      const idSet = new Set(ids)
      return this.words.filter((word) => idSet.has(word.id))
    },
    updateWordMemory(wordId: string, memory: MemoryMetadata) {
      this.words = this.words.map((word) => (word.id === wordId ? { ...word, memory } : word))
      this.persistProgress()
    },
    persistProgress() {
      const progress = this.words.reduce<ProgressMap>((accumulator, word) => {
        accumulator[word.id] = word.memory
        return accumulator
      }, {})

      storageService.saveProgress(progress)
    },
  },
})
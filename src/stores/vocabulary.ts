import { defineStore } from 'pinia'
import { requestVocabularyExpansion } from '../services/vocabularyExpansionApi'
import { fetchVocabulary, fetchWordsFromCloud, syncWordsToCloud } from '../services/vocabularyService'
import { storageService } from '../services/storageService'
import { useAuthStore } from './auth'
import type { MemoryMetadata, ProgressMap, ToeicWord } from '../types/vocabulary'

interface VocabularyState {
  words: ToeicWord[]
  isLoaded: boolean
  lastLoadedAt: string | null
  errorMessage: string | null
  isExpanding: boolean
}

export const useVocabularyStore = defineStore('vocabulary', {
  state: (): VocabularyState => ({
    words: [],
    isLoaded: false,
    lastLoadedAt: null,
    errorMessage: null,
    isExpanding: false,
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

        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
          try {
            const cloudWords = await fetchWordsFromCloud(authStore.token!)
            for (const cw of cloudWords) {
              const local = this.words.find((w) => w.word.toLowerCase() === cw.word.toLowerCase())
              if (local && cw.memory) {
                const cwMemory = cw.memory as unknown as Record<string, unknown>
                const timesSeen = (cwMemory.times_seen as number) ?? 0
                if (timesSeen > local.memory.times_seen) {
                  local.memory.times_seen = timesSeen
                  local.memory.times_correct = (cwMemory.times_correct as number) ?? local.memory.times_correct
                  local.memory.memory_level = (cwMemory.memory_level as number) ?? local.memory.memory_level
                  const lastTested = cwMemory.last_tested as string | null
                  if (lastTested) {
                    local.memory.last_reviewed_date = lastTested
                  }
                }
              }
            }
            this.persistProgress()
          } catch {
            // Cloud fetch failed — continue with local data silently
          }
        }

        this.isLoaded = true
        this.lastLoadedAt = new Date().toISOString()
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Unknown loading error.'
      }
    },
    async expandVocabulary(topic: string) {
      this.errorMessage = null
      this.isExpanding = true

      try {
        const expandedWords = await requestVocabularyExpansion(topic)
        const existingCustomWords = storageService.getCustomVocabulary()
        const existingIds = new Set(existingCustomWords.map((word) => word.id))
        const existingWordNames = new Set(this.words.map((word) => word.word.toLowerCase()))
        const nextCustomWords = [...existingCustomWords]

        let addedCount = 0

        for (const word of expandedWords) {
          if (existingIds.has(word.id) || existingWordNames.has(word.word.toLowerCase())) {
            continue
          }

          nextCustomWords.push(word)
          existingIds.add(word.id)
          existingWordNames.add(word.word.toLowerCase())
          addedCount += 1
        }

        storageService.saveCustomVocabulary(nextCustomWords)
        this.words = await fetchVocabulary()
        this.lastLoadedAt = new Date().toISOString()

        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
          syncWordsToCloud(this.words, authStore.token!).catch(() => {
            // Background sync failed — silent
          })
        }

        return {
          requestedCount: expandedWords.length,
          addedCount,
          skippedCount: expandedWords.length - addedCount,
        }
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Vocabulary expansion failed.'
        throw error
      } finally {
        this.isExpanding = false
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

      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        syncWordsToCloud(this.words, authStore.token!).catch(() => {
          // Background sync failed — silent
        })
      }
    },
  },
})
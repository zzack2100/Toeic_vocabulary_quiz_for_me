import { defineStore } from 'pinia'
import { requestVocabularyExpansion } from '../services/vocabularyExpansionApi'
import { fetchVocabulary, fetchWordsFromCloud, syncWordsToCloud } from '../services/vocabularyService'
import { storageService } from '../services/storageService'
import { createDefaultMemoryMetadata } from '../utils/spacedRepetition'
import { useAuthStore } from './auth'
import { useMistakesStore } from './mistakes'
import type { MemoryMetadata, ProgressMap, ToeicWord, VocabularySeed } from '../types/vocabulary'

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
            const localWordNames = new Set(this.words.map((w) => w.word.toLowerCase()))
            const customWords = storageService.getCustomVocabulary()
            const customIds = new Set(customWords.map((w) => w.id))
            let addedFromCloud = false

            for (const cw of cloudWords) {
              const cwMemory = cw.memory as unknown as Record<string, unknown>
              const local = this.words.find((w) => w.word.toLowerCase() === cw.word.toLowerCase())

              if (local && cwMemory) {
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
                const cloudMistake = (cwMemory.is_in_mistake_notebook as boolean) ?? false
                if (cloudMistake) {
                  local.memory.is_in_mistake_notebook = true
                }
              } else if (!localWordNames.has(cw.word.toLowerCase())) {
                // Word exists in cloud but not locally — import it
                const cwAny = cw as unknown as Record<string, unknown>
                const newId = `cloud-${cw.word.toLowerCase().replace(/\s+/g, '-')}`

                if (!customIds.has(newId)) {
                  const seed: VocabularySeed = {
                    id: newId,
                    word: cw.word,
                    translation_zh_TW: (cwAny.translation as string) ?? '',
                    part_of_speech: '',
                    example_sentence: '',
                  }
                  customWords.push(seed)
                  customIds.add(newId)

                  const memory: MemoryMetadata = {
                    ...createDefaultMemoryMetadata(),
                    times_seen: (cwMemory?.times_seen as number) ?? 0,
                    times_correct: (cwMemory?.times_correct as number) ?? 0,
                    memory_level: (cwMemory?.memory_level as number) ?? 0,
                    last_reviewed_date: (cwMemory?.last_tested as string) ?? null,
                    is_in_mistake_notebook: (cwMemory?.is_in_mistake_notebook as boolean) ?? false,
                  }

                  this.words.push({ ...seed, memory })
                  localWordNames.add(cw.word.toLowerCase())
                  addedFromCloud = true
                }
              }
            }

            if (addedFromCloud) {
              storageService.saveCustomVocabulary(customWords)
            }
            this.persistProgress()

            // Sync mistake notebook from cloud flags
            const mistakesStore = useMistakesStore()
            mistakesStore.loadNotebook()
            for (const w of this.words) {
              if (w.memory.is_in_mistake_notebook && !mistakesStore.notebook[w.id]) {
                mistakesStore.markMistake(w.id, '')
              }
            }
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

      const TARGET = 20
      const MAX_RETRIES = 3

      try {
        const existingCustomWords = storageService.getCustomVocabulary()
        const existingIds = new Set(existingCustomWords.map((word) => word.id))
        const existingWordNames = new Set(this.words.map((word) => word.word.toLowerCase()))
        const nextCustomWords = [...existingCustomWords]

        let addedCount = 0
        let totalRequested = 0
        let retries = 0

        while (addedCount < TARGET && retries < MAX_RETRIES) {
          const expandedWords = await requestVocabularyExpansion(topic)
          totalRequested += expandedWords.length
          let addedThisRound = 0

          for (const word of expandedWords) {
            if (existingIds.has(word.id) || existingWordNames.has(word.word.toLowerCase())) {
              continue
            }

            nextCustomWords.push(word)
            existingIds.add(word.id)
            existingWordNames.add(word.word.toLowerCase())
            addedCount += 1
            addedThisRound += 1

            if (addedCount >= TARGET) break
          }

          if (addedThisRound === 0) retries += 1
          else retries = 0
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
          requestedCount: totalRequested,
          addedCount,
          skippedCount: totalRequested - addedCount,
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
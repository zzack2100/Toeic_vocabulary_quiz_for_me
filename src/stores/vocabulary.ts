import { defineStore } from 'pinia'
import { fetchImagesInBatch, requestVocabularyExpansion } from '../services/vocabularyExpansionApi'
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
  expansionStatus: string
  expansionProgress: number
}

export const useVocabularyStore = defineStore('vocabulary', {
  state: (): VocabularyState => ({
    words: [],
    isLoaded: false,
    lastLoadedAt: null,
    errorMessage: null,
    isExpanding: false,
    expansionStatus: '',
    expansionProgress: 0,
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
    async expandVocabulary(topic: string, includeImages = true) {
      this.errorMessage = null
      this.isExpanding = true
      this.expansionStatus = ''
      this.expansionProgress = 0

      try {
        const existingCustomWords = storageService.getCustomVocabulary()
        const existingIds = new Set(existingCustomWords.map((word) => word.id))
        const existingWordNames = new Set(this.words.map((word) => word.word.toLowerCase()))
        const nextCustomWords = [...existingCustomWords]

        // Step 1: AI generation (generate many, keep few)
        this.expansionStatus = `Step 1/3: AI is generating candidate words…`
        this.expansionProgress = 5

        const expandedWords = await requestVocabularyExpansion(topic)
        const generatedCount = expandedWords.length

        // Filter out duplicates and keep only the first 5 unique new words
        const filteredWords = expandedWords.filter(
          (word) => !existingIds.has(word.id) && !existingWordNames.has(word.word.toLowerCase()),
        )
        const newWordsToKeep = filteredWords.slice(0, 5)

        this.expansionProgress = 40

        // Step 2: Fetch images only for the kept words
        if (includeImages && newWordsToKeep.length > 0) {
          this.expansionStatus = `Step 2/3: Fetching images for ${newWordsToKeep.length} words…`
          const prompts = newWordsToKeep.map((w) => w.image_prompt || w.word)
          const imageUrls = await fetchImagesInBatch(prompts)
          for (let i = 0; i < newWordsToKeep.length; i++) {
            newWordsToKeep[i] = { ...newWordsToKeep[i], image_url: imageUrls[i] || '' }
          }
        }

        for (const word of newWordsToKeep) {
          nextCustomWords.push(word)
          existingIds.add(word.id)
          existingWordNames.add(word.word.toLowerCase())
        }
        const addedCount = newWordsToKeep.length

        this.expansionProgress = 70

        // Step 3: Save & sync
        this.expansionStatus = 'Step 3/3: Saving and syncing…'
        this.expansionProgress = 90

        storageService.saveCustomVocabulary(nextCustomWords)
        this.words = await fetchVocabulary()
        this.lastLoadedAt = new Date().toISOString()

        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
          syncWordsToCloud(this.words, authStore.token!).catch(() => {
            // Background sync failed — silent
          })
        }

        this.expansionProgress = 100
        this.expansionStatus = ''

        return {
          generatedCount,
          addedCount,
          skippedCount: generatedCount - addedCount,
        }
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Vocabulary expansion failed.'
        this.expansionStatus = ''
        this.expansionProgress = 0
        throw error
      } finally {
        this.isExpanding = false
      }
    },
    async importFromTextFile(file: File): Promise<{ addedCount: number; skippedCount: number }> {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
      })

      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
      const existingNames = new Set(this.words.map((w) => w.word.toLowerCase()))
      const customWords = storageService.getCustomVocabulary()
      let addedCount = 0
      let skippedCount = 0

      for (const line of lines) {
        const commaIdx = line.indexOf(',')
        const dashIdx = line.indexOf(' - ')
        const separatorIdx = commaIdx !== -1 ? commaIdx : dashIdx
        if (separatorIdx === -1) {
          skippedCount++
          continue
        }

        const sepLen = commaIdx !== -1 ? 1 : 3
        const word = line.slice(0, separatorIdx).trim()
        const translation = line.slice(separatorIdx + sepLen).trim()

        if (!word || !translation) {
          skippedCount++
          continue
        }

        if (existingNames.has(word.toLowerCase())) {
          skippedCount++
          continue
        }

        const seed: VocabularySeed = {
          id: crypto.randomUUID(),
          word,
          translation_zh_TW: translation,
          part_of_speech: '',
          example_sentence: '',
        }

        customWords.push(seed)
        existingNames.add(word.toLowerCase())
        addedCount++
      }

      storageService.saveCustomVocabulary(customWords)
      await this.loadVocabulary()

      return { addedCount, skippedCount }
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
    clearMistakeNotebookFlags() {
      this.words = this.words.map((word) => ({
        ...word,
        memory: {
          ...word.memory,
          is_in_mistake_notebook: false,
        },
      }))

      // Persist cleared flags to localStorage synchronously.
      const progress = this.words.reduce<ProgressMap>((accumulator, word) => {
        accumulator[word.id] = word.memory
        return accumulator
      }, {})
      storageService.saveProgress(progress)
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
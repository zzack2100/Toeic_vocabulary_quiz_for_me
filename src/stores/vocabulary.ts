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
  isSyncing: boolean
  lastSyncedAt: string | null
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
    isSyncing: false,
    lastSyncedAt: null,
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
            await this.pullFromCloud()
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
        let word = ''
        let translation = ''
        let partOfSpeech = ''
        let exampleSentence = ''

        if (line.includes('|')) {
          const parts = line.split('|').map((p) => p.trim())
          if (parts.length < 2 || !parts[0] || !parts[1]) {
            skippedCount++
            continue
          }
          word = parts[0]
          translation = parts[1]
          if (parts.length >= 3 && parts[2]) partOfSpeech = parts[2]
          if (parts.length >= 4 && parts[3]) exampleSentence = parts[3]
        } else {
          const commaIdx = line.indexOf(',')
          const dashIdx = line.indexOf(' - ')
          const separatorIdx = commaIdx !== -1 ? commaIdx : dashIdx
          if (separatorIdx === -1) {
            skippedCount++
            continue
          }
          const sepLen = commaIdx !== -1 ? 1 : 3
          word = line.slice(0, separatorIdx).trim()
          translation = line.slice(separatorIdx + sepLen).trim()
        }

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
          part_of_speech: partOfSpeech,
          example_sentence: exampleSentence,
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
    /** Save progress to localStorage only, without triggering a cloud push. */
    persistProgressLocalOnly() {
      const progress = this.words.reduce<ProgressMap>((accumulator, word) => {
        accumulator[word.id] = word.memory
        return accumulator
      }, {})
      storageService.saveProgress(progress)
    },

    /** Pull the latest words from the cloud and merge into local state. */
    async pullFromCloud(): Promise<{ added: number; updated: number }> {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return { added: 0, updated: 0 }

      const cloudWords = await fetchWordsFromCloud(authStore.token!)
      return this.mergeCloudWords(cloudWords)
    },

    /**
     * Merge cloud words into the current local word list.
     * - Words on both sides: keep the version with the newer updatedAt or higher times_seen.
     * - Words only on server: import them locally so they are never lost.
     * - Words only locally: kept as-is (they will be pushed on the next smartSync).
     */
    mergeCloudWords(cloudWords: ToeicWord[]): { added: number; updated: number } {
      const localWordMap = new Map(this.words.map((w) => [w.word.toLowerCase(), w]))
      const customWords = storageService.getCustomVocabulary()
      const customIds = new Set(customWords.map((w) => w.id))
      let added = 0
      let updated = 0

      for (const cw of cloudWords) {
        const cwMemory = cw.memory as unknown as Record<string, unknown>
        const localWord = localWordMap.get(cw.word.toLowerCase())

        if (localWord) {
          // Word exists both locally and on server — pick the newer version
          if (cwMemory) {
            const cloudTimesSeen = (cwMemory.times_seen as number) ?? 0
            const cloudTimesCorrect = (cwMemory.times_correct as number) ?? 0
            const cloudMemoryLevel = (cwMemory.memory_level as number) ?? 0
            const cloudLastTested = cwMemory.last_tested as string | null
            const cloudUpdatedAt = (cw as unknown as Record<string, unknown>).updatedAt as string | undefined

            let useCloud = false
            if (cloudUpdatedAt && localWord.memory.last_reviewed_date) {
              useCloud = new Date(cloudUpdatedAt) > new Date(localWord.memory.last_reviewed_date)
            } else if (cloudUpdatedAt && !localWord.memory.last_reviewed_date) {
              useCloud = true
            } else {
              useCloud = cloudTimesSeen > localWord.memory.times_seen
            }

            if (useCloud) {
              localWord.memory.times_seen = cloudTimesSeen
              localWord.memory.times_correct = cloudTimesCorrect
              localWord.memory.memory_level = cloudMemoryLevel
              if (cloudLastTested) {
                localWord.memory.last_reviewed_date = cloudLastTested
              }
              updated++
            }

            // Always preserve mistake notebook flag (union of both sides)
            if ((cwMemory.is_in_mistake_notebook as boolean) ?? false) {
              localWord.memory.is_in_mistake_notebook = true
            }
          }
        } else {
          // Word only exists on server — import it so it is never lost
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
            localWordMap.set(cw.word.toLowerCase(), this.words[this.words.length - 1])
            added++
          }
        }
      }

      if (added > 0) {
        storageService.saveCustomVocabulary(customWords)
      }
      this.persistProgressLocalOnly()

      // Sync mistake notebook from cloud flags
      const mistakesStore = useMistakesStore()
      mistakesStore.loadNotebook()
      for (const w of this.words) {
        if (w.memory.is_in_mistake_notebook && !mistakesStore.notebook[w.id]) {
          mistakesStore.markMistake(w.id, '')
        }
      }

      return { added, updated }
    },

    /**
     * Pull-before-Push "Sync Now".
     * 1. Fetch the latest data from the server.
     * 2. Merge cloud data with local data (by updatedAt / times_seen).
     * 3. Push the combined list back to the server.
     */
    async smartSync(): Promise<{ added: number; updated: number; pushed: number }> {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) throw new Error('Not authenticated')

      this.isSyncing = true
      this.errorMessage = null
      try {
        // Step 1 & 2: Pull from cloud and merge
        const { added, updated } = await this.pullFromCloud()

        // Step 3: Push the merged word list back to the server
        const mistakesStore = useMistakesStore()
        const reconciledWords = this.words.map((word) => ({
          ...word,
          memory: {
            ...word.memory,
            is_in_mistake_notebook:
              word.id in mistakesStore.notebook
                ? !mistakesStore.notebook[word.id].resolved
                : false,
          },
        }))
        await syncWordsToCloud(reconciledWords, authStore.token!)

        this.lastSyncedAt = new Date().toISOString()
        return { added, updated, pushed: this.words.length }
      } finally {
        this.isSyncing = false
      }
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
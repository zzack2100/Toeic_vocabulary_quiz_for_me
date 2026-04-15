import { defineStore } from 'pinia'
import { storageService } from '../services/storageService'
import { clearAllMistakes } from '../services/mistakesApi'
import { useAuthStore } from './auth'
import { useVocabularyStore } from './vocabulary'
import type { MistakeNotebook } from '../types/vocabulary'

export const useMistakesStore = defineStore('mistakes', {
  state: () => ({
    notebook: {} as MistakeNotebook,
    clearingMistakes: false,
    clearError: null as string | null,
  }),
  getters: {
    mistakeCount: (state) => Object.keys(state.notebook).length,
    activeMistakes: (state) => Object.values(state.notebook).filter((record) => !record.resolved),
    sortedMistakes(): MistakeNotebook[keyof MistakeNotebook][] {
      return Object.values(this.notebook).sort(
        (left, right) => new Date(right.last_wrong_at).getTime() - new Date(left.last_wrong_at).getTime(),
      )
    },
  },
  actions: {
    loadNotebook() {
      this.notebook = storageService.getMistakes()
    },
    markMistake(wordId: string, selectedAnswer: string) {
      const current = this.notebook[wordId]
      this.notebook[wordId] = {
        word_id: wordId,
        wrong_count: current ? current.wrong_count + 1 : 1,
        last_wrong_at: new Date().toISOString(),
        last_selected_answer: selectedAnswer,
        resolved: false,
      }
      storageService.saveMistakes(this.notebook)
    },
    resolveMistake(wordId: string) {
      if (!this.notebook[wordId]) {
        return
      }

      this.notebook[wordId] = {
        ...this.notebook[wordId],
        resolved: true,
      }
      storageService.saveMistakes(this.notebook)
    },
    async clearNotebook() {
      this.clearingMistakes = true
      this.clearError = null

      try {
        const authStore = useAuthStore()
        const vocabularyStore = useVocabularyStore()

        // 1) Clear local notebook cache first (Pinia + localStorage).
        this.notebook = {}
        storageService.saveMistakes(this.notebook)

        // 2) Clear local word memory flags that can rehydrate notebook entries.
        vocabularyStore.clearMistakeNotebookFlags()

        // 3) Await backend route that persists cleared mistake flags in cloud.
        await clearAllMistakes(authStore.token)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to clear mistakes notebook.'
        this.clearError = message
        console.error('Error clearing mistakes:', error)
        throw error
      } finally {
        this.clearingMistakes = false
      }
    },
  },
})
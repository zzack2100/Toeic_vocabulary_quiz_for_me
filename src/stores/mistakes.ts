import { defineStore } from 'pinia'
import { storageService } from '../services/storageService'
import type { MistakeNotebook } from '../types/vocabulary'

export const useMistakesStore = defineStore('mistakes', {
  state: () => ({
    notebook: {} as MistakeNotebook,
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
    clearNotebook() {
      this.notebook = {}
      storageService.saveMistakes(this.notebook)
    },
  },
})
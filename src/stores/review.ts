import { defineStore } from 'pinia'
import { isDue } from '../utils/date'
import type { ToeicWord } from '../types/vocabulary'

export const useReviewStore = defineStore('review', {
  state: () => ({
    dueWordIds: [] as string[],
    lastCalculatedAt: null as string | null,
  }),
  getters: {
    dueCount: (state) => state.dueWordIds.length,
    isWordDue: (state) => (wordId: string) => state.dueWordIds.includes(wordId),
  },
  actions: {
    calculateDueWords(words: ToeicWord[]) {
      this.dueWordIds = words.filter((word) => isDue(word.memory.next_review_date)).map((word) => word.id)
      this.lastCalculatedAt = new Date().toISOString()
    },
  },
})
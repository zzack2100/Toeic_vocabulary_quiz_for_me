export type QuizResult = 'correct' | 'incorrect'

export interface MemoryMetadata {
  memory_level: number
  last_reviewed_date: string | null
  interval_days: number
  next_review_date: string | null
  times_seen: number
  times_correct: number
  times_incorrect: number
  is_in_mistake_notebook: boolean
  last_result: QuizResult | null
}

export interface VocabularySeed {
  id: string
  word: string
  translation_zh_TW: string
  part_of_speech: string
  example_sentence: string
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

export interface ToeicWord extends VocabularySeed {
  memory: MemoryMetadata
}

export interface MistakeRecord {
  word_id: string
  wrong_count: number
  last_wrong_at: string
  last_selected_answer: string
  resolved: boolean
}

export type ProgressMap = Record<string, MemoryMetadata>
export type MistakeNotebook = Record<string, MistakeRecord>
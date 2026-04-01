import { createDefaultMemoryMetadata } from '../utils/spacedRepetition'
import { storageService } from './storageService'
import type { ToeicWord, VocabularySeed } from '../types/vocabulary'

export async function fetchVocabulary(): Promise<ToeicWord[]> {
  const response = await fetch('/data/toeic_vocabulary.json')

  if (!response.ok) {
    throw new Error('Unable to load TOEIC vocabulary data.')
  }

  const records = (await response.json()) as VocabularySeed[]
  const progress = storageService.getProgress()

  return records.map((record) => ({
    ...record,
    memory: progress[record.id] ?? createDefaultMemoryMetadata(),
  }))
}
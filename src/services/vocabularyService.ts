import { createDefaultMemoryMetadata } from '../utils/spacedRepetition'
import { storageService } from './storageService'
import type { ToeicWord, VocabularySeed } from '../types/vocabulary'

export async function fetchVocabulary(): Promise<ToeicWord[]> {
  const response = await fetch('/data/toeic_vocabulary.json')

  if (!response.ok) {
    throw new Error('Unable to load TOEIC vocabulary data.')
  }

  const records = (await response.json()) as VocabularySeed[]
  const customRecords = storageService.getCustomVocabulary()
  const progress = storageService.getProgress()
  const mergedRecords = [...records, ...customRecords].reduce<VocabularySeed[]>((accumulator, record) => {
    if (accumulator.some((existing) => existing.id === record.id)) {
      return accumulator
    }

    accumulator.push(record)
    return accumulator
  }, [])

  return mergedRecords.map((record) => ({
    ...record,
    memory: progress[record.id] ?? createDefaultMemoryMetadata(),
  }))
}

export async function fetchWordsFromCloud(token: string): Promise<ToeicWord[]> {
  const response = await fetch('/api/words', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch words from cloud.')
  }

  return (await response.json()) as ToeicWord[]
}

export async function syncWordsToCloud(words: ToeicWord[], token: string): Promise<void> {
  const payload = words.map((w) => ({
    word: w.word,
    translation: w.translation_zh_TW,
    memory: {
      times_seen: w.memory.times_seen,
      times_correct: w.memory.times_correct,
      last_tested: w.memory.last_reviewed_date,
      memory_level: w.memory.memory_level,
    },
  }))

  const response = await fetch('/api/words/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Failed to sync words to cloud.')
  }
}
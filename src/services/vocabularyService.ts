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
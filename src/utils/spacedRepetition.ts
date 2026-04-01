import { addDays } from './date'
import type { MemoryMetadata, QuizResult } from '../types/vocabulary'

const LEVEL_INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60]

export function createDefaultMemoryMetadata(): MemoryMetadata {
  return {
    memory_level: 0,
    last_reviewed_date: null,
    interval_days: 0,
    next_review_date: null,
    times_seen: 0,
    times_correct: 0,
    times_incorrect: 0,
    is_in_mistake_notebook: false,
    last_result: null,
  }
}

export function getPriorityScore(memory: MemoryMetadata, now = Date.now()): number {
  const dueWeight = !memory.next_review_date || new Date(memory.next_review_date).getTime() <= now ? 50 : 0
  const mistakeWeight = memory.times_incorrect * 10
  const freshnessWeight = Math.max(0, 20 - memory.memory_level * 2)

  return dueWeight + mistakeWeight + freshnessWeight
}

export function updateMemoryMetadata(
  current: MemoryMetadata,
  result: QuizResult,
  resetMemoryOnWrong: boolean,
  reviewedAt = new Date(),
): MemoryMetadata {
  const nextLevel =
    result === 'correct'
      ? Math.min(current.memory_level + 1, LEVEL_INTERVALS.length - 1)
      : resetMemoryOnWrong
        ? 0
        : Math.max(current.memory_level - 1, 0)

  const intervalDays = LEVEL_INTERVALS[nextLevel]

  return {
    ...current,
    memory_level: nextLevel,
    last_reviewed_date: reviewedAt.toISOString(),
    interval_days: intervalDays,
    next_review_date: addDays(reviewedAt, intervalDays),
    times_seen: current.times_seen + 1,
    times_correct: result === 'correct' ? current.times_correct + 1 : current.times_correct,
    times_incorrect: result === 'incorrect' ? current.times_incorrect + 1 : current.times_incorrect,
    is_in_mistake_notebook: result === 'incorrect' ? true : current.is_in_mistake_notebook,
    last_result: result,
  }
}
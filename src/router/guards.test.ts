import { describe, expect, it } from 'vitest'
import { getTodayKey } from '../utils/date'
import { resolveQuizRouteRedirect } from './guards'
import type { DailyQuizSnapshot } from '../types/quiz'

function createSnapshot(overrides: Partial<DailyQuizSnapshot> = {}): DailyQuizSnapshot {
  return {
    date: getTodayKey(),
    questionIds: ['word-1'],
    selectionSummary: {
      due: 1,
      mistake: 0,
      fresh: 0,
      fallback: 0,
      total: 1,
    },
    answers: {},
    currentIndex: 0,
    isSubmitted: false,
    score: 0,
    ...overrides,
  }
}

describe('resolveQuizRouteRedirect', () => {
  it('redirects the result route to home when there is no quiz for today', () => {
    expect(resolveQuizRouteRedirect('quiz-result', null, getTodayKey())).toEqual({ name: 'home' })
  })

  it('redirects the result route to the daily quiz when a draft quiz exists for today', () => {
    expect(resolveQuizRouteRedirect('quiz-result', createSnapshot(), getTodayKey())).toEqual({
      name: 'daily-quiz',
    })
  })

  it('redirects the daily quiz route to the result route when today\'s quiz is already submitted', () => {
    expect(
      resolveQuizRouteRedirect('daily-quiz', createSnapshot({ isSubmitted: true, score: 1 }), getTodayKey()),
    ).toEqual({ name: 'quiz-result' })
  })

  it('treats stale snapshots as unavailable when checking the result route', () => {
    expect(
      resolveQuizRouteRedirect('quiz-result', createSnapshot({ date: '2000-01-01' }), getTodayKey()),
    ).toEqual({ name: 'home' })
  })

  it('allows unrelated routes to proceed without redirection', () => {
    expect(resolveQuizRouteRedirect('mistakes', createSnapshot({ isSubmitted: true }), getTodayKey())).toBe(true)
  })
})
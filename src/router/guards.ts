import type { DailyQuizSnapshot } from '../types/quiz'

type QuizRouteGuardTarget = 'home' | 'daily-quiz' | 'quiz-result'

export function resolveQuizRouteRedirect(
  toName: string | symbol | null | undefined,
  snapshot: DailyQuizSnapshot | null,
  todayKey: string,
): true | { name: QuizRouteGuardTarget } {
  const hasQuizForToday = Boolean(
    snapshot && snapshot.date === todayKey && snapshot.questionIds.length > 0,
  )
  const hasSubmittedQuizForToday = Boolean(hasQuizForToday && snapshot?.isSubmitted)

  if (toName === 'quiz-result' && !hasSubmittedQuizForToday) {
    return hasQuizForToday ? { name: 'daily-quiz' } : { name: 'home' }
  }

  if (toName === 'daily-quiz' && hasSubmittedQuizForToday) {
    return { name: 'quiz-result' }
  }

  return true
}
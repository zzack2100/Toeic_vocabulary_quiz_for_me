import type { QuizCompositionSummary, QuizQuestion } from '../types/quiz'
import type { ToeicWord } from '../types/vocabulary'
import { isDue } from './date'
import { getPriorityScore } from './spacedRepetition'

const QUIZ_MIX = {
  due: 0.5,
  mistake: 0.3,
  fresh: 0.2,
} as const

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

function pickDistractors(words: ToeicWord[], answer: ToeicWord): string[] {
  const samePartOfSpeech = words.filter(
    (candidate) => candidate.id !== answer.id && candidate.part_of_speech === answer.part_of_speech,
  )
  const fallback = words.filter((candidate) => candidate.id !== answer.id)
  const pool = shuffle([...samePartOfSpeech, ...fallback])

  return Array.from(new Set(pool.map((entry) => entry.translation_zh_TW))).slice(0, 3)
}

function weightedPick(words: ToeicWord[]): ToeicWord | null {
  if (words.length === 0) {
    return null
  }

  const weights = words.map((word) => Math.max(1, getPriorityScore(word.memory)))
  const totalWeight = weights.reduce((sum, value) => sum + value, 0)
  let cursor = Math.random() * totalWeight

  for (let index = 0; index < words.length; index += 1) {
    cursor -= weights[index]
    if (cursor <= 0) {
      return words[index]
    }
  }

  return words.at(-1) ?? null
}

function selectWeightedWords(candidates: ToeicWord[], count: number): ToeicWord[] {
  const pool = [...candidates]
  const selected: ToeicWord[] = []

  while (pool.length > 0 && selected.length < count) {
    const picked = weightedPick(pool)

    if (!picked) {
      break
    }

    selected.push(picked)
    const pickedIndex = pool.findIndex((word) => word.id === picked.id)
    pool.splice(pickedIndex, 1)
  }

  return selected
}

function isLowExposure(word: ToeicWord): boolean {
  return word.memory.times_seen <= 2
}

function calculateBucketTargets(total: number) {
  const due = Math.floor(total * QUIZ_MIX.due)
  const mistake = Math.floor(total * QUIZ_MIX.mistake)
  const fresh = total - due - mistake

  return { due, mistake, fresh }
}

function createEmptySummary(total = 0): QuizCompositionSummary {
  return {
    due: 0,
    mistake: 0,
    fresh: 0,
    fallback: 0,
    total,
  }
}

function classifyWord(word: ToeicWord): keyof Omit<QuizCompositionSummary, 'total' | 'fallback'> {
  if (isDue(word.memory.next_review_date)) {
    return 'due'
  }

  if (word.memory.is_in_mistake_notebook) {
    return 'mistake'
  }

  return 'fresh'
}

function summarizeWords(words: ToeicWord[]): QuizCompositionSummary {
  const summary = createEmptySummary(words.length)

  words.forEach((word) => {
    summary[classifyWord(word)] += 1
  })

  return summary
}

function selectWordsForQuiz(
  words: ToeicWord[],
  quizSize: number,
): { selectedWords: ToeicWord[]; summary: QuizCompositionSummary } {
  const targetSize = Math.min(quizSize, words.length)

  if (targetSize === 0) {
    return {
      selectedWords: [],
      summary: createEmptySummary(),
    }
  }

  // Filter out words the learner has already answered correctly more than once.
  const eligiblePool = words.filter((word) => word.memory.times_correct <= 1)

  // Fallback: if the filtered pool is too small, fill remaining slots with the
  // oldest-reviewed mastered words so the quiz never breaks.
  let pool: ToeicWord[]
  if (eligiblePool.length >= targetSize) {
    pool = eligiblePool
  } else {
    const eligibleIds = new Set(eligiblePool.map((w) => w.id))
    const masteredWords = words
      .filter((w) => !eligibleIds.has(w.id))
      .sort((a, b) => {
        const aDate = a.memory.last_reviewed_date ?? ''
        const bDate = b.memory.last_reviewed_date ?? ''
        return aDate.localeCompare(bDate)
      })
    pool = [...eligiblePool, ...masteredWords.slice(0, targetSize - eligiblePool.length)]
  }

  const targets = calculateBucketTargets(targetSize)

  const dueCandidates = pool.filter((word) => isDue(word.memory.next_review_date))
  const dueSelected = selectWeightedWords(dueCandidates, targets.due)

  const dueSelectedIds = new Set(dueSelected.map((word) => word.id))
  const mistakeCandidates = pool.filter(
    (word) => !dueSelectedIds.has(word.id) && word.memory.is_in_mistake_notebook,
  )
  const mistakeSelected = selectWeightedWords(mistakeCandidates, targets.mistake)

  const reservedIds = new Set([...dueSelected, ...mistakeSelected].map((word) => word.id))
  const freshCandidates = pool.filter(
    (word) => !reservedIds.has(word.id) && (word.memory.times_seen === 0 || isLowExposure(word)),
  )
  const freshSelected = selectWeightedWords(freshCandidates, targets.fresh)

  const currentSelection = [...dueSelected, ...mistakeSelected, ...freshSelected]
  const selectedIds = new Set(currentSelection.map((word) => word.id))
  const remainingCandidates = [...pool]
    .filter((word) => !selectedIds.has(word.id))
    .sort((left, right) => getPriorityScore(right.memory) - getPriorityScore(left.memory))

  const remainingNeeded = targetSize - currentSelection.length
  const fallbackSelected = selectWeightedWords(remainingCandidates, remainingNeeded)

  const summary = summarizeWords([...currentSelection, ...fallbackSelected])
  summary.fallback = fallbackSelected.length
  summary.total = targetSize

  return {
    selectedWords: shuffle([...currentSelection, ...fallbackSelected]),
    summary,
  }
}

export function buildQuizQuestions(
  words: ToeicWord[],
  quizSize: number,
): { questions: QuizQuestion[]; summary: QuizCompositionSummary } {
  const { selectedWords, summary } = selectWordsForQuiz(words, quizSize)

  return {
    summary,
    questions: selectedWords.map((word) => {
    const options = shuffle([word.translation_zh_TW, ...pickDistractors(words, word)]).slice(0, 4)

    return {
      wordId: word.id,
      prompt: word.word,
      correctAnswer: word.translation_zh_TW,
      options,
    }
    }),
  }
}

export function buildQuizFromIds(words: ToeicWord[], questionIds: string[]): QuizQuestion[] {
  return questionIds
    .map((id) => words.find((entry) => entry.id === id))
    .filter((entry): entry is ToeicWord => Boolean(entry))
    .map((word) => ({
      wordId: word.id,
      prompt: word.word,
      correctAnswer: word.translation_zh_TW,
      options: shuffle([word.translation_zh_TW, ...pickDistractors(words, word)]).slice(0, 4),
    }))
}

export function summarizeQuizFromIds(words: ToeicWord[], questionIds: string[]): QuizCompositionSummary {
  const selectedWords = questionIds
    .map((id) => words.find((entry) => entry.id === id))
    .filter((entry): entry is ToeicWord => Boolean(entry))

  return summarizeWords(selectedWords)
}
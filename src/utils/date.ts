export function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function isDue(nextReviewDate: string | null, now = Date.now()): boolean {
  if (!nextReviewDate) {
    return true
  }

  return new Date(nextReviewDate).getTime() <= now
}

export function addDays(date: Date, days: number): string {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next.toISOString()
}

export function formatDateLabel(value: string | null): string {
  if (!value) {
    return 'Not reviewed yet'
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}
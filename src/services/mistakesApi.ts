export async function clearAllMistakes(token?: string | null): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch('/api/mistakes/clear', {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(errorBody?.error || 'Failed to clear mistakes from database.')
  }
}

export async function fetchMistakes(token: string): Promise<void> {
  const response = await fetch('/api/mistakes', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch mistakes from database.')
  }

  return await response.json()
}

export async function recordMistake(
  token: string,
  mistake: {
    wordId: string
    word: string
    wrongCount: number
    lastWrongAt: string
    lastSelectedAnswer: string
    resolved: boolean
  },
): Promise<void> {
  const response = await fetch('/api/mistakes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(mistake),
  })

  if (!response.ok) {
    throw new Error('Failed to record mistake.')
  }

  return await response.json()
}

export async function deleteMistake(token: string, wordId: string): Promise<void> {
  const response = await fetch(`/api/mistakes/${wordId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete mistake.')
  }
}

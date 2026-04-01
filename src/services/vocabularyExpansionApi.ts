import type { VocabularySeed } from '../types/vocabulary'

interface ExpandVocabularyResponse extends VocabularySeed {
  difficulty: 'medium'
  tags: string[]
}

export async function requestVocabularyExpansion(topic: string): Promise<VocabularySeed[]> {
  const response = await fetch('/api/vocabulary/expand', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic }),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null

    throw new Error(errorPayload?.message ?? 'Unable to expand vocabulary for the requested topic.')
  }

  return (await response.json()) as ExpandVocabularyResponse[]
}
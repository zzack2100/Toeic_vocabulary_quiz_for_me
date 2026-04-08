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

export async function fetchImageForWord(imagePrompt: string): Promise<string> {
  try {
    const response = await fetch(`/api/vocabulary/image?prompt=${encodeURIComponent(imagePrompt)}`)

    if (!response.ok) return ''

    const data = (await response.json()) as { image_url: string }
    return data.image_url ?? ''
  } catch {
    return ''
  }
}

export async function fetchImagesInBatch(prompts: string[]): Promise<string[]> {
  try {
    const response = await fetch('/api/vocabulary/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompts }),
    })

    if (!response.ok) return prompts.map(() => '')

    return (await response.json()) as string[]
  } catch {
    return prompts.map(() => '')
  }
}
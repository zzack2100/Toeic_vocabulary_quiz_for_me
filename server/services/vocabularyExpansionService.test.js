import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createCompletionMock } = vi.hoisted(() => ({
  createCompletionMock: vi.fn(),
}))

vi.mock('openai', () => ({
  default: class OpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: createCompletionMock,
        },
      }
    }
  },
}))

import {
  buildLlmRequest,
  expandVocabularyByTopic,
} from './vocabularyExpansionService.js'

function buildGeneratedItem(index) {
  return {
    word: `generated-word-${index}`,
    translation_zh_TW: `翻譯-${index}`,
    part_of_speech: 'noun',
    example_sentence: `Generated example sentence ${index}.`,
    difficulty: 'medium',
    tags: ['generated', 'toeic'],
  }
}

describe('vocabularyExpansionService', () => {
  beforeEach(() => {
    createCompletionMock.mockReset()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the ranked mock implementation when OPENAI_API_KEY is missing', async () => {
    const result = await expandVocabularyByTopic('Business Negotiations')

    expect(createCompletionMock).not.toHaveBeenCalled()
    expect(result.words).toHaveLength(20)
    expect(result.words.every((item) => item.difficulty === 'medium')).toBe(true)
    expect(result.words.every((item) => item.tags.includes('Business Negotiations'))).toBe(true)
  })

  it('uses gpt-4o-mini and maps a successful OpenAI response into the frontend schema', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    createCompletionMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(Array.from({ length: 20 }, (_, index) => buildGeneratedItem(index + 1))),
          },
        },
      ],
    })

    const result = await expandVocabularyByTopic('Financial Reports')

    expect(buildLlmRequest('Financial Reports').model).toBe('gpt-4o-mini')
    expect(createCompletionMock).toHaveBeenCalledTimes(1)
    expect(result.words).toHaveLength(20)
    expect(result.words[0]).toMatchObject({
      word: 'generated-word-1',
      translation_zh_TW: '翻譯-1',
      part_of_speech: 'noun',
      example_sentence: 'Generated example sentence 1.',
      difficulty: 'medium',
    })
    expect(result.words[0].tags).toContain('Financial Reports')
    expect(typeof result.words[0].id).toBe('string')
    expect(result.words[0].id.length).toBeGreaterThan(0)
  })

  it('falls back to the mock implementation when the OpenAI call fails', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    createCompletionMock.mockRejectedValueOnce(new Error('boom'))

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await expandVocabularyByTopic('Travel and Transport')

    expect(createCompletionMock).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    expect(result.words).toHaveLength(20)
    expect(result.words.every((item) => item.tags.includes('Travel and Transport'))).toBe(true)
  })
})
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from './app.js'

const EXPECTED_KEYS = [
  'difficulty',
  'example_sentence',
  'id',
  'image_prompt',
  'image_url',
  'part_of_speech',
  'tags',
  'translation_zh_TW',
  'word',
]

describe('TOEIC vocabulary expansion API', () => {
  it('rejects requests without a valid topic string', async () => {
    const response = await request(app).post('/api/vocabulary/expand').send({ topic: '   ' })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: 'Invalid request payload.',
      message: 'The "topic" field is required and must be a non-empty string.',
    })
  })

  it('returns 20 TOEIC-level vocabulary objects for a topic', async () => {
    const topic = 'Business Negotiations'
    const response = await request(app).post('/api/vocabulary/expand').send({ topic })

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body).toHaveLength(20)

    const ids = new Set()
    const words = new Set()

    for (const item of response.body) {
      expect(Object.keys(item).sort()).toEqual(EXPECTED_KEYS)
      expect(typeof item.id).toBe('string')
      expect(item.id.length).toBeGreaterThan(0)
      expect(typeof item.word).toBe('string')
      expect(item.word.length).toBeGreaterThan(0)
      expect(typeof item.translation_zh_TW).toBe('string')
      expect(item.translation_zh_TW.length).toBeGreaterThan(0)
      expect(typeof item.part_of_speech).toBe('string')
      expect(item.part_of_speech.length).toBeGreaterThan(0)
      expect(typeof item.example_sentence).toBe('string')
      expect(item.example_sentence.length).toBeGreaterThan(0)
      expect(item.difficulty).toBe('medium')
      expect(Array.isArray(item.tags)).toBe(true)
      expect(item.tags).toContain(topic)
      expect(item.tags.length).toBeGreaterThan(0)

      ids.add(item.id)
      words.add(item.word)
    }

    expect(ids.size).toBe(20)
    expect(words.size).toBe(20)
  })
})
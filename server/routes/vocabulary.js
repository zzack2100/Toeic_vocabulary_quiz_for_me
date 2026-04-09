import { Router } from 'express'
import { expandVocabularyByTopic, fetchUnsplashImageUrl, resolveImageUrls } from '../services/vocabularyExpansionService.js'

const vocabularyRouter = Router()

vocabularyRouter.get('/image', async (request, response, next) => {
  try {
    const prompt = typeof request.query.prompt === 'string' ? request.query.prompt.trim() : ''

    if (!prompt) {
      response.status(400).json({ error: 'Missing "prompt" query parameter.' })
      return
    }

    const imageUrl = await fetchUnsplashImageUrl(prompt)
    response.status(200).json({ image_url: imageUrl })
  } catch (error) {
    next(error)
  }
})

vocabularyRouter.post('/images', async (request, response, next) => {
  try {
    const prompts = Array.isArray(request.body?.prompts) ? request.body.prompts : []

    if (prompts.length === 0 || !prompts.every((p) => typeof p === 'string')) {
      response.status(400).json({ error: '"prompts" must be a non-empty array of strings.' })
      return
    }

    const words = prompts.map((p) => ({ image_prompt: p.trim(), image_url: '' }))
    const resolved = await resolveImageUrls(words)
    response.status(200).json(resolved.map((w) => w.image_url))
  } catch (error) {
    next(error)
  }
})

vocabularyRouter.post('/expand', async (request, response, next) => {
  try {
    const topic = typeof request.body?.topic === 'string' ? request.body.topic.trim() : ''

    if (!topic) {
      response.status(400).json({
        error: 'Invalid request payload.',
        message: 'The "topic" field is required and must be a non-empty string.',
      })
      return
    }

    const { words } = await expandVocabularyByTopic(topic)
    response.status(200).json(words)
  } catch (error) {
    next(error)
  }
})

export { vocabularyRouter }
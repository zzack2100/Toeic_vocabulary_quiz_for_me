import { Router } from 'express'
import { expandVocabularyByTopic, fetchUnsplashImageUrl } from '../services/vocabularyExpansionService.js'

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
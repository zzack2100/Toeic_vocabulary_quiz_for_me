import { Router } from 'express'
import { expandVocabularyByTopic } from '../services/vocabularyExpansionService.js'

const vocabularyRouter = Router()

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
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { generateReadingQuiz } from '../services/readingQuizService.js'

export const quizRouter = Router()

quizRouter.use(authMiddleware)

quizRouter.post('/generate-reading', async (req, res, next) => {
  try {
    const { words } = req.body

    if (!Array.isArray(words) || words.length !== 5 || !words.every((w) => typeof w === 'string' && w.trim().length > 0)) {
      return res.status(400).json({ error: 'Request body must contain a "words" array of exactly 5 non-empty strings.' })
    }

    const sanitizedWords = words.map((w) => w.trim().slice(0, 100))

    const quiz = await generateReadingQuiz(sanitizedWords)

    res.json(quiz)
  } catch (error) {
    next(error)
  }
})

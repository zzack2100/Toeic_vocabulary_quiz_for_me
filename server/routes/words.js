import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { Word } from '../models/Word.js'

export const wordsRouter = Router()

wordsRouter.use(authMiddleware)

wordsRouter.get('/', async (req, res) => {
  try {
    const words = await Word.find({ userId: req.user.userId })
    res.json(words)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch words.' })
  }
})

wordsRouter.post('/sync', async (req, res) => {
  try {
    const words = req.body
    if (!Array.isArray(words)) {
      return res.status(400).json({ error: 'Request body must be an array of words.' })
    }

    const ops = words.map((w) =>
      Word.updateOne(
        { userId: req.user.userId, word: w.word },
        {
          $set: {
            translation: w.translation,
            memory: w.memory,
          },
          $setOnInsert: {
            userId: req.user.userId,
            word: w.word,
          },
        },
        { upsert: true },
      ),
    )
    await Promise.all(ops)

    res.json({ synced: words.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Sync failed.' })
  }
})

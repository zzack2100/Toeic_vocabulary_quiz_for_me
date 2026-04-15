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

    const ops = words.map((w) => ({
      updateOne: {
        filter: { userId: req.user.userId, word: w.word },
        update: {
          $set: {
            translation: w.translation,
            memory: w.memory,
            image_url: w.image_url,
            image_prompt: w.image_prompt,
          },
          $setOnInsert: {
            userId: req.user.userId,
            word: w.word,
          },
        },
        upsert: true,
      },
    }))
    await Word.bulkWrite(ops)

    res.json({ synced: words.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Sync failed.' })
  }
})

wordsRouter.post('/reset-progress', async (req, res) => {
  try {
    await Word.updateMany(
      { userId: req.user.userId },
      {
        $set: {
          'memory.times_seen': 0,
          'memory.times_correct': 0,
          'memory.memory_level': 0,
          'memory.last_tested': null,
          'memory.is_in_mistake_notebook': false,
        },
      },
    )
    res.json({ message: 'Progress reset successfully.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to reset progress.' })
  }
})

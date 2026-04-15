import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { Mistake } from '../models/Mistake.js'
import { clearMistakes } from '../controllers/mistakesController.js'

export const mistakesRouter = Router()

mistakesRouter.use(authMiddleware)

// Get all mistakes for the current user
mistakesRouter.get('/', async (req, res) => {
  try {
    const mistakes = await Mistake.find({ userId: req.user.userId })
    res.json(mistakes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch mistakes.' })
  }
})

// Clear all mistakes for the current user
mistakesRouter.delete('/clear', clearMistakes)

// Create or update a mistake record
mistakesRouter.post('/', async (req, res) => {
  try {
    const { wordId, word, wrongCount, lastWrongAt, lastSelectedAnswer, resolved } = req.body

    if (!wordId || !word) {
      return res.status(400).json({ error: 'wordId and word are required.' })
    }

    const mistake = await Mistake.findOneAndUpdate(
      { userId: req.user.userId, wordId },
      {
        userId: req.user.userId,
        wordId,
        word,
        wrongCount: wrongCount || 1,
        lastWrongAt: lastWrongAt || new Date(),
        lastSelectedAnswer: lastSelectedAnswer || '',
        resolved: resolved || false,
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    )

    res.json(mistake)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create/update mistake.' })
  }
})

// Remove a specific mistake record
mistakesRouter.delete('/:wordId', async (req, res) => {
  try {
    const result = await Mistake.deleteOne({
      userId: req.user.userId,
      wordId: req.params.wordId,
    })
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Mistake record not found.' })
    }
    res.json({ message: 'Mistake deleted successfully.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete mistake.' })
  }
})

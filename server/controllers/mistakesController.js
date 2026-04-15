import { Word } from '../models/Word.js'

export async function clearMistakes(request, response) {
  try {
    const wordsResult = await Word.updateMany(
      { userId: request.user.userId },
      {
        $set: {
          'memory.is_in_mistake_notebook': false,
        },
      },
    )

    response.status(200).json({
      message: 'All mistakes cleared successfully.',
      updatedWords: wordsResult.modifiedCount ?? 0,
    })
  } catch (error) {
    console.error(error)
    response.status(500).json({ error: 'Failed to clear mistakes.' })
  }
}

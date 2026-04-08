import mongoose from 'mongoose'

const wordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  word: { type: String, required: true },
  translation: { type: String, required: true },
  memory: {
    times_seen: { type: Number, default: 0 },
    times_correct: { type: Number, default: 0 },
    last_tested: { type: String, default: null },
    memory_level: { type: Number, default: 0 },
  },
})

export const Word = mongoose.model('Word', wordSchema)

import mongoose from 'mongoose'

const wordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true ,index: true },
  word: { type: String, required: true },
  translation: { type: String, required: true },
  image_url: { type: String, default: '' },
  image_prompt: { type: String, default: '' },
  memory: {
    times_seen: { type: Number, default: 0 },
    times_correct: { type: Number, default: 0 },
    last_tested: { type: String, default: null },
    memory_level: { type: Number, default: 0 },
    is_in_mistake_notebook: { type: Boolean, default: false },
  },
}, { timestamps: true })

export const Word = mongoose.model('Word', wordSchema)

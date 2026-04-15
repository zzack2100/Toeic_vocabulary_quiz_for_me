import mongoose from 'mongoose'

const mistakeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wordId: { type: String, required: true },
  word: { type: String, required: true },
  wrongCount: { type: Number, default: 1 },
  lastWrongAt: { type: Date, default: Date.now },
  lastSelectedAnswer: { type: String, default: '' },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

export const Mistake = mongoose.model('Mistake', mistakeSchema)

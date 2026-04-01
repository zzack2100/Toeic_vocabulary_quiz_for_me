import cors from 'cors'
import express from 'express'
import { vocabularyRouter } from './routes/vocabulary.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/vocabulary', vocabularyRouter)

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({
    error: 'Internal server error.',
    message: 'Vocabulary expansion failed unexpectedly.',
  })
})

export { app }
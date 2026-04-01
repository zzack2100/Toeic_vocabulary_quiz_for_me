import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { vocabularyRouter } from './routes/vocabulary.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', 'dist')

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3001']

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin requests (origin is undefined) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
  }),
)
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

// Serve Vue SPA static files
app.use(express.static(distPath))

// SPA fallback — let Vue Router handle client-side routes
app.get('*path', (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'))
})

export { app }
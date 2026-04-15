import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { vocabularyRouter } from './routes/vocabulary.js'
import { authRouter } from './routes/auth.js'
import { wordsRouter } from './routes/words.js'
import { mistakesRouter } from './routes/mistakes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', 'dist')

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3001']

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again after 15 minutes.' },
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})

const app = express()

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        connectSrc: ["'self'", 'https://accounts.google.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      },
    },
  }),
)
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

app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  next()
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/words', wordsRouter)
app.use('/api/mistakes', mistakesRouter)
app.use('/api/vocabulary', vocabularyRouter)

// Serve Vue SPA static files
app.use(express.static(distPath))

// SPA fallback — let Vue Router handle client-side routes
app.get('*path', (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'))
})

// Error handler must be after all routes (including SPA fallback)
app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({
    error: 'Internal server error.',
    message: 'Vocabulary expansion failed unexpectedly.',
  })
})

export { app }
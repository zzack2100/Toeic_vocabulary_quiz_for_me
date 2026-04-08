import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { User } from '../models/User.js'

const SALT_ROUNDS = 10
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({ email, password: hashedPassword })

    res.status(201).json({ id: user._id, email: user.email })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Registration failed.' })
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.json({ token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Login failed.' })
  }
})

authRouter.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token.' })
    }

    const email = payload.email
    let user = await User.findOne({ email })

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex')
      const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS)
      user = await User.create({ email, password: hashedPassword })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.json({ token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Google authentication failed.' })
  }
})

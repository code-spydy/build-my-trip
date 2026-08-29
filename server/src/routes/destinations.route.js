// GET /api/destinations
import { Router } from 'express'
import { destinations } from '../data/destinations.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json(destinations)
})

export default router

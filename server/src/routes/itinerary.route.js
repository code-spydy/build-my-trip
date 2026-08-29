// POST /api/itinerary/generate, POST /api/itinerary/pdf
import { Router } from 'express'
import { generate, pdf } from '../controllers/itinerary.controller.js'

const router = Router()

router.post('/generate', generate)
router.post('/pdf', pdf)

export default router

// Express app: cors, json middleware, mount routes (exported for tests).
import express from 'express'
import cors from 'cors'
import destinationsRoute from './routes/destinations.route.js'
import itineraryRoute from './routes/itinerary.route.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/destinations', destinationsRoute)
app.use('/api/itinerary', itineraryRoute)
app.use(errorHandler)

export default app

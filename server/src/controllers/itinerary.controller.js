// Request handlers for itinerary generate and PDF endpoints.
// Validate -> services -> shape response. No business logic lives here.
import { itinerarySchema } from '../validators/itinerarySchema.js'
import { getDestinationById } from '../data/destinations.js'
import { generateItinerary } from '../services/itinerary/itineraryGenerator.js'
import { calculateCost } from '../services/cost/costCalculator.js'
import { generatePdf } from '../services/pdf/pdfGenerator.js'

function formatDeparture(payload) {
  if (payload.flexible || !payload.departureDate) return 'Flexible'
  return new Date(payload.departureDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function parseBody(body, res) {
  const result = itinerarySchema.safeParse(body)
  if (!result.success) {
    res.status(400).json({
      message: 'Invalid request body',
      errors: result.error.flatten().fieldErrors,
    })
    return null
  }
  return result.data
}

function buildResult(payload) {
  const destination = getDestinationById(payload.destinationId)

  const { itineraryDays } = generateItinerary({
    destination,
    interests: payload.interests,
    days: payload.days,
    tripType: payload.tripType,
  })

  const cost = calculateCost({
    pricePerNight: destination.pricePerNight,
    rooms: payload.rooms,
    days: payload.days,
    itineraryDays,
  })

  return {
    destination: {
      id: destination.id,
      name: destination.name,
      coverImage: destination.coverImage,
    },
    itineraryDays,
    cost,
    meta: {
      nights: Math.max(payload.days - 1, 0),
      travelers: payload.travelers,
      rooms: payload.rooms,
    },
  }
}

export function generate(req, res) {
  const payload = parseBody(req.body, res)
  if (!payload) return

  const response = buildResult(payload)

  res.status(200).json(response)
}

export async function pdf(req, res, next) {
  const payload = parseBody(req.body, res)
  if (!payload) return

  try {
    const result = buildResult(payload)
    const destination = getDestinationById(payload.destinationId)

    const buffer = await generatePdf({
      destination,
      itineraryDays: result.itineraryDays,
      cost: result.cost,
      contact: payload.contact,
      meta: {
        days: payload.days,
        tripType: payload.tripType,
        travelStyle: payload.travelStyle,
        departureDate: formatDeparture(payload),
        travelers: payload.travelers,
        rooms: payload.rooms,
        nights: result.meta.nights,
        pricePerNight: destination.pricePerNight,
      },
    })

    const safeName = destination.name.replace(/[^a-z0-9]+/gi, '-')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-itinerary.pdf"`)
    res.send(buffer)
  } catch (error) {
    next(error)
  }
}

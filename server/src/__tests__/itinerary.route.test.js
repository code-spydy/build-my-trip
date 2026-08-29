import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { destinations } from '../data/destinations.js'

const validPayload = () => ({
  destinationId: destinations[0].id,
  tripType: 'Group',
  travelStyle: 'Couple',
  travelers: 2,
  rooms: 1,
  adultsPerRoom: 2,
  interests: ['adventure', 'culture'],
  durationBucket: '5-7',
  days: 5,
  departureDate: '2099-01-01',
  flexible: false,
  contact: { name: 'Test User', phone: '9876543210' },
})

describe('POST /api/itinerary/generate', () => {
  it('rejects an empty body with field errors', async () => {
    const response = await request(app).post('/api/itinerary/generate').send({})

    expect(response.status).toBe(400)
    expect(response.body.errors).toBeDefined()
    expect(response.body.errors.destinationId).toBeTruthy()
  })

  it('rejects a past departure date when not flexible', async () => {
    const response = await request(app)
      .post('/api/itinerary/generate')
      .send({ ...validPayload(), departureDate: '2000-01-01' })

    expect(response.status).toBe(400)
    expect(response.body.errors.departureDate).toBeTruthy()
  })

  it('returns a generated itinerary for valid input', async () => {
    const response = await request(app).post('/api/itinerary/generate').send(validPayload())

    expect(response.status).toBe(200)
    expect(response.body.itineraryDays).toHaveLength(5)
    expect(response.body.cost.total).toBeGreaterThan(0)
  })
})

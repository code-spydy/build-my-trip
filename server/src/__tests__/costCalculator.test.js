import { describe, it, expect } from 'vitest'
import { calculateCost } from '../services/cost/costCalculator.js'
import { ACTIVITY_FLAT_RATE } from '../utils/constants.js'

describe('costCalculator', () => {
  it('charges accommodation per room, not per traveler', () => {
    const cost = calculateCost({
      pricePerNight: 4500,
      rooms: 2,
      days: 5,
      itineraryDays: [{ day: 1, title: 'x', activities: [] }],
    })

    // travelers deliberately mismatched from rooms — this must NOT factor in.
    expect(cost.accommodation).toBe(4500 * 2 * 4)
  })

  it('excludes leisure days from activity cost', () => {
    const itineraryDays = [
      {
        day: 1,
        title: 'x',
        activities: [
          { name: 'Real 1', interest: 'adventure' },
          { name: 'Real 2', interest: 'culture' },
        ],
      },
      {
        day: 2,
        title: 'y',
        activities: [{ name: 'Leisure Day', interest: 'leisure', isLeisure: true }],
      },
    ]

    const cost = calculateCost({ pricePerNight: 3500, rooms: 1, days: 3, itineraryDays })

    expect(cost.activities).toBe(ACTIVITY_FLAT_RATE * 2)
  })

  it('sums accommodation and activities into the total, in INR', () => {
    const itineraryDays = [
      { day: 1, title: 'x', activities: [{ name: 'Real', interest: 'adventure' }] },
    ]

    const cost = calculateCost({ pricePerNight: 1000, rooms: 1, days: 2, itineraryDays })

    expect(cost.total).toBe(cost.accommodation + cost.activities)
    expect(cost.currency).toBe('INR')
  })
})

import { describe, it, expect } from 'vitest'
import { generateItinerary } from '../services/itinerary/itineraryGenerator.js'

function activity(name, interest, duration = 'half-day') {
  return { name, interest, duration }
}

describe('itineraryGenerator', () => {
  it('interleaves matched interests instead of grouping them', () => {
    const destination = {
      activities: [
        activity('Adventure A', 'adventure'),
        activity('Adventure B', 'adventure'),
        activity('Adventure C', 'adventure'),
        activity('Culture A', 'culture'),
        activity('Culture B', 'culture'),
        activity('Culture C', 'culture'),
      ],
    }

    const { itineraryDays } = generateItinerary({
      destination,
      interests: ['adventure', 'culture'],
      days: 4,
      tripType: 'Group',
    })

    const orderedNames = itineraryDays.flatMap((day) => day.activities.map((a) => a.name))
    const firstCultureIndex = orderedNames.indexOf('Culture A')
    const lastAdventureIndex = orderedNames.lastIndexOf('Adventure C')

    expect(firstCultureIndex).toBeGreaterThanOrEqual(0)
    expect(firstCultureIndex).toBeLessThan(lastAdventureIndex)
  })

  it('prefers leisure days over repeats when data is thin and the trip is long', () => {
    const destination = {
      activities: [activity('Only Adventure', 'adventure'), activity('Only Culture', 'culture')],
    }

    const { itineraryDays } = generateItinerary({
      destination,
      interests: ['adventure', 'culture'],
      days: 10,
      tripType: 'Custom',
    })

    const leisureCount = itineraryDays.filter((day) =>
      day.activities.some((a) => a.isLeisure)
    ).length
    const repeatCount = itineraryDays.filter((day) =>
      day.activities.some((a) => a.isRepeat)
    ).length

    expect(leisureCount).toBeGreaterThan(5)
    expect(repeatCount).toBe(0)
  })

  it('falls back to a flagged repeat only once leisure budget and real activities are exhausted', () => {
    const destination = {
      activities: [activity('Only Activity', 'adventure')],
    }

    const { itineraryDays } = generateItinerary({
      destination,
      interests: ['adventure'],
      days: 10,
      tripType: 'Group',
    })

    const repeatDays = itineraryDays.filter((day) => day.activities.some((a) => a.isRepeat))

    expect(repeatDays.length).toBeGreaterThan(0)
    expect(repeatDays[0].activities[0].name).toMatch(/^Revisit:/)
  })

  it('is deterministic for identical input', () => {
    const destination = {
      activities: [
        activity('A', 'adventure'),
        activity('B', 'culture'),
        activity('C', 'leisure'),
        activity('D', 'attractions', 'full-day'),
      ],
    }

    const input = { destination, interests: ['adventure', 'culture'], days: 6, tripType: 'Group' }

    const first = generateItinerary(structuredClone(input))
    const second = generateItinerary(structuredClone(input))

    expect(first).toEqual(second)
  })
})

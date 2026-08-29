// Cost math: accommodation is charged per room (the correct hotel model),
// not per traveler. Leisure days contribute no activity cost.
import { ACTIVITY_FLAT_RATE } from '../../utils/constants.js'

export function calculateCost({ pricePerNight, rooms, days, itineraryDays }) {
  const nights = Math.max(days - 1, 0)
  const accommodation = pricePerNight * rooms * nights

  const realActivityCount = itineraryDays.reduce((count, day) => {
    return count + day.activities.filter((activity) => !activity.isLeisure).length
  }, 0)

  const activities = ACTIVITY_FLAT_RATE * realActivityCount
  const total = accommodation + activities

  return {
    accommodation,
    activities,
    total,
    activityCount: realActivityCount,
    currency: 'INR',
  }
}

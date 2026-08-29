// Core day-distribution algorithm.
//
// Distributes a destination's activities across `days`, matching selected
// `interests` as closely as possible, without lazily repeating the same
// activities. Deterministic: identical input always produces identical output
// (no Math.random / Date.now / unordered-iteration dependence anywhere here).
import { INTEREST_ORDER, FLOURISHES } from '../../utils/constants.js'
import { pickDayTitle } from '../../utils/dayTitles.js'

const DAY_CAPACITY_UNITS = 2
const FULL_DAY_UNITS = 2
const HALF_DAY_UNITS = 1

function unitsFor(activity) {
  return activity.duration === 'full-day' ? FULL_DAY_UNITS : HALF_DAY_UNITS
}

// Buckets activities by interest, split into "selected by the traveler" and
// "not selected" — each bucket ordered by INTEREST_ORDER, not submission order.
function partitionByInterest(activities, selectedInterests) {
  const selectedSet = new Set(selectedInterests)
  const matched = new Map(INTEREST_ORDER.map((interest) => [interest, []]))
  const unmatched = new Map(INTEREST_ORDER.map((interest) => [interest, []]))

  for (const activity of activities) {
    const bucket = selectedSet.has(activity.interest) ? matched : unmatched
    if (!bucket.has(activity.interest)) bucket.set(activity.interest, [])
    bucket.get(activity.interest).push(activity)
  }

  return { matched, unmatched }
}

// Round-robins across each interest's queue (in INTEREST_ORDER) so e.g.
// [adventure, culture] alternates rather than draining one interest first.
function roundRobin(byInterest) {
  const queues = INTEREST_ORDER.map((interest) => [...(byInterest.get(interest) || [])]).filter(
    (queue) => queue.length > 0
  )

  const pool = []
  let remaining = queues.reduce((sum, queue) => sum + queue.length, 0)

  while (remaining > 0) {
    for (const queue of queues) {
      if (queue.length === 0) continue
      pool.push(queue.shift())
      remaining -= 1
    }
  }

  return pool
}

// How many days get a designated "Leisure Day" for pacing.
// - scarcityFloor: days real content literally cannot cover, even at max packing.
// - customBonus: an additive nudge so Custom trips visibly get more leisure
//   than Group trips even when data is abundant (not just when it's thin).
// - maxLeisureDays: a tripType-dependent ceiling (Group stays busier) so that
//   genuine scarcity on a Group trip can still spill into Tier 4 rather than
//   leisure silently absorbing 100% of the deficit.
function computeLeisureBudget(days, poolUnits, tripType) {
  const scarcityFloor = Math.max(0, days - Math.ceil(poolUnits / 2))
  const customBonus = tripType === 'Custom' ? Math.max(1, Math.round(days * 0.15)) : 0
  const rawBudget = scarcityFloor + customBonus

  const maxLeisureRatio = tripType === 'Custom' ? 0.9 : 0.5
  const maxLeisureDays = Math.floor(days * maxLeisureRatio)

  return Math.min(rawBudget, maxLeisureDays, Math.max(days - 1, 0))
}

// Spreads leisureBudget days evenly across the trip. Custom trips bias each
// index earlier ("leisure inserted sooner"); Group trips don't.
function computeLeisureDayIndices(days, leisureBudget, tripType) {
  const indices = new Set()
  if (leisureBudget <= 0) return indices

  const spacing = days / (leisureBudget + 1)
  const bias = tripType === 'Custom' ? Math.max(0, Math.floor(spacing / 3)) : 0

  for (let i = 1; i <= leisureBudget; i += 1) {
    let index = Math.round(spacing * i) - bias
    index = Math.min(days, Math.max(1, index))
    while (indices.has(index) && index < days) index += 1
    indices.add(index)
  }

  return indices
}

function makeLeisureDay() {
  return {
    name: 'Leisure Day',
    interest: 'leisure',
    duration: 'full-day',
    isLeisure: true,
    description: 'Free time to explore at your own pace.',
  }
}

function makeRepeat(activity, flourishCursor) {
  const flourish = FLOURISHES[flourishCursor % FLOURISHES.length]
  return {
    ...activity,
    name: `Revisit: ${activity.name} ${flourish}`,
    isRepeat: true,
  }
}

function dominantInterest(activities) {
  const unitsByInterest = new Map()
  for (const activity of activities) {
    const units = unitsFor(activity)
    unitsByInterest.set(activity.interest, (unitsByInterest.get(activity.interest) || 0) + units)
  }

  let best = null
  let bestUnits = -1
  for (const interest of INTEREST_ORDER) {
    const units = unitsByInterest.get(interest) || 0
    if (units > bestUnits) {
      bestUnits = units
      best = interest
    }
  }

  return best || 'leisure'
}

export function generateItinerary({ destination, interests, days, tripType }) {
  const activities = destination?.activities ?? []
  const { matched, unmatched } = partitionByInterest(activities, interests ?? [])

  // Tier 1 (matched, interleaved) followed by Tier 2 (unmatched, interleaved) —
  // consumed sequentially day by day, no cross-day lookahead/reordering.
  const combinedPool = [...roundRobin(matched), ...roundRobin(unmatched)]

  const poolUnits = combinedPool.reduce((sum, activity) => sum + unitsFor(activity), 0)
  const leisureBudget = computeLeisureBudget(days, poolUnits, tripType)
  const leisureDayIndices = computeLeisureDayIndices(days, leisureBudget, tripType)

  let poolCursor = 0
  let repeatCursor = 0
  let leisureUsed = 0
  const itineraryDays = []

  for (let day = 1; day <= days; day += 1) {
    const dayActivities = []
    let unitsLeft = DAY_CAPACITY_UNITS

    const scheduledLeisure = leisureDayIndices.has(day) && leisureUsed < leisureBudget

    if (scheduledLeisure) {
      dayActivities.push(makeLeisureDay())
      leisureUsed += 1
    } else {
      // Fill from the pool. If the next item doesn't fit the remaining
      // capacity, leave the spare unit unused rather than reordering —
      // simpler, fully deterministic, reads as an intentionally lighter day.
      while (unitsLeft > 0 && poolCursor < combinedPool.length) {
        const next = combinedPool[poolCursor]
        const cost = unitsFor(next)
        if (cost > unitsLeft) break
        dayActivities.push(next)
        poolCursor += 1
        unitsLeft -= cost
      }

      // Pool is genuinely exhausted and the day is otherwise empty: fall
      // back to Tier 3 (leisure, if budget remains) or Tier 4 (flagged repeat).
      if (dayActivities.length === 0) {
        if (leisureUsed < leisureBudget) {
          dayActivities.push(makeLeisureDay())
          leisureUsed += 1
        } else if (combinedPool.length > 0) {
          const source = combinedPool[repeatCursor % combinedPool.length]
          dayActivities.push(makeRepeat(source, repeatCursor))
          repeatCursor += 1
        }
      }
    }

    itineraryDays.push({
      day,
      title: pickDayTitle(dominantInterest(dayActivities), day),
      activities: dayActivities,
    })
  }

  return { itineraryDays }
}

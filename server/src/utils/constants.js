// Shared server-side constants.
export const API_PREFIX = '/api'

// Flat per-activity cost estimate used by the cost calculator.
export const ACTIVITY_FLAT_RATE = 800

// Canonical interest ordering — used to make round-robin interleaving and
// "dominant interest" tie-breaking deterministic regardless of submission order.
export const INTEREST_ORDER = ['adventure', 'culture', 'attractions', 'leisure']

export const TRIP_TYPES = ['Group', 'Custom']
export const TRAVEL_STYLES = ['Solo', 'Friends', 'Couple', 'Family']
export const INTERESTS = ['adventure', 'leisure', 'culture', 'attractions']

export const DURATION_RANGES = {
  '3-5': { min: 3, max: 5 },
  '5-7': { min: 5, max: 7 },
  '7-9': { min: 7, max: 9 },
  '10+': { min: 10, max: 30 },
}

// Kept value-identical to the client's INTEREST_META colors and the PDF palette.
export const INTEREST_COLORS = {
  adventure: '#E8623D',
  culture: '#7C3F68',
  leisure: '#0F766E',
  attractions: '#F2A93B',
}

// Deterministic flourishes for Tier-4 (last-resort repeat) relabeling.
export const FLOURISHES = [
  'at sunset',
  'once more',
  'in the evening light',
  'again, differently',
]

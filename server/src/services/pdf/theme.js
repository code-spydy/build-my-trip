// Central style constants for the itinerary PDF. Keep every hex value here,
// not scattered across component files — this is also the single source of
// truth the frontend's interest tags (wizard + on-screen result) should
// mirror, so colors stay consistent between the web UI and the PDF.

export const COLORS = {
  pageBg: '#FFFFFF',
  textDark: '#2B3A42',
  textMuted: '#6B6862',
  textFaint: '#B8B5AC',
  hairline: '#F2F0EB',
  bannerPlaceholderBg: '#EFEDE8',
  bannerPlaceholderText: '#121212',
  bannerEyebrow: '#121212',
  bannerTripLine: '#121212',
}

// Pale-tint pair per interest — { bg, text } — used for both the day-chip
// background and the small activity tag. Kept value-identical to the
// client's INTEREST_META colors so the same interest reads the same way in
// the wizard, the on-screen result, and the PDF.
export const INTEREST_STYLES = {
  adventure: { bg: '#FBF6F2', text: '#C08A6B' },
  leisure: { bg: '#F1F7F6', text: '#5E9C93' },
  culture: { bg: '#FBF1F6', text: '#B06B93' },
  attractions: { bg: '#FDF6E8', text: '#C79A3E' },
}

// Used for the day-number chip and italic line on a fallback "leisure day"
// (no real activity data — see itineraryGenerator's Tier 3 fallback).
export const LEISURE_DAY_STYLE = { bg: '#F5F3EE', text: '#B8AF9C' }

// Fact tiles on the cover (Departure / Travelers / Est. total) alternate
// between these two tints purely for visual rhythm — no semantic meaning.
export const FACT_TILE_TINTS = {
  coral: { bg: '#FBF6F2', label: '#C08A6B' },
  teal: { bg: '#F1F7F6', label: '#5E9C93' },
}

export const SPACING = {
  pagePaddingX: 24,
  pagePaddingY: 24,
}

// Deliberately "Rs." instead of the ₹ glyph (U+20B9) — that symbol isn't in
// every font's glyph coverage and can silently drop out of PDF text with no
// error (just a missing character). "Rs." is zero-risk across any Latin font.
export function formatINR(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`
}

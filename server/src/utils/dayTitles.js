// Small interest -> evocative day-title mapping. Not hardcoded per destination,
// and not random — picked by day index so it stays deterministic.
export const DAY_TITLE_FRAGMENTS = {
  adventure: ['Adventure & ascent', 'Into the wild', 'Chasing adrenaline'],
  culture: ['Heritage & heart', 'Stories in stone', 'A living tradition'],
  attractions: ['Landmarks & light', 'Icons of the city', 'Postcard moments'],
  leisure: ['A day unhurried', 'Slow mornings, soft afternoons', 'Ease and elsewhere'],
  mixed: ['A day of many things', 'Threads of the trip', 'Somewhere in between'],
}

export function pickDayTitle(interest, dayIndex) {
  const fragments = DAY_TITLE_FRAGMENTS[interest] || DAY_TITLE_FRAGMENTS.mixed
  return fragments[(dayIndex - 1) % fragments.length]
}

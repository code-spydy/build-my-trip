// The server dataset doesn't carry geo-coordinates (it doesn't need them for
// itinerary/cost logic), so the globe's [lng, lat] lookup lives client-side
// only. Same values as journey-globe/src/data/destinations.sample.json.
const DESTINATION_COORDS = {
  1: [115.19, -8.41], // Bali, Indonesia
  2: [75.8, 12.42], // Coorg, Karnataka
  3: [74.12, 15.3], // Goa
};

export function withCoords(destinations = []) {
  return destinations.map((destination) => ({
    ...destination,
    coords: DESTINATION_COORDS[destination.id] || [0, 0],
  }));
}

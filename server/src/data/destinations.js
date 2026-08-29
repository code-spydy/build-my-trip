// Loads the sample destination dataset. The only file a real DB would later replace.
import { readFileSync } from 'node:fs'

const dataPath = new URL('./destinations.json', import.meta.url)
export const destinations = JSON.parse(readFileSync(dataPath, 'utf-8'))

export function getDestinationById(id) {
  return destinations.find((destination) => destination.id === id) || null
}

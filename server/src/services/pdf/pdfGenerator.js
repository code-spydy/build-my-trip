// Builds the dynamic, data-driven trip PDF (@react-pdf/renderer, not html-to-pdf).
import React from 'react'
import { readFileSync } from 'node:fs'
import { renderToBuffer } from '@react-pdf/renderer'
import ItineraryDocument from './ItineraryDocument.js'

const FALLBACK_IMAGE_PATH = new URL('../../../assets/images/fallback-cover.jpg', import.meta.url)
const FETCH_TIMEOUT_MS = 4000

function localFallbackDataUri() {
  const buffer = readFileSync(FALLBACK_IMAGE_PATH)
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}

// The banner photo is fetched live per-destination from the internet (real
// destination photography, not a generic bundled placeholder) and resolved
// to a base64 data: URI *before* rendering, never inside the render tree —
// so a slow/failed fetch can never crash PDF generation, only fall back to a
// bundled local image instead.
async function resolveCoverImage(url) {
  if (!url) return localFallbackDataUri()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) throw new Error(`Cover image fetch failed with status ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`
  } catch {
    return localFallbackDataUri()
  }
}

/**
 * @param {object} data
 *   destination: { name, coverImage: <remote URL> }
 *   meta: { days, tripType, travelStyle, departureDate, travelers, rooms, nights, pricePerNight }
 *   itineraryDays, cost, contact — straight from the generator/cost services
 * @returns {Promise<Buffer>}
 */
export async function generatePdf({ destination, meta, itineraryDays, cost, contact }) {
  const coverImage = await resolveCoverImage(destination?.coverImage)

  return renderToBuffer(
    React.createElement(ItineraryDocument, {
      destination: { ...destination, coverImage },
      meta,
      itineraryDays,
      cost,
      contact,
    })
  )
}

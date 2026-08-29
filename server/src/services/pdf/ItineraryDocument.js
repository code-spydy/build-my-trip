import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import './fonts/register.js'
import FactTile from './components/FactTile.js'
import DayRow from './components/DayRow.js'
import CostLine from './components/CostLine.js'
import { COLORS, SPACING, formatINR } from './theme.js'

const h = React.createElement

const PAGE_WIDTH = 595.28 // A4, points
const BANNER_HEIGHT = 280

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.pageBg,
    fontFamily: 'Inter',
    // Both paddings are reserved at the PAGE level (not on an inner flowing
    // View) so they're correctly re-applied on every physical page react-pdf
    // generates. Padding set on a View that spans multiple pages only takes
    // effect once — at the very start/end of its first/last page — it does
    // NOT reserve space on every intermediate page. That mismatch is exactly
    // what caused (a) the cost-summary text rendering underneath the fixed
    // footer on page 1, and (b) content starting flush against the top edge
    // with no breathing room on page 2+. Page-level padding doesn't have
    // that problem; it's re-applied fresh on every page.
    paddingTop: SPACING.pagePaddingY,
    paddingBottom: 56,
  },
  body: {
    paddingHorizontal: SPACING.pagePaddingX,
  },

  // ---- cover / banner ----
  // `position: absolute` (relative to the Page, like footerRow below)
  // instead of a negative marginTop on a normal-flow element — confirmed by
  // actually rendering both to PNG: the negative-margin version was fine on
  // its own, but do NOT combine either with `zIndex` (see BannerFade below —
  // that's the one that silently drops elements in this react-pdf version).
  bannerWrap: {
    position: 'absolute',
    top: -SPACING.pagePaddingY,
    left: 0,
    width: PAGE_WIDTH,
    height: BANNER_HEIGHT,
    backgroundColor: COLORS.bannerPlaceholderBg,
  },
  // Normal-flow placeholder reserving the vertical space the (now
  // absolutely-positioned, out-of-flow) banner visually occupies, so `body`
  // starts right below it instead of underneath it.
  bannerSpacer: {
    height: BANNER_HEIGHT,
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PAGE_WIDTH,
    height: BANNER_HEIGHT,
    objectFit: 'cover',
  },
  bannerPlaceholderText: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PAGE_WIDTH,
    height: BANNER_HEIGHT,
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.bannerPlaceholderText,
    textAlign: 'center',
    // react-pdf has no flex-center-in-absolute shortcut for Text; nudge down
    // roughly to vertical center of the banner instead.
    paddingTop: BANNER_HEIGHT / 2 - 5,
  },
  bannerTextWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.5,
    color: COLORS.bannerEyebrow,
    marginBottom: 4,
  },
  destinationName: {
    fontSize: 26,
    fontWeight: 700,
    color: COLORS.textDark,
    marginBottom: 6,
  },
  tripLine: {
    fontSize: 12.5,
    color: COLORS.bannerTripLine,
  },
  factsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  preparedFor: {
    fontSize: 11,
    color: COLORS.textFaint,
    marginTop: 16,
  },

  // ---- day-by-day ----
  dayByDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.textDark,
  },
  mutedSmall: {
    fontSize: 11,
    color: COLORS.textFaint,
  },

  // ---- cost summary ----
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FBF6F2',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 600,
    color: '#C08A6B',
  },
  disclaimer: {
    fontSize: 10,
    color: COLORS.textFaint,
    marginTop: 14,
    lineHeight: 1.5,
  },
  footerRow: {
    position: 'absolute',
    left: SPACING.pagePaddingX,
    right: SPACING.pagePaddingX,
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textFaint,
  },
})

// A light fade (transparent -> near-white) over the bottom of the banner
// photo, so overlaid text stays readable without a dark scrim.
//
// This is built from stacked flat, non-overlapping rectangles instead of an
// SVG <LinearGradient> — react-pdf's SVG gradient support renders
// inconsistently across PDF viewers (Chrome/PDF.js, Preview, poppler all
// interpret the gradient axis differently in testing; one viewer showed it
// running left-to-right instead of top-to-bottom). Plain solid-color Views
// with a fixed opacity are unambiguous in every renderer, since there's no
// gradient axis to misinterpret in the first place.
// 36 bands (not 8) so individual steps are sub-pixel at print resolution —
// 8 was coarse enough to show as visible banding/stripes across the fade
// instead of reading as a smooth gradient.
const FADE_BAND_COUNT = 36
const FADE_HEIGHT_RATIO = 0.7 // bottom 70% of the (now taller) banner fades to white

function BannerFade() {
  const fadeHeight = BANNER_HEIGHT * FADE_HEIGHT_RATIO
  const bandHeight = fadeHeight / FADE_BAND_COUNT
  const startY = BANNER_HEIGHT - fadeHeight

  return h(
    React.Fragment,
    null,
    ...Array.from({ length: FADE_BAND_COUNT }).map((_, i) => {
      // Eased ramp (not linear) so the fade feels smoother near the top.
      const opacity = Math.pow((i + 1) / FADE_BAND_COUNT, 1.6) * 0.96
      return h(View, {
        key: i,
        style: {
          position: 'absolute',
          left: 0,
          right: 0,
          // +1px overlap between bands avoids hairline seams from
          // sub-pixel rounding at each band's edge.
          top: startY + i * bandHeight,
          height: bandHeight + 1,
          backgroundColor: '#FFFFFF',
          opacity,
        },
      })
    })
  )
}

/**
 * ItineraryDocument
 *
 * Props (all required unless noted):
 *  - destination: { name, coverImage } — coverImage is a data: URI (resolved
 *    by pdfGenerator.js, which fetches the real per-destination photo from
 *    the internet with a bundled local fallback — see that file).
 *  - meta: { days, tripType, travelStyle, departureDate, travelers, rooms, nights, pricePerNight }
 *  - itineraryDays: [{ day, title, activities: [{ name, interest }] }]
 *    (a leisure day is signaled by an isLeisure activity entry — see DayRow)
 *  - cost: { accommodation, activities, total, activityCount }
 *  - contact: { name, phone }
 */
export default function ItineraryDocument({ destination, meta, itineraryDays, cost, contact }) {
  return h(
    Document,
    { title: `${destination?.name || 'Trip'} itinerary — DEYOR` },
    // Single continuous flow — NOT three fixed pages. react-pdf auto-paginates
    // whatever doesn't fit, so a short 3-day trip might render on 1-2 pages
    // and a long 10-day trip spreads across as many as it actually needs,
    // with no manual page-count decisions here.
    h(
      Page,
      { size: 'A4', style: styles.page, wrap: true },
      h(
        View,
        { style: styles.bannerWrap },
        destination.coverImage
          ? h(Image, { src: destination.coverImage, style: styles.bannerImage })
          : h(
              Text,
              { style: styles.bannerPlaceholderText },
              `${destination.name.toUpperCase()} DESTINATION PHOTOGRAPH`
            ),
        h(BannerFade),
        h(
          View,
          { style: styles.bannerTextWrap },
          h(Text, { style: styles.eyebrow }, 'CURATED ITINERARY'),
          h(Text, { style: styles.destinationName }, destination.name),
          h(
            Text,
            { style: styles.tripLine },
            `${meta.days} days  ·  ${meta.tripType} trip  ·  ${meta.travelStyle}`
          )
        )
      ),
      h(View, { style: styles.bannerSpacer }),

      h(
        View,
        { style: styles.body },
        h(
          View,
          { style: styles.factsRow },
          h(FactTile, { label: 'DEPARTURE', value: meta.departureDate, tint: 'coral' }),
          h(FactTile, {
            label: 'TRAVELERS',
            value: `${meta.travelers} · ${meta.rooms} rooms`,
            tint: 'teal',
          }),
          h(FactTile, { label: 'EST. TOTAL', value: formatINR(cost.total), tint: 'coral' })
        ),
        h(Text, { style: styles.preparedFor }, `Prepared for ${contact.name} · ${contact.phone}`),

        h(
          View,
          { style: [styles.dayByDayHeader, { marginTop: 28 }] },
          h(Text, { style: styles.sectionTitle }, 'Your journey, day by day'),
          h(Text, { style: styles.mutedSmall }, `${destination.name} · ${meta.days} days`)
        ),
        ...itineraryDays.map((day) =>
          // wrap={false} keeps one day's block from being split across a
          // page boundary — the document as a whole still auto-paginates,
          // this just stops an individual day from being torn in half.
          h(View, { key: day.day, wrap: false }, h(DayRow, { day }))
        ),

        h(Text, { style: [styles.sectionTitle, { marginTop: 20, marginBottom: 18 }] }, 'Cost summary'),
        h(CostLine, {
          label: 'Accommodation',
          detail: `(${formatINR(meta.pricePerNight)} x ${meta.nights} nights x ${meta.rooms} rooms)`,
          value: cost.accommodation,
        }),
        h(CostLine, {
          label: 'Activities',
          detail: `(${cost.activityCount} activities)`,
          value: cost.activities,
        }),
        h(
          View,
          { style: styles.totalBox, wrap: false },
          h(Text, { style: styles.totalLabel }, 'Estimated total'),
          h(Text, { style: styles.totalValue }, formatINR(cost.total))
        ),
        h(
          Text,
          { style: styles.disclaimer },
          'Estimates only. Final pricing confirmed at booking. Excludes flights, visa, and personal expenses.'
        )
      ),

      // `fixed` repeats this on every page react-pdf ends up generating, at
      // the same position, with the real page count — never hardcode "Page 3
      // of 3", the number of pages isn't a fixed fact anymore.
      h(
        View,
        { style: styles.footerRow, fixed: true },
        h(Text, { style: styles.footerText }, 'deyor · community-led experiential travel'),
        h(Text, {
          style: styles.footerText,
          render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`,
        })
      )
    )
  )
}

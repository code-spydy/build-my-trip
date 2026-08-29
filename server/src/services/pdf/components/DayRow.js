import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { COLORS, INTEREST_STYLES, LEISURE_DAY_STYLE } from '../theme.js'

const h = React.createElement

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  chip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: 600,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: 600,
    color: COLORS.textDark,
    marginTop: 2,
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  activityText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: COLORS.textMuted,
  },
  tag: {
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: 600,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  leisureText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontStyle: 'italic',
    color: LEISURE_DAY_STYLE.text,
  },
})

// day shape: { day: number, title: string, activities: [{name, interest}] }
// A leisure-day fallback (see itineraryGenerator Tier 3) has activities
// containing an isLeisure entry (or an empty array) — rendered distinctly.
export default function DayRow({ day, isLast }) {
  const isLeisure = !day.activities?.length || day.activities.some((a) => a.isLeisure)
  const chipStyle = isLeisure
    ? LEISURE_DAY_STYLE
    : INTEREST_STYLES[day.activities[0].interest] || LEISURE_DAY_STYLE

  return h(
    View,
    { style: [styles.row, isLast && { marginBottom: 0 }] },
    h(
      View,
      { style: [styles.chip, { backgroundColor: chipStyle.bg }] },
      h(Text, { style: [styles.chipText, { color: chipStyle.text }] }, String(day.day).padStart(2, '0'))
    ),
    h(
      View,
      { style: styles.body },
      h(Text, { style: styles.title }, day.title),
      isLeisure
        ? h(Text, { style: styles.leisureText }, 'Free day — explore at your own pace')
        : day.activities.map((a, i) => {
            const tagStyle = INTEREST_STYLES[a.interest] || INTEREST_STYLES.leisure
            return h(
              View,
              { key: i, style: styles.activityRow },
              h(Text, { style: styles.activityText }, a.name),
              h(
                Text,
                { style: [styles.tag, { backgroundColor: tagStyle.bg, color: tagStyle.text }] },
                a.interest.charAt(0).toUpperCase() + a.interest.slice(1)
              )
            )
          })
    )
  )
}

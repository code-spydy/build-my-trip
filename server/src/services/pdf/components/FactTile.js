import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { COLORS, FACT_TILE_TINTS } from '../theme.js'

const h = React.createElement

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: 600,
    color: COLORS.textDark,
    marginTop: 3,
  },
})

// tint: 'coral' | 'teal' — purely visual alternation, see theme.js
export default function FactTile({ label, value, tint }) {
  const t = FACT_TILE_TINTS[tint] || FACT_TILE_TINTS.coral

  return h(
    View,
    { style: [styles.tile, { backgroundColor: t.bg }] },
    h(Text, { style: [styles.label, { color: t.label }] }, label),
    h(Text, { style: styles.value }, value)
  )
}

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { COLORS, formatINR } from '../theme.js'

const h = React.createElement

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: COLORS.textMuted,
  },
  detail: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: COLORS.textFaint,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: COLORS.textDark,
  },
})

// e.g. CostLine({ label: "Accommodation", detail: "(Rs. 4,500 x 4 nights x 2 rooms)", value: 36000 })
export default function CostLine({ label, detail, value }) {
  return h(
    View,
    { style: styles.row },
    h(Text, { style: styles.label }, label, ' ', h(Text, { style: styles.detail }, detail)),
    h(Text, { style: styles.value }, formatINR(value))
  )
}

// @react-pdf/renderer embeds real font files into the PDF; it can't use a
// browser-style CSS font-family lookup. Inter's static per-weight files ship
// via the @fontsource/inter npm package (true single-weight WOFF files, not
// a variable font instanced at render time — fontkit's variable-font weight
// selection is inconsistent, so real static files per weight are safer).
import { fileURLToPath } from 'node:url'
import { Font } from '@react-pdf/renderer'

function resolveFont(subpath) {
  return fileURLToPath(import.meta.resolve(`@fontsource/inter/files/${subpath}`))
}

Font.register({
  family: 'Inter',
  fonts: [
    { src: resolveFont('inter-latin-400-normal.woff'), fontWeight: 400 },
    { src: resolveFont('inter-latin-600-normal.woff'), fontWeight: 600 },
    { src: resolveFont('inter-latin-700-normal.woff'), fontWeight: 700 },
    // DayRow's leisure-day line uses fontStyle: 'italic' — without this,
    // @react-pdf/renderer throws "Could not resolve font for Inter,
    // fontWeight 400, fontStyle italic" at render time (found by actually
    // generating a PDF, not from reading the code).
    { src: resolveFont('inter-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
  ],
})

// react-pdf sometimes needs hyphenation disabled for tighter, more
// predictable line breaks on short headings/labels.
Font.registerHyphenationCallback((word) => [word])

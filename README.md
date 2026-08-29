# Deyor — Build My Trip

A guided, 5-step trip-itinerary builder. Pick a destination on a D3 globe,
fly stop-to-stop through a wizard, get a real day-by-day itinerary with a
cost breakdown, and download it as a dynamically-built PDF.

## Overview

The flow: a full-screen D3 orthographic globe for destination selection →
an animated flight path with 5 milestones, each opening a modal with one
wizard step (Trip Basics, Travelers & Rooms, Interests, Duration & Dates,
Review & Generate) → a POST to the API generates the itinerary → the result
renders on screen with a "Download PDF" button that streams a real,
data-driven PDF (cover photo + gradient, day-by-day timeline, cost summary).

No auth, no database — sample destination data lives in a JSON file on the
server, structured so a real data layer could replace it without touching
routes, controllers, or services.

## Architecture

Two independent npm projects, no monorepo tooling:

```
client/   Vite + React (JS/JSX, no TypeScript)
server/   Node + Express (ESM)
```

**Server is stateless.** Both `/api/itinerary/generate` and
`/api/itinerary/pdf` take the *entire* wizard payload on every request —
there's no session, and the PDF endpoint independently re-runs itinerary
generation from the same input rather than reading back a previous result.
That only works because generation is deterministic (no `Math.random()`,
no unordered iteration) given identical input.

**Separation of concerns**, server side:

```
routes/       HTTP wiring only (path -> controller)
controllers/  validate -> call services -> shape response. No business logic.
services/     pure functions: itineraryGenerator, costCalculator, pdfGenerator
validators/   zod schema — the single gate for untrusted input
data/         the sample dataset (the only piece a real DB would replace)
```

**Client state** is a single `useReducer` (`useWizardState`) holding the
wizard's form data, status, and result — no Redux/Zustand. Each step is a
`Formik` form validated by a `Yup` schema that mirrors the server's zod
rules. The globe/flight-path UI (`JourneyGlobe`) owns its own step/milestone
progression via a second, separate reducer; it hands each milestone's modal
content back to the real step components rather than owning any form logic
itself.

## Data flow

```
[Wizard steps] --dispatch--> [useReducer: useWizardState]
      |
      | Review step submit (full payload: destination, trip type, travelers,
      | interests, duration, dates, contact)
      v
POST /api/itinerary/generate --zod validate--> itineraryGenerator + costCalculator
      |
      v
{ destination, itineraryDays[], cost{}, meta{} } --> rendered on screen
      |
      | "Download PDF" (resends the same payload)
      v
POST /api/itinerary/pdf --validate--> regenerate (same, deterministic) --> pdfGenerator --> application/pdf stream
```

## Tech stack

**Client** — Vite, React 19, antd (themed via `ConfigProvider`, used
throughout: `Select`, `Modal`, `Timeline`, `Descriptions`, `Statistic`, a
range `DatePicker`), `d3` + `topojson-client` (the globe), `framer-motion`,
`axios`, `formik` + `yup`, `react-router-dom`.

**Server** — Express (ESM), `zod` (validation), `@react-pdf/renderer` +
`@fontsource/inter` (the PDF, built server-side from real data — not a
screenshot or print-to-PDF), `vitest` + `supertest` (tests), `nodemon`.

## Setup

### Server

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

API runs on `http://localhost:5000`.

### Client

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

Vite app runs on `http://localhost:5173` and talks to `VITE_API_BASE_URL`
(default `http://localhost:5000/api`).

### Tests

```bash
cd server
npm test
```

10 tests across the itinerary generator, cost calculator, and API validation
(vitest + supertest).

## AI tool notes

Built with **Claude Code (Sonnet 5)**. The repo started scaffolded — routing,
state management, the API client, and theming were in place, but every piece
of business logic and every presentational component was an empty stub.
Claude wrote essentially all of that: the itinerary algorithm, cost
calculation, validation, the PDF, and the full wizard UI. Two pieces were
ported from provided reference implementations rather than designed from
scratch — the D3 globe/flight-path component and the PDF's
`@react-pdf/renderer` document — kept as-is by direction.


## Assumptions

- `ACTIVITY_FLAT_RATE` = ₹800 per scheduled real activity; leisure days are free.
- Accommodation is charged **per room**, not per traveler.
- Leisure days are a deliberate, budgeted pacing device (more on Custom trips
  than Group trips), not a fallback — repeats are a genuine last resort and
  are explicitly flagged.
- Destination is chosen via the globe before the 5-step wizard begins, not as
  a field inside "Trip Basics."
- PDF currency renders as "Rs." rather than "₹" (glyph-coverage risk in PDF
  fonts); the web UI still uses ₹.

## Deployment

- **Client** → Vercel/Netlify (`npm run build` in `client/`). Set
  `VITE_API_BASE_URL` to the deployed server's URL.
- **Server** → Render/Railway. Configure CORS to allow the deployed client
  origin.
- Live deployment link: https://build-my-trip-ten.vercel.app/ .
- GitHub repo: https://github.com/code-spydy/build-my-trip .

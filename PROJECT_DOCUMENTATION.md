# Deyor — "Build My Trip" · Project Documentation

> Full-stack guided trip-itinerary builder with a dynamically generated PDF.
> This document is the single source of truth for architecture, logic, and
> conventions. Read this before writing any code.

---

## 1. Project Overview

### 1.1 What we are building
A small full-stack web app where a traveler moves through a **5-step guided
wizard**, and at the end receives:
1. An on-screen **day-by-day itinerary** generated from their choices.
2. A **downloadable, dynamically-built PDF** of that itinerary.

The wizard is presented as a **journey**: a D3 globe to pick the destination,
then an animated airplane that flies along a flight path, stopping at 5
milestones. At each milestone a modal opens with that step's form.

### 1.2 What we are explicitly NOT building
Scope discipline is graded. Do **not** build:
- Authentication / user accounts
- A database or ORM (in-memory / JSON sample data only)
- Saved trips, sharing, email sending
- A redux/zustand/mobx layer (React `useReducer` is the state solution)
- Any step, field, or feature not described in this document

The code must be **structured so persistence could be added later** without
rearchitecting — but persistence itself is out of scope.

### 1.3 Effort target
6–8 hours of focused work. Judgment over completeness.

### 1.4 Evaluation weighting (drives where effort goes)
| Area | Weight | Where it lives |
|---|---|---|
| Engineering quality & AI-assisted dev | 50% | itinerary logic, clean/extensible code, AI-debug story |
| Frontend/UX + PDF design | 35% | wizard flow visuals, PDF quality |
| Backend logic & scope judgment | 15% | architecture, validation, knowing what not to build |

**Highest-leverage areas: the itinerary-generation algorithm (50%) and the
PDF design (35%). Spend disproportionate effort there.**

---

## 2. Tech Stack & Libraries

### 2.1 Frontend
| Library | Purpose | Notes |
|---|---|---|
| **Vite + React** | App framework | JavaScript + JSX only. **No TypeScript.** |
| **antd (Ant Design)** | UI component library | Must be themed via `ConfigProvider` — do not ship default look |
| **axios** | HTTP client | Single configured instance in `api/client.js` |
| **d3** + **topojson-client** | Globe + route visuals | `geoOrthographic` projection (SVG, not WebGL) |
| **framer-motion** | Transitions | Globe→mini-tracker morph, modal transitions |
| **react-router-dom** | Routing | Minimal — effectively one main flow |

### 2.2 Backend
| Library | Purpose | Notes |
|---|---|---|
| **Node + Express** | REST API | ES modules (`"type":"module"`) |
| **cors** | Cross-origin | Client and server run on different ports/hosts |
| **dotenv** | Env config | `PORT`, etc. |
| **zod** | Validation | Schema-first; server is source of truth |
| **@react-pdf/renderer** | Dynamic PDF | Server-side, data-driven — NOT html-to-pdf |
| **vitest** + **supertest** | Testing | Unit tests for logic; API test for validation |
| **nodemon** | Dev reload | |

### 2.3 Why these choices (defend in interview)
- **antd**: fast to build accessible, consistent forms; the effort goes into
  *theming* it so it doesn't look generic (the brief warns against generic forms).
- **d3 orthographic globe** over three.js: looks premium (real geography,
  animated route) at ~10% of the build cost/risk of a WebGL globe. Pure SVG →
  mobile-safe, dark-mode easy, no texture/CORS headaches. This is a deliberate
  scope-vs-wow tradeoff.
- **@react-pdf/renderer** over pdfmake/puppeteer: genuinely data-driven PDF
  (satisfies "not a screenshot/print-to-PDF"), reuses React mental model, no
  grey-area of "rendering a webpage." pdfkit is too low-level; puppeteer risks
  reading as print-to-PDF.
- **useReducer** over redux: the app is small; a single reducer is the right
  amount of structure — predictable, testable, no dependency. Redux would be
  over-engineering (and scope judgment is graded).

---

## 3. High-Level Architecture

### 3.1 Repo shape (two independent npm projects)
```
deyor-trip-builder/
├── client/          # Vite + React (JS/JSX)
├── server/          # Node + Express (ESM)
├── CLAUDE.md        # AI project memory
├── AI_NOTES.md      # running log of AI bugs/fixes + assumptions
├── README.md
└── .gitignore
```
No monorepo tooling (workspaces/turbo) — kept simple deliberately.

### 3.2 Data flow
```
[Wizard UI] --collects--> [useReducer state]
      |
      | final submit (full payload)
      v
POST /api/itinerary/generate --validate(zod)--> [itineraryGenerator] + [costCalculator]
      |
      v
{ itineraryDays[], cost{}, meta{} }  --> rendered on screen
      |
      | user clicks "Download PDF" (resend same payload)
      v
POST /api/itinerary/pdf --validate--> regenerate --> [pdfGenerator] --> application/pdf stream
```

### 3.3 Stateless server (key architectural decision)
The server stores **nothing** between requests. Both endpoints receive the
**full wizard payload** and compute deterministically. Consequences:
- No session store needed.
- The PDF endpoint re-runs generation from the same input → same output
  (generation must be **deterministic** given identical input; see §5.5).
- Adding a DB later is **additive**: only the `data/` access layer changes;
  routes/services keep their shape.

### 3.4 Separation of concerns
- **routes/** — HTTP wiring only (path → controller).
- **controllers/** — orchestration: validate → call services → shape response.
  No business logic here.
- **services/** — pure business logic (itinerary, cost, pdf). Pure functions
  where possible (input→output, no side effects) → unit-testable in isolation.
- **validators/** — zod schemas; the single gate for untrusted input.
- **data/** — the sample dataset (the only thing a DB would later replace).

---

## 4. Backend — File-by-File

```
server/src/
  routes/
    destinations.route.js   # GET /api/destinations
    itinerary.route.js      # POST /generate ; POST /pdf
  controllers/
    itinerary.controller.js # validate -> services -> response / pdf stream
  services/
    itineraryGenerator.js   # CORE day-distribution algorithm (§5)
    costCalculator.js       # cost math (§6)
    pdfGenerator.js         # @react-pdf/renderer document (§7)
  validators/
    itinerarySchema.js      # zod schema for generate/pdf bodies (§8)
  data/
    destinations.json       # sample dataset (§9)
  __tests__/
    itineraryGenerator.test.js
    costCalculator.test.js
    itinerary.route.test.js
  app.js                    # express app (cors, json, mount routes), EXPORTS app
  server.js                 # imports app, reads PORT, listen()
```

### 4.1 `app.js` vs `server.js`
`app.js` configures middleware, mounts routes under `/api`, and **exports the
app without calling `listen`** — so `supertest` can import it. `server.js`
imports the app and starts listening. This split is what makes the API
testable.

### 4.2 API contract

**`GET /api/destinations`**
Returns the dataset for the Step-1 selector.
```json
[{ "id":1, "name":"Bali, Indonesia", "pricePerNight":4500,
   "coverImage":"<url>", "activities":[{ "name":"...", "interest":"adventure", "duration":"half-day" }] }]
```

**`POST /api/itinerary/generate`**
Request body (the full wizard payload):
```json
{
  "destinationId": 1,
  "tripType": "Group",             // Group | Custom
  "travelStyle": "Couple",         // Solo | Friends | Couple | Family
  "travelers": 4,
  "rooms": 2,
  "adultsPerRoom": 2,
  "interests": ["adventure","culture"],
  "durationBucket": "5-7",         // 3-5 | 5-7 | 7-9 | 10+
  "days": 5,                       // exact number within the bucket
  "departureDate": "2026-10-12",   // ISO date, or null
  "flexible": false,
  "contact": { "name": "...", "phone": "..." }
}
```
Response:
```json
{
  "destination": { "id":1, "name":"Bali, Indonesia", "coverImage":"..." },
  "itineraryDays": [
    { "day":1, "title":"Arrival & ascent",
      "activities":[{ "name":"...", "interest":"adventure" }] }
  ],
  "cost": { "accommodation":36000, "activities":5600, "total":41600, "currency":"INR" },
  "meta": { "nights":4, "travelers":4, "rooms":2 }
}
```

**`POST /api/itinerary/pdf`**
Same body as `/generate`. Streams `application/pdf` (Content-Disposition:
attachment). Server regenerates deterministically, then builds the PDF.

---

## 5. Itinerary Generation Algorithm (the 50% core)

> This is the single most-scrutinized piece of logic. It must be **real**, not
> hardcoded, and it must handle the worst case gracefully. Human-review this
> file — do not accept AI output blindly.

### 5.1 The problem
Distribute a destination's activities across `days`, matching selected
`interests` as closely as possible, **without lazily repeating** the same 2
activities. Worst case: few matching activities (e.g. 5) vs a long trip (10+
days).

### 5.2 Inputs
`destination.activities[]` (each `{name, interest, duration}`),
`interests[]` (selected), `days` (exact int), `tripType` (affects pacing).

### 5.3 Slotting model
Days are not single-activity blobs. Each day has a **capacity**:
- `full-day` activity → fills a day alone.
- `half-day` activities → up to 2 per day.
This multiplies effective variety via *combinations* without inventing data,
and reads like a real itinerary (morning + afternoon).

### 5.4 Tiered fill (in order, never skip a tier silently)
```
Tier 1  Unused MATCHED-interest activities, interleaved by interest
        (so [adventure,culture] alternates, not all-adventure-first).
Tier 2  Unused NON-matched activities from the SAME destination
        (still real, still relevant, just not a picked interest).
Tier 3  A designed "Leisure Day" — "Free time to explore at your own pace."
        Real itineraries use these for pacing on long trips; NOT a cop-out.
Tier 4  (last resort, must be logged/flagged) Repeat an activity, explicitly
        relabeled (e.g. "Revisit: ... at sunset"). Should rarely fire.
```
`tripType`: **Group** → busier pacing (fill capacity, fewer leisure days);
**Custom** → more breathing room (leisure days inserted sooner). This makes the
Step-1 `tripType` field actually affect output (don't collect a field you ignore).

### 5.5 Determinism
Given identical input, output must be identical (the PDF endpoint re-runs
generation). No `Math.random()` for ordering — if variety needs shuffling, it
must be seedable/stable.

### 5.6 Day titles
Each day gets an evocative title derived from its activities' interests
(e.g. mostly-adventure → "Adventure & ascent"; leisure → "A day unhurried").
Keep a small mapping; don't hardcode per-destination.

### 5.7 Tests (see §11)
- interests are respected (matched activities appear first)
- no unnecessary repetition before Tier 3 fires
- leisure day appears for long-trip/thin-data case, before any exact repeat
- deterministic output for identical input

---

## 6. Cost Calculation

```
nights          = days - 1
accommodation   = pricePerNight × rooms × nights      // PER ROOM, not per traveler
activityCost    = ACTIVITY_FLAT_RATE × (count of scheduled real activities)
total           = accommodation + activityCost
```
- `ACTIVITY_FLAT_RATE` is a **named constant** (e.g. ₹800), not a magic number.
- Leisure days contribute **no** activity cost.
- Currency is **INR (₹)** — sample prices are clearly INR.
- Charging per-room (not per-traveler) is the correct hotel model and an easy
  place for AI to get it wrong → good candidate for the AI-bug log.

---

## 7. PDF Design (the 35% — high weightage)

Built server-side with `@react-pdf/renderer`. **Light theme.** Three sections:

### 7.1 Cover
- **Full-bleed destination photo** as the banner (real image, not illustration).
- Dark gradient overlay top+bottom for text legibility.
- "DEYOR" wordmark, destination in large serif, an italic tagline
  (generated per destination), a hairline, then 3 quick facts
  (departure / travelers+rooms / est. total).
- "Prepared for {name} · {phone}" — uses the Step-5 contact data.

### 7.2 Day-by-day
- Vertical timeline: numbered day circles + each day's evocative title.
- Each activity line with a **color-coded interest tag** consistent with the
  wizard (adventure=coral, culture=plum, leisure=teal, attractions=amber).
- Leisure days render as elegant italic "free day" lines.
- Must paginate cleanly for a 10-day itinerary (test this length).

### 7.3 Cost summary ("The investment")
- Line items showing the **transparent formula**
  (e.g. "₹4,500 × 4 nights × 2 rooms").
- A dark accent band with the total in amber (the one "dark luxury" moment).
- Disclaimer: estimates only; excludes flights/visa/personal expenses.
- Footer: brand line + page number.

### 7.4 Implementation notes
- Register an elegant serif via `Font.register()` (e.g. Playfair/Cormorant) —
  the serif carries the "premium" feel; don't skip it.
- Cover images: destination `coverImage` URL (remote) with a bundled local
  fallback so a failed fetch never crashes PDF generation.
- Palette: coral `#E8623D`, teal `#0F766E`, amber `#F2A93B`, sand `#F6F1E7`,
  slate text `#2B3A42`, dark band `#1A2530`.

---

## 8. Validation (zod)

All in `validators/itinerarySchema.js`. Runs in the controller **before** any
service call. Rules:
- `destinationId`: required, must exist in dataset.
- `tripType`: enum(Group, Custom). `travelStyle`: enum(Solo, Friends, Couple, Family).
- `travelers`, `rooms`, `adultsPerRoom`: int ≥ 1.
- `interests`: non-empty array, subset of {adventure, leisure, culture, attractions}.
  Do NOT require every selected interest to exist for the destination (fallback tiers handle gaps).
- `durationBucket`: enum. `days`: int within the bucket's range.
- `departureDate`: required **unless** `flexible === true`; if present must be
  today or later (validate server-side, not just client).
- `flexible` + `departureDate` must not contradict (if flexible, date ignored/cleared).
- `contact.name`: non-empty. `contact.phone`: basic pattern (e.g. 10 digits).
- Soft rule (warn, don't block): `rooms × adultsPerRoom < travelers`.

Return structured, field-level errors so the client can surface them.

---

## 9. Sample Dataset

`server/src/data/destinations.json`. Base = the three given destinations
(Bali/Coorg/Goa) with their given `pricePerNight` and tagged activities.
**Extend** (allowed by brief) each to ~10 activities so Tier-1 covers most
realistic trips; add a `duration` ("half-day"/"full-day") field to each
activity and a `coverImage` to each destination. Keep the original fields/shape
recognizable — "their dataset, extended," not a different dataset.

---

## 10. Frontend — File-by-File & State

```
client/src/
  api/
    client.js            # axios instance, baseURL from VITE_API_BASE_URL
    itinerary.js         # fetchDestinations, generateItinerary, downloadPdf
  components/
    wizard/
      WizardShell.jsx    # owns step flow, renders active step in a modal
      StepTripBasics.jsx StepTravelers.jsx StepInterests.jsx
      StepDuration.jsx   StepReview.jsx
    journey/
      Globe.jsx          # D3 orthographic globe (destination select)
      FlightPath.jsx     # SVG flight path; plane animates between milestones
      MiniTracker.jsx    # shrunk progress indicator
    itinerary/
      ItineraryResult.jsx
    common/              # REUSABLE building blocks (§10.3)
      LoadingPlane.jsx
      FieldCard.jsx
      SelectableTile.jsx
      SectionModal.jsx
      InterestTag.jsx
  hooks/
    useWizardState.js    # useReducer store (§10.2)
  config/
    theme.js             # antd ConfigProvider tokens
  pages/
    Home.jsx             # globe -> flight journey -> result orchestration
  utils/
    constants.js         # enums, interest colors, step definitions
  App.jsx  main.jsx
```

### 10.1 The journey flow (UX)
1. **Globe screen**: D3 globe; user selects a destination (globe rotates to it,
   route arc draws).
2. **Start journey**: globe morphs (framer-motion `layoutId`) into a small
   `MiniTracker`; the `FlightPath` appears.
3. Plane flies along an SVG path to milestone N (position via
   `getPointAtLength`, rotation via path tangent). On `transitionend` (NOT a
   guessed setTimeout), the step modal opens.
4. User fills the step → "Continue journey" → plane flies to milestone N+1.
5. Milestone 5 → "Generate itinerary" → `LoadingPlane` while the request is in
   flight → `ItineraryResult`.

### 10.2 State management — `useReducer`
Single source of truth for all wizard data + flow. Shape:
```js
const initialState = {
  currentStep: 0,          // 0..4
  status: 'idle',          // idle | generating | done | error
  form: {
    destinationId: null, tripType: null, travelStyle: null,
    travelers: 1, rooms: 1, adultsPerRoom: 1,
    interests: [],
    durationBucket: null, days: null, departureDate: null, flexible: false,
    contact: { name: '', phone: '' },
  },
  errors: {},              // field-level validation errors
  result: null,            // generated itinerary response
};
```
Actions (documented, exhaustive):
```
SET_FIELD {field, value}         // update one form field
SET_CONTACT {field, value}       // update contact.name / contact.phone
TOGGLE_INTEREST {value}          // add/remove from interests[]
NEXT_STEP / PREV_STEP / GO_TO_STEP {index}
SET_ERRORS {errors}              // from validation
START_GENERATING                 // status -> generating
SET_RESULT {result}              // status -> done
SET_ERROR                        // status -> error
RESET
```
Reducer is a **pure function** → unit-testable without React. Expose via
`useWizardState()` returning `{ state, dispatch, helpers }`. Per-step
validation gates NEXT_STEP (can't advance with invalid/empty required fields).

### 10.3 Reusable components (build once, use everywhere)
- **`SelectableTile`** — large tappable card with icon + label + selected
  state. Used for trip type, travel style, and interests (the highest-impact
  "not generic" customization). Props: `icon, label, selected, color, onClick`.
- **`InterestTag`** — small color-coded pill; used in the result view AND
  passed to the PDF color map. One place defines interest→color.
- **`FieldCard`** — labeled input wrapper for consistent spacing/typography.
- **`SectionModal`** — the modal frame the flight path opens at each stop; wraps
  antd `Modal` with our theme; renders whichever `StepX` is active.
- **`LoadingPlane`** — the plane loading state during generation.
Keep interest→color mapping and step definitions in `utils/constants.js` so the
wizard, result view, and PDF all read the same source.

### 10.4 Responsive design (required — it's deployed & clicked)
- **Globe/FlightPath**: SVG `viewBox` scales; on narrow (<640px) the flight
  path may reflow — below a breakpoint, replace the 5-label milestone track with
  a single progress bar + current-stop label (don't cram 5 labels on mobile).
- **Modal**: antd `Modal` width responsive (`width="90%"`, `maxWidth` cap).
- **Steps/tiles**: tiles wrap to 1–2 columns on mobile via CSS grid
  `auto-fit, minmax`.
- **Test the PDF download on mobile Safari** — blob downloads can open in-tab
  instead of downloading; handle the flow.
- **`prefers-reduced-motion`**: freeze plane/globe motion, jump plane straight
  to milestone, open modal immediately. (Senior-level detail; ~2 min.)

### 10.5 antd theming
Theme in `config/theme.js`, applied via `ConfigProvider` in `main.jsx`. Tokens:
`colorPrimary:#E8623D`, `colorInfo:#0F766E`, `colorWarning:#F2A93B`,
`borderRadius:12`, `controlHeight:44`, custom `fontFamily`. Bumped radius +
control height move antd away from its default "admin panel" look. Use
`Radio.Group optionType="button"`, `Segmented`, and custom `SelectableTile`s
instead of default form widgets to avoid the generic look the brief warns about.

---

## 11. Testing

3–5 meaningful tests (quality over coverage). Vitest + supertest.
- **`itineraryGenerator.test.js`**
  - respects selected interests (matched activities scheduled first)
  - no unnecessary repetition before a leisure day is inserted
    (thin data + long trip case)
  - deterministic output for identical input
- **`costCalculator.test.js`**
  - correct per-room math (rooms × nights × pricePerNight + activities)
  - leisure days add no activity cost
- **`itinerary.route.test.js`** (supertest)
  - invalid input (e.g. empty interests, past date without flexible) → 400
    with field errors
  - valid input → 200 with itineraryDays + cost

---

## 12. Deployment
- **Client** → Vercel/Netlify (static Vite build).
- **Server** → Render/Railway (plain Express doesn't run as a Vercel long-lived
  server; Render is least-friction). Set client's `VITE_API_BASE_URL` to the
  deployed server URL. Configure CORS to allow the client origin.
- Bundle PDF cover images / register fonts as part of the server build so PDF
  generation doesn't depend on runtime CDN fetches.

---

## 13. README requirements (don't lose marks on the writeup)
The final README must include:
- Setup/run instructions (client + server).
- **AI tool notes**: which tools, roughly how much they generated, and **at
  least one specific bug the AI produced + how you found and fixed it** (keep
  the running log in `AI_NOTES.md`).
- Assumptions made (e.g. activity flat-rate, leisure-day fallback policy,
  per-room costing).
- **Production considerations** — 3 things you'd change before production
  (e.g. persistent DB + data layer, auth, rate limiting, error tracking/
  observability, CI/CD). Describe, don't build.
- Live deployment link + GitHub link.

---

## 14. Definition of Done
- [ ] 5-step wizard works end-to-end, with validation gating each step.
- [ ] Itinerary generation is real, tiered, deterministic, interest-aware,
      handles the 10+ day thin-data worst case without lazy repeats.
- [ ] Cost is correct (per-room) with named constants.
- [ ] PDF is dynamically built server-side (not print-to-PDF), light theme,
      cover + day-by-day + cost, looks handable to a customer.
- [ ] 3–5 meaningful tests pass.
- [ ] Responsive; reduced-motion respected.
- [ ] README + AI_NOTES complete; deployed link live.
- [ ] No TypeScript, no out-of-scope features.

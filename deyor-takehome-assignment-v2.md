# Deyor — Full-Stack Developer Take-Home Assignment

## Context
Deyor is a community-led experiential travel company. This assignment simulates a real feature we care about: a guided trip-builder flow that ends in a polished, personalized itinerary the traveler can walk away with.

## The Task: "Build My Trip" — Guided Itinerary Builder + Dynamic PDF

Build a small full-stack web app with a **multi-step wizard** that collects trip preferences, generates a day-wise itinerary, and lets the user **download it as a designed PDF**.

### The Flow (5 steps)

1. **Trip Basics** — Destination (pick from the sample list below), Trip Type (Group / Custom), Travel Style (Solo / Friends / Couple / Family)
2. **Travelers & Rooms** — Number of travelers, rooms needed, adults per room
3. **Interests** — Multi-select: Adventure, Leisure, Culture, Attractions (used to pick which activities go into the itinerary)
4. **Duration & Dates** — Trip length (3-5 / 5-7 / 7-9 / 10+ days), departure date (or "flexible" checkbox)
5. **Review & Generate** — Summary of all selections + a simple contact form (name, phone). On submit, generate the itinerary.

Design your own visual language for this — don't just recreate a generic form. We want to see real UI/UX thinking: clear progress indication, sensible defaults, good use of whitespace and hierarchy, and a flow that feels considered rather than thrown together.

### After Submit: Itinerary Generation
- Backend logic distributes the destination's activities across the selected number of days, matching the traveler's chosen interests as closely as possible (don't just repeat the same 2 activities — show real logic here)
- Compute an estimated total cost: (price per night × nights) + a flat estimate for selected activities
- Show the generated day-by-day itinerary on screen
- **Add a "Download PDF" button** that generates a real, dynamically-built PDF (not a screenshot/print-to-PDF of the webpage) — cover section with trip details, a day-by-day breakdown, and the cost summary. This should look like something a travel company would actually hand a customer.

### Sample Data
Use/expand this dataset — each destination has tagged activities so your itinerary logic has something real to work with:

```json
[
  {
    "id": 1,
    "name": "Bali, Indonesia",
    "pricePerNight": 4500,
    "activities": [
      { "name": "Sunrise trek at Mount Batur", "interest": "adventure" },
      { "name": "White-water rafting, Ayung River", "interest": "adventure" },
      { "name": "Ubud rice terrace walk", "interest": "leisure" },
      { "name": "Beach club day, Seminyak", "interest": "leisure" },
      { "name": "Tanah Lot Temple visit", "interest": "culture" },
      { "name": "Traditional Balinese cooking class", "interest": "culture" },
      { "name": "Uluwatu cliff & Kecak dance show", "interest": "attractions" }
    ]
  },
  {
    "id": 2,
    "name": "Coorg, Karnataka",
    "pricePerNight": 3500,
    "activities": [
      { "name": "Trek to Tadiandamol Peak", "interest": "adventure" },
      { "name": "Coffee plantation walk", "interest": "leisure" },
      { "name": "Abbey Falls visit", "interest": "attractions" },
      { "name": "Namdroling Monastery visit", "interest": "culture" },
      { "name": "River rafting at Barapole", "interest": "adventure" }
    ]
  },
  {
    "id": 3,
    "name": "Goa",
    "pricePerNight": 5000,
    "activities": [
      { "name": "Scuba diving at Grande Island", "interest": "adventure" },
      { "name": "Sunset cruise on the Mandovi", "interest": "leisure" },
      { "name": "Old Goa churches walk", "interest": "culture" },
      { "name": "Fort Aguada visit", "interest": "attractions" },
      { "name": "Beach hopping — Anjuna to Vagator", "interest": "leisure" }
    ]
  }
]
```

### Requirements
- **Backend**: REST API handling the wizard state, itinerary-generation logic, and PDF generation
- **Frontend**: The 5-step wizard described above, working end to end
- **PDF generation must be dynamic** — built server-side (or client-side) from the actual data, not a static template
- **Validation**: sensible guards (can't proceed without selecting required fields, dates make sense, etc.)
- **Tests**: include 3-5 meaningful automated tests covering the itinerary-generation logic and at least one API/validation flow (e.g., interests are respected, activities aren't unnecessarily repeated, cost calculation is correct, invalid input is rejected). We're not looking for coverage percentages — a handful of tests that show real thinking is worth more than a large, shallow suite.

No database or auth is required — in-memory or sample data is fine. What we care about is whether your code is structured so that adding persistence later would be straightforward, not whether you actually built it.

**Expected effort: 6-8 hours. We value judgment over completeness — do not spend time building features beyond what's asked here.** Knowing what *not* to build is part of what we're evaluating.

We will review the final code as if it were a production codebase. You are responsible for everything the AI generates — if it's in your submission, it's yours.

### A note on AI tools
Use whatever you'd normally use — Claude, Cursor, Windsurf, Copilot, whatever. We use them too. Include a short README section on:
- Which AI tool(s) you used and roughly how much of the code they generated
- **At least one specific bug or issue the AI-generated code had, and how you found and fixed it**

We're less interested in perfect prompting and more interested in what happens when the AI gets something wrong.

### Deliverables
- A GitHub repo (public or shared with us) with the code
- **A live, working deployment link** (Vercel is fine, or any host of your choice) — we want to click and actually use it, not just read code
- A README with setup/run instructions, your AI-tool notes above, any assumptions you made, and a short **"Production considerations"** section: briefly describe 3 things you'd change before deploying this to production (e.g. auth, persistent DB, rate limiting, error tracking, observability, CI/CD, security). You don't need to build these — we want to see that you know they exist.
- Total time expected: **6-8 hours of focused work**, over up to 6 days

### What we're evaluating
- **Engineering quality & AI-assisted development (50%)** — is the itinerary logic real (not hardcoded), is the code clean and extensible, does it run end-to-end, and how you describe/handle the AI-tool debugging moment
- **Frontend/UX + PDF design (35%)** — the wizard flow's visual quality, and whether the generated PDF actually looks like something worth handing a customer
- **Backend logic & scope judgment (15%)** — sound architecture, sensible validation, and knowing what not to build in the time given

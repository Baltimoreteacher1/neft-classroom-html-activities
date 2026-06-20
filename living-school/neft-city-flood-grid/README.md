# Neft City: Flood Grid 🌊

**Living School · Chapter 4** — a polished, student-facing math *simulation game* for 6th grade.

Students don't fill out a worksheet — they **enter a living city**, take on a role, and help Neft City
survive a **flood emergency**. Sensors report **elevations** relative to sea level (integers, with
negative = below sea level) and sit at **(x, y) locations** on a city coordinate grid. Students
**order the elevations**, **compare** positive and negative numbers, **plot** the sensors on the
coordinate plane, **reflect** a point across an axis, **measure distance** with absolute value, make a
**city decision** about where to place a new pump, **revise** their thinking, and export a
**proof-of-learning passport**.

All "AI-style" coaching is generated **locally** from the student's own choices and answer patterns.
There is **no backend, no login, no database, and no external/AI API**.

**Standards:** 6.NS (integers & ordering) · 6.NS (coordinate plane, reflections across an axis, and
distance using absolute value).

---

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | All eight screens + vocabulary & teacher modals + print template |
| `styles.css` | Neft City design system (navy / teal / gold / cream), CSS-3D city, coordinate-grid styles, responsive layout |
| `app.js` | State, validation, scoring, rendering, export/print, teacher diagnostics |
| `README.md` | This file |

> `styles.css` is Chapter 1's design system copied **verbatim**, with the Flood-Grid coordinate-plane
> and sensor styles appended at the end so the look stays identical across chapters.

### The 8 stages (locked progression)
`Enter City → Briefing → Sensor Lab → Grid → Decision → City Reaction → News Report → Passport`

Students **cannot skip ahead** — each step unlocks only when the required work is complete. Progress,
answers, and writing are saved to **localStorage** (key `neftcity_floodgrid_v1`) so a student can
close the tab and resume.

### Game / 3D feel
- CSS-3D animated city skyline on the welcome screen
- Game-style stage transitions, XP "toasts", and a HUD progress map
- A clickable, **keyboard-operable coordinate plane** (x −5..5, y −5..5) with axes through the origin
- A tilting 3D Proof-of-Learning passport card

### The coordinate plane
- Built as an 11×11 CSS-grid of `<button>` cells. The **x-axis** and **y-axis** are highlighted, and
  the **origin (0, 0)** is marked.
- Each cell carries an `aria-label` like **"x 3, y 2"** and is reachable by keyboard (Tab + Enter/Space).
- Workflow: pick a sensor in the queue, click its grid cell to drop a pin; click a placed pin to remove it.
  Selection auto-advances to the next unplaced sensor for smooth flow.

### Bilingual (English / Español) support
- **🌐 toggle** in the header switches directions, labels, buttons, goals, and writing supports
  (sentence starters & frames) between English and Spanish.
- The **Vocabulary helper is always bilingual** (English + Español side by side).
- Choice persists in `localStorage`. Interpretation answer choices and detailed coaching feedback stay
  in English on purpose (answer-matching + scope); the data layer makes adding more translations easy.

### Enrichment mini-mission ("Mirror City")
- An optional **"🔬 Enrichment Challenge: Mirror City"** appears on the City Reaction screen.
  Students reflect **S4 (5, −2)** across the **y-axis** → **(−5, −2)**, then find the **distance**
  between S4 and its mirror: **|5| + |−5| = 10 units**.
- Fully optional — it never gates progression — and is the exact extension the Teacher View suggests
  for students who are ready for more.

---

## The math (answer key)

- **Sensor elevations (meters):** `−5, 3, −2, 0, 7, −8, 4, −1`
- **Ordered least → greatest:** `−8, −5, −2, −1, 0, 3, 4, 7`
- **Lower of −8 / −2:** `−8` · **Lowest elevation:** `−8` · **Highest elevation:** `7`
- **Plot these sensors:** S1 **(3, 2)** · S2 **(−4, 1)** · S3 **(−2, −3)** · S4 **(5, −2)**
- **Reflect S1 (3, 2):** across the **x-axis** → **(3, −2)**; across the **y-axis** → **(−3, 2)**
- **Distance** from (3, 2) to (3, −5): `|2 − (−5)| = |7| = 7 units`
- **Best recommendation:** **A — Place the pump near the lowest sensor (elevation −8),** because water
  collects at the lowest point.

Integer inputs tolerate a plain hyphen `-` or a true minus `−`, and ignore stray characters.

---

## How to run locally

It's a static app — open `index.html` directly, or serve the repo root:

```bash
# from the repository root
python3 -m http.server 8000
# then visit:
# http://localhost:8000/living-school/neft-city-flood-grid/
```

(The repo also supports `npm run dev` via Vite, but no build step is required for this activity.)

---

## Deployment notes

Deploys as-is on **Cloudflare Pages** with the repo's existing settings
(framework preset **None**, build command blank/`exit 0`, output directory `/`).
The folder is self-contained; it only references the repo-shared `/assets/shared.css`
and `/assets/favicon.svg`, plus its own local `styles.css` / `app.js`.

Live path: `/living-school/neft-city-flood-grid/`

---

## Teacher usage notes

- **Teacher View:** click **🧑‍🏫 Teacher** in the header or press **Shift + T**. It summarizes the
  *current student on this device*: score by skill, attempts per comparison, sensors placed, detected
  misconceptions, writing word counts, recommendation quality, and a **suggested next move**.
- **No data leaves the device.** For records, use **Print / Save PDF** or **Download JSON** on the Passport screen.
- **Resetting:** the **Reset Mission** button clears localStorage for a fresh start (good for shared devices / next class).
- **ESOL supports:** simple directions, vocabulary pop-ups, sentence starters, word bank, sentence frames,
  color-plus-text feedback, large fonts, keyboard-operable controls (including the grid), and ARIA labels.
- **Pacing:** the Sensor Lab and Grid are the math core; Decision/News/Passport are the literacy + reasoning core.
  The activity works well as one ~40–60 min session or split across two days at the Grid step.

---

## Future expansion ideas

- More "Living School" chapters (rational numbers, ratios, expressions) reusing this engine.
- A distance challenge that mixes points sharing an x or a y on the same line.
- Optional class code + teacher dashboard aggregation (still local-first / privacy-safe).
- Branching story consequences that carry the city's meters into the next chapter.
- Audio read-aloud for directions to deepen ESOL accessibility.

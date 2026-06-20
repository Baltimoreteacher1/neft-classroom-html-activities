# Neft City: Water Watch 💧

**Living School · Chapter 2** — a polished, student-facing math *simulation game* for 6th grade.

Students don't fill out a worksheet — they **enter a living city** during a **water shortage**, take on a
role, and help Neft City recommend a **fair conservation policy**. Along the way they sort data, compute
**mean / median / mode / range**, build a **histogram**, discover an **outlier** (a mansion that uses far
more water than everyone else), reason about why the **median** beats the **mean** for *skewed* data, make a
**city decision**, **revise** their thinking, and export a **proof-of-learning passport**.

The teaching crisis at the heart of the chapter: a single outlier (**120 gallons**) pulls the **mean up to
43**, while the **median stays at 38**. The median better represents the **typical** household — so a fair
target works with the few extreme users instead of penalizing everyone.

All "AI-style" coaching is generated **locally** from the student's own choices and answer patterns.
There is **no backend, no login, no database, and no external/AI API**.

---

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | All eight screens + vocabulary & teacher modals + print template |
| `styles.css` | Neft City design system (navy / teal / gold / cream) — Chapter 1's stylesheet verbatim, plus chapter-specific overrides appended at the end (5-interval histogram, outlier highlight, mean-vs-median spotlight) |
| `app.js` | State, validation, scoring, rendering, export/print, teacher diagnostics |
| `README.md` | This file |

### The 8 stages (locked progression)
`Enter City → Briefing → Data Lab → Graph → Decision → City Reaction → News Report → Passport`

Students **cannot skip ahead** — each step unlocks only when the required work is complete. Progress,
answers, and writing are saved to **localStorage** (key `neftcity_waterwatch_v1`) so a student can close the
tab and resume.

### Game / 3D feel
- CSS-3D animated city skyline on the welcome screen
- Game-style stage transitions, XP "toasts", and a HUD progress map
- 3D-styled histogram bars students raise/lower with `+ / −`, click, or arrow keys (max height **15**); the
  outlier interval is highlighted in gold so the lone mansion is visible
- A **mean vs. median spotlight card** on the City Reaction screen that shows the two measures side by side
- A tilting 3D Proof-of-Learning passport card

### Bilingual (English / Español) support
- **🌐 toggle** in the header switches directions, labels, buttons, goals, starters, and vocabulary between
  English and Spanish.
- The **Vocabulary helper is always bilingual** (English + Español side by side).
- Choice persists in `localStorage`. Interpretation answer choices and detailed coaching feedback stay in
  English on purpose (answer-matching + scope); the data layer makes adding more translations straightforward.

---

## The math (answer key)

- **Dataset (gallons, 15 households):** `30, 35, 40, 38, 42, 33, 37, 41, 39, 36, 44, 32, 40, 38, 120`
- **Sorted:** `30, 32, 33, 35, 36, 37, 38, 38, 39, 40, 40, 41, 42, 44, 120`
- **Mean:** 43 (645 ÷ 15) · **Median:** 38 (8th of 15) · **Mode:** 38 and 40 · **Range:** 90 (120 − 30)
- **Histogram:** 30–49 → **14**, 50–69 → **0**, 70–89 → **0**, 90–109 → **0**, 110–129 → **1** (total 15)
- **The outlier:** the mansion at **120 gallons** pulls the **mean** up to 43; the **median** stays at 38.
- **Best recommendation:** **A — Base the conservation target on the TYPICAL use (median ≈ 38 gallons) and
  work with the few extreme users.**

Mode accepts `38,40`, `38, 40`, `38 and 40` (any order).

---

## How to run locally

It's a static app — open `index.html` directly, or serve the repo root:

```bash
# from the repository root
python3 -m http.server 8000
# then visit:
# http://localhost:8000/living-school/neft-city-water-watch/
```

(The repo also supports `npm run dev` via Vite, but no build step is required for this activity.)

---

## Deployment notes

Deploys as-is on **Cloudflare Pages** with the repo's existing settings
(framework preset **None**, build command blank/`exit 0`, output directory `/`).
The folder is self-contained; it only references the repo-shared `/assets/shared.css`
and `/assets/favicon.svg`, plus its own local `styles.css` / `app.js`.

Live path: `/living-school/neft-city-water-watch/`

---

## Teacher usage notes

- **Teacher View:** click **🧑‍🏫 Teacher** in the header or press **Shift + T**. It summarizes the
  *current student on this device*: score by skill, attempts per calculation, detected misconceptions
  (including choosing the mean-based target B), writing word counts, recommendation quality, and a
  **suggested next move**.
- **No data leaves the device.** For records, use **Print / Save PDF** or **Download JSON** on the Passport screen.
- **Resetting:** the **Reset Mission** button clears localStorage for a fresh start (good for shared devices / next class).
- **ESOL supports:** simple directions, bilingual vocabulary pop-ups, sentence starters, word bank, sentence
  frames, color-plus-text feedback, large fonts, keyboard-operable controls, and ARIA labels.
- **Pacing:** the Data Lab and Graph are the math core; the interpretation questions and Decision/News/Passport
  are the reasoning + literacy core. Works as one ~40–60 min session or split across two days at the Graph step.

---

## Future expansion ideas

- More "Living School" chapters reusing this engine (energy use, recycling rates, park usage).
- Enrichment: add a SECOND mansion (130 gallons) and ask what happens to the median vs. the mean.
- Optional class code + teacher dashboard aggregation (still local-first / privacy-safe).
- Branching story consequences that carry the city's meters into the next chapter.
- Audio read-aloud for directions to deepen ESOL accessibility.

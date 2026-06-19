# Neft City: Data Crisis 🏙️

**Living School · Chapter 1** — a polished, student-facing math *simulation game* for 6th grade.

Students don't fill out a worksheet — they **enter a living city**, take on a role, and help Neft City
solve a real **data crisis**: long wait times at the new arena's concession stands. Along the way they
sort data, compute **mean / median / mode / range**, build a **histogram**, make a **city decision**,
**revise** their thinking, and export a **proof-of-learning passport**.

All "AI-style" coaching is generated **locally** from the student's own choices and answer patterns.
There is **no backend, no login, no database, and no external/AI API**.

---

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | All eight screens + vocabulary & teacher modals + print template |
| `styles.css` | Neft City design system (navy / teal / gold / cream), CSS-3D city, responsive layout |
| `app.js` | State, validation, scoring, rendering, export/print, teacher diagnostics |
| `README.md` | This file |

### The 8 stages (locked progression)
`Enter City → Briefing → Data Lab → Graph → Decision → City Reaction → News Report → Passport`

Students **cannot skip ahead** — each step unlocks only when the required work is complete. Progress,
answers, and writing are saved to **localStorage** so a student can close the tab and resume.

### Game / 3D feel
- CSS-3D animated city skyline on the welcome screen
- Game-style stage transitions, XP "toasts", and a HUD progress map
- 3D-styled histogram blocks students raise/lower with `+ / −`, click, or arrow keys
- A tilting 3D Proof-of-Learning passport card

---

## The math (answer key)

- **Dataset:** `8, 12, 7, 15, 10, 9, 11, 13, 12, 14, 9, 16, 10, 12, 8, 11, 17, 13, 10, 9`
- **Sorted:** `7, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 12, 12, 12, 13, 13, 14, 15, 16, 17`
- **Mean:** 11.3 · **Median:** 11 · **Mode:** 9, 10, and 12 · **Range:** 10
- **Histogram:** 7–9 → **6**, 10–12 → **8**, 13–15 → **4**, 16–18 → **2**
- **Best recommendation:** **A — Add one more concession stand.**

Mode accepts `9,10,12`, `9, 10, 12`, `9 10 12`, `9 and 10 and 12`, `9, 10, and 12` (any order).

---

## How to run locally

It's a static app — open `index.html` directly, or serve the repo root:

```bash
# from the repository root
python3 -m http.server 8000
# then visit:
# http://localhost:8000/living-school/neft-city-data-crisis/
```

(The repo also supports `npm run dev` via Vite, but no build step is required for this activity.)

---

## Deployment notes

Deploys as-is on **Cloudflare Pages** with the repo's existing settings
(framework preset **None**, build command blank/`exit 0`, output directory `/`).
The folder is self-contained; it only references the repo-shared `/assets/shared.css`
and `/assets/favicon.svg`, plus its own local `styles.css` / `app.js`.

Live path: `/living-school/neft-city-data-crisis/`

---

## Teacher usage notes

- **Teacher View:** click **🧑‍🏫 Teacher** in the header or press **Shift + T**. It summarizes the
  *current student on this device*: score by skill, attempts per calculation, detected misconceptions,
  writing word counts, recommendation quality, and a **suggested next move**.
- **No data leaves the device.** For records, use **Print / Save PDF** or **Download JSON** on the Passport screen.
- **Resetting:** the **Reset Mission** button clears localStorage for a fresh start (good for shared devices / next class).
- **ESOL supports:** simple directions, vocabulary pop-ups, sentence starters, word bank, sentence frames,
  color-plus-text feedback, large fonts, keyboard-operable controls, and ARIA labels.
- **Pacing:** the Data Lab and Graph are the math core; Decision/News/Passport are the literacy + reasoning core.
  The activity works well as one ~40–60 min session or split across two days at the Graph step.

---

## Future expansion ideas

- More "Living School" chapters (transit data, recycling rates, park usage) reusing this engine.
- Outlier mini-mission: add a 30-minute wait and compare effect on mean vs. median.
- Optional class code + teacher dashboard aggregation (still local-first / privacy-safe).
- Spanish / multilingual toggle for vocabulary and directions.
- Branching story consequences that carry the city's meters into the next chapter.
- Audio read-aloud for directions to deepen ESOL accessibility.

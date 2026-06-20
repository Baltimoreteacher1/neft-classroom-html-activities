# Neft City: Tale of Two Neighborhoods 📦

**Living School · Chapter 5** — a polished, student-facing math *simulation game* for 6th grade
covering **6.SP measures of variability**: range, quartiles, and the **interquartile range (IQR)**,
with a **box-and-whisker** visual and a brief **Mean Absolute Deviation (MAD)** concept.

Students don't fill out a worksheet — they **enter a living city**, take on a role, and help Neft City
settle a dispute between two neighborhoods. Both **Northside** and **Riverbend** complain about their
commute times. The team compares the **spread** (consistency) of each neighborhood's data and recommends
**who needs help with reliability** — then defends the call with **evidence**, revises if needed, and exports
a **proof-of-learning passport**.

All "AI-style" coaching is generated **locally** from the student's own choices and answer patterns.
There is **no backend, no login, no database, and no external/AI API**.

---

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | All eight screens + vocabulary & teacher modals + print template |
| `styles.css` | Chapter 1's Neft City design system (verbatim) + Chapter 5 box-plot styles appended |
| `app.js` | State, validation, scoring, rendering, box plots, export/print, teacher diagnostics |
| `README.md` | This file |

### The 8 stages (locked progression)
`Enter City → Briefing → Data Lab → Box Plots → Decision → City Reaction → News Report → Passport`

Students **cannot skip ahead** — each step unlocks only when the required work is complete. Progress,
answers, and writing are saved to **localStorage** (key `neftcity_twoneighborhoods_v1`) so a student can
close the tab and resume.

### Game / 3D feel
- CSS-3D animated city skyline on the welcome screen
- Game-style stage transitions, XP "toasts", and a HUD progress map
- **Two horizontal box-and-whisker plots** on a **shared 8–32 minute scale**, auto-built from the
  student's *correct* five-number summaries, with labeled min / Q1 / median / Q3 / max
- A tilting 3D Proof-of-Learning passport card

### Bilingual (English / Español) support
- **🌐 toggle** in the header switches directions, labels, buttons, goals, vocabulary, and
  writing supports (sentence starters & frames) between English and Spanish.
- The **Vocabulary helper is always bilingual** (English + Español side by side).
- Choice persists in `localStorage`. Interpretation answer choices use full ES translations; the
  detailed coaching feedback stays in English on purpose (answer-matching + scope), exactly as in Chapter 1.

### MAD enrichment mini-mission
- An optional **"🔬 Enrichment Challenge: Mean Absolute Deviation"** appears on the City Reaction screen.
- It connects the IQR/range work to another spread measure: students predict which neighborhood has the
  bigger MAD (**Northside**, because its values stretch farthest from the mean) and justify it in one sentence.
- Fully optional — it never gates progression — and is the exact extension the Teacher View suggests.

---

## The math (answer key)

Both data sets are already **sorted**, with **n = 11** each.

**Neighborhood A — Northside (minutes):** `10, 12, 14, 15, 15, 16, 18, 20, 22, 24, 30`
- Min **10** · Q1 **14** · Median **16** · Q3 **22** · Max **30**
- **IQR = Q3 − Q1 = 22 − 14 = 8** · **Range = 30 − 10 = 20**

**Neighborhood B — Riverbend (minutes):** `14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21`
- Min **14** · Q1 **16** · Median **17** · Q3 **19** · Max **21**
- **IQR = Q3 − Q1 = 19 − 16 = 3** · **Range = 21 − 14 = 7**

**Teaching point (the "crisis"):** Riverbend (B) is **more consistent** (smaller IQR = 3 and range = 7);
Northside (A) is **more spread out / less predictable** (IQR = 8, range = 20, with a high value of 30).
**Lower IQR/range = more consistent.**

**Best recommendation:** **A — Help Northside**, because its commute times are the most spread out
(largest IQR and range), so they are least predictable.

### Quartile method used
With n = 11, the median is the **6th value**. The lower half is the **first 5 values** and the upper half is
the **last 5 values** (the median itself is excluded). Q1 and Q3 are the medians of those halves. Each input
is validated numerically; after **2 misses** a targeted hint opens, mirroring Chapter 1.

---

## How to run locally

It's a static app — open `index.html` directly, or serve the repo root:

```bash
# from the repository root
python3 -m http.server 8000
# then visit:
# http://localhost:8000/living-school/neft-city-two-neighborhoods/
```

---

## Deployment notes

Deploys as-is on **Cloudflare Pages** with the repo's existing settings
(framework preset **None**, build command blank/`exit 0`, output directory `/`).
The folder is self-contained; it only references the repo-shared `/assets/shared.css`
and `/assets/favicon.svg`, plus its own local `styles.css` / `app.js`.

Live path: `/living-school/neft-city-two-neighborhoods/`

---

## Teacher usage notes

- **Teacher View:** click **🧑‍🏫 Teacher** in the header or press **Shift + T**. It summarizes the
  *current student on this device*: score by skill, misses per neighborhood, detected misconceptions
  (e.g., adding Q3 + Q1 instead of subtracting, confusing IQR with range, mis-splitting the halves),
  writing word counts, recommendation quality, the full **answer key**, and a **suggested next move**.
- **No data leaves the device.** For records, use **Print / Save PDF** or **Download JSON** on the Passport screen.
- **Resetting:** the **Reset Mission** button clears localStorage for a fresh start (good for shared devices / next class).
- **ESOL supports:** simple directions, vocabulary pop-ups, sentence starters, word bank, sentence frames,
  color-plus-text feedback, large fonts, keyboard-operable controls, and ARIA labels.
- **Pacing:** the Data Lab and Box Plots are the math core; Decision/News/Passport are the literacy + reasoning core.
  Works well as one ~40–60 min session or split across two days at the Box Plots step.

---

## Future expansion ideas

- A third neighborhood with an even/larger data set to practice the quartile method with different `n`.
- Let students place the five markers on a blank box-plot scale and check them.
- A full MAD computation walkthrough (currently a conceptual prediction).
- Branching story consequences that carry the city's meters into the next chapter.
- Audio read-aloud for directions to deepen ESOL accessibility.

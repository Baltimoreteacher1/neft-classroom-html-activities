# Neft City: Food Truck Face-Off 🌮

**Living School · Chapter 3** — a polished, student-facing math *simulation game* for 6th grade
(**6.RP** — ratios, rates, and unit rate).

Students don't fill out a worksheet — they **enter a living city**, take on a role, and help Neft City
solve a real problem at the fair: two taco trucks want to sell, and the mayor needs the team to find the
**better value** and set a **fair price**. Along the way they find **unit rates**, complete a **ratio table**,
build a **double number line**, make a **city decision**, **revise** their thinking, and export a
**proof-of-learning passport**.

All "AI-style" coaching is generated **locally** from the student's own choices and answer patterns.
There is **no backend, no login, no database, and no external/AI API**.

---

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | All eight screens + vocabulary & teacher modals + print template |
| `styles.css` | Neft City design system (Chapter 1 base, verbatim) + chapter-3 additions (truck cards, ratio table, double number line) |
| `app.js` | State, validation, scoring, rendering, export/print, teacher diagnostics |
| `README.md` | This file |

### The 8 stages (locked progression)
`Enter City → Briefing → Price Lab → Number Line → Decision → City Reaction → News Report → Passport`

Students **cannot skip ahead** — each step unlocks only when the required work is complete. Progress,
answers, and writing are saved to **localStorage** (key `neftcity_foodtrucks_v1`) so a student can close
the tab and resume.

### Game / 3D feel
- CSS-3D animated city skyline on the welcome screen
- Game-style stage transitions, XP "toasts", and a HUD progress map
- An interactive **double number line** students set with `+ / −`, typing, or arrow keys (live update)
- A tilting 3D Proof-of-Learning passport card

### Bilingual (English / Español) support
- **🌐 toggle** in the header switches directions, labels, buttons, goals, and
  writing supports (sentence starters & frames) between English and Spanish.
- The **Vocabulary helper is always bilingual** (English + Español side by side).
- Choice persists in `localStorage`. Interpretation answer choices and detailed
  coaching feedback stay in English on purpose (answer-matching + scope).

### Scale-It-Up enrichment mini-mission
- An optional **"🔬 Enrichment Challenge: Scale It Up"** appears on the City
  Reaction screen. A school group buys **25 tacos** from each truck; students
  scale the unit rates (Taco Town **$50**, Salsa Stop **$40**) and discover the
  lower unit rate saves **$10** — and saves more the more you buy.
- Fully optional — it never gates progression — and is the exact extension the
  Teacher View suggests for students ready for more.

---

## The math (answer key)

**The deals**
- **Taco Town:** 3 tacos for $6
- **Salsa Stop:** 5 tacos for $8

**Unit rates (price per taco)**
- **Taco Town:** $6 ÷ 3 = **$2.00 / taco** — accepts `2`, `2.0`, `2.00`, `$2`
- **Salsa Stop:** $8 ÷ 5 = **$1.60 / taco** — accepts `1.6`, `1.60`, `$1.60`
- **Better value: Salsa Stop** (lower price per taco).

**Ratio table — Salsa Stop ($1.60 / taco)** — students fill the missing dollar cells
| Tacos | 1 | 5 *(given)* | 10 | 15 |
|-------|----|----|----|----|
| Dollars | $1.60 | $8.00 | $16.00 | $24.00 |

**Double number line — Salsa Stop** — top line = tacos, bottom line = dollars; students set the dollars
| Tacos | 0 *(fixed)* | 5 | 10 | 15 |
|-------|----|----|----|----|
| Dollars | $0 | $8 | $16 | $24 |

**Interpretation (gated MC + 1 written)**
- "Which truck costs less per taco?" → **Salsa Stop ($1.60)**
- "If you buy 10 tacos, how much cheaper is Salsa Stop than Taco Town?" → **$4 cheaper** ($20 vs $16)
- "Which truck is the better value?" → **Salsa Stop**
- Written: "Why is unit rate useful for comparing deals?"

**Decision Room (best = A)**
- **A — Recommend Salsa Stop because its unit rate ($1.60/taco) is lower. (BEST)**
- B — Recommend Taco Town because it sells in smaller amounts.
- C — Pick whichever truck has a longer line.
- D — Do not compare — just guess.

Requires a choice **plus an 18-word evidence explanation**. The fair-price recommendation should land
at or below **$2.00/taco**; the explanation is accepted holistically (evidence keywords: *unit rate,
per taco, 1.60, 2.00, ratio, cheaper, value, dollars*).

---

## How to run locally

It's a static app — open `index.html` directly, or serve the repo root:

```bash
# from the repository root
python3 -m http.server 8000
# then visit:
# http://localhost:8000/living-school/neft-city-food-trucks/
```

(The repo also supports `npm run dev` via Vite, but no build step is required for this activity.)

---

## Deployment notes

Deploys as-is on **Cloudflare Pages** with the repo's existing settings
(framework preset **None**, build command blank/`exit 0`, output directory `/`).
The folder is self-contained; it only references the repo-shared `/assets/shared.css`
and `/assets/favicon.svg`, plus its own local `styles.css` / `app.js`.

Live path: `/living-school/neft-city-food-trucks/`

---

## Teacher usage notes

- **Teacher View:** click **🧑‍🏫 Teacher** in the header or press **Shift + T**. It summarizes the
  *current student on this device*: score by skill, attempts per unit rate, detected misconceptions,
  writing word counts, recommendation quality, and a **suggested next move**.
- **No data leaves the device.** For records, use **Print / Save PDF** or **Download JSON** on the Passport screen.
- **Resetting:** the **Reset Mission** button clears localStorage for a fresh start (good for shared devices / next class).
- **ESOL supports:** simple directions, vocabulary pop-ups, sentence starters, word bank, sentence frames,
  color-plus-text feedback, large fonts, keyboard-operable controls, and ARIA labels.
- **Pacing:** the Price Lab and Number Line are the math core; Decision/News/Passport are the literacy +
  reasoning core. Works well as one ~40–60 min session or split across two days at the Number Line step.

---

## Future expansion ideas

- More "Living School" chapters reusing this engine (transit fares, recycling rates, park usage).
- Scale-It-Up extension: compare totals for any number of tacos and graph the two rates.
- Optional class code + teacher dashboard aggregation (still local-first / privacy-safe).
- Branching story consequences that carry the city's meters into the next chapter.
- Audio read-aloud for directions to deepen ESOL accessibility.

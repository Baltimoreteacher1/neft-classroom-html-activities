# Number Realm — a Grade 6 Math RPG Campaign

A story-driven, standards-aligned math RPG built as a **term-long campaign**. One
hero travels every realm of the Grade 6 curriculum, leveling up across units,
while battling monsters by solving real math problems. Everything is static,
offline-capable HTML — no login required — and progress saves automatically.

> Live hub: **/math-rpg/** · one realm per unit, plus a Catch-Up garden and a
> gated Saga Finale.

---

## For teachers

- **No accounts, no PII.** Students just open a realm and play. Progress is kept
  in the browser (localStorage) and, via the shared Save/Resume system, can be
  carried to another device with a resume code.
- **Standards coverage (CCSS 6):** 6.NS, 6.RP, 6.EE, 6.SP, and 6.G across 48
  problem types and 42 chapters. Each battle question shows its standard.
- **Pace it with your unit sequence.** Assign a realm as your class reaches that
  unit; the **Daily Quest** and **Weekly Challenge** keep students returning in
  between for spaced practice.
- **Mastery visibility.** Every answer updates per-standard mastery
  (Novice → Apprentice → Master). Open the in-game **Hero Codex**, or read a
  clean summary programmatically from the Save/Resume engine
  (`NeftSaveResume.getTeacherSummary()` in the browser console on any realm).
- **Accessibility / ESOL.** Questions have a **Read Aloud** button (Web Speech),
  large touch targets, keyboard support, visible focus, and reduced-motion
  support. It honors the site-wide `window.NT_MUTED` flag.
- **AI Sage (optional).** In-battle Socratic hints call `/api/tutor` (Claude
  Haiku) and never reveal the final answer. If the endpoint is offline, the Sage
  falls back to each problem's built-in method hint — the game never breaks.

## For students

1. Open **/math-rpg/** and create your hero (name + avatar).
2. Pick a realm. Solve problems to attack monsters; wrong answers cost HP but you
   just try again. Ask the **Sage** for a hint any time.
3. Win battles for **XP** and **gold**, level up, buy items in the **Shop**, and
   unlock **abilities** (Focus, Power Strike, Second Wind, Scholar's Mercy).
4. Come back daily for the **Daily Quest** streak and weekly for the tougher
   **Weekly Challenge**.
5. Clear all ten realms to unlock the **Saga Finale** against *The Null*.

---

## The realms

| Route | Realm | Focus |
| --- | --- | --- |
| `/math-rpg/unit-0/` | The Gateway Gardens | Readiness warm-up |
| `/math-rpg/unit-1/` | The Foundry of Factors | 6.NS — factors, multiples, decimals |
| `/math-rpg/unit-2/` | The Fractured Isles | 6.NS.A — fraction division |
| `/math-rpg/unit-3/` | The Ratio Bazaar | 6.RP — ratios |
| `/math-rpg/unit-4/` | Percent Peaks | 6.RP — rates & percents |
| `/math-rpg/unit-5/` | The Tiled Territories | 6.G.A.1 — area |
| `/math-rpg/unit-6/` | Variable Vale | 6.EE — expressions |
| `/math-rpg/unit-7/` | The Balance Citadel | 6.EE.B — equations & inequalities |
| `/math-rpg/unit-8/` | The Data Delta | 6.SP — statistics |
| `/math-rpg/unit-9/` | The Coordinate Cosmos | 6.NS.C — rational numbers & the plane |
| `/math-rpg/unit-10/` | The Solid Sanctum | 6.G.A — volume & surface area |
| `/math-rpg/finale/` | The Rift at the End of Numbers | All standards (unlocks after 10 realms) |

---

## How it's built

Dependency-free vanilla JS, layered on the site's shared design tokens.

```
math-rpg/
  index.html              Saga hub (hero banner, daily/weekly, realm map, achievements)
  engine/
    problems.js           48 standards-aligned generators (+ difficulty tiers I/II/III)
    diagrams.js           SVG renderers: coordinate plane, figures, prisms, nets, number lines, dot plots
    profile.js            Global hero: level/XP/gold/HP, inventory, abilities, mastery, achievements, daily/weekly
    items.js              Shop items, level-gated abilities, achievement catalog
    rpg.js                Runtime: onboarding, world map, battles, shop, codex, finale
    rpg.css               Scoped styles (.mrpg-)
  units/
    unit-0.js .. unit-10.js, finale.js   Per-realm story, enemies, bosses, topic mix
  unit-0/ .. unit-10/, finale/           Bookmarkable per-realm loader routes
```

**Difficulty** scales with hero level (tiers I/II/III); bosses and the Weekly
Challenge bump the tier. **Battles** are procedurally generated, so practice is
effectively infinite and re-playable all term.

### Verify locally

```bash
npm run validate            # static + curriculum checks
npm run validate:save-resume
npm run build               # copies math-rpg/ into dist/
npm run preview             # smoke-test the built site
```

## Deploy

This repo deploys by pushing to `main` (Cloudflare Pages Git integration). The
`math-rpg/` folder is copied verbatim into `dist/` by `vite.config.js`
(`copyStandaloneHtml`), and `.md` files (like this one) are stripped from the
build — so this README ships as source documentation only.

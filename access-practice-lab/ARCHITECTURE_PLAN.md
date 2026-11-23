# THELANGUAGEPAGE.COM — Premium Platform Upgrade Architecture Plan

**Target Surface:** `access-practice-lab/` (served at `https://thelanguagepage.com/access-practice-lab/`)
**Status:** Phase 0 Frozen Architecture

---

## 1. Legacy Preservation Boundary ("Do Not Break")

All existing routes, labs, games, content JSONs, and user progress keys (`accessPracticeLab:v1:*`) remain untouched and 100% functional:
- Existing views under `src/views/*.js` (`/Listening`, `/Reading`, `/Speaking`, `/Writing`, `/tests`, `/passport`, `/family`, `/worlds`, `/speak`, `/write`, `/detective`, `/growth`, `/launch-studio`, etc.) continue to resolve through `parseRoute()` and `VIEW_LOADERS` in `src/main.js`.
- Existing `src/store.js` and `src/lang/*` engines are never overwritten.
- New platform state uses strictly namespaced `tlp_v1_*` keys via `src/platform/services/storageService.js`.

---

## 2. File & Directory Architecture

```text
access-practice-lab/
├── index.html                                  # Zero-FOUC theme/role boot script + premium-platform.css link
├── premium-platform.css                        # "Quiet Luxury EdTech" tokens (Light/Dark), role shells, @media print
├── src/
│   ├── main.js                                 # Registers 6 new routes + role/theme/debug listeners
│   ├── nav.js                                  # Unified Role Switcher (Teacher | Student | Family), Theme Toggle, L1 Selector
│   ├── shell.js                                # Mounts Role-Scoped chrome, L1 Coach bar, Diagnostics overlay
│   └── platform/
│       ├── data/
│       │   └── platformData.js                 # Samples (Math/Science/SS), Sentence Architect blocks, Speaking prompts, Radar roster, L1 lexicons
│       ├── services/
│       │   ├── storageService.js               # schemaVersion: 1, tlp_v1_* keys, safe JSON try/catch, zero-PII sanitizer
│       │   ├── intelligenceAdapter.js          # Deterministic rule/heuristic engine + optional live API adapter
│       │   └── logger.js                       # Structured diagnostics logger (silent unless ?debug=1 or Ctrl+Shift+D)
│       ├── state/
│       │   └── stateMachine.js                 # Deterministic IDLE -> ACTIVE -> EVALUATING -> FEEDBACK -> COMPLETE machine
│       ├── components/
│       │   └── ui.js                           # Accessible primitives: Drawers, Tabs, Modals, Badges, QR SVG
│       └── views/
│           ├── resourceHub.js                  # Role-scoped hub + filterable Resource Library Strip (legacy + new)
│           ├── bridge.js                       # Module 1: Content-to-Language Bridge
│           ├── architect.js                    # Module 3: Sentence Architect Studio (DnD + Touch + Click + Keyboard)
│           ├── simulator.js                    # Module 4: Adaptive Speaking Simulator with Measured Lifelines
│           ├── radar.js                        # Module 5: Reclassification Radar & 4-Week Domain Sprints
│           └── familyBridge.js                 # Module 6: Zero-Login Bilingual Family Bridge (RTL Arabic, 3 elements, Print)
```

---

## 3. Design Tokens ("Quiet Luxury EdTech")

- **Light Mode (Default):** Canvas `#FAF9F6`, Elevated Surface `#FFFFFF`, Secondary Surface `#F1F5F9`, Hairline Border `rgba(15, 23, 42, 0.08)`, Ink `#0F172A`, Muted Ink `#475569`.
- **Dark Mode (`[data-tlp-theme="dark"]`):** Canvas `#0B1120`, Elevated Surface `#111827`, Secondary Surface `#1E293B`, Hairline Border `rgba(255, 255, 255, 0.08)`, Ink `#F8FAFC`, Muted Ink `#94A3B8`.
- **Primary Accent:** Deep Cobalt `#2563EB` (`--tlp-accent`), Soft Tint `rgba(37, 99, 235, 0.10)`.
- **Proficiency Ramp (WCAG AA verified, colorblind-safe):** Levels 1–6 mapped to `--tlp-level-1` through `--tlp-level-6`.
- **Motion:** `150ms–200ms cubic-bezier(0.16, 1, 0.3, 1)`, disabled under `prefers-reduced-motion: reduce`.

---

## 4. Storage Schema (`schemaVersion: 1`)

- `tlp_v1_prefs`: `{ schemaVersion: 1, role: "teacher"|"student"|"family", theme: "auto"|"light"|"dark", l1: "es"|"ar"|"zh"|"fr"|"uk"|"ru"|"pt"|"en", cognateSpotlight: true }`
- `tlp_v1_entitlements`: `{ schemaVersion: 1, tier: "pro"|"free"|"district" }`
- `tlp_v1_bridge`: `{ schemaVersion: 1, lastSampleId, customText, activeLayers }`
- `tlp_v1_architect`: `{ schemaVersion: 1, completedIds, lastSentence }`
- `tlp_v1_speaking`: `{ schemaVersion: 1, clips: [{ id, promptId, alias, band, lifelineTier, transcript, createdAt }] }`
- `tlp_v1_radar`: `{ schemaVersion: 1, students: [...], activeSprints: {...} }`
- `tlp_v1_family_cards`: `{ schemaVersion: 1, cards: [...] }`

---

## 5. Privacy & Security Guarantees

- **Zero PII in URLs or storage:** Only first name + last initial or classroom alias (`"Maya R."`, `"Student A"`).
- **Client-side audio containment:** `MediaRecorder` blobs remain strictly in browser memory (`URL.createObjectURL`) and are revoked on unload/reset.
- **Family Bridge URLs:** Encode only `{ a: alias, l: langCode, g: growthKey, d: dinnerPromptId }` in base64url hash/query—zero personal data, zero server persistence.

# Small-Group Lesson Art — Brief & Drop-In Spec

Audit item 14 ("authored scene/character art"). The engine is now **art-ready**:
the hero mark and mission visual render an authored illustration when a lesson
config provides one, and fall back to the existing code-drawn theme SVG / emoji
otherwise (`mountAuthoredArt` in `engine/core/small-group-storyboard.js`). This
doc is the spec for producing the art and wiring it in — no engineering change
is needed to adopt it, only assets + a config field.

## How to drop art in (no code change)

Add one of these fields to a lesson `config.json` (or, since configs are
generated, to the generator that emits them):

```jsonc
{
  // Shared hero + mission art for the lesson (simplest):
  "sceneArt": { "src": "/assets/lesson-art/space-station.webp", "alt": "A cargo bay on a space station with crates to sort", "decorative": false },

  // Or target each surface independently:
  "heroImage":       { "src": "/assets/lesson-art/space-station-hero.webp", "alt": "…" },
  "launch": { "sceneImage": { "src": "/assets/lesson-art/space-station-mission.webp", "alt": "…" } }
}
```

- `src` (required): absolute path under `/assets/lesson-art/`.
- `alt`: a real description if the art conveys the scene; **omit or set
  `decorative: true`** for purely decorative art — the engine then renders it
  `aria-hidden` with empty alt so screen-reader users aren't read filler.
- A bare string (`"sceneArt": "/assets/lesson-art/x.webp"`) is also accepted and
  treated as decorative.

**Fallback is automatic:** if the asset 404s or fails to load, the studio silently
falls back to today's code-drawn theme SVG / emoji. So art can be added lesson by
lesson, and a missing file never breaks a page.

## Themes to illustrate

Art is keyed by the lesson `theme` (one illustration serves every lesson sharing
a theme). Current themes in use — one scene each covers the set:

| Theme slug        | Scene idea                                             |
| ----------------- | ------------------------------------------------------ |
| `space-station`   | Cargo bay, crates, friendly maintenance robot          |
| (add rows as themes are confirmed via `grep '"theme"' lessons/*/config.json`) |

Run `grep -h '"theme"' lessons/*/config.json | sort | uniq -c` for the live list.

## Style guide

- **Tone:** warm, inclusive, Grade-6 (11–12 yr) — capable and curious, not
  childish. Diverse, non-stereotyped characters; no text baked into the art
  (labels must stay live HTML for translation + a11y).
- **Palette:** harmonize with the studio's ocean-blue system — primary
  `#33568f`, deep `#284164`, soft `#eef2fa`, accents teal `#2f8f7d` /
  amber `#e0a63c` / green `#5a9e52`. Avoid pure-red/green as the only signal.
- **Works in dark mode:** art sits on a dark page in dark theme. Prefer
  illustrations with their own background/framing (not transparent PNGs that
  assume white behind them). Test against `#0e1522`.
- **Contrast-safe:** the art is decorative-supportive; never encode lesson
  information only in the image (that lives in the HTML).

## Asset specs

- **Format:** `.webp` (or `.svg` for vector scenes); ship an optimized file.
- **Hero mark:** ~square, target 320×320 (rendered ~112px, `object-fit: cover`).
- **Mission visual:** ~4:3 landscape, target 720×540 (`object-fit: cover`,
  min-height 200px).
- **Weight:** ≤ 60 KB each after compression; lazy-loaded (`loading="lazy"`).
- **Location:** `/assets/lesson-art/<theme>[-hero|-mission].webp`.
- **Licensing:** original or license-cleared for classroom redistribution
  (the site is deployed publicly).

## Verification once art lands

- `npm run build && npm run validate` (link/asset checks).
- Open a lesson using the theme in both light and dark; confirm the image shows,
  is not stretched, and reads well on the dark hero.
- Rename the asset to force a 404 and confirm the studio falls back to the SVG
  with no layout break.

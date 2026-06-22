# Blood on the River — Art Generation Rules & Audit Checklist

Authoritative rules for rebuilding all **243 scene images** so each one depicts the
exact literal moment of its scene, with recognizable recurring characters and
period-accurate 1607–1610 detail. Pairs with `character-bible.md`, `character-bible.js`,
`build-prompts.js`, and `scene-prompts.json`.

## Source of truth (priority order)
1. **The scene record** — `title`, `summary`, `quote`, `kind`, `page` for that exact scene.
2. **The chapter snapshot** — `Setting`, `Who`, `Key event` (chapter-level context).
3. **The character bible** — locked appearances for recurring people.
4. Nothing else. Do **not** invent people, places, objects, or events not in the scene record.

These records are read live from `https://eduwonderlab.com/blood-on-the-river/chapter-N/`
(each chapter page embeds `renderChapter({...})`), so the prompts always match the site.

## The seven rules (these caused / fix the original mismatch)
1. **Scene facts override chapter context.** A chapter set in "London, 1607" can contain a
   scene on the Chesapeake shore (e.g. Ch 1, Scene 1 — the prophecy). The image follows the
   *scene*, not the chapter banner.
2. **Exclude mentioned-but-absent characters.** If the text says a character has *not yet
   appeared*, is *away*, *gone*, or *does not return*, that character must **not** be drawn.
   They go in `charactersAbsent` and are added to the negative prompt ("do not depict …").
   - Examples the generator already handles: Ch 1 S1 prophecy → **Samuel absent**;
     Ch 14 S8 "Smith does not return" → **Smith absent**.
3. **No symbolic, ghostly, or unrelated figures.** Only the people the scene names (plus the
   relevant group cast). No allegory, no floating faces, no random crowds.
4. **Recurring characters stay consistent.** Always use the locked bible descriptor for a
   character — same age, build, clothing, distinguishing features (Smith's beard, Newport's
   one arm, Samuel's locket, Powhatan's deerskin mantle).
5. **Classroom-appropriate.** Violence is implied, never graphic: no gore, wounds, blood
   splatter, or dismemberment. Tension and danger are fine; explicit injury is not.
6. **Ships and places are never people.** Susan Constant, Godspeed, Discovery are ships;
   James Town / James River / Werowocomoco are places. (Note "James" the boy = *James
   Brumfield*, distinct from "James Town" — the detector disambiguates this.)
7. **Audit every image against its scene before it goes live** (checklist below).

## Visual style (locked)
- Realistic historical illustration, painterly storybook style, muted natural earth-tone palette.
- Period-accurate to **1607–1610**, early Jamestown era.
- **Square 1:1** composition. Cinematic natural lighting. Single clear focal subject.
- **No text, lettering, captions, watermark, signature, or border** anywhere in the image.

## Output / file convention
- Format: **WebP** (square). Keep the site's existing fallback loader; add a matching
  `.jpg` or `.png` fallback per image if the loader expects one.
- Path: `art/botr/ch{NN}-scene-{nn}.webp` (e.g. `art/botr/ch01-scene-01.webp`).
  `{NN}` = zero-padded chapter (01–27), `{nn}` = scene number (01–09).
- Each entry in `scene-prompts.json` carries its target `image` path. Adjust
  `CONFIG.imagePathTemplate` in `build-prompts.js` if your repo uses a different directory.

## How to (re)generate the prompts
```bash
node build-prompts.js      # fetches 243 records, writes scene-prompts.json
```
`scene-prompts.json` fields per scene:
`id, chapter, scene, kind, title, page, quote, summary, setting,
 charactersPresent[], charactersAbsent[], groupsPresent[], image, prompt, negativePrompt`

Feed `prompt` + `negativePrompt` to the image model; save the result to `image`.

## Per-image audit checklist (must pass before publishing)
For each generated image, confirm:
- [ ] **Right moment** — the action matches the scene `summary`/`quote`, not a generic chapter vibe.
- [ ] **Right setting** — location matches `setting`; scene overrides chapter banner.
- [ ] **Right cast present** — every name in `charactersPresent` is shown and recognizable.
- [ ] **No absent cast** — nobody from `charactersAbsent` appears.
- [ ] **No extras** — no unnamed crowds, symbolic figures, or anachronisms.
- [ ] **Consistent faces/clothing** — recurring characters match the bible across chapters.
- [ ] **Period accuracy** — clothing, tools, ships, architecture all 1607–1610.
- [ ] **Powhatan accuracy** — Eastern Woodland depiction, not Plains/Western stereotypes.
- [ ] **Classroom-appropriate** — no graphic violence.
- [ ] **Clean image** — square, no text/watermark/border.
- [ ] **Correct file** — saved to the `image` path, WebP (+ fallback).

> Setting lines are best-effort inferences; when a setting line and the scene `summary`
> ever disagree, **trust the summary** and correct the image (or tweak the LOC rules in
> `build-prompts.js`).

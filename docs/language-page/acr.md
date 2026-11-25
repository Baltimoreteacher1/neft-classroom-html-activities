# The Language Page — accessibility conformance report (draft)

**Status:** a DRAFT in the structure of the VPAT 2.5 WCAG edition, written 2026-11-25. **It is not a certification, it has
not been reviewed by an accessibility specialist, and no assistive-technology testing has been done** (H-10).
Every row is marked from what was actually measured. Where nothing was measured the row says **Not evaluated**.
Do not publish this as a conformance claim.

**Product:** The Language Page (thelanguagepage.com), the ACCESS Practice Lab and its studios. **Standard:** WCAG 2.2 A and AA.

## What was measured
| Test | Scope | Date | Result |
| --- | --- | --- | --- |
| axe-core (A, AA, 2.1 AA, 2.2 AA rules), desktop 1366×768, English | 85 production pages (the sitemap plus 6 sibling entry points) | 2026-11-24 | **One rule failed: `color-contrast`, on 5 pages** (`/wida-access/` listening, reading, speaking, writing, directions-trainer). No other axe rule failed on any page |
| axe-core on production after release 1 (muted-text colour fixed) | the same 5 pages | 2026-11-25 | 2 clean; 3 pages with 1 node each: the active task card's label (`opacity: 0.7`) |
| axe-core on production with that opacity removed (injected style, not yet shipped) | the 3 pages | 2026-11-25 | 0 violations |
| Phone layout at 390×844, no horizontal scroll | the same 85 pages | 2026-11-24 | 0 pages overflowed horizontally |
| One visible `h1` per page | the same 85 pages | 2026-11-24 | 85 of 85 |
| Touch-target size (44 px), phone | lab pages: median 5% of controls under 44 px; sibling pages: 63–96% under 44 px on six pages | 2026-11-24 | **Does not meet** on the sibling apps (`/studios/language/*`, `/learning-studios/`, `/language-adventures/`) |
| Spanish text marked `lang="es"` | 57 lab routes in Spanish mode | 2026-11-25 | 98.2% of 7,974 text nodes |

axe finds only some WCAG failures automatically. **"No axe violations" is not "conforms".**

## Known issues
1. **Target size** on the sibling apps (compiled output with no source in the repository; Joel decided to stop featuring them, `lp-sibling-apps-keep-urls-stop-featuring`).
2. **Contrast** of muted text on the studio pages was 4.33:1 against a 4.5:1 minimum; corrected (release 1, confirmed clean on 2 pages and reduced on 3 on production). The remaining report, "1.07:1" on the active task card's label, comes from a 0.7 opacity that contrast checkers read against the page behind the card (real contrast about 4.8:1, legible in a screenshot); release 2 sets that label to full opacity (about 8:1). **Re-measure on production after release 2.**
3. **Language of parts:** about 1.8% of Spanish interface text, mostly select options, is not marked `lang="es"`.
4. **Chrome weight:** four stacked navigation bars before content on phones (usability, not a WCAG failure).

## WCAG 2.2 — Level A and AA
Legend: **NE** not evaluated · **Partial** measured and partly met · **Does not** measured and not met. "Auto" means axe found no violation on the 85 pages; that is evidence, not conformance.

| Criterion | Level | Status | Basis |
| --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | NE | Auto: `image-alt`, `svg-img-alt` clean. Quality of alternatives not reviewed |
| 1.2.1–1.2.5 Time-based media (captions, audio description) | A/AA | NE | Videos carry English captions; listening is synthesized speech with on-page script. Not reviewed |
| 1.3.1 Info and Relationships | A | NE | Auto: landmark, list, heading rules clean |
| 1.3.2 Meaningful Sequence · 1.3.3 Sensory Characteristics | A | NE | Not reviewed |
| 1.3.4 Orientation · 1.3.5 Identify Input Purpose | AA | NE | Not reviewed |
| 1.4.1 Use of Color | A | NE | Not reviewed |
| 1.4.2 Audio Control | A | NE | Audio plays only on a press; not tested with a screen reader |
| 1.4.3 Contrast (Minimum) | AA | **Partial** | Failed on 5 pages (measured 2026-11-24); corrected 2026-11-25 on raw pages; production re-measure pending |
| 1.4.4 Resize Text · 1.4.5 Images of Text | AA | NE | A Reading Comfort panel offers 5 text sizes; 200% zoom not tested |
| 1.4.10 Reflow | AA | **Partial** | No horizontal scroll at 390 px on 85 pages; 320 px and 400% zoom not tested |
| 1.4.11 Non-text Contrast · 1.4.12 Text Spacing · 1.4.13 Content on Hover | AA | NE | Not reviewed |
| 2.1.1 Keyboard · 2.1.2 No Keyboard Trap · 2.1.4 Character Key Shortcuts | A | NE | Keyboard handlers exist in 52 files; not tested end to end |
| 2.2.1 Timing Adjustable · 2.2.2 Pause, Stop, Hide | A | NE | The lab does not use countdown timers by default; not reviewed |
| 2.3.1 Three Flashes | A | NE | Not reviewed |
| 2.4.1 Bypass Blocks | A | NE | Skip links exist; not tested |
| 2.4.2 Page Titled | A | **Partial** | Auto: `document-title` clean; 9 pages under `/studios/language/` still share one identical title (a separately served app; not yet fixed) |
| 2.4.3 Focus Order · 2.4.4 Link Purpose · 2.4.5 Multiple Ways · 2.4.6 Headings and Labels | A/AA | NE | Not reviewed |
| 2.4.7 Focus Visible · 2.4.11 Focus Not Obscured (Minimum) | AA | NE | Not reviewed |
| 2.5.1 Pointer Gestures · 2.5.2 Pointer Cancellation · 2.5.3 Label in Name · 2.5.4 Motion Actuation | A | NE | Not reviewed |
| 2.5.7 Dragging Movements | AA | NE | Drag activities exist; alternatives not verified |
| 2.5.8 Target Size (Minimum) | AA | **Does not** (siblings) / NE (lab) | Siblings measured below 44 px on 63–96% of controls; lab median 5% |
| 3.1.1 Language of Page | A | **Partial** | `<html lang>` is `en` in every mode (by design: the practice text is English); Spanish interface text is marked at element level |
| 3.1.2 Language of Parts | AA | **Partial** | 98.2% of Spanish interface text marked `lang="es"` |
| 3.2.1–3.2.4 Predictable · 3.2.6 Consistent Help | A/AA | NE | Not reviewed |
| 3.3.1 Error Identification · 3.3.2 Labels or Instructions · 3.3.3 Error Suggestion · 3.3.4 Error Prevention · 3.3.7 Redundant Entry · 3.3.8 Accessible Authentication | A/AA | NE | No accounts or passwords; not reviewed |
| 4.1.2 Name, Role, Value | A | NE | Auto: `button-name`, `aria-*`, `label` clean |
| 4.1.3 Status Messages | AA | NE | Live regions exist (`aria-live` in 148 files); not tested with a screen reader |

## To finish this report
Run the assistive-technology matrix (NVDA + Chrome, JAWS + Chrome, VoiceOver + Safari on macOS and iOS, TalkBack + Chrome),
keyboard-only and 200% / 400% zoom passes, and a forced-colours pass, then update each **NE** row from results (H-10).

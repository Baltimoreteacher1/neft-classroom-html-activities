# Accessibility audit — 2026-09-29

Target: `http://127.0.0.1:8769` · 24 pages · axe-core WCAG 2.1 A/AA

**0** violations — critical 0, serious 0, moderate 0, minor 0.

Muted as cosmetic: `landmark-one-main`, `region`, `page-has-heading-one`.

## By rule (fix these once, they clear everywhere)

_No violations found._

## Needs a human eye (1)

axe flagged these but its verdict is not trustworthy here. Check them
visually once; they are not counted as violations above.

| Page | Rule | Elements | Why axe is unreliable |
| --- | --- | ---: | --- |
| ACCESS practice lab | `color-contrast` | 4 | sits over a gradient — axe reported the nearest solid ancestor colour |

## Keyboard reachability

| Page | Focusable elements | Focus visibility | Positive tabindex |
| --- | ---: | --- | ---: |
| Home portal | 143 | custom (UA ring replaced) | 0 |
| Curriculum hub | 109 | custom (UA ring replaced) | 0 |
| Activity directory | 760 | custom | 0 |
| Lesson 1-1 (flagship interior) | 41 | custom (UA ring replaced) | 0 |
| Lesson 6-13 (standard interior) | 57 | custom (UA ring replaced) | 0 |
| Class board | 22 | custom (UA ring replaced) | 0 |
| ACCESS practice lab | 366 | custom | 0 |
| Practice engine | 7 | custom | 0 |
| Fluency student practice | 28 | custom | 0 |
| Fluency readiness guide | 608 | custom | 0 |
| Lesson Learn It | 26 | custom (UA ring replaced) | 0 |
| Lesson vocabulary | 35 | custom (UA ring replaced) | 0 |
| Lesson homework | 23 | custom (UA ring replaced) | 0 |
| Lesson printable | 2 | custom | 0 |
| Family page | 6 | custom | 0 |
| Teacher notes | 8 | custom | 0 |
| 2D game | 25 | custom | 0 |
| 3D game | 25 | custom | 0 |
| Unit project | 39 | custom | 0 |
| Unit project hub | 9 | custom (UA ring replaced) | 0 |
| Unit project worksheet | 22 | custom (UA ring replaced) | 0 |
| Unit project answer key | 0 | custom | 0 |
| Graphic novel | 17 | custom | 0 |
| Small-group lesson | 60 | custom (UA ring replaced) | 0 |

`custom (UA ring replaced)` is the correct pattern — `outline: none`
paired with a custom `:focus` style. `browser default` is acceptable.
Only `NONE` is a defect: the ring is suppressed and nothing replaces it,
so a keyboard user cannot see where they are. A positive `tabindex`
overrides document order and usually creates a confusing focus path.

## Per-page detail

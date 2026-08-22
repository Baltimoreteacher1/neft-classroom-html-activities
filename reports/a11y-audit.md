# Accessibility audit — 2026-08-22

Target: `https://eduwonderlab.com` · 22 pages · axe-core WCAG 2.1 A/AA

**1** violations — critical 0, serious 1, moderate 0, minor 0.

Muted as cosmetic: `landmark-one-main`, `region`, `page-has-heading-one`.

## By rule (fix these once, they clear everywhere)

| Impact | Rule | Elements | Pages | What it means |
| --- | --- | ---: | ---: | --- |
| serious | `color-contrast` | 1 | 1 | Elements must meet minimum color contrast ratio thresholds |

## Needs a human eye (1)

axe flagged these but its verdict is not trustworthy here. Check them
visually once; they are not counted as violations above.

| Page | Rule | Elements | Why axe is unreliable |
| --- | --- | ---: | --- |
| ACCESS practice lab | `color-contrast` | 4 | sits over a gradient — axe reported the nearest solid ancestor colour |

## Keyboard reachability

| Page | Focusable elements | Focus visibility | Positive tabindex |
| --- | ---: | --- | ---: |
| Home portal | 20 | browser default | 0 |
| Curriculum hub | 55 | custom (UA ring replaced) | 0 |
| Activity directory | 478 | custom | 0 |
| Lesson 1-1 (flagship interior) | 29 | custom (UA ring replaced) | 0 |
| Lesson 6-13 (standard interior) | 43 | custom (UA ring replaced) | 0 |
| Class board | 18 | custom (UA ring replaced) | 0 |
| ACCESS practice lab | 362 | custom | 0 |
| Practice engine | 3 | custom | 0 |
| Lesson Learn It | 27 | custom (UA ring replaced) | 0 |
| Lesson vocabulary | 35 | custom (UA ring replaced) | 0 |
| Lesson homework | 35 | custom (UA ring replaced) | 0 |
| Lesson printable | 1 | browser default | 0 |
| Family page | 2 | custom | 0 |
| 2D game | 21 | custom | 0 |
| 3D game | 21 | custom | 0 |
| Unit project | 35 | custom | 0 |
| Unit project hub | 9 | custom (UA ring replaced) | 0 |
| Unit project worksheet | 18 | custom (UA ring replaced) | 0 |
| Graphic novel | 16 | custom | 0 |
| Small-group lesson | 52 | custom (UA ring replaced) | 0 |

`custom (UA ring replaced)` is the correct pattern — `outline: none`
paired with a custom `:focus` style. `browser default` is acceptable.
Only `NONE` is a defect: the ring is suppressed and nothing replaces it,
so a keyboard user cannot see where they are. A positive `tabindex`
overrides document order and usually creates a confusing focus path.

## Per-page detail

### Lesson 6-13 (standard interior) — `/lessons/6-13/`

- **serious** `color-contrast` (1 element) — Elements must meet minimum color contrast ratio thresholds
  - e.g. `<div class="flagship-scene-name">Cargo Bay</div>`

## Pages that could not be audited

- `/lessons/1-1/teacher-notes/` (Teacher notes) — HTTP 401
- `/math/unit-1/projects/answer-key/` (Unit project answer key) — HTTP 401

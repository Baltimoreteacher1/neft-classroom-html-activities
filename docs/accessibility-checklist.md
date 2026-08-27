# EduWonderLab Accessibility Checklist (WCAG 2.2 AA)

A reusable pre-ship checklist for interactive lessons, small-group studios, worksheets, practice surfaces, and curriculum tools. Every lesson and feature must pass these criteria before shipping.

---

## 1. Keyboard-Only Navigation & Workflow (WCAG 2.1.1, 2.1.2, 2.4.3)
- [ ] **Full Journey Without Mouse**: Entire flow (Mission briefing → Warmup → Objectives → Launch → Vocab → Learn It → Explore → Practice → Exit Ticket) can be traversed using only `Tab`, `Shift+Tab`, `Enter`, `Space`, and Arrow keys.
- [ ] **No Keyboard Traps**: Focus can enter and leave all interactive components, code blocks, tables, and manipulatives without getting stuck (`Tab` / `Shift+Tab` always work).
- [ ] **Logical Tab Order**: Focus order matches the visual reading flow and instructional sequence.
- [ ] **Focus Preservation on DOM Updates**: When questions advance, choices lock, or dynamic views update, focus is intentionally placed on the next logical element (e.g., next question header, feedback container, or Continue button) and never drops to `<body>`.
- [ ] **Focus Restoration**: When a modal, hint card, dialog, or drawer closes, focus returns immediately to the trigger element that opened it.

---

## 2. Visible Focus Indicators (WCAG 2.4.7, 2.4.11, 2.4.13)
- [ ] **High-Contrast Focus Ring**: Every interactive control (buttons, inputs, radios, checkboxes, clickable cards, links) has a distinct `:focus-visible` ring (e.g., `outline: 3px solid var(--focus-ring, #1f6eaa); outline-offset: 2px`).
- [ ] **No Outline Stripping**: `outline: none` or `outline: 0` is never used unless replaced with an equally prominent, high-contrast visual focus indicator.
- [ ] **Unobscured Focus**: Focused controls are not hidden behind sticky headers, floating tools docks, bottom save bars, or score strips.

---

## 3. Accessible Dialogs & Modals (WCAG 1.3.1, 2.1.2, 2.4.3, 4.1.2)
- [ ] **Native `<dialog>` or Robust ARIA**: Modals use native HTML `<dialog>` with `.showModal()` or have `role="dialog"` / `role="alertdialog"` with `aria-modal="true"`.
- [ ] **Accessible Name**: Every dialog has an explicit title linked via `aria-labelledby` or `aria-label`.
- [ ] **Focus Trapping**: Keyboard focus is constrained inside the dialog while open; elements in the background document are inert and unreachable.
- [ ] **Escape Key Support**: Pressing `Escape` closes the dialog cleanly.
- [ ] **Small Viewport Reflow**: Dialogs fit within small screens (320px width / short height) with internal scrolling and reachable close buttons.

---

## 4. Names, Labels, and Structural Hierarchy (WCAG 1.3.1, 2.4.6, 3.3.2, 4.1.2)
- [ ] **Icon-Only Controls**: Every icon button (e.g., 🔊 TTS, 🧰 Tools, ✕ Close, ⚙️ Settings) has an explicit `aria-label` or accessible text (`.sr-only`).
- [ ] **Explicit Form Labels**: Every input, textarea, and select is programmatically associated with a label using `<label for="id">` or `aria-labelledby`.
- [ ] **Heading Hierarchy**: Headings follow a strict logical structure (`h1` → `h2` → `h3`) without skipping levels for visual styling.
- [ ] **Data Tables**: Tables use `<th>` with `scope="col"` or `scope="row"` for header cells, avoiding bare `<td>` headers.
- [ ] **Expandable Disclosure State**: Accordions and dropdowns expose their state using `aria-expanded="true|false"` on the trigger.

---

## 5. Contrast & Non-Color Semantics (WCAG 1.4.1, 1.4.3, 1.4.11)
- [ ] **Text Contrast**: Normal text has at least 4.5:1 contrast against its background; large text (18pt / 14pt bold) has at least 3:1.
- [ ] **UI Component Contrast**: Interactive borders, input outlines, and essential icons maintain at least 3:1 contrast against adjacent colors.
- [ ] **Never Color Alone**: Statuses (Correct/Incorrect, difficulty levels, station types, warnings) always pair color with text labels, badges, or distinct icons (e.g., ✓ Correct, ✗ Incorrect).

---

## 6. Target Size & Touch Ergonomics (WCAG 2.5.5, 2.5.8)
- [ ] **Minimum Target Size**: Student tap/click targets meet at least 44×44 CSS px where practical.
- [ ] **Mathematical Integrity Preserved**: Mathematical increments, graph scales, coordinate axes, and number line points maintain mathematical precision and are not distorted solely to enlarge targets (use hit-area padding instead).

---

## 7. Reduced Motion Support (WCAG 2.2.2, 2.3.3)
- [ ] **`prefers-reduced-motion: reduce`**: Non-essential transitions, parallax effects, bouncy celebratory animations, and floating movement are disabled or converted to instant state changes when reduced motion is requested.
- [ ] **Mathematical Comprehension**: Motion is never required to understand a mathematical concept, representation, or worked step.

---

## 8. Bilingual Language Switching & Pronunciation (WCAG 3.1.1, 3.1.2)
- [ ] **Root `lang` Attribute**: Flipping between English and Spanish updates `<html lang="en">` / `<html lang="es">` dynamically.
- [ ] **Segmental `lang` Tags**: In bilingual or stacked views, Spanish passages explicitly carry `lang="es"` so screen readers switch pronunciation rules correctly.
- [ ] **Accessible Names in Selected Language**: When the language flips, `aria-label`, button tooltips, and placeholder text update to matching translations.

---

## 9. Dynamic Feedback & Live Regions (WCAG 4.1.3)
- [ ] **Polite Live Regions**: Asynchronous feedback ("Correct!", "Answer saved", "Work restored") is announced via a dedicated `aria-live="polite"` or `role="status"` container.
- [ ] **No Chatter / Throttling**: Live regions do not fire repeatedly on every keystroke or frame timer. Per-second timers must use `aria-live="off"`.

---

## Pre-Ship Verification Commands
```bash
npm run qa:fast          # Fast change-scoped check
node tools/run-tests.mjs # Standalone test scripts
npm run qa:loop          # Full 106/106 gate verification
```

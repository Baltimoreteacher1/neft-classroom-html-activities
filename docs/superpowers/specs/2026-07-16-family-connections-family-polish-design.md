# Family Connections Family Experience Polish

## Goal

Make the published Family Connections page faster to understand, easier to navigate on a phone, and more reassuring for families while preserving the protected teacher publisher, read-only public model, Canvas sync, bilingual controls, and existing visual identity.

## Family Journey

### 1. Reach the useful content sooner

- Tighten mobile header and hero spacing without shrinking readable type.
- Keep the password-protected Teacher sign-in link, but style it as a secondary utility instead of the strongest family action.
- Add a compact three-link navigation row: **This week**, **Optional practice**, and **Ways to help**.
- Keep every target at least 44 pixels and support keyboard focus, reduced motion, high contrast, and larger text.

### 2. Make the weekly state honest and calm

- Continue rendering weekday cards whenever the teacher has posted lessons, review days, assessments, no-class notes, or any meaningful family note.
- When all five days are untouched default placeholders, render one friendly empty-week card instead of five repeated “No lesson posted” cards.
- Add a visible **Today** marker to the current weekday so the distinction is not communicated by color alone.
- Preserve the class selector, read-aloud tool, published timestamp, and all existing teacher-authored wording.

### 3. Make optional practice easier to choose

- Change the lesson count from inventory wording such as “74 of 74 lessons” to family wording such as “74 lessons available”; show a filtered result count only while searching.
- Add a **Clear filters** control that appears only when search or unit filters are active.
- Add each lesson’s learning objective as a concise **Learning focus** line.
- Rename actions to **Start optional practice** and **Open family help**.
- Keep directions, materials, language support, school alternatives, supplemental links, and the clear optional/ungraded statement.

### 4. Show only meaningful communication destinations

- Continue accepting safe HTTPS ClassDojo and Canvas links from Teacher Mode.
- Hide generic service homepages that do not take a family to a configured class or course.
- Do not add contacts, student information, tracking, messages, grades, or answer keys.

## Teacher Preview

- Keep the existing draft-first Preview → Publish workflow and revision safeguards.
- Make the compact teacher preview use the same empty-week interpretation as Family Mode.
- Include a short preview summary showing how many days and optional-practice lessons families will see.
- Do not expose editing controls or draft data on the public route.

## Architecture

- Extend the shared family renderer for weekly-state detection, today labeling, objective copy, and family-facing actions.
- Keep page shell improvements in the public HTML/CSS.
- Keep integration filtering and clear-filter behavior in the public app.
- Reuse the weekly-state helper in the protected teacher preview so the two views do not drift.
- Add focused model/renderer/static contracts before implementation.

## Acceptance Criteria

1. The mobile first screen is materially more compact and has no horizontal overflow.
2. Families can jump directly to the three primary sections.
3. A completely untouched week renders one calm empty state, while meaningful teacher content still renders by day.
4. Today is identified in text and not only by color.
5. Optional-practice cards explain what students are practicing and use clear family action labels.
6. Filters can be reset with one accessible control and lesson counts read naturally.
7. Generic ClassDojo/Canvas homepages are not presented as configured family channels.
8. Teacher preview reports the same empty-week state and visible-practice summary.
9. Family Mode remains read-only and contains no hidden answer keys, student data, or editing path.
10. Canvas publication and feed contracts remain unchanged.

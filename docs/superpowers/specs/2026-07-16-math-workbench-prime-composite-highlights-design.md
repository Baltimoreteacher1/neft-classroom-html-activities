# Math Workbench Prime and Composite Highlights

## Goal

Add student-friendly number classification controls beneath the Math Workbench multiplication chart. Students can highlight prime products, highlight composite products, or clear the classification highlights without losing the chart's existing multiplication-fact interactions.

## Interaction

- Show a compact **Number highlights** group only while the multiplication table is active.
- Provide three bottom controls: **Prime numbers**, **Composite numbers**, and **Clear highlights**.
- Selecting Prime or Composite replaces the prior classification mode and updates `aria-pressed`.
- Highlight every body cell whose displayed product belongs to the selected class. Repeated products are all highlighted.
- Keep 1 unhighlighted because it is neither prime nor composite.
- Clear removes only classification highlights and returns both toggle buttons to the unpressed state.
- Switching to the division table clears and hides the classification controls. Switching back restores the controls in a neutral state.
- Existing hover, keyboard-focus, tap, pinned row/column, equation, and header Clear behavior remain unchanged.

## Student Experience

- Directions explain the definitions in plain language: a prime number has exactly two factors; a composite number has more than two factors.
- Prime and composite states use distinct, high-contrast colors plus a visible inset marker so meaning does not depend on color alone.
- Controls use at least 44-pixel touch targets, visible focus styles, and descriptive accessible labels.
- A polite status message reports what is highlighted and how many chart squares match.

## Implementation

Keep the feature in the canonical static Workbench page:

- add styles for the bottom control group and classification states;
- add semantic button markup and a live status area;
- add small `isPrime`, classification, render, and clear helpers inside the existing times-table script;
- add a static regression test that verifies the required controls, accessibility contract, classification logic, and division-mode reset.

No dependencies, storage, tracking, answer keys, or network calls are added.

## Acceptance Criteria

1. Prime highlights include products such as 2, 3, 5, 7, and 11, but exclude 1 and composite products.
2. Composite highlights include products such as 4, 6, 8, 9, and 12, but exclude 1 and primes.
3. Only one classification mode can be active.
4. Clear removes every classification highlight.
5. Existing chart fact highlighting still works.
6. The controls are keyboard accessible, readable on Chromebook and mobile widths, and hidden in division mode.

// Declared foreground/background pairs for shared/ui, per theme. tools/ui-tokens.test.mjs resolves each role
// from theme.css to a colour (through engine/styles/ds-tokens.generated.css) and computes the WCAG ratio:
// text pairs need 4.5, non-text pairs (focus ring, control border, tone marks) need 3. A role declared in
// theme.css that is neither listed here nor in NOT_CONTRAST fails the test, so a new colour cannot slip in unchecked.
const text = (fg, bg, use) => ({ fg, bg, min: 4.5, use });
const graphic = (fg, bg, use) => ({ fg, bg, min: 3, use });

const TONES = ["neutral", "info", "success", "warn", "error"];
const toneText = TONES.map((t) => text("--ui-tone-fg", `--ui-tone-${t}-bg`, `${t} badge text`));
const toneMark = TONES.map((t) =>
  graphic(`--ui-tone-${t}-mark`, `--ui-tone-${t}-bg`, `${t} badge mark`),
);

const shared = (surfaceUse) => [
  text("--ui-text", "--ui-surface", `body text on ${surfaceUse}`),
  text("--ui-text", "--ui-page", "body text on the page"),
  text("--ui-muted", "--ui-surface", `secondary text on ${surfaceUse}`),
  text("--ui-muted", "--ui-page", "secondary text on the page"),
  text("--ui-heading", "--ui-surface", `headings on ${surfaceUse}`),
  text("--ui-heading", "--ui-page", "headings on the page"),
  text("--ui-link", "--ui-surface", `links on ${surfaceUse}`),
  text("--ui-link", "--ui-page", "links on the page"),
  text("--ui-primary-fg", "--ui-primary-bg", "primary button label"),
  text("--ui-accent-fg", "--ui-accent-bg", "accent fill label"),
  text("--ui-danger-fg", "--ui-danger-bg", "danger button label"),
  graphic("--ui-control-border", "--ui-surface", "control border"),
  graphic("--ui-control-border", "--ui-page", "control border on the page"),
  graphic("--ui-primary-bg", "--ui-surface", "primary button edge"),
  graphic("--ui-danger-bg", "--ui-surface", "danger button edge"),
  graphic("--ui-focus", "--ui-surface", `focus ring on ${surfaceUse}`),
  graphic("--ui-focus", "--ui-page", "focus ring on the page"),
  graphic("--ui-accent-bg", "--ui-surface", "selected tab bar and band edge"),
  ...toneText,
  ...toneMark,
];

export const THEMES = ["light", "dark"];
export const CONTRAST_PAIRS = Object.freeze({
  light: shared("a card"),
  dark: shared("a dark card"),
});

/** Roles that are not a foreground/background pair: decorative edges, the scrim and the motion switch. */
export const NOT_CONTRAST = Object.freeze({
  "--ui-card-border":
    "decorative card edge; the card is identified by its heading, not its outline",
  "--ui-overlay": "dialog scrim; the dialog itself carries the contrast",
  "--ui-motion": "duration, not a colour",
});

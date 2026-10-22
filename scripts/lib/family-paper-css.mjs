/**
 * Shared look of the family letter pages (lesson guide, word problems): paper,
 * unit hue, line icons and the three card surfaces. The tokens themselves live in
 * assets/family-paper.css, the one source for every family surface.
 */
import { readFileSync } from "node:fs";

export const FAMILY_PAPER = readFileSync(
  new URL("../../assets/family-paper.css", import.meta.url),
  "utf8",
);

// One line-icon per section, drawn as a CSS mask so it takes the unit colour.
const icon = (paths) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${paths}</svg>`,
  )}")`;
export const SECTION_ICONS = {
  learning:
    "<path d='M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z'/>",
  mission: "<path d='M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6'/>",
  tool: "<path d='M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1M15 5v4M8 10v4M17 15v4'/>",
  vocab: "<path d='M4 5h16v11H9l-5 4z'/>",
  example: "<path d='M4 5h16v11H4zM8 20h8M12 16v4'/>",
  practice: "<path d='M4 20l1-5L16 4l4 4L9 19zM14 6l4 4'/>",
  stuck:
    "<circle cx='12' cy='12' r='9'/><circle cx='12' cy='12' r='3.5'/><path d='M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9'/>",
  frames: "<path d='M5 7h14M5 12h14M5 17h9'/>",
  percent: "<path d='M19 5L5 19'/><circle cx='7' cy='7' r='2.5'/><circle cx='17' cy='17' r='2.5'/>",
  deal: "<path d='M3 12V4h8l10 10-8 8z'/><circle cx='7.5' cy='8.5' r='1'/>",
};

export const FAMILY_LETTER_CSS = `
:root { --navy: var(--fp-ink); --teal: var(--fp-unit); --teal-ink: var(--fp-unit-ink); --teal-light: var(--fp-unit-tint);
  --cream: var(--fp-paper); --line: var(--fp-rule); --muted: var(--fp-muted); --ink: var(--fp-ink-soft); }
body { background: var(--fp-paper); color: var(--fp-ink-soft); font-family: var(--fp-sans); font-size: 19px; }
h1, section h2 { font-family: var(--fp-serif); color: var(--fp-ink); }
a { color: var(--fp-unit-ink); }
.wrap { max-width: 1040px; padding: 0 24px 64px; background: transparent; box-shadow: none; border-radius: 0; overflow: visible; margin: 0 auto; }

/* Letter head: ink title on paper, one unit-coloured rule. */
.hero-header { background: none; padding: 40px 0 24px; border-top: 6px solid var(--fp-unit); border-bottom: 1px solid var(--fp-rule); text-align: left; color: var(--fp-ink); }
.hero-header .eyebrow { color: var(--fp-unit-ink); font-size: 16px; font-weight: 600; letter-spacing: 0; text-transform: none; margin: 0 0 8px; }
.hero-header .eyebrow .es { font-weight: 500; color: var(--fp-muted); }
.hero-header h1 { color: var(--fp-ink); font-size: clamp(30px, 4.4vw, 42px); font-weight: 700; line-height: 1.15; margin: 0; max-width: 24ch; text-wrap: balance; }
.hero-header .std { display: inline-block; background: var(--fp-unit-tint); border: 0; color: var(--fp-unit-ink); margin: 14px 0 0; padding: 3px 12px; font-size: 14px; font-weight: 600; }

section { padding: 32px 0; border: 0; border-bottom: 1px solid var(--fp-rule); }
section h2 { font-size: 26px; font-weight: 650; display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; margin: 0 0 16px; }
section h2 .es { font-family: var(--fp-sans); font-size: 16px; font-weight: 500; color: var(--fp-muted); }
section h2::before { content: ""; width: 26px; height: 26px; flex: none; background: var(--fp-unit-ink);
  -webkit-mask: var(--ico) center / contain no-repeat; mask: var(--ico) center / contain no-repeat; }
${Object.entries(SECTION_ICONS)
  .map(([name, paths]) => `.section-${name} h2 { --ico: ${icon(paths)}; }`)
  .join("\n")}

/* Spanish sits on its own tinted line, not grey italics. */
.es-text { font-style: normal; color: var(--fp-ink-soft); background: var(--fp-unit-tint); border-left: 3px solid var(--fp-unit); border-radius: 0 6px 6px 0; padding: 4px 12px; }
span.es-text { display: block; margin-top: 8px; }

/* Three surfaces only: plain card, unit-tint key idea, one highlight for the grown-up note. */
.callout { border: 1px solid var(--fp-rule); border-radius: 10px; padding: 18px 22px; background: var(--fp-page); font-size: 20px; line-height: 1.55; }
.callout--key { background: var(--fp-unit-tint); border-color: transparent; border-left: 5px solid var(--fp-unit); border-radius: 4px 10px 10px 4px; font-size: 22px; }
.callout--note { background: var(--fp-note); border-color: transparent; border-left: 5px solid var(--fp-note-ink); border-radius: 4px 10px 10px 4px; color: var(--fp-note-ink); }
.callout--note .es-text { background: transparent; border-left-color: var(--fp-note-ink); color: var(--fp-note-ink); }
.callout--work { background: var(--fp-wash); border-color: var(--fp-rule); }
.callout--work p.problem { font-size: 22px; color: var(--fp-ink); margin: 12px 0; }
.callout--work details { margin-top: 20px; font-size: 18px; }
.callout--work summary { cursor: pointer; color: var(--fp-unit-ink); font-weight: 600; }
.callout--work details p { margin: 12px 0 0; }
.answer { background: var(--fp-unit-tint); border: 1px solid var(--fp-unit); color: var(--fp-ink); font-size: 20px; }

footer { color: var(--fp-muted); }
a:focus-visible, summary:focus-visible, button:focus-visible { outline: 3px solid var(--fp-unit-ink); outline-offset: 3px; }

@media (max-width: 560px) {
  .wrap { padding: 0 18px 48px; }
  .hero-header { padding: 28px 0 20px; }
  section { padding: 26px 0; }
  section h2 { font-size: 23px; }
}
`;

/**
 * The calm first screen of a family page, modelled on the ACCESS Practice Lab level pages:
 * a light panel, the lesson as the one big heading, the big idea as its subtitle, plain white
 * choice cards and one Start button.
 *
 * This is a skin. Layout (which element sits where, the laptop one-row route chooser, mobile
 * order) belongs to homework-session-flow.mjs and homework-experience-css.mjs and is not
 * touched here, so the two cannot disagree about where things go.
 *
 * Appended after every other homework stylesheet (the studio skin and unit theme use
 * !important), so each rule carries `body` for specificity. Screen only: print keeps its own
 * header. Type and touch floors are owned by homework-experience-css.mjs and are not lowered.
 */
export const CALM_CSS = `
@media screen {
body .hw-hero { background: var(--fp-unit-tint) !important; color: var(--fp-ink) !important; border: 1px solid var(--fp-rule) !important; border-radius: 24px !important; box-shadow: none !important; padding: clamp(18px, 3.4vw, 40px) !important; }
body .hw-hero .lang-es, body .hw-hero .lang-en { color: inherit; }
body .hw-hero .lang-en + .lang-es { border-left: 0; padding-left: 0; }

/* Language picker: a quiet segmented control. */
body .hw-hero .lang-selector-card { background: #fff; border: 1px solid var(--fp-rule); border-radius: 999px; padding: 4px; box-shadow: none; }
body .hw-hero .lang-selector-buttons { gap: 2px; background: transparent !important; }
body .hw-hero .lang-toggle-btn { background: transparent; color: var(--fp-ink); border: 0; border-radius: 999px; box-shadow: none; font-weight: 700; }
body .hw-hero .lang-toggle-btn.active { background: var(--fp-unit-ink); color: #fff; }
body .hw-hero .lang-selector-title { color: var(--fp-ink) !important; }

/* The unit is a small pill; the product name is the eyebrow over the lesson title. */
body .hw-hero-kicker { display: inline-flex; justify-self: start; width: fit-content; margin: 0 0 14px; padding: 6px 14px; border-radius: 14px; background: #fff; color: var(--fp-unit-ink) !important; opacity: 1; font-size: 14px; font-weight: 800; letter-spacing: .02em; text-transform: none; }
body .hw-hero-kicker .lang-en, body .hw-hero-kicker .lang-es { font-size: 14px; }
body .hw-hero-kicker-icon, body .hw-hero-emoji, body .hw-hero-subtitle { display: none !important; }
body .hw-hero-head { margin: 0; padding: 0; border: 0; }
body .hw-hero .hw-hero-titles h1, body .hw-hero .hw-hero-titles .welcome-title-en, body .hw-hero .hw-hero-titles .welcome-title-es { font-family: inherit !important; font-size: 15px !important; font-weight: 800 !important; letter-spacing: .06em; text-transform: uppercase; color: var(--fp-unit-ink) !important; }
body .hw-hero .hw-hero-titles .welcome-title-es { display: inline; }
body.lang-mode-bilingual .hw-hero .hw-hero-titles .welcome-title-es::before { content: " · "; }
body:not(.lang-mode-bilingual) .hw-hero .hw-hero-titles .welcome-title-es::before { content: none; }
body .hw-hero-lesson { margin: 6px 0 0; padding: 0; border: 0; }
body .hw-hero-lesson-title { display: block; font-family: var(--fp-serif); font-size: clamp(1.9rem, 3.8vw, 2.75rem); font-weight: 800; line-height: 1.08; letter-spacing: -.01em; color: var(--fp-unit-ink) !important; }
body.lang-mode-bilingual .hw-hero-lesson-title .lang-es { margin-top: 6px; font-size: .5em; font-weight: 700; opacity: .8; }
body .hw-hero-lesson-meta, body .hw-hero-lesson-meta .lang-en, body .hw-hero-lesson-meta .lang-es { color: var(--fp-ink) !important; opacity: .75; }

/* The big idea is the subtitle, not a boxed callout. */
body .hw-hero-body > .hw-hero-bigidea { margin: 14px 0 0; padding: 0; border: 0; background: none; font-size: clamp(1.1rem, 2vw, 1.35rem); font-weight: 500; line-height: 1.5; max-width: 46em; }
body .hw-hero-bigidea .hw-hero-bigidea-label { display: none; }
body .hw-hero-bigidea .lang-es { display: block; margin-top: 6px; font-size: .88em; opacity: .85; }
body .hw-hero-lead { color: var(--fp-ink); opacity: .8; }

/* Tonight at a glance: plain white chips. */
body .hw-tonight li { background: #fff; border: 1px solid var(--fp-rule); color: var(--fp-ink); font-weight: 600; }

/* The time choice: plain cards and one Start button, no box around them. */
body .hw-hero-body > .hw-route-chooser { background: transparent !important; border: 0 !important; box-shadow: none; padding-inline: 0; }
body .hw-route-chooser .hw-route-icon { display: none; }
body .hw-route-chooser .hw-route-heading h2 { font-size: 17px; font-weight: 800; color: var(--fp-ink); }
body .hw-route-option { background: #fff !important; border: 2px solid transparent !important; border-radius: 14px; box-shadow: none; text-align: left; }
body .hw-route-option .hw-route-time { background: none !important; color: var(--fp-unit-ink); font-size: 14px; font-weight: 800; }
body .hw-route-option .hw-route-copy strong { color: var(--fp-ink); }
body .hw-route-option .hw-route-copy small { color: var(--fp-ink); opacity: .75; }
body .hw-route-option.is-active, body .hw-route-option[aria-pressed="true"] { border-color: var(--fp-unit-ink) !important; box-shadow: 0 0 0 3px var(--fp-unit-tint), 0 0 0 5px var(--fp-unit); }
body .hw-route-chooser #hw_start_button { border-radius: 14px; font-weight: 800; box-shadow: none; }
body .hw-route-promise { color: var(--fp-ink); opacity: .8; }

/* Session stepper and tools: quiet rows under the choice, not a second card. */
body .hw-session-banner { background: transparent !important; border: 0 !important; box-shadow: none; }
body .hw-tools-menu > summary { color: var(--fp-ink); font-weight: 700; }
}
`;

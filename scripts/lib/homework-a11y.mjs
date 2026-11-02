/**
 * Accessibility layer of the family homework page: the markup pass that runs on every generated
 * page and the small stylesheet of a11y-only rules (focus ring, forced colors, reduced motion).
 * Gate: `npm run validate:family-a11y` (tools/verify-family-a11y.mjs).
 *
 * This module owns ARIA and state styling, never the look of the page: it must not set a colour,
 * size or layout that a designer would call a visual decision.
 */

// One pictograph, with its variation selector, skin tone and ZWJ joins: a "word" of emoji.
const PICTOGRAPH =
  "\\p{Extended_Pictographic}(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])?)*";
const EMOJI_RUN = new RegExp(PICTOGRAPH, "gu");
const HAS_EMOJI = new RegExp(PICTOGRAPH, "u");
const HAS_LETTER = /\p{L}/u;
// Controls and headings whose accessible name is read aloud: an emoji in it is read as
// "speaker high volume" or "light bulb", which is noise at best and wrong at worst.
const NAMED = /<(h[1-6]|button|summary|label|a)\b([^>]*)>([\s\S]*?)<\/\1>/g;

/** Wrap each emoji in a text node in an aria-hidden span; leave tags and attributes alone. */
export function hideEmojiInText(inner) {
  return inner.replace(
    /(^|>)([^<]+)/g,
    (_whole, lead, text) =>
      lead + text.replace(EMOJI_RUN, (emoji) => `<span aria-hidden="true">${emoji}</span>`),
  );
}

/**
 * Pictographs in headings and control labels are decoration. A control whose ONLY content is an
 * emoji keeps it (it must carry its own aria-label, which tools/verify-family-a11y.mjs checks).
 */
export function hideDecorativeEmoji(html) {
  return html
    .split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(NAMED, (whole, tag, attrs, inner) =>
            HAS_LETTER.test(inner.replace(/<[^>]*>/g, "")) && HAS_EMOJI.test(inner)
              ? `<${tag}${attrs}>${hideEmojiInText(inner)}</${tag}>`
              : whole,
          ),
    )
    .join("");
}

// "English text / Texto en español" in one attribute is read aloud as both languages. A pair is
// split when the right half is the left half again or carries Spanish (an accent, an inverted
// mark, or a common Spanish word); "Part / Whole" style labels are left alone.
const SPANISH_HALF =
  /[áéíóúñ¿¡]|\b(el|la|los|las|de|del|para|tu|tus|un|una|y|en|con|fila|respuesta|escuchar|cerrar|idioma|problemas|cerrar|ampliada|ampliar|abrir|cuaderno|ayuda|inicio|volver|siguiente|atrás|opcional|tarjeta|navegación)\b/i;
// A start tag, skipping quoted values that may themselves contain > or <.
const TAG_START =
  /<[a-zA-Z][^\s>]*(?:\s+[^\s=>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?)*\s*\/?>/g;
const PAIR_ATTRS = { "aria-label": "aria", title: "title", placeholder: "placeholder" };
const attrRe = (name) => new RegExp(`\\s${name}="([^"]*)"`);

/** `aria-label="A / B"` becomes the current language's label plus data-<kind>-en/-es for the switcher. */
export function splitBilingualAttributes(html) {
  return html
    .split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(TAG_START, (tag) => {
            let out = tag;
            for (const [attr, kind] of Object.entries(PAIR_ATTRS)) {
              const m = out.match(attrRe(attr));
              if (!m || out.includes(`data-${kind}-en=`)) continue;
              const halves = m[1].split(" / ");
              if (halves.length !== 2) continue;
              const [en, es] = halves.map((h) => h.trim());
              if (!en || !es) continue;
              if (en === es) out = out.replace(m[0], ` ${attr}="${en}"`);
              else if (SPANISH_HALF.test(es))
                out = out.replace(
                  m[0],
                  ` ${attr}="${en}" data-${kind}-en="${en}" data-${kind}-es="${es}"`,
                );
            }
            return out;
          }),
    )
    .join("");
}

/** The markup pass, in one place so the generator calls a single function. */
export const a11yMarkup = (html) => splitBilingualAttributes(hideDecorativeEmoji(html));

export const A11Y_CSS = `
/* ===== Accessibility states (scripts/lib/homework-a11y.mjs) ===== */
/* Controls that act through the delegated listener must be "clickable" for iOS Safari. */
[data-act]:not(:disabled):not(input):not(select):not(textarea) { cursor: pointer; }

/* A flashcard prompt is a real button now; it keeps the look of the text it replaced. */
button.flip-prompt, button.flip-back-prompt {
  background: none; border: 0; padding: 0; margin: 0; font: inherit; color: inherit;
  text-align: inherit; width: 100%;
}

/* Targets: a thumb needs 44px; WCAG 2.5.8 floors it at 24px. Inline words (.obj-term) and
   flashcard faces keep their line; every other control is at least 44 by 44. */
:where(button, summary, select, input[type="range"], [role="button"]:not(svg *), .btn, .lang-toggle-btn):not(.obj-term):not(.obj-term-glue) {
  min-block-size: 44px;
  min-inline-size: 44px;
}

/* Spanish text inherits the colour of the surface it sits on, like the English beside it; a fixed
   ink colour went dark-on-navy in the hero and the case-file kicker (2.1:1 and 1.2:1). */
.lang-es { color: inherit; }
/* A vocabulary word inside a dark table header keeps the header's colour. */
thead .obj-term, th .obj-term { color: inherit !important; background: transparent !important; }
/* Small print stays readable: nothing a family must read sits under 13px. */
.hw-route-copy small { font-size: max(13px, 0.83em); }
.checkbox-label { min-block-size: 44px; display: flex; align-items: center; gap: 8px; }

/* WCAG 2.4.11: a focused control is never hidden under the fixed top or bottom bars. */
html { scroll-padding-block: 80px 96px; }

/* Visible focus on every control, on light and dark surfaces: the design system's ring (dark with a light halo, light on dark mode). */
:where(a[href], button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: var(--fm-focus-width, 3px) solid var(--fm-focus, #17324d) !important;
  outline-offset: var(--fm-focus-offset, 2px) !important;
  box-shadow: 0 0 0 var(--fm-focus-offset, 2px) var(--fm-focus-halo, #ffffff) !important;
  transition: none !important;
}

@media (forced-colors: active) {
  /* Backgrounds are removed in forced colors, so an edge-less control disappears. The id-sized
     :not() lifts this above any single class or id rule that set border: none. */
  :is(button, summary, select, textarea, [role="button"], .btn,
    input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"])):not(.obj-term):not(#a11y-forced) {
    border: 1px solid ButtonText !important;
  }
  :where(a[href], button, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: 3px solid Highlight !important;
    box-shadow: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0s !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
}
`;

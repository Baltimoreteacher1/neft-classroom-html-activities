// Negative controls for the family accessibility probes: each probe is run on a page seeded
// with exactly its defect (it must report it) and on a clean twin (it must stay silent) BEFORE
// the real pages are swept. A probe that has stopped firing and a probe watching a clean page
// print the same thing, so the gate proves it can fail first.
import {
  BILINGUAL_ATTRIBUTES,
  DUPLICATE_IDS,
  FOCUS_RING,
  FORCED_COLORS,
  HEADING_EMOJI,
  HEADING_OUTLINE,
  INACTIVE_LANGUAGE,
  LIVE_REGIONS,
  NON_POINTER_ALTERNATIVES,
  REDUCED_MOTION,
  REFLOW,
  SIZES,
  SKIP_AND_LANDMARKS,
  UNNAMED_CONTROLS,
} from "./family-a11y-probe.mjs";

const page = (body, head = "", bodyClass = "lang-mode-en") =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title><style>body{font-size:16px;margin:0}${head}</style></head><body class="${bodyClass}">${body}</body></html>`;

const CASES = [
  {
    name: "unnamed control (emoji only)",
    probe: UNNAMED_CONTROLS,
    bad: page('<main><button type="button">🔊</button></main>'),
    good: page('<main><button type="button" aria-label="Listen">🔊</button></main>'),
  },
  {
    name: "emoji read aloud in a control name",
    probe: UNNAMED_CONTROLS,
    bad: page('<main><button type="button">🔊 Listen</button></main>'),
    good: page(
      '<main><button type="button"><span aria-hidden="true">🔊</span> Listen</button></main>',
    ),
  },
  {
    name: "duplicate id",
    probe: DUPLICATE_IDS,
    bad: page('<p id="a">x</p><p id="a">y</p>'),
    good: page('<p id="a">x</p><p id="b">y</p>'),
  },
  {
    name: "heading jumps a level",
    probe: HEADING_OUTLINE,
    bad: page("<h1>One</h1><h3>Three</h3>"),
    good: page("<h1>One</h1><h2>Two</h2><h3>Three</h3>"),
  },
  {
    name: "two h1 headings",
    probe: HEADING_OUTLINE,
    bad: page("<h1>One</h1><h1>Again</h1>"),
    good: page("<h1>One</h1>"),
  },
  {
    name: "heading exposes both languages",
    probe: HEADING_OUTLINE,
    bad: page(
      '<h1><span class="lang-en">Hello</span><span class="lang-es" lang="es">Hola</span></h1>',
    ),
    good: page(
      '<h1><span class="lang-en">Hello</span><span class="lang-es" lang="es">Hola</span></h1>',
      "body.lang-mode-en .lang-es{display:none}",
    ),
  },
  {
    name: "heading reads an emoji aloud",
    probe: HEADING_EMOJI,
    bad: page("<h1>Hello</h1><h2>🎯 Goal</h2>"),
    good: page('<h1>Hello</h1><h2><span aria-hidden="true">🎯</span> Goal</h2>'),
  },
  {
    name: "inactive language only visually hidden",
    probe: INACTIVE_LANGUAGE,
    bad: page(
      '<p class="lang-en">Hello</p><p class="lang-es" lang="es">Hola</p>',
      ".lang-es{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}",
    ),
    good: page(
      '<p class="lang-en">Hello</p><p class="lang-es" lang="es">Hola</p>',
      "body.lang-mode-en .lang-es{display:none}",
    ),
  },
  {
    name: "html lang disagrees with the visible language",
    probe: INACTIVE_LANGUAGE,
    bad: page(
      '<p class="lang-es" lang="es">Hola</p>',
      "body.lang-mode-es .lang-en{display:none}",
      "lang-mode-es",
    ),
    good: page(
      '<p class="lang-es" lang="es">Hola</p>',
      "body.lang-mode-es .lang-en{display:none}",
      "lang-mode-es",
    ).replace('<html lang="en">', '<html lang="es">'),
  },
  {
    name: "label carries both languages",
    probe: BILINGUAL_ATTRIBUTES,
    bad: page('<button type="button" aria-label="Close / Cerrar">x</button>'),
    good: page('<button type="button" aria-label="Close">x</button>'),
  },
  {
    name: "no skip link",
    probe: SKIP_AND_LANDMARKS,
    bad: page('<header>h</header><main id="m"><button>go</button></main><footer>f</footer>'),
    good: page(
      '<a class="hw-skip" href="#m">Skip</a><header>h</header><main id="m"><button>go</button></main><footer>f</footer>',
    ),
  },
  {
    name: "text under 13px",
    probe: SIZES,
    bad: page("<main><p style='font-size:10px'>tiny words</p></main>"),
    good: page("<main><p style='font-size:14px'>fine words</p></main>"),
  },
  {
    name: "tap target under 44px",
    probe: SIZES,
    bad: page("<main><button style='width:30px;height:30px'>go</button></main>"),
    good: page("<main><button style='width:48px;height:48px'>go</button></main>"),
  },
  {
    name: "no polite live region",
    probe: LIVE_REGIONS,
    bad: page("<main><p id='progress_text'>1 / 4</p></main>"),
    good: page("<main><p id='progress_text' role='status'>1 / 4</p></main>"),
  },
  {
    name: "assertive feedback",
    probe: LIVE_REGIONS,
    bad: page("<main><p role='status'>ok</p><p aria-live='assertive' id='x'>no</p></main>"),
    good: page("<main><p role='status'>ok</p></main>"),
  },
  {
    name: "drag without a tap alternative",
    probe: NON_POINTER_ALTERNATIVES,
    bad: page("<main><section><div draggable='true' class='card'>a</div></section></main>"),
    good: page(
      "<main><section><div draggable='true' class='card'>a</div><select><option>Move</option></select></section></main>",
    ),
  },
  {
    name: "canvas without a label",
    probe: NON_POINTER_ALTERNATIVES,
    bad: page("<main><canvas width='40' height='40'></canvas></main>"),
    good: page("<main><canvas width='40' height='40' aria-label='Scratch pad'></canvas></main>"),
  },
  {
    name: "reflow: horizontal scroll",
    probe: REFLOW,
    bad: page("<main><div style='width:900px;height:20px;background:#ccc'></div></main>"),
    good: page("<main><div style='max-width:100%;height:20px;background:#ccc'></div></main>"),
    viewport: { width: 320, height: 480 },
  },
  {
    name: "animation runs under reduced motion",
    probe: REDUCED_MOTION,
    bad: page(
      "<main><div class='spin'>x</div></main>",
      "@keyframes s{to{transform:rotate(1turn)}}.spin{animation:s 1s linear infinite;width:20px;height:20px}",
    ),
    good: page("<main><div>x</div></main>"),
  },
  {
    name: "focus ring removed",
    probe: FOCUS_RING,
    arg: 5,
    bad: page(
      "<main><button>go</button></main>",
      "button:focus,button:focus-visible{outline:none;box-shadow:none}",
    ),
    good: page(
      "<main><button>go</button></main>",
      "button:focus-visible{outline:3px solid #17324d;outline-offset:2px}",
    ),
  },
  {
    name: "control without an edge in forced colors",
    probe: FORCED_COLORS,
    bad: page("<main><button style='border:0'>go</button></main>"),
    good: page("<main><button style='border:1px solid ButtonText'>go</button></main>"),
  },
];

/** Returns the names of cases that did not behave (empty means every probe can fail and pass). */
export async function selfTest(browser) {
  const broken = [];
  for (const c of CASES) {
    const ctx = await browser.newContext({ viewport: c.viewport || { width: 390, height: 800 } });
    const p = await ctx.newPage();
    await p.setContent(c.bad);
    const hit = await p.evaluate(c.probe, c.arg);
    await p.setContent(c.good);
    const clean = await p.evaluate(c.probe, c.arg);
    if (!hit.length) broken.push(`${c.name}: did not report its seeded defect`);
    if (clean.length) broken.push(`${c.name}: reported the clean twin (${clean[0]})`);
    await ctx.close();
  }
  return { cases: CASES.length, broken };
}

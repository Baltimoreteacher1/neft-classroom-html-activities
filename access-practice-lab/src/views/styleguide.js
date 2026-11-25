// Scaffold Studio style guide (/styleguide): every token and every component, in every documented state, in the three
// themes. It is a reference for authors and reviewers and the target of the visual-regression and axe checks
// (tools/verify-scaffold-browser.mjs). Nothing here reads or writes a student's saved work.
import { BASE, esc, html, raw } from "../util.js";
import { GROW_PARTS } from "../scaffold/grow.js";
import { STEPS } from "../scaffold/fading.js";
import {
  chunkOverlayHTML,
  exportDialogHTML,
  frameTrayHTML,
  growSentenceHTML,
  progressRingHTML,
  rehearsalHTML,
  supportDialHTML,
  wordButtonHTML,
  wordPopoverHTML,
} from "../scaffold/components.js";

const THEMES = [["light", "Light"], ["dark", "Dark"], ["hc", "High contrast"]];
const FONTS = [["default", "Lab default"], ["easy", "Easy read (Atkinson Hyperlegible)"]];
const COLOR_TOKENS = ["bg", "surface", "surface-2", "ink", "ink-2", "ink-3", "line", "line-strong", "brand", "on-brand", "accent", "gold", "ok", "err", "focus"];
const ROLES = ["who", "did", "where", "when", "how", "why", "what"];
const SPACING = ["s1", "s2", "s3", "s4", "s5", "s6"];
const TEXT = [["xs", "Aa 13px"], ["sm", "Aa 15px"], ["md", "Aa 17px body"], ["lg", "Aa 20px"], ["xl", "Aa 25px"]];

let S = { theme: "light", font: "default", grow: { where: "in the lab" }, pop: "" };
let pilot = null;
async function load() {
  pilot ||= fetch(`${BASE}/content/scaffold/pilot.json`, { cache: "no-cache" }).then((r) => {
    if (!r.ok) throw new Error(`pilot.json HTTP ${r.status}`);
    return r.json();
  });
  return pilot;
}
const pick = (set, type) => set.supports.filter((s) => s.type === type);

const spec = (name, title, note, body) =>
  html`<section class="ss-card ssg-spec" data-ss-spec="${name}" aria-labelledby="ssg-${name}"><h3 id="ssg-${name}">${title}</h3><p class="ss-meta">${note}</p>${raw(body)}</section>`;

export async function render(ctx) {
  const lang = ctx.prefs?.lang === "es" ? "es" : "en";
  const data = await load();
  const g35 = data.sets.find((s) => s.band === "3-5");
  const g68 = data.sets.find((s) => s.band === "6-8");
  const word = pick(g35, "word")[0];
  const teacherWord = JSON.parse(JSON.stringify(word));
  const hiddenWord = JSON.parse(JSON.stringify(word));
  const approved = JSON.parse(JSON.stringify(word));
  approved.glosses.es.review = { status: "approved", machineDrafted: false, reviewedBy: "(style guide sample)" };
  hiddenWord.glosses.es.review = { status: "draft", machineDrafted: true };
  const frame = pick(g35, "frame")[0];
  const base = "The scientist measured the plant.";

  const themeRadios = THEMES.map(([v, l]) => `<label><input type="radio" name="ssg-theme" value="${v}"${S.theme === v ? " checked" : ""} /> ${esc(l)}</label>`).join(" ");
  const fontRadios = FONTS.map(([v, l]) => `<label><input type="radio" name="ssg-font" value="${v}"${S.font === v ? " checked" : ""} /> ${esc(l)}</label>`).join(" ");

  const swatches = COLOR_TOKENS.map((t) => `<li class="ssg-sw"><i style="background:var(--ss-${t})"></i><code>--ss-${t}</code></li>`).join("");
  const roleSw = ROLES.map((r) => `<li class="ssg-sw"><i style="background:var(--ss-${r}-bg);border:2px solid var(--ss-${r}-ink)"></i><code>${r}</code></li>`).join("");
  const spacing = SPACING.map((s) => `<li class="ssg-sp"><i style="inline-size:var(--ss-${s})"></i><code>--ss-${s}</code></li>`).join("");
  const type = TEXT.map(([k, l]) => `<li style="font-size:var(--ss-text-${k})">${esc(l)}</li>`).join("");

  const passage = `${wordButtonHTML("roots", word.id)} grow down into the soil. The ${wordButtonHTML("stem", "x")} holds the plant up.`;

  return {
    title: "Scaffold Studio style guide",
    html: html`<div class="ss-root ssg" data-ss-theme="${S.theme}" data-ss-font="${S.font}" id="ssg-root">
      <header class="ss-card">
        <h1>Scaffold Studio style guide</h1>
        <p class="ss-text">Tokens and components for the support layer. Pick a theme and a reading face; every sample below follows. Reading faces reuse the lab's self-hosted Atkinson Hyperlegible, and the lab's own Reading comfort panel (press C) still controls size and spacing.</p>
        <fieldset class="ssg-switch"><legend>Theme</legend>${raw(themeRadios)}</fieldset>
        <fieldset class="ssg-switch"><legend>Reading face</legend>${raw(fontRadios)}</fieldset>
      </header>

      <section class="ss-card" data-ss-spec="tokens" aria-labelledby="ssg-tokens"><h2 id="ssg-tokens">Tokens</h2>
        <h3>Color</h3><ul class="ssg-grid">${raw(swatches)}</ul>
        <h3>Sentence chunk roles (colour plus a label word plus a border style)</h3><ul class="ssg-grid">${raw(roleSw)}</ul>
        <h3>Type scale</h3><ul class="ssg-type">${raw(type)}</ul>
        <h3>Spacing</h3><ul class="ssg-grid">${raw(spacing)}</ul>
        <h3>Radius, elevation, motion</h3>
        <p class="ss-meta">Radius 6, 10, 14px. Elevation: <code>--ss-shadow-1</code> for cards, <code>--ss-shadow-2</code> for popovers only. Motion: 120ms and 220ms, always off under reduced motion or Calm motion.</p>
      </section>

      <h2>Components</h2>
      ${spec("word-popover", "Word popover", "Student view with an approved Spanish gloss; teacher view, where a draft gloss is shown and labelled; student view where the gloss is not yet approved, so it is hidden.", `<p class="ss-text">${passage}</p><div class="ssg-row"><div>${wordPopoverHTML(approved, { home: "es", audience: "student", lang })}</div><div>${wordPopoverHTML(teacherWord, { home: "es", audience: "teacher", lang })}</div><div>${wordPopoverHTML(hiddenWord, { home: "es", audience: "student", lang })}</div></div>`)}
      ${spec("chunk-overlay", "Sentence chunk overlay", "Grades 3-5 and grades 6-8 samples. Each chunk names its role in words.", `${chunkOverlayHTML(pick(g35, "chunk")[0], { lang })}<br />${chunkOverlayHTML(pick(g68, "chunk")[0], { lang })}`)}
      ${spec("frame-tray", "Frame tray", "The same frame at each fading step.", STEPS.map((s) => frameTrayHTML(frame, s, { lang })).join(""))}
      ${spec("grow-sentence", "Grow-a-sentence builder", "Live view: the sentence grows as parts are added.", `${growSentenceHTML(base, S.grow, { lang })}<p class="ss-meta">Press a part to add a sample (${GROW_PARTS.join(", ")}).</p>`)}
      ${spec("rehearsal", "Rehearsal recorder", "Model, repeat, own version. Then the recording state and the private no-score mode.", `${rehearsalHTML("model", { lang })}<br />${rehearsalHTML("repeat", { lang, recording: true })}<br />${rehearsalHTML("own", { lang, privateMode: true })}`)}
      ${spec("support-dial", "Support dial", "Four steps and a no-penalty help button. Shown at two steps.", `${supportDialHTML("full", { lang, name: "ssg-dial-a" })}<br />${supportDialHTML("hint", { lang, name: "ssg-dial-b" })}`)}
      ${spec("progress-ring", "Progress ring", "Counts in words, never a percentage.", `${progressRingHTML(0, 5, "Words I know", { lang })}<br />${progressRingHTML(3, 5, "Words I know", { lang })}<br />${progressRingHTML(5, 5, "Words I know", { lang })}`)}
      ${spec("export-dialog", "Teacher export dialog", "With data, and with none recorded yet.", `${exportDialogHTML({ lang })}<br />${exportDialogHTML({ lang, hasData: false })}`)}
    </div>`,
  };
}

const SAMPLE = { where: "in the lab", when: "on Monday", how: "carefully", why: "because she needed data" };
export function onChange(e, ctx) {
  const t = e.target;
  if (t.name === "ssg-theme" && THEMES.some(([v]) => v === t.value)) (S.theme = t.value), ctx.rerender();
  else if (t.name === "ssg-font" && FONTS.some(([v]) => v === t.value)) (S.font = t.value), ctx.rerender();
  else return false;
  return true;
}
export function onClick(e, ctx) {
  const g = e.target.closest("[data-ss-grow]");
  if (g) {
    const p = g.dataset.ssGrow;
    S.grow = { ...S.grow, [p]: S.grow[p] ? "" : SAMPLE[p] };
    ctx.rerender();
    return true;
  }
  return false;
}
export const onInput = onChange;

// Scaffold Studio in use (/supports): the student's support dial, a pilot reading with tap-a-word, sentence chunks,
// ask-the-passage, a writing frame with feedback, say-it-first rehearsal, and "supports I'm growing out of".
// The teacher section exports independence evidence. It is a preview until content/scaffold/release.json
// `studentRelease` is true; a teacher (or ?scaffold=preview) always sees it. Everything stays on this device.
import { BASE, announce, esc, html, raw, storage } from "../util.js";
import { writingFeedback } from "../scaffold/writing.js";
import { chunkOverlayHTML, frameTrayHTML, growSentenceHTML, progressRingHTML, rehearsalHTML, supportDialHTML, wordButtonHTML, exportDialogHTML } from "../scaffold/components.js";
import { STEPS } from "../scaffold/fading.js";
import { attach, layerOn, loadRelease } from "../scaffold/runtime.js";
import * as P from "../scaffold/profile.js";

let data = null;
let release = { studentRelease: false };
let detach = null;
let S = { band: "3-5", writing: "", grow: {}, teacher: false };

async function load() {
  data ||= fetch(`${BASE}/content/scaffold/pilot.json`, { cache: "no-cache" }).then((r) => r.json());
  release = await loadRelease();
  return data;
}
const of = (set, type) => set.supports.filter((s) => s.type === type);
const sentenceSpans = (sents) => sents.map((s, i) => `<span data-ss-sent="${i}">${s}</span>`).join(" ");

export async function render(ctx) {
  const lang = ctx.prefs?.lang === "es" ? "es" : "en";
  const preview = new URLSearchParams(location.search).get("scaffold") === "preview";
  const d = await load();
  const audience = S.teacher ? "teacher" : "student";
  if (!layerOn({ release, audience, preview }))
    return { title: "Supports", html: html`<main class="ss-root ssg"><section class="ss-card"><h1>${lang === "es" ? "Apoyos" : "Supports"}</h1><p class="ss-text">${lang === "es" ? "Esta función aún no está disponible para estudiantes." : "This feature is not open to students yet."}</p><p><label><input type="checkbox" data-ss-teacher ${S.teacher ? "checked" : ""}/> ${lang === "es" ? "Soy maestro" : "I am a teacher"}</label></p></section></main>` };
  const set = d.sets.find((s) => s.band === S.band) || d.sets[0];
  const profile = P.load(storage);
  const step = STEPS.includes(profile.dial) ? profile.dial : "full";
  const words = of(set, "word");
  const chunks = of(set, "chunk");
  const frame = of(set, "frame")[0];
  const sents = chunks.map((c) => c.sentence);
  const passageHTML = sentenceSpans(sents.map((s) => s.replace(new RegExp(`\\b(${words.map((w) => w.term).join("|")})\\b`, "i"), (m) => `${wordButtonHTML(m, words.find((w) => w.term.toLowerCase() === m.toLowerCase()).id)}`)));
  const fb = writingFeedback(S.writing, { keyWords: words.map((w) => w.term) });
  const row = (o) => `<li>${esc(lang === "es" ? o.es : o.en)}</li>`;
  const out = P.outgrown(profile, set.domain);
  const rows = P.evidenceRows(profile);
  return {
    title: "Supports",
    html: html`<main class="ss-root ssg" data-ss-theme="light" id="ss-main">
      <header class="ss-card"><h1>${lang === "es" ? "Mis apoyos" : "My supports"}</h1>
        <p class="ss-text">${lang === "es" ? "Elige cuánta ayuda quieres. Siempre puedes pedir más." : "Choose how much help you want. You can always ask for more."}</p>
        <p><label>${lang === "es" ? "Grados" : "Grades"} <select data-ss-band><option value="3-5"${S.band === "3-5" ? " selected" : ""}>3-5</option><option value="6-8"${S.band === "6-8" ? " selected" : ""}>6-8</option></select></label>
        <label><input type="checkbox" data-ss-teacher ${S.teacher ? "checked" : ""}/> ${lang === "es" ? "Vista de maestro" : "Teacher view"}</label></p>
        ${raw(supportDialHTML(step, { lang }))}
        ${raw(progressRingHTML(out.length, Math.max(out.length, 3), lang === "es" ? "Apoyos que ya no necesito" : "Supports I am growing out of", { lang }))}
      </header>
      <section class="ss-card"><h2>${lang === "es" ? "Antes de leer" : "Before you read"}</h2><p class="ss-text">${esc(of(set, "briefing")[0].bigIdea[lang] || of(set, "briefing")[0].bigIdea.en)}</p></section>
      <section class="ss-card"><h2>${lang === "es" ? "Lee" : "Read"}</h2>
        <p class="ss-text" data-ss-passage>${raw(passageHTML)}</p><div data-ss-pop-host aria-live="polite"></div>
        <p class="ss-meta">${lang === "es" ? "Toca una palabra subrayada para ver su significado." : "Tap an underlined word to see what it means."}</p></section>
      ${step !== "none" ? html`<section class="ss-card"><h2>${lang === "es" ? "Mira cómo se arma una oración" : "See how a sentence is built"}</h2>${raw(chunks.map((c) => chunkOverlayHTML(c, { lang })).join(""))}</section>` : ""}
      <section class="ss-card"><h2>${lang === "es" ? "Pregunta a la lectura" : "Ask the passage"}</h2>
        <p><label>${lang === "es" ? "Tu pregunta" : "Your question"} <input type="text" data-ss-question maxlength="120" /></label> <button type="button" class="ss-btn" data-ss-ask>${lang === "es" ? "Buscar" : "Find it"}</button></p>
        <p class="ss-text" data-ss-answer aria-live="polite"></p></section>
      <section class="ss-card"><h2>${lang === "es" ? "Escribe" : "Write"}</h2>
        ${frame ? raw(frameTrayHTML(frame, step, { lang })) : ""}
        <p><label>${lang === "es" ? "Tu escritura" : "Your writing"}<textarea data-ss-write rows="4" maxlength="600" style="inline-size:100%">${esc(S.writing)}</textarea></label></p>
        ${fb.empty ? "" : html`<div aria-live="polite"><h3>${lang === "es" ? "Lo que ya funciona" : "What is working"}</h3><ul>${raw(fb.working.map(row).join("") || `<li>${lang === "es" ? "Sigue escribiendo." : "Keep writing."}</li>`)}</ul><h3>${lang === "es" ? "Próximo paso" : "Next step"}</h3><ul>${raw(fb.next.map(row).join(""))}</ul><h3>${lang === "es" ? "Por qué ayuda" : "Why it helps"}</h3><ul>${raw(fb.why.map(row).join(""))}</ul><p class="ss-meta">${esc(fb.limit[lang])}</p></div>`}
        ${raw(growSentenceHTML("The scientist measured the plant.", S.grow, { lang }))}</section>
      <section class="ss-card"><h2>${lang === "es" ? "Dilo primero" : "Say it first"}</h2>${raw(rehearsalHTML("own", { lang, privateMode: true }))}<audio data-ss-playback controls hidden></audio></section>
      <section class="ss-card"><p><button type="button" class="ss-btn is-primary" data-ss-done>${lang === "es" ? "Terminé esta actividad" : "I finished this activity"}</button></p>
        <h2>${lang === "es" ? "Apoyos que ya no necesito" : "Supports I am growing out of"}</h2>
        <p class="ss-text">${out.length ? esc(out.join(", ")) : lang === "es" ? "Todavía no hay. Sigue practicando." : "None yet. Keep practicing."}</p></section>
      ${S.teacher ? html`<section class="ss-card"><h2>${lang === "es" ? "Evidencia para el maestro" : "Teacher evidence"}</h2>${raw(exportDialogHTML({ lang, hasData: rows.length > 0 }))}
        <p class="ss-meta">${lang === "es" ? "El nivel WIDA que elijas solo sirve para planear. Esta herramienta no lo calcula." : "Any WIDA level you choose is for planning only. This tool never estimates one."}</p></section>` : ""}
    </main>`,
    _lang: lang,
  };
}

function download(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function mount(root, ctx) {
  detach?.();
  const main = root.querySelector("#ss-main");
  if (!main) return;
  const lang = ctx.prefs?.lang === "es" ? "es" : "en";
  data.then((d) => {
    const set = d.sets.find((s) => s.band === S.band) || d.sets[0];
    const words = Object.fromEntries(of(set, "word").map((w) => [w.id, w]));
    const passage = of(set, "chunk").map((c) => c.sentence).join(" ");
    detach = attach(main, { words, passage, unit: set.unit, domain: set.domain, lang, home: lang === "es" ? "es" : "", audience: S.teacher ? "teacher" : "student", store: storage, announce: (m) => announce(m, { toast: false }), rerender: () => ctx.rerender(), privateMode: true, showImage: S.band === "3-5" });
  });
}

export function onClick(e, ctx) {
  const ex = e.target.closest("[data-ss-export]");
  if (ex) {
    const p = P.load(storage);
    const stamp = new Date().toISOString().slice(0, 10);
    if (ex.dataset.ssExport === "csv") download(`independence-evidence-${stamp}.csv`, P.toCsv(P.evidenceRows(p)), "text/csv");
    else download(`independence-evidence-${stamp}.json`, P.toJson(p, { generatedAt: stamp }), "application/json");
    return true;
  }
  const g = e.target.closest("[data-ss-grow]");
  if (g) { const k = g.dataset.ssGrow; const SAMPLE = { where: "in the lab", when: "on Monday", how: "carefully", why: "because she needed data" }; S.grow = { ...S.grow, [k]: S.grow[k] ? "" : SAMPLE[k] }; ctx.rerender(); return true; }
  return false;
}
export function onChange(e, ctx) {
  const t = e.target;
  if (t.matches("[data-ss-band]")) return (S.band = t.value), ctx.rerender(), true;
  if (t.matches("[data-ss-teacher]")) return (S.teacher = t.checked), ctx.rerender(), true;
  return false;
}
export function onInput(e, ctx) {
  if (e.target.matches("[data-ss-write]")) {
    S.writing = e.target.value;
    // re-render only the feedback region on a pause, so typing never loses focus
    clearTimeout(onInput.t);
    onInput.t = setTimeout(() => { const pos = e.target.selectionStart; ctx.rerender(); requestAnimationFrame(() => { const w = document.querySelector("[data-ss-write]"); w?.focus(); w?.setSelectionRange(pos, pos); }); }, 700);
    return true;
  }
  return false;
}

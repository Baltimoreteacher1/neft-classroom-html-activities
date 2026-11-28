// Language Labs (/language-labs, /language-labs/<lab>?step=1..5): Verb Time Machine, Connector Bridge and Paragraph
// X-Ray on one five-step path (See it → Explore → Example → Practice → New task), plus the publisher-edition hub
// for Grades 3–5 (Language Explorers Studio) and Grades 6–8 (Academic Discourse & Craft Lab) that also links the
// three scaffold builders. Content: src/content/language-labs.js; checks: src/lang/labs-check.js; the three lab
// bodies live in src/labs/ (verb-lab.js, bridge-lab.js, xray-lab.js) with shared pieces in src/labs/kit.js. This
// file owns state, routing, the events every lab shares (read-aloud, discovery, keys, the new-task writing check)
// and the ledger: every practice check and transfer check is a ledger entry (src "labs"): independent unless a hint
// was opened, first vs revision, so the evidence reaches My Growth like the other studios. No timers, no scores.
import { openInBookStudio } from "../book/handoff.js";
import { crumbsHTML } from "../components.js";
import * as C from "../content/language-labs.js";
import { i18nFor } from "../i18n.js";
import * as bridge from "../labs/bridge-lab.js";
import { premiumHubHTML } from "../labs/hub-premium.js";
import { bandOf, dimPill, labHref, nextLink, resumeNote, stepperHTML, usePill } from "../labs/kit.js";
import * as verb from "../labs/verb-lab.js";
import * as xray from "../labs/xray-lab.js";
import * as K from "../lang/labs-check.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { canSpeak, speak } from "../speech.js";
import { BASE, announce, ensureStylesheet, html, icon, safeJson, storage, wordCount } from "../util.js";

export { composeVerb } from "../labs/verb-model.js";

const KEY = "accessPracticeLab:v1:language-labs";
const LABS = { "verb-time-machine": verb, "connector-bridge": bridge, "paragraph-xray": xray };
const load = () => safeJson(storage.get(KEY), {}) || {};
const save = (st) => storage.set(KEY, JSON.stringify(st));
const labState = (st, lab, band) => {
  st[lab] ||= {};
  st[lab][band] ||= {
    seen: [],
    practice: {},
    transfer: { text: "", ok: false, checks: 0, hint: false, topic: 0 },
    explore: {},
    guided: 0,
  };
  return st[lab][band];
};
// Transient screen state (not stored): lens, drag order, picked card, Break it, the open Keys panel.
let ui = { lab: "", labels: {}, order: null, dimFilter: "all", keys: false };

function record(ctx, { lab, task, ok, kind, supported, use, extra = {} }) {
  const ledger = loadLedger();
  appendEntry(ledger, {
    src: "labs",
    task,
    band: bandOf(ctx.band),
    domain: "Writing",
    use,
    stage: supported ? "supported" : "independent",
    kind,
    supports: { hint: !!supported },
    m: { ok: ok ? 1 : 0, lab, ...extra },
  });
  saveLedger(ledger);
}

/** Step from ?step=, else where the learner stopped last time, else 1. */
function stepOf(ls) {
  const q = new URLSearchParams(location.search).get("step");
  return Math.min(5, Math.max(1, Number(q) || (q ? 1 : ls.resume) || 1));
}

/** What a lab module needs for one render or event: language, band, saved state and the save/rerender helpers. */
function makeEnv(ctx) {
  const lab = ctx.route.id;
  const band = bandOf(ctx.band);
  const st = load();
  const ls = labState(st, lab, band);
  return {
    ctx,
    I: i18nFor(ctx),
    lab,
    band,
    ls,
    ui,
    step: stepOf(ls),
    save: () => save(st),
    done: () => (save(st), ctx.rerender(), true),
    record: (r) => record(ctx, { lab, ...r }),
  };
}

const sayAloud = (I, text) => {
  if (!canSpeak()) {
    announce(I.S("Audio is not available on this device. Read the sentence out loud instead.", "El audio no está disponible en este dispositivo. Lee la oración en voz alta."));
    return;
  }
  speak(text, { lang: "en-US" });
};

// ── render ───────────────────────────────────────────────────────────────────
export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = bandOf(ctx.band);
  const lab = ctx.route.id || "";
  const def = C.LABS.find((l) => l.id === lab && l.here);
  if (ui.lab !== lab) ui = { lab, labels: {}, order: null, dimFilter: ui.dimFilter || "all", keys: false };
  if (!def) {
    const st = load();
    // The premium hub layer loads only on the hub (kept out of the shell's blocking CSS).
    await ensureStylesheet("language-labs-premium.css");
    await ensureStylesheet("language-labs-premium-sections.css");
    return {
      title: I.S("Language Labs", "Laboratorios de lenguaje"),
      html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language Labs", "Laboratorios de lenguaje"), null],
      ])}${premiumHubHTML(ctx, I, st, band, { dimFilter: ui.dimFilter })}`,
    };
  }
  // The lab stylesheet loads only on the three lab routes (skipped when index.html already links it).
  await ensureStylesheet("language-labs-lab.css");
  const env = makeEnv(ctx);
  const { ls, step } = env;
  const welcome = step === 1 ? resumeNote(I, lab, ls, band) : "";
  if (!ls.seen.includes(step)) ls.seen.push(step);
  if (step > 1) ls.resume = step;
  env.save();
  const m = LABS[lab];
  const body = m.render(env);
  const title = I.S(...def.title);
  const prog = C.programForLab(band);
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language Labs", "Laboratorios de lenguaje"), `${BASE}/language-labs?grades=${band}`],
        [title, null],
      ])}
      <article class="ll-lab" data-ll-lab="${lab}" data-ll-step="${step}" aria-labelledby="llTitle">
        <header class="ll-head">
          <div class="ll-head-badges">
            <span class="ll-band-pill">${I.T(...prog.grades)} · ${I.T(...prog.name)}</span>
            ${usePill(I, def.use)}
            ${dimPill(I, def.dimension)}
          </div>
          <p class="eyebrow">${I.T(...def.skill)}</p>
          <h1 id="llTitle" tabindex="-1">${title}</h1>
          <p class="lead">${I.T(...def.text)}</p>
          ${def.bandNote?.[band] ? html`<p class="fine">${icon("check")} ${I.T(...def.bandNote[band])}</p>` : ""}
        </header>
        ${welcome}
        ${stepperHTML(I, lab, step, ls, band, { keysOpen: ui.keys, labKeys: m.keys(step) })}${body}${nextLink(I, lab, step, band)}
        ${step === 5 && ls.transfer.ok ? html`<p class="ll-done">${icon("medal")} ${I.T("Lab complete. Try another lab, or come back and write about a new topic.", "Laboratorio completo. Prueba otro laboratorio o vuelve a escribir sobre un tema nuevo.")} <a href="${BASE}/language-labs?grades=${band}">${I.T("All labs", "Todos los laboratorios")}</a></p>` : ""}
      </article>`,
  };
}

/** Labs that draw with pointer gestures (the X-Ray order list) attach them after every render. */
export function mount(root, ctx) {
  const m = LABS[ctx.route.id];
  if (!m) return;
  fitStickyNav();
  if (!stickWired) {
    stickWired = true;
    window.addEventListener("resize", fitStickyNav);
  }
  m.mount?.(root, makeEnv(ctx));
}

// The step navigator sticks just under the site header, whatever height the header has at this width.
let stickWired = false;
function fitStickyNav() {
  const lab = document.querySelector(".ll-lab");
  const bar = document.querySelector(".lab-top");
  if (lab && bar) lab.style.setProperty("--ll-stick", `${Math.round(bar.getBoundingClientRect().height)}px`);
}

// ── events ───────────────────────────────────────────────────────────────────
export function onInput(e, ctx) {
  const t = e.target;
  const m = LABS[ctx.route.id];
  if (!m) return;
  const env = makeEnv(ctx);
  if (t.matches("[data-ll-transfer]")) {
    env.ls.transfer.text = t.value.slice(0, 4000);
    env.save();
    const wc = document.querySelector("[data-ll-wc]");
    if (wc) wc.textContent = String(wordCount(t.value));
  } else if (t.matches("[data-ll-answer]")) {
    (env.ls.practice[t.dataset.llAnswer] ||= {}).answer = t.value;
    env.save();
  } else m.input?.(t, env);
}

export function onChange(e, ctx) {
  const m = LABS[ctx.route.id];
  if (m) m.change?.(e.target, makeEnv(ctx));
}

const typing = (el) => !!el?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']");

export function onKey(e, ctx) {
  const m = LABS[ctx.route.id];
  if (!m) return;
  if (e.key === "Enter" && e.target.matches?.("[data-ll-answer]")) {
    e.preventDefault();
    document.querySelector(`[data-ll-check="${e.target.dataset.llAnswer}"]`)?.click();
    return;
  }
  if (e.altKey || e.ctrlKey || e.metaKey || typing(e.target) || document.querySelector("dialog[open]")) return;
  const env = makeEnv(ctx);
  if (m.key?.(e, env)) return;
  const k = e.key.toLowerCase();
  if (k === "[" || k === "]") {
    const to = Math.min(5, Math.max(1, env.step + (k === "]" ? 1 : -1)));
    if (to !== env.step) ctx.navigate(labHref(env.lab, to, env.band));
  } else if (k === "k") {
    ui.keys = !ui.keys;
    ctx.rerender();
  } else if (k === "l") {
    const main = document.querySelector("[data-ll-speak-main]") || document.querySelector(".ll-lab [data-ll-speak]");
    if (main) sayAloud(env.I, main.dataset.llSpeak);
  }
}

const templateFor = (lab, band) =>
  lab === "verb-time-machine" ? "personal-narrative" : lab === "connector-bridge" ? "cause-effect" : band === "6-8" ? "evidence-argument" : "informational-report";

export function onClick(e, ctx) {
  const t = e.target;
  const I = i18nFor(ctx);

  const speakEl = t.closest("[data-ll-speak]");
  if (speakEl) {
    sayAloud(I, speakEl.dataset.llSpeak);
    return true;
  }
  const dimBtn = t.closest("[data-ll-dim-filter]");
  if (dimBtn) {
    ui.dimFilter = dimBtn.dataset.llDimFilter || "all";
    ctx.rerender();
    return true;
  }
  const m = LABS[ctx.route.id];
  if (!m) return false;
  const env = makeEnv(ctx);
  const { ls, band, lab } = env;
  const done = () => env.done();

  if (t.closest("[data-ll-keys-toggle]")) {
    ui.keys = !ui.keys;
    ctx.rerender();
    return true;
  }
  const disc = t.closest("[data-ll-discover]");
  if (disc) {
    (ls.found ||= {})[Number(disc.dataset.llDiscover)] = true;
    announce(I.S("Discovery revealed below.", "Descubrimiento revelado abajo."), { toast: false });
    return done();
  }
  if (t.closest("[data-ll-guided]")) {
    ls.guided = (ls.guided || 1) + 1;
    env.save();
    ctx.rerender().then(() => {
      const last = [...document.querySelectorAll(".ll-guided-steps li")].at(-1);
      if (last) announce(last.textContent.trim(), { toast: false });
    });
    return true;
  }
  if (t.closest("[data-ll-guided-reset]")) {
    ls.guided = 1;
    return done();
  }
  const topicBtn = t.closest("[data-ll-topic]");
  if (topicBtn) {
    ls.transfer.topic = Number(topicBtn.dataset.llTopic);
    return done();
  }
  const insertBtn = t.closest("[data-ll-insert]");
  if (insertBtn) {
    const area = document.querySelector("[data-ll-transfer]");
    const cur = (area?.value ?? ls.transfer.text ?? "").trim();
    ls.transfer.text = (cur ? `${cur} ${insertBtn.dataset.llInsert} ` : `${insertBtn.dataset.llInsert} `).slice(0, 4000);
    env.save();
    ctx.rerender().then(() => {
      const box = document.querySelector("[data-ll-transfer]");
      if (box) {
        box.focus();
        box.setSelectionRange(box.value.length, box.value.length);
      }
    });
    return true;
  }
  if (t.closest("[data-ll-speak-transfer]")) {
    const text = document.querySelector("[data-ll-transfer]")?.value || ls.transfer.text || "";
    if (!text.trim()) announce(I.S("Write a sentence first, then press Listen.", "Escribe una oración primero y luego presiona Escuchar."));
    else sayAloud(I, text);
    return true;
  }
  const toBook = t.closest("[data-ll-to-book]");
  if (toBook) {
    const text = (document.querySelector("[data-ll-transfer]")?.value || ls.transfer.text || "").trim();
    if (!text) {
      announce(I.S("Write your response first so we can put it on your book page.", "Escribe primero tu respuesta para ponerla en la página de tu libro."));
      return true;
    }
    const def = C.LABS.find((l) => l.id === lab) || C.LABS[0];
    openInBookStudio(
      {
        source: { kind: "writing", id: lab, label: def.title[0] },
        title: `${def.title[0]} · ${band === "3-5" ? "Grades 3–5" : "Grades 6–8"}`,
        templateId: templateFor(lab, band),
        band,
        pages: [{ heading: def.title[0], text }],
      },
      (url) => ctx.navigate(url),
    );
    return true;
  }
  if (t.closest("[data-ll-transfer-hint]")) {
    ls.transfer.hint = true;
    return done();
  }
  if (t.closest("[data-ll-check-transfer]")) {
    const text = document.querySelector("[data-ll-transfer]")?.value || ls.transfer.text || "";
    ls.transfer.text = text;
    if (!text.trim()) {
      announce(I.S("Write a few sentences first, then check.", "Escribe unas oraciones primero y luego revisa."));
      return true;
    }
    const r =
      lab === "verb-time-machine"
        ? K.checkTimeline(text)
        : lab === "connector-bridge"
          ? K.checkJoin(text, C.BRIDGE_TRANSFER[band].job)
          : K.checkParagraph(text, C.XRAY_TRANSFER[band].topicWords);
    env.record({
      task: `${lab}-transfer-${band}`,
      ok: r.ok,
      kind: ls.transfer.checks ? "revision" : "first",
      supported: ls.transfer.hint,
      use: lab === "paragraph-xray" ? "Argue" : "Explain",
      extra: { transfer: 1 },
    });
    ls.transfer.checks = (ls.transfer.checks || 0) + 1;
    ls.transfer.result = r;
    ls.transfer.ok = ls.transfer.ok || r.ok;
    announce(r.ok ? I.S("Nice work. Read the feedback below.", "Buen trabajo. Lee los comentarios abajo.") : I.S("Not yet. Read the next step below.", "Todavía no. Lee el siguiente paso abajo."), { toast: false });
    return done();
  }
  return m.click(t, env) === true;
}

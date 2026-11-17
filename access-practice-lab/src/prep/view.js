// Access Prep skill builders: /access-prep/<slug> (set picker) and /access-prep/<slug>/<setId> (one set, step by
// step). The three skills (notes.js, data-talk.js, raters-eye.js) supply steps, bodies and actions; this file owns
// routing, the saved state (src/prep/model.js) and the events. Untimed; nothing here is a level or a score.
import { loadPrep } from "../content.js";
import { award } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import { crumbsHTML } from "../components.js";
import { stop as stopSpeech } from "../speech.js";
import { announce, BASE, html, icon } from "../util.js";
import * as dailyDrill from "./daily-drill.js";
import * as dataTalk from "./data-talk.js";
import * as extemporeSpeak from "./extempore-speak.js";
import { isDone, loadState, prepBand, resetState, saveState, validSet } from "./model.js";
import * as notes from "./notes.js";
import * as ratersEye from "./raters-eye.js";
import * as taskWords from "./task-words.js";
import * as textStructures from "./text-structures.js";
import * as wordMeanings from "./word-meanings.js";
import { frameHTML, prepHref } from "./ui.js";

export const SKILLS = {
  notes,
  "data-talk": dataTalk,
  "raters-eye": ratersEye,
  "word-meanings": wordMeanings,
  "text-structures": textStructures,
  "task-words": taskWords,
  "daily-drill": dailyDrill,
  "extempore-speak": extemporeSpeak,
};

let cur = null; // { mod, set, st, band }

async function setsFor(slug, band) {
  const all = await loadPrep(slug);
  return (all[prepBand(band)] || []).filter((s) => validSet(slug, s));
}

/** Route id is "<slug>" or "<slug>/<setId>"; main.js passes the second part as route.missionId's sibling. */
export async function render(ctx, slug, setId) {
  const I = i18nFor(ctx);
  const mod = SKILLS[slug];
  const band = prepBand(ctx.band);
  const sets = await setsFor(slug, band);
  const set = setId ? sets.find((s) => s.id === setId) : null;
  if (!set) {
    cur = null;
    return {
      title: I.S(mod.skill.title, mod.skill.titleEs),
      html: pickerHTML(I, mod.skill, sets, band),
    };
  }
  if (cur?.set.id !== set.id) cur = { mod, set, band, st: loadState(slug, set.id) };
  const { st } = cur;
  const step = Math.min(st.step || 0, mod.skill.steps.length - 1);
  return {
    title: `${set.title} · ${I.S(mod.skill.title, mod.skill.titleEs)}`,
    html: frameHTML(I, {
      skill: mod.skill,
      set,
      band,
      steps: mod.skill.steps,
      step,
      body: mod.body(I, set, st, step),
      canNext: mod.ready(set, st, step),
      nextLabel: mod.nextLabel?.(I, set, st, step),
    }),
  };
}

function duoPathVisualHTML(I, skill, sets, band, nextSet) {
  if (skill.slug !== "daily-drill") return "";
  const offsets = ["is-center", "is-left", "is-center", "is-right"];
  return html`<div class="duo-unit-stage" role="region" aria-label="${I.S("Visual Stepping-Stone Skill Path", "Ruta visual de aprendizaje")}">
    <div class="duo-unit-banner">
      <div>
        <p class="duo-unit-kicker">${I.T(`UNIT 1 · GRADES ${band.replace("-", "–")}`, `UNIDAD 1 · GRADOS ${band.replace("-", "–")}`)}</p>
        <h2 class="duo-unit-title">${I.T("Academic Language across Science, Social Studies, Math & ELA", "Lenguaje académico en Ciencias, Estudios Sociales, Matemáticas y Lengua")}</h2>
      </div>
      <details class="duo-guidebook-drawer">
        <summary class="btn small">${icon("reading")} ${I.T("Guidebook", "Guía de la unidad")}</summary>
        <div class="duo-guidebook-body">
          <p><strong>${I.T("Key Phrases & Words in this Unit:", "Frases y palabras clave de esta unidad:")}</strong></p>
          <ul>
            ${sets.map((s) => html`<li><strong>${I.T(s.title, s.titleEs || s.title)} (${s.area}):</strong> <span lang="en">${s.forge?.model || ""}</span></li>`)}
          </ul>
        </div>
      </details>
    </div>
    <ol class="duo-winding-path" aria-hidden="true">
      ${sets.map((s, idx) => {
        const done = isDone(skill.slug, s.id);
        const isCurrent = nextSet?.id === s.id;
        return html`<li class="duo-winding-row ${offsets[idx % offsets.length]}">
          ${isCurrent ? html`<span class="duo-start-pill">${I.T("START", "EMPEZAR")}</span>` : ""}
          <a
            class="duo-stone ${done ? "is-done" : ""} ${isCurrent ? "is-current" : ""}"
            href="${prepHref(skill.slug, s.id, band)}"
            tabindex="-1"
          >
            <span class="duo-stone-ico">${icon(done ? "check" : "star")}</span>
          </a>
          <span class="duo-stone-caption">${I.T(s.title, s.titleEs || s.title)}</span>
        </li>`;
      })}
      <li class="duo-winding-row is-center">
        <span class="duo-stone is-chest">${icon("medal")}</span>
        <span class="duo-stone-caption">${I.T("Unit Mastery Chest", "Cofre de dominio")}</span>
      </li>
    </ol>
  </div>`;
}

function pickerHTML(I, skill, sets, band) {
  const doneCount = sets.filter((s) => isDone(skill.slug, s.id)).length;
  const nextSet = sets.find((s) => !isDone(skill.slug, s.id)) || sets[0];
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
      [I.S("Access Prep", "Preparación ACCESS"), `${BASE}/access-prep?grades=${band}`],
      [I.S(skill.title, skill.titleEs), null],
    ])}
    <section class="prep-picker" aria-labelledby="prepPickH">
      <header class="prep-skill-head">
        <p class="prep-eyebrow">
          ${icon(skill.icon)} ${I.T("Skill builder", "Constructor de destrezas")} ·
          ${I.T(skill.domainLabel[0], skill.domainLabel[1])}
        </p>
        <h1 id="prepPickH" tabindex="-1">${I.T(skill.title, skill.titleEs)}</h1>
        <p class="prep-lede">${I.T(skill.blurb[0], skill.blurb[1])}</p>
        <ul class="prep-how">
          ${skill.how.map((h) => html`<li>${icon("check")} ${I.T(h[0], h[1])}</li>`)}
        </ul>
        <div class="prep-path-bar" role="region" aria-label="${I.S("Skill path progress", "Progreso de la ruta")}">
          <span class="prep-path-stat">
            ${icon("medal")}
            ${I.T(
              `${doneCount} of ${sets.length} sets finished on this device`,
              `${doneCount} de ${sets.length} conjuntos terminados en este dispositivo`,
            )}
          </span>
          ${
            nextSet
              ? html`<a class="btn btn-primary small" href="${prepHref(skill.slug, nextSet.id, band)}">
                  ${doneCount > 0 && doneCount < sets.length
                    ? I.T("Continue next set", "Continuar siguiente conjunto")
                    : I.T("Start first set", "Empezar primer conjunto")}
                  ${icon("arrow-right")}
                </a>`
              : ""
          }
        </div>
      </header>
      ${duoPathVisualHTML(I, skill, sets, band, nextSet)}
      <ul class="prep-sets">
        ${sets.map((s, idx) => {
          const done = isDone(skill.slug, s.id);
          return html`<li class="prep-set ${done ? "is-done" : ""}">
            <a href="${prepHref(skill.slug, s.id, band)}">
              <span class="prep-set-step">
                <span class="prep-set-node" aria-hidden="true">${done ? icon("check") : idx + 1}</span>
                <span class="prep-set-title">${I.T(s.title, s.titleEs || s.title)}</span>
              </span>
              <span class="prep-set-meta"
                >${[s.area, s.mode, s.kind].filter(Boolean).join(" · ")} ·
                ${I.T(`about ${s.minutes || 6} min`, `unos ${s.minutes || 6} min`)}</span
              >
              ${done ? html`<span class="prep-set-done">${icon("check")} ${I.T("Done on this device", "Hecho en este dispositivo")}</span>` : ""}
            </a>
          </li>`;
        })}
      </ul>
    </section>`;
}

const save = () => saveState(cur.mod.skill.slug, cur.set.id, cur.st);

/** After a re-render, put focus where the learner's eyes should go next (a result, or the new step's heading). */
function settle(ctx, focus) {
  return Promise.resolve(ctx.rerender()).then(() => {
    // "<selector>:last" focuses the last match (a step can stack several results).
    const all = focus ? document.querySelectorAll(focus.replace(/:last$/, "")) : [];
    const el = focus?.endsWith(":last") ? all[all.length - 1] : all[0];
    const target = el || document.getElementById("prepStepH");
    if (!target) return;
    if (!target.matches("button, input, select, textarea, a[href]")) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    const box = target.getBoundingClientRect();
    if (box.top < 80 || box.bottom > innerHeight)
      target.scrollIntoView?.({
        block: "nearest",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
  });
}

export function onClick(e, ctx) {
  if (!cur) return false;
  const btn = e.target.closest("[data-prep-act]");
  if (!btn) return false;
  const I = i18nFor(ctx);
  const { mod, set, st } = cur;
  const act = btn.dataset.prepAct;
  const step = st.step || 0;
  if (act === "next") {
    if (!mod.ready(set, st, step)) {
      announce(
        mod.notReady?.(I, set, st, step) ||
          I.S("Finish this step first.", "Termina este paso primero."),
        { toast: true },
      );
      return true;
    }
    stopSpeech();
    st.step = step + 1;
    if (st.step === mod.skill.steps.length - 1 && mod.finishesOnLastStep) finish(ctx);
    save();
    settle(ctx, null);
    return true;
  }
  if (act === "back") {
    stopSpeech();
    st.step = Math.max(0, step - 1);
    save();
    settle(ctx, null);
    return true;
  }
  if (act === "restart") {
    resetState(mod.skill.slug, set.id);
    cur.st = loadState(mod.skill.slug, set.id);
    settle(ctx, null);
    return true;
  }
  const out = mod.act(act, btn, set, st, I);
  if (!out) return true;
  if (out.finish) finish(ctx);
  save();
  if (out.rerender !== false) settle(ctx, out.focus);
  return true;
}

function finish(ctx) {
  if (cur.st.done) return;
  cur.st.done = true;
  award(ctx, `prep:${cur.mod.skill.slug}:${cur.set.id}`, 4, cur.mod.skill.title);
}

export function onChange(e, ctx) {
  if (!cur) return;
  const t = e.target;
  const { st } = cur;
  st.answers ||= {};
  if (t.matches("[data-prep-pick]")) {
    st.answers[t.dataset.prepPick] = t.value;
    delete st.checked?.[t.dataset.prepPick];
  } else if (t.matches("[data-prep-blank]")) {
    const [k, i] = t.dataset.prepBlank.split(":");
    st.answers[k] = { ...(st.answers[k] || {}), [i]: t.value };
    delete st.checked?.[k];
  } else if (t.matches("[data-prep-box]")) {
    const k = t.dataset.prepBox;
    const now = new Set(st.answers[k] || []);
    if (t.checked) now.add(t.value);
    else now.delete(t.value);
    st.answers[k] = [...now];
    delete st.checked?.[k];
  } else return;
  save();
  ctx.rerender({ keepFocus: true });
}

/** Typing never re-renders (that would move the caret); a skill may refresh one live region instead. */
export function onInput(e) {
  if (!cur) return;
  const t = e.target;
  if (!t.matches?.("[data-prep-text]")) return;
  cur.st.answers ||= {};
  cur.st.answers[t.dataset.prepText] = t.value.slice(0, 1200);
  save();
  cur.mod.onText?.(t.dataset.prepText, cur.set, cur.st);
}

export function unmount() {
  stopSpeech();
  cur = null;
}

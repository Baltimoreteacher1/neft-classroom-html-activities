// Language Growth Map: what the learner's own work shows, by WIDA language dimension, with the
// supports they used kept visibly separate. Every number comes from the evidence ledger; nothing is
// estimated from how many activities were finished, and nothing here is combined into one number or turned into a percentage of "development".
import { crumbsHTML, domainGlyph } from "../components.js";
import {
  focusAreas,
  buildProfile,
  featureValue,
  firstAttempts,
  loadLedger,
  MIN_POINTS,
} from "../lang/ledger.js";
import { loadPatterns } from "../content.js";
import { allRecords } from "../store.js";
import { buildSkillGraph } from "../lang/skill-graph.js";
import { SUPPORT_TIERS, supportOverride } from "../lang/adapt.js";
import { ACCESS_LAB_FLAGS } from "../lang/feature-flags.js";
import { i18nFor } from "../i18n.js";
import { ART, BASE, CORE_DOMAINS, DOMAIN_META, html, icon } from "../util.js";
import { ROOM_ES } from "./room.js";

// [English, Español] pairs; resolved with I.T at the point of use.
const WORD = {
  improving: ["growing", "creciendo"],
  steady: ["steady", "estable"],
  slipping: ["changing — worth a look", "cambiando: vale la pena revisarlo"],
};
const DIM_NAME = { Discourse: "Discurso", Sentence: "Oración", "Word/Phrase": "Palabra/frase" };
const DIM_BLURB = {
  Discourse: [
    "Organizing a whole response: moves of the genre, linking ideas, evidence from sources.",
    "Organizar una respuesta completa: los pasos del género, conectar ideas, evidencia de las fuentes.",
  ],
  Sentence: [
    "Building sentences: more than one idea in a sentence, and control of patterns.",
    "Construir oraciones: más de una idea en una oración y control de los patrones.",
  ],
  "Word/Phrase": [
    "Choosing words: precise subject words and academic vocabulary.",
    "Elegir palabras: palabras precisas del tema y vocabulario académico.",
  ],
};
const COMP_SKILL = {
  "main-idea": ["Main idea", "Idea principal"],
  detail: ["Detail", "Detalle"],
  inference: ["Inference", "Inferencia"],
  evidence: ["Evidence", "Evidencia"],
  vocabulary: ["Vocabulary", "Vocabulario"],
  purpose: ["Purpose", "Propósito"],
  synthesis: ["Synthesis", "Síntesis"],
};
const SUPPORT_ES = {
  A: { label: "Comenzando", detail: "se abren los marcos de oraciones, el banco de palabras y un modelo" },
  B: { label: "Creciendo", detail: "los marcos de oraciones y el banco de palabras están listos" },
  C: { label: "Ampliando", detail: "solo el banco de palabras; los marcos de oraciones quedan cerrados" },
  independent: { label: "Independiente", detail: "sin marcos de oraciones, banco de palabras ni modelo" },
};

const DIM_ICON = { Discourse: "list", Sentence: "writing", "Word/Phrase": "words" };
const SKILL_STATUS = {
  insufficient: [["Collecting evidence", "Reuniendo evidencia"], "clock", "is-none"],
  demonstrated: [["Demonstrated independently", "Demostrado de forma independiente"], "check", "is-ind"],
  supported: [["Demonstrated with support", "Demostrado con apoyo"], "bulb", "is-sup"],
  developing: [["Currently developing", "En desarrollo"], "growth", "is-dev"],
};
const skillStatus = (status) => SKILL_STATUS[status] || SKILL_STATUS.developing;

function spark(values, label) {
  if (values.length < 2) return "";
  const w = 120;
  const h = 32;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const point = (v, i) => [
    Math.round((i / (values.length - 1)) * (w - 8)) + 4,
    Math.round(h - 5 - ((v - lo) / (hi - lo || 1)) * (h - 10)),
  ];
  const pts = values.map(point);
  const [lx, ly] = pts.at(-1);
  return html`<svg
    class="spark"
    viewBox="0 0 ${w} ${h}"
    role="img"
    aria-label="${label}: ${values.map((v) => Math.round(v * 10) / 10).join(", ")}"
  >
    <polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="${lx}" cy="${ly}" r="3.5" fill="currentColor" />
  </svg>`;
}

function featureCard(I, key, f, entries) {
  const { T } = I;
  const series = firstAttempts(entries)
    .map((e) => featureValue(e, key))
    .filter((v) => v != null);
  const t = f.all;
  const dep = f.dependence;
  return html`<div class="grow-feature">
    <h4>${f.label}</h4>
    ${series.length ? spark(series, f.label) : ""}
    ${t.status === "ok" ? "" : html`<div class="bar mini" aria-hidden="true"><i style="width:${Math.min(100, Math.round((t.n / MIN_POINTS) * 100))}%"></i></div>`}
    <p class="fine">
      ${t.status === "ok" ? (I.mode === "en" ? html`Across your first attempts this is <strong>${T(...WORD[t.direction])}</strong> (${series.length} attempts).` : T(`Across your first attempts this is ${WORD[t.direction][0]} (${series.length} attempts).`, `En tus primeros intentos esto está ${WORD[t.direction][1]} (${series.length} intentos).`)) : T(`Not enough evidence yet — ${t.n} of ${MIN_POINTS} first attempts.`, `Aún no hay suficiente evidencia: ${t.n} de ${MIN_POINTS} primeros intentos.`)}
    </p>
    ${dep.status === "ok" ? html`<p class="grow-dep ${dep.dependent ? "is-low" : "is-ok"}">${icon(dep.dependent ? "flag" : "check")} ${dep.dependent ? T("Lower when you work without supports — keep practicing it on your own.", "Más bajo cuando trabajas sin apoyos: sigue practicándolo por tu cuenta.") : T("Similar with and without supports.", "Similar con apoyos y sin ellos.")}</p>` : html`<p class="fine">${T(`Support check needs ${MIN_POINTS}+ attempts with and without help.`, `La revisión de apoyos necesita ${MIN_POINTS}+ intentos con ayuda y sin ella.`)}</p>`}
  </div>`;
}

function supportChoiceHTML(ctx, I) {
  const { T, S } = I;
  const current = supportOverride(ctx.prefs);
  const chosen = SUPPORT_TIERS.find((s) => s.id === current);
  const choices = [
    ...SUPPORT_TIERS.map((s) => [s.id, s.id === "independent" ? I.S(s.label, SUPPORT_ES[s.id]?.label) : `${I.S(s.label, SUPPORT_ES[s.id]?.label)} · ${s.id}`]),
    ["", I.S("Follow my evidence", "Seguir mi evidencia")],
  ];
  return html`<section class="panel grow-support" aria-labelledby="supportChoiceTitle">
    <h2 id="supportChoiceTitle">${T("How much support do you want?", "¿Cuánto apoyo quieres?")}</h2>
    <p class="fine">${T("The lab suggests support from your own work. You can choose instead with one click; it is saved on this device and changes the help missions suggest first.", "El laboratorio sugiere apoyo según tu propio trabajo. Puedes elegir tú con un clic; se guarda en este dispositivo y cambia la ayuda que las misiones sugieren primero.")}</p>
    <div class="grow-choices" role="group" aria-label="${S("Support choice", "Elección de apoyo")}">
      ${choices.map(([id, label]) => html`<button type="button" class="cat-chip" id="support-${id || "evidence"}" data-support-choice="${id}" aria-pressed="${id === current ? "true" : "false"}">${id === current ? icon("check") : ""}${label}</button>`)}
    </div>
    <p class="fine" role="status">${chosen ? T(`Your choice: ${chosen.label} support — ${chosen.detail}.`, `Tu elección: apoyo ${SUPPORT_ES[chosen.id]?.label.toLowerCase()}: ${SUPPORT_ES[chosen.id]?.detail}.`) : T("Following your evidence: each mission says which help it opens and why.", "Siguiendo tu evidencia: cada misión dice qué ayuda abre y por qué.")} ${T("Support choices are not WIDA levels or scores.", "Las opciones de apoyo no son niveles ni puntuaciones de WIDA.")}</p>
  </section>`;
}

function skillGraphHTML(skillGraph, I) {
  const { T } = I;
  return html`<section class="panel" aria-labelledby="skillGraphHeading">
    <h2 id="skillGraphHeading">${T("Academic-language skills", "Destrezas de lenguaje académico")}</h2>
    <p class="fine">${T("Practice profile from your saved work. A skill is shown as demonstrated only after repeated evidence on different tasks. This is not an ACCESS score or proficiency level.", "Perfil de práctica a partir de tu trabajo guardado. Una destreza se muestra como demostrada solo después de evidencia repetida en tareas diferentes. Esto no es una puntuación de ACCESS ni un nivel de dominio.")}</p>
    <div class="grow-skills">
    ${["Listening", "Reading", "Speaking", "Writing"].map((domain) => {
      const skills = skillGraph.filter((s) => s.domain === domain);
      const ready = skills.filter((s) => s.status !== "insufficient");
      return html`<details class="grow-skill-domain d-${domain.toLowerCase()}">
        <summary><span class="prog-tile sm">${domainGlyph(domain)}</span><span class="grow-skill-name">${T(domain, DOMAIN_META[domain].es)}</span><span class="fine">${T(`${ready.length} skill${ready.length === 1 ? "" : "s"} with evidence`, `${ready.length} destreza${ready.length === 1 ? "" : "s"} con evidencia`)}</span></summary>
        <ul class="grow-skill-list">
          ${skills.map((s) => {
            const [word, ico, cls] = skillStatus(s.status);
            return html`<li><strong>${s.name}</strong><span class="grow-status ${cls}">${icon(ico)} ${T(...word)}</span>${s.evidenceCount ? html`<span class="fine">${T(`${s.evidenceCount} evidence points`, `${s.evidenceCount} puntos de evidencia`)}</span>` : ""}</li>`;
          })}
        </ul>
      </details>`;
    })}
    </div>
    <p class="fine">${T("Suggested next step: choose a skill marked “Currently developing” or collect more evidence where the map says it is still collecting evidence.", "Siguiente paso sugerido: elige una destreza marcada como “En desarrollo” o reúne más evidencia donde el mapa dice que aún está reuniendo evidencia.")}</p>
  </section>`;
}

const rowsHTML = (items) =>
  html`<ul class="grow-rows">${items.map(([a, b]) => html`<li><span>${a}</span><span>${b}</span></li>`)}</ul>`;

export async function render(ctx) {
  const band = ctx.band;
  const I = i18nFor(ctx);
  const { T, S } = I;
  const plural = (n, one, many) => (n === 1 ? one : many);
  const ledger = loadLedger();
  const patterns = (await loadPatterns().catch(() => ({ patterns: {} }))).patterns || {};
  const pname = (id) => (Object.hasOwn(patterns, id) ? patterns[id].name : id);
  const entries = ledger.entries.filter((e) => e.band === band);
  // evidenceFromPracticeRecords reads { domain, results } per saved level record.
  const literacyRecords = Object.fromEntries(allRecords().filter((r) => r.band === band && ["Listening", "Reading"].includes(r.domain)).map((r) => [`${r.band === "3-5" ? "g3-5:" : ""}${r.domain}:${r.level}`, { domain: r.domain, results: r.record.results }]));
  const skillGraph = buildSkillGraph(entries, literacyRecords);
  const p = buildProfile(entries, { band });
  const focus = focusAreas(p);
  const records = allRecords().filter((r) => r.band === band);
  const stamps = Object.fromEntries(
    CORE_DOMAINS.map((d) => [
      d,
      records
        .filter((r) => r.domain === d)
        .reduce((n, r) => n + (r.record.complete?.length || 0), 0),
    ]),
  );
  const dims = ["Discourse", "Sentence", "Word/Phrase"];
  const sp = p.speaking;
  const studioLinks = html`<a class="btn" href="${BASE}/write?grades=${band}">${icon("writing")} ${T("Writing Studio", "Estudio de escritura")}</a><a class="btn" href="${BASE}/speak?grades=${band}">${icon("speaking")} ${T("Speaking Studio", "Estudio de expresión oral")}</a><a class="btn" href="${BASE}/missions?grades=${band}">${icon("mission")} ${T("Missions", "Misiones")}</a>`;
  return {
    title: S("Language Growth Map", "Mapa de crecimiento del lenguaje"),
    html: html`${crumbsHTML([
        [S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [S("Passport", "Pasaporte"), `${BASE}/passport?grades=${band}`],
        [S("Language Growth Map", "Mapa de crecimiento del lenguaje"), null],
      ])}
      <section class="prog-hero grow-hero d-reading is-tint">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("growth")} ${T("Evidence from your own work", "Evidencia de tu propio trabajo")}</p>
          <h1 tabindex="-1">${T("Language Growth Map", "Mapa de crecimiento del lenguaje")}</h1>
          <p class="lead">
            ${T("What your writing, speaking and missions show — and which kind of help you used. No scores: only evidence and next steps.", "Lo que muestran tu escritura, tu expresión oral y tus misiones, y qué tipo de ayuda usaste. Sin puntuaciones: solo evidencia y próximos pasos.")}
          </p>
        </div>
        <div class="prog-hero-art"><img src="${ART}/progress-growth.svg" alt="" width="360" height="270" /></div>
      </section>
      <section class="panel" aria-labelledby="growEvidence">
        <h2 id="growEvidence">${T("Your evidence so far", "Tu evidencia hasta ahora")}</h2>
        <ul class="pass-stats grow-stats">
          <li><span class="pass-stat-ico">${icon("pin")}</span><span class="pass-stat-label">${T("First attempts", "Primeros intentos")}</span><strong class="pass-stat-value">${p.firstAttempts}</strong></li>
          <li><span class="pass-stat-ico">${icon("flag")}</span><span class="pass-stat-label">${T("On your own", "Por tu cuenta")}</span><strong class="pass-stat-value">${p.independentFirstAttempts}</strong></li>
          <li><span class="pass-stat-ico">${icon("retry")}</span><span class="pass-stat-label">${T("Revisions", "Revisiones")}</span><strong class="pass-stat-value">${p.revisions}</strong></li>
          <li><span class="pass-stat-ico">${icon("detective")}</span><span class="pass-stat-label">${T("Detective tries", "Intentos de detective")}</span><strong class="pass-stat-value">${p.detective}</strong></li>
        </ul>
        ${p.firstAttempts === 0 ? html`<div class="empty-state grow-empty"><img src="${ART}/empty.svg" alt="" width="320" height="240" /><h3>${T("Your growth map is waiting for work", "Tu mapa de crecimiento espera tu trabajo")}</h3><p>${T("No studio work yet. Try the Writing Studio, Speaking Studio or a mission and your growth map will start to fill in.", "Aún no hay trabajo en los estudios. Prueba el Estudio de escritura, el Estudio de expresión oral o una misión y tu mapa de crecimiento empezará a llenarse.")}</p><div class="row-actions">${studioLinks}</div></div>` : html`<p class="fine">${T(`A trend appears after ${MIN_POINTS} first attempts. “On your own” means no frames, word bank or model were open.`, `Una tendencia aparece después de ${MIN_POINTS} primeros intentos. “Por tu cuenta” significa que no estaban abiertos los marcos de oraciones, el banco de palabras ni el modelo.`)}</p>`}
      </section>
      ${supportChoiceHTML(ctx, I)}
      ${ACCESS_LAB_FLAGS.skillGraphEnabled ? skillGraphHTML(skillGraph, I) : ""}
      ${
        focus.length
          ? html`<section class="panel" aria-labelledby="growFocus">
              <h2 id="growFocus">${T("Where to focus next", "Dónde enfocarte a continuación")}</h2>
              <ol class="grow-focus">
                ${focus.map((f) => html`<li><span>${f.reason}</span>${f.kind === "pattern" ? html`<a class="btn small" href="${BASE}/detective/${f.id}?grades=${band}">${icon("detective")} ${T("Practice this pattern", "Practicar este patrón")}</a>` : ""}</li>`)}
              </ol>
            </section>`
          : ""
      }
      ${dims.map(
        (d) =>
          html`<section class="panel grow-dim" aria-labelledby="dim-${d.replace(/\W/g, "")}">
            <header class="grow-dim-head"><span class="prog-tile">${icon(DIM_ICON[d])}</span><div><h2 id="dim-${d.replace(/\W/g, "")}">${T(d, DIM_NAME[d])}</h2>
            <p class="fine">${T(...DIM_BLURB[d])}</p></div></header>
            <div class="grow-features">
              ${Object.entries(p.features)
                .filter(([, f]) => f.dimension === d)
                .map(([k, f]) => featureCard(I, k, f, entries))}
            </div>
          </section>`,
      )}
      <div class="grow-pair">
      <section class="panel">
        <h2>${T("Patterns in your language", "Patrones en tu lenguaje")}</h2>
        ${
          p.errors.length
            ? html`<ul class="grow-rows">
                ${p.errors.slice(0, 6).map((e) => html`<li><a href="${BASE}/detective/${e.id}?grades=${band}">${pname(e.id)}</a><span>${e.mastered ? html`<span class="grow-status is-ind">${icon("check")} ${T("Used correctly on your own in new writing", "Usado correctamente por tu cuenta en un texto nuevo")}</span>` : T(`in ${e.drafts} recent piece${plural(e.drafts, "", "s")}`, `en ${e.drafts} escrito${plural(e.drafts, "", "s")} reciente${plural(e.drafts, "", "s")}`)}${e.transfer ? html` · ${T(`${e.transfer.transferIndependent} independent transfer${plural(e.transfer.transferIndependent, "", "s")}`, `${e.transfer.transferIndependent} transferencia${plural(e.transfer.transferIndependent, "", "s")} independiente${plural(e.transfer.transferIndependent, "", "s")}`)}` : ""}</span></li>`)}
              </ul>`
            : html`<p>${T("No repeating pattern errors found in your recent work.", "No se encontraron errores de patrón que se repitan en tu trabajo reciente.")}</p>`
        }
      </section>
      ${
        p.comprehension.total
          ? html`<section class="panel">
              <h2>${T("Listening and reading questions", "Preguntas de escuchar y leer")}</h2>
              <ul class="grow-rows">
                ${Object.entries(p.comprehension.bySkill).map(([k, v]) => html`<li><span>${COMP_SKILL[k] ? T(...COMP_SKILL[k]) : k}<span class="bar mini" aria-hidden="true"><i style="width:${Math.round((v.ok / v.n) * 100)}%"></i></span></span><span>${T(`${v.ok} of ${v.n} right on the first try${v.independentN ? ` · ${v.independentOk} of ${v.independentN} without help` : ""}`, `${v.ok} de ${v.n} bien al primer intento${v.independentN ? ` · ${v.independentOk} de ${v.independentN} sin ayuda` : ""}`)}</span></li>`)}
              </ul>
              ${p.comprehension.topTrap ? html`<p class="fine">${T(`Wrong answers you chose most: the “${p.comprehension.topTrap.type}” kind (${p.comprehension.topTrap.count}). Reread the question, then find the sentence that proves your answer.`, `Las respuestas incorrectas que más elegiste: del tipo “${p.comprehension.topTrap.type}” (${p.comprehension.topTrap.count}). Vuelve a leer la pregunta y luego busca la oración que prueba tu respuesta.`)}</p>` : ""}
            </section>`
          : ""
      }
      ${
        sp.n
          ? html`<section class="panel">
              <h2>${T("Speaking", "Hablar")}</h2>
              <p class="fine">
                ${T(`From ${sp.n} recorded first attempt${plural(sp.n, "", "s")}, measured on this device (time speaking and pauses — not pronunciation).`, `A partir de ${sp.n} primer${plural(sp.n, "", "os")} intento${plural(sp.n, "", "s")} grabado${plural(sp.n, "", "s")}, medido${plural(sp.n, "", "s")} en este dispositivo (tiempo hablando y pausas, no la pronunciación).`)}
              </p>
              ${rowsHTML([
                [T("Time speaking", "Tiempo hablando"), sp.speechSeconds.status === "ok" ? T(...WORD[sp.speechSeconds.direction]) : T(`not enough evidence yet (${sp.speechSeconds.n} of ${MIN_POINTS})`, `aún no hay suficiente evidencia (${sp.speechSeconds.n} de ${MIN_POINTS})`)],
                [T("Longest stretch without pausing", "Tramo más largo sin pausas"), sp.longestRun.status === "ok" ? T(...WORD[sp.longestRun.direction]) : T("not enough evidence yet", "aún no hay suficiente evidencia")],
                [T("Pauses per 30 seconds", "Pausas por 30 segundos"), sp.pausesPer30.status === "ok" ? T(...WORD[sp.pausesPer30.direction]) : T("not enough evidence yet", "aún no hay suficiente evidencia")],
              ])}
            </section>`
          : ""
      }
      </div>
      <section class="panel" aria-labelledby="growVolume">
        <h2 id="growVolume">${T("Practice volume", "Cantidad de práctica")}</h2>
        <p class="fine">
          ${T("Activities finished in each skill room. This shows how much you practiced, not how well.", "Actividades terminadas en cada sala de destrezas. Esto muestra cuánto practicaste, no qué tan bien.")}
        </p>
        <div class="grow-volume">
          ${CORE_DOMAINS.map(
            (d) =>
              html`<div class="card d-${d.toLowerCase()}">
                <span class="prog-tile">${icon(DOMAIN_META[d].icon)}</span>
                <h3>${T(DOMAIN_META[d].room, ROOM_ES[d])}</h3>
                <p><strong>${stamps[d]}</strong> ${T("activities finished", "actividades terminadas")}</p>
                <a href="${BASE}/${d}/A?grades=${band}" class="btn ghost small">${T(`Continue ${d}`, `Continuar con ${DOMAIN_META[d].es.toLowerCase()}`)}</a>
              </div>`,
          )}
        </div>
      </section>
      <p class="disclaimer">
        ${T("Classroom practice evidence. It is not a WIDA proficiency level or an ACCESS score, and it only describes what these tasks showed.", "Evidencia de práctica en el aula. No es un nivel de dominio de WIDA ni una puntuación de ACCESS, y solo describe lo que mostraron estas tareas.")}
      </p>`,
  };
}

export function onClick(e, ctx) {
  const btn = e.target.closest?.("[data-support-choice]");
  if (!btn) return false;
  const id = btn.dataset.supportChoice;
  ctx.setPrefs({ supportOverride: SUPPORT_TIERS.some((s) => s.id === id) ? id : "" });
  ctx.rerender().then(() => document.getElementById(btn.id)?.focus({ preventScroll: true }));
  return true;
}

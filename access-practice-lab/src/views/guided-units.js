// Guided Units view (/guided-units, /guided-units/<id>)
// Curated 5-step sequences with local progress tracking and skill-gap recommendations.

import { crumbsHTML } from "../components.js";
import { GUIDED_UNITS, unitHref } from "../content/guided-units.js";
import { i18nFor } from "../i18n.js";
import { recommendNextUnit } from "../lang/recommend-unit.js";
import { announce, BASE, html, icon, raw, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:guidedUnits";

function loadState() {
  return safeJson(storage.get(KEY), {}) || {};
}

function saveState(st) {
  storage.set(KEY, JSON.stringify(st));
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const st = loadState();
  const rec = await recommendNextUnit(ctx.band);
  const unitId = ctx.route.id;
  const active = unitId ? GUIDED_UNITS.find((u) => u.id === unitId) : null;

  if (active) {
    const doneSteps = new Set(st[active.id]?.steps || []);
    return {
      title: I.S(...active.title),
      html: html`${crumbsHTML([
          [I.S("Lab", "Laboratorio"), `${BASE}/`],
          [I.S("Guided Units", "Unidades guiadas"), `${BASE}/guided-units?grades=${ctx.band}`],
          [I.S(...active.title), null],
        ])}
        <article class="panel" aria-labelledby="guUnitTitle">
          <p class="eyebrow">${active.domain} · ${I.T("5-Step Guided Unit", "Unidad guiada de 5 pasos")}</p> <!-- ES-REVIEW -->
          <h1 id="guUnitTitle" tabindex="-1">${I.T(...active.title)}</h1>
          <p class="lead">${I.T(...active.summary)}</p>
          <ol style="display:grid;gap:.85rem;padding-left:1.25rem;margin-top:1.25rem;">
            ${active.steps.map((step, idx) => {
              const done = doneSteps.has(idx);
              return html`<li class="panel" style="background:var(--bg,#f7f4ec);">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;">
                  <div>
                    <p class="eyebrow">${step.kind}</p>
                    <a href="${unitHref(step, ctx.band)}" style="font-weight:700;font-size:1.1rem;">${I.T(...step.label)}</a>
                  </div>
                  <button type="button" class="btn small ${done ? "btn-primary" : ""}" data-gu-toggle="${active.id}:${idx}" aria-pressed="${done}">
                    ${done ? icon("check") : ""} ${done ? I.T("Completed", "Completado") : I.T("Mark done", "Marcar hecho")} <!-- ES-REVIEW -->
                  </button>
                </div>
              </li>`;
            })}
          </ol>
        </article>`,
    };
  }

  return {
    title: I.S("Guided Units", "Unidades guiadas"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        [I.S("Guided Units", "Unidades guiadas"), null],
      ])}
      <section class="panel" aria-labelledby="guTitle">
        <p class="eyebrow">${I.T("Curated 5-Step Sequences", "Secuencias guiadas de 5 pasos")}</p> <!-- ES-REVIEW -->
        <h1 id="guTitle" tabindex="-1">${I.T("Guided Units", "Unidades guiadas")}</h1>
        ${rec?.unit ? html`<div class="panel" style="background:#eaf4f4;border:1.5px solid #1fa6a2;margin:1rem 0;">
          <p class="eyebrow">${I.T("Next Recommended Unit", "Siguiente unidad recomendada")}</p> <!-- ES-REVIEW -->
          <h2 style="margin:.2rem 0;"><a href="${BASE}/guided-units/${rec.unit.id}?grades=${ctx.band}">${I.T(...rec.unit.title)}</a></h2>
          <p class="fine">${I.T(rec.reasonEn, rec.reasonEs)}</p>
        </div>` : ""}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:1rem;">
          ${GUIDED_UNITS.map((u) => {
            const doneCount = (st[u.id]?.steps || []).length;
            return html`<article class="card">
              <p class="eyebrow">${u.domain} · ${doneCount}/${u.steps.length} ${I.T("steps", "pasos")}</p>
              <h2 style="margin:.25rem 0;"><a href="${BASE}/guided-units/${u.id}?grades=${ctx.band}">${I.T(...u.title)}</a></h2>
              <p class="fine">${I.T(...u.summary)}</p>
            </article>`;
          })}
        </div>
      </section>`,
  };
}

export function onClick(e, ctx) {
  const btn = e.target.closest("[data-gu-toggle]");
  if (!btn) return false;
  const [unitId, idxStr] = btn.dataset.guToggle.split(":");
  const idx = Number(idxStr);
  const st = loadState();
  st[unitId] ||= { steps: [] };
  const set = new Set(st[unitId].steps);
  if (set.has(idx)) set.delete(idx);
  else set.add(idx);
  st[unitId].steps = [...set];
  const unit = GUIDED_UNITS.find((u) => u.id === unitId);
  st[unitId].complete = Boolean(unit && st[unitId].steps.length >= unit.steps.length);
  saveState(st);
  announce("Unit progress updated.");
  ctx.rerender();
  return true;
}

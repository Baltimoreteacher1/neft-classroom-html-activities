// Cognitive Load Thermostat (src/lang/thermostat.js)
// 3-position Support Thermostat (Full Support <-> Balanced <-> Solo Challenge) persisted per domain in localStorage.
// Dynamically updates 4 dimensions: frame visibility, cognate hints, audio rate, and choice density.

import { i18nFor } from "../i18n.js";
import { html, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:thermostat";

export const THERMOSTAT_LEVELS = [
  { id: "full", label: ["Full Support", "Apoyo completo"], frames: true, cognates: true, rate: 0.8, choices: 2 }, // ES-REVIEW
  { id: "balanced", label: ["Balanced", "Equilibrado"], frames: true, cognates: false, rate: 0.9, choices: 4 }, // ES-REVIEW
  { id: "solo", label: ["Solo Challenge", "Reto individual"], frames: false, cognates: false, rate: 1.0, choices: 0 }, // ES-REVIEW
];

export function getThermostat(domain = "Reading") {
  const all = safeJson(storage.get(KEY), {}) || {};
  const id = all[domain]?.level || "balanced";
  return THERMOSTAT_LEVELS.find((l) => l.id === id) || THERMOSTAT_LEVELS[1];
}

export function setThermostat(domain = "Reading", levelId) {
  const all = safeJson(storage.get(KEY), {}) || {};
  all[domain] = { ...(all[domain] || {}), level: levelId };
  storage.set(KEY, JSON.stringify(all));
}

export function recordThermostatStreak(domain = "Reading", ok = true) {
  const all = safeJson(storage.get(KEY), {}) || {};
  const cur = all[domain] || { level: "balanced", streak: 0, dismissed: false };
  cur.streak = ok ? (cur.streak || 0) + 1 : 0;
  all[domain] = cur;
  storage.set(KEY, JSON.stringify(all));
  return cur;
}

export function thermostatHTML(ctx, domain = "Reading") {
  const I = i18nFor(ctx);
  const all = safeJson(storage.get(KEY), {}) || {};
  const cur = getThermostat(domain);
  const st = all[domain] || {};
  const showNudge = !st.dismissed && (st.streak || 0) >= 3 && cur.id !== "solo";

  return html`<section class="is-mode-bar no-print" aria-label="${I.S("Support Thermostat", "Termostato de apoyo")}">
    <div>
      <strong>${I.T("Support Thermostat", "Termostato de apoyo")}:</strong> <!-- ES-REVIEW -->
      <span class="fine">${I.T(`Audio ${cur.rate}x · ${cur.frames ? "Frames ON" : "Open response"}`, `Audio ${cur.rate}x · ${cur.frames ? "Marcos activos" : "Respuesta abierta"}`)}</span> <!-- ES-REVIEW -->
    </div>
    <div class="is-mode-tabs" role="group" aria-label="${I.S("Support level", "Nivel de apoyo")}">
      ${THERMOSTAT_LEVELS.map((l) => html`<button type="button" class="btn small ${l.id === cur.id ? "btn-primary" : ""}" data-therm-domain="${domain}" data-therm-set="${l.id}" aria-pressed="${l.id === cur.id}">${I.T(...l.label)}</button>`)}
    </div>
    ${showNudge ? html`<div class="feedback is-right" style="width:100%;margin-top:.5rem;" role="status">
      <span>${I.T("3 strong rounds in a row—want to try the next level?", "3 rondas seguidas muy buenas: ¿quieres probar el siguiente nivel?")}</span> <!-- ES-REVIEW -->
      <button type="button" class="btn small" data-therm-dismiss="${domain}" style="margin-left:.5rem;">${I.T("Dismiss", "Cerrar")}</button>
    </div>` : ""}
  </section>`;
}

export function onThermostatClick(e, ctx) {
  const btn = e.target.closest("[data-therm-set]");
  if (btn) {
    setThermostat(btn.dataset.thermDomain, btn.dataset.thermSet);
    ctx.setPrefs?.({ rate: getThermostat(btn.dataset.thermDomain).rate });
    ctx.rerender();
    return true;
  }
  const dis = e.target.closest("[data-therm-dismiss]");
  if (dis) {
    const all = safeJson(storage.get(KEY), {}) || {};
    const d = dis.dataset.thermDismiss;
    all[d] = { ...(all[d] || {}), dismissed: true };
    storage.set(KEY, JSON.stringify(all));
    ctx.rerender();
    return true;
  }
  return false;
}

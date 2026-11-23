// Teacher: the supports panel. A profile is one support-intensity band per language domain plus per-support overrides
// and a fade. It changes ACCESS only: nothing here reads or changes which grade's content is assigned.
// Edits go to a draft (kit.T.draft); "apply to this device" saves it, "preview" shows exactly what a student gets.
import { html } from "../../util.js";
import { SUPPORT_DOMAINS, SUPPORT_KEYS } from "../contract.js";
import {
  BAND_NAMES,
  DOMAIN_LABEL,
  PRESETS,
  SUPPORT_LABEL,
  SUPPORT_NOTE,
  activePreview,
  bandText,
  completedUnitCount,
  effectiveFade,
  normalizeProfile,
  presetProfile,
  previewAs,
  profileFor,
  removePreset,
  resolveFlags,
  saveProfile,
  savePreset,
  savedPresets,
} from "../supports.js";
import { loadProgress } from "../store.js";
import { T, flagList, intIn, setRegion } from "./kit.js";

const draft = () => {
  T.draft ||= normalizeProfile(profileFor());
  return T.draft;
};
/** Every preset a teacher can start from: the built-in recommendations, then the ones this teacher saved. */
export const allPresets = (I) => [
  ...PRESETS.map((p) => ({
    id: p.id,
    label: I.S(...p.label),
    note: I.S(...p.note),
    profile: presetProfile(p.id),
  })),
  ...savedPresets().map((p) => ({
    id: p.id,
    label: p.profile.name,
    note: I.S("Saved by you", "Guardado por ti"),
    profile: p.profile,
    mine: true,
  })),
];
export const presetById = (id) =>
  presetProfile(id) || savedPresets().find((p) => p.id === id)?.profile || null;

const optionList = (items, current) =>
  items.map(
    (o) =>
      html`<option value="${o.value}" ${o.value === current ? "selected" : ""}>${o.text}</option>`,
  );

/** What a student gets under this profile, per domain (the preview a teacher reads before applying anything). */
export function resolvedHTML(I, profile) {
  const done = completedUnitCount(loadProgress());
  return html`<div class="vat-resolved-grid">
    ${SUPPORT_DOMAINS.map((d) => {
      const flags = resolveFlags(profile, d, { completedUnits: done });
      const on = flagList(I, SUPPORT_LABEL, flags);
      return html`<section class="vat-resolved" aria-label="${I.S(...DOMAIN_LABEL[d])}">
        <h4>${I.T(...DOMAIN_LABEL[d])}</h4>
        <p class="fine">${bandText(profile.bands[d], I.S)}</p>
        ${
          on.length
            ? html`<ul>
                ${on.map((x) => html`<li>${x}</li>`)}
              </ul>`
            : html`<p>
                ${I.T("No assigned supports. Help is still available on request.", "Sin apoyos asignados. La ayuda sigue disponible a pedido.")}
              </p>`
        }
      </section>`;
    })}
  </div>`;
}

const overrideCell = (I, d, k, p) => {
  const cur = p.overrides[d]?.[k];
  const value = cur === true ? "on" : cur === false ? "off" : "auto";
  const id = `vatOv-${d}-${k}`;
  return html`<td>
    <label class="vat-sr" for="${id}"
      >${I.S(...SUPPORT_LABEL[k])}, ${I.S(...DOMAIN_LABEL[d])}</label
    >
    <select id="${id}" data-vat="override" data-d="${d}" data-k="${k}">
      ${optionList(
        [
          { value: "auto", text: I.S("Follow the band", "Seguir la banda") },
          { value: "on", text: I.S("Always on", "Siempre activo") },
          { value: "off", text: I.S("Off", "Apagado") },
        ],
        value,
      )}
    </select>
  </td>`;
};

export function supportsPanel(I) {
  const p = draft();
  const presets = allPresets(I);
  const preview = activePreview();
  const mine = savedPresets();
  return html`<section class="vat-panel" id="vatSupports" aria-labelledby="vatSupH">
    <h2 id="vatSupH">${I.T("Supports", "Apoyos")}</h2>
    <p class="vat-note">${I.S(SUPPORT_NOTE.en, SUPPORT_NOTE.es)}</p>
    <div class="vat-row">
      <label for="vatPreset"
        >${I.T("Start from a preset", "Empezar con un ajuste preestablecido")}</label
      >
      <select id="vatPreset" data-vat="preset">
        <option value="">${I.S("Choose a preset…", "Elige un ajuste…")}</option>
        ${presets.map((x) => html`<option value="${x.id}" ${x.id === p.preset ? "selected" : ""}>${x.label}</option>`)}
      </select>
    </div>
    <fieldset class="vat-bands">
      <legend>
        ${I.T("Support intensity for each language domain", "Intensidad de apoyo para cada dominio del lenguaje")}
      </legend>
      ${SUPPORT_DOMAINS.map(
        (d) =>
          html`<div class="vat-row">
            <label for="vatBand-${d}">${I.T(...DOMAIN_LABEL[d])}</label>
            <select id="vatBand-${d}" data-vat="band" data-d="${d}">
              ${optionList(
                BAND_NAMES.map((b) => ({ value: String(b.n), text: bandText(b.n, I.S) })),
                String(p.bands[d]),
              )}
            </select>
          </div>`,
      )}
    </fieldset>
    <div class="vat-row">
      <label for="vatFade"
        >${I.T("Support strength", "Fuerza del apoyo")}:
        <output id="vatFadeOut" for="vatFade">${Math.round(p.fade * 100)}%</output></label
      >
      <input
        id="vatFade"
        type="range"
        min="0"
        max="100"
        step="5"
        value="${Math.round(p.fade * 100)}"
        data-vat="fade"
        aria-describedby="vatFadeNote"
      />
    </div>
    <p id="vatFadeNote" class="fine">
      ${I.T("Lowering the strength removes supports gradually, starting with the heaviest ones. It never adds a support.", "Bajar la fuerza quita apoyos poco a poco, empezando por los más pesados. Nunca agrega un apoyo.")}
    </p>
    <fieldset class="vat-sched">
      <legend>${I.T("Fade over time", "Retirar con el tiempo")}</legend>
      <label class="vat-check"
        ><input
          type="checkbox"
          data-vat="sched-mode"
          ${p.schedule.mode === "units" ? "checked" : ""}
        />
        ${I.T("Lower the strength automatically as the student finishes lessons", "Bajar la fuerza automáticamente cuando el estudiante termine lecciones")}</label
      >
      <div class="vat-row">
        <label for="vatEvery"
          >${I.T("Every this many finished lessons", "Cada esta cantidad de lecciones terminadas")}</label
        >
        <input
          id="vatEvery"
          type="number"
          min="1"
          max="20"
          value="${p.schedule.every}"
          data-vat="sched-every"
        />
        <label for="vatStep">${I.T("Lower by (%)", "Bajar en (%)")}</label>
        <input
          id="vatStep"
          type="number"
          min="5"
          max="100"
          step="5"
          value="${Math.round(p.schedule.step * 100)}"
          data-vat="sched-step"
        />
      </div>
      <p class="fine" id="vatFadeNow">
        ${I.T("Strength right now on this device", "Fuerza ahora en este dispositivo")}:
        ${Math.round(effectiveFade(p, completedUnitCount(loadProgress())) * 100)}%
      </p>
    </fieldset>
    <details class="vat-details">
      <summary>${I.T("Change individual supports", "Cambiar apoyos individuales")}</summary>
      <div class="vat-table-wrap">
        <table class="vat-table">
          <caption class="vat-sr">
            ${I.T("Each support for each domain", "Cada apoyo para cada dominio")}
          </caption>
          <thead>
            <tr>
              <th scope="col">${I.T("Support", "Apoyo")}</th>
              ${SUPPORT_DOMAINS.map((d) => html`<th scope="col">${I.T(...DOMAIN_LABEL[d])}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${SUPPORT_KEYS.map(
              (k) =>
                html`<tr>
                  <th scope="row">${I.T(...SUPPORT_LABEL[k])}</th>
                  ${SUPPORT_DOMAINS.map((d) => overrideCell(I, d, k, p))}
                </tr>`,
            )}
          </tbody>
        </table>
      </div>
    </details>
    <h3>${I.T("What a student gets", "Lo que recibe un estudiante")}</h3>
    <div id="vatResolved" aria-live="polite">${resolvedHTML(I, p)}</div>
    <div class="vat-actions">
      <button type="button" class="btn btn-primary va-btn" data-vat="apply-device">
        ${I.T("Apply to this device", "Aplicar a este dispositivo")}
      </button>
      <button type="button" class="btn va-btn" data-vat="preview">
        ${I.T("Preview as a student", "Ver como estudiante")}
      </button>
      ${preview ? html`<button type="button" class="btn va-btn" data-vat="stop-preview">${I.T("Stop previewing", "Dejar de ver como estudiante")}</button>` : ""}
    </div>
    <p class="fine">
      ${I.T("Applying changes the supports on this device only. To give a group different supports, make a differentiated version of an assignment.", "Aplicar cambia los apoyos solo en este dispositivo. Para dar apoyos distintos a un grupo, crea una versión diferenciada de una tarea.")}
    </p>
    <p class="vat-status" id="vatSupStatus" role="status" aria-live="polite">
      ${preview ? I.T("Preview is on in this tab: students' pages show these supports until you stop it.", "La vista previa está activa en esta pestaña: las páginas de estudiante muestran estos apoyos hasta que la detengas.") : ""}
    </p>
    <div class="vat-row">
      <label for="vatPresetName"
        >${I.T("Save these settings as your own preset", "Guardar estos ajustes como tu propio preestablecido")}</label
      >
      <input
        id="vatPresetName"
        type="text"
        maxlength="40"
        value="${T.presetName}"
        data-vat="preset-name"
        autocomplete="off"
      />
      <button type="button" class="btn va-btn" data-vat="save-preset">
        ${I.T("Save preset", "Guardar")}
      </button>
    </div>
    ${
      mine.length
        ? html`<ul
            class="vat-list"
            aria-label="${I.S("Your saved presets", "Tus preestablecidos guardados")}"
          >
            ${mine.map((x) => html`<li>${x.profile.name} <button type="button" class="btn va-btn va-btn-quiet" data-vat="del-preset" data-id="${x.id}" aria-label="${I.S("Delete preset", "Eliminar preestablecido")} ${x.profile.name}">${I.T("Delete", "Eliminar")}</button></li>`)}
          </ul>`
        : ""
    }
  </section>`;
}

const refresh = (I) => {
  setRegion("vatResolved", resolvedHTML(I, draft()));
  const now = document.getElementById("vatFadeNow");
  if (now)
    now.textContent = `${I.S("Strength right now on this device", "Fuerza ahora en este dispositivo")}: ${Math.round(effectiveFade(draft(), completedUnitCount(loadProgress())) * 100)}%`;
};
const say = (text) => {
  const n = document.getElementById("vatSupStatus");
  if (n) n.textContent = text;
};

/** Input/change events for the supports panel. Returns true when handled. */
export function supportsChange(e, ctx, va) {
  const el = e.target.closest?.("[data-vat]");
  if (!el) return false;
  const I = va.I;
  const p = draft();
  const k = el.dataset.vat;
  if (k === "preset") {
    const found = presetById(el.value);
    if (found) T.draft = normalizeProfile({ ...found, name: "" });
    else p.preset = "";
    ctx.rerender();
    return true;
  }
  if (k === "band") {
    p.bands[el.dataset.d] = intIn(el.value, 1, 5, 4);
    p.preset = "";
  } else if (k === "fade") {
    p.fade = intIn(el.value, 0, 100, 100) / 100;
    const out = document.getElementById("vatFadeOut");
    if (out) out.textContent = `${Math.round(p.fade * 100)}%`;
  } else if (k === "sched-mode") p.schedule.mode = el.checked ? "units" : "manual";
  else if (k === "sched-every") p.schedule.every = intIn(el.value, 1, 20, 3);
  else if (k === "sched-step") p.schedule.step = intIn(el.value, 5, 100, 25) / 100;
  else if (k === "override") {
    const row = { ...(p.overrides[el.dataset.d] || {}) };
    if (el.value === "auto") delete row[el.dataset.k];
    else row[el.dataset.k] = el.value === "on";
    p.overrides[el.dataset.d] = row;
  } else if (k === "preset-name") {
    T.presetName = el.value;
    return true;
  } else return false;
  refresh(I);
  return true;
}

export function supportsClick(e, ctx, va) {
  const b = e.target.closest?.("[data-vat]");
  if (!b) return false;
  const I = va.I;
  const act = b.dataset.vat;
  if (act === "apply-device") {
    const r = saveProfile({ ...draft(), source: "teacher" });
    say(
      r.state === "saved"
        ? I.S(
            "Saved: this device now uses these supports.",
            "Guardado: este dispositivo ahora usa estos apoyos.",
          )
        : I.S(
            "This device could not save the profile. It applies in this tab only.",
            "Este dispositivo no pudo guardar el perfil. Solo se aplica en esta pestaña.",
          ),
    );
  } else if (act === "preview") {
    previewAs(draft());
    say(
      I.S(
        "Preview is on in this tab. Open a lesson to see what a student sees.",
        "La vista previa está activa en esta pestaña. Abre una lección para ver lo que ve un estudiante.",
      ),
    );
    ctx.rerender();
  } else if (act === "stop-preview") {
    previewAs(null);
    ctx.rerender();
  } else if (act === "save-preset") {
    const r = savePreset({ ...draft(), name: T.presetName });
    if (r.reason === "no-name")
      say(I.S("Give the preset a name first.", "Ponle un nombre al preestablecido primero."));
    else {
      T.presetName = "";
      ctx.rerender();
    }
  } else if (act === "del-preset") {
    removePreset(b.dataset.id);
    ctx.rerender();
  } else return false;
  return true;
}

export const SUP_CLICK = new Set(["apply-device", "preview", "stop-preview", "save-preset", "del-preset"]);
export const SUP_CHANGE = new Set(["preset", "band", "fade", "sched-mode", "sched-every", "sched-step", "override", "preset-name"]);

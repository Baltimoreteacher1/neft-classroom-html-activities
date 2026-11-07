// "My explorer" panel on the Missions page: avatar pieces and world scenes unlocked by finished missions
// (src/lang/unlocks.js). The look is saved in the learner's engagement prefs on this device.
import { normalizeLook, unlocks } from "../lang/unlocks.js";
import { BASE, html, icon } from "../util.js";

export function avatarPanelHTML(I, studio, look) {
  const u = unlocks(studio);
  const current = normalizeLook(look, studio);
  const item = u.items.find((i) => i.id === current.item);
  const scene = u.scenes.find((w) => w.id === current.scene);
  return html`<section class="panel avatar-panel" aria-labelledby="avatarTitle">
    <h2 id="avatarTitle">${icon("star")} ${I.T("My explorer", "Mi explorador")}</h2>
    <p class="fine">
      ${I.T(
        "Finish a mission to unlock a piece for your explorer. More finished missions open world scenes. Everything stays on this device, and every lesson stays open either way.",
        "Termina una misión para desbloquear una pieza para tu explorador. Más misiones terminadas abren escenas de los mundos. Todo se queda en este dispositivo y todas las lecciones siguen abiertas.",
      )}
    </p>
    <div
      class="avatar-stage"
      ${scene ? html`style="background-image:url('${BASE}/pictures/worlds/${scene.id}.svg')"` : ""}
    >
      <span class="avatar-figure" aria-hidden="true">${icon(item ? item.icon : "user")}</span>
      <p class="avatar-caption">
        ${item ? I.TO(item.name) : I.T("No piece chosen yet", "Todavía no elegiste una pieza")}${scene ? html` · ${I.TO(scene.name)}` : ""}
      </p>
    </div>
    <h3>${I.T("Pieces", "Piezas")}</h3>
    <div
      class="avatar-grid"
      role="group"
      aria-label="${I.S("Explorer pieces", "Piezas del explorador")}"
    >
      ${u.items.map(
        (i) =>
          html`<button
            type="button"
            class="avatar-choice ${i.unlocked ? "" : "is-locked"}"
            data-avatar-item="${i.id}"
            aria-pressed="${String(current.item === i.id)}"
            ${i.unlocked ? "" : "disabled"}
          >
            <span aria-hidden="true">${icon(i.unlocked ? i.icon : "lock")}</span>
            <span>${I.TO(i.name)}</span>
            ${i.unlocked ? "" : html`<span class="fine">${I.T("Finish this mission to unlock", "Termina esta misión para desbloquear")}</span>`}
          </button>`,
      )}
    </div>
    <h3>${I.T("World scenes", "Escenas de los mundos")}</h3>
    <div
      class="avatar-grid"
      role="group"
      aria-label="${I.S("World scenes", "Escenas de los mundos")}"
    >
      ${u.scenes.map(
        (w) =>
          html`<button
            type="button"
            class="avatar-choice ${w.unlocked ? "" : "is-locked"}"
            data-avatar-scene="${w.id}"
            aria-pressed="${String(current.scene === w.id)}"
            ${w.unlocked ? "" : "disabled"}
          >
            <span>${I.TO(w.name)}</span>
            ${w.unlocked ? "" : html`<span class="fine">${I.T(`Opens after ${w.need} finished missions`, `Se abre después de ${w.need} misiones terminadas`)}</span>`}
          </button>`,
      )}
    </div>
  </section>`;
}

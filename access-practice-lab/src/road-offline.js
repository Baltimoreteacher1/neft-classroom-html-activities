// Road to ACCESS: the "Save this week for offline" card. Markup, status on mount, and the save/remove buttons.
// The URL list comes from src/offline-pack.js; the saving is done by the offline worker (sw.js "cache-urls").
import { bandRows, loadDomain } from "./content.js";
import {
  canSavePacks,
  formatBytes,
  packName,
  packStatus,
  removePack,
  savePack,
  weekPackUrls,
} from "./offline-pack.js";
import { announce, formatDate, html, icon } from "./util.js";
import { activityHref } from "./views/room.js";

let busy = false;

export function offlineCardHTML(I, band, week) {
  return html`<section
    class="rd-card rd-offline"
    data-rd-offline
    data-band="${band}"
    data-week="${week.n}"
  >
    <h3>
      ${icon("download")} ${I.T("Save this week for offline", "Guardar esta semana sin internet")}
    </h3>
    <p class="fine">
      ${I.T("Saves this week's activities, their pictures and the files they read on this device, so they open without Wi-Fi. Read-alouds use this device's own voice.", "Guarda en este dispositivo las actividades de esta semana, sus imágenes y los archivos que usan, para que se abran sin wifi. La lectura en voz alta usa la voz de este dispositivo.")}
    </p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary small" data-rd-save>
        ${icon("download")}
        <span data-rd-save-label>${I.T("Save this week for offline", "Guardar esta semana sin internet")}</span>
      </button>
      <button type="button" class="btn small" data-rd-remove hidden>
        ${icon("x")} ${I.T("Remove offline copy", "Quitar la copia sin internet")}
      </button>
    </div>
    <progress
      class="rd-offline-bar"
      max="1"
      value="0"
      hidden
      aria-label="${I.S("Saving progress", "Progreso del guardado")}"
    ></progress>
    <p class="fine" role="status" data-rd-offline-status></p>
  </section>`;
}

const savedText = (I, s) =>
  I.S(
    `Saved for offline: ${s.saved} files, ${formatBytes(s.bytes)}, on ${formatDate(s.at.slice(0, 10))}.${s.failed ? ` ${s.failed} could not be saved; try again online.` : ""}`,
    `Guardada sin internet: ${s.saved} archivos, ${formatBytes(s.bytes)}, el ${formatDate(s.at.slice(0, 10))}.${s.failed ? ` ${s.failed} no se pudieron guardar; inténtalo de nuevo con internet.` : ""}`,
  );

function paint(card, I, saved) {
  const status = card.querySelector("[data-rd-offline-status]");
  const remove = card.querySelector("[data-rd-remove]");
  const save = card.querySelector("[data-rd-save]");
  remove.hidden = !saved;
  if (saved) {
    status.textContent = savedText(I, saved);
    save.querySelector("[data-rd-save-label]").textContent = I.S("Update offline copy", "Actualizar la copia sin internet");
  } else if (!canSavePacks()) {
    status.textContent = I.S(
      "Offline saving is not ready in this browser yet. Reload the page while online, then try again.",
      "Guardar sin internet aún no está listo en este navegador. Vuelve a cargar la página con internet y prueba otra vez.",
    );
    save.disabled = true;
  }
}

export async function mountOffline(root, I) {
  const card = root.querySelector("[data-rd-offline]");
  if (!card) return;
  paint(card, I, await packStatus(packName(card.dataset.band, card.dataset.week)));
}

async function collect(band, weekN, plan) {
  const week = plan.weeks.find((w) => w.n === weekN);
  const rows = await bandRows(band);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const acts = week.activities.map((id) => byId.get(id)).filter(Boolean);
  const domains = await Promise.all(
    [...new Set(acts.map((a) => a.domain))].map((d) => loadDomain(band, d)),
  );
  const all = domains.flatMap((d) =>
    Object.values(d?.levels || {}).flatMap((L) => L.activities || []),
  );
  const activities = all.filter((a) => week.activities.includes(a.id));
  return weekPackUrls({
    band,
    week,
    rows,
    activities,
    hrefOf: (a) => activityHref(a.domain, a.level, a.id),
  });
}

async function save(card, I, plan) {
  const band = card.dataset.band;
  const name = packName(band, card.dataset.week);
  const bar = card.querySelector(".rd-offline-bar");
  const status = card.querySelector("[data-rd-offline-status]");
  try {
    const { urls } = await collect(band, Number(card.dataset.week), plan);
    bar.hidden = false;
    status.textContent = I.S("Saving…", "Guardando…");
    const summary = await savePack(name, urls, ({ done, total, bytes }) => {
      bar.max = Math.max(1, total);
      bar.value = done;
      status.textContent = I.S(
        `Saving ${done} of ${total} files (${formatBytes(bytes)})`,
        `Guardando ${done} de ${total} archivos (${formatBytes(bytes)})`,
      );
    });
    bar.hidden = true;
    paint(card, I, summary);
    announce(savedText(I, summary));
  } catch {
    bar.hidden = true;
    status.textContent = I.S(
      "This week could not be saved. Check the connection and try again.",
      "No se pudo guardar esta semana. Revisa la conexión e inténtalo de nuevo.",
    );
    announce(status.textContent);
  }
}

/** Road view click handler for the card. Returns true when it handled the click (synchronously). */
export function onOfflineClick(e, I, plan) {
  const card = e.target.closest("[data-rd-offline]");
  if (!card) return false;
  if (e.target.closest("[data-rd-save]")) {
    if (busy || !plan) return true;
    busy = true;
    save(card, I, plan).finally(() => (busy = false));
    return true;
  }
  if (e.target.closest("[data-rd-remove]")) {
    removePack(packName(card.dataset.band, card.dataset.week)).then(() => {
      card.querySelector("[data-rd-offline-status]").textContent = I.S(
        "The offline copy of this week was removed.",
        "Se quitó la copia sin internet de esta semana.",
      );
      card.querySelector("[data-rd-remove]").hidden = true;
      card.querySelector("[data-rd-save]").focus();
    });
    return true;
  }
  return false;
}

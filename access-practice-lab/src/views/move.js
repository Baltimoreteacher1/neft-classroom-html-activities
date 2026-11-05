// Move my progress (/move). The lab lives at eduwonderlab.com and thelanguagepage.com; a browser keeps each
// address's saved work separate, so a learner moves theirs across here, on their say-so. Nothing is deleted at
// either end, nothing is sent to a server, and nothing is written until the learner has seen what is arriving and
// pressed "Add to this device". Logic and safety rules: ../transfer.js.
import { i18nFor } from "../i18n.js";
import {
  applyTransfer,
  collectTransfer,
  offerTo,
  parseTransferFile,
  peerOrigin,
  receiveFrom,
  summarizeTransfer,
} from "../transfer.js";
import { BASE, announce, html, icon } from "../util.js";

/** idle | waiting (the other site is open, asked to receive) | review (data arrived) | done */
let S = { phase: "idle", error: "", sent: false };
let stopListening = null;

const host = (origin) => origin.replace(/^https?:\/\//, "");

function reset(keep = {}) {
  stopListening?.();
  stopListening = null;
  S = { phase: "idle", error: "", sent: false, ...keep };
}

function arrive(payload, ctx) {
  const summary = summarizeTransfer(payload);
  if (!summary.ok) {
    S = { ...S, phase: "idle", error: summary.error };
  } else {
    S = { ...S, phase: "review", payload, summary, error: "" };
  }
  return ctx.rerender();
}

function sendBlock(I, peer) {
  return html`<section class="panel" aria-labelledby="mv-send">
    <h2 id="mv-send">${I.T("Send my progress", "Enviar mi progreso")}</h2>
    <p>
      ${I.T(
        "Open the other site and send the work saved on this device. You choose what happens next on that side.",
        "Abre el otro sitio y envía el trabajo guardado en este dispositivo. Tú decides qué pasa después en ese lado.",
      )}
    </p>
    <p class="actions">
      ${
        peer
          ? html`<button type="button" class="btn" data-mv-send>
              ${icon("arrow-right")} ${I.T("Open", "Abrir")} ${host(peer)} ${I.T("and send", "y enviar")}
            </button>`
          : ""
      }
      <button type="button" class="btn ghost" data-mv-download>
        ${icon("download")} ${I.T("Download a progress file", "Descargar un archivo de progreso")}
      </button>
    </p>
    ${S.sent ? html`<p role="status">${I.T("The other site is open. Follow the steps there.", "El otro sitio está abierto. Sigue los pasos allí.")}</p>` : ""}
  </section>`;
}

function receiveBlock(I, peer) {
  const waiting = S.phase === "waiting";
  return html`<section class="panel" aria-labelledby="mv-receive">
    <h2 id="mv-receive">${I.T("Receive progress", "Recibir progreso")}</h2>
    ${
      waiting
        ? html`<p role="status">
            ${I.T("Waiting for", "Esperando a")} ${host(peer)}…
            ${I.T(
              "If nothing arrives, go back to that site and press the send button there.",
              "Si no llega nada, vuelve a ese sitio y pulsa el botón de enviar allí.",
            )}
          </p>`
        : html`<p>
            ${I.T(
              "On the other site, press Send. Or choose a progress file you downloaded.",
              "En el otro sitio, pulsa Enviar. O elige un archivo de progreso que descargaste.",
            )}
          </p>`
    }
    <p class="actions">
      <label class="btn ghost">
        ${icon("save")} ${I.T("Choose a progress file", "Elegir un archivo de progreso")}
        <input type="file" accept="application/json,.json" data-mv-file hidden />
      </label>
    </p>
  </section>`;
}

function reviewBlock(I) {
  const { summary } = S;
  return html`<section class="panel" aria-labelledby="mv-review" data-mv-review>
    <h2 id="mv-review">
      ${I.T("Add this work to this device?", "¿Agregar este trabajo a este dispositivo?")}
    </h2>
    <p>
      ${I.T("It holds", "Contiene")}
      <strong>${summary.count}</strong>
      ${I.T("saved items", "elementos guardados")}${summary.from ? html` ${I.T("from", "de")} ${host(summary.from)}` : ""}.
      ${
        summary.already
          ? I.T(
              `${summary.already} of them already exist here. Work already on this device is kept.`,
              `${summary.already} de ellos ya existen aquí. El trabajo que ya está en este dispositivo se conserva.`,
            )
          : I.T("None of it is on this device yet.", "Nada de esto está aún en este dispositivo.")
      }
    </p>
    <p>${I.T("Kinds of work:", "Tipos de trabajo:")} ${summary.families.join(", ")}.</p>
    <p class="actions">
      <button type="button" class="btn" data-mv-apply>
        ${I.T("Add to this device", "Agregar a este dispositivo")}
      </button>
      <button type="button" class="btn ghost" data-mv-cancel>${I.T("Cancel", "Cancelar")}</button>
    </p>
  </section>`;
}

function doneBlock(I) {
  return html`<section class="panel" aria-labelledby="mv-done">
    <h2 id="mv-done">${I.T("Your progress is here", "Tu progreso está aquí")}</h2>
    <p role="status">
      ${I.T(
        `Added ${S.result.added + S.result.merged} items. Nothing was deleted on either site.`,
        `Se agregaron ${S.result.added + S.result.merged} elementos. No se borró nada en ninguno de los dos sitios.`,
      )}
    </p>
    <p class="actions">
      <a class="btn" href="${BASE}/path"
        >${I.T("Go to My Language Path", "Ir a Mi camino del lenguaje")}</a
      >
    </p>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const peer = peerOrigin();
  const body =
    S.phase === "done"
      ? doneBlock(I)
      : S.phase === "review"
        ? reviewBlock(I)
        : html`${sendBlock(I, peer)}${receiveBlock(I, peer)}`;
  return {
    title: I.T("Move my progress", "Mover mi progreso"),
    html: html`<section class="panel">
        <h1>${I.T("Move my progress", "Mover mi progreso")}</h1>
        <p>
          ${I.T(
            `Your work is saved on this device for ${location.hostname} only. To use it on the other address, move it across. Nothing is deleted, and nothing goes to a server.`,
            `Tu trabajo se guarda en este dispositivo solo para ${location.hostname}. Para usarlo en la otra dirección, muévelo. No se borra nada y no se envía a ningún servidor.`,
          )}
        </p>
        ${S.error ? html`<p class="saved-note" role="alert">${S.error}</p>` : ""}
      </section>
      ${body}`,
  };
}

export function mount(root, ctx) {
  const wantsReceive = new URLSearchParams(location.search).get("receive") === "1";
  if (!wantsReceive || S.phase !== "idle" || stopListening) return;
  const peer = peerOrigin();
  const cancel = peer && receiveFrom(peer, (payload) => arrive(payload, ctx));
  if (!cancel) {
    S = { ...S, error: "" };
    return;
  }
  stopListening = cancel;
  S = { ...S, phase: "waiting" };
  ctx.rerender();
}

export function onClick(e, ctx) {
  const t = e.target;
  if (t.closest("[data-mv-send]")) {
    const peer = peerOrigin();
    // The listener is in place before the other site opens, so its "ready" cannot be missed.
    const target = window.open(`${peer}${BASE}/move?receive=1`, "access-lab-transfer");
    if (!target) {
      S = {
        ...S,
        error: i18nFor(ctx).T(
          "Your browser blocked the new window. Download a progress file instead.",
          "Tu navegador bloqueó la ventana nueva. Descarga un archivo de progreso.",
        ),
      };
    } else {
      stopListening?.();
      stopListening = offerTo(peer, target);
      S = { ...S, error: "", sent: true };
    }
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-mv-download]")) {
    const blob = new Blob([JSON.stringify(collectTransfer())], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `access-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    announce(i18nFor(ctx).T("Progress file downloaded.", "Archivo de progreso descargado."));
    return true;
  }
  if (t.closest("[data-mv-apply]")) {
    try {
      S = { ...S, phase: "done", result: applyTransfer(S.payload), error: "" };
    } catch (err) {
      S = { ...S, phase: "idle", error: err.message };
    }
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-mv-cancel]")) {
    reset();
    ctx.rerender();
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  const input = e.target.closest?.("[data-mv-file]");
  if (!input?.files?.[0]) return;
  input.files[0].text().then(
    (text) => {
      try {
        arrive(parseTransferFile(text), ctx);
      } catch (err) {
        S = { ...S, error: err.message };
        ctx.rerender();
      }
    },
    () => {
      S = { ...S, error: "That file could not be read." };
      ctx.rerender();
    },
  );
}

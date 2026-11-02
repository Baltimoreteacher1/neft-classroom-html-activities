// "Tell my teacher": the Passport panel and click handlers for check-ins (see checkin.js for what a check-in holds).
import {
  buildCheckin,
  checkinMessage,
  checkinUrl,
  loadSent,
  newSince,
  saveSent,
} from "./checkin.js";
import { bandRows } from "./content.js";
import { routeProgress } from "./journey.js";
import { getStudentName, loadRecord } from "./store.js";
import { announce, html, icon, todayISO } from "./util.js";

async function savedRoutes(band) {
  const rows = await bandRows(band);
  return routeProgress(
    rows.map((row) => ({ ...row, record: loadRecord(band, row.domain, row.level) })),
  );
}

export function checkinHTML(I, routes) {
  const fresh = newSince(routes, loadSent());
  const started = routes.some((r) => r.stopsDone > 0);
  const lead = !started
    ? I.T(
        "Finish a stop and you can tell your teacher in one tap.",
        "Termina una parada y podrás avisar a tu docente con un toque.",
      )
    : fresh.length
      ? I.T(
          `New since you last told your teacher: ${fresh.map((r) => `${r.country[0]} +${r.fresh}`).join(", ")}.`,
          `Nuevo desde la última vez que avisaste a tu docente: ${fresh.map((r) => `${r.country[1]} +${r.fresh}`).join(", ")}.`,
        )
      : I.T("Your teacher has your latest stops.", "Tu docente tiene tus últimas paradas.");
  return html`<section class="panel pass-checkin no-print" aria-labelledby="checkinTitle">
    <h2 id="checkinTitle">
      ${icon("mail")} ${I.T("Tell my teacher and family", "Avisar a mi docente y a mi familia")}
    </h2>
    <p class="${fresh.length ? "goal-done" : "fine"}" role="status">${lead}</p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-checkin-send ${started ? "" : "disabled"}>
        ${icon("mail")} ${I.T("Send check-in to my teacher", "Enviar registro a mi docente")}
      </button>
      <button type="button" class="btn" data-checkin-family ${started ? "" : "disabled"}>
        ${icon("families")} ${I.T("Share with my family", "Compartir con mi familia")}
      </button>
      <button type="button" class="btn" data-checkin-copy ${started ? "" : "disabled"}>
        ${icon("copy")} ${I.T("Copy the note", "Copiar la nota")}
      </button>
    </div>
    <p class="fine">
      ${I.T(
        "The note has only your nickname, the date and which stops are finished. No answers, writing or recordings. Your teacher still stamps your paper passport.",
        "La nota solo tiene tu apodo, la fecha y qué paradas están terminadas. No incluye respuestas, escritura ni grabaciones. Tu docente sigue sellando tu pasaporte de papel.",
      )}
    </p>
    <p class="fine" data-checkin-status role="status"></p>
  </section>`;
}

async function deliver(text, title, canShare = true) {
  if (canShare && navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/** @returns {Promise<boolean>} true when the click was a check-in control */
export async function onCheckinClick(e, ctx, I) {
  const send = e.target.closest("[data-checkin-send]");
  const family = e.target.closest("[data-checkin-family]");
  const copy = e.target.closest("[data-checkin-copy]");
  if (!send && !family && !copy) return false;
  const status = document.querySelector("[data-checkin-status]");
  const say = (msg) => {
    if (status) status.textContent = msg;
    announce(msg);
  };
  const alias = getStudentName();
  if (!alias) {
    say(
      I.S(
        "Add your nickname at the top of this page first.",
        "Primero escribe tu apodo en la parte de arriba de esta página.",
      ),
    );
    document.querySelector("[data-name]")?.focus();
    return true;
  }
  const routes = (await savedRoutes(ctx.band)).filter((r) => r.stopsDone > 0);
  const checkin = buildCheckin({ alias, band: ctx.band, date: todayISO(), routes });
  const forFamily = Boolean(family);
  const text = checkinMessage(I, { alias, routes, url: forFamily ? "" : checkinUrl(checkin) });
  const title = I.S("Passport check-in", "Registro del Pasaporte");
  const outcome = await deliver(text, title, !copy);
  if (outcome === "cancelled") return true;
  if (outcome === "failed") {
    say(
      I.S(
        "This device could not share or copy. Ask your teacher for help.",
        "Este dispositivo no pudo compartir ni copiar. Pide ayuda a tu docente.",
      ),
    );
    return true;
  }
  if (!forFamily) saveSent(routes);
  say(
    outcome === "shared"
      ? I.S("Sent. Thank you!", "¡Enviado! Gracias.")
      : forFamily
        ? I.S("Copied. Paste it in a message to your family.", "Copiado. Pégalo en un mensaje para tu familia.")
        : I.S(
            "Copied. Paste it in a message or email to your teacher.",
            "Copiado. Pégalo en un mensaje o correo para tu docente.",
          ),
  );
  if (!forFamily) ctx.rerender();
  return true;
}

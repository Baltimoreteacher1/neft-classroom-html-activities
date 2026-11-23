// A teacher-made activity for students (/do/<id>, also /access-practice-lab/do/<id>). No sign-in, no teacher controls,
// no names: it fetches the published student copy and mounts the same player the teacher previewed. Worksheets open
// as a printable page with an optional digital version. A page that is not published (or was taken down) says so
// plainly instead of showing an error.
import { i18nFor, langMode } from "../i18n.js";
import { BASE, html } from "../util.js";

const ID = /^s[a-f0-9]{10}$/;
let player = null;

function loadBundle() {
  if (window.StudioPlayer) return Promise.resolve(window.StudioPlayer);
  return new Promise((resolve, reject) => {
    for (const [tag, attrs] of [
      ["link", { rel: "stylesheet", href: `${BASE}/player/studio-player.css` }],
      ["script", { src: `${BASE}/player/studio-player.js` }],
    ]) {
      const el = Object.assign(document.createElement(tag), attrs);
      if (tag === "script") {
        el.onload = () => resolve(window.StudioPlayer);
        el.onerror = () => reject(new Error("player"));
      }
      document.head.append(el);
    }
  });
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  return {
    title: I.S("Activity", "Actividad"),
    html: html`<div class="st-do" id="st-do" aria-live="polite">
      <p role="status">${I.S("Loading your activity…", "Cargando su actividad…")}</p>
    </div>`,
  };
}

export async function mount(rootEl, ctx) {
  const host = rootEl.querySelector("#st-do");
  const S = i18nFor(ctx).S;
  const id = ctx.route.id;
  const say = (text) =>
    host.replaceChildren(
      Object.assign(document.createElement("p"), { className: "st-empty", textContent: text }),
    );
  if (!ID.test(id))
    return say(
      S(
        "This link does not look right. Ask your teacher for the link again.",
        "Este enlace no parece correcto. Pida a su docente el enlace otra vez.",
      ),
    );
  let data;
  try {
    const res = await fetch(`/api/class/activity/play?id=${id}`);
    if (res.status === 404)
      return say(
        S(
          "This activity is not available right now. Ask your teacher.",
          "Esta actividad no está disponible ahora. Pregunte a su docente.",
        ),
      );
    if (!res.ok) throw new Error(String(res.status));
    data = await res.json();
  } catch {
    return say(
      S(
        "The activity could not load. Check your internet and try again.",
        "No se pudo cargar la actividad. Revise su internet e intente de nuevo.",
      ),
    );
  }
  if (data.activity?.kind === "worksheet") return showWorksheet(host, data, S, langMode(ctx.prefs));
  try {
    const { mountPlayer } = await loadBundle();
    document.title = `${data.title} · ${S("The Language Page", "The Language Page")}`;
    host.replaceChildren();
    player?.destroy?.();
    player = mountPlayer(host, data.activity, {
      lang: langMode(ctx.prefs),
      reportUrl: `/api/class/activity/response`,
      activityId: id,
    });
  } catch {
    say(
      S(
        "The activity could not start on this device. Try another browser.",
        "La actividad no pudo iniciarse en este dispositivo. Pruebe con otro navegador.",
      ),
    );
  }
}

/** A worksheet is a page to print or write on: the student copy carries no answers, so it is never checked on screen. */
async function showWorksheet(host, data, S, lang) {
  const { renderWorksheetParts } = await import("../studio/print/worksheet.js");
  const { openPrint } = await import("../studio/print/open-print.js");
  const { html: doc } = renderWorksheetParts(data.activity, { part: "student", lang });
  document.title = data.title;
  const print = Object.assign(document.createElement("button"), { type: "button", className: "btn primary", textContent: S("Print this worksheet", "Imprimir esta hoja de trabajo") });
  print.addEventListener("click", () => openPrint(doc));
  const frame = Object.assign(document.createElement("iframe"), { className: "st-frame full", title: data.title, srcdoc: doc });
  frame.setAttribute("sandbox", "allow-modals");
  host.replaceChildren(print, frame);
}

export function unmount() {
  player?.destroy?.();
  player = null;
}

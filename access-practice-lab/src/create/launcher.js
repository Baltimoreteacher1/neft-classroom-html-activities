// Project Studio · the lab app's Create entry point. main.js imports this ONLY on a device that may be in teacher mode
// (a cheap pre-check), so student devices never download authoring code. Here the authoritative check runs:
// isTeacherMode() is the lab's existing teacher signal (Teacher Hub audience or site teacher key, never a device linked
// to a class as a student). It hides authoring from learners; it is not authentication, and nothing it unlocks is
// secret: Create only reads content the student pages already load, and it writes only to this device.

import { BASE, storage } from "../util.js";
import { isTeacherMode } from "../vocab-academy/store.js";
import { openInStudio } from "./handoff.js";
import { installPageCreate } from "./page.js";
import { capabilityFor, offersCreate } from "./routes.js";
import { readSession } from "./session.js";

const io = { get: (k) => storage.get(k), set: (k, v) => storage.set(k, v) };
const fetchJson = async (url) => {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.json();
};

const SVG = "http://www.w3.org/2000/svg";
function glyph(d) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "cr-glyph");
  const p = document.createElementNS(SVG, "path");
  p.setAttribute("d", d);
  svg.append(p);
  return svg;
}
const PLUS = "M12 5v14M5 12h14";
const STACK = "M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4M4 17l8 4 8-4";

let css = null;
function ensureCss() {
  css ||= Object.assign(document.createElement("link"), { rel: "stylesheet", href: `${BASE}/src/create/create.css` });
  if (!css.isConnected) document.head.append(css);
}

function button(cls, label, title, d, onclick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `top-link ${cls}`;
  b.dataset.create = "";
  b.title = title;
  b.setAttribute("aria-haspopup", "dialog");
  const span = document.createElement("span");
  span.textContent = label;
  b.append(glyph(d), span);
  b.addEventListener("click", onclick);
  return b;
}

/**
 * Called after every lab render (main.js). Adds at most two controls to the header toolbar: Create (on source and hub
 * pages) and Packet (n) (while a packet is in progress, on any teacher page). Removes them everywhere else.
 */
export function mountCreate({ route, S, lang, navigate }) {
  const nav = document.querySelector(".lab-tools");
  for (const el of document.querySelectorAll("[data-create]")) el.remove();
  if (!nav || !isTeacherMode()) return;
  installPageCreate();
  const cap = capabilityFor(route, location.search);
  const anchor = nav.querySelector(".lab-utilities");
  const env = {
    S,
    lang,
    io,
    fetchJson,
    source: cap.source,
    openStudio: (activity) => {
      if (!openInStudio(activity, navigate || undefined))
        alertLive(S("This device could not save the draft. Free some space and try again.", "Este dispositivo no pudo guardar el borrador. Libere espacio e intente de nuevo."));
    },
    onPacketChange: () => mountCreate({ route, S, lang, navigate }),
  };
  const place = (el) => (anchor ? anchor.before(el) : nav.append(el));
  if (offersCreate(cap)) {
    ensureCss();
    const label = cap.source ? S("Create from this", "Crear con esto") : S("Create", "Crear");
    const create = button("cr-launch", label, S("Make a worksheet, activity, game or packet from this content", "Crear una hoja, actividad, juego o paquete con este contenido"), PLUS, async (e) => {
      const { openCreate } = await import("./panel.js");
      openCreate({ ...env, trigger: e.currentTarget });
    });
    place(create);
  }
  const n = readSession(io).items.length;
  if (n && cap.tray) {
    ensureCss();
    const tray = button("cr-tray", S(`Packet (${n})`, `Paquete (${n})`), S("Your resource packet in progress", "Su paquete de recursos en progreso"), STACK, async () => {
      const { openPacket } = await import("./packet.js");
      openPacket(env);
    });
    place(tray);
  }
}

function alertLive(msg) {
  const el = document.getElementById("labToast") || document.body;
  const p = document.createElement("p");
  p.setAttribute("role", "alert");
  p.className = "cr-toast";
  p.textContent = msg;
  el.append(p);
  setTimeout(() => p.remove(), 8000);
}

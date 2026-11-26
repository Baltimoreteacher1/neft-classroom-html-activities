// Project Studio · Create on teacher pages OUTSIDE the lab app (BCPSS Teachers, the Teacher Hub). These pages already
// link to the Activity Studio chooser with ?family=&ref= (their "Customize Activity" links). Instead of adding a second
// control, a plain click on such a link opens the Create panel for that exact resource; a modified click (new tab) and
// a page without JavaScript still follow the link to the Studio as before. Both pages are teacher surfaces behind the
// site's teacher gate (functions/_lib/teacher-surface.js), so no extra client-side check is needed here.

import { BASE, storage } from "../util.js";
import { openInStudio } from "./handoff.js";

const io = { get: (k) => storage.get(k), set: (k, v) => storage.set(k, v) };
const FAMILY = /^[a-z][a-z0-9-]{1,39}$/;
const REF = /^[A-Za-z0-9_-]{1,120}$/;

const fetchJson = async (url) => {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.json();
};

/** The adapter source a Customize link points at, or null. */
export function sourceFromHref(href, origin = "https://x.invalid") {
  let u;
  try {
    u = new URL(href, origin);
  } catch {
    return null;
  }
  if (u.origin !== new URL(origin).origin || u.pathname !== `${BASE}/activity-studio/customize`) return null;
  const family = u.searchParams.get("family") || "";
  const ref = u.searchParams.get("ref") || "";
  if (!FAMILY.test(family) || !REF.test(ref)) return null;
  const band = u.searchParams.get("band");
  return { family, ref, ...(["1_2", "3_4", "5_6"].includes(band) ? { band } : {}) };
}

let css = null;
let installed = false;

export function installPageCreate(doc = document) {
  if (installed) return;
  installed = true;
  const es = (doc.documentElement.lang || "").startsWith("es");
  const S = (en, esText) => (es ? esText : en);
  // capture phase: runs before the lab's own link router, which skips a click that is already handled
  doc.addEventListener(
    "click",
    async (e) => {
    const a = e.target.closest?.("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const source = sourceFromHref(a.getAttribute("href"), location.origin);
    if (!source) return;
    e.preventDefault();
    css ||= Object.assign(doc.createElement("link"), { rel: "stylesheet", href: `${BASE}/src/create/create.css` });
    if (!css.isConnected) doc.head.append(css);
    const { openCreate } = await import("./panel.js");
    openCreate({
      S,
      lang: es ? "es" : "en",
      io,
      fetchJson,
      source,
      trigger: a,
      openStudio: (activity) => openInStudio(activity),
    });
    },
    true,
  );
}

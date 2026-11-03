// ACCESS ecosystem shell for standalone pages (Teacher Hub, Family Expedition tour, Side Quest, Family Adventure).
// One header, breadcrumb trail and footer with the practice-material disclaimer, driven by routes.js. Mounts on
// <body data-acc-section="teacher|tour|expedition|…">. Idempotent. The Practice Lab app has its own chrome and uses
// footerBlock() from here so the disclaimer is worded once.
import { chrome } from "./copy.js";
import { ACC_ROUTES, NAV_IDS, routeById, trail } from "./routes.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const label = (r, lang) => (lang === "es" ? r.es : r.en);

export function ecoBarHTML(section, lang = "en") {
  const t = chrome(lang);
  const links = NAV_IDS.map((id) => routeById(id))
    .map((r) => {
      const here = r.id === section || trail(section).some((x) => x.id === r.id && r.id !== "lab");
      return `<li><a href="${r.path}"${here ? ' aria-current="page"' : ""}>${esc(label(r, lang))}</a></li>`;
    })
    .join("");
  return `<div class="acc-eco-inner"><a class="acc-eco-brand" href="/access-practice-lab/">${esc(t.brand)} <small>${esc(t.brandSub)}</small></a><nav aria-label="${esc(t.navLabel)}"><ul class="acc-eco-nav">${links}</ul></nav></div>`;
}

export function crumbsHTML(section, lang = "en") {
  const t = chrome(lang);
  const items = trail(section);
  const lis = items
    .map((r, i) => (i === items.length - 1 ? `<li><span aria-current="page">${esc(label(r, lang))}</span></li>` : `<li><a href="${r.path}">${esc(label(r, lang))}</a></li>`))
    .join("");
  return `<nav class="acc-crumbs" aria-label="${esc(t.crumbLabel)}"><ol>${lis}</ol></nav>`;
}

/** The disclaimer and local-data note. Shared by the standalone footer and the Practice Lab footer. */
export function footerBlock(lang = "en") {
  const t = chrome(lang);
  return `<p class="acc-disclaimer"><strong>${esc(t.disclaimerLead)}</strong> ${esc(t.disclaimer)}</p><p class="acc-disclaimer">${esc(t.local)}</p>`;
}

export function footerHTML(lang = "en") {
  const t = chrome(lang);
  const nav = ACC_ROUTES.map((r) => `<li><a href="${r.path}">${esc(label(r, lang))}</a></li>`)
    .join("");
  return `<div class="acc-footer-inner"><nav aria-label="${esc(t.footerNav)}"><ul>${nav}</ul></nav>${footerBlock(lang)}</div>`;
}

export function mountAccShell(doc = document) {
  const body = doc.body;
  const section = body?.dataset.accSection;
  if (!section || !routeById(section) || doc.getElementById("accEco")) return false;
  const lang = (doc.documentElement.lang || "en").slice(0, 2);
  const eco = doc.createElement("div");
  eco.id = "accEco";
  eco.className = "acc-eco no-print";
  eco.innerHTML = ecoBarHTML(section, lang);
  const crumbs = doc.createElement("div");
  crumbs.className = "acc-crumbs-bar no-print";
  crumbs.innerHTML = crumbsHTML(section, lang);
  const skip = body.querySelector("a[class*='skip']");
  if (skip) skip.after(eco, crumbs);
  else body.prepend(eco, crumbs);
  // A div with a region role, not <header>/<footer>: the standalone pages style those tags globally and
  // already own the banner and contentinfo landmarks.
  const foot = doc.createElement("div");
  foot.id = "accFooter";
  foot.className = "acc-footer";
  foot.setAttribute("role", "region");
  foot.setAttribute("aria-label", chrome(lang).footerNav);
  foot.innerHTML = footerHTML(lang);
  body.append(foot);
  eco.querySelector("[aria-current]")?.scrollIntoView?.({ block: "nearest", inline: "center" });
  return true;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountAccShell());
  else mountAccShell();
}

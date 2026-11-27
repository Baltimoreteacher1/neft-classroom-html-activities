// ACCESS ecosystem shell for standalone pages (Teacher Hub, Family Expedition tour, Side Quest, Family Adventure).
// One header, breadcrumb trail and footer with the practice-material disclaimer, driven by routes.js. Mounts on
// <body data-acc-section="teacher|tour|expedition|…">. Idempotent. The Practice Lab app has its own chrome and uses
// footerBlock() from here so the disclaimer is worded once.
import { installCalmFocus } from "../keep-in-view.js";
import { chrome } from "./copy.js";
import { NAV_IDS, routeById, trail } from "./routes.js";

installCalmFocus(); // programmatic focus never recentres the page (src/keep-in-view.js)

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

/**
 * The standalone footer is grouped by who it is for, like the Practice Lab footer (src/nav.js): students, families,
 * classroom and ESOL teachers, help. Every link stays on the lab's own host (The Language Page serves each of them).
 */
export const FOOTER_GROUPS = Object.freeze([
  {
    en: "Students",
    es: "Estudiantes",
    links: [
      ["/access-practice-lab/students", "Start practicing", "Empezar a practicar"],
      ["/access-practice-lab/access-prep", "ACCESS practice", "Práctica ACCESS"],
      ["/access-practice-lab/explore/progress", "My progress", "Mi progreso"],
    ],
  },
  {
    en: "Families",
    es: "Familias",
    links: [
      ["/access-practice-lab/family-start", "Families: start here", "Familias: empiecen aquí"],
      ["/access-practice-lab/family", "Family Corner", "Rincón de la familia"],
    ],
  },
  {
    en: "Teachers",
    es: "Docentes",
    links: [
      ["/access-teacher/classroom/", "Classroom teachers", "Docentes de aula"],
      ["/access-teacher/?role=esol", "ESOL teachers", "Docentes de ESOL"],
      ["/access-teacher/predictive/", "WIDA Data Studio", "Estudio de datos WIDA"],
      ["/bcpss-teachers", "BCPSS curriculum bridges", "Puentes del currículo de BCPSS"],
    ],
  },
  {
    en: "Help",
    es: "Ayuda",
    links: [
      ["/access-practice-lab/site-guide", "Site Guide", "Guía del sitio"],
      ["/access-practice-lab/search?for=teacher", "Find resources", "Buscar recursos"],
      ["/access-practice-lab/privacy", "Privacy", "Privacidad"],
      ["/access-practice-lab/accessibility", "Accessibility", "Accesibilidad"],
    ],
  },
]);

export function footerHTML(lang = "en") {
  const t = chrome(lang);
  const es = lang === "es";
  const groups = FOOTER_GROUPS.map(
    (g) =>
      `<div class="acc-foot-group"><h2>${esc(es ? g.es : g.en)}</h2><ul>${g.links
        .map(([href, en, esText]) => `<li><a href="${href}">${esc(es ? esText : en)}</a></li>`)
        .join("")}</ul></div>`,
  ).join("");
  return `<div class="acc-footer-inner"><nav aria-label="${esc(t.footerNav)}"><div class="acc-foot-groups">${groups}</div></nav>${footerBlock(lang)}</div>`;
}

export function mountAccShell(doc = document) {
  const body = doc.body;
  const section = body?.dataset.accSection;
  if (!section || !routeById(section) || doc.getElementById("accEco") || doc.getElementById("accFooter")) return false;
  const lang = (doc.documentElement.lang || "en").slice(0, 2);
  // Pages that ship the unified Editorial Academic <header class="lab-top"> (e.g. Teacher Hub)
  // already carry full site navigation; avoid stacking a redundant dark eco bar and crumb bar above it.
  const hasUnifiedHeader = Boolean(body.querySelector("header.lab-top"));
  let eco = null;
  if (!hasUnifiedHeader) {
    eco = doc.createElement("div");
    eco.id = "accEco";
    eco.className = "acc-eco no-print";
    eco.innerHTML = ecoBarHTML(section, lang);
    const crumbs = doc.createElement("div");
    crumbs.className = "acc-crumbs-bar no-print";
    crumbs.innerHTML = crumbsHTML(section, lang);
    const skip = body.querySelector("a[class*='skip']");
    if (skip) skip.after(eco, crumbs);
    else body.prepend(eco, crumbs);
  }
  // A div with a region role, not <header>/<footer>: the standalone pages style those tags globally and
  // already own the banner and contentinfo landmarks.
  const foot = doc.createElement("div");
  foot.id = "accFooter";
  foot.className = "acc-footer";
  foot.setAttribute("role", "region");
  foot.setAttribute("aria-label", chrome(lang).footerNav);
  foot.innerHTML = footerHTML(lang);
  body.append(foot);
  // Center the current link inside the nav row only; scrollIntoView would also move the window.
  const row = eco?.querySelector("nav");
  const link = row?.querySelector("[aria-current]");
  if (link && row.scrollWidth > row.clientWidth) {
    const r = row.getBoundingClientRect();
    const l = link.getBoundingClientRect();
    row.scrollLeft += l.left - r.left - (r.width - l.width) / 2;
  }
  return true;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountAccShell());
  else mountAccShell();
}

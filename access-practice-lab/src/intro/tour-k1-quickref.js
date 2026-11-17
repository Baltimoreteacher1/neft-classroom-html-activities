// The K–1 Teacher Tour's quick reference: one PDF with every step, what to do and the real activity links for the
// chosen grade, in English or Spanish. It reuses the Teacher Tour's PDF writer (tour/export-pdf.js Doc: Letter
// pages, built-in fonts, clickable links), so nothing about PDF output is copied. Pure: runs in the browser and in
// Node (tools/access-intro-k1-tour.test.mjs). Spanish fits the writer's Latin-1 set (á é í ó ú ñ ¿ ¡ « » º).
import { SITE } from "./data.js";
import { FAMILY_HANDOUT_K2 } from "./family-k2-data.js";
import { Doc } from "./tour/export-pdf.js";
import { K1_COPY, K1_LINKS, K1_STEPS, pickNames, stepMore, stepTry } from "./tour-k1-data.js";

const abs = (route) => `${SITE.host}${SITE.base}${route}`;

/** The quick reference as plain rows, so the PDF and a test read the same thing. */
export function quickrefRows(pick, lang = "en") {
  const t = (v) => v[lang] ?? v.en;
  return K1_STEPS.map((s, i) => ({
    head: `${i + 1}. ${t(s.title)}`,
    what: t(s.what),
    directions: s.directions.map(t),
    links: [stepTry(s, pick), ...stepMore(s, pick)].map((a) => ({
      label: typeof a.title === "string" ? a.title : t(a.title),
      url: abs(a.route),
    })),
    extra: (s.links || []).map((id) => ({
      label: t(K1_LINKS[id].label),
      url: abs(`${K1_LINKS[id].route}?grades=${pick}`),
    })),
  }));
}

/** PDF bytes for one grade (K or 1) and language ("en" or "es"). */
export function k1QuickrefPdf(pick, lang = "en") {
  const t = (v) => v[lang] ?? v.en;
  const title = `${t(K1_COPY.title)} · ${t(K1_COPY.quickref)}`;
  const d = new Doc(title);
  d.text(title, { size: 18, bold: true, color: "0.08 0.2 0.38", gap: 2 });
  d.text(t(pickNames[pick]), { size: 11, color: "0.3 0.3 0.3" });
  d.text(abs(`/start/tour-k1?grades=${pick}`), {
    size: 9.5,
    link: abs(`/start/tour-k1?grades=${pick}`),
  });
  d.rule();
  for (const r of quickrefRows(pick, lang)) {
    d.heading(r.head, 12.5);
    d.text(r.what, { size: 9.5 });
    for (const line of r.directions) d.bullet(line, { size: 9.5 });
    for (const l of [...r.links, ...r.extra])
      d.text(`${l.label}: ${l.url}`, { size: 9, link: l.url, gap: 2 });
  }
  d.heading(t(K1_COPY.handout), 12.5);
  const files = FAMILY_HANDOUT_K2[lang] || FAMILY_HANDOUT_K2.en;
  for (const url of [files.pdf, files.docx])
    d.text(`${SITE.host}${url}`, { size: 9, link: `${SITE.host}${url}`, gap: 2 });
  return d.bytes();
}

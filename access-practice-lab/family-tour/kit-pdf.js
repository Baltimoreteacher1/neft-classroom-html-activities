// "Download Our Practice Kit": the Starter Kit as a real PDF in the family's language, built on the family's own
// device from the same kit data as the screen. Large type, high contrast, working links and a scannable QR code.
import { qrModules } from "../../shared/qr/qr-code.mjs";
import { Pdf } from "./pdf.js";
import { t } from "./i18n.js";

const INK = 0x111a3b;
const BRAND = 0x1a2f78;
const SOFT = 0xe6ecfb;
const GOLD = 0xffce5b;
const MUTED = 0x3a4566;

function heading(pdf, letter, text) {
  pdf.ensure(64);
  pdf.space(10);
  pdf.rect(pdf.m, pdf.y - 26, 26, 26, BRAND);
  pdf.textAt(letter, pdf.m + 8.5, pdf.y - 19, { size: 15, bold: true, color: 0xffffff });
  pdf.textAt(text, pdf.m + 36, pdf.y - 19, { size: 17, bold: true, color: BRAND });
  pdf.space(36);
}

export function buildKitPdf(k) {
  const pdf = new Pdf({ title: `${k.title} · The Language Page`, lang: k.lang === "es" ? "es-US" : "en-US" });
  const { m, w } = pdf;
  // Cover band
  pdf.rect(0, pdf.h - 96, w, 96, BRAND);
  pdf.rect(0, pdf.h - 100, w, 4, GOLD);
  pdf.textAt("The Language Page", m, pdf.h - 36, { size: 12, bold: true, color: GOLD });
  pdf.textAt(k.title, m, pdf.h - 68, { size: 26, bold: true, color: 0xffffff });
  pdf.y = pdf.h - 118;

  const f = k.first;
  heading(pdf, "A", f.heading);
  const colW = w - m * 2 - 150;
  const top = pdf.y;
  pdf.para(f.name, { size: 16, bold: true, width: colW, gap: 2 });
  pdf.para(`${t("kit.a.practice")} ${f.practice}`, { size: 12, width: colW, gap: 2 });
  pdf.para(`${t("kit.a.time")} ${t("kit.minutes", { n: f.minutes })}`, { size: 12, width: colW, gap: 6 });
  f.steps.forEach((s, i) => pdf.para(`${i + 1}. ${s}`, { size: 12, width: colW, gap: 3 }));
  pdf.para(f.supportsTitle, { size: 12, bold: true, width: colW, gap: 2 });
  f.supports.forEach((s) => pdf.para(`• ${s}`, { size: 11.5, width: colW, gap: 2 }));
  const bottom = pdf.y;
  try {
    pdf.qr(qrModules(f.url), w - m - 132, top, 132);
    pdf.textAt(f.qrLabel, w - m - 132, top - 140, { size: 9, color: MUTED });
  } catch {
    pdf.textAt(t("kit.qrTooLong"), w - m - 140, top - 20, { size: 9, color: MUTED });
  }
  pdf.y = Math.min(bottom, top - 150);
  pdf.space(2);
  pdf.para(f.url, { size: 10.5, bold: true, color: BRAND, link: f.url, gap: 8 });

  heading(pdf, "B", k.routineHeading);
  pdf.para(k.routineIntro, { size: 12, gap: 4 });
  for (const r of k.routine) {
    pdf.ensure(56);
    const y0 = pdf.y;
    pdf.rect(m, y0 - 44, 62, 44, SOFT);
    pdf.textAt(t("kit.min", { n: r.mins }), m + 8, y0 - 27, { size: 12, bold: true, color: BRAND });
    const before = pdf.y;
    pdf.y = y0;
    pdf.para(r.title, { size: 12.5, bold: true, x: m + 74, width: w - m * 2 - 74, gap: 1 });
    pdf.para(r.text, { size: 11.5, x: m + 74, width: w - m * 2 - 74, gap: 5 });
    pdf.y = Math.min(pdf.y, y0 - 48, before);
  }

  heading(pdf, "C", k.sayHeading);
  for (const s of k.say) pdf.para(`• ${s.home}${s.en && k.lang !== "en" ? `  (${s.en})` : ""}`, { size: 13, gap: 3 });
  pdf.para(k.sayNote, { size: 10.5, color: MUTED, gap: 6 });

  heading(pdf, "D", k.helpHeading);
  for (const h of k.help) {
    pdf.para(h.title, { size: 12.5, bold: true, gap: 1 });
    pdf.para(h.text, { size: 11.5, gap: 5 });
  }

  heading(pdf, "E", k.trackerHeading);
  pdf.para(k.trackerIntro, { size: 11.5, gap: 4 });
  const cols = [58, 100, 66, 116, 164];
  const x0 = m;
  const rowH = 38;
  pdf.ensure(rowH * 4 + 8);
  let x = x0;
  const y0 = pdf.y;
  pdf.rect(x0, y0 - 24, cols.reduce((a, b) => a + b, 0), 24, SOFT);
  k.trackerCols.forEach((c, i) => {
    pdf.textAt(c, x + 4, y0 - 16, { size: 8.5, bold: true, color: BRAND });
    x += cols[i];
  });
  k.tracker.forEach((row, r) => {
    const top = y0 - 24 - r * rowH;
    let cx = x0;
    const cells = [row.date, row.activity, row.statusLabel, row.practiced, row.next];
    cells.forEach((cell, i) => {
      pdf.strokeRect(cx, top - rowH, cols[i], rowH, 0x8a93ad, 0.6);
      const lines = String(cell || "").length ? cell : "";
      if (lines) pdf.textAt(String(lines).slice(0, Math.floor(cols[i] / 4.6)), cx + 4, top - 14, { size: 9.5 });
      cx += cols[i];
    });
  });
  pdf.y = y0 - 24 - 3 * rowH - 12;

  heading(pdf, "F", k.returnHeading);
  for (const r of k.returnLines) {
    pdf.para(r.label, { size: 11.5, bold: true, gap: 0 });
    pdf.para(r.value, { size: 10.5, color: r.url ? BRAND : INK, link: r.url, gap: 5 });
  }
  pdf.space(4);
  pdf.para(k.footer, { size: 10, color: MUTED });
  void INK;
  return pdf.toBlob();
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

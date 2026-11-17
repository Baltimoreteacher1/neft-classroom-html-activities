// Word writer for a downloadable document (model.js): the neutral blocks become WordprocessingML through the lab's
// one Word writer (docx-writer.js). Pictures are described by their alt text (the print view shows the picture
// itself); the online activity is a real hyperlink. Nothing here adds or removes content: what the model holds is
// what the file holds.
import { Body, packDocx } from "./docx-writer.js";

const LINE = "_".repeat(78);

function block(b, d) {
  switch (b.t) {
    case "h":
      return d.heading(b.text, 2);
    case "label":
      return d.para(b.text, { bold: true, after: 40, keepNext: true });
    case "note":
      return d.para(b.text, { italic: true, shade: "EEF3F8" });
    case "p":
      return d.para(b.text, { bold: b.strong, italic: b.em, size: b.strong ? 12 : undefined });
    case "script":
      d.para(b.label, { bold: true, shade: "FFF4E0", keepNext: true, after: 40 });
      for (const line of b.lines) d.para(line, { shade: "FFF4E0", indent: 200 });
      return;
    case "passage":
      d.para(b.title, { bold: true, after: 40, keepNext: true });
      for (const p of b.paras) d.para(p, { indent: 200 });
      return;
    case "picture":
      if (b.alt)
        d.runs([
          [`[${b.altLabel || "Picture"}] `, { bold: true }],
          [b.alt, { italic: true }],
        ]);
      return;
    case "table":
      if (b.caption) d.para(b.caption, { bold: true, after: 40, keepNext: true });
      return d.table(b.rows, { headers: b.headers });
    case "choices":
      for (const it of b.items)
        d.para(
          `${it.mark}  ${it.letter}.  ${it.visual ? `${it.visual} ` : ""}${it.text}${it.picture?.alt ? ` (${it.picture.alt})` : ""}`,
          { indent: 360, after: 80 },
        );
      return;
    case "list":
      for (const it of b.items)
        b.box ? d.para(`${b.box}  ${it}`, { indent: 360, after: 80 }) : d.bullet(it);
      return;
    case "lines":
      for (let i = 0; i < b.n; i++) d.para(LINE, { color: "8A97A8", after: 160 });
      return;
    case "help":
      d.para(b.title, { bold: true, shade: "E8F3F1", keepNext: true, after: 20 });
      d.para(b.note, { italic: true, shade: "E8F3F1" });
      for (const x of b.blocks) block(x, d);
      return;
    case "link":
      d.para(b.label, { bold: true, after: 20, keepNext: true });
      return d.link(b.url, b.url);
    case "pagebreak":
      d.xml.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      return;
    case "honest":
      return d.para(b.text, { italic: true, size: 9 });
    default:
      throw new Error(`docx: unknown block "${b.t}"`);
  }
}

/** The document as a .docx (Uint8Array). */
export function toDocx(doc) {
  const d = new Body();
  d.para(
    `${doc.labels.name}: ______________________________   ${doc.labels.date}: ______________`,
    { after: 200 },
  );
  d.para(doc.title, { style: "Title" });
  if (doc.meta) d.para(doc.meta, { size: 10 });
  for (const b of doc.blocks) block(b, d);
  return packDocx(d, { title: doc.title, lang: doc.lang === "es" ? "es" : "en" });
}

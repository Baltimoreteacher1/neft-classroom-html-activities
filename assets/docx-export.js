/* Neft Teacher — client-side Word (.docx) export.
 * Zero dependencies: builds a valid OOXML .docx (a STORE-method zip with a
 * minimal document part) from the page's printable content. Used by the
 * supplemental resource pages so teachers get a clean Word doc to print/edit.
 *
 * Public API:  NeftDocx.exportPage(filename?)
 */
(function () {
  "use strict";
  const enc = new TextEncoder();

  // ── CRC32 (for zip entries) ──
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    let c = 0xffffffff;
    for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // ── Minimal STORE (no-compression) zip writer ──
  function u16(n) {
    return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
  }
  function u32(n) {
    return new Uint8Array([
      n & 0xff,
      (n >>> 8) & 0xff,
      (n >>> 16) & 0xff,
      (n >>> 24) & 0xff,
    ]);
  }
  function zipStore(files) {
    const parts = [];
    const central = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name);
      const data = f.data;
      const crc = crc32(data);
      const local = [
        u32(0x04034b50),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
      ];
      local.forEach((b) => parts.push(b));
      parts.push(name, data);
      const cd = [
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
      ];
      cd.forEach((b) => central.push(b));
      central.push(name);
      offset += 30 + name.length + data.length;
    }
    const cdStart = offset;
    let cdSize = 0;
    central.forEach((b) => (cdSize += b.length));
    const eocd = [
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(cdSize),
      u32(cdStart),
      u16(0),
    ];
    const all = parts.concat(central, eocd);
    let total = 0;
    all.forEach((b) => (total += b.length));
    const out = new Uint8Array(total);
    let p = 0;
    all.forEach((b) => {
      out.set(b, p);
      p += b.length;
    });
    return out;
  }

  // ── OOXML helpers ──
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  // block: {t: 'title'|'h1'|'h2'|'h3'|'p'|'bullet', text}
  function para(block) {
    const styles = {
      title: { sz: 40, b: true, color: "12355B", before: 0, after: 120 },
      h1: { sz: 32, b: true, color: "1FA6A2", before: 280, after: 100 },
      h2: { sz: 26, b: true, color: "12355B", before: 200, after: 60 },
      h3: { sz: 23, b: true, color: "21313F", before: 140, after: 40 },
      p: { sz: 22, b: false, color: "21313F", before: 0, after: 80 },
      bullet: { sz: 22, b: false, color: "21313F", before: 0, after: 40 },
    };
    const s = styles[block.t] || styles.p;
    const text = block.t === "bullet" ? "•  " + block.text : block.text;
    const ind = block.t === "bullet" ? '<w:ind w:left="360"/>' : "";
    const rpr = `<w:rPr>${s.b ? "<w:b/>" : ""}<w:sz w:val="${s.sz}"/><w:color w:val="${s.color}"/></w:rPr>`;
    return (
      `<w:p><w:pPr><w:spacing w:before="${s.before}" w:after="${s.after}"/>${ind}</w:pPr>` +
      `<w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`
    );
  }
  function documentXml(blocks) {
    const body = blocks.map(para).join("");
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      body +
      '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>' +
      '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
      "</w:body></w:document>"
    );
  }
  const CONTENT_TYPES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    "</Types>";
  const RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    "</Relationships>";

  function buildDocx(blocks) {
    return new Blob(
      [
        zipStore([
          { name: "[Content_Types].xml", data: enc.encode(CONTENT_TYPES) },
          { name: "_rels/.rels", data: enc.encode(RELS) },
          { name: "word/document.xml", data: enc.encode(documentXml(blocks)) },
        ]),
      ],
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    );
  }

  // ── DOM → blocks ──
  const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const SKIP = new Set(["SCRIPT", "STYLE", "SVG", "BUTTON", "NAV", "PATH"]);

  function walk(el, blocks) {
    for (const node of el.children) {
      const tag = node.tagName;
      if (
        SKIP.has(tag) ||
        node.classList.contains("print-bar") ||
        node.classList.contains("tab-bar")
      )
        continue;
      if (tag === "H2" || tag === "H3")
        blocks.push({ t: "h2", text: txt(node) });
      else if (tag === "H4" || tag === "H5")
        blocks.push({ t: "h3", text: txt(node) });
      else if (tag === "P") {
        const t = txt(node);
        if (t) blocks.push({ t: "p", text: t });
      } else if (tag === "UL" || tag === "OL") {
        node.querySelectorAll(":scope > li").forEach((li) => {
          const t = txt(li);
          if (t) blocks.push({ t: "bullet", text: t });
        });
      } else if (tag === "LI") {
        const t = txt(node);
        if (t) blocks.push({ t: "bullet", text: t });
      } else if (node.children.length) {
        walk(node, blocks);
      } else {
        const t = txt(node);
        if (t) blocks.push({ t: "p", text: t });
      }
    }
  }

  function extractBlocks() {
    const blocks = [];
    const h1 = document.querySelector("h1");
    if (h1) blocks.push({ t: "title", text: txt(h1) });
    const intro = document.querySelector(
      ".hero-copy, .page-intro, header p, .hero p",
    );
    if (intro && txt(intro)) blocks.push({ t: "p", text: txt(intro) });
    const panels = document.querySelectorAll(".tab-panel");
    if (panels.length) {
      panels.forEach((panel) => {
        const title = panel.getAttribute("data-print-title") || "";
        if (title) blocks.push({ t: "h1", text: title });
        walk(panel, blocks);
      });
    } else {
      const main = document.querySelector("main") || document.body;
      walk(main, blocks);
    }
    return blocks;
  }

  function sanitize(name) {
    return (name || "neft-resource")
      .replace(/[\\/:*?"<>|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  }
  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1500);
  }

  window.NeftDocx = {
    exportPage(filename) {
      const blocks = extractBlocks();
      if (!blocks.length) {
        alert("Nothing to export on this page.");
        return;
      }
      const base = sanitize(
        filename ||
          (document.querySelector("h1") &&
            document.querySelector("h1").textContent) ||
          document.title,
      );
      download(buildDocx(blocks), base + ".docx");
    },
    buildDocx,
    extractBlocks,
  };
})();

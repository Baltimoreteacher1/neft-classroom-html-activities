// The rich-text subset Book Studio stores. Everything typed, pasted, imported or opened from a shared link passes
// through `sanitizeHtml` before it is saved or rendered: an allow-list of tags, no attributes except a link's
// http(s) href, a colour swatch on <span data-c>, and a language/direction on <span lang dir>.
const ALLOWED = new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "UL",
  "OL",
  "LI",
  "H2",
  "H3",
  "A",
  "SPAN",
  "DIV",
]);
const DROP_WITH_CONTENT = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE",
  "NOSCRIPT",
  "SVG",
  "MATH",
  "HEAD",
  "TITLE",
  "META",
  "LINK",
]);
const COLOR = /^#[0-9a-f]{3,8}$/i;
const LANG = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

function cleanNode(node, doc) {
  const out = doc.createDocumentFragment();
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 3) {
      out.append(doc.createTextNode(child.nodeValue));
      continue;
    }
    if (child.nodeType !== 1) continue;
    const tag = child.tagName.toUpperCase();
    if (DROP_WITH_CONTENT.has(tag)) continue;
    const inner = cleanNode(child, doc);
    if (tag === "FONT") {
      // execCommand("foreColor") writes <font color>; keep the colour as a swatch span.
      const c = child.getAttribute("color") || colorFromStyle(child.getAttribute("style"));
      if (c && COLOR.test(c)) {
        const span = doc.createElement("span");
        span.setAttribute("data-c", c);
        span.append(inner);
        out.append(span);
      } else out.append(inner);
      continue;
    }
    if (!ALLOWED.has(tag)) {
      // Unknown block elements (Word's <o:p>, Google Docs' wrappers) keep their text as a paragraph break.
      if (/^(H1|H4|H5|H6|BLOCKQUOTE|SECTION|ARTICLE|TABLE|TR)$/.test(tag)) {
        const p = doc.createElement("p");
        p.append(inner);
        out.append(p);
      } else out.append(inner);
      continue;
    }
    const el = doc.createElement(
      tag === "DIV" ? "p" : tag === "STRONG" ? "b" : tag === "EM" ? "i" : tag.toLowerCase(),
    );
    if (tag === "A") {
      const href = child.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        el.setAttribute("href", href.slice(0, 500));
        el.setAttribute("rel", "noopener noreferrer");
        el.setAttribute("target", "_blank");
      }
    }
    if (tag === "SPAN") {
      const c = child.getAttribute("data-c") || colorFromStyle(child.getAttribute("style"));
      if (c && COLOR.test(c)) el.setAttribute("data-c", c);
      const lang = child.getAttribute("lang");
      if (lang && LANG.test(lang)) el.setAttribute("lang", lang);
      const dir = child.getAttribute("dir");
      if (dir === "rtl" || dir === "ltr") el.setAttribute("dir", dir);
      if (!el.attributes.length) {
        // A bare span adds nothing: keep only its contents (Word pastes hundreds of these).
        const bold = /font-weight:\s*(bold|[6-9]00)/i.test(child.getAttribute("style") || "");
        const italic = /font-style:\s*italic/i.test(child.getAttribute("style") || "");
        if (bold || italic) {
          const wrap = doc.createElement(bold ? "b" : "i");
          wrap.append(inner);
          out.append(wrap);
        } else out.append(inner);
        continue;
      }
    }
    el.append(inner);
    out.append(el);
  }
  return out;
}

function colorFromStyle(style) {
  const m = /(?:^|;)\s*color:\s*(#[0-9a-f]{3,8})/i.exec(style || "");
  return m ? m[1] : "";
}

/** Sanitize an HTML string to the stored subset. Works with any DOM implementation (browser or jsdom). */
export function sanitizeHtml(input, doc = globalThis.document) {
  const tpl = doc.createElement("template");
  tpl.innerHTML = String(input || "");
  const holder = doc.createElement("div");
  holder.append(cleanNode(tpl.content, doc));
  // Inline runs at the top level are wrapped into paragraphs so every text box is a sequence of blocks.
  const blocks = doc.createElement("div");
  let p = null;
  for (const n of [...holder.childNodes]) {
    const block = n.nodeType === 1 && /^(P|UL|OL|H2|H3)$/.test(n.tagName);
    if (block) {
      p = null;
      blocks.append(n);
    } else {
      if (!p) {
        p = doc.createElement("p");
        blocks.append(p);
      }
      p.append(n);
    }
  }
  for (const e of [...blocks.querySelectorAll("p")])
    if (!e.textContent.trim() && !e.querySelector("br")) e.remove();
  return blocks.innerHTML.slice(0, 12000);
}

/** Plain pasted text → paragraphs. */
export function textToParagraphs(text, doc = globalThis.document) {
  const div = doc.createElement("div");
  for (const para of String(text || "")
    .replace(/\r/g, "")
    .split(/\n{2,}/)) {
    const p = doc.createElement("p");
    para.split("\n").forEach((line, i) => {
      if (i) p.append(doc.createElement("br"));
      p.append(doc.createTextNode(line));
    });
    div.append(p);
  }
  return div.innerHTML;
}

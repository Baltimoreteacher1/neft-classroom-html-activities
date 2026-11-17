/*
 * Stacked fractions on the family homework pages and the Learning Lab (/math/studio/<lesson>/): "7/2" is drawn as 7 over 2, and "2 1/4" as 2 and a stacked 1/4,
 * in every problem, choice, hint and explanation (Joel, 2026-11-17: "Fractions should be vertical").
 *
 * Text nodes are rewritten in place, including content the page renders later (a MutationObserver), so no
 * generator has to know about it. The slash stays in the DOM, visually hidden, so textContent (which the
 * answer checks and the read-aloud use) still reads "7/2". Inputs, drawings (SVG), code and anything marked
 * data-no-frac are left alone. A slash between dates or words, or a run like 1/2/3, is not a fraction.
 */
(() => {
  const FRACTION = /(^|[^\w/.])(\d{1,4})\/(\d{1,4})(?![\w/])/g;
  const SKIP = new Set([
    "SCRIPT",
    "STYLE",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
    "CODE",
    "PRE",
    "TITLE",
    "NOSCRIPT",
  ]);

  // Live models rewrite their own readouts in place; replacing those nodes would leave them updating detached copies.
  const LIVE = "[data-mission-stage], .ms-model, [data-no-frac]";

  function skipped(el) {
    if (el?.closest?.(LIVE)) return true;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      if (SKIP.has(node.nodeName) || node.namespaceURI === "http://www.w3.org/2000/svg")
        return true;
      if (
        node.classList.contains("hw-frac") ||
        node.isContentEditable ||
        node.hasAttribute("data-no-frac")
      )
        return true;
    }
    return false;
  }

  function fractionNode(num, den) {
    const frac = document.createElement("span");
    frac.className = "hw-frac";
    const top = document.createElement("span");
    top.className = "hw-frac-num";
    top.textContent = num;
    const slash = document.createElement("span");
    slash.className = "hw-frac-slash";
    slash.textContent = "/";
    const bottom = document.createElement("span");
    bottom.className = "hw-frac-den";
    bottom.textContent = den;
    frac.append(top, slash, bottom);
    return frac;
  }

  function typesetText(node) {
    const text = node.nodeValue;
    if (!text || text.indexOf("/") < 0) return;
    FRACTION.lastIndex = 0;
    if (!FRACTION.test(text)) return;
    if (skipped(node.parentElement)) return;
    FRACTION.lastIndex = 0;
    const out = document.createDocumentFragment();
    let last = 0;
    let match = FRACTION.exec(text);
    while (match) {
      const start = match.index + match[1].length;
      out.append(text.slice(last, start), fractionNode(match[2], match[3]));
      last = start + match[2].length + 1 + match[3].length;
      match = FRACTION.exec(text);
    }
    out.append(text.slice(last));
    node.replaceWith(out);
  }

  // Drawings: a label made of numbers, symbols and short words gets its fractions stacked too, laid out with the
  // drawing kit's own width rule (assets/family-studio/picture-kit.mjs textW) around the label's anchor and baseline.
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SVG_FRACTION = /(\d{1,4})\/(\d{1,4})(?![\d/])/g;
  // Real text widths from an off-screen SVG using the label's own computed font (works for labels in hidden stops,
  // whose own getComputedTextLength is 0). Falls back to the drawing kit's 0.58em-per-character rule.
  let ruler = null;
  function measure(str, font) {
    try {
      if (!ruler) {
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("style", "position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;visibility:hidden");
        ruler = document.createElementNS(SVG_NS, "text");
        svg.append(ruler);
        document.body.append(svg);
      }
      ruler.setAttribute("style", `font:${font}`);
      ruler.textContent = str;
      return ruler.getComputedTextLength();
    } catch {
      return 0;
    }
  }
  let fontOf = "";
  let labelFill = "currentColor";
  const charW = (str, size) => {
    const css = fontOf.replace(/\b\d+(\.\d+)?px\b/, `${size}px`);
    return measure(str, css) || str.length * size * 0.58;
  };
  function svgText(proto, x, y, str, size, anchor) {
    const t = document.createElementNS(SVG_NS, "text");
    for (const a of proto.attributes) if (!/^(x|y|dx|dy|text-anchor|style)$/.test(a.name)) t.setAttribute(a.name, a.value);
    t.setAttribute("x", x.toFixed(1));
    t.setAttribute("y", y.toFixed(1));
    t.setAttribute("text-anchor", anchor);
    // The label's resolved colour, set directly: a drawing's CSS may colour labels through a child selector
    // (svg > text) that no longer matches once the pieces sit inside a group.
    t.setAttribute("style", `${proto.getAttribute("style") || ""};font-size:${size.toFixed(1)}px;fill:${labelFill}`);
    t.textContent = str;
    return t;
  }
  function stackSvgLabel(el) {
    if (el.childElementCount || el.closest(LIVE)) return;
    const str = el.textContent;
    SVG_FRACTION.lastIndex = 0;
    if (!str || !SVG_FRACTION.test(str)) return;
    const cs = getComputedStyle(el);
    labelFill = cs.fill && cs.fill !== "none" ? cs.fill : "currentColor";
    const size = parseFloat(cs.fontSize) || 14;
    fontOf = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const f = Math.max(12, Math.round(size * 0.8));
    const parts = str.split(/(\d{1,4}\/\d{1,4})(?![\d/])/).filter((p) => p !== "");
    const isFrac = (p) => /^\d{1,4}\/\d{1,4}$/.test(p);
    const widthOf = (p) => {
      if (isFrac(p)) {
        const [n, d] = p.split("/");
        return Math.max(charW(n, f), charW(d, f)) + 4;
      }
      const spaces = p.length - p.trim().length;
      return charW(p.trim(), size) + spaces * size * 0.28;
    };
    const total = parts.reduce((sum, p) => sum + widthOf(p), 0);
    const x = parseFloat(el.getAttribute("x")) || 0;
    const y = parseFloat(el.getAttribute("y")) || 0;
    const anchor = el.getAttribute("text-anchor") || getComputedStyle(el).textAnchor || "start";
    let cx = anchor === "middle" ? x - total / 2 : anchor === "end" ? x - total : x;
    const bar = y - 0.33 * size;
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "hw-svg-frac");
    g.setAttribute("aria-label", str);
    for (const p of parts) {
      const w = widthOf(p);
      if (isFrac(p)) {
        const [n, d] = p.split("/");
        const mid = cx + w / 2;
        g.append(svgText(el, mid, bar - 0.22 * f, n, f, "middle"));
        // The bar is a thin rect with the label's own class, so it paints in the label's (token) colour.
        const line = document.createElementNS(SVG_NS, "rect");
        // Same paint as the label: its class, or its own fill attribute (the older mini models colour labels that
        // way), so the bar is never the default black.
        for (const a of ["class", "fill-opacity", "opacity"])
          if (el.getAttribute(a)) line.setAttribute(a, el.getAttribute(a));
        line.style.fill = labelFill;
        line.setAttribute("x", (cx + 1).toFixed(1));
        line.setAttribute("y", (bar - 0.75).toFixed(1));
        line.setAttribute("width", Math.max(1, w - 2).toFixed(1));
        line.setAttribute("height", Math.max(1.4, size / 11).toFixed(1));
        g.append(line);
        g.append(svgText(el, mid, bar + 0.94 * f, d, f, "middle"));
      } else if (p.trim()) {
        const lead = (p.length - p.trimStart().length) * size * 0.28;
        g.append(svgText(el, cx + lead, y, p.trim(), size, "start"));
      }
      cx += w;
    }
    el.replaceWith(g);
  }
  function typesetSvg(root) {
    const scope = root.nodeType === 1 ? root : root.parentElement;
    if (!scope) return;
    const svgs = scope.matches?.("svg") ? [scope] : [...scope.querySelectorAll("svg")];
    const host = scope.closest?.("svg");
    if (host) svgs.push(host);
    for (const svg of svgs) svg.querySelectorAll("text").forEach(stackSvgLabel);
  }

  function typeset(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      if (root.parentElement?.closest("svg")) return typesetSvg(root.parentElement);
      return typesetText(root);
    }
    if (root.nodeType !== 1) return;
    if (root.namespaceURI === SVG_NS || root.closest?.("svg")) return typesetSvg(root);
    if (skipped(root)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode())
      if (n.nodeValue.indexOf("/") >= 0) nodes.push(n);
    nodes.forEach(typesetText);
    typesetSvg(root);
  }

  let pending = new Set();
  let scheduled = false;
  function flush() {
    scheduled = false;
    const roots = pending;
    pending = new Set();
    observer.disconnect();
    roots.forEach((r) => {
      if (r.isConnected) typeset(r);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") pending.add(r.target);
      else r.addedNodes.forEach((n) => pending.add(n));
    }
    if (!scheduled && pending.size) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  });

  // The stacked-fraction rules ride with this script instead of the render-blocking stylesheets, so the page's first
  // view does not grow (data/family-performance-budget.json). Same layer and tokens as assets/design/family/.
  const CSS =
    "@layer patterns{.hw-frac{position:relative;display:inline-flex;flex-direction:column;align-items:center;" +
    "vertical-align:middle;margin-inline:.12em;line-height:1.05;font-variant-numeric:lining-nums tabular-nums}" +
    ".hw-frac-num{padding-inline:.15em;padding-block-end:.06em;border-block-end:.09em solid currentColor}" +
    ".hw-frac-den{padding-block-start:.06em}.hw-frac-slash{position:absolute;inline-size:1px;block-size:1px;" +
    "overflow:hidden;clip-path:inset(50%);white-space:nowrap}" +
    // "Coming up next:" and the full worked example open on tap; a chevron says so (they read as plain text).
    ".hw-session-more>summary,.fp-example>summary.fp-label{gap:var(--fm-space-2)}" +
    ".fp-example>summary.fp-label{justify-content:space-between;margin:0;font-size:var(--fm-fs-md);letter-spacing:0;" +
    "text-transform:none;color:var(--fm-info-ink)}" +
    ".hw-session-more>summary::after,.fp-example>summary::after{content:'';flex:none;inline-size:.55rem;" +
    "block-size:.55rem;border:solid currentColor;border-width:0 3px 3px 0;transform:rotate(45deg) translate(-2px,-2px);" +
    "transition:transform var(--fm-dur-2) var(--fm-ease)}" +
    ".hw-session-more[open]>summary::after,.fp-example[open]>summary::after{transform:rotate(-135deg) translate(-2px,-2px)}}";
  function addStyle() {
    if (document.getElementById("hw-frac-style")) return;
    const style = document.createElement("style");
    style.id = "hw-frac-style";
    style.textContent = CSS;
    document.head.append(style);
  }

  function start() {
    addStyle();
    typeset(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.__hwTypesetFractions = typeset;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

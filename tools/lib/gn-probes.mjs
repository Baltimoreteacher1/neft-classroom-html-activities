// biome-ignore-all lint/correctness/noUndeclaredVariables: these functions run inside a book page, where PAGES, GATES and solved are the book's own globals
// In-page probes for tools/verify-gn-layer-browser.mjs. Each function is serialised into the page by
// Playwright, so it may only use its own arguments and browser globals.

/** Layout defects on whatever is on screen right now. Returns plain data. */
export function measure() {
  const OWNED = new Set([
    "cover",
    "hud",
    "stage",
    "prevBtn",
    "nextBtn",
    "live",
    "teacherModal",
    "workedModal",
    "gnPopup",
  ]);
  const external = (el) => {
    let n = el;
    while (n.parentElement && n.parentElement !== document.body) n = n.parentElement;
    return (
      n.parentElement === document.body &&
      !OWNED.has(n.id) &&
      !n.classList.contains("modal") &&
      n.tagName !== "SVG" &&
      n.tagName !== "svg"
    );
  };
  const shown = (el) => {
    const cs = getComputedStyle(el);
    return (
      el.getClientRects().length > 0 &&
      cs.visibility !== "hidden" &&
      cs.display !== "none" &&
      !el.closest("[hidden],.sr-only,.offscreen")
    );
  };
  const name = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}` : ""}`;
  const out = {
    hscroll: false,
    tiny: [],
    targets: [],
    clipped: [],
    bubbles: [],
    external: 0,
    svgTargets: 0,
  };
  const de = document.documentElement;
  out.hscroll = de.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1;

  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const p = n.parentElement;
    if (!p || !n.data.trim() || p.closest("svg,script,style,noscript") || !shown(p)) continue;
    if (external(p)) {
      out.external++;
      continue;
    }
    const size = parseFloat(getComputedStyle(p).fontSize);
    if (size < 12.99) {
      const k = `${name(p)}@${size.toFixed(1)}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.tiny.push(`${k} "${n.data.trim().slice(0, 24)}"`);
      }
    }
  }
  for (const el of document.querySelectorAll(
    "button,a[href],input:not([type=hidden]),select,textarea,[role=button],summary",
  )) {
    if (!shown(el) || external(el) || el.closest("svg") || el.classList.contains("gn-term")) {
      if (el.closest("svg") && shown(el)) {
        const q = el.getBoundingClientRect();
        if (q.width < 43.5 || q.height < 43.5) out.svgTargets++;
      }
      continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) {
      const k = `${name(el)} ${Math.round(r.width)}x${Math.round(r.height)}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.targets.push(k);
      }
    }
  }
  const pages = [...document.querySelectorAll("#pageL,#pageR")].filter(shown);
  for (const pg of pages) {
    const pr = pg.getBoundingClientRect();
    const inner = pg.querySelector(".page-inner");
    if (inner && inner.scrollWidth > inner.clientWidth + 2)
      out.clipped.push(`${name(pg)} scrolls sideways (${inner.scrollWidth}>${inner.clientWidth})`);
    for (const el of pg.querySelectorAll(".page-inner *")) {
      if (
        el.closest("svg") ||
        !shown(el) ||
        el.classList.contains("sfx") ||
        el.classList.contains("gatelockcorner")
      )
        continue;
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > pr.right + 1.5 || r.left < pr.left - 1.5))
        out.clipped.push(
          `${name(el)} outside page (${Math.round(r.left - pr.left)},${Math.round(r.right - pr.right)})`,
        );
    }
    for (const panel of pg.querySelectorAll(".panel")) {
      const cr = panel.getBoundingClientRect();
      for (const el of panel.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (
          !el.closest("svg") &&
          !el.classList.contains("sfx") &&
          r.width &&
          (r.bottom > cr.bottom + 1.5 || r.right > cr.right + 1.5)
        )
          out.clipped.push(`${name(el)} is clipped by its panel`);
      }
      const sr = (panel.querySelector("svg.scene") || panel).getBoundingClientRect();
      const art = [...panel.querySelectorAll("svg.scene use[href^='#sym-']")].map((u) => {
        const a = u.getBoundingClientRect();
        const left = Math.max(a.left, sr.left);
        const top = Math.max(a.top, sr.top);
        const right = Math.min(a.right, sr.right);
        const bottom = Math.min(a.bottom, sr.bottom);
        return {
          left,
          top,
          right,
          bottom,
          width: Math.max(0, right - left),
          height: Math.max(0, bottom - top),
        };
      });
      for (const b of panel.querySelectorAll(":scope > .balloon")) {
        const br = b.getBoundingClientRect();
        if (
          br.left < cr.left - 2 ||
          br.right > cr.right + 2 ||
          br.bottom > cr.bottom + 2 ||
          br.top < cr.top - 2
        )
          out.bubbles.push(`bubble outside its panel: "${b.textContent.trim().slice(0, 30)}"`);
        for (const a of art) {
          const ov =
            Math.max(0, Math.min(br.right, a.right) - Math.max(br.left, a.left)) *
            Math.max(0, Math.min(br.bottom, a.bottom) - Math.max(br.top, a.top));
          if (a.width && a.height && ov / (a.width * a.height) > 0.14)
            out.bubbles.push(
              `bubble covers art ${Math.round((100 * ov) / (a.width * a.height))}%: "${b.textContent.trim().slice(0, 30)}"`,
            );
        }
      }
    }
  }
  return out;
}

/** Cover geometry: title block, banner and footer against the card and the characters. */
export function measureCover() {
  const card = document.getElementById("coverCard").getBoundingClientRect();
  const r = (s) => document.querySelector(s)?.getBoundingClientRect();
  const title = r("#coverTitle");
  const vol = r("#coverTitle .vol");
  const foot = r("#coverBottom");
  const issues = [];
  const inside = (box, label) => {
    if (
      box &&
      (box.left < card.left - 1 ||
        box.right > card.right + 1 ||
        box.top < card.top - 1 ||
        box.bottom > card.bottom + 1)
    )
      issues.push(`${label} leaves the card`);
  };
  for (const s of [
    "#coverTitle .series",
    "#coverTitle h1",
    "#coverTitle .vol",
    "#coverBottom span",
  ])
    for (const el of document.querySelectorAll(s)) inside(el.getBoundingClientRect(), s);
  if (title && foot && title.bottom > foot.top + 1)
    issues.push("title block overlaps footer block");
  const chars = [...document.querySelectorAll("#coverCard use[href^='#sym-']")]
    .filter((u) =>
      /maya|theo|zara|dev|mateo|andre|ada|nia|ivy|kai|leo/i.test(u.getAttribute("href")),
    )
    .map((u) => u.getBoundingClientRect());
  const hit = (a, b) =>
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  if (vol)
    for (const c of chars) if (hit(vol, c) > 4) issues.push("unit banner covers a character");
  let footText = 0;
  for (const el of document.querySelectorAll("#coverBottom span"))
    for (const c of chars) footText += hit(el.getBoundingClientRect(), c) > 4 ? 1 : 0;
  const wraps = vol
    ? Math.round(
        vol.height /
          parseFloat(getComputedStyle(document.querySelector("#coverTitle .vol")).lineHeight),
      )
    : 0;
  return {
    issues,
    bannerLines: wraps,
    footerOverCharacters: footText,
    titleHeight: Math.round(title?.height || 0),
    card: [Math.round(card.width), Math.round(card.height)],
  };
}

/** Text of every student-facing leaf on screen, in order (what Easy read may change). */
export function snapshot() {
  return [...document.querySelectorAll("#pageL,#pageR,#workedBody")].flatMap((r) =>
    [
      ...r.querySelectorAll(
        ".balloon,.caption,.gateprompt,.gatehint,.gatefeedback,.gatesolved,.workedsteps .st span",
      ),
    ].map((e) => e.textContent.replace(/\s+/g, " ").trim()),
  );
}

/** Try to solve one gate by feeding it the numbers its own code mentions. Returns "solved" | "unsolved" | "no-input". */
export function solveGate(id) {
  const m = document.querySelector(`.gatemount[data-gate="${id}"]`);
  if (!m || solved.has(id)) return solved.has(id) ? "solved" : "no-input";
  const G = GATES[id];
  const nums = [
    ...new Set([
      ...(String(G.render).match(/-?\d+(?:\.\d+)?/g) || []),
      ...(String(G.worked.a).match(/-?\d+(?:\.\d+)?/g) || []),
    ]),
  ].slice(0, 40);
  const cands = [...nums, ...nums.map((n) => String(-Number(n)))];
  const inputs = [...m.querySelectorAll("input.numin,input[type=text],input[type=number]")].filter(
    (i) => i.offsetParent,
  );
  const check = () => m.querySelector(".gatecheck:not(.askvex)")?.click();
  const fill = (el, v) => {
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const done = () => solved.has(id);
  const t0 = Date.now();
  if (inputs.length === 1) {
    for (const a of cands) {
      fill(inputs[0], a);
      check();
      if (done()) return "solved";
    }
  } else if (inputs.length === 2) {
    for (const a of cands)
      for (const b of cands) {
        if (Date.now() - t0 > 4000) return "unsolved";
        fill(inputs[0], a);
        fill(inputs[1], b);
        check();
        if (done()) return "solved";
      }
  } else if (!inputs.length) {
    for (const c of m.querySelectorAll("button.choicebtn,.token,.gp")) {
      c.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      check();
      if (done()) return "solved";
    }
    return "unsolved";
  }
  return done() ? "solved" : "unsolved";
}

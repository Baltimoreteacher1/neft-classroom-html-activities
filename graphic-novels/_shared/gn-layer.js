// biome-ignore-all lint/correctness/noUndeclaredVariables: VOLUME and prefs are the book's own script-scope globals, read behind typeof guards
/* Axiom City graphic novels: shared layer (loaded last by every book).
 *
 *   1. Vocabulary pop-ups   lesson words become tappable and open the same card the lessons use.
 *   2. Easy read switch     swaps STUDENT-FACING TEXT ONLY for simpler wording from #gn-easy.
 *   3. Formatting fixes     cover, HUD, phone layout, speech bubbles, text and tap-target floors.
 *
 * The engine is never edited. A MutationObserver re-applies 1 and 2 after every render.
 * Per-book data is embedded in the page (#gn-vocab, #gn-easy) by tools/inject-gn-layer.mjs, so a
 * book still reads offline. The pure functions below are also loaded by tools/gn-extract-text.mjs
 * (via `module.exports`) so the extraction keys and the runtime keys come from ONE implementation.
 */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module && module.exports) module.exports = api;
  else if (typeof document !== "undefined") {
    root.GNLayer = api;
    api.boot();
  }
})(typeof self !== "undefined" ? self : this, () => {
  "use strict";

  // ------------------------------------------------------------------ text keys (shared)
  const INLINE = new Set([
    "B",
    "I",
    "EM",
    "STRONG",
    "SPAN",
    "CODE",
    "SUP",
    "SUB",
    "A",
    "U",
    "SMALL",
    "MARK",
    "S",
    "BR",
    "WBR",
  ]);
  const KEEP = "[data-gn-m],button.askvex,button.gn-term";
  const SKIP =
    "svg,script,style,button,input,textarea,select,option,[data-gn-skip],#teacherModal,#hud,#cover,#gnPopup,#live,.sr-only,.gn-seg";
  const TITLE =
    "h1,h2,h3,h4,h5,h6,.splashtitle,.kicker,.sfx,.chapterband,.pagefoot,.who,.stamp,.gicon,.certbadges";
  const LABEL_TEXT = /^[\s\p{Extended_Pictographic}‍️]*$/u;

  /** Collapse whitespace; the one normalization used by the extractor and the runtime. */
  const normalizeKey = (s) => String(s).replace(/\s+/g, " ").trim();

  function textOf(node) {
    if (node.nodeType === 3) return node.data;
    if (node.nodeType !== 1 || node.matches(KEEP)) return "";
    if (node.tagName === "BR" || node.tagName === "WBR") return " ";
    let out = "";
    for (const c of node.childNodes) out += textOf(c);
    return out;
  }

  function inlineOnly(el) {
    for (const c of el.childNodes) {
      if (c.nodeType === 3 || c.nodeType === 8) continue;
      if (c.nodeType !== 1) return false;
      if (c.matches(KEEP)) continue;
      if (!INLINE.has(c.tagName) || !inlineOnly(c)) return false;
    }
    return true;
  }

  /** Number of leading label nodes (speaker name, SOLVED stamp, "Hint:") that never change. */
  function leadCount(el) {
    let n = 0;
    for (const c of el.childNodes) {
      const label =
        (c.nodeType === 3 && LABEL_TEXT.test(c.data)) ||
        (c.nodeType === 1 && c.matches(".who,.stamp,b.n")) ||
        (c.nodeType === 1 &&
          c.tagName === "B" &&
          el.classList.contains("gatehint") &&
          /^Hint( \d)?:$/.test(c.textContent.trim()));
      if (!label) break;
      n++;
    }
    return n;
  }

  function serialize(el, nodes) {
    const box = el.ownerDocument.createElement("div");
    for (const n of nodes)
      if (!(n.nodeType === 1 && n.matches("[data-gn-m],button.askvex")))
        box.append(n.cloneNode(true));
    return box.innerHTML;
  }

  /** The text-leaf description Easy mode works on, or null when `el` is not a replaceable leaf. */
  function describe(el) {
    if (el.nodeType !== 1 || el.matches(SKIP) || el.closest(SKIP) || el.closest(TITLE)) return null;
    if (!inlineOnly(el)) return null;
    const kids = [...el.childNodes];
    const k = leadCount(el);
    const key = normalizeKey(kids.slice(k).map(textOf).join(""));
    if ((key.match(/\p{L}{2,}/gu) || []).length < 3) return null;
    return {
      el,
      key,
      leadHtml: serialize(el, kids.slice(0, k)),
      html: serialize(el, kids.slice(k)),
    };
  }

  /** Every replaceable text leaf under (or equal to) `rootEl`, in document order. */
  function collectLeaves(rootEl, out = []) {
    if (rootEl.nodeType !== 1 || rootEl.matches("svg,script,style")) return out;
    if (inlineOnly(rootEl)) {
      const d = describe(rootEl);
      if (d) out.push(d);
      return out;
    }
    for (const c of rootEl.children) collectLeaves(c, out);
    return out;
  }

  // ------------------------------------------------------------------ vocabulary matcher
  // Port of engine/core/vocab-match.js. tools/gn-layer.test.mjs asserts identical output.
  const SAFE_TERM_MOD = new Set(["prime", "composite", "rational", "irrational"]);
  const SAFE_PROP_MOD = new Set(["commutative", "associative", "distributive", "identity"]);
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function normSurface(s) {
    const t = String(s || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
    return /[^aeiou]ies$/.test(t) ? t.replace(/ies$/, "y") : t.replace(/s$/, "");
  }
  function surfacePattern(surface) {
    const words = String(surface).trim().split(/\s+/);
    const head = words.pop() || "";
    const hp = /[^aeiou]y$/i.test(head)
      ? `${esc(head.slice(0, -1))}(?:y|ies)`
      : `${esc(head)}(?:es|s)?`;
    return words.length ? `${words.map(esc).join("\\s+")}\\s+${hp}` : hp;
  }
  function buildMatcher(vocab) {
    const list = Array.isArray(vocab) ? vocab : [];
    const has = (v) => !!(v && (v.definition || v.definitionEs || v.visual || v.example));
    const entries = list
      .map((v, i) => ({ i, term: String((v && v.term) || "").trim() }))
      .filter((e) => (e.term.length > 2 || list[e.i]?.caseSensitive) && has(list[e.i]));
    if (!entries.length) return null;
    const lookup = new Map();
    for (const e of entries) {
      const key = normSurface(e.term);
      if (!lookup.has(key)) lookup.set(key, e.i);
    }
    const surfaces = entries.map((e) => ({ surface: e.term, i: e.i }));
    const alias = (surface, i) => {
      const s = String(surface || "").trim();
      if (s.length <= 2 || lookup.has(normSurface(s))) return;
      lookup.set(normSurface(s), i);
      surfaces.push({ surface: s, i });
    };
    for (const e of entries) {
      const v = list[e.i] || {};
      if (Array.isArray(v.aliases)) for (const a of v.aliases) alias(a, e.i);
      const w = e.term.split(/\s+/);
      if (w.length !== 2) continue;
      const mod = w[0].toLowerCase();
      if (/^numbers?$/i.test(w[1]) && SAFE_TERM_MOD.has(mod)) alias(w[0], e.i);
      if (/^propert(y|ies)$/i.test(w[1]) && SAFE_PROP_MOD.has(mod)) alias(w[0], e.i);
    }
    const alt = [...surfaces]
      .sort((a, b) => b.surface.length - a.surface.length)
      .map((s) => surfacePattern(s.surface))
      .join("|");
    const regexSource = `\\b(?:${alt})\\b`;
    const resolve = (surface) => {
      const idx = lookup.has(normSurface(surface)) ? lookup.get(normSurface(surface)) : -1;
      if (idx < 0) return -1;
      const v = list[idx];
      return v && v.caseSensitive && String(surface).replace(/(?:es|s)$/, "") !== String(v.term)
        ? -1
        : idx;
    };
    return { regexSource, lookup: Object.fromEntries(lookup), resolve };
  }

  // ------------------------------------------------------------------ runtime
  const VOCAB_EXCL =
    "#certificate,button,a[href],input,textarea,select,option,label,summary,script,style,svg,code,kbd,[contenteditable],[data-gn-skip],#gnPopup,#teacherModal,#hud,#cover,.gn-term,.gatefeedback,.gatesolved,.sr-only,#live," +
    TITLE;
  const IGNORE = "#gnPopup,#teacherModal,#hud,#cover,#live,.gn-seg";
  const PER_TERM = 2;
  const PER_PAGE = 8;

  function boot() {
    const doc = document;
    const readJson = (id, dflt) => {
      try {
        return JSON.parse(doc.getElementById(id).textContent);
      } catch (e) {
        return dflt;
      }
    };
    const vocab = readJson("gn-vocab", []);
    const easy = readJson("gn-easy", { v: 1, map: {} });
    const map = (easy && easy.map) || {};
    const hasEasy = Object.keys(map).length > 0;
    const matcher = buildMatcher(vocab);
    const state = new WeakMap(); // leaf element -> { lead, orig, easy }
    const live = (msg) => {
      const l = doc.getElementById("live");
      if (l) l.textContent = msg;
    };

    // ---- preference (same key style as the engine: ewl_axiom_<slug>_prefs) ----
    const slug = typeof VOLUME !== "undefined" && VOLUME && VOLUME.slug ? VOLUME.slug : "";
    const prefKey = `ewl_axiom_${slug}_prefs`;
    const readEasy = () => {
      try {
        return !!JSON.parse(localStorage.getItem(prefKey) || "{}").easy;
      } catch (e) {
        return false;
      }
    };
    const saveEasy = (on) => {
      try {
        if (typeof prefs !== "undefined" && prefs) prefs.easy = on;
        const cur = JSON.parse(localStorage.getItem(prefKey) || "{}");
        cur.easy = on;
        localStorage.setItem(prefKey, JSON.stringify(cur));
      } catch (e) {
        /* storage blocked: the switch still works for this visit */
      }
    };
    let easyOn = hasEasy && readEasy();

    const style = doc.createElement("style");
    style.id = "gn-layer-css";
    style.textContent = CSS;
    doc.head.append(style);
    doc.body.classList.add("gn-on");

    const mark = () => {
      const m = doc.createElement("span");
      m.setAttribute("data-gn-m", "");
      return m;
    };

    // ---- Easy read ----
    function paint(el, st, on) {
      const keep = [...el.children].filter((c) => c.matches("button.askvex"));
      el.innerHTML = st.lead + (on ? st.easy : st.orig);
      for (const k of keep) el.append(k);
      el.append(mark());
    }
    function applyEasy(rootEl) {
      for (const d of collectLeaves(rootEl)) {
        if (d.el.querySelector(":scope > [data-gn-m]")) continue;
        const easyHtml = map[d.key];
        if (easyHtml != null) {
          const st = { lead: d.leadHtml, orig: d.html, easy: easyHtml };
          state.set(d.el, st);
          if (easyOn) {
            paint(d.el, st, true);
            continue;
          }
        }
        d.el.append(mark());
      }
    }

    // ---- vocabulary underlining ----
    function underline(rootEl) {
      if (!matcher) return;
      const re = new RegExp(matcher.regexSource, "gi");
      const counts = new Map();
      const countsFor = (scope) => {
        if (!counts.has(scope)) {
          const c = { total: 0, per: new Map() };
          for (const b of scope.querySelectorAll(".gn-term")) {
            c.total++;
            c.per.set(b.dataset.gnIdx, (c.per.get(b.dataset.gnIdx) || 0) + 1);
          }
          counts.set(scope, c);
        }
        return counts.get(scope);
      };
      const walker = doc.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const p = n.parentElement;
          if (!p || !n.data.trim() || p.closest(VOCAB_EXCL)) return NodeFilter.FILTER_REJECT;
          re.lastIndex = 0;
          return re.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      const nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
      for (const node of nodes) {
        const c = countsFor(node.parentElement.closest(".page,.ts,#workedBody") || rootEl);
        const text = node.data;
        const frag = doc.createDocumentFragment();
        let last = 0;
        let any = false;
        re.lastIndex = 0;
        for (let m = re.exec(text); m; m = re.exec(text)) {
          const idx = matcher.resolve(m[0]);
          const used = c.per.get(String(idx)) || 0;
          if (idx < 0 || used >= PER_TERM || c.total >= PER_PAGE) continue;
          c.per.set(String(idx), used + 1);
          c.total++;
          any = true;
          frag.append(text.slice(last, m.index));
          const b = doc.createElement("button");
          b.type = "button";
          b.className = "gn-term";
          b.dataset.gnIdx = String(idx);
          b.setAttribute("aria-haspopup", "dialog");
          b.textContent = m[0];
          const tail = /^[.,;:!?)’”]+/.exec(text.slice(m.index + m[0].length));
          if (tail) {
            const glue = doc.createElement("span");
            glue.className = "gn-nowrap";
            glue.append(b, tail[0]);
            frag.append(glue);
            re.lastIndex = m.index + m[0].length + tail[0].length;
            last = re.lastIndex;
          } else {
            frag.append(b);
            last = m.index + m[0].length;
          }
        }
        if (!any) continue;
        frag.append(text.slice(last));
        node.replaceWith(frag);
      }
    }

    // ---- vocabulary pop-up (same card, classes and behaviour as the lessons' obj-popup) ----
    let pop = null;
    let lastFocus = null;
    let inerted = [];
    const popup = () => {
      if (pop) return pop;
      pop = doc.createElement("div");
      pop.id = "gnPopup";
      pop.className = "gn-popup-backdrop";
      pop.hidden = true;
      pop.innerHTML = `<div class="gn-popup" role="dialog" aria-modal="true" aria-labelledby="gnPopupTerm">
        <button type="button" class="gn-popup-close" aria-label="Close">&times;</button>
        <h3 id="gnPopupTerm" class="gn-popup-term"></h3>
        <p class="gn-popup-translation"><span class="gn-popup-tr-label">Español:</span> <span class="gn-popup-tr-es" lang="es"></span></p>
        <p class="gn-popup-def"></p>
        <p class="gn-popup-def-es" lang="es"></p>
        <figure class="gn-popup-visual"><img class="gn-popup-img" alt="" role="button" tabindex="0" aria-label="Enlarge picture" aria-pressed="false"><figcaption class="gn-popup-example"></figcaption></figure>
      </div>`;
      doc.body.append(pop);
      pop.addEventListener("click", (e) => {
        if (e.target === pop) closePopup();
      });
      pop.querySelector(".gn-popup-close").addEventListener("click", closePopup);
      const img = pop.querySelector(".gn-popup-img");
      const zoom = () => {
        const on = !img.classList.contains("zoomed");
        img.classList.toggle("zoomed", on);
        img.setAttribute("aria-pressed", String(on));
      };
      img.addEventListener("click", zoom);
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          zoom();
        }
      });
      img.addEventListener("error", () => {
        img.hidden = true;
        syncFigure();
      });
      return pop;
    };
    const syncFigure = () => {
      const fig = pop.querySelector(".gn-popup-visual");
      const img = fig.querySelector("img");
      fig.hidden = img.hidden && fig.querySelector(".gn-popup-example").hidden;
    };
    function setText(sel, text) {
      const el = pop.querySelector(sel);
      el.textContent = text || "";
      el.hidden = !text;
      return el;
    }
    function openPopup(idx, opener) {
      const v = vocab[idx];
      if (!v) return;
      popup();
      const term = String(v.term || "").trim();
      const title = v.expandsTo ? `${term} — ${String(v.expandsTo).trim()}` : term;
      pop.querySelector(".gn-popup-term").textContent = title;
      setText(".gn-popup-tr-es", v.termEs);
      pop.querySelector(".gn-popup-translation").hidden = !v.termEs;
      setText(".gn-popup-def", v.definition);
      setText(".gn-popup-def-es", v.definitionEs);
      setText(".gn-popup-example", v.visual);
      const img = pop.querySelector(".gn-popup-img");
      img.classList.remove("zoomed");
      img.setAttribute("aria-pressed", "false");
      if (v.img) {
        img.src = v.img;
        img.alt = `Illustration of ${title}${v.definition ? `: ${v.definition}` : ""}`;
        img.hidden = false;
      } else {
        img.removeAttribute("src");
        img.alt = "";
        img.hidden = true;
      }
      syncFigure();
      lastFocus = opener || doc.activeElement;
      inerted = [...doc.body.children].filter(
        (n) => n !== pop && n.tagName !== "SCRIPT" && !n.inert,
      );
      for (const n of inerted) n.inert = true;
      pop.hidden = false;
      doc.body.classList.add("gn-popup-open");
      pop.querySelector(".gn-popup-close").focus();
    }
    function closePopup() {
      if (!pop || pop.hidden) return;
      pop.hidden = true;
      doc.body.classList.remove("gn-popup-open");
      for (const n of inerted) n.inert = false;
      inerted = [];
      const back = lastFocus && lastFocus.isConnected ? lastFocus : doc.getElementById("stage");
      lastFocus = null;
      if (back && back.focus) back.focus();
    }
    doc.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest(".gn-term");
      if (b) {
        e.preventDefault();
        openPopup(Number(b.dataset.gnIdx), b);
      }
    });
    // Capture on window so the engine's own keydown handler (page turns) never sees keys meant for the dialog.
    window.addEventListener(
      "keydown",
      (e) => {
        if (!pop || pop.hidden) return;
        const img = pop.querySelector(".gn-popup-img");
        if (e.key === "Escape") {
          if (img.classList.contains("zoomed")) img.click();
          else closePopup();
        } else if (e.key === "Tab") {
          const f = [...pop.querySelectorAll("button,[tabindex='0']")].filter(
            (n) => !n.hidden && n.offsetParent,
          );
          const at = f.indexOf(doc.activeElement);
          const next = f[(at + (e.shiftKey ? f.length - 1 : 1)) % f.length];
          if (next) next.focus();
        } else if (e.key === " " || e.key === "Enter") {
          return;
        }
        e.stopImmediatePropagation();
        if (e.key === "Escape" || e.key === "Tab") e.preventDefault();
      },
      true,
    );

    // ---- Regular | Easy read switch ----
    function setMode(on, announce) {
      easyOn = !!on && hasEasy;
      for (const m of doc.querySelectorAll("[data-gn-m]")) {
        const st = m.parentElement && state.get(m.parentElement);
        if (st) paint(m.parentElement, st, easyOn);
      }
      underlineAll();
      for (const b of doc.querySelectorAll("[data-gn-mode]"))
        b.setAttribute("aria-pressed", String((b.dataset.gnMode === "easy") === easyOn));
      saveEasy(easyOn);
      if (announce)
        live(
          easyOn ? "Easy read on. The story and hints use simpler words." : "Regular reading on.",
        );
      mo.takeRecords();
      scheduleFit();
    }
    function buildSwitch() {
      const bar = doc.querySelector("#hud .hudbtns");
      if (!bar || !hasEasy || doc.querySelector(".gn-seg")) return;
      const seg = doc.createElement("div");
      seg.className = "gn-seg";
      seg.setAttribute("role", "group");
      seg.setAttribute("aria-label", "Reading level");
      seg.innerHTML =
        '<button type="button" class="hudbtn" data-gn-mode="regular">Regular</button><button type="button" class="hudbtn" data-gn-mode="easy">Easy read</button>';
      seg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-gn-mode]");
        if (b) setMode(b.dataset.gnMode === "easy", true);
      });
      bar.prepend(seg);
      for (const b of seg.children)
        b.setAttribute("aria-pressed", String((b.dataset.gnMode === "easy") === easyOn));
    }

    // ---- speech bubbles: stack under the art when they would cover it ----
    const overlap = (a, b) =>
      Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const area = (r) => Math.max(1, r.width * r.height);
    function fitPanel(panel) {
      panel.classList.remove("gn-stack");
      const balloons = [...panel.querySelectorAll(":scope > .balloon")];
      if (!balloons.length) return;
      const pr = panel.getBoundingClientRect();
      if (!pr.width) return;
      const rects = balloons.map((b) => b.getBoundingClientRect());
      const scene = panel.querySelector("svg.scene");
      const sr = scene ? scene.getBoundingClientRect() : pr;
      // Art hanging off the edge of the scene is clipped by it; only the visible part counts.
      const visible = (r) => {
        const left = Math.max(r.left, sr.left);
        const top = Math.max(r.top, sr.top);
        const right = Math.min(r.right, sr.right);
        const bottom = Math.min(r.bottom, sr.bottom);
        return { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
      };
      const art = [...panel.querySelectorAll("svg.scene use[href^='#sym-'],svg.scene text")].map(
        (n) => ({ r: visible(n.getBoundingClientRect()), t: n.tagName }),
      );
      const bad =
        rects.some(
          (r) =>
            r.left < pr.left - 2 ||
            r.right > pr.right + 2 ||
            r.top < pr.top - 2 ||
            r.bottom > pr.bottom + 2,
        ) ||
        rects.some((r, i) => rects.slice(i + 1).some((o) => overlap(r, o) > 16)) ||
        rects.some((r) =>
          art.some((a) => a.r.width && overlap(r, a.r) / area(a.r) > (a.t === "text" ? 0.3 : 0.14)),
        );
      if (bad) panel.classList.add("gn-stack");
    }
    let fitQueued = false;
    function scheduleFit() {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(() => {
        fitQueued = false;
        for (const p of doc.querySelectorAll("#pageL .panel,#pageR .panel")) fitPanel(p);
        mo.takeRecords();
      });
    }

    // ---- observe the engine ----
    function underlineAll() {
      for (const r of doc.querySelectorAll("#pageL,#pageR,.ts,#workedBody")) underline(r);
    }
    // Inline styles in the books set some labels below 13px; raise only those.
    function floorText(rootEl) {
      for (const n of [rootEl, ...rootEl.querySelectorAll("*")]) {
        if (n.closest("svg") || !Array.from(n.childNodes).some((c) => c.nodeType === 3 && c.data.trim())) continue;
        if (parseFloat(getComputedStyle(n).fontSize) < 12.99) n.style.fontSize = "13px";
      }
    }
    function process(el) {
      let top = el;
      while (
        top.parentElement &&
        top.parentElement !== doc.body &&
        inlineOnly(top.parentElement) &&
        !top.parentElement.matches(".page")
      )
        top = top.parentElement;
      applyEasy(top);
      underline(top);
    }
    const mo = new MutationObserver((recs) => {
      const roots = new Set();
      for (const r of recs) {
        if (r.type === "characterData") {
          if (r.target.parentElement) roots.add(r.target.parentElement);
          continue;
        }
        for (const n of r.addedNodes) roots.add(n.nodeType === 1 ? n : n.parentElement);
        if (r.target.nodeType === 1) roots.add(r.target);
      }
      for (const el of roots) {
        if (!el || !el.isConnected || el.closest("#gnPopup")) continue;
        floorText(el);
        if (!el.closest(IGNORE)) process(el);
      }
      mo.takeRecords();
      scheduleFit();
    });

    // ---- HUD height drives the stage padding on small screens ----
    const hud = doc.getElementById("hud");
    const hudSync = () => {
      if (hud && !hud.hidden)
        doc.documentElement.style.setProperty("--gn-hud-h", `${hud.offsetHeight}px`);
    };
    if (hud && typeof ResizeObserver !== "undefined") new ResizeObserver(hudSync).observe(hud);
    window.addEventListener("resize", () => {
      hudSync();
      scheduleFit();
    });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(scheduleFit);

    // The Ask-VEX worked example could only be left by answering it; give it a close button and Esc.
    const wm = doc.getElementById("workedModal");
    const wh = wm && wm.querySelector(".modalcard>header");
    if (wh && !wh.querySelector("[data-gn-close]")) {
      const x = doc.createElement("button");
      x.type = "button";
      x.className = "x";
      x.setAttribute("data-gn-close", "");
      x.setAttribute("aria-label", "Close worked example");
      x.textContent = "✕";
      x.addEventListener("click", () => wm.classList.remove("open"));
      wh.append(x);
    }
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wm && wm.classList.contains("open") && (!pop || pop.hidden)) wm.classList.remove("open");
    });

    buildSwitch();
    floorText(doc.body);
    process(doc.body);
    mo.observe(doc.body, { childList: true, subtree: true, characterData: true });
    scheduleFit();
    hudSync();
    return { setMode };
  }

  // ------------------------------------------------------------------ styles (scoped to body.gn-on)
  const CSS = `
body.gn-on .gn-term{display:inline;margin:0;padding:0;border:0;background:none;font:inherit;color:inherit;cursor:pointer;text-decoration:underline dotted 2px var(--teal,#1c8c8c);text-underline-offset:2px}
body.gn-on .gn-term:hover,body.gn-on .gn-term:focus-visible{text-decoration-style:solid;background:rgba(28,140,140,.14);border-radius:4px}
body.gn-on .gn-nowrap{white-space:nowrap}
body.gn-on .balloon.vex .gn-term{text-decoration-color:var(--amber,#F2C15B)}
.gn-popup-backdrop{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:flex-start;padding:18px;overflow-y:auto;overscroll-behavior:contain;background:rgba(15,23,42,.55)}
.gn-popup-backdrop[hidden]{display:none}
.gn-popup{position:relative;width:min(420px,100%);margin:auto;flex:0 0 auto;background:#fff;color:#1f2a44;border-radius:16px;box-shadow:0 18px 50px rgba(15,23,42,.3);padding:24px 20px 20px;text-align:center;font:400 1rem/1.5 'Segoe UI',system-ui,sans-serif}
.gn-popup-close{position:absolute;top:6px;right:8px;width:44px;height:44px;border:0;border-radius:50%;background:#f4f1ea;color:#1f2a44;font-size:1.6rem;line-height:1;cursor:pointer}
.gn-popup-term{margin:0 0 14px;color:#136f6c;text-transform:capitalize;font:900 1.35rem/1.2 'Segoe UI',system-ui,sans-serif;padding:0 36px}
.gn-popup-translation{display:flex;align-items:baseline;gap:10px;justify-content:center;margin:0 0 14px;padding:10px 14px;background:rgba(28,140,140,.12);border-radius:12px}
.gn-popup-translation[hidden]{display:none}
.gn-popup-tr-label{font-weight:600;color:#136f6c}
.gn-popup-tr-es{font-size:1.15rem;font-weight:500}
.gn-popup-visual{margin:14px 0 0}
.gn-popup-visual[hidden],.gn-popup-example[hidden],.gn-popup-def-es[hidden],.gn-popup-def[hidden]{display:none}
.gn-popup-img{display:block;width:100%;max-width:240px;height:auto;margin:0 auto 10px;cursor:zoom-in;border-radius:8px}
.gn-popup-img.zoomed{max-width:100%;cursor:zoom-out}
.gn-popup-img:focus-visible,.gn-popup-close:focus-visible{outline:3px solid #136f6c;outline-offset:2px}
.gn-popup-example{margin:0;padding:10px 14px;border:1px solid #e2e8f0;border-radius:12px;background:#f4f1ea;font-size:1.1rem;font-weight:500;line-height:1.6;text-align:left}
.gn-popup-def{margin:0;font-size:1.05rem}
.gn-popup-def-es{margin:10px 0 0;font-style:italic;color:#475569}
body.gn-popup-open{overflow:hidden}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]) .gn-popup{background:#17324d;color:#eaf2f7}
  :root:not([data-theme="light"]) .gn-popup-term,:root:not([data-theme="light"]) .gn-popup-tr-label{color:#7cf2ec}
  :root:not([data-theme="light"]) .gn-popup-close{background:#274a6a;color:#fff}
  :root:not([data-theme="light"]) .gn-popup-example{background:#0d1f33;border-color:#35587a}
  :root:not([data-theme="light"]) .gn-popup-def-es{color:#b5c8d6}
  :root:not([data-theme="light"]) .gn-popup-img{background:#fff}
}
body.hc .gn-popup{background:#fff;color:#000}
.gn-seg{display:flex;gap:0;border:1px solid #35587a;border-radius:8px;overflow:hidden}
.gn-seg .hudbtn{flex:1 1 auto;border:0;border-radius:0}
body.gn-on #coverCard .spine span{max-width:470px;overflow:hidden;text-overflow:ellipsis;letter-spacing:.14em}
.gn-seg .hudbtn+.hudbtn{border-left:1px solid #35587a}
/* ---- formatting: cover. The title block and the footer sit on their own scrims, never on the art. ---- */
body.gn-on #coverTitle{left:26px;right:0;top:0;padding:24px 18px 40px 12px;background:linear-gradient(180deg,rgba(7,16,26,.96) 0,rgba(7,16,26,.9) 60%,rgba(7,16,26,0))}
body.gn-on #coverTitle .vol{max-width:100%;white-space:normal;line-height:1.3;letter-spacing:.1em}
body.gn-on #coverBottom{left:26px;right:0;bottom:0;padding:44px 18px 14px 12px;gap:14px;background:linear-gradient(0deg,rgba(7,16,26,.97) 0,rgba(7,16,26,.92) 55%,rgba(7,16,26,0))}
body.gn-on #coverBottom span:last-child{text-align:right}
/* ---- formatting: text floor (13px) and tap targets (44px) ---- */
body.gn-on .pagefoot,body.gn-on .kicker,body.gn-on .balloon .who,body.gn-on .page .chapterband,body.gn-on #coverBottom,body.gn-on #coverTitle .vol,body.gn-on #coverCard .spine span,body.gn-on .hudbtn,body.gn-on #hud .brand,body.gn-on #hud .brand small,body.gn-on .beaker h4,body.gn-on .rt-table th,body.gn-on .tt th,body.gn-on .castcard h4,body.gn-on .castcard p,body.gn-on .journal h4,body.gn-on .caption.loc,body.gn-on .gatesolved,body.gn-on #holopadBtn,body.gn-on .hp-tab{font-size:max(.82rem,13px)}
body.gn-on .hudbtn,body.gn-on .modalcard .x{min-width:44px;min-height:44px}
body.gn-on .modalcard .x{width:44px;height:44px}
body.gn-on #hud .brand{white-space:normal}
body.gn-on #hud .brand small{letter-spacing:.1em}
body.gn-on .pagefoot{flex-wrap:wrap;gap:4px 12px;letter-spacing:.1em}
body.gn-on .pagefoot span:last-child{white-space:nowrap}
body.gn-on .page-inner{overscroll-behavior:contain}
body.gn-on .page-inner>*{flex-shrink:0}
body.gn-on #coverCard{container-type:inline-size}
@container (max-width:420px){body.gn-on #coverBottom{flex-direction:column;align-items:flex-start;gap:6px;letter-spacing:.06em}body.gn-on #coverBottom span:last-child{text-align:left}}
body.gn-on .panel{container-type:inline-size}
body.gn-on .gwidget{min-width:0}
body.gn-on .rt-table{table-layout:fixed}
body.gn-on .rt-table th,body.gn-on .rt-table td{padding:6px 4px;overflow-wrap:anywhere}
body.gn-on .numin{max-width:100%;min-width:0}
/* ---- formatting: speech bubbles move under the art when they would cover it (see fitPanel) ---- */
body.gn-on .panel.gn-stack .balloon{position:static!important;max-width:none!important;width:auto!important;margin:8px 10px 0!important;box-shadow:none}
body.gn-on .panel.gn-stack .balloon:last-of-type{margin-bottom:10px!important}
body.gn-on .panel.gn-stack .balloon::before,body.gn-on .panel.gn-stack .balloon::after{display:none}
/* ---- formatting: small screens. One page per view, HUD in normal rows, arrows out of the text. ---- */
@media (max-width:820px){
  body.gn-on #hud{flex-wrap:wrap;row-gap:4px;padding:6px 10px;background:rgba(7,14,22,.95)}
  body.gn-on #hud .brand{flex:1 1 150px;min-width:0}
  body.gn-on #badges{margin-left:0}
  body.gn-on #progress{order:3;flex:1 0 100%;margin:0;flex-wrap:nowrap;justify-content:center;gap:3px}
  body.gn-on #progress .dot{width:7px;height:7px}
  body.gn-on .hudbtns{order:4;flex:1 0 100%;margin:0;gap:6px;justify-content:space-between;flex-wrap:wrap}
  body.gn-on .hudbtns>.hudbtn,body.gn-on .gn-seg{flex:1 1 auto}
  body.gn-on .hudbtns>.hudbtn{padding:4px 6px}
  body.gn-on #motBtn{display:none}
  body.gn-on #stage{padding:calc(var(--gn-hud-h,64px) + 8px) 8px 64px}
  body.gn-on #book{width:100%;height:min(calc(100vh - var(--gn-hud-h,64px) - 80px),760px)}
  body.gn-on .navarrow{top:auto;bottom:10px;transform:none;width:56px;height:48px}
  body.gn-on .navarrow.shake{animation:none}
  body.gn-on #prevBtn{left:10px}
  body.gn-on #nextBtn{left:74px;right:auto}
  body.gn-on .page-inner{padding:14px 14px 10px}
  body.gn-on .balloon{max-width:92%}
  body.gn-on #cover{padding:12px 12px 16px;gap:16px}
}
`;

  return { normalizeKey, textOf, describe, collectLeaves, buildMatcher, normSurface, boot };
});

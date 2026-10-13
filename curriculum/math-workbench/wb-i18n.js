/* Math Workbench — Spanish interface (engine).
 *
 * One string table (wb-i18n-es.js: window.MWB_ES, English phrase -> Spanish) drives every
 * label, tooltip, panel, toast and help text. Switching language (the Español button, or
 * `mw_lang` on load) translates the page in place and keeps translating whatever the page
 * builds later (flyouts, Live Board panels, toasts) until it is switched back, at which
 * point every original string is restored exactly.
 *
 * What is never translated: anything a student wrote or built (the board, text boxes,
 * the Studio's own overlay, which has its own language switch), and math notation.
 * A string with no entry stays English — MWBI18n.missing() lists them for the gate.
 *
 *   MWBI18n.t(text)        -> Spanish when active and known, otherwise `text`
 *   MWBI18n.apply("es"|"en")
 *   MWBI18n.lang()
 *   MWBI18n.missing()      -> English strings currently visible with no entry */
(function (root) {
  "use strict";
  const doc = root.document;
  if (root.MWBI18n) return;

  const TABLE = root.MWB_ES || {};
  const PATTERNS = root.MWB_ES_PATTERNS || [];
  const ATTRS = ["title", "aria-label", "placeholder", "label", "alt"];
  const SKIP =
    "#overlay, #board, #bgLayer, textarea, script, style, noscript, .mwr-overlay, #portfolioView, #ggbCalc, .wbx-print-value, [data-no-i18n], .formula-card .fc-name, .formula-card .fc-eq, .formula-card .fc-note, .formula-card .ref-visual-caption, .cat-name";
  const PHRASE_TAGS = "b,i,em,strong,small,span,kbd,code,br,sub,sup,u";

  let current = "en";
  let observer = null;
  const textRec = new WeakMap();
  const htmlRec = new WeakMap();
  const attrRec = new WeakMap();

  const norm = (s) =>
    String(s == null ? "" : s)
      .replace(/\s+/g, " ")
      .trim();

  function lookup(key) {
    if (!key) return null;
    if (Object.hasOwn(TABLE, key)) return TABLE[key];
    for (const [re, fn] of PATTERNS) {
      const m = re.exec(key);
      if (m) {
        const out = fn(...m);
        if (out) return out;
      }
    }
    return null;
  }

  function t(text) {
    if (current !== "es") return text;
    const hit = lookup(norm(text));
    return hit == null ? text : hit;
  }

  /* t() with {name} placeholders: MWBI18n.f("Page {n} added", { n: 2 }). */
  function f(template, vars) {
    const text = current === "es" ? t(template) : template;
    return text.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m));
  }

  const skipped = (el) => !!(el.closest && el.closest(SKIP));

  /* ---- text nodes -------------------------------------------------------------- */
  function doText(node, restore) {
    const rec = textRec.get(node);
    if (restore) {
      if (rec && node.nodeValue === rec.es) node.nodeValue = rec.en;
      textRec.delete(node);
      return;
    }
    if (rec && node.nodeValue === rec.es) return;
    const raw = node.nodeValue;
    const key = norm(raw);
    if (!key || !/[A-Za-z]{2}/.test(key)) return;
    const es = lookup(key);
    if (es == null) return;
    const lead = /^\s*/.exec(raw)[0];
    const tail = /\s*$/.exec(raw)[0];
    const next = lead + es + tail;
    textRec.set(node, { en: raw, es: next });
    node.nodeValue = next;
  }

  /* ---- attributes -------------------------------------------------------------- */
  function doAttrs(el, restore) {
    for (const name of ATTRS) {
      if (!el.hasAttribute || !el.hasAttribute(name)) continue;
      const recs = attrRec.get(el) || {};
      const rec = recs[name];
      const value = el.getAttribute(name);
      if (restore) {
        if (rec && value === rec.es) el.setAttribute(name, rec.en);
        if (rec) delete recs[name];
        continue;
      }
      if (rec && value === rec.es) continue;
      const es = lookup(norm(value));
      if (es == null) continue;
      recs[name] = { en: value, es };
      attrRec.set(el, recs);
      el.setAttribute(name, es);
    }
  }

  /* ---- phrase elements (text with <b>, <small>… inside) ------------------------- */
  function isPhrase(el) {
    return el.children.length > 0 && !el.querySelector(`:not(${PHRASE_TAGS})`);
  }
  function doPhrase(el, restore) {
    const rec = htmlRec.get(el);
    if (restore) {
      if (rec && el.innerHTML === rec.es) el.innerHTML = rec.en;
      htmlRec.delete(el);
      return false;
    }
    if (rec && el.innerHTML === rec.es) return true;
    const es = lookup(norm(el.innerHTML));
    if (es == null) return false;
    htmlRec.set(el, { en: el.innerHTML, es });
    el.innerHTML = es;
    return true;
  }

  function walk(node, restore) {
    if (node.nodeType === 3) {
      if (node.parentElement && !skipped(node.parentElement)) doText(node, restore);
      return;
    }
    if (node.nodeType !== 1 || skipped(node)) return;
    if (isPhrase(node) && doPhrase(node, restore)) {
      doAttrs(node, restore);
      return;
    }
    doAttrs(node, restore);
    for (const child of [...node.childNodes]) walk(child, restore);
  }

  function setTitle(restore) {
    if (restore) {
      if (doc.documentElement.dataset.wbxTitle) doc.title = doc.documentElement.dataset.wbxTitle;
      return;
    }
    doc.documentElement.dataset.wbxTitle = doc.documentElement.dataset.wbxTitle || doc.title;
    const es = lookup(norm(doc.documentElement.dataset.wbxTitle));
    if (es) doc.title = es;
  }

  /* ---- keep translating what the page builds later ------------------------------- */
  const pending = new Set();
  let scheduled = false;
  function flush() {
    scheduled = false;
    const nodes = [...pending];
    pending.clear();
    if (current !== "es") return;
    for (const n of nodes) if (n.isConnected) walk(n, false);
  }
  function enqueue(node) {
    pending.add(node);
    if (!scheduled) {
      scheduled = true;
      root.requestAnimationFrame(flush);
    }
  }
  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList") r.addedNodes.forEach((n) => enqueue(n));
        else if (r.type === "characterData") enqueue(r.target);
        else if (r.type === "attributes") enqueue(r.target);
      }
    });
    observer.observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
  }
  function stopObserver() {
    if (observer) observer.disconnect();
    observer = null;
    pending.clear();
  }

  function apply(lang) {
    const next = lang === "es" ? "es" : "en";
    if (next === current && !(next === "es" && !observer)) return;
    if (next === "es") {
      current = "es";
      doc.documentElement.lang = "es";
      setTitle(false);
      walk(doc.body, false);
      startObserver();
    } else {
      stopObserver();
      current = "en";
      doc.documentElement.lang = "en";
      setTitle(true);
      walk(doc.body, true);
    }
  }

  /* ---- gate support: what is visible but has no entry --------------------------- */
  function missing() {
    const out = new Set();
    const spanish = new Set(Object.values(TABLE).map(norm));
    // Strings the board modules already localised themselves (MWB.t in wb-core.js).
    if (root.MWB && root.MWB.esSeen) for (const es of root.MWB.esSeen) spanish.add(norm(es));
    const consider = (raw) => {
      const key = norm(raw);
      if (!key || !/[A-Za-z]{3}/.test(key) || /^[A-Z0-9 ]{2,8}$/.test(key)) return;
      if (lookup(key) == null && !spanish.has(key)) out.add(key);
    };
    const scan = (node) => {
      if (node.nodeType === 3) {
        const el = node.parentElement;
        if (el && !skipped(el) && el.getClientRects().length) {
          const rec = textRec.get(node);
          if (!rec) consider(node.nodeValue);
        }
        return;
      }
      if (node.nodeType !== 1 || skipped(node)) return;
      // A mixed-content element is translated whole only when the table has its exact
      // markup; otherwise its pieces are translated (and reported) one by one.
      if (isPhrase(node) && (htmlRec.get(node) || lookup(norm(node.innerHTML)) != null)) return;
      for (const name of ATTRS) {
        if (node.hasAttribute(name) && !(attrRec.get(node) || {})[name])
          consider(node.getAttribute(name));
      }
      node.childNodes.forEach(scan);
    };
    scan(doc.body);
    return [...out].sort();
  }

  root.MWBI18n = Object.freeze({ t, f, apply, lang: () => current, missing, lookup });

  function boot() {
    let want = "en";
    try {
      want = root.localStorage.getItem("mw_lang") === "es" ? "es" : "en";
    } catch (_) {}
    if (want === "es") apply("es");
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);

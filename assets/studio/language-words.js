/**
 * Practice Studio language layer, part 4: the words (window.StudioLangWords).
 *
 *   Word bank        the lesson's glossary grows to the math terms its problems actually use (data.lang.wb, built by the generator from
 *                    the stems), each with a plain definition in both languages and, for concrete terms, a picture (data.lang.pic,
 *                    drawn by StudioViz).
 *   Words in this problem   up to four tap-to-open chips under a stem: the term, its Español, a definition, a picture when there is one.
 *   Cognate cues     green = the word is nearly the same in Español (a check mark and the Spanish word, never colour alone);
 *                    amber = a trap, with a one-line note. Only ONE amber note is ever shown in a lesson at a time; "Got it" moves to the next.
 *
 * Data is per lesson in data/practice-studio/language-layer.json (cog, pic, frL), merged with the stems by
 * scripts/lib/practice-studio-language.mjs. Pure logic: language-core.js. Nothing here is timed or graded.
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioLangWords) return;
  const Core = W.StudioLangCore;
  const L = () => W.StudioLanguage;
  if (!Core) return;
  const RT = (W.StudioRT = W.StudioRT || {});
  const esc = (/** @type {any} */ s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
    );
  const bi = (/** @type {string} */ en, /** @type {string} */ sp) =>
    `<span class="t-en">${esc(en)}</span><span class="t-es" lang="es">${esc(sp)}</span>`;
  const data = () => RT.api?.data?.lang || {};
  const bank = () => /** @type {any[]} */ (data().wb || []);
  const cogs = () => /** @type {any[]} */ (data().cog || []);
  const MAX_CHIPS = 4;

  const key = (/** @type {any} */ t) =>
    String(t ?? "")
      .trim()
      .toLowerCase();
  const cogOf = (/** @type {string} */ term) => cogs().find((c) => key(c.en) === key(term));
  const amberNow = () => Core.pickAmber(cogs(), L().seenAmber());
  const picOf = (/** @type {string} */ term) => {
    const spec = data().pic?.[key(term)];
    if (!spec || !W.StudioViz) return "";
    try {
      return `<div class="lang-pic">${W.StudioViz.render(spec)}</div>`;
    } catch (_e) {
      return "";
    }
  };
  /** The cognate mark for a term: a green check with the Spanish word, an amber caution only for the one amber in view. */
  function markHtml(/** @type {string} */ term) {
    const c = cogOf(term);
    if (!c) return "";
    if (c.kind === "true")
      return `<span class="lang-cogmark lang-cogmark-true"><span aria-hidden="true">✓</span> ${bi("Same word in Español", "Casi igual en español")}: <span lang="es">${esc(c.es)}</span></span>`;
    const now = amberNow();
    if (now && now.en === c.en)
      return `<span class="lang-cogmark lang-cogmark-trap"><span aria-hidden="true">⚠</span> ${bi("Careful", "Ojo")}: ${esc(c.note)}<span class="lang-es-inline" lang="es">${esc(c.noteEs)}</span></span>`;
    return "";
  }
  const entryHtml = (/** @type {any} */ g) =>
    `<dt data-wb>${esc(g.t)}<span class="es-text" lang="es">${esc(g.tEs)}</span></dt><dd>${esc(g.d)}<span class="es-text" lang="es">${esc(g.dEs)}</span>${picOf(g.t)}${markHtml(g.t) ? `<span class="lang-cogline">${markHtml(g.t)}</span>` : ""}</dd>`;

  /* ---- the word bank ---------------------------------------------------------------------------------------------------- */
  const scopeBtn = `<button type="button" class="tool-btn lang-tool lang-tool-es" data-lang-all aria-pressed="false">🌐 ${bi("Show Español", "Mostrar español")}</button>`;
  function expandBank() {
    const gl = /** @type {HTMLElement|null} */ (document.querySelector(".glossary"));
    const dl = gl?.querySelector("dl");
    if (!gl || !dl) return;
    const have = new Set([...dl.querySelectorAll("dt")].map((d) => key(d.firstChild?.textContent)));
    for (const g of bank()) {
      if (!g?.t || have.has(key(g.t))) continue;
      dl.insertAdjacentHTML("beforeend", entryHtml(g));
      have.add(key(g.t));
    }
    // the first four entries are static markup: give them their picture and cognate line too
    for (const dt of dl.querySelectorAll("dt:not([data-wb])")) {
      const dd = dt.nextElementSibling;
      const term = dt.firstChild?.textContent || "";
      if (!dd || dd.querySelector(".lang-pic, .lang-cogline")) continue;
      const g = bank().find((x) => key(x.t) === key(term));
      dd.insertAdjacentHTML(
        "beforeend",
        `${picOf(term)}${markHtml(term) ? `<span class="lang-cogline">${markHtml(term)}</span>` : ""}`,
      );
      void g;
    }
    const n = dl.querySelectorAll("dt").length;
    const count = gl.querySelector(".wb-count");
    if (count)
      count.innerHTML = bi(
        `${n} ${n === 1 ? "word" : "words"}`,
        `${n} ${n === 1 ? "palabra" : "palabras"}`,
      );
    if (!gl.querySelector("[data-lang-all]"))
      dl.insertAdjacentHTML("beforebegin", `<p class="lang-gloss-tools">${scopeBtn}</p>`);
    // the mission and the section strips keep their Español behind one tap in tap mode
    for (const host of document.querySelectorAll(".mission-body, .topic-strip > div"))
      if (!host.querySelector("[data-lang-all]")) host.insertAdjacentHTML("beforeend", scopeBtn);
  }

  /* ---- words in this problem ------------------------------------------------------------------------------------------- */
  const termList = () =>
    bank()
      .flatMap((g) => [g.t])
      .filter(Boolean);
  function markCognates(/** @type {Element} */ root) {
    const trues = cogs().filter((c) => c.kind === "true");
    if (!trues.length) return;
    const walker = document.createTreeWalker(root, 4);
    /** @type {Text[]} */
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode())
      if (
        !(
          /** @type {Text} */ (n).parentElement?.closest(
            ".es-text, .frac, .sr-only, .lang-cog, .lang-qmark",
          )
        )
      )
        nodes.push(/** @type {Text} */ (n));
    const done = new Set();
    for (const t of nodes) {
      if (done.size >= 2) break;
      const hit = Core.findTerms(
        t.data,
        trues.map((c) => c.en).filter((e) => !done.has(key(e))),
      )[0];
      if (!hit) continue;
      const m = new RegExp(
        `(?<![\\p{L}\\p{N}])${hit.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:es|s)?(?![\\p{L}\\p{N}])`,
        "iu",
      ).exec(t.data);
      if (!m) continue;
      done.add(key(hit.term));
      const mid = t.splitText(m.index);
      mid.splitText(m[0].length);
      const sp = document.createElement("span");
      sp.className = "lang-cog";
      mid.replaceWith(sp);
      sp.append(m[0]);
    }
  }
  function chipsHtml(/** @type {string[]} */ found) {
    return `<div class="lang-words" role="group" aria-label="Words in this problem">
      <span class="lang-words-label">${bi("Words in this problem:", "Palabras en este problema:")}</span>
      ${found
        .map((t) => {
          const g = bank().find((x) => key(x.t) === key(t));
          const c = cogOf(t);
          return `<button type="button" class="lang-chip${c?.kind === "true" ? " lang-chip-cog" : ""}" data-lang-chip="${esc(t)}" aria-expanded="false">${esc(g?.t || t)}${c?.kind === "true" ? ' <span aria-hidden="true">✓</span>' : ""}</button>`;
        })
        .join("")}
      <div class="lang-gloss" hidden aria-live="polite"></div></div>`;
  }
  function amberHtml(/** @type {string} */ text) {
    const a = amberNow();
    if (!a || !Core.findTerms(text, [a.en]).length) return "";
    return `<p class="lang-amber" role="note"><span aria-hidden="true">⚠</span> <strong>${bi("Careful:", "Ojo:")}</strong> ${esc(a.note)}<span class="lang-es-inline" lang="es">${esc(a.noteEs)}</span> <button type="button" class="btn btn-sm" data-lang-got="${esc(a.en)}">${bi("Got it", "Entendido")}</button></p>`;
  }
  function decorate(
    /** @type {number} */ _tab,
    /** @type {any} */ it,
    /** @type {HTMLElement} */ host,
    /** @type {HTMLElement} */ _stage,
  ) {
    expandBank();
    host.querySelector(".lang-words")?.remove();
    host.querySelector(".lang-amber")?.remove();
    const q = /** @type {HTMLElement|null} */ (host.querySelector(".item-q"));
    if (!q) return;
    const text = `${it.q ?? it.p ?? ""} ${it.ctx ?? ""}`;
    const found = Core.findTerms(text, termList())
      .slice(0, MAX_CHIPS)
      .map((f) => f.term);
    markCognates(q);
    const after = host.querySelector(".lang-need") || q;
    const amber = amberHtml(text);
    const chips = found.length && L().settings().chips ? chipsHtml(found) : "";
    if (chips || amber) after.insertAdjacentHTML("afterend", `${chips}${amber}`);
  }

  /* ---- taps ------------------------------------------------------------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const chip = /** @type {HTMLElement|null} */ (t?.closest("[data-lang-chip]"));
    if (chip) {
      const box = /** @type {HTMLElement|null} */ (chip.closest(".lang-words"));
      const gloss = /** @type {HTMLElement|null} */ (box?.querySelector(".lang-gloss"));
      if (!box || !gloss) return;
      const term = chip.dataset.langChip || "";
      const wasOpen = chip.getAttribute("aria-expanded") === "true";
      for (const c of box.querySelectorAll("[data-lang-chip]"))
        c.setAttribute("aria-expanded", "false");
      if (wasOpen) {
        gloss.hidden = true;
        gloss.innerHTML = "";
        return;
      }
      const g = bank().find((x) => key(x.t) === key(term));
      chip.setAttribute("aria-expanded", "true");
      gloss.hidden = false;
      gloss.innerHTML = g
        ? `<p><strong>${esc(g.t)}</strong> <span class="lang-es-inline" lang="es">${esc(g.tEs)}</span></p><p>${esc(g.d)}</p><p lang="es" class="lang-es-inline">${esc(g.dEs)}</p>${picOf(g.t)}${markHtml(g.t) ? `<p class="lang-cogline">${markHtml(g.t)}</p>` : ""}`
        : "";
      L().note("chip");
      return;
    }
    const got = /** @type {HTMLElement|null} */ (t?.closest("[data-lang-got]"));
    if (got) {
      L().seenAmber(got.dataset.langGot || "");
      got.closest(".lang-amber")?.remove();
      refresh();
    }
  });

  function refresh() {
    expandBank();
    for (const stage of document.querySelectorAll(".stage-card")) {
      const it = L().current?.(stage);
      const host = /** @type {HTMLElement|null} */ (stage.querySelector(".item-body"));
      if (it && host) decorate(0, it, host, /** @type {HTMLElement} */ (stage));
    }
  }

  const boot = () => expandBank();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  W.StudioLangWords = { decorate, refresh, expandBank, markHtml, cogOf, amberNow };
})();

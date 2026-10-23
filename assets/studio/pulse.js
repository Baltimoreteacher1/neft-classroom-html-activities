/**
 * Class Pulse in the studio (window.StudioPulse): the short anonymous class code and the Family Window question.
 * The code itself is built by assets/studio/pulse-core.js; this file gathers what the studio already saved and puts the result in
 * three places: the exit card, the "My thinking" dialog beside "Copy my results", and the share text.
 *
 *   init(runtime)      remember the runtime, fill any exit-card slot already on the page, refill on `complete`
 *   snapshot()         what the code is built from (state.att/hints/calib/misses/flag/solved + the learner's seals)
 *   code()             the class code string, or "" when the studio has no lesson id the code can carry
 *   boxHtml()          the code, a copy button, and "Ask at home" (EN + ES), as one block
 *   shareLines()       lines for the plain-text "Copy my results"
 *
 * Nothing here is timed, sent anywhere, or names a student. The code holds counts and named misconceptions only.
 */
(() => {
  const W = /** @type {any} */ (window);
  /** @type {any} */
  let rt = null;
  /** where the code's facts come from: the generated studios' runtime, or Unit 4's page (attach) @type {{snapshot: () => any, misses: () => Record<string, any>, trapOf: (tag: string) => any} | null} */
  let src = null;

  const esc = (/** @type {any} */ s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
    );
  const bi = (/** @type {string} */ en, /** @type {string} */ es) =>
    `<span class="t-en">${en}</span><span class="t-es" lang="es">${es}</span>`;

  /** Where each item sits: id -> { tab, i } (1-based, the same numbers `?s=&i=` uses). */
  function placesById() {
    /** @type {Record<string, {tab: number, i: number}>} */
    const out = {};
    rt.api.sections.forEach((/** @type {any} */ sec, /** @type {number} */ t) =>
      sec.items.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
        out[it.id || `t${t + 1}i${i + 1}`] = { tab: t + 1, i: i + 1 };
      }),
    );
    return out;
  }

  function rtSnapshot() {
    const { state: st, data } = rt.api;
    const AT = W.StudioAttempts;
    const where = placesById();
    const tiers = { clean: 0, assisted: 0, guessed: 0 };
    /** @type {{tab: number, i: number}[]} */
    const guessed = [];
    const done = [1, 2, 3, 4, 5].map((t) => {
      const solved = Object.keys(st[`solved${t}`] || {});
      for (const id of solved) {
        const tier = AT?.tierOf?.(st.att?.[id] || 0, st.hints?.[id] || 0) || "clean";
        tiers[/** @type {"clean"|"assisted"|"guessed"} */ (tier)]++;
        if (tier === "guessed" && where[id]) guessed.push(where[id]);
      }
      return Object.keys(st[`solved${t}`] || {}).filter((id) => !st.owed?.[id]).length;
    });
    const certain = Object.entries(/** @type {Record<string, any>} */ (st.calib || {}))
      .filter(([id, c]) => c?.c === 3 && c.ok === false && where[id])
      .map(([id]) => where[id]);
    const flags = Object.entries(/** @type {Record<string, string>} */ (st.flag || {}))
      .filter(([id, why]) => where[id] && (why === "teacher" || why === "no-twin"))
      .map(([id, why]) => ({ kind: why, ...where[id] }));
    const seals = [0, 0, 0];
    for (const r of W.StudioLearner?.forLesson?.(String(data.lesson)) || [])
      if (r.seal >= 1 && r.seal <= 3) seals[r.seal - 1]++;
    return {
      lesson: String(data.lesson),
      mode: data.mode,
      done,
      tiers,
      misses: st.misses || {},
      certain,
      flags,
      guessed,
      seals,
    };
  }

  function code() {
    const core = W.StudioPulseCore;
    if (!core || !src) return "";
    try {
      return core.encode(core.fromSnapshot(src.snapshot()));
    } catch (_e) {
      return ""; // a lesson id the code cannot carry: the studio works exactly as before
    }
  }

  /** The Family Window text for the student's most frequent named misconception, or null when there is none yet. */
  function ask(
    /** @type {Record<string, any>} */ misses,
    /** @type {(id: string) => any} */ trapOf,
  ) {
    const core = W.StudioPulseCore;
    const top = Object.entries(misses || {})
      .filter(([tag, r]) => !r?.auto && !tag.includes(":") && trapOf(tag))
      .sort((a, b) => Number(b[1].n) - Number(a[1].n) || a[0].localeCompare(b[0]))[0];
    if (!core || !top) return null;
    const t = trapOf(top[0]);
    return core.askAtHome(t.fix, t.fixEs);
  }
  const trapOfRt = (/** @type {string} */ tag) => {
    const t = rt?.api?.data?.traps?.[tag];
    if (t) return { fix: t.fix, fixEs: t.fixEs };
    const g = W.StudioGen?.traps?.names?.[tag];
    return g ? { fix: g.fix, fixEs: g.fixEs } : null;
  };

  function askHtml() {
    const a = ask(src?.misses(), src?.trapOf || (() => null));
    if (!a) return "";
    return `<p class="pulse-ask"><strong>${bi("Ask at home:", "Pregunta en casa:")}</strong> ${bi(esc(a.q), esc(a.qEs))}<br><span class="pulse-idea">${bi(`The idea: ${esc(a.idea)}`, `La idea: ${esc(a.ideaEs)}`)}</span></p>`;
  }

  function boxHtml() {
    const c = code();
    if (!c) return askHtml();
    return `<div class="pulse-box">
      <p class="pulse-label"><strong>${bi("Class code", "Código de clase")}</strong> <span class="pulse-note">${bi("No name in it. Give it to your teacher if they ask.", "No tiene tu nombre. Dáselo a tu maestro si te lo pide.")}</span></p>
      <p class="pulse-row"><code class="pulse-code" tabindex="0">${esc(c)}</code> <button type="button" class="btn btn-sm" data-pulse-copy="${esc(c)}">${bi("Copy class code", "Copiar código de clase")}</button></p>
      ${askHtml()}
    </div>`;
  }

  /** Plain-text lines for "Copy my results": the code, then the Family Window question in both languages. */
  function shareLines() {
    const c = code();
    const a = ask(src?.misses(), src?.trapOf || (() => null));
    return [
      c ? `Class code: ${c}` : "",
      a ? `Ask at home: ${a.q} The idea: ${a.idea}` : "",
      a ? `Pregunta en casa: ${a.qEs} La idea: ${a.ideaEs}` : "",
    ].filter(Boolean);
  }

  /** Fill every exit-card slot on the page (the card is built once, when the last section is done). */
  function fillSlots() {
    if (!src) return;
    for (const slot of document.querySelectorAll("[data-pulse-slot]")) slot.innerHTML = boxHtml();
  }

  function copyText(/** @type {string} */ text, /** @type {HTMLElement} */ btn) {
    const label = btn.innerHTML;
    const ok = () => {
      btn.innerHTML = bi("Copied ✓", "Copiado ✓");
      setTimeout(() => {
        btn.innerHTML = label;
      }, 2200);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      try {
        document.execCommand("copy");
        ok();
      } catch (_e) {
        window.prompt("Copy your class code:", text);
      }
      ta.remove();
    }
  }

  document.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (
      /** @type {HTMLElement} */ (e.target).closest?.("[data-pulse-copy]")
    );
    if (b) copyText(b.dataset.pulseCopy || "", b);
  });

  W.StudioPulse = {
    init(/** @type {any} */ runtime) {
      rt = runtime;
      src = { snapshot: rtSnapshot, misses: () => rt.api.state.misses, trapOf: trapOfRt };
      W.StudioBus?.on("complete", fillSlots);
      fillSlots();
    },
    /** Unit 4's hand-built pages give the same code from their own saved state (assets/u4-studio-thinking.js). */
    attach(/** @type {any} */ source) {
      src = source;
      fillSlots();
    },
    fillSlots,
    snapshot: () => (src ? src.snapshot() : null),
    code,
    boxHtml,
    shareLines,
    slotHtml: () => '<div class="pulse-slot" data-pulse-slot></div>',
  };
})();

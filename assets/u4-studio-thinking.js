/**
 * Unit 4 "My thinking": the private Mistake Map for the hand-built studios.
 *
 * `U4Studio.miss()` (assets/u4-studio.js) announces every wrong pick as a `u4:miss` event carrying the item's misconception
 * tag. This module remembers each distinct miss in the student's own browser, and a "My thinking" button in the header menu
 * opens a short list: what the trap is called, how often it came up, how many of those questions are solved since, and a quick
 * fix that never answers a specific question. The names and fixes are read from the page's `#u4-traps` block, which
 * scripts/inject-u4-lab-bench.mjs writes from data/practice-studio/misconceptions.json for exactly the traps this page uses.
 * Nothing leaves the device, and nothing here is graded.
 */
(() => {
  const W = /** @type {any} */ (window);
  const $ = (/** @type {string} */ sel, root = document) => root.querySelector(sel);
  const bi = (/** @type {string} */ en, /** @type {string} */ es) =>
    `${en}<span class="es-text" lang="es">${es}</span>`;
  const esc = (/** @type {string} */ s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c,
    );

  /** @type {Record<string, any>} */
  let traps = {};
  try {
    traps = JSON.parse($("#u4-traps")?.textContent || "{}");
  } catch (_e) {
    traps = {};
  }
  const KEY = `neft_u4_thinking_v1_${location.pathname.split("/").filter(Boolean).pop()}`;
  /** @type {{ seen: Record<string, { tag: string, id: string, tab: number | null }> }} */
  let rec = { seen: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved.seen === "object") rec = saved;
  } catch (_e) {
    /* a blocked or corrupt store only means nothing is remembered */
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(rec));
    } catch (_e) {
      /* see above */
    }
  };

  function solved(/** @type {string} */ id, /** @type {number | null} */ tab) {
    const st = W.U4Studio?.withCfg?.((/** @type {any} */ c) => c?.state);
    return !!(tab && st?.[`solved${tab}`]?.[id]);
  }

  /** Misses grouped by trap, most frequent first. */
  function summary() {
    /** @type {Record<string, { tag: string, n: number, solvedSince: Set<string> }>} */
    const by = {};
    for (const m of Object.values(rec.seen)) {
      const g = (by[m.tag] ||= { tag: m.tag, n: 0, solvedSince: new Set() });
      g.n += 1;
      if (solved(m.id, m.tab)) g.solvedSince.add(`${m.tab}:${m.id}`);
    }
    return Object.values(by).sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
  }

  function badge() {
    const b = $("#u4-think-btn");
    if (b) b.dataset.count = String(summary().length || "");
  }

  function open() {
    const groups = summary();
    const d = W.U4Studio.dialog("u4-think", "My thinking", "Mi forma de pensar");
    const body = /** @type {HTMLElement} */ ($(".u4-dialog-body", d));
    if (!groups.length) {
      body.innerHTML = `<p>${bi(
        "No tricky spots yet. When a choice is not right, the idea behind it shows up here with a quick fix. Only you see this.",
        "Todavía no hay puntos difíciles. Cuando una opción no es correcta, la idea detrás de ella aparece aquí con un arreglo rápido. Solo tú ves esto.",
      )}</p>`;
    } else {
      body.innerHTML = `<p>${bi(
        "These are the ideas that tripped you up, most often first. Only you see this.",
        "Estas son las ideas que te confundieron, las más frecuentes primero. Solo tú ves esto.",
      )}</p><ul class="u4-think-list">${groups
        .map((g) => {
          const t = traps[g.tag];
          if (!t) return "";
          const times = g.n === 1 ? ["1 time", "1 vez"] : [`${g.n} times`, `${g.n} veces`];
          const since = g.solvedSince.size
            ? ` · ${bi(`${g.solvedSince.size} solved since`, `${g.solvedSince.size} resueltas después`)}`
            : "";
          return `<li><h3>${bi(esc(t.name), esc(t.nameEs))}</h3><p class="u4-think-meta">${bi(times[0], times[1])}${since}</p><p><strong>${bi("Quick fix:", "Arreglo rápido:")}</strong> ${bi(esc(t.fix), esc(t.fixEs))}</p></li>`;
        })
        .join("")}</ul>`;
    }
    d.showModal();
  }

  document.addEventListener("u4:miss", (e) => {
    const { id, choice, tag, tab } = /** @type {CustomEvent} */ (e).detail || {};
    if (!tag || id == null || !traps[tag]) return;
    const k = `${tab ?? ""}:${id}:${choice}`;
    if (rec.seen[k]) return;
    rec.seen[k] = { tag, id: String(id), tab: tab ?? null };
    save();
    badge();
  });

  function mount() {
    const actions = $(".header-actions");
    if (!actions || $("#u4-think-btn")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.id = "u4-think-btn";
    b.className = "top-btn";
    b.setAttribute("data-menu", "");
    b.innerHTML = `🧭 ${bi("My thinking", "Mi forma de pensar")}`;
    b.addEventListener("click", open);
    actions.append(b);
    badge();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
  W.U4Thinking = { summary, open };
})();

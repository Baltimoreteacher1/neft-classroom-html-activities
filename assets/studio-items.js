/**
 * Practice Studio runtime for the generated per-lesson studios (/math/practice-studio/<lesson>/).
 *
 * A page ships its own lesson as JSON (<script type="application/json" id="studio-data">) and this file
 * draws the four kinds of item a lesson authors: multiple choice (mc), find-the-error (err), fill-in table
 * (tbl) and written explanation (wr). It owns state, tabs, the dots, hints, Spanish and Reset, and calls
 * U4Studio (assets/u4-studio.js) for stars, rank and the celebration — the same engagement layer the
 * Unit 4 studios use, fed from the same state.solved1..5 maps.
 *
 * Nothing here knows any mathematics: every right answer comes from the lesson's own config, and the
 * generator (scripts/generate-practice-studios.mjs) has already checked it.
 */
(() => {
  const W = /** @type {any} */ (window);
  const dataNode = document.getElementById("studio-data");
  if (!dataNode) return;
  /** @type {any} */
  const data = JSON.parse(dataNode.textContent || "{}");
  const KEY = String(data.storageKey);
  const SECTIONS = /** @type {any[]} */ (data.sections);
  const TABS = [1, 2, 3, 4, 5];

  /** @type {any} */
  const state = {
    activeTab: 1,
    showEs: false,
    idx: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    solved1: {},
    solved2: {},
    solved3: {},
    solved4: {},
    solved5: {},
    play: {},
    picks: {},
    cells: {},
    notes: {},
    hints: {},
  };
  /** @type {Record<string, number>} */
  const misses = {};

  const $ = (/** @type {string} */ sel, root = document) => root.querySelector(sel);
  const esc = (/** @type {any} */ s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
    );
  const es = (/** @type {any} */ text) =>
    text ? `<span class="es-text" lang="es">${esc(text)}</span>` : "";
  const solvedMap = (/** @type {number} */ tab) => state[`solved${tab}`];
  const stg = (/** @type {number} */ tab) =>
    /** @type {HTMLElement} */ (document.getElementById(`stage-${tab}`));
  const items = (/** @type {number} */ tab) => SECTIONS[tab - 1].items;

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!d || typeof d !== "object") return;
      state.showEs = !!d.showEs;
      for (const t of TABS) {
        state[`solved${t}`] =
          d[`solved${t}`] && typeof d[`solved${t}`] === "object" ? d[`solved${t}`] : {};
        if (Number.isInteger(d.idx?.[t]) && d.idx[t] >= 0 && d.idx[t] < items(t).length)
          state.idx[t] = d.idx[t];
      }
      for (const k of ["play", "picks", "cells", "notes", "hints"]) {
        if (d[k] && typeof d[k] === "object") state[k] = d[k];
      }
      if (Number.isInteger(d.activeTab) && d.activeTab >= 1 && d.activeTab <= 5)
        state.activeTab = d.activeTab;
    } catch (_e) {
      /* a blocked or corrupt store only means a fresh start */
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_e) {
      /* progress stays in memory for this visit */
    }
  }

  /** Numbers compare by value ("$12.50" = 12.5, "3/4" = 0.75); everything else by letters and digits. */
  function parseValue(/** @type {string} */ raw) {
    const t = String(raw)
      .trim()
      .replace(/[$,%\s]/g, "")
      .replace(/−/g, "-");
    const frac = t.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (frac && Number(frac[2])) return Number(frac[1]) / Number(frac[2]);
    return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : Number.NaN;
  }
  function sameAnswer(/** @type {string} */ typed, /** @type {string} */ right) {
    const a = parseValue(typed),
      b = parseValue(right);
    if (Number.isFinite(a) && Number.isFinite(b)) return Math.abs(a - b) < 0.0051;
    const clean = (/** @type {string} */ s) =>
      s
        .toLowerCase()
        .replace(/−/g, "-")
        .replace(/\s+/g, "")
        .replace(/[.,;:!]+$/, "");
    return clean(typed) !== "" && clean(typed) === clean(right);
  }

  function say(/** @type {string} */ msg) {
    const live = $("#sr-live");
    if (live) live.textContent = msg;
  }

  /* ---- shared pieces -------------------------------------------------------------------------- */
  function dots(/** @type {number} */ tab) {
    const wrap = $(`#dots-${tab}`);
    if (!wrap) return;
    wrap.innerHTML = "";
    items(tab).forEach((/** @type {any} */ it, /** @type {number} */ i) => {
      const done = !!solvedMap(tab)[it.id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = `step-dot ${i === state.idx[tab] ? "active" : ""} ${done ? "solved" : ""}`;
      b.textContent = done ? `${i + 1} ✓` : String(i + 1);
      b.setAttribute("aria-label", `Problem ${i + 1}${done ? " completed" : ""}`);
      if (i === state.idx[tab]) b.setAttribute("aria-current", "step");
      b.addEventListener("click", () => {
        state.idx[tab] = i;
        render(tab);
      });
      wrap.append(b);
    });
  }

  function hintHtml(/** @type {any} */ it) {
    const hs = it.h || [];
    if (!hs.length) return "";
    const shown = state.hints[it.id] || 0;
    const list = hs
      .slice(0, shown)
      .map(
        (/** @type {string} */ h, /** @type {number} */ i) =>
          `<li>${esc(h)}${es((it.hEs || [])[i])}</li>`,
      )
      .join("");
    const more = shown < hs.length;
    return `<div class="hint-area"><ol class="hint-list">${list}</ol>${more ? `<button type="button" class="btn btn-sm" data-hint="${esc(it.id)}">💡 ${shown ? "Another hint" : "Give me a hint"}</button>` : ""}</div>`;
  }

  function feedback(
    /** @type {number} */ tab,
    /** @type {string} */ kind,
    /** @type {string} */ html,
  ) {
    const fb = stg(tab).querySelector(".item-fb");
    if (!fb) return;
    fb.className = `item-fb feedback-box show ${kind}`;
    fb.innerHTML = html;
  }

  function nextButton(/** @type {number} */ tab) {
    const fb = stg(tab).querySelector(".item-fb");
    if (!fb) return;
    const last = state.idx[tab] === items(tab).length - 1;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-go btn-sm next-btn";
    b.textContent = !last
      ? "Next problem →"
      : tab < 5
        ? `Continue to Section ${tab + 1} →`
        : "See how I did →";
    b.addEventListener("click", () => {
      if (!last) {
        state.idx[tab] += 1;
        render(tab);
      } else if (tab < 5) selectTab(tab + 1);
      else {
        render(tab);
        document.getElementById("complete-banner")?.scrollIntoView({ block: "center" });
      }
    });
    fb.append(b);
    b.focus();
  }

  function solve(/** @type {number} */ tab, /** @type {any} */ it) {
    solvedMap(tab)[it.id] = true;
    dots(tab);
    progress();
    nextButton(tab);
  }

  /* ---- item renderers ------------------------------------------------------------------------- */
  function renderMc(/** @type {number} */ tab, /** @type {any} */ it) {
    const done = !!solvedMap(tab)[it.id],
      chosen = state.picks[it.id];
    return `<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
      <div class="choice-stack">${it.c
        .map((/** @type {string} */ c, /** @type {number} */ i) => {
          const cls = done
            ? i === it.a
              ? "correct"
              : i === chosen
                ? "wrong"
                : ""
            : chosen === i
              ? "wrong"
              : "";
          return `<button type="button" class="choice-btn ${cls}" data-mc="${i}"${done ? " disabled" : ""}><span>${esc(c)}${es((it.cEs || [])[i])}</span></button>`;
        })
        .join("")}</div>${hintHtml(it)}<div class="item-fb feedback-box" role="status"></div>`;
  }
  function wireMc(/** @type {number} */ tab, /** @type {any} */ it) {
    if (solvedMap(tab)[it.id]) {
      feedback(tab, "ok", `<strong>Correct.</strong> ${esc(it.x)}${es(it.xEs)}`);
      nextButton(tab);
      return;
    }
    stg(tab)
      .querySelectorAll("[data-mc]")
      .forEach((btn) =>
        btn.addEventListener("click", () => {
          const i = Number(/** @type {HTMLElement} */ (btn).dataset.mc);
          stg(tab)
            .querySelectorAll("[data-mc]")
            .forEach((b) => b.classList.remove("wrong"));
          state.picks[it.id] = i;
          if (i === it.a) {
            btn.classList.add("correct");
            feedback(tab, "ok", `<strong>Correct.</strong> ${esc(it.x)}${es(it.xEs)}`);
            say("Correct");
            solve(tab, it);
            stg(tab)
              .querySelectorAll("[data-mc]")
              .forEach((b) => b.setAttribute("disabled", ""));
          } else {
            btn.classList.add("wrong");
            misses[it.id] = (misses[it.id] || 0) + 1;
            const why = (it.f || [])[i];
            feedback(
              tab,
              "err",
              `<strong>Not yet.</strong> ${esc(why || "Look again at what the question asks, then try another choice.")}${es((it.fEs || [])[i])}`,
            );
            say("Not yet");
          }
          save();
        }),
      );
  }

  function renderErr(/** @type {number} */ tab, /** @type {any} */ it) {
    const done = !!solvedMap(tab)[it.id],
      chosen = state.picks[it.id];
    return `<p class="item-q">${esc(it.t)}${es(it.tEs)}</p>
      <p class="item-sub">One step has a mistake. Tap the step where it first goes wrong.${es("Un paso tiene un error. Toca el paso donde se equivoca primero.")}</p>
      <ol class="err-steps">${it.s
        .map((/** @type {any} */ s, /** @type {number} */ i) => {
          const cls = done && i === it.e ? "correct" : chosen === i && i !== it.e ? "wrong" : "";
          return `<li><button type="button" class="choice-btn err-step ${cls}" data-err="${i}"${done ? " disabled" : ""}><span><strong>${esc(s.l)}</strong>: ${esc(s.w)}${s.wEs ? `<span class="es-text" lang="es">${esc(s.lEs || s.l)}: ${esc(s.wEs)}</span>` : ""}</span></button></li>`;
        })
        .join("")}</ol>${hintHtml(it)}<div class="item-fb feedback-box" role="status"></div>`;
  }
  function errDone(/** @type {any} */ it) {
    return `<strong>Yes, that is the step.</strong> ${esc(it.fix)}${es(it.fixEs)} ${esc(it.x)}${es(it.xEs)}`;
  }
  function wireErr(/** @type {number} */ tab, /** @type {any} */ it) {
    if (solvedMap(tab)[it.id]) {
      feedback(tab, "ok", errDone(it));
      nextButton(tab);
      return;
    }
    stg(tab)
      .querySelectorAll("[data-err]")
      .forEach((btn) =>
        btn.addEventListener("click", () => {
          const i = Number(/** @type {HTMLElement} */ (btn).dataset.err);
          stg(tab)
            .querySelectorAll("[data-err]")
            .forEach((b) => b.classList.remove("wrong"));
          state.picks[it.id] = i;
          if (i === it.e) {
            btn.classList.add("correct");
            feedback(tab, "ok", errDone(it));
            solve(tab, it);
            stg(tab)
              .querySelectorAll("[data-err]")
              .forEach((b) => b.setAttribute("disabled", ""));
          } else {
            btn.classList.add("wrong");
            misses[it.id] = (misses[it.id] || 0) + 1;
            const hs = it.h || [];
            feedback(
              tab,
              "err",
              `<strong>That step is fine.</strong> ${esc(hs[Math.min(misses[it.id] - 1, Math.max(0, hs.length - 1))] || "Check each step against the one before it.")}`,
            );
          }
          save();
        }),
      );
  }

  function renderTbl(/** @type {number} */ tab, /** @type {any} */ it) {
    const done = !!solvedMap(tab)[it.id],
      mine = state.cells[it.id] || {};
    const key = (/** @type {number} */ r, /** @type {number} */ c) => `${r}:${c}`;
    const editable = new Map(it.cells.map((/** @type {any} */ x) => [key(x.r, x.c), x.a]));
    const body = it.rows
      .map(
        (/** @type {string[]} */ row, /** @type {number} */ r) =>
          `<tr>${row
            .map((/** @type {string} */ cell, /** @type {number} */ c) => {
              if (!editable.has(key(r, c))) return `<td>${esc(cell)}</td>`;
              const v = done ? editable.get(key(r, c)) : (mine[key(r, c)] ?? "");
              return `<td><input class="num-input${done ? " ok" : ""}" type="text" inputmode="decimal" autocomplete="off" data-cell="${key(r, c)}" value="${esc(v)}" aria-label="${esc(it.hd[c])}, row ${r + 1}"${done ? " readonly" : ""}></td>`;
            })
            .join("")}</tr>`,
      )
      .join("");
    return `<p class="item-q">${esc(it.t)}${es(it.tEs)}</p>
      <div class="table-wrap"><table class="data-table"><thead><tr>${it.hd.map((/** @type {string} */ h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>
      ${done ? "" : '<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-table>Check my table</button></div>'}
      ${hintHtml(it)}<div class="item-fb feedback-box" role="status"></div>`;
  }
  function wireTbl(/** @type {number} */ tab, /** @type {any} */ it) {
    if (solvedMap(tab)[it.id]) {
      feedback(tab, "ok", `<strong>Table complete.</strong> ${esc(it.x)}${es(it.xEs)}`);
      nextButton(tab);
      return;
    }
    const inputs = /** @type {HTMLInputElement[]} */ ([
      ...stg(tab).querySelectorAll("[data-cell]"),
    ]);
    inputs.forEach((inp) =>
      inp.addEventListener("input", () => {
        state.cells[it.id] = state.cells[it.id] || {};
        state.cells[it.id][inp.dataset.cell || ""] = inp.value;
        inp.classList.remove("ok", "err");
        save();
      }),
    );
    stg(tab)
      .querySelector("[data-check-table]")
      ?.addEventListener("click", () => {
        let right = 0,
          empty = 0;
        for (const inp of inputs) {
          const [r, c] = (inp.dataset.cell || "0:0").split(":").map(Number);
          const want = it.cells.find((/** @type {any} */ x) => x.r === r && x.c === c).a;
          if (!inp.value.trim()) {
            empty++;
            inp.classList.remove("ok", "err");
          } else if (sameAnswer(inp.value, want)) {
            right++;
            inp.classList.add("ok");
            inp.classList.remove("err");
          } else {
            inp.classList.add("err");
            inp.classList.remove("ok");
          }
        }
        if (right === inputs.length) {
          feedback(tab, "ok", `<strong>Table complete.</strong> ${esc(it.x)}${es(it.xEs)}`);
          solve(tab, it);
          inputs.forEach((i) => i.setAttribute("readonly", ""));
          stg(tab).querySelector("[data-check-table]")?.remove();
        } else {
          misses[it.id] = (misses[it.id] || 0) + 1;
          feedback(
            tab,
            "warn",
            `<strong>${right} of ${inputs.length} cells are right.</strong> ${empty ? `${empty} still empty. ` : ""}Fix the red ones, then check again.`,
          );
        }
        save();
      });
  }

  function renderWr(/** @type {number} */ tab, /** @type {any} */ it) {
    const done = !!solvedMap(tab)[it.id],
      text = state.notes[it.id] || "";
    return `<p class="item-q">${esc(it.p)}${es(it.pEs)}</p>
      ${it.fr ? `<p class="item-sub"><strong>Sentence frame:</strong> ${esc(it.fr)}</p>` : ""}
      <label class="write-label" for="wr-${esc(it.id)}">Your explanation</label>
      <textarea id="wr-${esc(it.id)}" class="write-box" rows="5" data-write${done ? " readonly" : ""}>${esc(text)}</textarea>
      <p class="item-sub" data-count>${text.trim().length} of ${it.min} characters</p>
      ${done ? "" : '<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-write>Check my thinking</button></div>'}
      ${hintHtml(it)}<div class="item-fb feedback-box" role="status"></div>`;
  }
  function wrDone(/** @type {any} */ it) {
    const text = String(state.notes[it.id] || "").toLowerCase();
    const used = (it.kw || []).map(
      (/** @type {string} */ k) =>
        `${text.includes(String(k).toLowerCase()) ? "✓" : "○"} ${esc(k)}`,
    );
    return `<strong>Saved. Now compare your answer with this model.</strong> ${esc(it.x)}${es(it.xEs)}${used.length ? `<p class="item-sub">Words to look for in your answer: ${used.join(" · ")}</p>` : ""}`;
  }
  function wireWr(/** @type {number} */ tab, /** @type {any} */ it) {
    if (solvedMap(tab)[it.id]) {
      feedback(tab, "ok", wrDone(it));
      nextButton(tab);
      return;
    }
    const box = /** @type {HTMLTextAreaElement} */ (stg(tab).querySelector("[data-write]"));
    box.addEventListener("input", () => {
      state.notes[it.id] = box.value;
      const c = stg(tab).querySelector("[data-count]");
      if (c) c.textContent = `${box.value.trim().length} of ${it.min} characters`;
      save();
    });
    stg(tab)
      .querySelector("[data-check-write]")
      ?.addEventListener("click", () => {
        if (box.value.trim().length < it.min) {
          feedback(
            tab,
            "warn",
            `<strong>Keep going.</strong> Write at least ${it.min} characters, using your own words and the numbers from the problem.`,
          );
          return;
        }
        feedback(tab, "ok", wrDone(it));
        box.setAttribute("readonly", "");
        stg(tab).querySelector("[data-check-write]")?.remove();
        solve(tab, it);
      });
  }

  const KINDS = {
    mc: [renderMc, wireMc],
    err: [renderErr, wireErr],
    tbl: [renderTbl, wireTbl],
    wr: [renderWr, wireWr],
  };

  function wireHints(/** @type {any} */ it, /** @type {ParentNode} */ stage) {
    stage.querySelectorAll("[data-hint]").forEach((b) =>
      b.addEventListener("click", () => {
        state.hints[it.id] = (state.hints[it.id] || 0) + 1;
        const area = stage.querySelector(".hint-area");
        if (area) {
          area.outerHTML = hintHtml(it);
          wireHints(it, stage);
        }
        save();
      }),
    );
  }

  function render(/** @type {number} */ tab) {
    const list = items(tab),
      it = list[state.idx[tab]];
    const stage = $(`#stage-${tab}`);
    if (!stage || !it) return;
    const [draw, wire] = /** @type {any} */ (KINDS)[it.k];
    stage.innerHTML = `<div class="item-head"><span class="item-count">Problem ${state.idx[tab] + 1} of ${list.length}</span></div>${draw(tab, it)}`;
    dots(tab);
    wire(tab, it);
    wireHints(it, stage);
  }

  /* ---- shell: tabs, progress, language, reset ------------------------------------------------- */
  const tabBtns = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".tab-btn")]);
  const panels = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".tab-panel")]);
  function selectTab(/** @type {number} */ n) {
    state.activeTab = n;
    tabBtns.forEach((b) => {
      const on = Number(b.dataset.tab) === n;
      b.setAttribute("aria-selected", String(on));
      b.setAttribute("tabindex", on ? "0" : "-1");
    });
    panels.forEach((p, i) => p.classList.toggle("active", i + 1 === n));
    save();
  }
  tabBtns.forEach((b) => b.addEventListener("click", () => selectTab(Number(b.dataset.tab))));

  const total = TABS.reduce((a, t) => a + items(t).length, 0);
  function progress() {
    const counts = TABS.map((t) => Object.keys(solvedMap(t)).length);
    const done = counts.reduce((a, b) => a + b, 0);
    const pill = $("#header-progress-count");
    if (pill) pill.textContent = `${done} / ${total}`;
    TABS.forEach((t, i) => {
      const complete = counts[i] >= items(t).length;
      $(`#tab-${t}`)?.classList.toggle("tab-complete", complete);
      const badge = $(`#badge-${t}`);
      if (badge) badge.textContent = complete ? "✓" : String(t);
    });
    const banner = $("#complete-banner");
    if (banner)
      banner.toggleAttribute("hidden", !counts.every((c, i) => c >= items(TABS[i]).length));
    save();
    W.U4Studio?.sync();
  }

  const esBtn = $("#toggle-es-btn");
  esBtn?.addEventListener("click", () => {
    state.showEs = !state.showEs;
    document.body.classList.toggle("show-es", state.showEs);
    esBtn.setAttribute("aria-pressed", String(state.showEs));
    save();
  });
  $("#print-btn")?.addEventListener("click", () => window.print());
  $("#reset-all-btn")?.addEventListener("click", () => {
    if (
      !window.confirm("Start this practice studio over? Your saved progress here will be cleared.")
    )
      return;
    for (const t of TABS) {
      state[`solved${t}`] = {};
      state.idx[t] = 0;
    }
    state.picks = {};
    state.cells = {};
    state.notes = {};
    state.hints = {};
    for (const k of Object.keys(misses)) delete misses[k];
    W.U4Studio?.reset();
    try {
      localStorage.removeItem(KEY);
    } catch (_e) {
      /* nothing stored to clear */
    }
    TABS.forEach(render);
    progress();
  });

  load();
  W.U4Studio?.init({
    state,
    save,
    totals: Object.fromEntries(TABS.map((t) => [t, items(t).length])),
    need: Object.fromEntries(TABS.map((t) => [t, items(t).length])),
    goToTab: selectTab,
    glyphs: data.glyphs || ["★", "✓", "+", "="],
  });
  TABS.forEach(render);
  selectTab(state.activeTab);
  if (state.showEs) {
    document.body.classList.add("show-es");
    esBtn?.setAttribute("aria-pressed", "true");
  }
  progress();
})();

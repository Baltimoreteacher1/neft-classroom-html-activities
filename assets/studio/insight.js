/**
 * Practice Studio v2 — the learning-insight layer.
 *
 *   Mistake Map     every wrong answer carries a named misconception; the studio shows the student, privately,
 *                   which ones they keep meeting (never a grade, never shared unless they choose to)
 *   Redemption      retry only what was missed, on fresh numbers where the skill is generated
 *   Confidence      Guess / Pretty sure / Certain before Boss items; the map shows how well it matched
 *   Read-aloud      Web Speech API in English or Spanish, when the browser has it
 *   Share code      a short anonymous summary the student can paste to a teacher or family member
 *   Passport        one stamp per finished studio, shared with the finder page
 *
 * It listens to StudioBus; the runtime never calls into it except init() and read().
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const { esc, es } = RT.util;
  /** @type {any} */
  let rt = null;

  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));
  const features = () => (document.body.dataset.features || "").split(/\s+/);
  const has = (/** @type {string} */ f) => features().includes(f);

  /* ---- misconception names ----------------------------------------------------------------------- */
  /** A tag the author gave, or a signature of the feedback line with its numbers removed. */
  const signature = (/** @type {string} */ say, /** @type {any} */ skill) =>
    `${skill || "item"}:${String(say || "wrong")
      .toLowerCase()
      .replace(/[−-]?\d[\d.,/]*/g, "#")
      .replace(/[^a-z# ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 7)
      .join(" ")}`;
  const human = (/** @type {string} */ tag) => {
    const t = tag.includes(":") ? tag.split(":").slice(1).join(":") : tag;
    const s = t.replace(/[-_#]+/g, " ").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Something to look at again";
  };

  /* ---- bus listeners ------------------------------------------------------------------------------ */
  function record(/** @type {any} */ e) {
    const st = rt.api.state;
    if (e.ok) {
      // a solved item leaves the redemption list
      st.missLog = st.missLog.filter((/** @type {any} */ m) => m.id !== e.itemId);
      return;
    }
    const tag = e.tag ? String(e.tag) : signature(e.say, e.skill);
    const rec = (st.misses[tag] ||= { n: 0, say: "", skill: e.skill || "" });
    rec.n++;
    rec.say = String(e.say || rec.say).slice(0, 220);
    if (!e.redeem && !st.missLog.some((/** @type {any} */ m) => m.id === e.itemId))
      st.missLog.push({ id: e.itemId, tab: e.tab, tag });
    if (st.missLog.length > 12) st.missLog.shift();
    updateThinkBadge();
  }

  /* ---- calibration summary ------------------------------------------------------------------------ */
  function calibration() {
    const rows = Object.values(/** @type {Record<string, any>} */ (rt.api.state.calib)).filter(
      (c) => c && c.ok !== null && c.ok !== undefined,
    );
    const by = [1, 2, 3].map((lv) => {
      const r = rows.filter((c) => c.c === lv);
      return { lv, n: r.length, right: r.filter((c) => c.ok).length };
    });
    return { rows: rows.length, by };
  }
  const CONF_NAME = ["", "Guess", "Pretty sure", "Certain"];
  function calibrationHtml() {
    const c = calibration();
    if (!c.rows) return "";
    const lines = c.by
      .filter((b) => b.n)
      .map(
        (b) =>
          `<li><strong>${CONF_NAME[b.lv]}</strong>: ${b.right} of ${b.n} right on the first try</li>`,
      )
      .join("");
    const sure = c.by[2];
    const msg =
      sure.n && sure.right < sure.n
        ? "Some answers you were certain about were not right yet. That is useful: it shows where a mistake feels like a fact."
        : c.by[0].n && c.by[0].right === c.by[0].n
          ? "Your guesses were right more often than you expected. Trust your thinking a little more."
          : "Your confidence matched your results well.";
    return `<h3>How sure you were</h3><ul>${lines}</ul><p>${esc(msg)}</p>`;
  }

  /* ---- dialog helper ------------------------------------------------------------------------------ */
  function dialog(
    /** @type {string} */ id,
    /** @type {string} */ title,
    /** @type {string} */ titleEs,
  ) {
    let d = /** @type {HTMLDialogElement | null} */ ($(`#${id}`));
    if (d) d.remove();
    d = document.createElement("dialog");
    d.className = "u4-dialog";
    d.id = id;
    d.setAttribute("aria-labelledby", `${id}-title`);
    d.innerHTML = `<div class="u4-dialog-head"><h2 id="${id}-title">${esc(title)}${es(titleEs)}</h2><button type="button" class="u4-close">Close</button></div><div class="u4-dialog-body"></div>`;
    document.body.append(d);
    $(".u4-close", d)?.addEventListener("click", () => d?.close());
    d.addEventListener("close", () => d?.remove());
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    return /** @type {HTMLElement} */ ($(".u4-dialog-body", d));
  }

  /* ---- share code --------------------------------------------------------------------------------- */
  function shareText() {
    const { state: st, data, sections } = rt.api;
    const total = sections.reduce(
      (/** @type {number} */ a, /** @type {any} */ s) => a + s.items.length,
      0,
    );
    const done = [1, 2, 3, 4, 5].reduce((a, t) => a + Object.keys(st[`solved${t}`]).length, 0);
    const top = Object.entries(/** @type {Record<string, any>} */ (st.misses))
      .sort((a, b) => b[1].n - a[1].n)
      .slice(0, 3)
      .map(([tag]) => human(tag));
    const acc = st.stats.tries ? Math.round((100 * st.stats.first) / st.stats.tries) : 0;
    return [
      `EduWonderLab · Lesson ${data.lesson} · ${data.mode === "practice" ? "Practice" : "Challenge"}`,
      `${done} of ${total} problems solved · first-try accuracy ${acc}% · best streak ${st.stats.best} · hints used ${st.stats.hints}`,
      top.length ? `Still working on: ${top.join("; ")}` : "No tricky patterns yet",
      st.quest
        ? `Skill Quest: best ${"★".repeat(st.quest.best)}${"☆".repeat(3 - st.quest.best)} in ${st.quest.runs} run${st.quest.runs === 1 ? "" : "s"}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  function copy(/** @type {string} */ text, /** @type {HTMLElement} */ btn) {
    const ok = () => {
      btn.textContent = "Copied ✓";
      setTimeout(() => (btn.textContent = "Copy my results"), 2200);
    };
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(text).then(ok, () => fallback());
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
        window.prompt("Copy your results:", text);
      }
      ta.remove();
    }
  }

  /* ---- redemption round --------------------------------------------------------------------------- */
  function redemption(/** @type {HTMLElement} */ body, /** @type {HTMLDialogElement|null} */ dlg) {
    const st = rt.api.state;
    const queue = st.missLog.slice(0, 5);
    if (!queue.length) {
      body.innerHTML = `<p><strong>Nothing to redo.</strong> You have no unsolved misses right now.</p>`;
      return;
    }
    let n = 0;
    const next = () => {
      if (n >= queue.length) {
        body.innerHTML = `<p><strong>Redemption complete.</strong> You went back to every skill you missed and got it.</p><button type="button" class="btn btn-go" data-close>Back to the studio</button>`;
        body.querySelector("[data-close]")?.addEventListener("click", () => dlg?.close());
        rt.api.progress();
        return;
      }
      const m = queue[n];
      const tab = m.tab || 1;
      const idx = rt.api.sections[tab - 1].items.findIndex(
        (/** @type {any} */ _s, /** @type {number} */ i) =>
          (rt.api.sections[tab - 1].items[i].id || `t${tab}i${i + 1}`) === m.id,
      );
      if (idx < 0) {
        n++;
        return next();
      }
      const spec = rt.api.sections[tab - 1].items[idx];
      const fresh = spec.k === "gen" || spec.k === "act" || spec.k === "pool";
      const it = {
        ...rt.api.expand(tab, idx, fresh ? Math.floor(Math.random() * 90000) + 2000 : undefined),
        id: `rd_${m.id}`,
      };
      body.innerHTML = `<p class="item-sub">Redemption ${n + 1} of ${queue.length}${fresh ? " · fresh numbers" : ""}</p><div class="redeem-stage stage-card"></div>`;
      rt.api.mountItem({
        tab,
        it,
        host: body.querySelector(".redeem-stage"),
        redeem: true,
        onSolved: () => {
          st.missLog = st.missLog.filter((/** @type {any} */ x) => x.id !== m.id);
          rt.api.save();
          const b = document.createElement("button");
          b.type = "button";
          b.className = "btn btn-go btn-sm";
          b.textContent = n + 1 < queue.length ? "Next one →" : "Finish →";
          b.addEventListener("click", () => {
            n++;
            next();
          });
          body.querySelector(".item-fb")?.append(b);
        },
      });
    };
    next();
  }

  /* ---- thinking dialog ---------------------------------------------------------------------------- */
  function openThinking() {
    const st = rt.api.state;
    const body = dialog("studio-think", "My thinking map", "Mi mapa de pensamiento");
    const dlg = /** @type {HTMLDialogElement} */ (body.closest("dialog"));
    const patterns = Object.entries(/** @type {Record<string, any>} */ (st.misses)).sort(
      (a, b) => b[1].n - a[1].n,
    );
    const top = patterns.filter((p) => p[1].n >= 2).slice(0, 3);
    const shown = top.length ? top : patterns.slice(0, 3);
    const list = shown
      .map(
        ([tag, r]) =>
          `<li><strong>${esc(human(tag))}</strong> <span class="chip">${r.n}×</span><br><span class="item-sub">${esc(r.say)}</span></li>`,
      )
      .join("");
    const redo = st.missLog.length;
    body.innerHTML = `<p class="item-sub">This map is just for you. It shows the mistakes you keep meeting, so you know what to practice. Nothing here is a grade.</p>
      <h3>${top.length ? "Patterns to watch" : shown.length ? "Mistakes so far" : "Nothing yet"}</h3>
      ${shown.length ? `<ul class="think-list">${list}</ul>` : "<p>No wrong answers recorded yet. Keep going. When you miss one, it shows up here.</p>"}
      ${redo ? `<p><button type="button" class="btn btn-go" data-redeem>Redemption round (${Math.min(redo, 5)} to redo)</button></p>` : ""}
      ${calibrationHtml()}
      <h3>Your numbers</h3><p>First-try accuracy: <strong>${st.stats.tries ? Math.round((100 * st.stats.first) / st.stats.tries) : 0}%</strong> · Best streak: <strong>${st.stats.best}</strong> · Hints used: <strong>${st.stats.hints}</strong> · Extra reps: <strong>${st.stats.reps}</strong></p>
      ${has("share") ? '<p><button type="button" class="btn btn-sm" data-copy>Copy my results</button> <span class="item-sub">A short note with no name. Paste it to your teacher or family.</span></p>' : ""}`;
    body.querySelector("[data-redeem]")?.addEventListener("click", () => redemption(body, dlg));
    body
      .querySelector("[data-copy]")
      ?.addEventListener("click", (e) =>
        copy(shareText(), /** @type {HTMLElement} */ (e.currentTarget)),
      );
  }
  function updateThinkBadge() {
    const b = $("#think-btn");
    if (!b || !rt) return;
    const n = rt.api.state.missLog.length;
    b.dataset.count = n ? String(n) : "";
  }

  /* ---- read aloud --------------------------------------------------------------------------------- */
  let speaking = false;
  function stageText(/** @type {HTMLElement} */ stage, /** @type {boolean} */ spanish) {
    const parts = [];
    const take = (/** @type {HTMLElement} */ n) => {
      const e = n.querySelector(".es-text");
      if (spanish && e) return e.textContent || "";
      const c = /** @type {HTMLElement} */ (n.cloneNode(true));
      for (const x of c.querySelectorAll(".es-text,.choice-letter")) x.remove();
      return c.textContent || "";
    };
    const title = stage.querySelector(".viz-host svg title");
    if (title?.textContent) parts.push(title.textContent);
    let letter = 0;
    for (const n of /** @type {HTMLElement[]} */ ([
      ...stage.querySelectorAll(
        ".item-q, .item-sub:not(.nline-read), .choice-btn, .sort-card, .match-item",
      ),
    ])) {
      const t = take(n).replace(/\s+/g, " ").trim();
      if (!t) continue;
      parts.push(
        n.classList.contains("choice-btn")
          ? `Choice ${String.fromCharCode(65 + letter++)}. ${t}`
          : t,
      );
    }
    return parts.join(". ");
  }
  function read(/** @type {number} */ tab) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      speaking = false;
      return;
    }
    const spanish = rt.api.state.showEs;
    const u = new SpeechSynthesisUtterance(
      stageText(/** @type {HTMLElement} */ ($(`#stage-${tab}`)), spanish),
    );
    u.lang = spanish ? "es-US" : "en-US";
    u.rate = 0.92;
    u.onend = u.onerror = () => {
      speaking = false;
    };
    speaking = true;
    synth.cancel();
    synth.speak(u);
  }

  /* ---- init --------------------------------------------------------------------------------------- */
  const api = (W.StudioInsight = {
    init(/** @type {any} */ runtime) {
      rt = runtime;
      const bus = W.StudioBus;
      bus.on("answer", record);
      bus.on("progress", (/** @type {any} */ e) => {
        if (has("passport"))
          W.StudioStore.passport.update(
            e.lesson,
            e.mode,
            e.done,
            e.total,
            e.mode === "challenge" && e.boss,
          );
      });
      const actions = $(".header-actions");
      if (actions && has("insight") && !$("#think-btn")) {
        const b = document.createElement("button");
        b.type = "button";
        b.id = "think-btn";
        b.className = "top-btn";
        b.innerHTML = "🧭 My thinking";
        b.addEventListener("click", openThinking);
        actions.insertBefore(b, $("#toggle-es-btn") || null);
      }
      if (!window.speechSynthesis)
        for (const r of document.querySelectorAll("[data-read]")) r.setAttribute("hidden", "");
      document.addEventListener("click", (e) => {
        if (/** @type {HTMLElement} */ (e.target).closest("[data-open-think]")) openThinking();
      });
      updateThinkBadge();
    },
    read,
    shareText: () => shareText(),
    signature,
  });
  void api;
})();

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
  /** The named trap (data/practice-studio/misconceptions.json) behind a tag, when the page carries one. */
  const trap = (/** @type {string} */ tag) => rt?.api?.data?.traps?.[tag] || null;
  /** Untagged misses are keyed by signature() ("skill:words"); authored tags never contain a colon. */
  const untagged = (/** @type {string} */ tag, /** @type {any} */ r) =>
    !!r?.auto || tag.includes(":");
  /** A miss's name in plain text: the trap's name, an authored tag made readable, or (untagged) the whole feedback sentence. */
  const nameOf = (/** @type {string} */ tag, /** @type {any} */ r) =>
    trap(tag)?.n || (untagged(tag, r) ? r?.say || "Something to look at again" : human(tag));

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
    rec.say = String(e.say || rec.say);
    rec.sayEs = String(e.sayEs || rec.sayEs || "");
    if (!e.tag) rec.auto = true;
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

  /** One line about the lab bench (predictions and the mission), or "" when this studio has none or the student has not started. */
  function benchLine(/** @type {any} */ st) {
    const acts = /** @type {Record<string, any>} */ (st.acts || {});
    let right = 0;
    let total = 0;
    for (const a of Object.values(acts)) {
      right += a?.predict?.right || 0;
      total += a?.predict?.total || 0;
    }
    const ex = acts["lab-mission"]?.expedition;
    const parts = [];
    if (total) parts.push(`predictions ${right} of ${total} right`);
    if (ex?.repaired?.length)
      parts.push(
        `mission ${ex.repaired.length} of 3 stations restored, ${ex.medals?.length || 0} on the first test`,
      );
    const reasoned = Object.values(ex?.strategy || {}).filter((v) => v === "reasoned").length;
    if (reasoned) parts.push(`${reasoned} planned from the relationship`);
    return parts.length ? `Lab bench: ${parts.join(" · ")}` : "";
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
      .map(([tag, r]) => nameOf(tag, r));
    const acc = st.stats.tries ? Math.round((100 * st.stats.first) / st.stats.tries) : 0;
    return [
      `EduWonderLab · Lesson ${data.lesson} · ${data.mode === "practice" ? "Practice" : "Challenge"}`,
      `${done} of ${total} problems solved · first-try accuracy ${acc}% · best streak ${st.stats.best} · hints used ${st.stats.hints}`,
      top.length ? `Still working on: ${top.join("; ")}` : "No tricky patterns yet",
      benchLine(st),
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
      .map(([tag, r]) => {
        const t = trap(tag);
        const head = t
          ? `${esc(t.n)}${es(t.nEs)}`
          : untagged(tag, r)
            ? `${esc(nameOf(tag, r))}${es(r.sayEs)}`
            : esc(human(tag));
        const sub = t
          ? `${esc(t.fix)}${es(t.fixEs)}`
          : untagged(tag, r)
            ? ""
            : `${esc(r.say)}${es(r.sayEs)}`;
        return `<li><strong>${head}</strong> <span class="chip">${r.n}×</span>${sub ? `<br><span class="item-sub">${sub}</span>` : ""}</li>`;
      })
      .join("");
    const redo = st.missLog.length;
    body.innerHTML = `<p class="item-sub">This map is just for you. It shows the mistakes you keep meeting, so you know what to practice. Nothing here is a grade.</p>
      <h3>${top.length ? "Patterns to watch" : shown.length ? "Mistakes so far" : "Nothing yet"}</h3>
      ${shown.length ? `<ul class="think-list">${list}</ul>` : "<p>No wrong answers recorded yet. Keep going. When you miss one, it shows up here.</p>"}
      ${redo ? `<p><button type="button" class="btn btn-go" data-redeem>Redemption round (${Math.min(redo, 5)} to redo)</button></p>` : ""}
      ${calibrationHtml()}
      <h3>Your numbers</h3><p>First-try accuracy: <strong>${st.stats.tries ? Math.round((100 * st.stats.first) / st.stats.tries) : 0}%</strong> · Best streak: <strong>${st.stats.best}</strong> · Hints used: <strong>${st.stats.hints}</strong> · Extra reps: <strong>${st.stats.reps}</strong></p>
      <h3>Done on this computer?</h3><p class="item-sub">This page keeps your work only on this computer: your stars, solved problems, notes and the map above. Nothing is sent anywhere. If another class uses this computer next, clear yours first.</p><p><button type="button" class="btn btn-sm" data-handoff>I am finished on this computer</button></p>
      ${has("share") ? '<p><button type="button" class="btn btn-sm" data-copy>Copy my results</button> <span class="item-sub">A short note with no name. Paste it to your teacher or family.</span></p>' : ""}`;
    body.querySelector("[data-redeem]")?.addEventListener("click", () => redemption(body, dlg));
    body.querySelector("[data-handoff]")?.addEventListener("click", () => {
      if (
        !window.confirm(
          "Clear everything this page saved on this computer (stars, solved problems, notes)? Copy your results first if you want to keep a note.",
        )
      )
        return;
      const key = String(rt.api.data.storageKey);
      for (const k of [key, `${key}_p1`]) W.StudioStore.clear(k);
      try {
        for (const k of Object.keys(localStorage))
          if (k === `ewl_u${String(rt.api.data.lesson).replace("-", "_l")}_v2`)
            localStorage.removeItem(k);
      } catch (_e) {
        /* storage blocked: nothing to clear */
      }
      location.reload();
    });
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
        ".item-q, .item-sub:not(.nline-read), .choice-btn, .sort-card, .match-item, .item-fb, .lab-trail li",
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
    // The lab model and the mission live in shadow roots: read what the student needs from the game (the goal, the readout, the last message).
    for (const host of /** @type {HTMLElement[]} */ ([
      ...stage.querySelectorAll(".lab-model, .lab-mission"),
    ])) {
      const root = host.shadowRoot;
      if (!root) continue;
      for (const n of /** @type {HTMLElement[]} */ ([
        ...root.querySelectorAll(
          ".target, .goal-gap, .model-readout strong, .game-feedback, .lab-expedition-status",
        ),
      ])) {
        const t = (n.textContent || "").replace(/\s+/g, " ").trim();
        if (t) parts.push(t);
      }
    }
    return parts.join(". ");
  }
  /** A voice for the language, or "" when this device has none (Chromebooks often lack a Spanish voice). */
  function voiceFor(/** @type {boolean} */ spanish) {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (!voices.length) return "pending";
    return voices.some((v) => v.lang.toLowerCase().startsWith(spanish ? "es" : "en")) ? "ok" : "";
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
    if (voiceFor(spanish) === "") {
      rt.api.say(
        spanish
          ? "This device has no Spanish voice, so Read cannot speak Spanish here. The text is still on the page."
          : "This device has no English voice for Read.",
      );
      return;
    }
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

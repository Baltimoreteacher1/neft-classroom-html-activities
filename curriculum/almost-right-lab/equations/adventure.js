/* =============================================================================
 * Almost-Right Lab — expedition engine shared by the five equation missions.
 * -----------------------------------------------------------------------------
 * The mission pages keep their own teaching flow (diagnose → explain → fix →
 * practice → creature retry → result). This layer turns that flow into an
 * expedition through the mission's world (adventure-worlds.js):
 *
 *   EARN   Only the page's own validated answers pay. The page calls
 *          award(key, …) after ARLCoach/its checker accepts an answer. Each key
 *          (e.g. "practice|x + 5 = 17") pays ONCE per device, ever, so
 *          re-solving, reloading or revealing never pays twice. +1 for the
 *          correct answer, +1 more for a first try, and in the Storm Lab +1
 *          for picking the right undo tool before solving.
 *   CHOOSE The student spends on three build tracks (levels cost 1, 2, 3).
 *          Building one track to level 3 earns that track's trophy; every
 *          track at level 2 or more earns the balanced trophy. A run rarely
 *          affords both, so the plan is a real choice.
 *   FINISH finish() at the result screen picks the ending, banks the trophy,
 *          and starts a new expedition next time something is earned. New
 *          rewards after that come from new numbers (the page's practiceAgain).
 *
 * Nothing here times the student. State lives in localStorage under
 * "arl-adventure-v1"; a bad or missing store just starts fresh.
 * ========================================================================== */
(() => {
  const STORE = "arl-adventure-v1";
  const COSTS = [1, 2, 3];
  const LEDGER_CAP = 400;
  const UNDO = { add: "sub", sub: "add", mul: "div", div: "mul" };
  const TOOL_LABEL = { add: "+ Add", sub: "− Subtract", mul: "× Multiply", div: "÷ Divide" };
  const TOOL_WORD = { add: "adding", sub: "subtracting", mul: "multiplying", div: "dividing" };

  let all;
  let id = "";
  let world;
  let totalSteps = 5;
  const ui = {};
  /** Undo-tool picks for the Storm Lab, by equation text: "first" | "later". */
  const toolPicks = new Map();

  const num = (v, lo, hi) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.floor(v))) : lo);
  const calm = () =>
    !!window.GameStudio?.settings?.reducedMotion ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const plural = (n) => (n === 1 ? world.resource[0] : world.resource[1]);

  function load() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(STORE) || "null");
    } catch {}
    return raw && raw.v === 1 && raw.missions && typeof raw.missions === "object"
      ? raw
      : { v: 1, missions: {} };
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(all));
    } catch {}
  }
  /** The current mission's record, repaired if a stored value is malformed. */
  function me() {
    const m = all.missions[id] || {};
    const tracks = Array.isArray(m.tracks) ? m.tracks : [];
    const clean = {
      pouch: num(m.pouch, 0, 9999),
      tracks: [0, 1, 2].map((i) => num(tracks[i], 0, 3)),
      maxed: Array.isArray(m.maxed) ? m.maxed.filter((t) => t === 0 || t === 1 || t === 2) : [],
      ledger: Array.isArray(m.ledger)
        ? m.ledger.filter((k) => typeof k === "string").slice(-LEDGER_CAP)
        : [],
      progress: num(m.progress, 0, 99),
      finished: m.finished === true,
      expeditions: num(m.expeditions, 0, 9999),
      trophies: Array.isArray(m.trophies) ? m.trophies.filter((t) => typeof t === "string") : [],
      lastEnding: typeof m.lastEnding === "string" ? m.lastEnding : "",
    };
    all.missions[id] = clean;
    return clean;
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function say(text) {
    ui.msg.textContent = text;
  }
  function pop(node) {
    if (!node || calm()) return;
    node.classList.remove("adv-pop");
    void node.getBoundingClientRect();
    node.classList.add("adv-pop");
  }
  function toast(text) {
    const t = el("div", "adv-toast", text);
    t.setAttribute("aria-hidden", "true");
    document.body.append(t);
    t.addEventListener("animationend", () => t.remove());
    if (calm()) setTimeout(() => t.remove(), 1500);
  }

  // ── Mount ────────────────────────────────────────────────────────────────
  function mount() {
    const host = document.getElementById("steps-area");
    const root = el("section", "adv");
    root.id = "adv-world";
    root.dataset.world = world.key;
    root.setAttribute("aria-labelledby", "adv-title");
    root.innerHTML = `
      <div class="adv-head">
        <div><div class="adv-kicker">Expedition</div><h2 class="adv-title" id="adv-title"></h2></div>
        <div class="adv-pouch" aria-live="polite"><span class="adv-token" aria-hidden="true"></span><span class="adv-pouch-n" id="adv-pouch"></span></div>
      </div>
      <p class="adv-intro"></p>
      <div class="adv-scene-wrap"><svg class="adv-scene" viewBox="0 0 640 240" role="img" aria-labelledby="adv-scene-label"><title id="adv-scene-label"></title></svg></div>
      <div class="adv-builds" role="group" aria-label="Choose what to build"></div>
      <p class="adv-msg" id="adv-msg" role="status" aria-live="polite"></p>
      <div class="adv-action hidden" id="adv-action"></div>
      <div class="adv-foot"><span class="adv-shelf" id="adv-shelf"></span></div>`;
    host.prepend(root);
    ui.root = root;
    ui.pouch = root.querySelector("#adv-pouch");
    ui.msg = root.querySelector("#adv-msg");
    ui.action = root.querySelector("#adv-action");
    ui.shelf = root.querySelector("#adv-shelf");
    ui.foot = root.querySelector(".adv-foot");
    ui.svg = root.querySelector(".adv-scene");
    ui.label = root.querySelector("#adv-scene-label");
    root.querySelector(".adv-title").textContent = world.name;
    root.querySelector(".adv-intro").textContent = world.intro;
    root.querySelector(".adv-token").style.background = world.tokenColor;

    ui.svg.insertAdjacentHTML("beforeend", world.scene + pathMarkup() + avatarMarkup());
    ui.mover = ui.svg.querySelector(".adv-mover");

    const builds = root.querySelector(".adv-builds");
    ui.buildBtns = world.tracks.map((track, t) => {
      const btn = el("button", "adv-build-btn");
      btn.type = "button";
      btn.dataset.track = String(t);
      btn.innerHTML =
        '<span class="adv-bname"></span><span class="adv-pips" aria-hidden="true"><i></i><i></i><i></i></span><span class="adv-bcost"></span>';
      btn.querySelector(".adv-bname").textContent = track.name;
      btn.title = track.note;
      btn.addEventListener("click", () => build(t));
      builds.append(btn);
      return btn;
    });
    if (world.tools) mountTools();
  }

  function pathMarkup() {
    const pts = world.stops;
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y + 4}`).join(" ");
    const dots = pts
      .map(
        (p, i) =>
          `<circle class="adv-stop" data-i="${i}" cx="${p.x}" cy="${p.y + 4}" r="${i === pts.length - 1 ? 6 : 4}"/>`,
      )
      .join("");
    return `<path class="adv-path" d="${d}"/>${dots}`;
  }
  function avatarMarkup() {
    return `<g class="adv-mover"><g class="adv-avatar">
      <ellipse cx="0" cy="-10" rx="11" ry="10" fill="#f4d9c6" stroke="#c9a48a"/>
      <circle cx="0" cy="-25" r="10" fill="#f4d9c6" stroke="#c9a48a"/>
      <circle cx="-4" cy="-26" r="2.2" fill="#14223a"/><circle cx="4" cy="-26" r="2.2" fill="#14223a"/>
      <path d="M-4 -21 Q0 -18 4 -21" stroke="#c04a1f" stroke-width="1.4" fill="none"/>
      <path d="M-4 -34 L-6 -40 M4 -34 L6 -40" stroke="#e05a2b" stroke-width="1.5"/>
      <circle cx="-6" cy="-41" r="2" fill="#e05a2b"/><circle cx="6" cy="-41" r="2" fill="#205fa6"/>
    </g></g>`;
  }

  // ── Render state ─────────────────────────────────────────────────────────
  function render(changedTrack) {
    const m = me();
    ui.pouch.textContent = `${m.pouch} ${plural(m.pouch)}`;
    ui.buildBtns.forEach((btn, t) => {
      const lvl = m.tracks[t];
      const cost = COSTS[lvl];
      const full = lvl >= 3;
      btn.disabled = m.finished || full || m.pouch < cost;
      btn.classList.toggle("is-ready", !btn.disabled);
      btn.querySelectorAll(".adv-pips i").forEach((pip, i) => pip.classList.toggle("on", i < lvl));
      btn.querySelector(".adv-bcost").textContent = full
        ? "Complete"
        : `Level ${lvl + 1}: ${cost} ${plural(cost)}`;
      const status = full
        ? "complete"
        : `level ${lvl} of 3, next level costs ${cost} ${plural(cost)}${m.pouch < cost ? ", not enough yet" : ""}`;
      btn.setAttribute("aria-label", `Build ${world.tracks[t].name}: ${status}.`);
    });
    ui.svg.querySelectorAll(".adv-build").forEach((g) => {
      const on = m.tracks[Number(g.dataset.t)] >= Number(g.dataset.l);
      const fresh = on && !g.classList.contains("on") && Number(g.dataset.t) === changedTrack;
      g.classList.toggle("on", on);
      if (fresh && !calm()) g.classList.add("adv-rise");
    });
    const last = world.stops.length - 1;
    const at = m.finished ? last : Math.min(m.progress, last - 1);
    const p = world.stops[at];
    ui.mover.style.transform = `translate(${p.x}px, ${p.y}px)`;
    ui.svg.querySelectorAll(".adv-stop").forEach((s, i) => s.classList.toggle("passed", i <= at));
    const built = world.tracks.map((t, i) => `${t.name} level ${m.tracks[i]}`).join(", ");
    ui.label.textContent = `${world.name}. ${built}. Your guide is at stop ${at + 1} of ${last + 1}.`;
    renderShelf(m);
    renderNewRun(m);
  }

  function renderShelf(m) {
    ui.shelf.replaceChildren();
    ui.shelf.append(el("span", "adv-shelf-label", `Trophies here: ${m.trophies.length} of 4`));
    world.endings.forEach((end) => {
      const has = m.trophies.includes(end.id);
      const chip = el("span", `adv-trophy${has ? " has" : ""}`, has ? end.title : "?");
      chip.setAttribute("aria-label", has ? `Trophy earned: ${end.title}` : "Trophy not found yet");
      ui.shelf.append(chip);
    });
    const total = Object.values(all.missions).reduce(
      (n, r) => n + (Array.isArray(r?.trophies) ? r.trophies.length : 0),
      0,
    );
    ui.shelf.append(el("span", "adv-shelf-label", `· All lab trophies: ${total} of 20`));
  }

  /** After a finished expedition, offer a fresh one with new numbers. */
  function renderNewRun(m) {
    let btn = document.getElementById("adv-new-run");
    const want = m.finished && typeof window.practiceAgain === "function";
    if (!want) {
      btn?.remove();
      return;
    }
    if (btn) return;
    btn = el("button", "btn-secondary adv-new-run", "New expedition: practice with new numbers");
    btn.id = "adv-new-run";
    btn.type = "button";
    btn.addEventListener("click", () => {
      btn.remove();
      window.practiceAgain();
    });
    ui.foot.prepend(btn);
  }

  // ── Earn ─────────────────────────────────────────────────────────────────
  /**
   * Pay for one validated answer. Call ONLY after the page's checker accepted it.
   * @param {string} key  stable id of the solved item, e.g. "main|x + 7 = 19"
   * @param {{firstTry?: boolean, eq?: string, value?: number}} [info]
   */
  function award(key, info = {}) {
    if (!world || typeof key !== "string" || !key) return { paid: false, amount: 0 };
    const m = me();
    if (info.eq) showAction(info.eq);
    if (m.ledger.includes(key)) {
      say(`Already collected for this one. New numbers bring new ${world.resource[1]}.`);
      return { paid: false, amount: 0 };
    }
    if (m.finished) {
      m.finished = false;
      m.tracks = [0, 0, 0];
      m.maxed = [];
      m.progress = 0;
    }
    const parts = ["+1 correct"];
    let amount = 1;
    if (info.firstTry) {
      amount += 1;
      parts.push("+1 first try");
    }
    if (info.eq && toolPicks.get(info.eq) === "first") {
      amount += 1;
      parts.push("+1 right undo tool");
    }
    m.pouch += amount;
    m.ledger.push(key);
    m.ledger = m.ledger.slice(-LEDGER_CAP);
    m.progress += 1;
    save();
    render();
    const can = m.tracks.some((lvl) => lvl < 3 && m.pouch >= COSTS[lvl]);
    say(
      `You earned ${amount} ${plural(amount)} (${parts.join(", ")}).${can ? " Choose something to build." : ""}`,
    );
    toast(`+${amount} ${plural(amount)}`);
    pop(ui.pouch.parentElement);
    return { paid: true, amount };
  }

  // ── Choose ───────────────────────────────────────────────────────────────
  function build(t) {
    const m = me();
    if (m.finished) {
      say("This expedition is finished. Solve new equations to start the next one.");
      return;
    }
    const lvl = m.tracks[t];
    if (lvl >= 3) return;
    const cost = COSTS[lvl];
    if (m.pouch < cost) {
      say(`You need ${cost} ${plural(cost)} for that. Solve more equations to earn them.`);
      return;
    }
    m.pouch -= cost;
    m.tracks[t] = lvl + 1;
    if (lvl + 1 === 3 && !m.maxed.includes(t)) m.maxed.push(t);
    save();
    render(t);
    const track = world.tracks[t];
    say(`${track.name} is now level ${lvl + 1} of 3. ${track.note}`);
  }

  // ── Finish ───────────────────────────────────────────────────────────────
  function ending(m) {
    if (m.tracks.every((lvl) => lvl >= 2)) return world.endings[3];
    if (m.maxed.length) return world.endings[m.maxed[0]];
    return null;
  }

  /** Called from the page's result screen. Banks the ending once per run. */
  function finish() {
    if (!world) return;
    const m = me();
    const card = resultCard();
    if (m.progress === 0 || m.finished) {
      const prev = world.endings.find((e) => e.id === m.lastEnding);
      fillCard(card, {
        title: prev ? `Last expedition: ${prev.title}` : "No new rewards this time",
        line: "Equations you already solved only pay once. Practice with new numbers to start a new expedition.",
      });
      render();
      return;
    }
    const end = ending(m);
    const plan = world.tracks.map((t, i) => `${t.short} ${m.tracks[i]}`).join(" · ");
    let line;
    let fresh = false;
    if (end) {
      fresh = !m.trophies.includes(end.id);
      if (fresh) m.trophies.push(end.id);
      line = `${end.line} ${fresh ? "New trophy for your shelf!" : "You already had this trophy."}`;
    } else {
      line = "Build one thing all the way to level 3, or everything to level 2, to earn a trophy.";
    }
    const missing = world.endings.filter((e) => !m.trophies.includes(e.id)).map((e) => e.title);
    m.finished = true;
    m.expeditions += 1;
    m.lastEnding = end ? end.id : "";
    save();
    render();
    fillCard(card, {
      title: end ? end.title : "Expedition complete",
      line,
      plan: `Your plan: ${plan}. ${m.pouch} ${plural(m.pouch)} saved for next time.`,
      next: missing.length
        ? `Still to find: ${missing.join(", ")}. Try a different plan next time.`
        : "You found all four trophies in this world!",
      fresh,
    });
    say(end ? `Expedition complete: ${end.title}.` : "Expedition complete.");
  }

  function resultCard() {
    let card = document.getElementById("adv-result");
    if (!card) {
      card = el("div", "adv-result");
      card.id = "adv-result";
      card.dataset.world = world.key;
      card.setAttribute("role", "status");
      const anchor = document.querySelector("#step-complete .nav-buttons");
      anchor?.before(card);
    }
    return card;
  }
  function fillCard(card, info) {
    card.replaceChildren();
    const medal = el("div", `adv-medal${info.fresh ? " fresh" : ""}`);
    medal.setAttribute("aria-hidden", "true");
    card.append(
      medal,
      el("div", "adv-result-kicker", `${world.name} expedition`),
      el("h3", "adv-result-title", info.title),
    );
    card.append(el("p", "", info.line));
    if (info.plan) card.append(el("p", "adv-result-plan", info.plan));
    if (info.next) card.append(el("p", "adv-result-next", info.next));
    pop(medal);
  }

  // ── Field action: what the solved equation means in this world ───────────
  function showAction(eqText) {
    const eq = window.ARLCoach?.parse(eqText);
    if (!eq) return;
    const x = window.ARLCoach.solve(eq);
    const { a, b } = eq;
    const box = ui.action;
    box.replaceChildren();
    box.classList.remove("hidden");
    const title = el("div", "adv-action-title", `${world.actionTitle}: `);
    title.append(el("span", "adv-action-eq", eqText));
    box.append(title);
    const row = el("div", `adv-viz adv-viz-${eq.kind}`);
    const blk = (text, cls = "") => el("span", `adv-blk ${cls}`, text);
    let caption;
    if (eq.kind === "add" || eq.kind === "sub") {
      const left = el("div", "adv-pan");
      const right = el("div", "adv-pan");
      if (eq.kind === "add") {
        left.append(blk("x", "is-x"), blk(`+ ${a}`, "is-off"));
        right.append(blk(String(b)), blk(`− ${a}`, "is-off"));
        caption = `Take ${a} off both sides: x = ${b} − ${a} = ${x}.`;
      } else {
        left.append(blk("x", "is-x"), blk(`− ${a}`, "is-off"));
        right.append(blk(String(b)), blk(`+ ${a}`, "is-on"));
        caption = `Put the ${a} back on both sides: x = ${b} + ${a} = ${x}.`;
      }
      row.append(left, el("span", "adv-eqsign", "="), right);
    } else {
      const groups = el("div", "adv-groups");
      const n = Math.min(a, 12);
      const each = eq.kind === "mul" ? x : b;
      for (let i = 0; i < n; i += 1) {
        const g = blk(String(each), "is-group");
        g.style.setProperty("--i", String(i));
        groups.append(g);
      }
      row.append(groups, el("span", "adv-eqsign", "→"), blk(`x = ${x}`, "is-x"));
      caption =
        eq.kind === "mul"
          ? `${a} equal groups make ${b}. Split ${b} into ${a} groups: x = ${b} ÷ ${a} = ${x}.`
          : `x was split into ${a} equal parts of ${b}. Put them back together: x = ${b} × ${a} = ${x}.`;
    }
    box.append(row, el("p", "adv-caption", caption));
  }

  // ── Storm Lab: pick the undo tool before solving ─────────────────────────
  function mountTools() {
    document.querySelectorAll(".practice-item").forEach((item) => {
      const eqEl = item.querySelector(".practice-eq");
      const belt = el("div", "adv-tools");
      belt.setAttribute("role", "group");
      const label = el("span", "adv-tools-label", "Pick the undo tool:");
      belt.append(label);
      const fb = el("span", "adv-tools-fb");
      fb.setAttribute("role", "status");
      fb.setAttribute("aria-live", "polite");
      Object.keys(TOOL_LABEL).forEach((op) => {
        const btn = el("button", "adv-tool", TOOL_LABEL[op]);
        btn.type = "button";
        btn.dataset.op = op;
        btn.addEventListener("click", () => pickTool(item, btn, fb));
        belt.append(btn);
      });
      belt.append(fb);
      item.querySelector(".practice-input-row")?.before(belt);
      const reset = () => {
        belt.querySelectorAll(".adv-tool").forEach((b) => {
          b.disabled = false;
          b.classList.remove("right", "wrong");
        });
        fb.textContent = "";
        belt.setAttribute("aria-label", `Pick the undo tool for ${eqEl.textContent.trim()}`);
      };
      reset();
      new MutationObserver(reset).observe(eqEl, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
  }
  function pickTool(item, btn, fb) {
    const eqText = item.querySelector(".practice-eq").textContent.trim();
    const eq = window.ARLCoach?.parse(eqText);
    if (!eq || btn.disabled) return;
    const right = UNDO[eq.kind];
    const solved = item.querySelector(".ans-input")?.disabled;
    if (btn.dataset.op === right) {
      if (!toolPicks.has(eqText) && !solved) toolPicks.set(eqText, "first");
      btn.classList.add("right");
      btn.parentElement.querySelectorAll(".adv-tool").forEach((b) => {
        b.disabled = true;
      });
      fb.textContent = `Yes. The equation is ${TOOL_WORD[eq.kind]}, so ${TOOL_WORD[right]} undoes it.`;
    } else {
      toolPicks.set(eqText, "later");
      btn.classList.add("wrong");
      btn.disabled = true;
      fb.textContent =
        btn.dataset.op === eq.kind
          ? `That does the same thing again. Pick the opposite of ${TOOL_WORD[eq.kind]}.`
          : `Look at what is done to x in ${eqText}. Pick its opposite.`;
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────
  function init(opts) {
    const worlds = window.ARLWorlds || {};
    id = String(opts?.missionId || "");
    world = worlds[id];
    if (!world || !document.getElementById("steps-area")) return;
    totalSteps = 2 + num(opts?.totalPractice, 1, 12);
    all = load();
    mount();
    const m = me();
    render();
    if (m.expeditions || m.progress || m.pouch) {
      say(
        m.finished
          ? `Welcome back. You have ${m.pouch} ${plural(m.pouch)} saved. Practice with new numbers to start a new expedition.`
          : `Welcome back. Your expedition is saved: ${m.progress} of ${totalSteps} stops done.`,
      );
    } else {
      say(
        `Solve equations correctly to earn ${world.resource[1]}. Wrong answers never cost you anything.`,
      );
    }
  }

  /** @type {any} */ (window).ARLAdventure = {
    init,
    award,
    finish,
    /** Test/debug view of the saved record for this mission. */
    state: () => (world ? JSON.parse(JSON.stringify(me())) : null),
  };
})();

/**
 * Lab bench for the hand-built Unit 4 studios. Those pages do not run the Practice Studio v2 runtime, so this gives the same item
 * kinds (kinds-basic.js `wr`, kinds-lab.js `lab` and `mission`) the small ctx they expect and a card to live in. Everything the
 * student does is saved under one localStorage key per page; nothing here awards stars or touches the page's own state.
 *
 *   StudioLabEmbed.mount(host, { items, key, labV })
 *
 * `items` are the studio items a bench becomes (scripts/lib/practice-studio-bench.mjs `benchItems`), so a Unit 4 page and a generated
 * studio run the same code on the same data. Contract: docs/specs/practice-studio-v2.md section 10.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const U = () => RT.util;
  const esc = (/** @type {any} */ s) => U().esc(s);
  const es = (/** @type {any} */ s) => U().es(s);

  const fresh = () => ({
    solved: {},
    acts: {},
    notes: {},
    rubric: {},
    hints: {},
    sorts: {},
    ticks: {},
    picks: {},
    cells: {},
    calib: {},
  });
  const load = (/** @type {string} */ key) => {
    try {
      return { ...fresh(), ...JSON.parse(localStorage.getItem(key) || "{}") };
    } catch (_e) {
      return fresh();
    }
  };

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec) {
    const { items, key } = spec;
    RT.api = RT.api || { data: { labV: spec.labV } };
    RT.kinds.broken = RT.kinds.broken || {
      mount(/** @type {any} */ ctx) {
        ctx.host.textContent = "This activity could not load.";
      },
    };
    const state = load(key);
    const save = () => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (_e) {
        /* progress stays in memory for this visit */
      }
    };
    const live = document.createElement("p");
    live.className = "sr-only";
    live.setAttribute("role", "status");
    const count = document.querySelector("[data-lab-count]");
    const refresh = () => {
      if (count)
        count.textContent = `${items.filter((/** @type {any} */ it) => state.solved[it.id]).length} of ${items.length} done`;
    };

    const draw = () => {
      host.textContent = "";
      items.forEach((/** @type {any} */ it) => {
        const slot = document.createElement("section");
        slot.className = "lab-embed-item item-body";
        slot.setAttribute(
          "aria-label",
          it.k === "mission" ? "Challenge mission" : "Lab bench task",
        );
        host.append(slot);
        const hintHtml = () => {
          const hs = it.h || [];
          if (!hs.length) return "";
          const shown = Math.min(hs.length, state.hints[it.id] || 0);
          const list = hs
            .slice(0, shown)
            .map(
              (/** @type {string} */ h, /** @type {number} */ i) =>
                `<li>${esc(h)}${es((it.hEs || [])[i])}</li>`,
            )
            .join("");
          return `<div class="hint-area"><ol class="hint-list">${list}</ol>${
            shown < hs.length
              ? `<button type="button" class="btn btn-sm" data-hint>💡 ${shown ? "Another hint" : "Give me a hint"}</button>`
              : ""
          }</div>`;
        };
        const ctx = {
          it,
          tab: 0,
          state,
          host: slot,
          redeem: false,
          solved: !!state.solved[it.id],
          es: () => document.body.classList.contains("show-es"),
          save,
          say: (/** @type {string} */ m) => {
            live.textContent = m;
          },
          misses: () => 0,
          hintBlock: hintHtml,
          openHint: () =>
            /** @type {HTMLElement | null} */ (slot.querySelector("[data-hint]"))?.click(),
          fb(/** @type {string} */ kind, /** @type {string} */ html) {
            const box = slot.querySelector(".item-fb");
            if (!box) return;
            box.className = `item-fb feedback-box show ${kind}`;
            box.innerHTML = html;
          },
          showSolved(/** @type {string} */ html) {
            ctx.fb("ok", html);
          },
          solve(/** @type {string} */ html) {
            state.solved[it.id] = true;
            ctx.fb("ok", `<strong>Nice.</strong> ${html}`);
            ctx.say("Correct");
            save();
            refresh();
          },
          miss(/** @type {any} */ m) {
            const text = m.say || "Look again at what the task asks, then try again.";
            ctx.fb(
              m.kind || "err",
              `${m.noLead ? "" : "<strong>Not yet.</strong> "}${esc(text)}${es(m.sayEs || "")}`,
            );
            ctx.say("Not yet");
          },
        };
        slot.addEventListener("click", (e) => {
          const b = /** @type {HTMLElement} */ (e.target).closest("[data-hint]");
          if (!b || !slot.contains(b)) return;
          state.hints[it.id] = (state.hints[it.id] || 0) + 1;
          const area = slot.querySelector(".hint-area");
          if (area) area.outerHTML = hintHtml();
          save();
        });
        const kind = RT.kinds[it.k];
        if (!kind) return void (slot.textContent = "This kind of task is not available.");
        try {
          kind.mount(ctx);
        } catch (e) {
          console.warn("Lab bench item failed to mount", it.id, e);
          RT.kinds.broken.mount(ctx);
        }
      });
      host.append(live);
      refresh();
    };
    draw();
    // the page's own Español button flips body.show-es without re-rendering us: draw again so the game and its text follow
    let spanish = document.body.classList.contains("show-es");
    new MutationObserver(() => {
      const now = document.body.classList.contains("show-es");
      if (now === spanish) return;
      spanish = now;
      draw();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  W.StudioLabEmbed = { mount };
})();

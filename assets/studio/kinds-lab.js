/**
 * Practice Studio v2 — the learning-lab item kinds: `lab` (a live model with a predict-first step and a target to
 * reach by changing ONE control) and `mission` (the labs' expedition game, three destinations, run inside the page).
 * Same ctx contract as kinds-basic.js. Nothing here knows any mathematics: the model, the prediction judge and the
 * puzzle maker are the learning labs' own modules, imported at runtime from /curriculum/learning-labs/shared/, so a
 * fix to a lab model reaches every studio. Contract: docs/specs/practice-studio-v2.md section 9.
 *
 * lab.css styles whole pages (it sets rules on body, button and h1), so each model and each game lives in a shadow
 * root with that sheet adopted; the prompt, hints, feedback and progress stay in the studio's own DOM.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const K = (RT.kinds = RT.kinds || {});
  const U = () => RT.util;
  const esc = (/** @type {any} */ s) => U().esc(s);
  const es = (/** @type {any} */ s) => U().es(s);
  const BASE = "/curriculum/learning-labs/shared/";

  /** @type {Promise<any> | null} */
  let libPromise = null;
  /** @type {Promise<CSSStyleSheet> | null} */
  let sheetPromise = null;

  // The page ships a content stamp for the lab files (data.labV), so a lab fix is never hidden by a cached copy.
  const stamp = () => `?v=${RT.api?.data?.labV || "0"}`;
  const lib = () => {
    libPromise ||= Promise.all(
      ["model", "math", "predict", "sound", "expedition"].map(
        (n) => import(/* @vite-ignore */ `${BASE}${n}.mjs${stamp()}`),
      ),
    ).then(([model, math, predict, sound, expedition]) => ({
      model,
      math,
      predict,
      sound,
      expedition,
    }));
    return libPromise;
  };

  // lab.css targets :root; rewritten once to :host so it styles a shadow root exactly as it styles a lab page.
  const sheet = () => {
    sheetPromise ||= fetch(`${BASE}lab.css${stamp()}`)
      .then((r) => r.text())
      .then((css) => {
        const s = new CSSStyleSheet();
        s.replaceSync(
          `${css.replace(/:root/g, ":host")}\n:host{display:block;background:#f4f8fa;border-radius:12px;font-size:16px}`,
        );
        return s;
      });
    return sheetPromise;
  };

  async function shadowStage(/** @type {HTMLElement} */ host, /** @type {string} */ label) {
    const root = host.shadowRoot || host.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [await sheet()];
    root.innerHTML = "";
    const stage = document.createElement("div");
    stage.setAttribute("role", "group");
    stage.setAttribute("aria-label", label);
    root.append(stage);
    return stage;
  }

  const levelName = (/** @type {any} */ it) => {
    const path = W.EWLChrome?.pathway;
    if (path?.scaffold) return "support";
    return it.level === "stretch" ? "stretch" : "core";
  };

  // A lab file that cannot load (offline, blocked) must not mark the item solved the way a broken item is: the
  // student can move on, and the item stays open for the next visit.
  const failed = (/** @type {any} */ ctx, /** @type {any} */ error) => {
    console.warn("Studio lab item could not load", ctx.it.id, error);
    ctx.host.innerHTML = `<p class="item-q">${esc(ctx.it.q)}${es(ctx.it.qEs)}</p><div class="item-fb feedback-box" role="status"></div>`;
    ctx.showSolved(
      `The interactive model could not load. Check your connection and reload this page to try again.${es("El modelo interactivo no pudo cargar. Revisa tu conexión y recarga la página para intentarlo de nuevo.")}`,
    );
  };

  /* ---- lab: change one control until the model's own readout reaches the target --------------------- */
  K.lab = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const st = ctx.state;
      const mem = (st.acts[it.id] = st.acts[it.id] || {});
      mem.predict = mem.predict || { right: 0, total: 0 };
      ctx.host.innerHTML = `<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
        <p class="item-sub lab-show"></p>
        <div class="lab-predict" role="group" aria-label="Your prediction"></div>
        <div class="answer-zone"><div class="lab-model"></div>
        <p class="item-sub lab-gap" role="status" aria-live="polite"></p>
        ${ctx.solved ? "" : `<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-lab>Check my model${es("Revisar mi modelo")}</button></div>`}</div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      const modelHost = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-model"));
      const gap = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-gap"));
      const predictEl = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-predict"));
      const showEl = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-show"));

      lib()
        .then(async (L) => {
          const { mountModel, guidance } = L.model;
          const { judge } = L.predict;
          const stage = await shadowStage(modelHost, "Interactive model");
          const tips = guidance(it.model);
          showEl.textContent = tips.show;
          const goal = it.goal;
          let latest = null;
          let pending = null;
          let settle = 0;

          const drawPredict = (/** @type {string} */ message = "") => {
            if (ctx.solved) return void (predictEl.innerHTML = "");
            const p = mem.predict;
            const en = [
              ["up", "Go up ▲", "Sube ▲"],
              ["down", "Go down ▼", "Baja ▼"],
              ["same", "Stay the same ＝", "Se queda igual ＝"],
            ];
            predictEl.innerHTML = `<p class="item-sub"><strong>Predict first.${es("Predice primero.")}</strong> After your next change, will <em>${esc(latest?.result.label || "the readout")}</em> go up, go down, or stay the same?${es("Después de tu próximo cambio, ¿subirá, bajará o se quedará igual?")}</p>
              <div class="item-actions">${en
                .map(
                  ([v, a, b]) =>
                    `<button type="button" class="btn btn-sm" data-predict="${v}" aria-pressed="${pending?.choice === v}">${a}${es(b)}</button>`,
                )
                .join("")}</div>
              <p class="item-sub" role="status" aria-live="polite">${esc(message)}${p.total ? ` Predictions: ${p.right} of ${p.total} right.` : ""}</p>`;
            for (const b of /** @type {HTMLElement[]} */ ([
              ...predictEl.querySelectorAll("[data-predict]"),
            ]))
              b.addEventListener("click", () => {
                pending = { choice: b.dataset.predict, base: latest?.result.value };
                drawPredict("Now change the model. I will check your prediction when you stop.");
                /** @type {HTMLElement | null} */ (
                  predictEl.querySelector(`[data-predict="${b.dataset.predict}"]`)
                )?.focus();
              });
          };

          const describe = (/** @type {any} */ result) => {
            gap.textContent =
              goal.target === undefined
                ? `${result.label}: ${result.equation}.`
                : `${result.label}: ${result.equation}. Target: ${goal.target}${result.unit ? ` ${result.unit}` : ""}.`;
          };

          const onChange = (/** @type {number[]} */ values, /** @type {any} */ result) => {
            const first = !latest;
            latest = { values, result };
            mem.values = values;
            ctx.save();
            describe(result);
            if (first) return drawPredict();
            if (!pending || pending.base === undefined) return;
            clearTimeout(settle);
            settle = /** @type {any} */ (
              setTimeout(() => {
                const v = judge(pending.choice, pending.base, result.value, result.label);
                if (v.actual === "same" && pending.choice !== "same") return;
                mem.predict.total++;
                if (v.ok) mem.predict.right++;
                pending = null;
                ctx.save();
                if (v.ok) L.sound.play("star");
                drawPredict(v.message);
              }, 700)
            );
          };

          const start = mem.values || it.model.values;
          const model = mountModel(stage.appendChild(document.createElement("div")), it.model, {
            initial: start,
            free: goal.target !== undefined && Number.isInteger(goal.free) ? goal.free : null,
            onChange,
            prefix: `lab-${it.id}`,
            level: levelName(it),
            lens: true,
          });
          drawPredict();

          const reached = () => {
            const r = model.result();
            if (goal.target !== undefined)
              return Number.isFinite(r.value) && Math.abs(r.value - goal.target) < 1e-6;
            if (goal.match)
              return Object.entries(goal.match).every(
                ([i, v]) => Math.abs(model.values[Number(i)] - /** @type {number} */ (v)) < 1e-9,
              );
            return r.pass === goal.pass;
          };
          const explain = () => `<strong>Target reached.</strong> ${esc(it.x)}${es(it.xEs)}`;
          if (ctx.solved) return ctx.showSolved(explain());

          ctx.host.querySelector("[data-check-lab]")?.addEventListener("click", () => {
            if (!model.valid) {
              return ctx.miss({
                tag: "lab-invalid",
                say: "One control has a value the model cannot use. Fix the highlighted box, then check again.",
                noLead: true,
              });
            }
            if (reached()) {
              L.sound.play("hit");
              return ctx.solve(explain());
            }
            const r = model.result();
            const dir =
              goal.target === undefined
                ? "not yet"
                : r.value > goal.target
                  ? "too high"
                  : "too low";
            ctx.miss({
              tag: `lab-${dir.replace(" ", "-")}`,
              say: `${goal.target === undefined ? "That setting does not meet the goal yet" : `${r.label} is ${dir}`}: the model shows ${r.equation}. ${it.miss || "Predict how the readout will change when you change the control, then test your prediction."}`,
              sayEs: it.missEs || "",
              kind: "warn",
              noLead: true,
            });
          });
        })
        .catch((e) => failed(ctx, e));
    },
  };

  /* ---- mission: the labs' expedition game, three destinations, solved when all three are restored -------- */
  K.mission = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const mem = (ctx.state.acts[it.id] = ctx.state.acts[it.id] || {});
      ctx.host.innerHTML = `<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
        <p class="item-sub">Plan each build before you test it. Hints and retries are free, and nothing here is timed.${es("Planea cada construcción antes de probarla. Las pistas y los reintentos son gratis, y nada tiene tiempo.")}</p>
        <div class="answer-zone"><div class="lab-mission"></div></div><div class="item-fb feedback-box" role="status"></div>`;
      const mount = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-mission"));
      const finish = () =>
        ctx.solve(`<strong>Mission complete.</strong> ${esc(it.x)}${es(it.xEs)}`);
      lib()
        .then(async (L) => {
          const stage = await shadowStage(mount, "Challenge mission");
          const body = stage.appendChild(document.createElement("div"));
          const lab = { id: it.lab, finale: it.finale, model: it.model, vocabulary: [] };
          L.expedition.mountExpedition(body, lab, mem, ctx.save, levelName(it), null, {
            complete: () => {
              if (!ctx.solved) finish();
            },
          });
          if (ctx.solved)
            ctx.showSolved(`<strong>Mission complete.</strong> ${esc(it.x)}${es(it.xEs)}`);
        })
        .catch((e) => failed(ctx, e));
    },
  };
})();

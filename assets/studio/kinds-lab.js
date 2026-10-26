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
          `${css.replace(/:root/g, ":host")}\n:host{display:block;background:#f4f8fa;border-radius:12px;font-size:16px}\n${W.StudioLabCss || ""}`,
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
    host.dispatchEvent(new CustomEvent("studio:stage", { bubbles: true, detail: { stage } }));
    return stage;
  }

  const levelName = (/** @type {any} */ it) => {
    const path = W.EWLChrome?.pathway;
    if (path?.scaffold) return "support";
    return it.level === "stretch" ? "stretch" : "core";
  };

  // Warm the lab modules and stylesheet while the student reads the page, so the first model or mission opens at once.
  // A student on Data Saver or a slow connection pays for the files only when they open an item.
  const savingData = () => {
    const c = /** @type {any} */ (navigator).connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(String(c.effectiveType || ""))));
  };
  const warm = () => {
    if (RT.api?.data?.labV && !savingData()) {
      lib().catch(() => {});
      sheet().catch(() => {});
    }
  };
  if (typeof requestIdleCallback === "function") requestIdleCallback(() => setTimeout(warm, 1200));
  else setTimeout(warm, 2500);

  /* ---- words the page says, in both languages (English first, Spanish beneath when Español is on) -------- */
  const b = (/** @type {string} */ en, /** @type {string} */ sp) => `${esc(en)}${es(sp)}`;
  /** "Goal: Number of pieces = 36 · You can change: Ribbon length (meters)" from the lesson's own labels, no library needed. */
  function goalLine(/** @type {any} */ it) {
    const L = it.labels;
    const goal = it.goal;
    const inl = (/** @type {any} */ n) =>
      n
        ? `${esc(n.en)}${es(n.es) ? ` <span class="es-text" lang="es">/ ${esc(n.es)}</span>` : ""}`
        : "";
    if (goal.target !== undefined && L)
      return `<strong>${b("Goal:", "Meta:")}</strong> ${inl(L.readout)} = ${esc(goal.target)} · <strong>${b("You can change:", "Puedes cambiar:")}</strong> ${inl(L.controls?.[goal.free])}`;
    if (goal.pass !== undefined)
      return `<strong>${b("Goal:", "Meta:")}</strong> ${b(goal.pass ? "a test value that meets the rule" : "a test value that does NOT meet the rule", goal.pass ? "un valor de prueba que cumpla la regla" : "un valor de prueba que NO cumpla la regla")}`;
    return `<strong>${b("Goal:", "Meta:")}</strong> ${b("build what the task above describes", "construye lo que describe la tarea de arriba")}`;
  }

  /** A paper copy of a lab task: the same goal, a try-it table named with the model's own controls, a frame. Printed, and shown if the model cannot load. */
  function twinHtml(/** @type {any} */ it) {
    const L = it.labels;
    const names = L
      ? Object.keys(L.controls || {})
          .sort((x, y) => Number(x) - Number(y))
          .map((k) => L.controls[k])
      : [];
    const head = [...names, L?.readout, { en: "My prediction", es: "Mi predicción" }].filter(
      Boolean,
    );
    const rows = [1, 2, 3, 4]
      .map(() => `<tr>${head.map(() => "<td>&nbsp;</td>").join("")}</tr>`)
      .join("");
    return `<div class="lab-twin"><h4>${b("On paper", "En papel")}</h4>
      <p>${esc(it.q)}${es(it.qEs)}</p><p>${goalLine(it)}</p>
      <table class="lab-twin-table"><thead><tr>${head.map((n) => `<th>${esc(n.en)}${es(n.es)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
      <p>${b("I predict ___. I changed ___. The model showed ___ because ___.", "Predigo ___. Cambié ___. El modelo mostró ___ porque ___.")}</p></div>`;
  }

  // A lab file that cannot load (offline, blocked) must not mark the item solved the way a broken item is: the student can move on
  // (and do the task on paper), and the item stays open for the next visit.
  const failed = (/** @type {any} */ ctx, /** @type {any} */ error) => {
    console.warn("Studio lab item could not load", ctx.it.id, error);
    ctx.host.innerHTML = `<p class="item-q">${U().stem(ctx.it.q, ctx.it.qEs)}</p><div class="item-fb feedback-box" role="status"></div>${twinHtml(ctx.it).replace('class="lab-twin"', 'class="lab-twin lab-twin-shown"')}`;
    ctx.showSolved(
      `${b("The interactive model could not load. Check your connection and reload, or do this task on paper below.", "El modelo interactivo no pudo cargar. Revisa tu conexión y recarga, o haz esta tarea en papel abajo.")}`,
    );
  };

  /* ---- lab: change one control until the model's own readout reaches the target --------------------- */
  K.lab = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const st = ctx.state;
      const mem = (st.acts[it.id] = st.acts[it.id] || {});
      mem.predict = mem.predict || { right: 0, total: 0 };
      mem.tests = mem.tests || [];
      st.calib = st.calib || {};
      const lang = () => (ctx.es() ? "es" : "en");
      ctx.host.classList.add("lab-item");
      ctx.host.innerHTML = `<p class="item-q">${U().stem(it.q, it.qEs)}</p>
        <p class="item-sub lab-show"></p>
        <p class="item-sub lab-goal">${goalLine(it)}</p>
        <div class="lab-goalbar">
        ${ctx.solved ? "" : `<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-lab>${b("Check my model", "Revisar mi modelo")}</button></div>`}</div>
        <div class="lab-predict" role="group" aria-label="${esc(ctx.es() ? "Tu predicción" : "Your prediction")}"></div>
        <div class="answer-zone"><div class="lab-model"></div><div class="lab-trail" hidden></div></div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>${twinHtml(it)}`;
      const modelHost = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-model"));
      const predictEl = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-predict"));
      const showEl = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-show"));
      const trailEl = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-trail"));
      const DIRS = {
        high: ["too high", "demasiado alto"],
        low: ["too low", "demasiado bajo"],
        miss: ["not yet", "todavía no"],
        ok: ["✓ reached", "✓ logrado"],
      };
      const drawTrail = () => {
        trailEl.hidden = !mem.tests.length;
        if (!mem.tests.length) return;
        trailEl.innerHTML = `<p><strong>${b("My tests", "Mis pruebas")}</strong></p><ol>${mem.tests
          .map(
            (t) =>
              `<li>${esc(t.equation)} — ${esc(DIRS[t.dir][0])}${ctx.es() ? ` / ${esc(DIRS[t.dir][1])}` : ""}</li>`,
          )
          .join("")}</ol>`;
      };
      drawTrail();

      lib()
        .then(async (L) => {
          const { mountModel, guidance } = L.model;
          const { judge } = L.predict;
          const stage = await shadowStage(modelHost, "Interactive model");
          const tips = guidance(it.model);
          showEl.textContent = tips.show;
          const goal = it.goal;
          const readoutEn = (/** @type {any} */ r) => it.labels?.readout?.en || r.label;
          const readoutEs = (/** @type {any} */ r) => it.labels?.readout?.es || r.label;
          let latest = null;
          let pending = null;
          let settle = 0;

          const drawPredict = (
            /** @type {string} */ message = "",
            /** @type {string} */ messageEs = "",
          ) => {
            if (ctx.solved) return void (predictEl.innerHTML = "");
            const p = mem.predict;
            const opts = [
              ["up", "Go up", "Sube", "▲"],
              ["down", "Go down", "Baja", "▼"],
              ["same", "Stay the same", "Se queda igual", "＝"],
            ];
            const name = latest ? readoutEn(latest.result) : it.labels?.readout?.en || "the result";
            const nameEs = latest
              ? readoutEs(latest.result)
              : it.labels?.readout?.es || "el resultado";
            predictEl.innerHTML = `<p class="item-sub"><strong>${b("Predict first.", "Predice primero.")}</strong> ${esc(`After your next change, will “${name}” go up, go down, or stay the same?`)}${es(`Después de tu próximo cambio, ¿“${nameEs}” subirá, bajará o se quedará igual?`)}</p>
              <div class="item-actions">${opts
                .map(
                  ([v, a, sp, glyph]) =>
                    `<button type="button" class="btn btn-sm" data-predict="${v}" aria-pressed="${pending?.choice === v}"><span aria-hidden="true">${glyph}</span> ${esc(a)}${es(sp)}</button>`,
                )
                .join("")}</div>
              <p class="item-sub lab-predict-note">${esc(message)}${es(messageEs)}${p.total ? ` ${b(`Predictions: ${p.right} of ${p.total} right.`, `Predicciones: ${p.right} de ${p.total} correctas.`)}` : ""}</p>`;
            for (const btn of /** @type {HTMLElement[]} */ ([
              ...predictEl.querySelectorAll("[data-predict]"),
            ]))
              btn.addEventListener("click", () => {
                pending = { choice: btn.dataset.predict, base: latest?.result.value };
                drawPredict(
                  "Now change the model. I will check your prediction when you stop.",
                  "Ahora cambia el modelo. Revisaré tu predicción cuando te detengas.",
                );
                /** @type {HTMLElement | null} */ (
                  predictEl.querySelector(`[data-predict="${btn.dataset.predict}"]`)
                )?.focus();
              });
          };

          const onChange = (/** @type {number[]} */ values, /** @type {any} */ result) => {
            const first = !latest;
            latest = { values, result };
            mem.values = values;
            ctx.save();
            if (first) return drawPredict();
            if (!pending || pending.base === undefined) return;
            clearTimeout(settle);
            settle = /** @type {any} */ (
              setTimeout(() => {
                const v = judge(
                  pending.choice,
                  pending.base,
                  result.value,
                  readoutEn(result),
                  readoutEs(result),
                );
                if (v.actual === "same" && pending.choice !== "same") return;
                mem.predict.total++;
                if (v.ok) mem.predict.right++;
                pending = null;
                ctx.save();
                if (v.ok) L.sound.play("star");
                drawPredict(v.message, v.messageEs);
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
            labels: it.labels || null,
            lang,
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
          const explain = () =>
            `<strong>${b("Target reached.", "Meta lograda.")}</strong> ${U().tx(it.x)}${U().txEs(it.xEs)}`;
          if (ctx.solved) return ctx.showSolved(explain());

          const checkBtn = /** @type {HTMLButtonElement | null} */ (
            ctx.host.querySelector("[data-check-lab]")
          );
          if (checkBtn) checkBtn.disabled = false;

          checkBtn?.addEventListener("click", () => {
            if (!model.valid) {
              ctx.fb(
                "warn",
                `${b("One control has a value the model cannot use. Fix the box marked invalid, then check again.", "Un control tiene un valor que el modelo no puede usar. Corrige el cuadro marcado como no válido y revisa de nuevo.")}`,
              );
              return;
            }
            const r = model.result();
            const ok = reached();
            const dir = ok
              ? "ok"
              : goal.target === undefined
                ? "miss"
                : r.value > goal.target
                  ? "high"
                  : "low";
            mem.tests.push({ equation: r.equation, dir });
            if (mem.tests.length > 12) mem.tests.shift();
            drawTrail();
            const cal = st.calib[it.id];
            if (ok) {
              L.sound.play("hit");
              if (cal && cal.ok === null) cal.ok = mem.tests.length === 1;
              return ctx.solve(explain());
            }
            // An exploring student is not penalised: a miss here neither resets the streak nor enters the Mistake Map (a direction is not a misconception).
            if (cal && cal.ok === null) cal.ok = false;
            const say =
              goal.target === undefined
                ? "That setting does not meet the goal yet"
                : `The result is ${dir === "high" ? "too high" : "too low"}`;
            const sayEs =
              goal.target === undefined
                ? "Ese valor todavía no cumple la meta"
                : `El resultado está ${dir === "high" ? "demasiado alto" : "demasiado bajo"}`;
            ctx.fb(
              "warn",
              `${b(`${say}: the model shows ${r.equation}. ${it.miss || "Predict how the result will change when you change the control, then test your prediction."}`, `${sayEs}: el modelo muestra ${r.equation}. ${it.missEs || ""}`)}`,
            );
            ctx.say("Not yet");
            ctx.save();
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
      const twin = `<div class="lab-twin"><h4>${b("On paper", "En papel")}</h4><p>${esc(it.q)}${es(it.qEs)}</p>
        <table class="lab-twin-table"><thead><tr><th>${b("Stop", "Parada")}</th><th>${b("Goal", "Meta")}</th><th>${b("My plan", "Mi plan")}</th><th>${b("Test 1", "Prueba 1")}</th><th>${b("Test 2", "Prueba 2")}</th><th>${b("It worked because…", "Funcionó porque…")}</th></tr></thead><tbody>${[1, 2, 3].map((n) => `<tr><td>${n}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join("")}</tbody></table></div>`;
      ctx.host.innerHTML = `<p class="item-q">${U().stem(it.q, it.qEs)}</p>
        <p class="item-sub">${b("Plan each build before you test it. Hints and retries are free, and nothing here is timed.", "Planea cada construcción antes de probarla. Las pistas y los reintentos son gratis, y nada tiene tiempo.")}</p>
        <div class="answer-zone"><div class="lab-mission"></div></div><div class="item-fb feedback-box" role="status"></div>${twin}`;
      const mount = /** @type {HTMLElement} */ (ctx.host.querySelector(".lab-mission"));
      const finish = () =>
        ctx.solve(
          `<strong>${b("Mission complete.", "Misión completa.")}</strong> ${U().tx(it.x)}${U().txEs(it.xEs)}`,
        );
      lib()
        .then(async (L) => {
          const stage = await shadowStage(mount, "Challenge mission");
          const body = stage.appendChild(document.createElement("div"));
          const lab = {
            id: it.lab,
            finale: it.finale,
            // The mission's puzzles are built on the prism formula: a bench that opens on the pyramid net plays the mission on the prism.
            model: { ...it.model, shape: undefined },
            labels: it.model.shape ? null : it.labels || null,
            vocabulary: [],
          };
          L.expedition.mountExpedition(body, lab, mem, ctx.save, levelName(it), null, {
            lang: () => (ctx.es() ? "es" : "en"),
            complete: () => {
              if (!ctx.solved) finish();
            },
          });
          if (ctx.solved)
            ctx.showSolved(
              `<strong>${b("Mission complete.", "Misión completa.")}</strong> ${U().tx(it.x)}${U().txEs(it.xEs)}`,
            );
        })
        .catch((e) => failed(ctx, e));
    },
  };
})();

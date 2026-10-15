/* EWL.Canvas.Flow — one scene as a six-stage path: Predict, Manipulate, Observe, Explain, Generalize, Transfer.
 *
 *   var flow = EWL.Canvas.Flow.mount(host, scene, { preset, lens, onExit })   -> { render(), destroy() }
 *
 * Progress goes to EWLStateStore.setCanvas(scene.id, {stage, done}); every attempt goes to
 * EWLStateStore.addEvidence(scene.activity, entry). Help is a question, then a picture, then a counterexample;
 * the checked result appears only when the student presses "Show checked result" after two attempts.
 * Predict and Transfer keep the picture hidden until the student needs it. No student name is stored.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const C = (EWL.Canvas = EWL.Canvas || {});
  const STAGES = ["predict", "manipulate", "observe", "explain", "generalize", "transfer"];
  const NAMES = {
    predict: ["Predict", "Predice"],
    manipulate: ["Try it", "Pruébalo"],
    observe: ["Observe", "Observa"],
    explain: ["Explain", "Explica"],
    generalize: ["Generalize", "Generaliza"],
    transfer: ["Transfer", "Aplica"],
  };
  C.STAGES = STAGES;
  C.STAGE_NAMES = NAMES;
  const tr = (o, k) => EWL.t(o[k], o[`${k}Es`]);
  const featuredFor = (scene, lens) => {
    const alias = {
      tape: ["tape", "strip"],
      dnl: ["dnl", "line"],
      table: ["table"],
      plane: ["plane"],
      balance: ["balance"],
    };
    const want = alias[lens] || [lens];
    return scene.reps.filter((r) => want.indexOf(r) >= 0)[0] || null;
  };
  C.featuredFor = featuredFor;

  C.Flow = {
    mount(host, scene, opts) {
      opts = opts || {};
      const h = EWL.h;
      const store = EWL.state;
      const kind = C.kinds[scene.kind];
      const preset0 =
        scene.presets.filter((p) => p.id === opts.preset)[0] ||
        scene.presets.filter((p) => p.id === scene.defaultPreset)[0];
      const saved = store.get().canvas[scene.id] || null;
      const feat = opts.lens ? featuredFor(scene, opts.lens) : null;
      let preset = preset0;
      let params = kind.init(preset.params);
      let stage =
        saved && !saved.done && STAGES.indexOf(saved.stage) > 0 ? STAGES.indexOf(saved.stage) : 0;
      let reached = stage;
      let done = !!(saved && saved.done);
      let pictureShown = false;
      let visible = scene.reps.slice(0, 4);
      if (feat) visible = [feat].concat(visible.filter((r) => r !== feat)).slice(0, 4);
      let lens = null;
      let figHost = null;
      let tried = new Set([kind.key(params)]);
      const wrap = h("section", { class: "cv-scene", "aria-labelledby": `cv-title-${scene.id}` });
      host.appendChild(wrap);

      const evidence = (entry) => store.addEvidence(scene.activity, entry);
      const specNow = () => C.specOf(Object.assign({}, scene, { reps: visible }), params);
      const figureVisible = () => (stage >= 1 && stage <= 4) || pictureShown;

      function mountLens(hl) {
        if (lens) lens.destroy();
        lens = null;
        if (!figHost) return;
        try {
          lens = EWL.Lens.mount(figHost, specNow(), { lang: EWL.lang() });
          if (hl) lens.highlight(hl);
        } catch (e) {
          figHost.appendChild(
            h(
              "p",
              { class: "cv-note" },
              EWL.t(
                "This picture cannot show that amount. Try another.",
                "Este dibujo no puede mostrar esa cantidad. Prueba otra.",
              ),
            ),
          );
        }
      }
      function showPicture(hl) {
        pictureShown = true;
        render({ keepPanel: true, hl });
      }
      function go(i) {
        stage = i;
        reached = Math.max(reached, i);
        pictureShown = false;
        store.setCanvas(scene.id, { stage: STAGES[i], done });
        render({ focusPanel: true });
        EWL.announce(
          `${EWL.t("Stage", "Etapa")} ${i + 1}: ${EWL.t(NAMES[STAGES[i]][0], NAMES[STAGES[i]][1])}`,
        );
      }
      function setParams(next, focusKey) {
        params = next;
        tried.add(kind.key(params));
        render({ keepPanel: false, focusKey });
      }
      const apply = (ctl, raw) => {
        const next = C.applyControl(scene, params, ctl, raw);
        if (!next) return false;
        setParams(
          next,
          ctl.type === "text" ? ctl.id : ctl.type === "stepper" ? null : `${ctl.id}-${raw}`,
        );
        return true;
      };

      /* ---- stage panels ---- */
      function askFor(block, task, opt) {
        const ans = block.answer;
        const choices =
          ans.type === "choice"
            ? ans.choices.map((c) => ({ value: c.value, label: EWL.t(c.label, c.labelEs) }))
            : null;
        return C.W.ask({
          input: choices ? "radios" : "rat",
          options: choices,
          legend: EWL.t("Your answer", "Tu respuesta"),
          label: EWL.t("Your answer", "Tu respuesta"),
          placeholder: ans.placeholder,
          evaluate: (raw) => C.check(task, raw),
          help: (step, raw) =>
            step === 1 && opt.pictureHint
              ? opt.pictureHint
              : EWL.Reason.ladder(task, { value: raw }, step, EWL.lang()).text,
          reveal: () => C.revealText(ans, task, EWL.lang()),
          okText: opt.okText,
          unreadableText: EWL.t(
            "I could not read that. Try a number like 3/4, 0.75 or 75%.",
            "No pude leer eso. Prueba un número como 3/4, 0.75 o 75 %.",
          ),
          continueLabel: opt.continueLabel,
          onStep: (step) => step >= 1 && opt.onPicture && opt.onPicture(),
          onAttempt: ({ raw, result, attempts }) => opt.onAttempt(raw, result, attempts),
          onSolved: opt.onSolved,
          onRevealed: opt.onRevealed,
          onContinue: opt.onContinue,
        });
      }

      function predictPanel() {
        const p = scene.predict;
        const task = C.task(p.task.kind, p.task.args);
        const ask = askFor(p, task, {
          pictureHint: tr(p, "pictureHint"),
          okText: EWL.t(
            "That matches the checked result. Now test it with the picture.",
            "Eso coincide con el resultado verificado. Ahora pruébalo con el dibujo.",
          ),
          continueLabel: EWL.t(
            "Next: try it with the picture",
            "Siguiente: pruébalo con el dibujo",
          ),
          onPicture: () => showPicture(p.highlight),
          onAttempt: (raw, result, n) =>
            evidence({
              prediction: raw,
              ok: result.state === "ok",
              rule: result.rule ? result.rule.id : undefined,
              note: `predict, try ${n}`,
            }),
          onContinue: () => go(1),
        });
        return h("div", null, h("p", { class: "cv-prompt" }, tr(p, "prompt")), ask.el);
      }

      function manipulatePanel() {
        const m = scene.manipulate;
        const need = m.minSettings || 3;
        const ctx = { params: () => params, preset: () => preset, apply, setParams };
        const presetChips = scene.presets.map((p) =>
          h(
            "button",
            {
              type: "button",
              class: "ewl-chip",
              "data-fk": `pre-${p.id}`,
              "aria-pressed": p.id === preset.id ? "true" : "false",
              onclick: () => {
                preset = p;
                setParams(kind.init(p.params), `pre-${p.id}`);
              },
            },
            tr(p, "label"),
          ),
        );
        const left = Math.max(0, need - tried.size);
        const status = h(
          "p",
          { class: "cv-status", role: "status", "aria-live": "polite" },
          left > 0
            ? EWL.t(
                `Settings you have tried: ${tried.size} of ${need}`,
                `Ajustes que has probado: ${tried.size} de ${need}`,
              )
            : EWL.t(
                "Nice. You have tried enough settings.",
                "Muy bien. Has probado suficientes ajustes.",
              ),
        );
        const next = h(
          "button",
          {
            type: "button",
            class: "ewl-btn",
            "data-primary": "",
            disabled: left > 0 ? "" : null,
            onclick: () => {
              evidence({ data: { settings: Array.from(tried).slice(0, 12) }, note: "manipulate" });
              go(2);
            },
          },
          EWL.t("Next: what do you notice?", "Siguiente: ¿qué notas?"),
        );
        return h(
          "div",
          null,
          h("p", { class: "cv-prompt" }, tr(m, "prompt")),
          h(
            "div",
            {
              class: "cv-ctl cv-chips",
              role: "group",
              "aria-label": EWL.t("Examples", "Ejemplos"),
            },
            h("span", { class: "cv-ctl-label" }, EWL.t("Examples", "Ejemplos")),
            presetChips,
          ),
          C.controls(scene, ctx),
          status,
          h("div", { class: "ewl-row cv-actions" }, next),
        );
      }

      function transferPanel() {
        let n = 0;
        const box = h("div", { class: "cv-transfer" });
        const build = () => {
          pictureShown = false;
          const tr0 = C.makeTransfer(scene, n);
          const ans = tr0.answer;
          const prompt = EWL.t(tr0.prompt, tr0.promptEs);
          const again = () => {
            n += 1;
            EWL.clear(box);
            build();
            renderFigureOnly();
          };
          const ask = askFor({ answer: ans }, tr0.task, {
            pictureHint: EWL.t(
              "Use the same kind of picture as before. Where would these numbers go?",
              "Usa el mismo tipo de dibujo de antes. ¿Dónde irían estos números?",
            ),
            okText: EWL.t(
              "Correct. You used the idea on a new problem.",
              "Correcto. Usaste la idea en un problema nuevo.",
            ),
            continueLabel: EWL.t("Try another new problem", "Probar otro problema nuevo"),
            onPicture: () => {
              pictureShown = true;
              renderFigureOnly();
            },
            onAttempt: (raw, result, k) =>
              evidence({
                prediction: raw,
                data: { problem: tr0.prompt },
                ok: result.state === "ok",
                rule: result.rule ? result.rule.id : undefined,
                note: `transfer ${n + 1}, try ${k}`,
              }),
            onSolved: () => {
              done = true;
              store.setCanvas(scene.id, { stage: "transfer", done: true });
              box.appendChild(finishCard());
              renderHeaderOnly();
            },
            onRevealed: () => {},
            onContinue: again,
          });
          box.appendChild(h("p", { class: "cv-prompt" }, prompt));
          box.appendChild(ask.el);
        };
        build();
        return box;
      }
      const finishCard = () =>
        h(
          "div",
          { class: "cv-finish" },
          C.W.msg(
            "ok",
            EWL.t(
              "You finished this canvas. Your work is saved on this device.",
              "Terminaste este lienzo. Tu trabajo se guardó en este dispositivo.",
            ),
          ),
          opts.onExit
            ? h(
                "button",
                { type: "button", class: "ewl-btn", onclick: opts.onExit },
                EWL.t("Choose another canvas", "Elegir otro lienzo"),
              )
            : null,
        );

      const env = { evidence, go, facts: () => kind.facts(params, specNow(), EWL.lang()) };
      const PANELS = {
        predict: predictPanel,
        manipulate: manipulatePanel,
        observe: () => C.Panels.observe(scene, env),
        explain: () => C.Panels.explain(scene, env),
        generalize: () => C.Panels.generalize(scene, env),
        transfer: transferPanel,
      };

      /* ---- frame ---- */
      let panelHost = null;
      let headHost = null;
      let figCol = null;
      function headerNode() {
        const lessons = scene.lessons.join(", ");
        const chips = [
          h("span", { class: "cv-chip" }, `${EWL.t("Unit", "Unidad")} ${scene.unit}`),
          h(
            "span",
            { class: "cv-chip" },
            `${EWL.t(scene.lessons.length > 1 ? "Lessons" : "Lesson", scene.lessons.length > 1 ? "Lecciones" : "Lección")} ${lessons}`,
          ),
          h("span", { class: "cv-chip" }, scene.standard),
        ];
        if (done)
          chips.push(
            h("span", { class: "cv-chip cv-chip-done" }, `✓ ${EWL.t("Finished", "Terminado")}`),
          );
        const steps = STAGES.map((s, i) => {
          const state =
            i === stage ? "current" : i < stage || (done && i <= reached) ? "done" : "todo";
          return h(
            "li",
            { "data-state": state },
            h(
              "button",
              {
                type: "button",
                class: "cv-stepbtn",
                "aria-current": i === stage ? "step" : null,
                disabled: i > reached ? "" : null,
                onclick: () => i !== stage && go(i),
              },
              h(
                "span",
                { class: "cv-stepnum", "aria-hidden": "true" },
                state === "done" ? "✓" : String(i + 1),
              ),
              h("span", { class: "cv-stepname" }, EWL.t(NAMES[s][0], NAMES[s][1])),
            ),
          );
        });
        return h(
          "header",
          { class: "cv-head" },
          h("h2", { id: `cv-title-${scene.id}`, tabindex: "-1" }, tr(scene, "title")),
          h("p", { class: "cv-blurb" }, tr(scene, "blurb")),
          h("div", { class: "ewl-row cv-chips-row" }, chips),
          h("ol", { class: "cv-steps", "aria-label": EWL.t("Stages", "Etapas") }, steps),
        );
      }
      function repToggles() {
        const fam = EWL.Lens.reg[scene.family];
        return h(
          "div",
          {
            class: "cv-ctl cv-chips",
            role: "group",
            "aria-label": EWL.t("Pictures to show", "Dibujos a mostrar"),
          },
          h("span", { class: "cv-ctl-label" }, EWL.t("Pictures", "Dibujos")),
          scene.reps.map((r) =>
            h(
              "button",
              {
                type: "button",
                class: "ewl-chip",
                "data-fk": `rep-${r}`,
                "aria-pressed": visible.indexOf(r) >= 0 ? "true" : "false",
                onclick: () => {
                  const on = visible.indexOf(r) >= 0;
                  if (on && visible.length === 1) return;
                  visible = on
                    ? visible.filter((v) => v !== r)
                    : scene.reps.filter((v) => visible.indexOf(v) >= 0 || v === r);
                  render({ keepPanel: true, focusKey: `rep-${r}` });
                },
              },
              EWL.t(fam.reps[r].label, fam.reps[r].labelEs),
            ),
          ),
        );
      }
      function figureNode() {
        figCol = h("div", { class: "cv-fig" });
        if (!figureVisible()) {
          figCol.appendChild(
            h(
              "div",
              { class: "cv-placeholder ewl-card" },
              h(
                "p",
                null,
                EWL.t(
                  "Your picture is waiting. Make your own prediction first. It will appear when you need a hint.",
                  "Tu dibujo está esperando. Primero haz tu propia predicción. Aparecerá cuando necesites una pista.",
                ),
              ),
            ),
          );
          figHost = null;
          return figCol;
        }
        figCol.appendChild(
          h(
            "div",
            { class: "ewl-card cv-figcard" },
            stage >= 1 && stage <= 4 ? repToggles() : null,
            (figHost = h("div", { class: "cv-lens" })),
          ),
        );
        return figCol;
      }
      function renderFigureOnly(hl) {
        const fresh = figureNode();
        const old = wrap.querySelector(".cv-fig");
        if (old) old.replaceWith(fresh);
        mountLens(hl);
      }
      function renderHeaderOnly() {
        const old = wrap.querySelector(".cv-head");
        if (old) old.replaceWith(headerNode());
      }
      function render(o) {
        o = o || {};
        const key = o.focusKey || null;
        const keepPanelEl = o.keepPanel && panelHost ? panelHost : null;
        const prevFocus = keepPanelEl ? root.document.activeElement : null;
        EWL.clear(wrap);
        wrap.appendChild(headerNode());
        panelHost =
          keepPanelEl ||
          h("div", { class: "cv-panel ewl-card", "aria-live": "off" }, PANELS[STAGES[stage]]());
        wrap.appendChild(h("div", { class: "cv-layout" }, panelHost, figureNode()));
        mountLens(o.hl);
        if (prevFocus && panelHost.contains(prevFocus)) prevFocus.focus();
        if (o.focusPanel) {
          const t = wrap.querySelector("h2");
          if (t) t.focus();
        } else if (key) {
          const el = wrap.querySelector(`[data-fk="${key}"]`);
          if (el) el.focus();
        }
      }
      render({});
      store.setCanvas(scene.id, { stage: STAGES[stage], done });
      return {
        render: () => render({}),
        destroy: () => {
          if (lens) lens.destroy();
          wrap.remove();
        },
      };
    },
  };
})(typeof window !== "undefined" ? window : globalThis);

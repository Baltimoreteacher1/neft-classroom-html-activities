/* EWL.Canvas.Panels — the Observe, Explain and Generalize stages of a scene.
 *
 *   C.Panels.observe(scene, env) / explain / generalize -> Element
 *   env = { evidence(entry), go(stageIndex), facts() -> [live readout lines] }
 * Same rules as the rest of the canvas: a wrong pick gets a question, never the worked result; "Show checked result"
 * appears only after two attempts.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const C = (EWL.Canvas = EWL.Canvas || {});
  const h = (...a) => EWL.h(...a);
  const tr = (o, k) => EWL.t(o[k], o[`${k}Es`]);

  C.Panels = {
    observe: function (scene, env) {
      const o = scene.observe;
      const facts = env.facts();
      let attempts = 0;
      const boxes = o.statements.map((s, i) => {
        const id = `obs-${scene.id}-${i}`;
        const input = h("input", { type: "checkbox", id });
        return {
          input,
          row: h("label", { class: "cv-radio", for: id }, input, h("span", null, tr(s, "text"))),
          truth: s.true,
        };
      });
      const fb = h("div", { class: "cv-fb", role: "status", "aria-live": "polite" });
      const say = (k, t) => {
        EWL.clear(fb);
        fb.appendChild(C.W.msg(k, t));
      };
      const reveal = h(
        "button",
        { type: "button", class: "ewl-btn", hidden: true },
        EWL.t("Show checked result", "Mostrar resultado verificado"),
      );
      const next = h(
        "button",
        {
          type: "button",
          class: "ewl-btn",
          "data-primary": "",
          hidden: true,
          onclick: () => env.go(3),
        },
        EWL.t("Next: explain it", "Siguiente: explícalo"),
      );
      const finish = () => {
        boxes.forEach((b) => b.input.setAttribute("disabled", ""));
        check.setAttribute("disabled", "");
        reveal.hidden = true;
        next.hidden = false;
      };
      const check = h(
        "button",
        {
          type: "button",
          class: "ewl-btn",
          "data-primary": "",
          onclick: () => {
            attempts += 1;
            const right = boxes.filter((b) => b.input.checked === b.truth).length;
            env.evidence({
              note: `observe, try ${attempts}`,
              ok: right === boxes.length,
              data: { right, of: boxes.length },
            });
            if (right === boxes.length) {
              say(
                "ok",
                EWL.t(
                  "Yes. Those are the statements that are true.",
                  "Sí. Esas son las afirmaciones verdaderas.",
                ),
              );
              finish();
              return;
            }
            say(
              "warn",
              EWL.t(
                `${right} of ${boxes.length} are marked right. Point at the parts of the pictures to test the ones you are unsure about.`,
                `${right} de ${boxes.length} están bien marcadas. Señala partes de los dibujos para probar las que dudas.`,
              ),
            );
            if (attempts >= 2) reveal.hidden = false;
          },
        },
        EWL.t("Check", "Comprobar"),
      );
      reveal.addEventListener("click", () => {
        boxes.forEach((b) => {
          b.input.checked = b.truth;
        });
        say(
          "warn",
          EWL.t(
            "Checked result: the statements now checked are the true ones.",
            "Resultado verificado: las afirmaciones marcadas ahora son las verdaderas.",
          ),
        );
        finish();
      });
      return h(
        "div",
        null,
        h("p", { class: "cv-facts", "aria-live": "polite" }, facts.join(" ")),
        h("p", { class: "cv-prompt" }, tr(o, "prompt")),
        h(
          "fieldset",
          { class: "cv-fieldset" },
          h("legend", null, EWL.t("What do you notice?", "¿Qué notas?")),
          boxes.map((b) => b.row),
        ),
        h("div", { class: "ewl-row cv-actions" }, check, reveal),
        fb,
        h("div", { class: "ewl-row cv-actions" }, next),
      );
    },
    explain: function (scene, env) {
      const e = scene.explain;
      let checks = 0;
      const ta = h("textarea", {
        class: "cv-text",
        rows: 5,
        maxlength: 700,
        "aria-label": EWL.t("Your explanation", "Tu explicación"),
      });
      const out = h("div", { class: "cv-fb", role: "status", "aria-live": "polite" });
      const next = h(
        "button",
        {
          type: "button",
          class: "ewl-btn",
          "data-primary": "",
          hidden: true,
          onclick: () => env.go(4),
        },
        EWL.t("Next: find the rule", "Siguiente: halla la regla"),
      );
      const frames = e.frames.map((f) =>
        h(
          "button",
          {
            type: "button",
            class: "ewl-chip",
            onclick: () => {
              ta.value = `${ta.value}${ta.value ? " " : ""}${EWL.t(f.en, f.es)}`;
              ta.focus();
            },
          },
          EWL.t(f.en, f.es),
        ),
      );
      const check = h(
        "button",
        {
          type: "button",
          class: "ewl-btn",
          "data-primary": "",
          onclick: () => {
            checks += 1;
            const s = EWL.Reason.scoreArgument(ta.value, e.spec);
            env.evidence({
              argument: ta.value.slice(0, 700),
              ok: s.complete,
              data: { score: `${s.done}/${s.total}` },
              note: `explain, check ${checks}`,
            });
            EWL.clear(out);
            out.appendChild(
              h(
                "ul",
                { class: "cv-rubric" },
                s.checks.map((c) =>
                  h(
                    "li",
                    { "data-ok": c.ok ? "1" : "0" },
                    h("span", { "aria-hidden": "true" }, c.ok ? "✓ " : "○ "),
                    EWL.t(c.label, c.labelEs),
                  ),
                ),
              ),
            );
            if (s.next) out.appendChild(C.W.msg("warn", EWL.t(s.next.ask, s.next.askEs)));
            else
              out.appendChild(
                C.W.msg(
                  "ok",
                  EWL.t(
                    "Your explanation has every part.",
                    "Tu explicación tiene todas las partes.",
                  ),
                ),
              );
            next.hidden = !(s.complete || checks >= 3);
          },
        },
        EWL.t("Check my explanation", "Revisar mi explicación"),
      );
      return h(
        "div",
        null,
        h("p", { class: "cv-prompt" }, tr(e, "prompt")),
        h(
          "div",
          {
            class: "ewl-row",
            role: "group",
            "aria-label": EWL.t("Sentence starters", "Inicios de oración"),
          },
          frames,
        ),
        ta,
        h("div", { class: "ewl-row cv-actions" }, check),
        out,
        h("div", { class: "ewl-row cv-actions" }, next),
      );
    },
    generalize: function (scene, env) {
      const g = scene.generalize;
      const order = EWL.rng(EWL.hash(scene.id)).shuffle(g.choices.map((c, i) => i));
      const options = order.map((i) => ({ value: String(i), label: tr(g.choices[i], "text") }));
      const ask = C.W.ask({
        input: "radios",
        options,
        legend: tr(g, "prompt"),
        evaluate: (raw) => ({ state: g.choices[Number(raw)].ok ? "ok" : "wrong" }),
        help: (step, raw) => {
          const c = g.choices[Number(raw)];
          const lead =
            step === 1
              ? EWL.t(
                  "Test it in the picture. Point at parts and see if it still works. ",
                  "Pruébalo en el dibujo. Señala partes y mira si sigue funcionando. ",
                )
              : "";
          return lead + tr(c, "ask");
        },
        reveal: () => tr(g, "rule"),
        okText: EWL.t("Yes. That rule always works.", "Sí. Esa regla siempre funciona."),
        unreadableText: EWL.t("Pick one first.", "Elige una primero."),
        continueLabel: EWL.t(
          "Next: use it on a new problem",
          "Siguiente: úsala en un problema nuevo",
        ),
        onAttempt: ({ raw, result }) =>
          env.evidence({
            claim: g.choices[Number(raw)].text,
            ok: result.state === "ok",
            note: "generalize",
          }),
        onContinue: () => env.go(5),
      });
      return h("div", null, ask.el);
    },
  };
})(typeof window !== "undefined" ? window : globalThis);

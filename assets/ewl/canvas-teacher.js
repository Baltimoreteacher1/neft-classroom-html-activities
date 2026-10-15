/* EWL.Canvas teacher view (?teacher=1): the Evidence panel for THIS device's canvas work.
 *
 *   EWL.Canvas.summarize(state, scenes) -> rows   one row per scene: stage, done, tries, correct, misconceptions, last words
 *   EWL.Canvas.summaryText(rows, lang)  -> plain text for "Copy summary"
 *   EWL.Canvas.Teacher.mount(host, scenes) -> { destroy() }
 *
 * It reads only the local EWLStateStore. It never reads other students' data (class views remain the existing teacher tools)
 * and it holds no names: evidence has no student identity to show.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const C = (EWL.Canvas = EWL.Canvas || {});

  C.summarize = (state, scenes) =>
    scenes.map((s) => {
      const ev = (state.evidence && state.evidence[s.activity]) || [];
      const prog = (state.canvas && state.canvas[s.id]) || null;
      const tries = ev.filter((e) => e.prediction !== undefined || e.claim !== undefined);
      const rules = {};
      ev.forEach((e) => {
        if (e.rule) rules[e.rule] = (rules[e.rule] || 0) + 1;
      });
      const last = ev.filter((e) => e.argument).pop();
      return {
        id: s.id,
        title: s.title,
        titleEs: s.titleEs,
        unit: s.unit,
        lessons: s.lessons,
        stage: prog ? prog.stage : null,
        done: !!(prog && prog.done),
        entries: ev.length,
        tries: tries.length,
        correct: tries.filter((e) => e.ok).length,
        rules: Object.keys(rules).map((id) => {
          const r = EWL.Reason && EWL.Reason.ruleFor(id);
          return { id, name: r ? r.name : id, nameEs: r ? r.nameEs : id, count: rules[id] };
        }),
        argument: last ? String(last.argument).slice(0, 240) : "",
        at: ev.length ? ev[ev.length - 1].at : prog ? prog.at : 0,
      };
    });

  C.summaryText = (rows, lang) => {
    const t = (en, es) => (lang === "es" ? es : en);
    const lines = [
      t(
        "Living Math Canvas: work saved on this device",
        "Lienzo matemático vivo: trabajo guardado en este dispositivo",
      ),
    ];
    rows
      .filter((r) => r.entries || r.stage)
      .forEach((r) => {
        const rules = r.rules
          .map((x) => `${lang === "es" ? x.nameEs : x.name} (${x.count})`)
          .join("; ");
        lines.push(
          `${t(r.title, r.titleEs)} [${t("Unit", "Unidad")} ${r.unit}, ${r.lessons.join(" ")}]: ${r.done ? t("finished", "terminado") : `${t("at", "en")} ${r.stage || "-"}`}; ${r.correct}/${r.tries} ${t("answers correct", "respuestas correctas")}${rules ? `; ${t("ideas to revisit", "ideas por repasar")}: ${rules}` : ""}`,
        );
      });
    if (lines.length === 1)
      lines.push(
        t(
          "No canvas work has been saved on this device yet.",
          "Todavía no hay trabajo del lienzo guardado en este dispositivo.",
        ),
      );
    return lines.join("\n");
  };

  C.Teacher = {
    mount(host, scenes) {
      const h = EWL.h;
      const t = EWL.t;
      const lang = EWL.lang();
      const box = h("section", {
        class: "cv-teacher ewl-card",
        "aria-labelledby": "cv-teacher-title",
      });
      const rows = C.summarize(EWL.state.get(), scenes);
      const status = h("p", { class: "cv-note", role: "status", "aria-live": "polite" });
      const copy = () => {
        const text = C.summaryText(rows, lang);
        const done = () => {
          status.textContent = t("Summary copied.", "Resumen copiado.");
        };
        if (root.navigator && root.navigator.clipboard) {
          root.navigator.clipboard.writeText(text).then(done, () => {
            status.textContent = t(
              "Copy is blocked here. Select the table and copy it.",
              "Aquí no se puede copiar. Selecciona la tabla y cópiala.",
            );
          });
        } else
          status.textContent = t(
            "Copy is blocked here. Select the table and copy it.",
            "Aquí no se puede copiar. Selecciona la tabla y cópiala.",
          );
      };
      const body = rows.map((r) =>
        h(
          "tr",
          null,
          h(
            "th",
            { scope: "row" },
            t(r.title, r.titleEs),
            h("br"),
            h(
              "span",
              { class: "cv-note" },
              `${t("Unit", "Unidad")} ${r.unit} · ${r.lessons.join(", ")}`,
            ),
          ),
          h("td", null, r.done ? `✓ ${t("finished", "terminado")}` : r.stage ? r.stage : "—"),
          h("td", null, r.tries ? `${r.correct} / ${r.tries}` : "—"),
          h(
            "td",
            null,
            r.rules.length
              ? r.rules.map((x) => `${lang === "es" ? x.nameEs : x.name} (${x.count})`).join("; ")
              : "—",
          ),
          h("td", { class: "cv-arg" }, r.argument || "—"),
        ),
      );
      box.appendChild(
        h(
          "h2",
          { id: "cv-teacher-title" },
          t("Evidence from this device", "Evidencia de este dispositivo"),
        ),
      );
      box.appendChild(
        h(
          "p",
          { class: "cv-note" },
          t(
            "This shows only the work saved in this browser. It does not read other students' work. Class views stay in the existing teacher tools.",
            "Esto muestra solo el trabajo guardado en este navegador. No lee el trabajo de otros estudiantes. Las vistas de clase siguen en las herramientas docentes existentes.",
          ),
        ),
      );
      box.appendChild(
        h(
          "div",
          { class: "ewl-row cv-noprint" },
          h(
            "button",
            { type: "button", class: "ewl-btn", onclick: () => root.print() },
            t("Print", "Imprimir"),
          ),
          h(
            "button",
            { type: "button", class: "ewl-btn", onclick: copy },
            t("Copy summary", "Copiar resumen"),
          ),
        ),
      );
      box.appendChild(status);
      box.appendChild(
        h(
          "table",
          null,
          h(
            "caption",
            { class: "ewl-sr" },
            t("Canvas evidence by scene", "Evidencia del lienzo por escena"),
          ),
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              ["Canvas", "Stage", "Answers right", "Ideas to revisit", "Last explanation"].map(
                (c, i) =>
                  h(
                    "th",
                    { scope: "col" },
                    t(
                      c,
                      [
                        "Lienzo",
                        "Etapa",
                        "Respuestas correctas",
                        "Ideas por repasar",
                        "Última explicación",
                      ][i],
                    ),
                  ),
              ),
            ),
          ),
          h("tbody", null, body),
        ),
      );
      host.appendChild(box);
      return { destroy: () => box.remove() };
    },
  };
})(typeof window !== "undefined" ? window : globalThis);

/* Living Math Canvas page (/curriculum/math-canvas/): scene chooser, language, deep links, teacher panel.
 *
 * Deep link: ?scene=<id>&lesson=<id>&lens=<tape|dnl|table|plane|balance>&preset=<id>&lang=es  (&diag=1, &teacher=1)
 * Unknown values are ignored. With only ?lesson= the first canvas for that lesson opens.
 * Progress: EWLStateStore.setCanvas(sceneId, {stage, done}); evidence: addEvidence("ewl.canvas.<slug>", entry).
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const C = (EWL.Canvas = EWL.Canvas || {});

  function boot() {
    const doc = root.document;
    const host = doc.getElementById("canvas-root");
    if (!host) return;
    const h = EWL.h;
    const flags = EWL.flags();
    const query = new URLSearchParams(root.location.search);
    if (EWL.state) EWL.state.hydrateFromUrl(root.location.search);

    const fail = () => {
      EWL.clear(host);
      host.appendChild(
        h(
          "p",
          { class: "ewl-msg", "data-kind": "warn" },
          EWL.t(
            "The canvases could not load. Check your connection and reload this page.",
            "Los lienzos no se pudieron cargar. Revisa tu conexión y vuelve a cargar la página.",
          ),
        ),
      );
    };

    Promise.all([
      EWL.json("/data/ewl/canvas-scenes.json"),
      EWL.json("/data/curriculum-launch-manifest.json").catch(() => null),
    ])
      .then((res) => start(res[0], res[1]))
      .catch(fail);

    function start(data, manifest) {
      const scenes = data.scenes;
      const titles = {};
      ((manifest && manifest.lessons) || []).forEach((l) => {
        titles[l.id] = l.title;
      });
      const byId = (id) => scenes.filter((s) => s.id === id)[0] || null;
      const lessonQ = /^[1-9]\d?-\d{1,2}$/.test(query.get("lesson") || "")
        ? query.get("lesson")
        : null;
      let current = byId(query.get("scene"));
      if (!current && lessonQ)
        current = scenes.filter((s) => s.lessons.indexOf(lessonQ) >= 0)[0] || null;
      let flow = null;
      const top = h("div", { class: "cv-topbar" });
      const stage = h("div", { class: "cv-stage" });
      const chooser = h("div", { class: "cv-chooser" });
      host.appendChild(top);
      host.appendChild(stage);
      host.appendChild(chooser);

      function setUrl(patch) {
        const u = new URL(root.location.href);
        Object.keys(patch).forEach((k) =>
          patch[k] == null ? u.searchParams.delete(k) : u.searchParams.set(k, patch[k]),
        );
        root.history.replaceState(null, "", u.pathname + u.search + u.hash);
      }
      function setLang(l) {
        try {
          root.localStorage.setItem("ewl_lang", l);
        } catch (_e) {
          /* a blocked store only means the choice is not remembered */
        }
        setUrl({ lang: l });
        doc.documentElement.lang = l;
        renderAll();
      }
      function open(scene) {
        current = scene;
        setUrl({ scene: scene.id });
        query.set("scene", scene.id);
        renderAll();
        const hd = stage.querySelector("h2");
        if (hd) hd.focus();
      }
      function renderTop() {
        EWL.clear(top);
        const l = EWL.lang();
        const info =
          current && manifest
            ? current.lessons
                .map((id) => `${EWL.t("Lesson", "Lección")} ${id}: ${titles[id] || ""}`)
                .join(" · ")
            : EWL.t(
                "Pick a canvas to start. Every canvas works with a lesson you already know.",
                "Elige un lienzo para empezar. Cada lienzo va con una lección que ya conoces.",
              );
        top.appendChild(h("p", { class: "cv-lessonline" }, info));
        const chip = (code, label) =>
          h(
            "button",
            {
              type: "button",
              class: "ewl-chip",
              lang: code,
              "aria-pressed": l === code ? "true" : "false",
              onclick: () => setLang(code),
            },
            label,
          );
        top.appendChild(
          h(
            "div",
            { class: "ewl-row", role: "group", "aria-label": EWL.t("Language", "Idioma") },
            chip("en", "English"),
            chip("es", "Español"),
          ),
        );
      }
      function renderChooser() {
        EWL.clear(chooser);
        const units = Array.from(new Set(scenes.map((s) => s.unit))).sort((a, b) => a - b);
        chooser.appendChild(
          h(
            "h2",
            null,
            current
              ? EWL.t("Other canvases", "Otros lienzos")
              : EWL.t("Choose a canvas", "Elige un lienzo"),
          ),
        );
        const prog = EWL.state ? EWL.state.get().canvas : {};
        units.forEach((u) => {
          const list = scenes.filter((s) => s.unit === u);
          chooser.appendChild(h("h3", { class: "cv-unit" }, `${EWL.t("Unit", "Unidad")} ${u}`));
          chooser.appendChild(
            h(
              "ul",
              { class: "cv-cards" },
              list.map((s) =>
                h(
                  "li",
                  null,
                  h(
                    "button",
                    {
                      type: "button",
                      class: "cv-card",
                      "data-here": current && current.id === s.id ? "1" : "0",
                      "data-done": prog[s.id] && prog[s.id].done ? "1" : "0",
                      onclick: () => open(s),
                    },
                    h("strong", null, EWL.t(s.title, s.titleEs)),
                    h("span", null, EWL.t(s.blurb, s.blurbEs)),
                    h(
                      "span",
                      null,
                      `${EWL.t(s.lessons.length > 1 ? "Lessons" : "Lesson", s.lessons.length > 1 ? "Lecciones" : "Lección")} ${s.lessons.join(", ")}`,
                    ),
                  ),
                ),
              ),
            ),
          );
        });
      }
      function renderAll() {
        renderTop();
        if (flow) flow.destroy();
        flow = null;
        EWL.clear(stage);
        if (current) {
          const lens = query.get("lens");
          const preset = query.get("preset");
          flow = C.Flow.mount(stage, current, {
            lens,
            preset,
            onExit: () => {
              current = null;
              setUrl({ scene: null, lesson: null });
              query.delete("scene");
              renderAll();
              root.scrollTo(0, 0);
            },
          });
        }
        renderChooser();
      }
      renderAll();
      if (flags.teacher) C.Teacher.mount(host, scenes);
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof window !== "undefined" ? window : globalThis);

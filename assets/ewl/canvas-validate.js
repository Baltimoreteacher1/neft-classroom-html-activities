/* EWL.Canvas.validate — the contract for data/ewl/canvas-scenes.json, as a function.
 *
 *   EWL.Canvas.validate(data, { manifest, standards, labs? }) -> [problem strings]   ([] means valid)
 *     manifest   data/curriculum-launch-manifest.json   (lesson ids exist and sit in the scene's unit)
 *     standards  data/ccss-standards.json               (the standard exists and belongs to a listed lesson)
 *     labs       optional { labId: [lessonIds] }        (extends[] names real labs in the same unit)
 *   EWL.Canvas.roundTrip(spec) -> [problem strings]     every picture of one spec reads back the same exact amount
 *
 * Used by tools/ewl-canvas.test.mjs (with negative controls) and by the ?diag=1 self tests.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const C = (EWL.Canvas = EWL.Canvas || {});
  const MIN_SCENES = 9;
  const TEXT_KEYS = ["title", "blurb", "prompt", "pictureHint", "rule", "label", "text", "ask"];
  const LETTERS = /[A-Za-zÁÉÍÓÚáéíóúñ]{3,}/;

  C.roundTrip = (spec) => {
    const out = [];
    let m;
    try {
      m = EWL.Lens.model(spec, "en");
    } catch (e) {
      return [`cannot build ${JSON.stringify(spec)}: ${e.message}`];
    }
    if (!m.reps.length) out.push(`no picture can show ${JSON.stringify(spec)}`);
    m.reps.forEach((r) => {
      const v = r.read();
      if (!v) out.push(`${spec.family}/${r.id} reads back nothing`);
      else if (!v.eq(m.value))
        out.push(`${spec.family}/${r.id} reads ${v.frac()} but the amount is ${m.value.frac()}`);
      if (!/\S/.test(r.alt("en")) || !/\S/.test(r.alt("es")))
        out.push(`${spec.family}/${r.id} has no text alternative`);
    });
    return out;
  };

  function walkBilingual(node, path, out) {
    if (Array.isArray(node)) return node.forEach((x, i) => walkBilingual(x, `${path}[${i}]`, out));
    if (!node || typeof node !== "object") return;
    Object.keys(node).forEach((k) => {
      const v = node[k];
      if (TEXT_KEYS.indexOf(k) >= 0 && typeof v === "string") {
        const es = node[`${k}Es`];
        if (typeof es !== "string" || !es.trim()) out.push(`${path}.${k} has no ${k}Es`);
        else if (es === v && LETTERS.test(v))
          out.push(`${path}.${k}Es is identical to the English`);
      } else walkBilingual(v, `${path}.${k}`, out);
    });
    if (typeof node.en === "string" && (typeof node.es !== "string" || !node.es.trim()))
      out.push(`${path} has en but no es`);
  }

  function checkTask(where, block, kinds, out) {
    let task;
    try {
      task = C.task(block.task.kind, block.task.args);
    } catch (e) {
      return out.push(`${where}: task does not build (${e.message})`);
    }
    if (kinds.indexOf(task.kind) < 0)
      out.push(`${where}: task kind ${task.kind} is not listed in taskKinds`);
    if (!C.distinct(task)) out.push(`${where}: a misconception rule agrees with the true answer`);
    const a = block.answer;
    if (!a || (a.type !== "rat" && a.type !== "choice"))
      return out.push(`${where}: answer.type must be rat or choice`);
    if (a.type === "choice") {
      if (!a.choices || a.choices.length < 2)
        return out.push(`${where}: a choice answer needs two choices`);
      a.choices.forEach((c, i) => {
        if (!c.label || !c.labelEs) out.push(`${where}: choice ${i} needs label and labelEs`);
      });
      if (!a.choices.some((c) => EWL.Rat.parse(c.value) && EWL.Rat.parse(c.value).eq(task.answer)))
        out.push(`${where}: no choice matches the true answer`);
    }
    return task;
  }

  C.validate = (data, ctx) => {
    const out = [];
    const R = EWL.Rat;
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.scenes))
      return ["schemaVersion 1 and a scenes array are required"];
    if (data.scenes.length < MIN_SCENES)
      out.push(`need at least ${MIN_SCENES} scenes, found ${data.scenes.length}`);
    const lessons = {};
    ((ctx.manifest && ctx.manifest.lessons) || []).forEach((l) => {
      lessons[l.id] = l;
    });
    const seen = {};
    const ruleKinds = {};
    EWL.Reason.rules().forEach((r) =>
      r.kinds.forEach((k) => {
        ruleKinds[k] = true;
      }),
    );
    // the canvas-* rules register on first use
    C.task("names", ["1/2"]);
    EWL.Reason.rules().forEach((r) =>
      r.kinds.forEach((k) => {
        ruleKinds[k] = true;
      }),
    );
    data.scenes.forEach((s) => {
      const w = `scene ${s.id}`;
      if (!/^[a-z0-9][a-z0-9-]{0,48}$/.test(String(s.id))) return out.push(`${w}: bad id`);
      if (seen[s.id]) out.push(`${w}: duplicate id`);
      seen[s.id] = true;
      let act = null;
      try {
        act = EWL.id("canvas", s.id);
      } catch (e) {
        out.push(`${w}: ${e.message}`);
      }
      if (s.activity !== act) out.push(`${w}: activity must be ${act}`);
      if (act && !EWL.ID_RE.test(s.activity)) out.push(`${w}: activity id fails ID_RE`);
      if (!Number.isInteger(s.unit) || s.unit < 1 || s.unit > 9)
        out.push(`${w}: unit ${s.unit} is not 1-9 (Unit 10 is not taught)`);
      if (!Array.isArray(s.lessons) || !s.lessons.length) out.push(`${w}: lessons[] is required`);
      const stds = [];
      (s.lessons || []).forEach((id) => {
        const l = lessons[id];
        if (!l) return out.push(`${w}: lesson ${id} is not in the launch manifest`);
        if (l.unit !== s.unit)
          out.push(`${w}: lesson ${id} is in unit ${l.unit}, not unit ${s.unit}`);
        stds.push(l.standard);
      });
      const known = ctx.standards && ctx.standards.standards;
      if (!known || !known[s.standard])
        out.push(`${w}: standard ${s.standard} is not in ccss-standards.json`);
      else if (stds.length && stds.indexOf(s.standard) < 0)
        out.push(
          `${w}: standard ${s.standard} is not the standard of any listed lesson (${stds.join(", ")})`,
        );
      walkBilingual(s, w, out);
      const kind = C.kinds[s.kind];
      const fam = EWL.Lens.reg[s.family];
      if (!kind) return out.push(`${w}: unknown kind ${s.kind}`);
      if (!fam) return out.push(`${w}: unknown family ${s.family}`);
      if (kind.family !== s.family)
        out.push(`${w}: kind ${s.kind} draws family ${kind.family}, not ${s.family}`);
      if (!Array.isArray(s.reps) || !s.reps.length) out.push(`${w}: reps[] is required`);
      (s.reps || []).forEach((r) => {
        if (!fam.reps[r]) out.push(`${w}: ${s.family} has no picture called ${r}`);
      });
      (s.taskKinds || []).forEach((k) => {
        if (!ruleKinds[k]) out.push(`${w}: task kind ${k} has no misconception rule`);
      });
      if (!(s.taskKinds || []).length) out.push(`${w}: taskKinds[] is required`);
      (s.extends || []).forEach((lab) => {
        if (!ctx.labs) return;
        if (!ctx.labs[lab]) out.push(`${w}: extends unknown lab ${lab}`);
        else if (ctx.labs[lab].some((id) => lessons[id] && lessons[id].unit !== s.unit))
          out.push(`${w}: lab ${lab} is in another unit`);
      });
      if (!(s.extends || []).length)
        out.push(`${w}: extends[] must name the existing activity this scene builds on`);
      // presets render and round-trip
      const ids = {};
      (s.presets || []).forEach((p) => {
        if (!/^[a-z0-9][a-z0-9_-]{0,40}$/i.test(p.id) || ids[p.id])
          out.push(`${w}: bad or duplicate preset id ${p.id}`);
        ids[p.id] = true;
        let spec;
        try {
          spec = kind.spec(kind.init(p.params), s);
        } catch (e) {
          return out.push(`${w}: preset ${p.id} does not build (${e.message})`);
        }
        C.roundTrip(spec).forEach((m) => out.push(`${w} preset ${p.id}: ${m}`));
        let model = null;
        try {
          model = EWL.Lens.model(spec, "en");
        } catch (_e) {
          return;
        }
        if (p.id === s.defaultPreset && model.unavailable.length) {
          out.push(
            `${w}: default preset cannot draw ${model.unavailable.map((u) => u.id).join(", ")}`,
          );
        }
      });
      if (!ids[s.defaultPreset]) out.push(`${w}: defaultPreset ${s.defaultPreset} is not a preset`);
      // stages
      ["predict", "manipulate", "observe", "explain", "generalize", "transfer"].forEach((k) => {
        if (!s[k]) out.push(`${w}: missing ${k}`);
      });
      if (s.predict) checkTask(`${w}.predict`, s.predict, s.taskKinds || [], out);
      if (s.transfer) {
        if (!Array.isArray(s.transfer.sets) || s.transfer.sets.length < 6)
          out.push(`${w}.transfer: needs at least 6 number sets`);
        else {
          s.transfer.sets.forEach((set, i) => {
            const t = checkTask(
              `${w}.transfer.sets[${i}]`,
              {
                task: {
                  kind: s.transfer.task.kind,
                  args: s.transfer.task.args.map((a) =>
                    String(a).replace(/\{(\w+)\}/g, (_m, k) => set[k]),
                  ),
                },
                answer: s.transfer.answer,
              },
              s.taskKinds || [],
              out,
            );
            if (!t) return;
            if (
              /\{/.test(
                String(s.transfer.prompt).replace(/\{(\w+)\}/g, (m, k) =>
                  set[k] == null ? m : "",
                ),
              )
            )
              out.push(`${w}.transfer: set ${i} leaves a placeholder in the prompt`);
          });
          const seenPrompts = {};
          for (let n = 0; n < 60; n++) {
            const a = C.makeTransfer(s, n);
            const b = C.makeTransfer(s, n);
            if (a.prompt !== b.prompt) out.push(`${w}.transfer: n=${n} is not deterministic`);
            seenPrompts[a.prompt] = true;
          }
          if (Object.keys(seenPrompts).length < 3)
            out.push(`${w}.transfer: fewer than 3 different problems`);
        }
      }
      const mc = (s.manipulate && s.manipulate.controls) || [];
      if (!mc.length) out.push(`${w}.manipulate: controls[] is required`);
      const base = (s.presets || []).filter((p) => p.id === s.defaultPreset)[0];
      mc.forEach((c) => {
        if (["text", "stepper", "chips", "actions"].indexOf(c.type) < 0)
          return out.push(`${w}.manipulate: control ${c.id} has unknown type ${c.type}`);
        if (!base || c.type === "actions") return;
        const params = kind.init(base.params);
        const tries =
          c.type === "chips"
            ? c.options.map((o) => o.v)
            : c.type === "stepper"
              ? [c.min, c.max]
              : [];
        tries.forEach((v) => {
          if (!C.applyControl(s, params, c, v))
            out.push(`${w}.manipulate: ${c.id}=${v} cannot be drawn`);
        });
        if (c.type === "stepper" && !(c.min < c.max && c.step > 0))
          out.push(`${w}.manipulate: ${c.id} has a bad range`);
      });
      const st = (s.observe && s.observe.statements) || [];
      if (st.length < 3 || !st.some((x) => x.true) || !st.some((x) => !x.true))
        out.push(`${w}.observe: needs 3+ statements, some true and some false`);
      const ex = s.explain;
      if (
        ex &&
        (!ex.spec || !(ex.spec.numbers || []).length || !ex.spec.numbers.every((n) => R.parse(n)))
      )
        out.push(`${w}.explain: spec.numbers must be readable numbers`);
      if (ex && (!ex.frames || ex.frames.length < 1))
        out.push(`${w}.explain: sentence starters are required`);
      const gc = (s.generalize && s.generalize.choices) || [];
      if (gc.length < 3 || gc.filter((c) => c.ok).length !== 1)
        out.push(`${w}.generalize: needs 3+ choices and exactly one correct`);
      gc.forEach((c, i) => {
        if (!c.ok && (!c.ask || !c.askEs))
          out.push(`${w}.generalize: wrong choice ${i} needs ask and askEs`);
      });
    });
    return out;
  };

  EWL.selfTests = EWL.selfTests || [];
  EWL.selfTests.push(
    {
      name: "canvas: every lens picture reads back its amount (4 families)",
      run: () => {
        const specs = [
          { family: "rational", value: "3/5", den: 10 },
          { family: "ratio", a: "2", b: "3" },
          { family: "equation", p: "2", q: "3", r: "11" },
          { family: "scale", k: "3" },
        ];
        const bad = specs.reduce((a, s) => a.concat(C.roundTrip(s)), []);
        return bad.length ? bad.join("; ") : true;
      },
    },
    {
      name: "canvas: 20% then 10% off is 28%, and adding (30%) is matched to its misconception",
      run: () => {
        const t = C.task("percentStack", ["20%", "10%"]);
        const d = EWL.Reason.diagnose(t, { value: "30%" });
        return t.answer.percent() === "28%" && !d.correct && d.rule
          ? true
          : "28% / 30% check failed";
      },
    },
    {
      name: "canvas: transfer problems are seeded (same seed, same problem)",
      run: () => {
        const scene = {
          id: "diag",
          transfer: {
            seed: 5,
            task: { kind: "percentOf", args: ["{p}", "{w}"] },
            prompt: "{p} of {w}",
            promptEs: "{p} de {w}",
            sets: [
              { p: "10%", w: "50" },
              { p: "20%", w: "40" },
              { p: "30%", w: "30" },
            ],
          },
        };
        return C.makeTransfer(scene, 3).prompt === C.makeTransfer(scene, 3).prompt
          ? true
          : "not deterministic";
      },
    },
  );
})(typeof window !== "undefined" ? window : globalThis);

// "Think it through": the student-facing flow built on a figure's headline and wrong move (think-logic.mjs).
//   standard   See one, Try one, Explain, Apply a new equivalent problem
//   challenge  Spot the slip (error analysis), Build it (construct to a target), Explain
//   family     See one, Try one (ungraded, soft wording)
// Nothing is graded or sent anywhere. A wrong answer is diagnosed, never answered: the figure keeps showing the numbers the student has
// SEEN, and shows a new problem's picture only after that problem is solved. Progress (stage, problem seeds, the student's own
// sentence) is kept on this device and validated before use.
import { buildCheck, judge, newProblem, order, problemAt } from "./think-logic.mjs";

const T = {
  title: { en: "Think it through", es: "Piénsalo bien" },
  stages: {
    see: { en: "See one", es: "Mira uno" },
    try: { en: "Try one", es: "Prueba uno" },
    explain: { en: "Explain", es: "Explica" },
    apply: { en: "Apply", es: "Aplica" },
    spot: { en: "Spot the slip", es: "Encuentra el error" },
    build: { en: "Build it", es: "Constrúyelo" },
  },
  seeText: { en: "Press Watch it move and follow each step. Say what each step does.", es: "Toca Míralo moverse y sigue cada paso. Di qué hace cada paso." },
  watch: { en: "Watch it move", es: "Míralo moverse" },
  next: { en: "Next", es: "Siguiente" },
  numbers: { en: "The numbers", es: "Los números" },
  predictQ: { en: (/** @type {string} */ l) => `${l} Type your answer, then check it.`, es: (/** @type {string} */ l) => `${l} Escribe tu respuesta y luego compruébala.` },
  check: { en: "Check", es: "Comprobar" },
  again: { en: "New numbers", es: "Números nuevos" },
  answer: { en: "Your answer", es: "Tu respuesta" },
  right: { en: "Yes. The picture now shows these numbers. Does each step match what you thought?", es: "Sí. El dibujo ahora muestra estos números. ¿Cada paso coincide con lo que pensabas?" },
  rightSoft: { en: "That matches. Look at the picture together and talk about each step.", es: "Coincide. Miren el dibujo juntos y conversen sobre cada paso." },
  empty: { en: "Type a number first.", es: "Escribe primero un número." },
  nan: { en: "That is not a number. Type digits, like 12 or 2.5 or 3/4.", es: "Eso no es un número. Escribe dígitos, como 12, 2.5 o 3/4." },
  miss1: { en: "Not yet. Look at the picture above and follow its steps one at a time. Which step might change your number?", es: "Todavía no. Mira el dibujo de arriba y sigue sus pasos uno por uno. ¿Qué paso podría cambiar tu número?" },
  miss2: { en: "Not yet. Press Watch it move and compare each step with your work. Revise your answer and try again.", es: "Todavía no. Toca Míralo moverse y compara cada paso con tu trabajo. Revisa tu respuesta y prueba otra vez." },
  miss3: { en: "Still not it. Talk it through with a partner, then revise, or try new numbers.", es: "Todavía no. Conversa con un compañero, luego revisa, o prueba con números nuevos." },
  looks: { en: (/** @type {string} */ s) => `Careful: that looks like this slip: ${s}`, es: (/** @type {string} */ s) => `Cuidado: eso se parece a este error: ${s}` },
  explainQ: { en: "Finish the sentence in your own words.", es: "Termina la oración con tus propias palabras." },
  frame: { en: "I know my answer is right because …", es: "Sé que mi respuesta es correcta porque …" },
  frameBuild: { en: "My numbers work because …", es: "Mis números funcionan porque …" },
  save: { en: "Save my sentence", es: "Guardar mi oración" },
  saved: { en: "Saved on this device.", es: "Guardado en este dispositivo." },
  tooShort: { en: "Write a little more: at least one full sentence.", es: "Escribe un poco más: al menos una oración completa." },
  spotIntro: { en: (/** @type {string} */ v) => `A student worked this out and got ${v}.`, es: (/** @type {string} */ v) => `Un estudiante resolvió esto y obtuvo ${v}.` },
  spotQ: { en: "What did the student do?", es: "¿Qué hizo el estudiante?" },
  spotFix: { en: (/** @type {string} */ l) => `Now find the right answer. ${l}`, es: (/** @type {string} */ l) => `Ahora halla la respuesta correcta. ${l}` },
  distract: [
    { en: "The student made no mistake.", es: "El estudiante no cometió ningún error." },
    { en: "The student only made a small slip in the last calculation.", es: "El estudiante solo se equivocó un poco en el último cálculo." },
    { en: "The student read the numbers wrong, but used the right method.", es: "El estudiante leyó mal los números, pero usó el método correcto." },
  ],
  spotNo: { en: "Not quite. Look at what the picture does at each step, and where the student's number could come from.", es: "No exactamente. Mira qué hace el dibujo en cada paso y de dónde pudo salir el número del estudiante." },
  spotYes: { en: "Yes, that is the slip.", es: "Sí, ese es el error." },
  buildQ: { en: (/** @type {string} */ l, /** @type {string} */ t) => `Change the numbers so that ${l} is exactly ${t}.`, es: (/** @type {string} */ l, /** @type {string} */ t) => `Cambia los números para que ${l} sea exactamente ${t}.` },
  buildHigh: { en: (/** @type {string} */ g, /** @type {string} */ t) => `Your numbers give ${g}. That is too high; the goal is ${t}.`, es: (/** @type {string} */ g, /** @type {string} */ t) => `Tus números dan ${g}. Es demasiado; la meta es ${t}.` },
  buildLow: { en: (/** @type {string} */ g, /** @type {string} */ t) => `Your numbers give ${g}. That is too low; the goal is ${t}.`, es: (/** @type {string} */ g, /** @type {string} */ t) => `Tus números dan ${g}. Es muy poco; la meta es ${t}.` },
  buildInvalid: { en: "Those numbers are not allowed here. Check each number's range.", es: "Esos números no están permitidos aquí. Revisa el rango de cada número." },
  buildDone: { en: "That works. Other numbers may work too. Can you find a second way?", es: "Eso funciona. Otros números también pueden funcionar. ¿Puedes hallar otra manera?" },
  done: { en: "Done. You can try new numbers any time.", es: "Listo. Puedes probar números nuevos cuando quieras." },
  noThink: { en: "", es: "" },
};

const STAGES = { standard: ["see", "try", "explain", "apply"], challenge: ["spot", "build", "explain"], family: ["see", "try"] };

/** @typedef {import("./mount.mjs").Figure} Figure */

let uid = 0;

/**
 * @param {HTMLElement} host
 * @param {{ fig: Figure, key: string, mode: "standard" | "challenge" | "family", lang: () => "en" | "es", base: number[], setValues: (v: number[]) => void, watch: () => void, storage?: string }} ctx
 */
export function mountThink(host, ctx) {
  const doc = host.ownerDocument;
  const id = `mt${++uid}`;
  const stages = ctx.mode === "challenge" && ctx.fig.thinkWrong === false ? ["build", "explain"] : STAGES[ctx.mode];
  const skey = ctx.storage || `neft_think_v1:${ctx.key}:${ctx.mode}`;
  const L = () => ctx.lang();
  /** @type {{ stage: number, seed: Record<string, number>, done: Record<string, boolean>, explain: string }} */
  let st = { stage: 0, seed: {}, done: {}, explain: "" };
  try {
    const raw = JSON.parse(localStorage.getItem(skey) || "null");
    if (raw && Number.isInteger(raw.stage) && raw.stage >= 0 && raw.stage < stages.length && raw.seed && typeof raw.seed === "object" && raw.done && typeof raw.done === "object") {
      st = { stage: raw.stage, seed: Object.fromEntries(Object.entries(raw.seed).filter(([, v]) => Number.isInteger(v) && v >= 0 && v < 1000)), done: raw.done, explain: typeof raw.explain === "string" ? raw.explain.slice(0, 400) : "" };
    }
  } catch {
    /* a blocked or damaged store means a fresh start */
  }
  const save = () => {
    try {
      localStorage.setItem(skey, JSON.stringify(st));
    } catch {
      /* the flow works without a store */
    }
  };
  /** Per-problem state that is not saved: misses, the current feedback, whether the "fix it" part of Spot is open. */
  const live = { miss: 0, fb: /** @type {{ ok: boolean, text: string } | null} */ (null), spotPicked: false, buildVals: /** @type {number[] | null} */ (null) };
  const resetLive = () => {
    live.miss = 0;
    live.fb = null;
    live.spotPicked = false;
    live.buildVals = null;
  };

  const seedOf = (/** @type {string} */ stage) => st.seed[stage] || 0;
  const baseHead = () => problemAt(ctx.fig, ctx.key, ctx.base, "en")?.head.value;
  /** The problem for a stage at its saved seed. */
  const problemFor = (/** @type {string} */ stage) => {
    const avoid = [baseHead() || ""];
    const needWrong = stage === "spot";
    const r = newProblem(ctx.fig, ctx.key, ctx.base, `${ctx.mode}|${stage}|${seedOf(stage)}`, { avoid, needWrong });
    return r || newProblem(ctx.fig, ctx.key, ctx.base, `${ctx.mode}|${stage}|${seedOf(stage)}`, { avoid });
  };

  /** @param {string} tag @param {Record<string, string | boolean | null>} [attrs] @param {Array<Node | string | null>} [kids] */
  const el = (tag, attrs = {}, kids = []) => {
    const n = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === false) continue;
      if (k === "class") n.className = String(v);
      else n.setAttribute(k, v === true ? "" : String(v));
    }
    for (const kid of kids) if (kid !== null) n.append(kid);
    return n;
  };
  const btn = (/** @type {string} */ label, /** @type {() => void} */ on, quiet = false) => {
    const b = el("button", { type: "button", class: "mc-btn", ...(quiet ? { "data-quiet": true } : {}) }, [label]);
    b.addEventListener("click", on);
    return b;
  };
  const numbersLine = (/** @type {number[]} */ values) => {
    const cs = ctx.fig.controls(ctx.key);
    return cs
      .map((c, i) => (c.min === c.max ? null : `${L() === "es" ? c.labelEs : c.label} = ${values[i]}`))
      .filter(Boolean)
      .join("; ");
  };
  const feedback = () => (live.fb ? el("p", { class: live.fb.ok ? "mc-fb mc-fb-ok" : "mc-fb mc-fb-miss", role: "status" }, [live.fb.ok ? "✓ " : "", live.fb.text]) : el("p", { class: "mc-fb", role: "status" }));

  const advance = () => {
    st.done[stages[st.stage]] = true;
    if (st.stage < stages.length - 1) st.stage += 1;
    resetLive();
    save();
    render(true);
  };

  /** The predict component, shared by Try one and Apply. */
  function predictStage(/** @type {string} */ stage) {
    const prob = problemFor(stage);
    const box = el("div", { class: "mc-stage-body" });
    if (!prob) {
      box.append(el("p", {}, [T.done[L()]]));
      return box;
    }
    const p = prob.problem;
    const head = ctx.fig.headline ? ctx.fig.headline(p.model, L()) : p.head;
    const solved = !!st.done[`${stage}:${seedOf(stage)}`];
    box.append(el("p", { class: "mc-numbers" }, [`${T.numbers[L()]}: ${numbersLine(prob.values)}`]));
    const label = el("label", { for: `${id}-${stage}-in`, class: "mc-field" }, [el("span", {}, [T.predictQ[L()](head.label)]), el("input", { id: `${id}-${stage}-in`, type: "text", inputmode: "text", autocomplete: "off", "aria-describedby": `${id}-${stage}-fb` })]);
    const input = /** @type {HTMLInputElement} */ (label.querySelector("input"));
    if (solved) input.disabled = true;
    box.append(label);
    const fbBox = feedback();
    fbBox.id = `${id}-${stage}-fb`;
    const run = () => {
      const j = judge(p, input.value);
      if (j.kind === "right") {
        st.done[`${stage}:${seedOf(stage)}`] = true;
        live.fb = { ok: true, text: ctx.mode === "family" ? T.rightSoft[L()] : T.right[L()] };
        ctx.setValues(prob.values);
        save();
        render(true);
        ctx.watch();
        return;
      }
      live.miss += j.kind === "empty" || j.kind === "not-a-number" ? 0 : 1;
      const text = j.kind === "empty" ? T.empty[L()] : j.kind === "not-a-number" ? T.nan[L()] : j.kind === "wrong-move" ? `${T.looks[L()](j.say || "")} ${T.miss2[L()]}` : live.miss <= 1 ? T.miss1[L()] : live.miss === 2 ? T.miss2[L()] : T.miss3[L()];
      live.fb = { ok: false, text };
      input.setAttribute("aria-invalid", "true");
      render(true);
    };
    const tools = el("div", { class: "mc-tools" });
    if (!solved) tools.append(btn(T.check[L()], run));
    if (solved || live.miss >= 2) {
      tools.append(
        btn(
          T.again[L()],
          () => {
            st.seed[stage] = seedOf(stage) + 1;
            resetLive();
            save();
            render(true);
          },
          true,
        ),
      );
    }
    if (solved) tools.append(btn(T.next[L()], advance));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!solved) run();
      }
    });
    box.append(fbBox, tools);
    return box;
  }

  function explainStage() {
    const box = el("div", { class: "mc-stage-body" });
    const build = ctx.mode === "challenge";
    box.append(el("p", {}, [T.explainQ[L()]]));
    const label = el("label", { for: `${id}-ex`, class: "mc-field" }, [el("span", {}, [build ? T.frameBuild[L()] : T.frame[L()]]), el("textarea", { id: `${id}-ex`, rows: "3", maxlength: "400" })]);
    const ta = /** @type {HTMLTextAreaElement} */ (label.querySelector("textarea"));
    ta.value = st.explain;
    box.append(label);
    const fb = feedback();
    const tools = el("div", { class: "mc-tools" }, [
      btn(T.save[L()], () => {
        const text = ta.value.trim();
        st.explain = text.slice(0, 400);
        if (text.split(/\s+/).filter(Boolean).length < 5) {
          live.fb = { ok: false, text: T.tooShort[L()] };
          save();
          render(true);
          return;
        }
        live.fb = { ok: true, text: T.saved[L()] };
        st.done.explain = true;
        save();
        if (st.stage < stages.length - 1) advance();
        else render(true);
      }),
    ]);
    box.append(fb, tools);
    return box;
  }

  function seeStage() {
    return el("div", { class: "mc-stage-body" }, [el("p", {}, [T.seeText[L()]]), el("div", { class: "mc-tools" }, [btn(T.watch[L()], () => ctx.watch()), btn(T.next[L()], advance, true)])]);
  }

  function spotStage() {
    const prob = problemFor("spot");
    const box = el("div", { class: "mc-stage-body" });
    if (!prob || !prob.problem.wrong) {
      box.append(el("p", {}, [T.done[L()]]), btn(T.next[L()], advance));
      return box;
    }
    const p = prob.problem;
    const wrong = ctx.fig.wrong?.(p.model, L());
    const head = ctx.fig.headline ? ctx.fig.headline(p.model, L()) : p.head;
    if (!wrong) return box;
    const seedKey = `spot:${seedOf("spot")}`;
    const picked = live.spotPicked || !!st.done[`${seedKey}:pick`];
    box.append(el("p", { class: "mc-numbers" }, [`${T.numbers[L()]}: ${numbersLine(prob.values)}`]), el("p", {}, [T.spotIntro[L()](wrong.value)]), el("p", {}, [el("strong", {}, [T.spotQ[L()]])]));
    const choices = [wrong.say, ...T.distract.map((d) => d[L()])];
    const ord = order(choices.length, `${ctx.key}|spot|${seedOf("spot")}`);
    const group = el("fieldset", { class: "mc-choices" }, [el("legend", { class: "mc-sr" }, [T.spotQ[L()]])]);
    ord.forEach((ci, pos) => {
      const rid = `${id}-sp${pos}`;
      const radio = el("input", { type: "radio", name: `${id}-sp`, id: rid, value: String(ci) });
      if (picked) radio.setAttribute("disabled", "");
      radio.addEventListener("change", () => {
        if (ci === 0) {
          live.spotPicked = true;
          st.done[`${seedKey}:pick`] = true;
          live.fb = { ok: true, text: T.spotYes[L()] };
        } else {
          live.miss += 1;
          live.fb = { ok: false, text: T.spotNo[L()] };
        }
        save();
        render(true);
      });
      group.append(el("label", { for: rid, class: "mc-choice" }, [radio, el("span", {}, [choices[ci]])]));
    });
    box.append(group, feedback());
    if (picked) {
      const done = !!st.done[`${seedKey}:fix`];
      const label = el("label", { for: `${id}-fix`, class: "mc-field" }, [el("span", {}, [T.spotFix[L()](head.label)]), el("input", { id: `${id}-fix`, type: "text", autocomplete: "off" })]);
      const input = /** @type {HTMLInputElement} */ (label.querySelector("input"));
      if (done) input.disabled = true;
      const out = el("p", { class: "mc-fb", role: "status" });
      const check = () => {
        const j = judge(p, input.value);
        if (j.kind === "right") {
          st.done[`${seedKey}:fix`] = true;
          ctx.setValues(prob.values);
          save();
          live.fb = { ok: true, text: T.right[L()] };
          advance();
          return;
        }
        out.textContent = j.kind === "empty" ? T.empty[L()] : j.kind === "not-a-number" ? T.nan[L()] : j.kind === "wrong-move" ? T.miss2[L()] : T.miss1[L()];
        out.className = "mc-fb mc-fb-miss";
      };
      box.append(label, out, el("div", { class: "mc-tools" }, [btn(T.check[L()], check)]));
    }
    box.append(
      el("div", { class: "mc-tools" }, [
        btn(
          T.again[L()],
          () => {
            st.seed.spot = seedOf("spot") + 1;
            resetLive();
            save();
            render(true);
          },
          true,
        ),
      ]),
    );
    return box;
  }

  function buildStage() {
    const box = el("div", { class: "mc-stage-body" });
    const r = newProblem(ctx.fig, ctx.key, ctx.base, `${ctx.mode}|build|${seedOf("build")}`, { avoid: [baseHead() || ""] });
    if (!r) {
      box.append(el("p", {}, [T.done[L()]]), btn(T.next[L()], advance));
      return box;
    }
    const target = r.problem.head.value;
    const head = ctx.fig.headline ? ctx.fig.headline(r.problem.model, L()) : r.problem.head;
    const cs = ctx.fig.controls(ctx.key);
    const vals = live.buildVals || [...ctx.base];
    box.append(el("p", {}, [T.buildQ[L()](head.label, target)]));
    const grid = el("div", { class: "mc-controls" });
    /** @type {HTMLInputElement[]} */
    const inputs = [];
    cs.forEach((c, i) => {
      if (c.min === c.max) return;
      const inp = el("input", { type: "number", min: String(c.min), max: String(c.max), step: String(c.step), id: `${id}-b${i}`, value: String(vals[i]) });
      inputs[i] = /** @type {HTMLInputElement} */ (inp);
      grid.append(el("label", { for: `${id}-b${i}`, class: "mc-field" }, [el("span", {}, [L() === "es" ? c.labelEs : c.label]), inp]));
    });
    const done = !!st.done[`build:${seedOf("build")}`];
    const run = () => {
      const next = cs.map((c, i) => (inputs[i] ? Number(inputs[i].value) : ctx.base[i]));
      live.buildVals = next;
      const res = buildCheck(ctx.fig, ctx.key, next, target);
      if (res.ok) {
        st.done[`build:${seedOf("build")}`] = true;
        live.fb = { ok: true, text: T.buildDone[L()] };
        ctx.setValues(next);
        save();
        render(true);
        ctx.watch();
        return;
      }
      live.miss += 1;
      live.fb = { ok: false, text: res.invalid ? T.buildInvalid[L()] : (res.relation === "high" ? T.buildHigh : T.buildLow)[L()](res.got || "", target) };
      render(true);
    };
    const tools = el("div", { class: "mc-tools" });
    tools.append(btn(T.check[L()], run));
    if (done) tools.append(btn(T.next[L()], advance));
    box.append(grid, feedback(), tools);
    return box;
  }

  function render(focus = false) {
    host.textContent = "";
    host.classList.add("mc-think");
    const list = el("ol", { class: "mc-steps" });
    host.append(el("h3", { class: "mc-think-title", id: `${id}-t` }, [T.title[L()]]));
    stages.forEach((s, i) => {
      const active = i === st.stage;
      const li = el("li", { class: `mc-step${active ? " is-active" : ""}${st.done[s] ? " is-done" : ""}`, ...(active ? { "aria-current": "step" } : {}) });
      li.append(el("button", { type: "button", class: "mc-step-head", "aria-expanded": String(active) }, [`${st.done[s] ? "✓ " : ""}${T.stages[/** @type {keyof typeof T.stages} */ (s)][L()]}`]));
      const head = /** @type {HTMLButtonElement} */ (li.querySelector("button"));
      head.addEventListener("click", () => {
        st.stage = i;
        resetLive();
        save();
        render(true);
      });
      if (active) {
        const body = s === "see" ? seeStage() : s === "try" || s === "apply" ? predictStage(s) : s === "explain" ? explainStage() : s === "spot" ? spotStage() : buildStage();
        li.append(body);
      }
      list.append(li);
    });
    host.append(list);
    if (focus) {
      const target = host.querySelector(".mc-step.is-active input:not([disabled]):not([type=radio]), .mc-step.is-active textarea, .mc-step.is-active input[type=radio]:not([disabled])");
      /** @type {HTMLElement | null} */ (target)?.focus({ preventScroll: true });
    }
  }
  render(false);
  return {
    /** @param {{ lang?: "en" | "es" }} [next] */
    update() {
      render(false);
    },
    destroy() {
      host.textContent = "";
      host.classList.remove("mc-think");
    },
  };
}

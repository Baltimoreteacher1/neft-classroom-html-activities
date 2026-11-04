// The coach panel: whatever the current step asks of the learner (predict, build feedback, explain, transfer, diagnose).
// It reads the journey session and calls app.reduce(); it never judges mathematics itself.
import { EVIDENCE_TEXT, currentStep, evidenceOf, stepDone, transferProblem } from "./journey.js";
import { L } from "./kernel.js";
import { btn, group, h, row } from "./views/common.js";

const T = {
  hint: L("Hint", "Pista"),
  next: L("Next", "Siguiente"),
  finish: L("Finish", "Terminar"),
  locked: L("Finish this step to go on.", "Termina este paso para continuar."),
  yes: L("Yes.", "Sí."),
  notQuite: L("Not quite.", "Todavía no."),
  saved: L("Prediction saved. We will look at it again.", "Predicción guardada. La miraremos otra vez."),
  predicted: L("You predicted:", "Predijiste:"),
  look: L("Now look at what happened.", "Ahora mira lo que pasó."),
  check: L("Check my explanation", "Revisar mi explicación"),
  ideas: L("Ideas I can see in your explanation", "Ideas que veo en tu explicación"),
  mathSays: L("A mathematician might say", "Un matemático podría decir"),
  yourWords: L("Write in your own words", "Escribe con tus palabras"),
  wordBank: L("Word bank", "Banco de palabras"),
  checkBuild: L("Check my build", "Revisar lo que construí"),
  checkAnswer: L("Check my answer", "Revisar mi respuesta"),
  newOne: L("Try a new problem", "Probar un problema nuevo"),
  backToModel: L("Practice with the model first", "Practicar primero con el modelo"),
  onYourOwn: L("This one is on your own. No hints are needed, but a hint is there if you want one.", "Este lo haces tú solo. No necesitas pistas, pero hay una si la quieres."),
  seen: L("What I can see", "Lo que puedo ver"),
  guess: L("What I can only guess", "Lo que solo puedo suponer"),
  probe: L("A quick question to find out more", "Una pregunta rápida para saber más"),
  answerLabel: L("Your answer", "Tu respuesta"),
  num: L("Number", "Número"),
  and: L("and", "y"),
  sum: L("The student wrote", "El estudiante escribió"),
  tryIt: L("Check this answer", "Revisar esta respuesta"),
  correctAlready: L("That answer is correct. Build it anyway to see why it works.", "Esa respuesta es correcta. Constrúyela de todos modos para ver por qué funciona."),
  openModel: L("Open the decimal model", "Abrir el modelo de decimales"),
  done: L("You finished this experience.", "Terminaste esta experiencia."),
};

const goalText = (app, step) => (typeof step.goal === "function" ? step.goal(app.session) : step.goal) ?? step.prompt;

function hintLadder(app, step, hints) {
  const used = app.session.hints[step.id] || 0;
  const total = Math.min(3, hints.length);
  const box = h("div", { class: "mr-hints" });
  hints.slice(0, used).forEach((hn, i) => box.append(h("p", { class: "mr-hint" }, h("b", {}, `${app.tx(T.hint)} ${i + 1}: `), app.tx(hn))));
  if (used < total) box.append(btn(`${app.tx(T.hint)} (${total - used})`, () => app.reduce({ type: "hint", id: step.id }), { key: "hint", cls: "is-quiet" }));
  return box;
}

function predictionNote(app) {
  const { exp, session } = app;
  const idx = exp.steps.findIndex((s) => s.kind === "ask" && s.revisit);
  if (idx < 0 || session.step <= idx) return null;
  const pred = exp.steps[idx];
  const ans = session.answers[pred.id];
  const option = pred.options.find((o) => o.id === ans?.option);
  if (!option) return null;
  return h("p", { class: "mr-recall" }, h("b", {}, `${app.tx(T.predicted)} `), `${app.tx(option.text).replace(/[.?!]$/, "")}. `, app.tx(T.look));
}

function askPanel(app, step) {
  const ans = app.session.answers[step.id];
  const box = h("div", { class: "mr-ask" });
  box.append(group(app.tx(step.prompt), ...step.options.map((o) => btn(app.tx(o.text), () => app.reduce({ type: "ask", id: step.id, option: o.id }), { cls: `mr-option ${ans?.option === o.id ? "is-picked" : ""}`, pressed: ans?.option === o.id, key: `opt-${o.id}` }))));
  if (ans) {
    const o = step.options.find((x) => x.id === ans.option);
    if (step.graded === false) box.append(h("p", { class: "mr-fb is-info" }, app.tx(T.saved)));
    else box.append(h("p", { class: `mr-fb ${ans.ok ? "is-ok" : "is-warn"}` }, h("b", {}, `${app.tx(ans.ok ? T.yes : T.notQuite)} `), o?.why ? app.tx(o.why) : ""));
  }
  return box;
}

function taskPanel(app, step) {
  const box = h("div", { class: "mr-task" });
  const r = app.taskResult;
  if (app.session.tasks[step.id]?.done) box.append(h("p", { class: "mr-fb is-ok" }, r?.done ? app.tx(r.note ?? "") : ""));
  else if (r?.note) box.append(h("p", { class: "mr-fb is-info" }, app.tx(r.note)));
  if (step.hints?.length) box.append(hintLadder(app, step, step.hints));
  return box;
}

function explainPanel(app, step) {
  const { session } = app;
  const rec = session.explain[step.id];
  const box = h("div", { class: "mr-explain" });
  const support = session.support;
  const ui = app.ui;
  const picks = ui.picks ?? [];
  const sentenceOf = (f, i) => `${app.tx(f.before)} ${app.tx(f.bank.find((b) => b.id === picks[i])?.text ?? "…")}${app.tx(f.after)}`.replace(/\s+\./g, ".");
  if (support === "frames" && step.frames?.length) {
    step.frames.forEach((f, i) => {
      box.append(h("div", { class: "mr-frame" },
        h("p", { class: "mr-frame-text" }, sentenceOf(f, i)),
        group(app.tx(f.before), ...f.bank.map((b) => btn(app.tx(b.text), () => ui.set({ picks: Object.assign([...(ui.picks ?? [])], { [i]: b.id }) }), { cls: `mr-chip-btn ${picks[i] === b.id ? "is-picked" : ""}`, pressed: picks[i] === b.id, key: `pick-${i}-${b.id}` })))));
    });
    box.append(row(btn(app.tx(T.check), () => app.reduce({ type: "explain", id: step.id, text: step.frames.map(sentenceOf).join(" "), picks }), { cls: "is-primary", key: "explain-go", disabled: picks.filter(Boolean).length < step.frames.length })));
  } else {
    const starter = support === "starter" && step.frames?.[0] ? `${app.tx(step.frames[0].before)} ` : "";
    box.append(h("label", { class: "mr-field mr-field-wide" }, h("span", { class: "mr-field-label" }, app.tx(T.yourWords)),
      h("textarea", { class: "mr-input mr-text", rows: 4, maxlength: 500, "data-key": "explain-text", on: { input: (e) => ui.set({ text: e.target.value }, false) } }, ui.text ?? starter)));
    const bank = (step.frames ?? []).flatMap((f) => f.bank.map((b) => app.tx(b.text)));
    if (support !== "free" && bank.length) box.append(group(app.tx(T.wordBank), ...bank.map((w) => btn(w, () => ui.set({ text: `${ui.text ?? starter}${(ui.text ?? starter) ? " " : ""}${w}` }), { cls: "mr-chip-btn", key: `bank-${w}` }))));
    box.append(row(btn(app.tx(T.check), () => app.reduce({ type: "explain", id: step.id, text: ui.text ?? starter }), { cls: "is-primary", key: "explain-go" })));
  }
  if (rec) {
    const found = new Set(rec.ideas);
    box.append(h("div", { class: `mr-fb ${rec.ok ? "is-ok" : "is-info"}` },
      h("b", {}, `${app.tx(T.ideas)}: `),
      h("ul", { class: "mr-ideas" }, ...(step.ideas ?? []).map((i) => h("li", { class: found.has(i.id) || (rec.ok && support === "frames") ? "is-found" : "" }, `${found.has(i.id) || (rec.ok && support === "frames") ? "✓" : "·"} ${i.words[0]}`)))));
    if (step.reveal) box.append(h("blockquote", { class: "mr-reveal" }, h("b", {}, `${app.tx(T.mathSays)}: `), app.tx(step.reveal)));
  }
  return box;
}

function transferPanel(app, step) {
  const problem = transferProblem(step, app.session, app.grade);
  const rec = app.session.transfer[step.id] || { tries: 0, hints: 0, ok: false };
  const box = h("div", { class: "mr-transfer" });
  box.append(h("p", { class: "mr-note" }, app.tx(T.onYourOwn)));
  if (problem.kind === "answer") {
    box.append(h("label", { class: "mr-field mr-field-wide" }, h("span", { class: "mr-field-label" }, app.tx(T.answerLabel)),
      h("input", { class: "mr-input", type: "text", inputmode: "text", autocomplete: "off", value: app.ui.response ?? "", disabled: rec.ok, "data-key": "answer", on: { input: (e) => app.ui.set({ response: e.target.value }, false), keydown: (e) => e.key === "Enter" && app.submitTransfer() } })));
    box.append(row(btn(app.tx(T.checkAnswer), () => app.submitTransfer(), { cls: "is-primary", key: "answer-go", disabled: rec.ok })));
  } else box.append(row(btn(app.tx(T.checkBuild), () => app.submitTransfer(), { cls: "is-primary", key: "build-go", disabled: rec.ok })));
  const hints = problem.hints ?? [];
  const used = rec.hints || 0;
  const hintBox = h("div", { class: "mr-hints" });
  hints.slice(0, used).forEach((hn, i) => hintBox.append(h("p", { class: "mr-hint" }, h("b", {}, `${app.tx(T.hint)} ${i + 1}: `), app.tx(hn))));
  if (!rec.ok && used < hints.length) hintBox.append(btn(`${app.tx(T.hint)} (${hints.length - used})`, () => app.reduce({ type: "transferHint", id: step.id }), { cls: "is-quiet", key: "thint" }));
  box.append(hintBox);
  if (app.transferFeedback) box.append(app.transferFeedback);
  if (rec.ok) box.append(h("p", { class: "mr-fb is-ok" }, app.tx(rec.independent ? EVIDENCE_TEXT.demonstrated : EVIDENCE_TEXT.scaffolded)));
  else if (rec.tries >= 1) {
    box.append(row(btn(app.tx(T.newOne), () => app.reduce({ type: "newTransfer", id: step.id }), { key: "new-problem" }), btn(app.tx(T.backToModel), () => app.goBack(), { key: "back-model", cls: "is-quiet" })));
  }
  return box;
}

function diagnosePanel(app, step) {
  const { session } = app;
  const box = h("div", { class: "mr-diagnose" });
  const inp = app.ui.input ?? session.input ?? app.exp.defaultInput;
  const setIn = (k, v) => app.ui.set({ input: { ...inp, [k]: v } }, false);
  const field = (k, label) => h("label", { class: "mr-field" }, h("span", { class: "mr-field-label" }, label), h("input", { class: "mr-input mr-short", type: "text", inputmode: "decimal", value: inp[k], "data-key": `in-${k}`, on: { input: (e) => setIn(k, e.target.value) } }));
  box.append(h("div", { class: "mr-sumrow" }, h("span", { class: "mr-field-label" }, app.tx(T.sum)), field("a", "A"), h("span", { class: "mr-sym-plus" }, "+"), field("b", "B"), h("span", { class: "mr-sym-plus" }, "="), field("response", app.lang === "es" ? "Respuesta" : "Answer")));
  box.append(row(btn(app.tx(T.tryIt), () => app.reduce({ type: "input", ...inp }), { cls: "is-primary", key: "check-input" })));
  if (!session.input) return box;
  const result = app.exp.detect(session.input);
  if (!result) return box;
  if (result.correct) box.append(h("p", { class: "mr-fb is-ok" }, app.tx(T.correctAlready)));
  else {
    if (result.confirmed.length) box.append(h("div", { class: "mr-fb is-info" }, h("b", {}, `${app.tx(T.seen)}: `), h("ul", {}, ...result.confirmed.map((c) => h("li", {}, app.tx(c.text))))));
    box.append(h("div", { class: "mr-fb is-info is-guess" }, h("b", {}, `${app.tx(T.guess)}: `), h("ul", {}, ...result.hypotheses.map((x) => h("li", {}, app.tx(x.text))))));
    const probe = result.probes[0];
    if (probe) {
      const rec = session.probes[step.id];
      box.append(h("div", { class: "mr-probe" }, h("p", {}, h("b", {}, `${app.tx(T.probe)}: `), app.tx(probe.prompt)), group(app.tx(probe.prompt), ...probe.options.map((o) => btn(app.tx(o.text), () => app.reduce({ type: "probe", id: step.id, option: o.id }), { cls: `mr-option ${rec?.pick === o.id ? "is-picked" : ""}`, pressed: rec?.pick === o.id, key: `probe-${o.id}` }))),
        rec ? h("p", { class: `mr-fb ${rec.ok ? "is-ok" : "is-info"}` }, app.tx(probe.explains)) : null));
    } else if (!session.probes[step.id]) box.append(row(btn(app.tx(T.openModel), () => app.reduce({ type: "probe", id: step.id, option: "go" }), { cls: "is-primary", key: "open-model" })));
  }
  if (result.correct && !session.probes[step.id]) box.append(row(btn(app.tx(T.openModel), () => app.reduce({ type: "probe", id: step.id, option: "go" }), { cls: "is-primary", key: "open-model" })));
  return box;
}

export function renderPanel(app) {
  const { exp, session } = app;
  const step = currentStep(exp, session);
  const root = h("div", { class: "mr-coach" });
  const recall = predictionNote(app);
  if (recall) root.append(recall);
  const body = { ask: askPanel, task: taskPanel, explain: explainPanel, transfer: transferPanel, diagnose: diagnosePanel }[step.kind](app, step);
  root.append(body);
  const last = session.step >= exp.steps.length - 1;
  const ok = stepDone(exp, session);
  root.append(h("div", { class: "mr-nav" },
    session.step > 0 ? btn(app.tx(L("Back", "Atrás")), () => app.goBack(), { cls: "is-quiet", key: "back" }) : null,
    btn(`${app.tx(last ? T.finish : T.next)} →`, () => app.next(), { cls: "is-primary", disabled: !ok, key: "next" }),
    ok ? null : h("span", { class: "mr-locked" }, app.tx(T.locked))));
  return root;
}

export function renderDone(app) {
  const { exp, session } = app;
  const ev = evidenceOf(exp, session);
  const box = h("div", { class: "mr-complete" });
  box.append(h("h2", {}, app.tx(T.done)));
  box.append(h("p", { class: "mr-fb is-ok" }, app.tx(EVIDENCE_TEXT[ev.label])));
  const li = (ok, en, es) => h("li", { class: ok ? "is-found" : "" }, `${ok ? "✓" : "·"} ${app.tx(L(en, es))}`);
  box.append(h("ul", { class: "mr-evidence", "aria-label": app.tx(L("What you showed", "Lo que mostraste")) },
    li(ev.predicted, "You made a prediction before you tested.", "Hiciste una predicción antes de probar."),
    li(ev.built, "You built it with a model.", "Lo construiste con un modelo."),
    li(ev.repairedViaModel, "You repaired a mistake with the model.", "Reparaste un error con el modelo."),
    li(ev.explained, "You explained why it works.", "Explicaste por qué funciona."),
    li(ev.transfer === "independent", "You solved a new problem on your own, first try, with no hints.", "Resolviste un problema nuevo tú solo, al primer intento y sin pistas."),
    li(ev.transfer === "scaffolded", "You solved a new problem with some help.", "Resolviste un problema nuevo con algo de ayuda.")));
  return box;
}

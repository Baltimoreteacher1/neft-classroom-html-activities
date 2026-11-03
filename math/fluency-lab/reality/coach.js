// The step card beside the stadium: the built-in coach. It is deterministic (no AI, no network): every question,
// hint and repair comes from the mission data and the validated stadium model. One primary action per step.
import { h } from "../graphics/graphics-a-ui.js";
import { STEPS, STEP_LABELS, evidenceOf, hintsFor } from "./engine.js";

const CRUMBS = ["create", "predict", "experiment", "observe", "explain", "apply", "reflect"];

const say = (t, text, vars) => t(text, vars);
// DOM append() turns null into the text "null"; skip empty slots instead.
const add = (parent, ...kids) => parent.append(...kids.filter(Boolean));

function crumbs(session, t) {
  const at = CRUMBS.indexOf(session.step);
  return h(
    "ol",
    { class: "rl-crumbs", "aria-label": t("Steps") },
    ...CRUMBS.map((step, i) =>
      h("li", {
        class: i < at || session.step === "done" ? "is-done" : i === at ? "is-now" : "",
        "aria-current": i === at ? "step" : null,
        text: t(STEP_LABELS[step]),
      }),
    ),
  );
}

function choiceList(choices, picked, t, onPick, vars = {}) {
  return h(
    "div",
    { class: "rl-choices", role: "group" },
    ...choices.map((choice) =>
      h("button", {
        type: "button",
        class: `rl-choice${picked === choice.id ? " is-picked" : ""}`,
        "data-choice": choice.id,
        text: say(t, choice.text, { ...vars, ...(choice.vars || {}) }),
        on: { click: () => onPick(choice.id) },
      }),
    ),
  );
}

const primary = (label, onClick, enabled = true) =>
  h("button", {
    type: "button",
    class: "fl-btn rl-primary",
    "data-primary": "",
    "aria-disabled": enabled ? null : "true",
    text: label,
    on: { click: () => enabled && onClick() },
  });

function repairFor(mission, tag, t) {
  const text = tag && mission.repair[tag];
  return text ? h("p", { class: "rl-repair", text: t(text) }) : null;
}

const note = (text) => h("p", { class: "rl-line", text });

// Builds the card. `dispatch(action)` sends an action to the engine; `onFinishWork` downloads the student's work.
export function renderCoach(host, { mission, session, t: translate, dispatch, onWork, onHome, onReplay }) {
  const t = (text, vars) => translate(text, vars && Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === "number" ? v.toLocaleString("en-US") : v])));
  host.replaceChildren();
  const body = h("div", { class: "rl-card-body" });
  const title = h("h2", { id: "rl-step-title", tabindex: "-1", class: "rl-step-title" });
  add(host, crumbs(session, t), title, body);
  const goalOk = mission.create.done(session.state);
  const stepNo = Math.min(CRUMBS.indexOf(session.step) + 1, 7);
  const kicker =
    session.step === "done" ? t("Mission complete") : t("Step {n} of 7", { n: stepNo });
  title.append(
    h("span", { class: "rl-kicker", text: kicker }),
    document.createTextNode(` ${t(mission.title)}`),
  );

  if (session.step === "create") {
    add(body, 
      note(t(mission.create.text)),
      h("p", {
        class: `rl-status ${goalOk ? "is-ok" : ""}`,
        role: "status",
        text: goalOk
          ? t("That matches. Ready to predict.")
          : t("Not there yet. Use the controls under the field."),
      }),
      primary(t("Next: predict"), () => dispatch({ type: "continue" }), goalOk),
    );
  } else if (session.step === "predict") {
    const p = mission.predict(session.state);
    add(body, 
      note(t(p.prompt, p.vars)),
      choiceList(p.choices, session.prediction?.id, t, (id) => dispatch({ type: "predict", id })),
      note(t("Pick the one you think is right. You can test it next.")),
    );
  } else if (session.step === "experiment") {
    const p = mission.predict(session.base);
    const pick = p.choices.find((c) => c.id === session.prediction?.id);
    add(body, 
      h("p", {
        class: "rl-yours",
        text: t("Your prediction: {text}", { text: pick ? t(pick.text, pick.vars) : "" }),
      }),
      note(t(mission.experiment.text)),
      note(t("Use the controls under the field. The numbers will change as you go.")),
    );
  } else if (session.step === "observe") {
    const o = session.observed;
    const p = mission.predict(session.base);
    const pick = p.choices.find((c) => c.id === session.prediction?.id);
    const right = p.choices.find((c) => c.correct);
    add(body, 
      ...mission
        .observe(o.before, o.after)
        .map((line) => h("p", { class: "rl-observe", text: t(line.key, line.vars) })),
      session.prediction?.correct
        ? h("p", { class: "rl-ok", text: t("Your prediction matched what the field shows.") })
        : h("p", {
            class: "rl-yours",
            text: t("You predicted {a}. The field shows {b}.", {
              a: t(pick.text, pick.vars),
              b: t(right.text, right.vars),
            }),
          }),
      repairFor(mission, session.prediction?.tag, t),
      primary(t("Next: explain why"), () => dispatch({ type: "continue" })),
    );
  } else if (session.step === "explain") {
    const e = session.explain;
    const picked = mission.explain.choices.find((c) => c.id === e.choice);
    add(body, 
      note(t(mission.explain.prompt)),
      choiceList(
        mission.explain.choices,
        e.choice,
        t,
        (id) => !e.correct && dispatch({ type: "explain", id }),
      ),
      e.choice && !e.correct
        ? h(
            "div",
            { class: "rl-feedback", role: "status", tabindex: "-1", "data-feedback": "" },
            h("p", { class: "rl-wrong", text: t("Not quite. Look at the numbers again.") }),
            repairFor(mission, picked?.tag, t),
            note(t("Pick another reason.")),
          )
        : null,
      e.correct
        ? h("p", {
            class: "rl-ok",
            role: "status",
            "data-feedback": "",
            tabindex: "-1",
            text: t("Yes. That is why it works."),
          })
        : null,
      e.correct ? primary(t("Next: try a new one"), () => dispatch({ type: "continue" })) : null,
    );
  } else if (session.step === "apply") {
    const a = session.apply;
    const problem = mission.apply(a.seed, a.before ?? session.state);
    const { shown, more } = hintsFor(mission, session);
    add(body, note(t(problem.prompt, problem.vars)));
    if (problem.kind === "number") {
      const input = h("input", {
        id: "rl-answer",
        class: "rl-input",
        type: "number",
        inputmode: "numeric",
        "aria-label": t("Your answer"),
        value: a.correct && a.given != null ? a.given : null,
      });
      const submit = () =>
        input.value !== "" && dispatch({ type: "answer", value: Number(input.value) });
      input.addEventListener("keydown", (e) => e.key === "Enter" && submit());
      add(body, 
        h(
          "div",
          { class: "rl-answer-row" },
          h("label", { for: "rl-answer", text: t("Answer") }),
          input,
          h("button", {
            type: "button",
            class: "fl-btn rl-check",
            "data-primary": a.correct ? null : "",
            text: t("Check"),
            on: { click: submit },
          }),
        ),
      );
    } else {
      add(body, 
        h("button", {
          type: "button",
          class: "fl-btn rl-check",
          "data-primary": a.correct ? null : "",
          text: t("Check my stands"),
          on: { click: () => dispatch({ type: "answer" }) },
        }),
      );
    }
    if (a.attempts > 0 && !a.correct)
      add(body, 
        h(
          "div",
          { class: "rl-feedback", role: "status", tabindex: "-1", "data-feedback": "" },
          h("p", {
            class: "rl-wrong",
            text:
              problem.kind === "number"
                ? t("Not quite. Check your answer on the field.")
                : t("Not quite. Count the seats again."),
          }),
          note(t("Try the hint, or try another problem.")),
        ),
      );
    if (a.correct)
      add(body, 
        h("p", {
          class: "rl-ok",
          role: "status",
          "data-feedback": "",
          tabindex: "-1",
          text: t("Correct. You solved it on your own."),
        }),
      );
    if (shown.length)
      add(body, 
        h(
          "ul",
          { class: "rl-hints" },
          ...shown.map((hint) => h("li", { text: t(hint.text, hint.vars) })),
        ),
      );
    if (!a.correct) {
      const row = h("div", { class: "rl-row" });
      if (more)
        row.append(
          h("button", {
            type: "button",
            class: "fl-btn fl-btn--ghost",
            text: shown.length ? t("Another hint") : t("Give me a hint"),
            on: { click: () => dispatch({ type: "hint" }) },
          }),
        );
      if (a.attempts > 0)
        row.append(
          h("button", {
            type: "button",
            class: "fl-btn fl-btn--ghost",
            text: t("Try another problem"),
            on: { click: () => dispatch({ type: "another" }) },
          }),
        );
      add(body, row);
    } else add(body, primary(t("Next: reflect"), () => dispatch({ type: "continue" })));
  } else if (session.step === "reflect") {
    const area = h("textarea", {
      id: "rl-reflect",
      class: "rl-text",
      rows: 4,
      maxlength: 600,
      "aria-label": t("Your reflection"),
    });
    area.value = session.reflection;
    area.addEventListener("input", () =>
      dispatch({ type: "reflect", text: area.value }, { quiet: true }),
    );
    add(body, 
      note(t(mission.reflect.prompt)),
      area,
      h("p", { class: "rl-small", text: t("Saved on this device. Nobody scores this.") }),
      primary(t("Finish the mission"), () => dispatch({ type: "finish" })),
    );
  } else {
    const ev = evidenceOf(session);
    add(body, 
      h("p", { class: "rl-ok", text: t("You finished {title}.", { title: t(mission.title) }) }),
      h(
        "ul",
        { class: "rl-summary" },
        h("li", {
          text: ev.prediction?.correct
            ? t("Your prediction matched.")
            : t("Your prediction was different from the field, and you worked out why."),
        }),
        h("li", { text: t("Explain: {n} tries.", { n: ev.explain.attempts }) }),
        h("li", {
          text: ev.apply.independent
            ? t("New problem: solved on your own.")
            : t("New problem: solved with {n} hints.", { n: ev.apply.hints }),
        }),
      ),
      primary(t("Play again"), onReplay),
      h(
        "div",
        { class: "rl-row" },
        h("button", {
          type: "button",
          class: "fl-btn fl-btn--ghost",
          text: t("Download my work"),
          on: { click: onWork },
        }),
        h("button", {
          type: "button",
          class: "fl-btn fl-btn--ghost",
          text: t("My worlds"),
          on: { click: onHome },
        }),
      ),
    );
  }
  add(host, 
    h("p", { class: "rl-coach-label", text: t("Built-in coach. No AI and no internet needed.") }),
  );
}

export { STEPS };

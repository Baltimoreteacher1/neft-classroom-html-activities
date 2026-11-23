// Listening task renderers: listen-select, listen-sequence, listen-label, listen-notes.
// Contract: build(task, env) -> { el, mark(detail|null), destroy() }. Responses go through env.set(response).
import { announce, h } from "../../core/dom.js";
import { answerText, scrambleOrder } from "./check.js";
import { createAudioPlayer } from "./audio.js";
import { clearMarks, figure, labelled, markRow, radioGroup, supportsBlock, uid } from "./ui.js";

function audioBlock(task, env) {
  const audio = env.audioFor(task);
  const player = createAudioPlayer(audio, {
    onPlay: () => env.notePlay(),
    onCaptions: (on) => env.setCaptions(on),
    captionsOn: env.captionsOn(),
    label: "Listening audio",
  });
  const parts = [player.el];
  if (task.listenFor?.length) {
    const box = h("p", { class: "st-wida-listenfor" });
    const refresh = () => {
      const open = env.mode() !== "independent" || env.supportsRequested();
      box.hidden = !open;
      box.replaceChildren(h("strong", {}, "Listen for: "), task.listenFor.join(", "));
    };
    env.addRefresh(refresh);
    refresh();
    parts.push(box);
  }
  if (env.preview) {
    parts.push(
      h(
        "details",
        { class: "st-wida-teacherbox" },
        h("summary", {}, "Teacher: transcript and answer"),
        h("p", {}, audio.transcript),
        h("p", {}, h("strong", {}, "Answer: "), answerText(task)),
      ),
    );
  }
  return { parts, stop: player.stop };
}

const select = (task, env, r) => {
  const group = radioGroup({
    legend: task.question,
    name: uid("q"),
    options: task.options,
    value: task.multi ? r.picks : r.pick,
    multi: !!task.multi,
    onPick: (v) => {
      if (task.multi) r.picks = v;
      else r.pick = v;
      env.set(r);
    },
  });
  return { body: [group], mark: () => {} };
};

const sequence = (task, env, r) => {
  const ids = task.items.map((i) => i.id);
  r.order = r.order?.length === ids.length ? r.order : scrambleOrder(ids, task.id);
  const textOf = (id) => task.items.find((i) => i.id === id).text;
  const list = h("ol", { class: "st-wida-seq", "aria-label": "Steps. Use the buttons to change the order." });
  const render = (focusId, focusDir) => {
    list.replaceChildren();
    r.order.forEach((id, i) => {
      const up = h("button", { type: "button", class: "st-btn", "aria-label": `Move up: ${textOf(id)}`, disabled: i === 0 }, "Up");
      const down = h("button", { type: "button", class: "st-btn", "aria-label": `Move down: ${textOf(id)}`, disabled: i === r.order.length - 1 }, "Down");
      const move = (d) => {
        const j = i + d;
        [r.order[i], r.order[j]] = [r.order[j], r.order[i]];
        r.moved = true;
        env.set(r);
        render(id, d < 0 ? "up" : "down");
        announce(`${textOf(id)} is now step ${j + 1} of ${r.order.length}.`);
      };
      up.addEventListener("click", () => move(-1));
      down.addEventListener("click", () => move(1));
      list.append(h("li", { class: "st-wida-seqrow", "data-key": id }, h("span", { class: "st-wida-seqtext" }, textOf(id)), h("span", { class: "st-wida-seqbtns" }, up, down)));
    });
    if (focusId) {
      const row = list.querySelector(`[data-key="${focusId}"]`);
      const pick = row?.querySelector(focusDir === "up" ? "button:first-child" : "button:last-child");
      const b = pick && !pick.disabled ? pick : row?.querySelector("button:not([disabled])");
      b?.focus();
    }
  };
  render();
  return {
    body: [h("p", { class: "st-wida-question" }, "Put the steps in the order you hear them."), list],
    mark: (detail) => {
      clearMarks(list);
      if (detail) for (const d of detail) markRow(list.querySelector(`[data-key]:nth-child(${task.answer.indexOf(d.id) + 1})`) || list, d.ok);
    },
  };
};

const label = (task, env, r) => {
  r.map = r.map || {};
  const rows = h("div", { class: "st-wida-slots" });
  const bankIds = scrambleOrder(task.bank.map((b) => b.id), `${task.id}-bank`);
  for (const s of task.slots) {
    const id = uid("slot");
    const sel = h("select", { id, class: "st-wida-select" }, h("option", { value: "" }, "Choose a word"), bankIds.map((b) => h("option", { value: b, selected: r.map[s.id] === b }, task.bank.find((x) => x.id === b).text)));
    sel.addEventListener("change", () => {
      r.map[s.id] = sel.value;
      env.set(r);
    });
    rows.append(h("div", { class: "st-wida-slot", "data-key": s.id }, h("label", { for: id }, `Number ${s.marker}`, s.prompt ? `: ${s.prompt}` : ""), sel));
  }
  return {
    body: [task.visual ? figure(task.visual) : null, rows],
    mark: (detail) => {
      clearMarks(rows);
      if (detail) for (const d of detail) markRow(rows.querySelector(`[data-key="${d.id}"]`), d.ok);
    },
  };
};

const notes = (task, env, r) => {
  r.rows = r.rows || {};
  const table = h("div", { class: "st-wida-notes" }, h("h4", {}, task.organizer.title || "My notes"));
  for (const row of task.organizer.rows) {
    const id = uid("note");
    const input = h("input", { type: "text", id, class: "st-wida-input", value: r.rows[row.id] || "", placeholder: row.placeholder || "Write a key word or phrase", autocomplete: "off", maxlength: "120" });
    input.addEventListener("input", () => {
      r.rows[row.id] = input.value;
      env.set(r);
    });
    table.append(h("div", { class: "st-wida-noterow", "data-key": row.id }, h("label", { for: id }, row.label), input));
  }
  return {
    body: [table],
    mark: (detail) => {
      clearMarks(table);
      if (detail) for (const d of detail) markRow(table.querySelector(`[data-key="${d.id}"]`), d.ok);
    },
  };
};

const BUILDERS = { "listen-select": select, "listen-sequence": sequence, "listen-label": label, "listen-notes": notes };

export function build(task, env) {
  const r = structuredClone(env.response || {});
  const audio = audioBlock(task, env);
  const part = BUILDERS[task.type](task, env, r);
  const el = h("div", { class: "st-wida-task", "data-type": task.type }, ...audio.parts, task.visual && task.type !== "listen-label" ? figure(task.visual) : null, supportsBlock(task, env), h("div", { class: "st-wida-answer" }, ...part.body));
  return { el, mark: part.mark, destroy: audio.stop };
}

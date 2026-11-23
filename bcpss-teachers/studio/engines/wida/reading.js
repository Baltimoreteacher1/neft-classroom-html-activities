// Reading task renderers: read-select, read-evidence, read-sort, read-multitext, plus the text panel
// (headings, captions, tables via visual specs, tier-aware word help).
import { h } from "../../core/dom.js";
import { answerText } from "./check.js";
import { clearMarks, figure, markRow, radioGroup, supportsBlock, uid } from "./ui.js";

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Which glossary entries are underlined right now. Tier rule from the schema; independent practice hides until asked. */
export function activeGlossary(text, env, force) {
  if (env.mode() === "independent" && !env.supportsRequested() && !force) return [];
  const tier = env.tier();
  return (text.glossary || []).filter((g) => {
    if (g.tiers && !g.tiers.includes(tier) && !force) return false;
    if (force) return true;
    if (tier === "ee") return true;
    if (tier === "dev") return g.level >= 2;
    if (tier === "exp") return g.level >= 3;
    return false;
  });
}

function paraNodes(par, entries, tier) {
  if (!entries.length) return [par];
  const re = new RegExp(`\\b(${entries.map((g) => esc(g.term)).sort((a, b) => b.length - a.length).join("|")})\\b`, "gi");
  const out = [];
  let last = 0;
  for (const m of par.matchAll(re)) {
    out.push(par.slice(last, m.index));
    const g = entries.find((e) => e.term.toLowerCase() === m[0].toLowerCase());
    const def = tier === "ee" && g.simple ? g.simple : g.def;
    const btn = h("button", { type: "button", class: "st-wida-term", "aria-expanded": "false" }, m[0]);
    const tip = h("span", { class: "st-wida-gloss", role: "note", hidden: true }, h("strong", {}, `${g.term}: `), def);
    btn.addEventListener("click", () => {
      const open = tip.hidden;
      tip.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });
    out.push(btn, tip);
    last = m.index + m[0].length;
  }
  out.push(par.slice(last));
  return out;
}

export function textPanel(text, env, { label } = {}) {
  const body = h("div", { class: "st-wida-textbody" });
  let forced = false;
  const helpBtn = h("button", { type: "button", class: "st-btn", "aria-pressed": "false" }, "Word help");
  const draw = () => {
    const entries = activeGlossary(text, env, forced);
    body.replaceChildren();
    for (const s of text.sections) {
      const sec = h("section", { class: "st-wida-textsec" });
      if (s.heading) sec.append(h("h4", { class: "st-wida-texthead" }, s.heading));
      for (const p of s.paras) sec.append(h("p", {}, ...paraNodes(p, entries, env.tier())));
      if (s.figure) sec.append(figure(s.figure.visual, s.figure.caption));
      body.append(sec);
    }
    helpBtn.hidden = !(text.glossary || []).length;
    helpBtn.setAttribute("aria-pressed", String(forced));
  };
  helpBtn.addEventListener("click", () => {
    forced = !forced;
    if (forced && env.mode() === "independent") env.requestSupports();
    draw();
  });
  env.addRefresh(draw);
  draw();
  return h(
    "article",
    { class: "st-wida-text", "aria-label": text.title },
    h("header", {}, label ? h("p", { class: "st-wida-kicker" }, label) : null, h("h3", { class: "st-wida-texttitle" }, text.title), helpBtn),
    body,
  );
}

const select = (task, env, r) => ({
  body: [radioGroup({ legend: task.question, name: uid("q"), options: task.options, value: task.multi ? r.picks : r.pick, multi: !!task.multi, onPick: (v) => { if (task.multi) r.picks = v; else r.pick = v; env.set(r); } })],
  mark: () => {},
});

const evidence = (task, env, r) => {
  r.evidence = r.evidence || [];
  const ev = task.evidence;
  const multi = ev.answers.length > 1;
  return {
    body: [
      radioGroup({ legend: task.question, name: uid("q"), options: task.options, value: r.pick, onPick: (v) => { r.pick = v; env.set(r); } }),
      radioGroup({ legend: ev.prompt, name: uid("e"), options: ev.choices, value: multi ? r.evidence : r.evidence[0], multi, onPick: (v) => { r.evidence = multi ? v : [v]; env.set(r); } }),
    ],
    mark: () => {},
  };
};

const sort = (task, env, r) => {
  r.placed = r.placed || {};
  const rows = h("div", { class: "st-wida-slots" });
  for (const i of task.items) {
    const id = uid("sort");
    const sel = h("select", { id, class: "st-wida-select" }, h("option", { value: "" }, "Choose a group"), task.categories.map((c) => h("option", { value: c.id, selected: r.placed[i.id] === c.id }, c.label)));
    sel.addEventListener("change", () => {
      r.placed[i.id] = sel.value;
      env.set(r);
    });
    rows.append(h("div", { class: "st-wida-slot", "data-key": i.id }, h("label", { for: id }, i.text), sel));
  }
  return {
    body: [rows],
    mark: (detail) => {
      clearMarks(rows);
      if (detail) for (const d of detail) markRow(rows.querySelector(`[data-key="${d.id}"]`), d.ok);
    },
  };
};

const multitext = (task, env, r) => {
  r.map = r.map || {};
  const rows = h("div", { class: "st-wida-slots" });
  const [a, b] = task.texts.map((id) => env.textFor(id).title);
  const labels = { A: task.labels?.A || `Text A: ${a}`, B: task.labels?.B || `Text B: ${b}`, both: "Both texts" };
  for (const s of task.statements) {
    const fs = radioGroup({ legend: s.text, name: uid("m"), options: Object.entries(labels).map(([id, text]) => ({ id, text })), value: r.map[s.id], onPick: (v) => { r.map[s.id] = v; env.set(r); } });
    fs.dataset.key = s.id;
    fs.classList.add("st-wida-slot");
    rows.append(fs);
  }
  return {
    body: [rows],
    mark: (detail) => {
      clearMarks(rows);
      if (detail) for (const d of detail) markRow(rows.querySelector(`[data-key="${d.id}"]`), d.ok);
    },
  };
};

const BUILDERS = { "read-select": select, "read-evidence": evidence, "read-sort": sort, "read-multitext": multitext };

export function build(task, env) {
  const r = structuredClone(env.response || {});
  const part = BUILDERS[task.type](task, env, r);
  const panels = task.type === "read-multitext" ? task.texts.map((id, i) => textPanel(env.textFor(id), env, { label: i ? "Text B" : "Text A" })) : [textPanel(env.textFor(task.text), env)];
  const teacher = env.preview ? h("details", { class: "st-wida-teacherbox" }, h("summary", {}, "Teacher: answer"), h("p", {}, answerText(task))) : null;
  const el = h(
    "div",
    { class: "st-wida-task st-wida-read", "data-type": task.type },
    h("div", { class: `st-wida-texts${panels.length > 1 ? " st-wida-texts-two" : ""}` }, panels),
    h("div", { class: "st-wida-questions" }, supportsBlock(task, env), h("div", { class: "st-wida-answer" }, ...part.body), teacher),
  );
  return { el, mark: part.mark, destroy() {} };
}

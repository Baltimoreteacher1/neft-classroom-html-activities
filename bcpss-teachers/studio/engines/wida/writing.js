// Writing task renderers: write-expand, write-explain, write-paragraph, write-revise.
// Never scored. Word count is shown neutrally. Work is saved on this device; copy or print on request.
import { announce, h } from "../../core/dom.js";
import { wordCount } from "./check.js";
import { createRevision } from "./revision.js";
import { copyText, figure, printNodes, supportsBlock, uid } from "./ui.js";

const stripEnd = (s) => String(s).trim().replace(/[.!?]+$/, "");
const sentence = (s) => {
  const t = String(s).trim();
  return t && !/[.!?]$/.test(t) ? `${t}.` : t;
};

/** The shared writing surface: expandable box, count, targets checklist, model, copy and print, revision cycle. */
function draftArea(task, env, r, { fixedDraft } = {}) {
  r.ticks = r.ticks || {};
  r.rev = r.rev || {};
  const id = uid("draft");
  const ta = h("textarea", { id, class: "st-textarea st-wida-draft", rows: "6", spellcheck: "true", "aria-describedby": `${id}-count` });
  ta.value = r.text || "";
  const count = h("p", { class: "st-wida-count", id: `${id}-count` }, `${wordCount(ta.value)} words`);
  const bigger = h("button", { type: "button", class: "st-btn", "aria-pressed": "false" }, "Make the box bigger");
  bigger.addEventListener("click", () => {
    const on = bigger.getAttribute("aria-pressed") !== "true";
    bigger.setAttribute("aria-pressed", String(on));
    ta.rows = on ? 14 : 6;
    bigger.textContent = on ? "Make the box smaller" : "Make the box bigger";
  });

  const targets = h("fieldset", { class: "st-wida-checks" }, h("legend", {}, "Language targets: check each one you did"));
  for (const t of task.targets) {
    const cid = uid("tg");
    const input = h("input", { type: "checkbox", id: cid });
    input.checked = !!r.ticks[t.id];
    input.addEventListener("change", () => {
      r.ticks[t.id] = input.checked;
      env.set(r);
    });
    targets.append(h("div", { class: "st-wida-option" }, input, h("label", { for: cid }, t.label)));
  }

  const modelBtn = h("button", { type: "button", class: "st-btn" }, "Show a model");
  const modelBox = h("div", { class: "st-wida-modeltext", hidden: true });
  modelBtn.addEventListener("click", () => {
    modelBox.hidden = !modelBox.hidden;
    modelBox.replaceChildren(h("strong", {}, "A model, not the only right answer: "), task.exemplars[env.tier()]);
    modelBtn.textContent = modelBox.hidden ? "Show a model" : "Hide the model";
    if (!modelBox.hidden) {
      r.modelSeen = true;
      env.set(r);
    }
  });
  const modelRefresh = () => {
    const open = env.supportsOpen();
    modelBtn.hidden = !open;
    modelBox.hidden = modelBox.hidden || !open;
    const ready = wordCount(ta.value) > 0 || env.preview;
    modelBtn.disabled = !ready;
    modelBtn.title = ready ? "" : "Write a first try, then look at a model.";
  };
  env.addRefresh(modelRefresh);

  const status = h("p", { class: "st-wida-quiet", role: "status", "aria-live": "polite" });
  const copy = h("button", { type: "button", class: "st-btn" }, "Copy my writing");
  copy.addEventListener("click", async () => {
    const ok = await copyText(r.rev?.draft2 || ta.value);
    status.textContent = ok ? "Copied." : "Could not copy. Select the text and copy it by hand.";
    announce(status.textContent);
  });
  const print = h("button", { type: "button", class: "st-btn" }, "Print my writing");
  print.addEventListener("click", () => printNodes(task.title, [h("p", {}, task.prompt), h("p", { class: "st-wida-printtext" }, r.rev?.draft2 || ta.value)]));

  const revision = createRevision({
    getDraft: () => ta.value,
    checks: task.checks || task.targets.map((t) => ({ id: t.id, label: t.label, question: `Did I do this? ${t.label}`, tip: `Add this to your next draft: ${t.label}` })),
    state: r.rev,
    onChange: () => {
      if (fixedDraft) {
        r.text = r.rev.draft2 && r.rev.draft2 !== r.rev.draft1 ? r.rev.draft2 : "";
        ta.value = r.text;
      }
      env.set(r);
    },
    fixedDraft,
  });
  ta.addEventListener("input", () => {
    r.text = ta.value;
    count.textContent = `${wordCount(ta.value)} words`;
    env.set(r);
    modelRefresh();
    revision.refresh();
  });
  modelRefresh();
  const el = h(
    "div",
    { class: "st-wida-draftarea" },
    fixedDraft ? null : h("label", { for: id, class: "st-wida-draftlabel" }, "My writing"),
    fixedDraft ? null : ta,
    fixedDraft ? null : h("div", { class: "st-row st-wida-draftbar" }, count, bigger),
    task.lengthHint ? h("p", { class: "st-wida-quiet" }, task.lengthHint) : null,
    targets,
    h("div", { class: "st-row" }, modelBtn, copy, print),
    modelBox,
    status,
    revision.el,
  );
  return { el, ta, setText(t) { ta.value = t; ta.dispatchEvent(new Event("input", { bubbles: true })); } };
}

const expand = (task, env, r) => {
  r.exp = r.exp || {};
  const area = draftArea(task, env, r);
  const rows = h("div", { class: "st-wida-expandrows" }, h("p", { class: "st-wida-basesent" }, h("strong", {}, "Start: "), task.base));
  for (const x of task.expansions) {
    const id = uid("ex");
    const input = h("input", { type: "text", id, class: "st-wida-input", value: r.exp[x.id] || "", maxlength: "120", autocomplete: "off" });
    input.addEventListener("input", () => {
      r.exp[x.id] = input.value;
      env.set(r);
    });
    const frames = x.frames?.length ? h("ul", { class: "st-frames", "aria-label": `Ideas for: ${x.ask}` }, x.frames.map((f) => h("li", {}, h("button", { type: "button", class: "st-chip", onclick: () => { input.value = f; input.dispatchEvent(new Event("input")); input.focus(); } }, f)))) : null;
    rows.append(h("div", { class: "st-wida-field" }, h("label", { for: id }, x.ask), input, env.supportsOpen() ? frames : null));
  }
  const build = h("button", { type: "button", class: "st-btn st-primary" }, "Build my sentence");
  build.addEventListener("click", () => {
    const adds = task.expansions.map((x) => (r.exp[x.id] || "").trim()).filter(Boolean);
    area.setText(sentence([stripEnd(task.base), ...adds].join(" ")));
    announce("Your sentence was built. You can edit it.");
    area.ta.focus();
  });
  return [rows, h("div", { class: "st-row" }, build), area.el];
};

const explain = (task, env, r) => {
  r.parts = r.parts || {};
  const area = draftArea(task, env, r);
  const wrap = h("div", { class: "st-wida-parts" });
  for (const p of task.parts) {
    const id = uid("pt");
    const ta = h("textarea", { id, class: "st-textarea", rows: "2", "aria-describedby": `${id}-f` });
    ta.value = r.parts[p.id] || "";
    ta.addEventListener("input", () => {
      r.parts[p.id] = ta.value;
      env.set(r);
    });
    const fr = h("div", { id: `${id}-f` });
    const refreshFr = () => {
      const frames = p.frames?.[env.tier()] || [];
      fr.replaceChildren(env.supportsOpen() && frames.length ? h("ul", { class: "st-frames", "aria-label": `Sentence frames for ${p.label}` }, frames.map((f) => h("li", {}, f))) : "");
    };
    env.addRefresh(refreshFr);
    refreshFr();
    wrap.append(h("div", { class: "st-wida-field" }, h("label", { for: id }, h("strong", {}, `${p.label}. `), p.prompt), fr, ta));
  }
  const build = h("button", { type: "button", class: "st-btn st-primary" }, "Put it together");
  build.addEventListener("click", () => {
    area.setText(task.parts.map((p) => sentence(r.parts[p.id] || "")).filter(Boolean).join(" "));
    announce("Your parts were put together. You can edit the explanation.");
    area.ta.focus();
  });
  return [wrap, h("div", { class: "st-row" }, build), area.el];
};

const paragraph = (task, env, r) => {
  r.org = r.org || {};
  const area = draftArea(task, env, r);
  const org = h("section", { class: "st-wida-organizer", "aria-label": "Organizer" }, h("h4", {}, "Organizer"));
  for (const row of task.organizer.rows) {
    const id = uid("og");
    const input = h("input", { type: "text", id, class: "st-wida-input", value: r.org[row.id] || "", placeholder: row.placeholder || "Notes", maxlength: "200", autocomplete: "off" });
    input.addEventListener("input", () => {
      r.org[row.id] = input.value;
      env.set(r);
    });
    org.append(h("div", { class: "st-wida-field" }, h("label", { for: id }, h("strong", {}, `${row.label}. `), row.prompt), input));
  }
  const move = h("button", { type: "button", class: "st-btn st-primary" }, "Move my notes into the paragraph");
  move.addEventListener("click", () => {
    area.setText(task.organizer.rows.map((x) => sentence(r.org[x.id] || "")).filter(Boolean).join(" "));
    announce("Your notes were moved into the paragraph. Edit them into your own words.");
    area.ta.focus();
  });
  return [org, h("div", { class: "st-row" }, move), area.el];
};

const revise = (task, env, r) => {
  const own = task.source === "previous" ? env.textOf(task.from) : "";
  const area = draftArea(task, env, r, { fixedDraft: own || task.draft });
  return [h("p", { class: "st-wida-kicker" }, task.source === "previous" && own ? "Your earlier writing" : "A sample draft"), area.el];
};

const BUILDERS = { "write-expand": expand, "write-explain": explain, "write-paragraph": paragraph, "write-revise": revise };

export function build(task, env) {
  const r = structuredClone(env.response || {});
  const body = BUILDERS[task.type](task, env, r);
  const el = h("div", { class: "st-wida-task", "data-type": task.type }, task.visual ? figure(task.visual) : null, supportsBlock(task, env), ...body);
  return { el, mark() {}, destroy() {} };
}

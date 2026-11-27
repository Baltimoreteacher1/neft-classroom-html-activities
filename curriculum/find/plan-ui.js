/* plan-ui.js — "Plan a set" (teachers) and "My practice path" (students) on /curriculum/find/.
 *
 * Both draw a set from ./plan-engine.js. The choice lives in the URL (?mode=plan&target=6-6&for=intervene&swap=game:1,
 * ?mode=path&lesson=4-2), so refresh, Back and a copied link all land on the same set. A student's "I did this" marks
 * are theirs alone, kept on this device (./collections.js loadPath/savePath), and are never a score. */

import { loadPath, savePath } from "./collections.js";
import { saveAsCollection, saveButton, syncSaveButtons } from "./collections-ui.js";
import { $, copy, el, facts, printOnly, store } from "./dom.js";
import { audienceLabel, kindLabel } from "./find-engine.js";
import {
  PURPOSES,
  TOPICS,
  applySwaps,
  buildSet,
  lessons,
  nextLesson,
  resolveTarget,
} from "./plan-engine.js";

/** Common needs, one tap to a built set. Each is a target and a purpose the engine already understands. */
const STARTERS = [
  ["Ratios intervention", "t:ratios", "intervene"],
  ["Expressions review", "t:expressions", "review"],
  ["Percents: independent practice", "s:6.AT.4", "practice"],
  ["Equations: practice at home", "t:inequalities", "family"],
  ["Area: extend", "t:area", "extend"],
  ["Statistics: teach the lesson", "t:statistics", "introduce"],
];

let index = null;
let lastSet = null;
const params = () => new URLSearchParams(location.search);
function go(next, { push = true } = {}) {
  const url = new URL(location.href);
  url.search = new URLSearchParams(next).toString();
  url.hash = "";
  history[push ? "pushState" : "replaceState"]({}, "", url);
  document.dispatchEvent(new CustomEvent("find:navigate"));
}
const parseSwaps = (raw) =>
  Object.fromEntries(
    String(raw || "")
      .split(",")
      .map((x) => x.split(":"))
      .filter(([k, v]) => /^\w+$/.test(k || "") && /^\d$/.test(v || "")),
  );
const swapString = (swaps) =>
  Object.entries(swaps)
    .filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => `${k}:${v}`)
    .join(",");

/* ---------- shared pieces -------------------------------------------------------------------------------------- */
function lessonOptions(select, selected, { topics = false } = {}) {
  const groups = new Map();
  for (const l of lessons(index)) {
    const name = `Unit ${l.unit}${index.units[l.unit] ? `: ${index.units[l.unit]}` : ""}`;
    if (!groups.has(name)) groups.set(name, []);
    groups
      .get(name)
      .push(el("option", { value: l.id, selected: l.id === selected, text: `${l.id} ${l.title}` }));
  }
  const kids = [
    el("option", { value: "", text: topics ? "Choose a lesson or topic" : "Choose a lesson" }),
  ];
  for (const [label, opts] of groups) kids.push(el("optgroup", { label }, opts));
  if (topics)
    kids.push(
      el(
        "optgroup",
        { label: "Topics across the course" },
        Object.entries(TOPICS).map(([k, v]) =>
          el("option", { value: `t:${k}`, selected: `t:${k}` === selected, text: v }),
        ),
      ),
    );
  select.replaceChildren(...kids);
  // A standard target from a shared link is not in the list; show it rather than silently dropping it.
  if (selected && !select.value) {
    const t = resolveTarget(index, selected);
    if (t) select.prepend(el("option", { value: selected, selected: true, text: t.label }));
  }
}
function docLink(doc) {
  return el("a", { href: doc.p, "data-doc": doc.p, text: doc.t });
}
function factsList(doc) {
  return el(
    "ul",
    { class: "find-facts", "aria-label": "About this resource" },
    facts(doc, audienceLabel).map((t) => el("li", { text: t })),
  );
}

/* ---------- Plan a set ----------------------------------------------------------------------------------------- */
function slotCard(slot, i, swaps, target) {
  const head = [el("span", { class: "find-slot-num", "aria-hidden": "true", text: String(i + 1) })];
  const body = [el("p", { class: "find-slot-label", text: slot.label })];
  if (slot.external) {
    body.push(
      el("h4", {}, el("a", { href: slot.external.href, text: slot.external.title })),
      el("p", { class: "find-slot-why" }, el("strong", { text: "Why: " }), slot.why),
    );
    return el(
      "li",
      { class: "find-slot find-slot-external" },
      ...head,
      el("div", { class: "find-slot-body" }, body),
    );
  }
  if (!slot.pick) {
    body.push(
      el("p", {
        class: "find-slot-empty",
        text: `Nothing of this kind is in the course for this ${target.kind}, its ${target.kind === "topic" ? "related lessons" : "standard, unit or topic"}. Find leaves the slot empty rather than fill it with something unrelated.`,
      }),
    );
    return el(
      "li",
      { class: "find-slot is-empty" },
      ...head,
      el("div", { class: "find-slot-body" }, body),
    );
  }
  const { doc, where } = slot.pick;
  body.push(
    el("h4", {}, docLink(doc)),
    factsList(doc),
    el("p", { class: "find-slot-why" }, el("strong", { text: "Why: " }), slot.why),
    el("p", { class: "find-slot-where", text: where }),
  );
  const foot = el("div", { class: "find-slot-foot" }, saveButton(doc));
  if (slot.alts.length) {
    const n = Number(swaps[slot.id] || 0);
    const swap = el("button", {
      type: "button",
      class: "find-quiet find-swap",
      text: `Swap (${slot.alts.length} other${slot.alts.length === 1 ? "" : "s"})`,
      "aria-label": `Swap ${slot.label}: show another choice`,
    });
    swap.addEventListener("click", () => {
      const next = { ...swaps, [slot.id]: (n + 1) % (slot.alts.length + 1) };
      const p = params();
      p.set("swap", swapString(next));
      if (!p.get("swap")) p.delete("swap");
      go(p, { push: false });
      requestAnimationFrame(() => $(`find-slot-${slot.id}`)?.querySelector(".find-swap")?.focus());
    });
    foot.append(swap);
  }
  body.push(foot);
  return el(
    "li",
    {
      class: "find-slot",
      id: `find-slot-${slot.id}`,
      style: doc.u ? `--u: var(--unit-${doc.u})` : null,
    },
    ...head,
    el("div", { class: "find-slot-body" }, body),
  );
}

function renderPlanOut(targetKey, purpose, swaps) {
  const out = $("find-plan-out");
  const built = targetKey && PURPOSES[purpose] ? buildSet(index, targetKey, purpose) : null;
  if (!built) {
    lastSet = null;
    out.replaceChildren(
      el("h3", { class: "find-plan-starters-title", text: "Or start from a common need" }),
      el(
        "ul",
        { class: "find-examples find-starters" },
        STARTERS.map(([label, t, f]) => {
          const a = el("a", {
            href: `?mode=plan&target=${encodeURIComponent(t)}&for=${f}`,
            text: label,
          });
          a.addEventListener("click", (e) => {
            e.preventDefault();
            go({ mode: "plan", target: t, for: f });
          });
          return el("li", {}, a);
        }),
      ),
    );
    return;
  }
  const set = applySwaps(built, swaps);
  lastSet = set;
  const found = set.slots.filter((s) => s.pick).length;
  const fromTarget = set.slots.filter((s) => s.pick?.ring === 0).length;
  const title = `${set.target.label} · ${PURPOSES[purpose].label}`;
  // The collection name is the short form, so it never gets cut mid-word at 80 characters.
  const shortName = `${set.target.kind === "lesson" ? `Lesson ${set.target.lesson}` : set.target.label} · ${PURPOSES[purpose].label}`;
  const actions = el("div", { class: "find-plan-actions" });
  const btn = (text, fn, cls = "") => {
    const b = el("button", { type: "button", class: cls, text });
    b.addEventListener("click", fn);
    actions.append(b);
  };
  btn("Save as a collection", () => {
    const items = set.slots.flatMap((s) =>
      s.pick
        ? [{ ...s.pick.doc, n: s.label }]
        : s.external
          ? [{ p: s.external.href, t: s.external.title, k: "language", n: s.label }]
          : [],
    );
    saveAsCollection(shortName.slice(0, 80), items);
  });
  btn("Print this set", () => printOnly("plan"), "find-quiet");
  btn(
    "Copy link to this set",
    async () => {
      $("find-plan-status").textContent = (await copy(location.href))
        ? "Link copied. Anyone who opens it sees this same set."
        : `Copying is blocked. The link is: ${location.href}`;
    },
    "find-quiet",
  );
  out.replaceChildren(
    el(
      "header",
      { class: "find-plan-head" },
      el("h3", { id: "find-plan-set-title", tabindex: "-1", text: title }),
      el("p", { text: PURPOSES[purpose].lead }),
      el("p", {
        class: "find-plan-count",
        text: `${found} of ${set.slots.filter((s) => !s.external).length} parts found${set.target.kind === "lesson" ? `, ${fromTarget} from Lesson ${set.target.lesson} itself` : ""}. Every link is a resource already in the course.`,
      }),
    ),
    el(
      "ol",
      { class: "find-plan-slots" },
      set.slots.map((s, i) => slotCard(s, i, swaps, set.target)),
    ),
    actions,
    el("p", {
      id: "find-plan-status",
      class: "find-saved-status",
      role: "status",
      "aria-live": "polite",
    }),
  );
  syncSaveButtons(out);
}

export function renderPlan() {
  const p = params();
  const target = p.get("target") || "";
  const purpose = PURPOSES[p.get("for")] ? p.get("for") : "";
  lessonOptions($("find-plan-target"), target, { topics: true });
  for (const r of document.querySelectorAll("input[name='for']")) r.checked = r.value === purpose;
  renderPlanOut(target, purpose, parseSwaps(p.get("swap")));
}

/* ---------- My practice path ------------------------------------------------------------------------------------ */
function renderPathOut(lesson) {
  const out = $("find-path-out");
  const set = lesson ? buildSet(index, lesson, "path") : null;
  if (!set) {
    out.replaceChildren();
    return;
  }
  const steps = set.slots.filter((s) => s.pick);
  const saved = store ? loadPath(store) : null;
  const done = new Set(saved?.lesson === lesson ? saved.done : []);
  const count = () => steps.filter((s) => done.has(s.id)).length;
  const progress = el("p", { class: "find-path-progress", role: "status", "aria-live": "polite" });
  const meter = el("span", { class: "find-meter-fill" });
  const finish = el("div", { class: "find-path-finish", hidden: true });
  const next = nextLesson(index, lesson);
  finish.append(
    el("h4", { text: "You finished every step." }),
    el("p", {
      text: "Nice work keeping at it. Come back to any step whenever you want more practice.",
    }),
    next
      ? el("a", {
          class: "find-go",
          href: `?mode=path&lesson=${next.id}`,
          text: `Next: Lesson ${next.id} path`,
        })
      : null,
  );
  const paint = () => {
    const n = count();
    progress.textContent = `${n} of ${steps.length} steps done`;
    meter.style.width = `${steps.length ? (100 * n) / steps.length : 0}%`;
    finish.hidden = n < steps.length || !steps.length;
  };
  const items = steps.map((s, i) => {
    const mark = el("button", {
      type: "button",
      class: "find-step-done",
      "aria-pressed": String(done.has(s.id)),
    });
    const label = () => {
      mark.textContent = done.has(s.id) ? "Done ✓" : "I did this";
      mark.setAttribute(
        "aria-label",
        `${s.label}: ${done.has(s.id) ? "done. Press to unmark" : "mark as done"}`,
      );
      mark.setAttribute("aria-pressed", String(done.has(s.id)));
      li.classList.toggle("is-done", done.has(s.id));
    };
    mark.addEventListener("click", () => {
      if (done.has(s.id)) done.delete(s.id);
      else done.add(s.id);
      if (store) savePath(store, lesson, [...done]);
      label();
      paint();
    });
    const li = el(
      "li",
      { class: "find-step" },
      el("span", { class: "find-step-num", "aria-hidden": "true", text: String(i + 1) }),
      el(
        "div",
        { class: "find-step-body" },
        el("p", { class: "find-step-label", text: s.label }),
        el("a", {
          class: "find-step-go",
          href: s.pick.doc.p,
          "data-doc": s.pick.doc.p,
          text: s.pick.doc.t,
        }),
        el("p", { class: "find-step-why", text: s.why }),
        el("p", { class: "find-step-kind", text: kindLabel(s.pick.doc.k) }),
        mark,
      ),
    );
    label();
    return li;
  });
  out.replaceChildren(
    el(
      "header",
      { class: "find-path-head" },
      el("h3", { id: "find-path-set-title", tabindex: "-1", text: set.target.label }),
      progress,
      el("div", { class: "find-meter", "aria-hidden": "true" }, meter),
    ),
    steps.length
      ? el("ol", { class: "find-steps" }, items)
      : el("p", {
          text: "This lesson has no online practice yet. Ask your teacher for the paper practice.",
        }),
    finish,
    el("p", {
      class: "find-path-privacy",
      text: "Your marks stay on this device. Nobody else sees them, and they are not a grade.",
    }),
  );
  paint();
}

export function renderPath() {
  const lesson = params().get("lesson") || "";
  const resume = store ? loadPath(store) : null;
  lessonOptions($("find-path-lesson"), lesson || resume?.lesson || "");
  renderPathOut(lesson);
}

/** For the start screen: the student's unfinished path, if any. */
export function resumeInfo() {
  const saved = store ? loadPath(store) : null;
  if (!saved || !index) return null;
  const set = buildSet(index, saved.lesson, "path");
  if (!set) return null;
  const steps = set.slots.filter((s) => s.pick);
  const n = steps.filter((s) => saved.done.includes(s.id)).length;
  if (!steps.length || n >= steps.length) return null;
  return { lesson: saved.lesson, title: set.target.label, done: n, total: steps.length };
}

/* ---------- wiring ----------------------------------------------------------------------------------------------- */
export function initPlan(idx) {
  index = idx;
  $("find-plan-purposes").replaceChildren(
    ...Object.entries(PURPOSES).map(([k, v]) =>
      el(
        "label",
        { class: "find-purpose" },
        el("input", { type: "radio", name: "for", value: k, required: true }),
        el(
          "span",
          { class: "find-purpose-text" },
          el("strong", { text: v.label }),
          el("span", { text: v.lead }),
        ),
      ),
    ),
  );
  $("find-plan-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const target = $("find-plan-target").value;
    const purpose = new FormData(e.target).get("for");
    if (!target || !purpose) {
      $("find-plan-error").textContent = !target
        ? "Choose a lesson or topic first."
        : "Choose what the set is for.";
      (!target ? $("find-plan-target") : e.target.querySelector("input[name='for']")).focus();
      return;
    }
    $("find-plan-error").textContent = "";
    go({ mode: "plan", target, for: purpose });
    requestAnimationFrame(() => $("find-plan-set-title")?.focus());
  });
  $("find-path-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const lesson = $("find-path-lesson").value;
    if (!lesson) {
      $("find-path-lesson").focus();
      return;
    }
    go({ mode: "path", lesson });
    requestAnimationFrame(() => $("find-path-set-title")?.focus());
  });
}
export const currentSet = () => lastSet;

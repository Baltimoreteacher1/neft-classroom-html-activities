// Teacher View — one docked button and a side drawer, teacher mode only.
//
// It replaces four panels that used to stack between the masthead and the first task
// (studio guide, rhythm coach, misconceptions, evidence console): the Student View
// stays clean and the teacher opens ONE place for everything — objective, essential
// question, materials, timing by stage, discussion prompts, anticipated misconceptions,
// formative checks and the next-step decision. The decision is live: on a one-device,
// teacher-led lesson it reads the same per-card records the evidence summary reads
// (`sg:evidence`); on student devices it reads that device's own work.
//
// Teacher-only by construction: it is only mounted by mountSmallGroupTeacherAccess after
// the server confirmed the teacher route, and `.sg-tv` is in Present Mode's TEACHER_ONLY
// list so it is blacked out on the screen turned toward the table.

import { teacherLaunchCard } from "./publisher-models.js";
import { evidenceKeys, evidenceModel } from "./small-group-evidence-summary.js";
import {
  essentialQuestion,
  materialsFor,
  stageMinutes,
  totalMinutes,
  variantOf,
} from "./small-group-pathway.js";
import { el, esc } from "./small-group-ui.js";

const list = (items) =>
  items?.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";

function section(title, html, open = false) {
  if (!html) return null;
  const d = el("details", "sg-tv-sec");
  d.open = open;
  d.innerHTML = `<summary>${esc(title)}</summary><div class="sg-tv-body">${html}</div>`;
  return d;
}

/** Discussion prompts the lesson really carries, in the order a teacher would use them. */
export function discussionPrompts(config, facilitation) {
  const out = [];
  const add = (label, text) => text && out.push(`${label}: ${text}`);
  add(
    "Launch",
    config.noticeAndWonder?.noticeStarters?.[0] &&
      "Ask what students notice before naming the math.",
  );
  add("Build", facilitation?.teacherMoves?.ask);
  add("Talk", config.launch?.practice?.talk?.prompt);
  add("Turn and talk", config.turnAndTalk?.question);
  const inv = config.launch?.practice?.investigate;
  if (inv) {
    add("Conjecture", `Always, sometimes or never? ${inv.conjecture.claim}`);
    add("Compare", inv.compare.ask);
  }
  return out;
}

const FORMATIVE = [
  "Launch & Notice: listen for quantities named before numbers.",
  "Solve Together: every student explains one step aloud.",
  "Your Turn: watch the first miss; it names the misconception.",
  "Prove It: first try counts; no hints before the first answer.",
];

/**
 * @param {{config: any, facilitation: any, talk?: any, nodes?: HTMLElement[], store?: any}} args
 * @returns {HTMLElement} the drawer root (already appended to the body)
 */
export function mountTeacherView({ config, facilitation, talk, nodes = [], store }) {
  const variant = variantOf(config);
  const root = el("aside", "sg-tv");
  root.setAttribute("aria-label", "Teacher view");
  const button = /** @type {HTMLButtonElement} */ (el("button", "sg-tv-btn", "👩‍🏫 Teacher view"));
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "sg-tv-panel");
  const panel = el("div", "sg-tv-panel");
  panel.id = "sg-tv-panel";
  panel.hidden = true;
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", "Teacher view contents");

  const head = el("div", "sg-tv-head");
  head.innerHTML = `<h2>Teacher view</h2><p>${esc(facilitation?.label || (variant === "group2" ? "Challenge" : "Foundations"))} · ${totalMinutes(variant)} min</p>`;
  const close = /** @type {HTMLButtonElement} */ (el("button", "btn ghost sg-tv-close", "Close"));
  close.type = "button";
  head.appendChild(close);

  const timing = stageMinutes(variant)
    .map((s) => `<li><b>${s.minutes} min</b> · ${esc(s.label)}</li>`)
    .join("");
  const decision = el("div", "sg-tv-decision");
  const keys = evidenceKeys(config);
  const refresh = () => {
    const m = evidenceModel((k) => store?.get(k), keys);
    decision.innerHTML = m.answered
      ? `<p><b>${m.independent}</b> independent · <b>${m.coached}</b> with help · <b>${m.shown}</b> shown · ${m.open} open</p>` +
        (m.mixups.length ? `<p>Mix-ups: ${m.mixups.map((x) => esc(x.label)).join("; ")}</p>` : "") +
        `<p class="sg-tv-next"><b>Next:</b> ${esc(m.next.teacher)}</p>`
      : "<p>Decision appears once students answer. It counts independent work only.</p>";
  };
  document.addEventListener("sg:evidence", refresh);
  refresh();

  const launch = teacherLaunchCard(config);
  const sections = [
    section(
      "Launch card",
      `<p><b>${esc(launch.variant === "challenge" ? "Challenge" : launch.variant === "support" ? "Support" : "Core")}</b> · ${esc(launch.standard)}</p>` +
        `<p>${esc(launch.goal)}</p>` +
        `<ol>${launch.arc.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>` +
        `<p>${esc(launch.challengeDepth)}</p><p>${esc(launch.optionalHelp)}</p>`,
      true,
    ),
    section(
      "Objective",
      `<p>${esc(String(config.contentObjective || ""))}</p>${config.languageObjective ? `<p><b>Language:</b> ${esc(config.languageObjective)}</p>` : ""}`,
      true,
    ),
    section("Essential question", `<p>${esc(essentialQuestion(config))}</p>`),
    section("Materials", list(materialsFor(config))),
    section("Timing", `<ol class="sg-tv-time">${timing}</ol>`),
    section("Discussion prompts", list(discussionPrompts(config, facilitation)), true),
    section(
      "Look for",
      (facilitation?.who ? `<p>${esc(facilitation.who)}</p>` : "") +
        (facilitation?.teacherMoves?.lookFor
          ? `<p><b>Look for:</b> ${esc(facilitation.teacherMoves.lookFor)}</p>`
          : "") +
        (facilitation?.teacherMoves?.ifStuck
          ? `<p><b>If stuck:</b> ${esc(facilitation.teacherMoves.ifStuck)}</p>`
          : "") +
        (talk?.listenFor ? `<p><b>During talk:</b> ${esc(talk.listenFor)}</p>` : "") +
        list(facilitation?.listenFor),
    ),
    section("Formative checks", list(FORMATIVE)),
    section("Sentence frames", list(facilitation?.frames)),
  ].filter(Boolean);
  const decisionSection = el("details", "sg-tv-sec");
  decisionSection.open = true;
  decisionSection.innerHTML = "<summary>Next-step decision</summary>";
  decisionSection.appendChild(decision);
  const inner = el("div", "sg-tv-scroll");
  inner.append(...sections, decisionSection);
  for (const n of nodes) {
    if (!n) continue;
    n.classList.add("sg-tv-embed");
    inner.appendChild(n);
  }
  panel.append(head, inner);

  const toggle = (open) => {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) panel.querySelector("h2")?.focus?.();
  };
  button.addEventListener("click", () => toggle(panel.hidden));
  close.addEventListener("click", () => {
    toggle(false);
    button.focus();
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      toggle(false);
      button.focus();
    }
  });
  root.append(button, panel);
  document.body.appendChild(root);
  return root;
}

export const TEACHER_VIEW_CSS = `
.sg-tv{position:fixed;inset-block-end:16px;inset-inline-start:190px;z-index:90;display:grid;gap:8px;justify-items:start}
.sg-tv-btn{min-height:48px;padding:10px 18px;border-radius:999px;border:2px solid var(--sg-navy,#0b2540);background:#fff;color:var(--sg-navy,#0b2540);font:700 15px var(--sg-display,inherit);cursor:pointer;box-shadow:0 2px 6px -2px rgba(11,37,64,.3)}
.sg-tv-btn:focus-visible,.sg-tv-close:focus-visible{outline:3px solid #1f5fd6;outline-offset:2px}
.sg-tv-panel{position:fixed;inset-block:64px 0;inset-inline-start:0;width:min(440px,100vw);display:grid;grid-template-rows:auto 1fr;background:#fff;border-inline-end:3px solid var(--sg-navy,#0b2540);box-shadow:8px 0 18px -10px rgba(11,37,64,.4)}
.sg-tv-panel[hidden]{display:none!important}
.sg-tv-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:linear-gradient(135deg,#1f5fd6,#0b2540);color:#fff}
.sg-tv-head h2{margin:0;font-size:20px;flex:1}
.sg-tv-head p{margin:0;font-size:14px;opacity:.9}
.sg-tv-scroll{overflow:auto;padding:8px 16px 80px}
.sg-tv-sec{border-bottom:1px solid var(--sg-line,#d7e2ed);padding:8px 0}
.sg-tv-sec summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700;color:var(--sg-navy,#0b2540)}
.sg-tv-body ul,.sg-tv-body ol{margin:0;padding-left:20px;display:grid;gap:4px}
.sg-tv-next{margin-top:8px;padding:10px 12px;border-radius:8px;background:var(--sg-soft,#eaf0f7)}
.sg-tv-embed{margin:12px 0}
@media print{.sg-tv{display:none!important}}
`;

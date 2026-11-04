// Practice destination: one dominant next step, then the other ways to practice.
import { realityHref } from "./reality/entry.js";
import { labHome } from "./reality/lab/lab-entry.js";

// Each gateway carries a small mathematical drawing (aria-hidden: the title and sentence say everything).
const ART = {
  daily: '<svg viewBox="0 0 48 48"><g class="ph-a">' + Array.from({ length: 10 }, (_, i) => `<circle cx="${9 + (i % 5) * 7.5}" cy="${i < 5 ? 17 : 31}" r="3"${i < 7 ? "" : ' class="ph-off"'}/>`).join("") + "</g></svg>",
  checkup: '<svg viewBox="0 0 48 48"><path class="ph-l" d="M6 34h36M10 30v8M24 30v8M38 30v8"/><path class="ph-a-s" d="M14 18l7 7 14-14"/></svg>',
  mistakes: '<svg viewBox="0 0 48 48"><path class="ph-l" d="M24 10v26M14 38h20"/><path class="ph-a-s" d="M8 18l32-6"/><circle class="ph-a" cx="12" cy="26" r="5"/><circle class="ph-b" cx="38" cy="20" r="5"/></svg>',
  skills: '<svg viewBox="0 0 48 48"><g class="ph-a">' + [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${8 + c * 12}" y="${8 + r * 12}" width="9" height="9" rx="2"${(r + c) % 2 ? ' class="ph-b"' : ""}/>`)).join("") + "</g></svg>",
  lab: '<svg viewBox="0 0 48 48"><rect class="ph-l-f" x="6" y="14" width="36" height="10" rx="2"/><rect class="ph-a" x="6" y="14" width="27" height="10" rx="2"/><path class="ph-l" d="M15 14v10M24 14v10M33 14v10"/><path class="ph-l" d="M6 34h36M6 31v6M24 31v6M42 31v6"/></svg>',
  reality: '<svg viewBox="0 0 48 48"><rect class="ph-a" x="5" y="11" width="38" height="26" rx="3"/><path class="ph-l-w" d="M24 11v26M5 24h38"/><circle class="ph-l-w-f" cx="24" cy="24" r="5"/></svg>',
};

export function renderPracticeHub(host, { resume, openMistakes, grade, t }) {
  const art = (kind) => `<i class="ph-art" aria-hidden="true">${ART[kind]}</i>`;
  const card = (attr, title, body, primary, kind) =>
    `<button type="button" class="${primary ? "primary-action" : "outline-action"} practice-hub-card" data-gateway="${kind}" ${attr}>${art(kind)}<strong>${title}</strong><span>${body}</span></button>`;
  const link = (href, title, body, kind) =>
    `<a class="outline-action practice-hub-card" data-gateway="${kind}" href="${href}">${art(kind)}<strong>${title}</strong><span>${body}</span></a>`;
  const daily = card("data-start-daily", t("Today's 10"), t("Ten questions picked from what you need next."), !resume, "daily");
  const resumeCard = resume
    ? card("data-resume-practice", t("Keep going"), t("Pick up {title} where you left off.", { title: resume.title }), true, "daily")
    : "";
  const checkup = card("data-start-checkup", t("Quick check-up"), t("A short set that shows what to practice next."), false, "checkup");
  const mistakes = card(
    'data-view="notebook"',
    t("Fix my mistakes"),
    openMistakes ? t("{n} to look at again.", { n: openMistakes }) : t("Nothing to fix right now."),
    false,
    "mistakes",
  );
  const skills = card('data-view="library"', t("Choose a skill"), t("Browse every skill for your grade."), false, "skills");
  const reality = link(realityHref(grade), t("Build it in Math Reality"), t("Try the same ideas in a world you build."), "reality");
  const lab = link(labHome(grade), t("Build it with models"), t("Cut, balance, scale and repair: the math answers back."), "lab");
  host.innerHTML = `<h2 class="practice-hub-title">${t("Practice")}</h2><div class="practice-hub-grid">${resumeCard}${daily}${checkup}${mistakes}${skills}${lab}${reality}</div>`;
}

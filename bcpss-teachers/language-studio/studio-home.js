// Language Studio Player — studio home: hero, up-next, activity gallery, exit ticket, printables.
import {
  LEVEL_INFO,
  announce,
  copyText,
  h,
  saveProgress,
  starSvg,
  wordCount,
} from "./studio-core.js";
import { icon } from "./studio-icons.js";
import { mentorSection, wordWall } from "./studio-words.js";

const DOMAINS = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Game"];
const FORMATS = [
  ["pdf", "PDF"],
  ["docx", "Word"],
  ["html", "Web page"],
];
const RESOURCES = [
  ["book", "Student activity book", "Every activity in one printable book", "book"],
  ["cards", "Vocabulary cards", "Cut-and-keep word cards", "cards"],
  ["Vocabulary", "Word wall", "Large words for the classroom wall", "wall"],
  ["Reading", "Mentor sentence poster", "The mentor sentence, color-coded", "poster"],
  ["Writing", "Sentence strips", "Frames to build your own sentences", "strips"],
  ["Speaking", "Talk cards", "Conversation cards for partners", "talk"],
  ["Game", "Vocabulary bingo", "A bingo set for the unit words", "bingo"],
  ["check", "Answer key", "Check your work after you finish", "key"],
];

const exportUrl = (unitId, format, part) =>
  `/api/bcpss/export/${encodeURIComponent(unitId)}?format=${format}&part=${part}`;

function ring(done, total) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("class", "sh-ring");
  svg.setAttribute("aria-hidden", "true");
  for (const [cls, len] of [
    ["sh-ring__track", c],
    ["sh-ring__bar", c * (done / total)],
  ]) {
    const circle = document.createElementNS(ns, "circle");
    Object.entries({ cx: 32, cy: 32, r, class: cls, "stroke-dasharray": `${len} ${c}` }).forEach(
      ([k, v]) => circle.setAttribute(k, String(v)),
    );
    svg.append(circle);
  }
  return svg;
}

function hero(app, nextIdx) {
  const { unit, studio, progress } = app;
  const all = studio.activities;
  const acts = all.filter((_, i) => app.allowed(i + 1));
  const done = acts.filter((a) => progress.stars[all.indexOf(a) + 1]).length;
  const totalStars = acts.reduce((n, a) => n + (progress.stars[all.indexOf(a) + 1] || 0), 0);
  const next = nextIdx ? all[nextIdx - 1] : null;
  const can = (text, label) =>
    h(
      "li",
      { class: "sh-can" },
      h("span", { class: "sh-can__tick" }, icon("check", 16)),
      h("span", null, h("b", null, label), text),
    );
  return h(
    "header",
    { class: "sh-hero" },
    h(
      "div",
      { class: "sh-hero__main" },
      h(
        "p",
        { class: "sh-hero__chips" },
        h("span", { class: "st-tag sh-chip-curr" }, unit.curriculum_name),
        h("span", { class: "st-tag" }, `Grade ${unit.grade}`),
        h("span", { class: "st-tag" }, unit.subject),
      ),
      h("h1", null, unit.unit_title),
      h("p", { class: "sh-bigq" }, h("span", null, "Big question"), studio.essential_question),
      h(
        "ul",
        { class: "sh-cans", "aria-label": "I can statements" },
        can(studio.can_do.content.replace(/^I can\s+/i, ""), "I can "),
        can(studio.can_do.language.replace(/^I can\s+/i, ""), "I can "),
      ),
    ),
    h(
      "aside",
      { class: "sh-next", "aria-label": "Your progress" },
      h(
        "div",
        { class: "sh-next__ring" },
        ring(done, acts.length),
        h("span", { class: "sh-next__num" }, `${done}/${acts.length}`),
      ),
      h(
        "div",
        { class: "sh-next__text" },
        h(
          "p",
          { class: "sh-next__label" },
          done ? `${done} of ${acts.length} done · ${totalStars} stars` : "Ready when you are",
        ),
        next
          ? h("p", { class: "sh-next__title" }, `Up next: ${next.title}`)
          : h(
              "p",
              { class: "sh-next__title" },
              app.family ? "All activities complete. Great practice!" : "All activities complete. Finish with the exit ticket!",
            ),
      ),
      next
        ? h(
            "button",
            {
              type: "button",
              class: "st-btn st-btn--primary st-btn--lg sh-next__go",
              onclick: () => app.go(nextIdx),
            },
            done ? "Continue" : "Start",
            icon("arrow", 20),
          )
        : h(
            "a",
            { class: "st-btn st-btn--primary st-btn--lg sh-next__go", href: app.family ? "#activities" : "#exit" },
            app.family ? "Play again" : "Exit ticket",
            icon("arrow", 20),
          ),
    ),
  );
}

function activityCard(app, act, i, isNext, shownNo) {
  const index = i + 1;
  const earned = app.progress.stars[index] || 0;
  const meta = (name, text) => h("span", { class: "sh-meta" }, icon(name, 16), text);
  return h(
    "article",
    {
      class: `sh-act${isNext ? " is-next" : ""}`,
      "data-domain": act.domain,
      "data-done": earned ? "1" : null,
    },
    h(
      "div",
      { class: "sh-act__top" },
      h("span", { class: "sh-act__icon" }, icon(act.domain, 24)),
      h("span", { class: "st-tag", "data-domain": act.domain }, act.domain),
      isNext ? h("span", { class: "sh-act__badge" }, "Up next") : null,
      h("span", { class: "sh-act__num", "aria-hidden": "true" }, String(shownNo).padStart(2, "0")),
    ),
    h("h3", null, act.title),
    h("p", { class: "sh-act__mission" }, act.mission),
    h(
      "p",
      { class: "sh-act__meta" },
      meta("clock", `${act.minutes} min`),
      meta("people", act.grouping),
    ),
    h(
      "div",
      { class: "sh-act__foot" },
      h(
        "span",
        { class: "st-stars sh-act__stars", role: "img", "aria-label": `${earned} of 3 stars` },
        [1, 2, 3].map((n) => starSvg(n <= earned)),
      ),
      h(
        "button",
        {
          type: "button",
          class: `st-btn ${isNext ? "st-btn--primary" : ""}`,
          "aria-label": `${earned ? "Play again" : "Start"}: ${act.title}`,
          onclick: () => app.go(index),
        },
        earned ? "Play again" : "Start",
        icon(earned ? "flip" : "play", 16, { filled: !earned }),
      ),
    ),
    app.family
      ? null
      : h(
      "div",
      { class: "sh-act__extras" },
      act.tip
        ? h(
            "details",
            { class: "st-tip" },
            h("summary", null, "Teacher tip"),
            h("p", null, act.tip),
          )
        : null,
      h(
        "a",
        {
          class: "sh-act__print",
          href: exportUrl(app.unitId, "pdf", `activity-${index}`),
          target: "_blank",
          rel: "noopener",
        },
        icon("print", 16),
        "Print",
      ),
    ),
  );
}

function gallery(app, nextIdx) {
  const acts = app.studio.activities.filter((_, i) => app.allowed(i + 1));
  const counts = Object.fromEntries(
    DOMAINS.map((d) => [d, acts.filter((a) => a.domain === d).length]),
  );
  let filter = "All";
  const grid = h("div", { class: "sh-gallery", id: "shGallery" });
  const paint = () => {
    grid.replaceChildren(
      ...acts.map((a) => {
        const i = app.studio.activities.indexOf(a);
        return filter === "All" || a.domain === filter
          ? activityCard(app, a, i, i + 1 === nextIdx, acts.indexOf(a) + 1)
          : null;
      }),
    );
  };
  const chips = ["All", ...DOMAINS.filter((d) => counts[d])].map((d) => {
    const btn = h(
      "button",
      {
        type: "button",
        class: "st-chip sh-filter",
        "aria-pressed": String(d === filter),
        "data-domain": d === "All" ? null : d,
      },
      d === "All" ? null : icon(d, 16),
      `${d} (${d === "All" ? acts.length : counts[d]})`,
    );
    btn.addEventListener("click", () => {
      filter = d;
      for (const c of chips) c.setAttribute("aria-pressed", String(c === btn));
      paint();
      announce(`${grid.children.length} activities shown.`);
    });
    return btn;
  });
  paint();
  return h(
    "section",
    { class: "sh-section", id: "activities", "aria-labelledby": "shActH" },
    h(
      "div",
      { class: "sh-sechead" },
      h("p", { class: "sh-eyebrow" }, "Step 3"),
      h("h2", { id: "shActH" }, "Activities"),
      h(
        "p",
        { class: "sh-sub" },
        "Pick any activity, or tap Start to go in order. Earn up to three stars on each.",
      ),
    ),
    h(
      "div",
      { class: "sh-filters", role: "group", "aria-label": "Filter activities by skill" },
      chips,
    ),
    grid,
  );
}

function exitTicket(app) {
  const e = app.studio.exit_ticket;
  const area = h("textarea", {
    class: "sh-exit__area",
    rows: "4",
    "aria-label": "Your exit ticket answer",
    placeholder: "Write your answer here…",
  });
  area.value = app.progress.exit || "";
  const count = h("span", { class: "sh-exit__count" });
  const model = h(
    "div",
    { class: "sh-exit__model", hidden: true },
    h("p", { class: "sh-eyebrow" }, "One strong answer"),
    h("p", null, e.model),
  );
  const showBtn = h(
    "button",
    { type: "button", class: "st-btn", disabled: true },
    icon("eye", 18),
    "Show a strong answer",
  );
  const copyBtn = h("button", { type: "button", class: "st-btn st-btn--ghost" }, "Copy my answer");
  const hint = h("p", { class: "sh-exit__hint" });
  const refresh = () => {
    const n = wordCount(area.value);
    count.textContent = `${n} word${n === 1 ? "" : "s"}`;
    showBtn.disabled = n < 10;
    hint.textContent =
      n < 10 ? "Write at least 10 words to unlock a strong answer to compare with." : "";
    saveProgress(app.unitId, { exit: area.value });
  };
  area.addEventListener("input", refresh);
  showBtn.addEventListener("click", () => {
    model.hidden = !model.hidden;
    showBtn.lastChild.textContent = model.hidden
      ? "Show a strong answer"
      : "Hide the strong answer";
  });
  copyBtn.addEventListener("click", async () => {
    announce(
      (await copyText(area.value)) ? "Copied." : "Copy did not work. Select the text and copy it.",
    );
  });
  refresh();
  return h(
    "section",
    { class: "sh-section", id: "exit", "aria-labelledby": "shExitH" },
    h(
      "div",
      { class: "sh-sechead" },
      h("p", { class: "sh-eyebrow" }, "Step 4"),
      h("h2", { id: "shExitH" }, "Exit ticket"),
    ),
    h(
      "div",
      { class: "sh-exit st-card" },
      h("p", { class: "sh-exit__prompt" }, e.prompt),
      h("p", { class: "sh-exit__frame" }, h("span", null, "Try this frame"), e.frame),
      area,
      h("div", { class: "sh-exit__bar" }, count, copyBtn, showBtn),
      hint,
      model,
    ),
  );
}

function resources(app) {
  const rows = RESOURCES.map(([ic, name, desc, part]) =>
    h(
      "li",
      { class: "sh-res" },
      h("span", { class: "sh-res__icon" }, icon(ic, 22)),
      h("span", { class: "sh-res__text" }, h("b", null, name), h("span", null, desc)),
      h(
        "span",
        { class: "sh-res__links" },
        FORMATS.map(([f, label]) =>
          h(
            "a",
            {
              class: "st-btn st-btn--sm",
              href: exportUrl(app.unitId, f, part),
              target: "_blank",
              rel: "noopener",
              "aria-label": `${name}, ${label}`,
            },
            label,
          ),
        ),
      ),
    ),
  );
  return h(
    "section",
    { class: "sh-section", id: "printables", "aria-labelledby": "shResH" },
    h(
      "div",
      { class: "sh-sechead" },
      h("p", { class: "sh-eyebrow" }, "Take it with you"),
      h("h2", { id: "shResH" }, "Resources and printables"),
    ),
    h("ul", { class: "sh-reslist st-card" }, rows),
  );
}

export function renderHome(root, app) {
  const acts = app.studio.activities;
  const nextIdx = acts.findIndex((_, i) => app.allowed(i + 1) && !app.progress.stars[i + 1]) + 1;
  const levelName = LEVEL_INFO[app.level].name;
  root.replaceChildren(
    h(
      "div",
      { class: "sh st-view" },
      hero(app, nextIdx),
      wordWall(app.studio, app.band),
      mentorSection(app.studio, app.level, levelName),
      gallery(app, nextIdx),
      app.family ? null : exitTicket(app),
      app.family ? null : resources(app),
    ),
  );
}

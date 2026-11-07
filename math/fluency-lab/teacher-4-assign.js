// Teacher tools 4.0, Assignments tab: build a differentiated assignment (support level, difficulty tiers, problem
// count, mastery target, deadline), share it as a link, short link or QR, and manage the list made on this device.
import { accessSummary, cleanAccess } from "./accommodations.js";
import { encodeShortCode } from "./assignment-codec.js";
import {
  addAssignment,
  duplicateAssignment,
  loadAssignments,
  removeAssignment,
  saveAssignments,
  setRetired,
  updateAssignment,
} from "./assignment-store.js";
import { classStatus, dueStatus } from "./assignment-targets.js";
import { t } from "./i18n.js";
import { ALL_SKILLS, GRADES } from "./problem-bank.js";
import {
  assignmentUrl,
  localQrMarkup,
  printablePacket,
  validateAssignment,
} from "./school-tools.js";
import { localDay } from "./tutor-engine.js";
import { esc } from "./reports-export.js";

const COUNTS = [5, 10, 15, 20];
const TIER_NAMES = () => [
  t("Concrete visual foundations"),
  t("Foundational application"),
  t("Grade-level proficiency"),
  t("Multi-step reasoning"),
  t("Advanced transfer and challenge"),
];
const blank = (grade) => ({
  id: null,
  label: "",
  grade,
  keys: [],
  count: 10,
  mode: "adaptive",
  lang: "en",
  tierLow: 1,
  tierHigh: 5,
  target: false,
  score: 80,
  days: 2,
  due: "",
  access: {},
  audioFirst: false,
  example: "",
});

export const shortLink = (assignment) => {
  const code = encodeShortCode(assignment);
  if (!code) return { code: null, href: null };
  const url = new URL(assignmentUrl(assignment));
  url.hash = `assignment=${code}`;
  return { code, href: url.href };
};

const draftOf = (entry) => ({
  id: entry.id,
  label: entry.assignment.label === "Class practice" ? "" : entry.assignment.label,
  grade: entry.assignment.grade,
  keys: [...entry.assignment.keys],
  count: entry.assignment.count,
  mode: entry.assignment.mode,
  lang: entry.assignment.lang || "en",
  tierLow: entry.assignment.tiers?.[0] ?? 1,
  tierHigh: entry.assignment.tiers?.[1] ?? 5,
  target: Boolean(entry.assignment.target),
  score: entry.assignment.target?.score ?? 80,
  days: entry.assignment.target?.days ?? 2,
  due: entry.assignment.due || "",
  access: { ...(entry.assignment.access || {}) },
  audioFirst: entry.assignment.audioFirst === true,
  example: entry.assignment.example || "",
});

export function assignmentFromDraft(draft) {
  const full = draft.tierLow === 1 && draft.tierHigh === 5;
  return validateAssignment({
    version: 1,
    grade: draft.grade,
    keys: draft.keys,
    count: draft.count,
    mode: draft.mode,
    challenge: "adaptive",
    lang: draft.lang,
    label: draft.label.trim() || "Class practice",
    ...(full ? {} : { tiers: [draft.tierLow, draft.tierHigh] }),
    ...(draft.target ? { target: { score: draft.score, days: draft.days } } : {}),
    ...(draft.due ? { due: draft.due } : {}),
    ...(cleanAccess(draft.access) ? { access: cleanAccess(draft.access) } : {}),
    ...(draft.audioFirst ? { audioFirst: true } : {}),
    ...(draft.example ? { example: draft.example } : {}),
  });
}

function formHtml(draft, error) {
  const skills = ALL_SKILLS.filter((skill) => skill.grade === draft.grade);
  const tiers = TIER_NAMES();
  const tierOptions = (selected) =>
    tiers
      .map(
        (name, index) =>
          `<option value="${index + 1}" ${selected === index + 1 ? "selected" : ""}>${index + 1} · ${esc(name)}</option>`,
      )
      .join("");
  return `<form class="t4-form" data-t4-form novalidate>
    <h3>${esc(draft.id ? t("Edit assignment") : t("New assignment"))}</h3>
    <label>${esc(t("Title"))}<input name="label" maxlength="80" value="${esc(draft.label)}" placeholder="${esc(t("Class practice"))}" autocomplete="off"></label>
    <div class="t4-row"><label>${esc(t("Grade"))}<select name="grade">${GRADES.map((g) => `<option value="${g.grade}" ${g.grade === draft.grade ? "selected" : ""}>${esc(g.label)}</option>`).join("")}</select></label>
      <label>${esc(t("Problems per visit"))}<select name="count">${COUNTS.map((n) => `<option ${n === draft.count ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>
    <fieldset class="t4-skills"><legend>${esc(t("Skills (up to 10)"))}</legend>${skills.map((skill) => `<label class="t4-check"><input type="checkbox" name="skill" value="${skill.grade}:${skill.id}" ${draft.keys.includes(`${skill.grade}:${skill.id}`) ? "checked" : ""}><span>${esc(skill.title)}<small>${esc(skill.standard)}</small></span></label>`).join("")}</fieldset>
    <label>${esc(t("Support level"))}<select name="mode"><option value="adaptive" ${draft.mode === "adaptive" ? "selected" : ""}>${esc(t("Adaptive: help when needed"))}</option><option value="guided" ${draft.mode === "guided" ? "selected" : ""}>${esc(t("Coached: strategy steps always open"))}</option></select></label>
    <div class="t4-row"><label>${esc(t("Easiest tier"))}<select name="tierLow">${tierOptions(draft.tierLow)}</select></label><label>${esc(t("Hardest tier"))}<select name="tierHigh">${tierOptions(draft.tierHigh)}</select></label></div>
    <label>${esc(t("Language"))}<select name="lang"><option value="en" ${draft.lang === "en" ? "selected" : ""}>English</option><option value="es" ${draft.lang === "es" ? "selected" : ""}>Español</option></select></label>
    <fieldset class="t4-target"><legend>${esc(t("Mastery target and deadline"))}</legend>
      <label class="t4-check"><input type="checkbox" name="target" ${draft.target ? "checked" : ""}><span>${esc(t("Set a mastery target"))}</span></label>
      <div class="t4-row"><label>${esc(t("Reach a score of"))}<input name="score" type="number" min="50" max="100" step="5" value="${draft.score}" ${draft.target ? "" : "disabled"}></label>
        <label>${esc(t("on this many separate days"))}<input name="days" type="number" min="1" max="10" value="${draft.days}" ${draft.target ? "" : "disabled"}></label></div>
      <p class="t4-hint">${esc(t("Only first-try answers at grade level or above count. Hints and picture-first work do not."))}</p>
      <label>${esc(t("Due date (optional)"))}<input name="due" type="date" min="${localDay()}" value="${esc(draft.due)}"></label></fieldset>
    ${accessFieldset(draft.access || {})}
    ${supportFieldset(draft)}
    <p class="t4-error" role="alert">${esc(error)}</p>
    <div class="t4-actions"><button type="submit" class="fl-btn fl-btn--teal">${esc(draft.id ? t("Update assignment") : t("Save assignment"))}</button>${draft.id ? `<button type="button" class="fl-btn fl-btn--ghost" data-t4-cancel>${esc(t("Cancel"))}</button>` : ""}</div>
  </form>`;
}

// The accommodation profile travels in the link and applies only while the learner works on this assignment.
function accessFieldset(access) {
  const box = (name, label) =>
    `<label class="t4-check"><input type="checkbox" name="${name}" ${access[name.slice(7)] ? "checked" : ""}><span>${esc(label)}</span></label>`;
  return `<fieldset class="t4-target" data-t4-access><legend>${esc(t("Accommodations for this assignment"))}</legend>
      ${box("access-read", t("Read each problem aloud"))}${box("access-es", t("Show each problem in Spanish too"))}${box("access-focus", t("Focus view"))}${box("access-calc", t("Calculator available"))}
      <label>${esc(t("Answer choices on multiple-choice problems"))}<select name="access-mc"><option value="">${esc(t("All choices"))}</option><option value="3" ${access.mc === 3 ? "selected" : ""}>3</option><option value="2" ${access.mc === 2 ? "selected" : ""}>2</option></select></label>
      <p class="t4-hint">${esc(t("These apply only during this assignment and never change how answers are checked. An assignment with accommodations is shared by link, not class code."))}</p></fieldset>`;
}

// Audio-first and the worked-example policy travel in the link, like the accommodation profile.
function supportFieldset(draft) {
  const option = (value, label) =>
    `<option value="${value}" ${draft.example === value ? "selected" : ""}>${esc(label)}</option>`;
  return `<fieldset class="t4-target" data-t4-support><legend>${esc(t("Listening and worked examples"))}</legend>
      <label class="t4-check"><input type="checkbox" name="audioFirst" ${draft.audioFirst ? "checked" : ""}><span>${esc(t("Audio first: each problem is read aloud before the learner answers"))}</span></label>
      <label>${esc(t("Worked example"))}<select name="example">${option("", t("Offered when a learner needs support"))}${option("after", t("Only after a learner's first answer"))}${option("hide", t("Never offered"))}</select></label>
      <p class="t4-hint">${esc(t("Reports show how many answers came after a learner opened a worked example. Audio first and example settings are shared by link, not class code."))}</p></fieldset>`;
}

function shareHtml(entry) {
  const { assignment } = entry;
  const full = assignmentUrl(assignment);
  const short = shortLink(assignment);
  const qr = localQrMarkup(short.href || full, { label: t("Assignment QR code") });
  const field = (id, label, value) =>
    `<label>${esc(label)}<span class="t4-copy"><input id="${id}" readonly value="${esc(value)}"><button type="button" class="fl-btn fl-btn--ghost" data-t4-copy="${id}">${esc(t("Copy"))}</button></span></label>`;
  return `<section class="t4-share" aria-labelledby="t4-share-title"><h3 id="t4-share-title">${esc(assignment.label)}</h3>
    <p>${esc(t("Saved on this device. Share a link or code through your classroom system."))}</p>
    ${short.href ? field("t4-short", t("Short link"), short.href) : ""}${short.code ? field("t4-code", t("Class code"), short.code) : ""}${field("t4-full", t("Full link (carries the title)"), full)}
    ${short.code ? `<p class="t4-hint">${esc(t("A class code names the skills and settings. It does not carry the title. Learners open the short link, or add #assignment=CODE after the lab address."))}</p>` : `<p class="t4-hint">${esc(t("This assignment has a game or too many settings for a class code. Use the full link."))}</p>`}
    <div class="t4-actions"><button type="button" class="fl-btn" data-t4-try="${esc(entry.id)}">${esc(t("Try this assignment"))}</button><button type="button" class="fl-btn fl-btn--ghost" data-t4-qr>${esc(t("Show QR code"))}</button><button type="button" class="fl-btn fl-btn--ghost" data-t4-packet="${esc(entry.id)}">${esc(t("Print a five-day packet"))}</button></div>
    <div class="t4-qr" data-t4-qrbox hidden>${qr ? `<div class="fluency-local-qr">${qr}</div>` : `<p role="status">${esc(t("This link is too long for a local QR code. Use a class code or choose fewer skills."))}</p>`}</div></section>`;
}

const statusWord = () => ({
  met: t("Met"),
  "in-progress": t("In progress"),
  "not-started": t("Not started"),
  overdue: t("Overdue"),
});

function summaryLine(assignment) {
  const bits = [
    t("Grade {n}", { n: assignment.grade }),
    t("{n} skills", { n: assignment.keys.length }),
    t("{n} problems", { n: assignment.count }),
    assignment.mode === "guided" ? t("Coached") : t("Adaptive"),
  ];
  if (assignment.tiers)
    bits.push(t("Tiers {a} to {b}", { a: assignment.tiers[0], b: assignment.tiers[1] }));
  bits.push(...accessSummary(assignment.access));
  if (assignment.audioFirst) bits.push(t("Audio first"));
  if (assignment.example)
    bits.push(assignment.example === "hide" ? t("No worked example") : t("Example after first answer"));
  if (assignment.target)
    bits.push(
      t("Target: score {score}, {days} days", {
        score: assignment.target.score,
        days: assignment.target.days,
      }),
    );
  return bits.join(" · ");
}

function dueChip(assignment, now) {
  const due = dueStatus(assignment.due, now);
  if (due.state === "none") return "";
  const text = {
    upcoming: t("Due {date}", { date: assignment.due }),
    today: t("Due today"),
    overdue: t("Past due {date}", { date: assignment.due }),
  }[due.state];
  return `<span class="t4-chip t4-chip--${due.state}">${esc(text)}</span>`;
}

function progressHtml(entry, learners, now) {
  if (!learners.length)
    return `<p class="t4-hint">${esc(t("Open learner files in Class insights to see progress here."))}</p>`;
  const since = new Date(entry.createdAt).setHours(0, 0, 0, 0);
  const status = classStatus(entry.assignment, learners, { now, since });
  const words = statusWord();
  const key = (row) => {
    const views = row.rows.reduce((sum, r) => sum + r.exampleViews, 0);
    const base = row.rows.map((r) => `${r.score ?? "-"}/${r.days}`).join(", ");
    return views ? `${base} · ${t("Opened a worked example on {n} answers", { n: views })}` : base;
  };
  return `<p>${esc(t("{met} met, {progress} in progress, {none} not started, {late} overdue.", { met: status.counts.met, progress: status.counts["in-progress"], none: status.counts["not-started"], late: status.counts.overdue }))}</p>
    <table class="t4-table"><caption class="t4-sr">${esc(t("Progress on this assignment"))}</caption><thead><tr><th scope="col">${esc(t("Learner"))}</th><th scope="col">${esc(t("Status"))}</th><th scope="col">${esc(t("Score / independent days per skill"))}</th></tr></thead><tbody>${status.rows.map((row) => `<tr><th scope="row">${esc(row.label)}</th><td><span class="t4-chip t4-chip--${row.status}">${esc(words[row.status])}</span></td><td>${esc(key(row))}</td></tr>`).join("")}</tbody></table>`;
}

function listHtml(items, learners, now) {
  if (!items.length)
    return `<p class="t4-empty" role="status">${esc(t("No assignments yet. Save one and it will appear here."))}</p>`;
  return `<ul class="t4-list">${items
    .map((entry) => {
      const { assignment } = entry;
      return `<li class="t4-item ${entry.retired ? "is-retired" : ""}" data-id="${esc(entry.id)}"><div class="t4-item-head"><h4>${esc(assignment.label)}</h4>${entry.retired ? `<span class="t4-chip t4-chip--retired">${esc(t("Retired"))}</span>` : dueChip(assignment, now)}</div>
      <p>${esc(summaryLine(assignment))}</p>
      <div class="t4-actions"><button type="button" class="fl-btn fl-btn--ghost" data-t4-edit="${esc(entry.id)}">${esc(t("Edit"))}</button><button type="button" class="fl-btn fl-btn--ghost" data-t4-dup="${esc(entry.id)}">${esc(t("Duplicate"))}</button><button type="button" class="fl-btn fl-btn--ghost" data-t4-share="${esc(entry.id)}">${esc(t("Link and code"))}</button><button type="button" class="fl-btn fl-btn--ghost" data-t4-retire="${esc(entry.id)}">${esc(entry.retired ? t("Restore") : t("Retire"))}</button>${entry.retired ? `<button type="button" class="fl-btn fl-btn--ghost" data-t4-delete="${esc(entry.id)}">${esc(t("Delete"))}</button>` : ""}</div>
      <details><summary>${esc(t("Class progress"))}</summary>${progressHtml(entry, learners, now)}</details></li>`;
    })
    .join("")}</ul>`;
}

export function mountAssignments(
  host,
  { grade, getLearners, onLaunch, onPrint, announce, registerPrefill },
) {
  let items = loadAssignments();
  let draft = blank(grade);
  let error = "";
  let sharing = null;
  const find = (id) => items.find((entry) => entry.id === id);
  const persist = (next) => {
    items = next;
    saveAssignments(items);
  };

  const render = () => {
    const now = Date.now();
    host.innerHTML = `<div class="t4-split"><div>${formHtml(draft, error)}<div data-t4-share-host>${sharing && find(sharing) ? shareHtml(find(sharing)) : ""}</div></div>
      <div><h3>${esc(t("Assignments made on this device"))}</h3><p class="t4-hint">${esc(t("This list lives only in this browser. Copy a link or code to share an assignment; there is no central list."))}</p>${listHtml(items, getLearners(), now)}</div></div>`;
  };
  const capture = () => {
    const form = host.querySelector("[data-t4-form]");
    if (!form) return;
    const data = new FormData(form);
    const number = (name, fallback) =>
      Number.isFinite(Number(data.get(name))) && data.get(name) !== ""
        ? Number(data.get(name))
        : fallback;
    draft = {
      ...draft,
      label: String(data.get("label") ?? ""),
      grade: number("grade", draft.grade),
      count: number("count", 10),
      mode: data.get("mode") === "guided" ? "guided" : "adaptive",
      lang: data.get("lang") === "es" ? "es" : "en",
      keys: data.getAll("skill").map(String),
      tierLow: number("tierLow", 1),
      tierHigh: number("tierHigh", 5),
      target: data.get("target") === "on",
      score: number("score", 80),
      days: number("days", 2),
      due: String(data.get("due") ?? ""),
      audioFirst: data.get("audioFirst") === "on",
      example: ["after", "hide"].includes(String(data.get("example"))) ? String(data.get("example")) : "",
      access: {
        read: data.get("access-read") === "on",
        es: data.get("access-es") === "on",
        focus: data.get("access-focus") === "on",
        calc: data.get("access-calc") === "on",
        ...(["2", "3"].includes(String(data.get("access-mc"))) ? { mc: Number(data.get("access-mc")) } : {}),
      },
    };
  };
  // Another part of the studio can load a suggested practice plan (for example "Add to assignment" on a reteach card).
  registerPrefill?.((plan) => {
    draft = {
      ...blank(plan.grade),
      grade: plan.grade,
      keys: [...plan.keys],
      count: plan.count,
      mode: plan.mode,
      tierLow: plan.tiers[0],
      tierHigh: plan.tiers[1],
      target: Boolean(plan.target),
      score: plan.target?.score ?? 80,
      days: plan.target?.days ?? 2,
      label: plan.label || "",
    };
    error = "";
    render();
    host.querySelector("[name=label]")?.focus();
    announce?.(t("Suggested practice added to the assignment form."));
  });

  host.addEventListener("change", (event) => {
    capture();
    if (event.target.name === "grade") {
      draft.keys = [];
      render();
    } else if (event.target.name === "target") render();
    else if (event.target.name === "tierLow" || event.target.name === "tierHigh") {
      if (draft.tierLow > draft.tierHigh) {
        if (event.target.name === "tierLow") draft.tierHigh = draft.tierLow;
        else draft.tierLow = draft.tierHigh;
        render();
      }
    }
  });
  host.addEventListener("submit", (event) => {
    event.preventDefault();
    capture();
    const assignment = assignmentFromDraft(draft);
    if (!draft.keys.length) {
      error = t("Choose at least one skill.");
      render();
      return;
    }
    if (draft.keys.length > 10) {
      error = t("Choose up to 10 skills.");
      render();
      return;
    }
    if (!assignment) {
      error = t("Check the settings and try again.");
      render();
      return;
    }
    if (
      draft.target &&
      !(draft.score >= 50 && draft.score <= 100 && draft.days >= 1 && draft.days <= 10)
    ) {
      error = t("A target needs a score from 50 to 100 and 1 to 10 days.");
      render();
      return;
    }
    if (draft.due && !assignment.due) {
      error = t("Choose a real due date.");
      render();
      return;
    }
    error = "";
    if (draft.id && find(draft.id)) {
      persist(updateAssignment(items, draft.id, assignment));
      sharing = draft.id;
    } else {
      persist(addAssignment(items, assignment));
      sharing = items[0].id;
    }
    draft = blank(draft.grade);
    render();
    announce?.(t("Assignment saved on this device."));
    host.querySelector("#t4-share-title")?.scrollIntoView({ block: "nearest" });
  });
  host.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    const id = (name) => target.dataset[name];
    if (target.dataset.t4Cancel !== undefined) {
      draft = blank(draft.grade);
      error = "";
      render();
    } else if (id("t4Edit")) {
      draft = draftOf(find(id("t4Edit")));
      error = "";
      render();
      host.querySelector("[name=label]")?.focus();
    } else if (id("t4Dup")) {
      persist(duplicateAssignment(items, id("t4Dup")));
      render();
      announce?.(t("Assignment duplicated."));
    } else if (id("t4Share")) {
      sharing = id("t4Share");
      render();
      host.querySelector("#t4-share-title")?.scrollIntoView({ block: "nearest" });
    } else if (id("t4Retire")) {
      const entry = find(id("t4Retire"));
      persist(setRetired(items, entry.id, !entry.retired));
      render();
    } else if (id("t4Delete")) {
      persist(removeAssignment(items, id("t4Delete")));
      if (sharing === id("t4Delete")) sharing = null;
      render();
      announce?.(t("Assignment deleted."));
    } else if (id("t4Try")) onLaunch?.(find(id("t4Try")).assignment);
    else if (id("t4Packet")) onPrint?.(printablePacket(find(id("t4Packet")).assignment));
    else if (target.dataset.t4Qr !== undefined) {
      const box = host.querySelector("[data-t4-qrbox]");
      box.hidden = !box.hidden;
      target.textContent = box.hidden ? t("Show QR code") : t("Hide QR code");
    } else if (id("t4Copy")) {
      const input = host.querySelector(`#${id("t4Copy")}`);
      try {
        await navigator.clipboard.writeText(input.value);
        announce?.(t("Copied."));
      } catch {
        input.focus();
        input.select();
        announce?.(t("Select the text and copy it."));
      }
    }
  });
  render();
  return { refresh: () => { capture(); render(); } };
}

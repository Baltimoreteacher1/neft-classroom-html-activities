// Weekly family digest (EN/ES), generated from the learner's synced class summary. Opened by the read-only family
// link a student copies from the My class card (class-link-view.js). It shows counts and skill names, never the
// learner's work, and nothing on it is timed or ranked. Email is not sent: the only mail binding on this project
// (FAMILY_MEETING_EMAIL_SERVICE) delivers meeting requests to the teacher alone, so families get the link instead.
import { getLang, setLang, t, translatePage } from "../i18n.js";
import { escapeHtml as esc } from "../school-tools.js";
import { skillLabel } from "./skill-label.js";

export function digestHtml(d) {
  const s = d.docs?.fluency?.summary || {};
  const mastered = s.mastered || [];
  const help = s.needsTeacher || [];
  const parts = [
    `<h2>${esc(t("{alias}'s week in {title}", { alias: d.alias, title: d.title }))}</h2>`,
    `<p>${esc(t("Practiced on {days} of the last 7 days.", { days: s.weekDays || 0 }))} ${esc(t("Answered {n} problems correctly on their own this week.", { n: s.weekIndependent || 0 }))}</p>`,
  ];
  if (s.activeSkill)
    parts.push(
      `<p>${esc(t("Working on now: {skill}", { skill: skillLabel(s.activeSkill) }))}</p>`,
    );
  parts.push(`<h3>${esc(t("Can do on their own"))}</h3>`);
  parts.push(
    mastered.length
      ? `<ul>${mastered
          .slice(0, 12)
          .map((k) => `<li>${esc(skillLabel(k))}</li>`)
          .join(
            "",
          )}</ul>${mastered.length > 12 ? `<p>${esc(t("and {n} more.", { n: mastered.length - 12 }))}</p>` : ""}`
      : `<p>${esc(t("Still building: no skill is fully mastered yet, and that is normal early on."))}</p>`,
  );
  if (help.length)
    parts.push(
      `<h3>${esc(t("The teacher is helping with"))}</h3><ul>${help.map((h) => `<li>${esc(skillLabel(h.skill))}</li>`).join("")}</ul><p>${esc(t("Please do not drill these at home. The teacher will work on them in class first."))}</p>`,
    );
  if (d.goal)
    parts.push(
      `<h3>${esc(t("Class goal"))}</h3><p>${esc(t("Class goal: {label} — {value} of {target}", { label: d.goal.label || t("skills we can do on our own"), value: d.goal.value, target: d.goal.target }))}</p>`,
    );
  parts.push(
    `<h3>${esc(t("Try at home this week"))}</h3><p>${esc(t("Ask your child to solve one problem out loud and explain each step to you. Ask: How do you know? Can you check it another way?"))}</p>`,
  );
  if (!d.docs?.fluency)
    parts.push(
      `<p>${esc(t("No practice has been synced yet this week."))}</p>`,
    );
  return parts.join("");
}

export async function loadDigest(search, fetchImpl = (...a) => fetch(...a)) {
  const q = new URLSearchParams(search);
  const url = `/api/class/digest?code=${encodeURIComponent(q.get("code") || "")}&student=${encodeURIComponent(q.get("student") || "")}&token=${encodeURIComponent(q.get("token") || "")}`;
  try {
    const res = await fetchImpl(url);
    return await res.json();
  } catch {
    return { ok: false, error: "offline" };
  }
}

if (
  typeof document !== "undefined" &&
  document.querySelector("#family-digest") &&
  !globalThis.__FLUENCY_CLASS_TEST__
) {
  const lang = new URLSearchParams(location.search).get("lang");
  if (lang) setLang(lang, { persist: false });
  translatePage();
  document.querySelector("#fd-lang")?.addEventListener("click", () => {
    const url = new URL(location.href);
    url.searchParams.set("lang", getLang() === "es" ? "en" : "es");
    location.href = url.toString();
  });
  document
    .querySelector("#fd-print")
    ?.addEventListener("click", () => window.print());
  loadDigest(location.search).then((d) => {
    document.querySelector("#fd-body").innerHTML = d.ok
      ? digestHtml(d)
      : `<p>${esc(t("This family link is not working. Ask your child to copy a new one from the Fluency Lab."))}</p>`;
  });
}

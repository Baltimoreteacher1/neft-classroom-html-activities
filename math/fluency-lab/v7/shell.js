// EduWonderLab 7.0 intent-first start panel for the bare /math/fluency-lab/ visit. It only ADDS a panel: no existing
// element, route, storage key or deep link is changed. Every choice becomes a link the lab already understands
// (or the v7 workspace), so a student reaches real work in three choices: grade, intent, Start.
import { getLang } from "../i18n.js";
import { FLAGSHIPS, keyOf, skillsForGrade, bandFor } from "./concepts.js";
import { loadProgress } from "./store.js";
import { recommend } from "./learner.js";

const LAST = "ewl-v7-last-v1";
const read = () => { try { return JSON.parse(localStorage.getItem(LAST) || "{}"); } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(LAST, JSON.stringify(v)); } catch { /* keep working */ } };
const L = (en, es) => (getLang() === "es" ? es : en);

export function targetFor({ grade, intent, progress = {} }) {
  const rec = recommend({ grade, progress });
  const flag = FLAGSHIPS.find((f) => f.grade === grade);
  const skillId = (rec.key || keyOf(skillsForGrade(grade)[0])).split(":")[1];
  if (intent === "learn") return `./v7/?grade=${grade}&skill=${encodeURIComponent(flag && rec.intent === "explore" ? flag.skill.split(":")[1] : skillId)}`;
  if (intent === "practice") return `./?grade=${grade}&skill=${encodeURIComponent(skillId)}&start=practice`;
  return `./?grade=${grade}&view=models`;
}

export function isLanding(loc = location) {
  const p = new URLSearchParams(loc.search);
  return !["grade", "skill", "view", "start"].some((k) => p.has(k)) && !new URLSearchParams(loc.hash.slice(1)).get("assignment");
}

function mount() {
  if (!isLanding() || document.getElementById("v7-start")) return;
  const anchor = document.querySelector("#main .intro");
  if (!anchor) return;
  const saved = read();
  const st = { grade: saved.grade || 0, intent: saved.intent || "" };
  const sec = document.createElement("section");
  sec.id = "v7-start";
  sec.className = "v7 v7-home v7-card";
  sec.setAttribute("aria-labelledby", "v7-start-h");
  anchor.after(sec);
  const progress = loadProgress();
  const paint = () => {
    sec.dataset.band = st.grade ? bandFor(st.grade).id : "3-4";
    const href = st.grade && st.intent ? targetFor({ ...st, progress }) : null;
    const rec = st.grade ? recommend({ grade: st.grade, progress }) : null;
    sec.innerHTML = `
      <h2 id="v7-start-h">${L("What do you want to do?", "¿Qué quieres hacer?")}</h2>
      <p class="v7-meta" id="v7-grade-label">${L("My grade", "Mi grado")}</p><div role="group" aria-labelledby="v7-grade-label" class="v7-grades">${[1,2,3,4,5,6,7,8].map((g) => `<button type="button" class="v7-btn" data-grade="${g}" aria-label="${L("Grade", "Grado")} ${g}" aria-pressed="${st.grade === g}">${g}</button>`).join("")}</div>
      <div role="group" aria-label="${L("What to do", "Qué hacer")}" class="v7-intents">
        <button type="button" class="v7-intent" data-intent="learn" aria-pressed="${st.intent === "learn"}"><strong>${L("Learn", "Aprender")}</strong>${L("See an idea with a picture", "Mira una idea con un dibujo")}</button>
        <button type="button" class="v7-intent" data-intent="practice" aria-pressed="${st.intent === "practice"}"><strong>${L("Practice", "Practicar")}</strong>${L("Work on a skill", "Trabaja una destreza")}</button>
        <button type="button" class="v7-intent" data-intent="explore" aria-pressed="${st.intent === "explore"}"><strong>${L("Explore", "Explorar")}</strong>${L("Play with math models", "Juega con modelos")}</button>
      </div>
      <div class="v7-go">${href ? `<a class="v7-btn primary" id="v7-go" href="${href}">${L("Start", "Comenzar")}</a>` : `<span class="v7-meta" id="v7-hint">${L("Pick a grade and what you want to do.", "Elige un grado y qué quieres hacer.")}</span>`}
        ${rec ? `<span class="v7-meta">${L("Suggested for you:", "Sugerido para ti:")} ${rec.reason[getLang() === "es" ? "es" : "en"]}</span>` : ""}</div>
      <p class="v7-more"><a href="./?view=teacher">${L("For teachers", "Para docentes")}</a> <a href="./family/">${L("Families", "Familias")}</a> <a href="./?view=path">${L("My progress", "Mi progreso")}</a></p>`;
    sec.querySelectorAll("[data-grade]").forEach((b) => b.addEventListener("click", () => { st.grade = Number(b.dataset.grade); write(st); paint(); sec.querySelector(`[data-grade="${st.grade}"]`)?.focus(); }));
    sec.querySelectorAll("[data-intent]").forEach((b) => b.addEventListener("click", () => { st.intent = b.dataset.intent; write(st); paint(); (sec.querySelector("#v7-go") || sec.querySelector(`[data-intent="${st.intent}"]`))?.focus(); }));
  };
  paint();
}
if (typeof document !== "undefined") (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", mount) : mount());

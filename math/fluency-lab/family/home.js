// The Family Math 2.0 home: choose a grade, a length and a mode, press Start. Also today's mission, a skill browser across
// all ten games, the games shelf, a coaching card, real-world activities and a progress strip. Everything is computed from
// this device's record; nothing leaves the browser. @fm2 FM-001 FM-002 FM-003 FM-004 FM-005 FM-024 FM-025 FM-026 FM-028 FM-029 FM-030 FM-034 FM-035 FM-036 FM-043
import { profileKey, readLocal, selectProfile } from "../school-tools.js";
import { emptyTutor, recommendations, sanitizeTutor } from "../tutor-engine.js";
import { starsFor } from "./fm2/adapt.js";
import { coachingCard, gameTip, STRAND_KEYS } from "./fm2/coach.js";
import { escapeHtml as esc, L } from "./fm2/lang.js";
import { familyLaunch, familySessionLaunch } from "./family-planner.js";
import { skillsFor } from "./fm2/inventory.js";
import {
  activeProfile,
  addLearner,
  applyStatic,
  gradeName,
  gradeRange,
  gradeShort,
  KIT,
  keepUrl,
  loadAvailable,
  paint,
  playUrl,
  progressUrl,
  renderTopbar,
  showStorageWarning,
  STRAND_LABEL,
  startLanguage,
  starsHtml,
  strandOf,
  suggestLevel,
  switchLanguage,
  t,
  titleCase,
  intParam,
} from "./fm2/page-kit.js";
import { COPY as C } from "./fm2/home-copy.js";
import { printWeekReport, weekReportHtml } from "./fm2/week-report.js";
import { recommend, reasonText } from "./fm2/recommend.js";
import { forGrade } from "./fm2/realworld.js";
import { GAME_IDS } from "./fm2/registry.js";
import { seedFrom } from "./fm2/rng.js";
import { directedSkillPlan, findDirectedSkill, skillExample, skillExplanation, skillSearchText, teacherMessage, teacherSkillLink } from "./fm2/skill-link.js";
import { dailyMission, encodePlan, MINUTE_CHOICES, planSession } from "./fm2/session.js";
import { createGuidedStore } from "./fm2/guided/guided-core.js";
import { createStore, dayKey, minutesThisWeek, streak } from "./fm2/store.js";

const params = new URLSearchParams(location.search);
const $ = (selector) => document.querySelector(selector);
const GRADE_LIST = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const S = {
  lang: startLanguage(params),
  profile: activeProfile(params),
  store: null,
  grade: 1,
  minutes: 10,
  mode: "solo",
  games: [],
  missing: GAME_IDS.slice(),
  loaded: false,
  strands: new Set(),
  openRw: new Set(), rwAll: false,
  selectedSkill: params.get("skill") || "",
  selectedGame: params.get("game") || "",
  shareMinutes: [5, 10, 15].includes(Number(params.get("minutes"))) ? Number(params.get("minutes")) : 10,
  search: "",
  requestedSkillState: "none",
  fresh: true,
};

// ---- state ----------------------------------------------------------------------------------------------------------
function openProfile() {
  S.store = createStore({
    profile: S.profile,
    onUnavailable: () => showStorageWarning($("#family-storage-warning"), S.lang),
  });
  const saved = S.store.state.settings;
  S.grade = S.selectedSkill
    ? (intParam(params, "grade", 0, 8) ?? S.grade ?? saved.grade)
    : S.fresh
      ? (intParam(params, "grade", 0, 8) ?? saved.grade)
      : saved.grade;
  const linkedMinutes = Number(params.get("minutes"));
  S.minutes = S.selectedSkill && [5, 10, 15].includes(linkedMinutes) ? linkedMinutes : saved.minutes;
  S.mode = S.selectedSkill && ["solo", "together"].includes(params.get("mode")) ? params.get("mode") : saved.mode;
  S.strands = new Set();
  S.openRw = new Set();
  S.rwAll = false;
  S.fresh = false;
}
function choose(name, value) {
  S[name] = value;
  if (name === "grade" && S.selectedSkill && !findDirectedSkill(S.games, value, S.selectedSkill, S.selectedGame)) {
    S.selectedSkill = "";
    S.selectedGame = "";
    S.requestedSkillState = "invalid";
    const url = new URL(location.href);
    url.searchParams.delete("skill");
    url.searchParams.delete("game");
    url.searchParams.delete("minutes");
    history.replaceState(null, "", url);
  }
  S.store.setSetting(name, value);
  if (name === "minutes") S.shareMinutes = Number(value);
  if (["minutes", "mode"].includes(name) && S.selectedSkill)
    keepUrl({ grade: S.grade, profile: S.profile, game: S.selectedGame, skill: S.selectedSkill, minutes: S.shareMinutes, mode: S.mode });
  keepUrl({ grade: S.grade, profile: S.profile });
  draw();
}

// ---- derived data ---------------------------------------------------------------------------------------------------
function derive() {
  const { grade, minutes, mode, games, store } = S;
  if (!games.length) return { plan: null, daily: null, recs: [] };
  const state = store.state;
  const seed = seedFrom(dayKey(), grade, mode);
  const directed = findDirectedSkill(games, grade, S.selectedSkill, S.selectedGame);
  if (directed) {
    return { plan: directedSkillPlan({ ...directed, grade, minutes, mode, level: suggestLevel(store, directed.game.id, directed.skill, grade) }), daily: null, recs: recommend({ state, grade, games, limit: 8 }) };
  }
  return {
    plan: planSession({ grade, minutes, mode, state, games, seed }),
    daily: dailyMission({ grade, state, games, mode }),
    recs: recommend({ state, grade, games, limit: 8 }),
  };
}
const gameOf = (id) => S.games.find((g) => g.id === id);
const skillOf = (gameId, skillId) => gameOf(gameId)?.skills.find((s) => s.id === skillId);
const icon = (game) =>
  game
    ? `<span class="pk-ico" aria-hidden="true">${game.icon}</span>`
    : `<span class="pk-ico pk-ico-off" aria-hidden="true">?</span>`;
const planCode = (plan) => {
  try {
    return plan?.activities.length ? encodePlan(plan) : null;
  } catch {
    return null;
  }
};
const here = () => ({ grade: S.grade, profile: S.profile, lang: S.lang, mode: S.mode });

function tonightSkill() {
  const tutor = sanitizeTutor(
    readLocal(profileKey("ewl-fluency-tutor-v2", S.profile), emptyTutor()),
  );
  const list = recommendations(tutor, S.grade);
  return (list.find((item) => item.status.due || item.status.recent.length) || list[0])?.skill.id;
}

// ---- sections -------------------------------------------------------------------------------------------------------
function setupHtml(info) {
  const { lang } = S;
  const grades = GRADE_LIST.map((g) => {
    const label = g === 0
      ? `${t(C.gradeWord, lang)} K · ${gradeName(g, lang)}`
      : `${t(C.gradeWord, lang)} ${g}`;
    return `<option value="${g}" ${g === S.grade ? "selected" : ""}>${esc(label)}</option>`;
  }).join("");
  const radios = (name, values, label) =>
    values
      .map(
        (v) =>
          `<label class="hm-pill"><input type="radio" name="${name}" value="${v}" ${String(S[name]) === String(v) ? "checked" : ""} data-fk="${name}-${v}" data-testid="${name}-${v}"><span>${esc(label(v))}</span></label>`,
      )
      .join("");
  const code = planCode(info.plan);
  const count = info.plan?.activities.length || 0;
  const start = code
    ? `<a class="fm2-btn fm2-btn-primary hm-start" id="start-link" data-testid="start-session" href="${playUrl({ plan: code, ...here() })}">${esc(t(C.start, lang, { min: S.minutes }))}</a>`
    : `<button type="button" class="fm2-btn fm2-btn-primary hm-start" id="start-link" data-testid="start-session" aria-disabled="true" disabled>${esc(t(C.start, lang, { min: S.minutes }))}</button>`;
  const note = code
    ? t(C.startNote, lang, {
        n: count,
        min: Math.max(1, Math.round(info.plan.estSec / 60)),
        mode: t(C[S.mode], lang),
      })
    : t(S.loaded ? C.noGames : C.loading, lang);
  return `<div class="hm-field"><label class="hm-field-label" for="family-grade">${esc(t(C.grade, lang))}</label><select class="hm-grade-select" id="family-grade" name="grade" data-testid="grade-selector">${grades}</select></div>
    <div class="hm-field-row">
      <fieldset class="hm-field"><legend>${esc(t(C.length, lang))}</legend><div class="hm-seg" data-testid="length-group">${radios("minutes", MINUTE_CHOICES, (v) => t(C.minutesOpt, lang, { n: v }))}</div></fieldset>
      <fieldset class="hm-field"><legend>${esc(t(C.how, lang))}</legend><div class="hm-seg" data-testid="mode-group">${radios("mode", ["solo", "together"], (v) => t(C[v], lang))}</div></fieldset>
    </div>
    <p class="hm-hint">${esc(t(C[`${S.mode}Hint`], lang))}</p>
    ${start}<p class="hm-note" id="plan-summary" data-testid="plan-summary" role="status">${esc(note)}</p>
    ${S.requestedSkillState === "invalid" ? `<p class="hm-note" role="status">${esc(t(C.skillInvalid, lang))}</p>` : ""}
    ${S.requestedSkillState === "unavailable" ? `<p class="hm-note" role="status">${esc(t(C.skillUnavailable, lang))}</p>` : ""}`;
}

function missionHtml(info) {
  const { lang } = S;
  if (!info.plan?.activities.length)
    return `<div class="pk-empty" data-testid="mission-empty"><strong>${esc(t(C.missionEmptyTitle, lang))}</strong>${esc(t(C.missionEmpty, lang))}</div>`;
  const rows = info.plan.activities.map((a) => {
    const game = gameOf(a.gameId);
    const skill = skillOf(a.gameId, a.skillId);
    const rec = info.recs.find((r) => r.gameId === a.gameId && r.skillId === a.skillId) || {
      reason: "new",
      level: a.level,
      evidence: {},
    };
    return `<li class="hm-act" data-testid="mission-activity" data-game="${a.gameId}" data-skill="${a.skillId}">${icon(game)}<div class="hm-act-main"><strong>${esc(L(skill?.title, lang))}</strong><span>${esc(L(game?.title, lang))} <span class="pk-chip pk-chip-${a.role}">${esc(t(KIT.roles[a.role], lang))}</span></span><p class="hm-why">${esc(reasonText({ ...rec, level: a.level }, lang))}</p></div><span class="hm-min">${esc(t(KIT.min, lang, { n: Math.max(1, Math.round(a.estSec / 60)) }))}</span></li>`;
  });
  return `<ol class="hm-acts">${rows.join("")}</ol><p class="hm-total">${esc(t(C.totalTime, lang, { n: Math.max(1, Math.round(info.plan.estSec / 60)) }))}</p>`;
}

function progressHtml() {
  const { lang, store } = S;
  const state = store.state;
  const stars = Object.values(state.skills).reduce((n, record) => n + starsFor(record), 0);
  const empty = !state.sessions.length && !Object.keys(state.skills).length;
  const tile = (value, label, id) =>
    `<div class="hm-stat"><b data-testid="${id}">${value}</b><span>${esc(t(label, lang))}</span></div>`;
  return `<div class="hm-stats">${tile(streak(state), C.streak, "stat-streak")}${tile(Math.round(minutesThisWeek(state)), C.week, "stat-minutes")}${tile(stars, C.starsEarned, "stat-stars")}</div>
    ${empty ? `<p class="hm-note" data-testid="progress-empty">${esc(t(C.progressEmpty, lang))}</p>` : ""}
    ${weekReportHtml({ lang, profile: S.profile ?? 0, grade: S.grade })}
    <a class="fm2-btn" href="${progressUrl(here())}" id="progress-link" data-testid="progress-link">${esc(t(C.seeProgress, lang))}</a>`;
}

function shelfHtml() {
  const { lang, grade, store } = S;
  const cards = GAME_IDS.map((id, index) => {
    const game = gameOf(id);
    if (!game)
      return `<li class="hm-game hm-game-off" data-testid="game-card" data-game="${id}" data-ready="false">${icon(null)}<div class="hm-game-main"><strong>${esc(titleCase(id))}</strong><span>${esc(t(C.soon, lang))}</span></div></li>`;
    const rec = recommend({ state: store.state, grade, games: [game], limit: 1 })[0];
    const skill =
      skillOf(id, rec?.skillId) ||
      game.skills.find((s) => s.grades[0] <= grade && grade <= s.grades[1]) ||
      game.skills[0];
    const level = rec?.level ?? suggestLevel(store, id, skill, grade);
    const low = Math.min(...game.skills.map((s) => s.grades[0]));
    const high = Math.max(...game.skills.map((s) => s.grades[1]));
    const href = playUrl({ game: id, skill: skill.id, level, ...here() });
    return `<li class="hm-game" data-testid="game-card" data-game="${id}" data-ready="true" style="--i:${index}">${icon(game)}<div class="hm-game-main"><strong>${esc(L(game.title, lang))}</strong><span>${esc(L(game.tagline, lang))}</span><small>${esc(t(C.gradesRange, lang, { range: gradeRange(low, high) }))}</small></div><a class="fm2-btn" href="${href}" aria-label="${esc(`${t(C.play, lang)}: ${L(game.title, lang)}`)}" data-testid="game-play">${esc(t(C.play, lang))}</a></li>`;
  });
  const retry = S.loaded && S.missing.length
    ? `<button type="button" class="fm2-btn" data-action="retry-games" data-testid="retry-games">${esc(t(C.retry, lang))}</button>`
    : "";
  return `${retry}<ul class="hm-games">${cards.join("")}</ul>`;
}

function skillsHtml() {
  const { lang, grade, store } = S;
  const entries = skillsFor(S.games, grade);
  if (!entries.length)
    return `<div class="pk-empty" data-testid="skills-empty"><strong>${esc(t(C.missionEmptyTitle, lang))}</strong>${esc(t(C.noGames, lang))}</div>`;
  const groups = new Map();
  for (const entry of entries) {
    const key = strandOf(entry.gameId, { strand: entry.strand, id: entry.skillId });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  const keys = STRAND_KEYS.filter((k) => groups.has(k));
  if (!S.strands.size) S.strands.add(keys[0]);
  const needle = S.search.trim().toLocaleLowerCase();
  return keys
    .map((key) => {
      const rows = groups.get(key).filter((entry) => {
        if (!needle) return true;
        const game = gameOf(entry.gameId);
        const skill = skillOf(entry.gameId, entry.skillId);
        return skillSearchText(game, skill).includes(needle.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase());
      }).map((entry) => {
        const game = gameOf(entry.gameId);
        const skill = skillOf(entry.gameId, entry.skillId);
        const level = suggestLevel(store, entry.gameId, skill, grade);
        const href = playUrl({ game: entry.gameId, skill: entry.skillId, level, ...here() });
        const label = `${t(C.practice, lang)}: ${L(skill.title, lang)} (${L(game.title, lang)})`;
        return `<li class="hm-skill" data-testid="skill-row" data-game="${entry.gameId}" data-skill="${entry.skillId}">${icon(game)}<div class="hm-skill-main"><strong>${esc(L(skill.title, lang))}</strong><span>${esc(L(game.title, lang))} · ${esc(entry.standard)}</span>${starsHtml(store.stars(entry.gameId, entry.skillId), lang)}</div><button type="button" class="fm2-btn hm-practice" aria-label="${esc(`${t(C.focusSkill, lang)}: ${L(skill.title, lang)}`)}" data-select-skill="${entry.skillId}" data-game="${game.id}" data-fk="select-${entry.skillId}">${esc(t(C.focusSkill, lang))}</button><a class="fm2-btn hm-practice" href="${href}" aria-label="${esc(label)}" data-testid="skill-practice">${esc(t(C.practice, lang))}</a></li>`;
      });
      if (!rows.length) return "";
      return `<details class="hm-strand" data-strand="${key}" data-testid="strand-group" ${S.strands.has(key) ? "open" : ""}><summary data-fk="strand-${key}"><span>${esc(t(STRAND_LABEL[key], lang))}</span><small>${esc(rows.length === 1 ? t(C.skillOne, lang) : t(C.skillCount, lang, { n: rows.length }))}</small></summary><ul class="hm-skills">${rows.join("")}</ul></details>`;
    })
    .join("");
}

function teacherPickerHtml() {
  const { lang, grade } = S;
  const entries = skillsFor(S.games, grade).filter((entry) => {
    const game = gameOf(entry.gameId);
    const skill = skillOf(entry.gameId, entry.skillId);
    const needle = S.search.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
    return !needle || skillSearchText(game, skill).includes(needle);
  }).map((entry) => ({ game: gameOf(entry.gameId), skill: skillOf(entry.gameId, entry.skillId) })).filter((entry) => entry.game && entry.skill);
  const selected = findDirectedSkill(S.games, grade, S.selectedSkill, S.selectedGame);
  const guide = (game, skill) => `<p>${esc(skillExplanation(skill, lang))}</p><p class="hm-skill-example"><b>${esc(t(C.examplePrompt, lang))}</b> ${esc(skillExample(game, skill, grade, lang))}</p>`;
  const options = entries.map(({ game, skill }) => `<li><div class="hm-picker-skill"><strong>${esc(L(skill.title, lang))}</strong><small>${esc(L(game.title, lang))} · ${esc(skill.standard)}</small>${guide(game, skill)}</div><button type="button" class="fm2-btn" aria-label="${esc(`${t(C.focusSkill, lang)}: ${L(skill.title, lang)}`)}" data-select-skill="${skill.id}" data-game="${game.id}">${esc(t(C.focusSkill, lang))}</button></li>`).join("");
  let share = "";
  if (selected) {
    const url = new URL(teacherSkillLink({ grade, gameId: selected.game.id, skillId: selected.skill.id, minutes: S.shareMinutes, mode: S.mode, lang, path: location.pathname }), location.href).href;
    const message = teacherMessage({ skill: selected.skill, grade, minutes: S.shareMinutes, lang, url });
    const durationOptions = [5, 10, 15].map((n) => `<option value="${n}" ${n === S.shareMinutes ? "selected" : ""}>${esc(t(C.minutesOpt, lang, { n }))}</option>`).join("");
    share = `<p><strong>${esc(t(C.focusSelected, lang, { skill: L(selected.skill.title, lang) }))}</strong></p><p>${esc(skillExplanation(selected.skill, lang))}</p><p class="hm-skill-example"><b>${esc(t(C.examplePrompt, lang))}</b> ${esc(skillExample(selected.game, selected.skill, grade, lang))}</p><label for="share-minutes">${esc(t(C.shareLength, lang))}</label><select id="share-minutes" data-testid="share-minutes">${durationOptions}</select><label for="teacher-message">${esc(t(C.teacherMessage, lang))}</label><textarea id="teacher-message" readonly rows="4" data-testid="teacher-message">${esc(message)}</textarea><button type="button" class="fm2-btn" data-copy-message>${esc(t(C.copyMessage, lang))}</button><span role="status" aria-live="polite">${esc(S.shareState === "copied" ? t(C.copied, lang) : S.shareState === "fallback" ? t(C.copyFallback, lang) : "")}</span><label for="teacher-link">${esc(t(C.teacherLink, lang))}</label><input id="teacher-link" type="url" readonly value="${esc(url)}" data-testid="teacher-link"><button type="button" class="fm2-btn" data-copy-link>${esc(t(C.copyLink, lang))}</button><button type="button" class="pk-link-btn" data-clear-skill>${esc(t(C.clearSkill, lang))}</button>`;
  }
  return `<div class="hm-teacher-picker" data-testid="teacher-skill-picker"><label for="skill-search">${esc(t(C.skillSearch, lang))}</label><input id="skill-search" type="search" value="${esc(S.search)}" data-testid="skill-search" data-fk="skill-search"><ul>${options}</ul>${share}</div>`;
}

function coachHtml(info) {
  const { lang, grade } = S;
  const lead = S.selectedSkill ? info.plan?.activities[0] : info.recs[0] || info.plan?.activities[0];
  const game = lead && gameOf(lead.gameId);
  const skill = lead && skillOf(lead.gameId, lead.skillId);
  if (!skill)
    return {
      html: `<div class="pk-empty" data-testid="coach-empty">${esc(t(C.coachEmpty, lang))}</div>`,
      sub: "",
    };
  const card = coachingCard({ gameId: game.id, skillId: skill.id, strand: skill.strand, grade });
  const row = (label, text) =>
    `<p class="hm-coach-row"><b>${esc(t(C[label], lang))}</b> ${esc(L(text, lang))}</p>`;
  return {
    sub: t(C.coachFor, lang, { skill: L(skill.title, lang), game: L(game.title, lang) }),
    html: `<p class="pk-print-only">${esc(t(C.printCoach, lang, { grade: gradeName(grade, lang) }))}</p><blockquote class="hm-quote" data-testid="coach-ask">${esc(L(card.ask, lang))}</blockquote>${row("lookFor", card.lookFor)}${row("ifStuck", card.ifStuck)}${row("extend", card.extend)}${row("tip", gameTip(game.id))}`,
  };
}

const RW_SHOWN = 6;
function realworldHtml() {
  const { lang, grade } = S;
  const all = forGrade(grade);
  const shown = S.rwAll ? all : all.slice(0, RW_SHOWN);
  const more =
    all.length > RW_SHOWN
      ? `<button type="button" class="fm2-btn hm-more-btn" data-action="rw-toggle" aria-expanded="${S.rwAll}" data-fk="rw-toggle" data-testid="rw-toggle">${esc(S.rwAll ? t(C.rwLess, lang) : t(C.rwMore, lang, { n: all.length }))}</button>`
      : "";
  return (
    shown
    .map((entry) => {
      const li = (items) => items.map((x) => `<li>${esc(x)}</li>`).join("");
      return `<details class="hm-rw" data-id="${entry.id}" data-testid="rw-activity" ${S.openRw.has(entry.id) ? "open" : ""}><summary data-fk="rw-${entry.id}"><span>${esc(L(entry.title, lang))}</span><small>${esc(t(KIT.min, lang, { n: entry.minutes }))} · ${esc(t(STRAND_LABEL[entry.strand], lang))}</small></summary>
      <div class="hm-rw-body"><p><b>${esc(t(C.materials, lang))}</b> ${esc(entry.materials[lang].join(", "))}</p><ol>${li(entry.steps[lang])}</ol>
      <p class="hm-coach-row"><b>${esc(t(C.askThis, lang))}</b> ${esc(L(entry.askThis, lang))}</p><p class="hm-coach-row"><b>${esc(t(C.goFurther, lang))}</b> ${esc(L(entry.extension, lang))}</p>
      <button type="button" class="pk-link-btn hm-noprint" data-print-rw="${entry.id}" data-fk="print-${entry.id}" data-testid="rw-print">${esc(t(C.printThis, lang))}</button></div></details>`;
    })
    .join("") + more
  );
}

function resumeHtml() {
  const saved = S.store.state.resume;
  if (!saved || !S.loaded) return "";
  const { lang } = S;
  const game = gameOf(saved.gameId);
  const href = playUrl({
    game: saved.gameId,
    skill: saved.skillId,
    plan: saved.plan || undefined,
    grade: saved.grade,
    profile: S.profile,
    lang,
    mode: saved.mode,
    resume: true,
  });
  const conflict = S.selectedSkill && (saved.skillId !== S.selectedSkill || saved.gameId !== S.selectedGame)
    ? `<p role="status">${esc(t(C.resumeConflict, lang))}</p>`
    : "";
  return `<section class="hm-resume" data-testid="resume-banner" aria-labelledby="resume-title"><div><h2 id="resume-title">${esc(t(C.resumeTitle, lang))}</h2><p>${esc(t(C.resumeText, lang, { game: game ? L(game.title, lang) : titleCase(saved.gameId) }))}</p>${conflict}</div><a class="fm2-btn fm2-btn-primary" href="${href}" data-testid="resume-link">${esc(t(C.resumeGo, lang))}</a></section>`;
}

// ---- draw -----------------------------------------------------------------------------------------------------------
// Print handler for the weekly summary (delegated, because the panel is redrawn on every change).
document.addEventListener("click", (event) => {
  if (!event.target.closest?.("#print-week-report")) return;
  printWeekReport({ lang: S.lang, profile: S.profile ?? 0, grade: S.grade });
});

// The guided session is the default first action: its link carries the grade and language, and says "Continue" when a
// session is already saved on this device.
function paintGuidedStart() {
  const link = $("#guided-start");
  if (!link) return;
  const note = $("#guided-note");
  if (S.selectedSkill) {
    const directed = S.requestedSkillState === "valid"
      ? findDirectedSkill(S.games, S.grade, S.selectedSkill, S.selectedGame)
      : null;
    const start = $("#start-link");
    link.hidden = !directed || !start || start.getAttribute("aria-disabled") === "true";
    if (directed && start) {
      link.href = start.href;
      link.textContent = t(C.start, S.lang, { min: S.minutes });
    }
    if (note) note.hidden = true;
    return;
  }
  link.hidden = false;
  if (note) note.hidden = false;
  const saved = createGuidedStore({ profile: S.profile ?? 0 }).state.active;
  const open = saved && !saved.recorded;
  const query = new URLSearchParams({ grade: S.grade, profile: S.profile ?? 0, lang: S.lang, minutes: S.minutes === 5 ? 5 : 10 });
  if (!open) query.set("new", "1");
  link.href = `session.html?${query}`;
  link.textContent = t(open ? C.guidedResume : C.guidedStart, S.lang);
}

function draw() {
  const { lang } = S;
  renderTopbar(lang);
  applyStatic(document, C, lang);
  const info = derive();
  const lead = info.daily?.title;
  const focused = S.selectedSkill ? findDirectedSkill(S.games, S.grade, S.selectedSkill, S.selectedGame) : null;
  document.querySelector(".hm-hero")?.classList.toggle("is-directed", Boolean(focused));
  if (focused) {
    $("#welcome-title").textContent = t(C.focusedTitle, lang, { skill: L(focused.skill.title, lang) });
    $(".hm-hero-lead").textContent = skillExplanation(focused.skill, lang);
  }
  $("#mission-sub").textContent = focused ? t(C.focusSelected, lang, { skill: L(focused.skill.title, lang) }) : lead ? L(lead, lang) : "";
  $("#skills-sub").textContent = t(C.skillsLead, lang, { grade: gradeName(S.grade, lang) });
  $("#rw-sub").textContent = t(C.rwLead, lang, { grade: gradeName(S.grade, lang) });
  $("#rw-print-title").textContent = t(C.printRealworld, lang, { grade: gradeName(S.grade, lang) });
  paint($("#setup"), setupHtml(info));
  paintGuidedStart();
  paint($("#resume-region"), resumeHtml());
  paint($("#mission-body"), missionHtml(info));
  paint($("#progress-body"), progressHtml());
  paint($("#games-body"), shelfHtml());
  paint($("#skills-body"), `${teacherPickerHtml()}${skillsHtml()}`);
  const coach = coachHtml(info);
  $("#coach-sub").textContent = coach.sub;
  paint($("#coach-body"), coach.html);
  $("#print-coach").hidden = !info.plan && !info.recs.length;
  paint($("#rw-body"), realworldHtml());
  $("#tonight-link").href = familySessionLaunch({
    grade: S.grade,
    profile: S.profile,
    skill: tonightSkill(),
    lang,
  });
  $("#lab-link").href = familyLaunch({ grade: S.grade, profile: S.profile });
  if ($("#family-storage-warning") && !$("#family-storage-warning").hidden)
    showStorageWarning($("#family-storage-warning"), lang);
}

function clearDirectedSkill() {
  S.selectedSkill = "";
  S.selectedGame = "";
  S.requestedSkillState = "none";
  S.shareState = "";
  const url = new URL(location.href);
  url.searchParams.delete("skill");
  url.searchParams.delete("game");
  url.searchParams.delete("minutes");
  history.replaceState(null, "", url);
  draw();
}

async function copyTeacherText(text, fallback) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    S.shareState = "copied";
  } catch {
    S.shareState = "fallback";
  }
  draw();
  if (S.shareState === "fallback") {
    const replacement = fallback?.id ? document.getElementById(fallback.id) : null;
    replacement?.focus();
    replacement?.select();
  }
}

// ---- events ---------------------------------------------------------------------------------------------------------
function printRegion(kind, item) {
  document.body.dataset.print = kind;
  if (item) {
    item.dataset.printing = "";
    item.open = true;
  }
  window.print();
}
window.addEventListener("afterprint", () => {
  delete document.body.dataset.print;
  for (const el of document.querySelectorAll("[data-printing]")) delete el.dataset.printing;
});

document.addEventListener("click", (event) => {
  const selectSkill = event.target.closest("[data-select-skill]");
  if (selectSkill) {
    S.selectedSkill = selectSkill.dataset.selectSkill;
    S.selectedGame = selectSkill.dataset.game || "";
    S.minutes = S.shareMinutes;
    S.store.setSetting("minutes", S.minutes);
    S.requestedSkillState = "valid";
    S.shareState = "";
    keepUrl({ grade: S.grade, profile: S.profile, game: S.selectedGame, skill: S.selectedSkill, minutes: S.minutes, mode: S.mode });
    return draw();
  }
  if (event.target.closest("[data-clear-skill]")) return clearDirectedSkill();
  if (event.target.closest("[data-copy-message]")) return copyTeacherText($("#teacher-message").value, $("#teacher-message"));
  if (event.target.closest("[data-copy-link]")) return copyTeacherText($("#teacher-link").value, $("#teacher-link"));
  const rw = event.target.closest("[data-print-rw]");
  if (rw) return printRegion("realworld", rw.closest("details"));
  if (event.target.closest("[data-action=retry-games]")) return location.reload();
  if (event.target.closest("[data-action=rw-toggle]")) {
    S.rwAll = !S.rwAll;
    return draw();
  }
  if (event.target.closest("#print-coach")) return printRegion("coach");
  if (event.target.closest("#lang-toggle")) {
    S.lang = switchLanguage(S.lang);
    keepUrl({ grade: S.grade, profile: S.profile, ...(S.selectedSkill ? { game: S.selectedGame, skill: S.selectedSkill, minutes: S.minutes, mode: S.mode } : {}), lang: S.lang });
    return draw();
  }
  if (event.target.closest("#add-learner")) {
    const next = addLearner();
    if (next === null) return;
    S.profile = next;
    openProfile();
    keepUrl({ grade: S.grade, profile: S.profile });
    draw();
  }
});
document.addEventListener("change", (event) => {
  const el = event.target;
  if (el.id === "family-profile") {
    S.profile = Number(el.value);
    selectProfile(S.profile);
    openProfile();
    keepUrl({ grade: S.grade, profile: S.profile });
    draw();
  } else if (el.name === "minutes") choose("minutes", Number(el.value));
  else if (el.name === "grade") choose("grade", Number(el.value));
  else if (el.id === "share-minutes") {
    S.shareMinutes = Number(el.value);
    S.minutes = S.shareMinutes;
    S.store.setSetting("minutes", S.minutes);
    S.shareState = "";
    draw();
  }
  else if (el.name === "mode") choose("mode", el.value);
});
document.addEventListener("input", (event) => {
  if (event.target.id !== "skill-search") return;
  S.search = event.target.value;
  draw();
});
document.addEventListener(
  "toggle",
  (event) => {
    const el = event.target;
    const set = el.dataset?.strand ? S.strands : el.dataset?.id ? S.openRw : null;
    if (!set) return;
    const key = el.dataset.strand || el.dataset.id;
    if (el.open) set.add(key);
    else set.delete(key);
  },
  true,
);
window.addEventListener("fluency-storage-unavailable", () =>
  showStorageWarning($("#family-storage-warning"), S.lang),
);

function validateRequestedSkill() {
  if (!S.selectedSkill) return (S.requestedSkillState = "none");
  S.requestedSkillState = findDirectedSkill(S.games, S.grade, S.selectedSkill, S.selectedGame)
    ? "valid"
    : S.missing.length
      ? "unavailable"
      : "invalid";
}

// ---- boot -----------------------------------------------------------------------------------------------------------
try {
  openProfile();
  keepUrl({ grade: S.grade, profile: S.profile });
  draw();
  const { games, missing } = await loadAvailable();
  S.games = games;
  S.missing = missing;
  S.loaded = true;
  validateRequestedSkill();
  draw();
} catch (error) {
  console.error(error);
  $("#error-region").innerHTML =
    `<div class="pk-banner" data-testid="home-error-card"><strong>${esc(t(C.errorTitle, S.lang))}</strong> ${esc(t(C.errorText, S.lang))} <button type="button" class="fm2-btn" data-action="retry-games">${esc(t(C.retry, S.lang))}</button></div>`;
}

// The Family Math 2.0 home: choose a grade, a length and a mode, press Start. Also today's mission, a skill browser across
// all ten games, the games shelf, a coaching card, real-world activities and a progress strip. Everything is computed from
// this device's record; nothing leaves the browser. @fm2 FM-001 FM-002 FM-003 FM-004 FM-005 FM-024 FM-025 FM-026 FM-028 FM-029 FM-030 FM-034 FM-035 FM-036 FM-043
import { profileKey, readLocal, selectProfile } from "../school-tools.js";
import { emptyTutor, recommendations, sanitizeTutor } from "../tutor-engine.js";
import { starsFor } from "./fm2/adapt.js";
import { coachingCard, gameTip, STRAND_KEYS, withoutListenLead } from "./fm2/coach.js";
import { escapeHtml as esc, L } from "./fm2/lang.js";
import { familyLaunch, familySessionLaunch } from "./family-planner.js";
import { missionItems } from "./fm2/mission.js";
import { topicOfSkill } from "./fm2/skill-notes.js";
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
import { dailyMission, encodePlan, MINUTE_CHOICES, missionTopics, planSession, themeText } from "./fm2/session.js";
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
// `items` are the rows of the mission as the page shows it, each with the link that opens exactly that activity.
function derive() {
  const { grade, minutes, mode, games, store } = S;
  if (!games.length) return { plan: null, daily: null, recs: [], items: [] };
  const state = store.state;
  const seed = seedFrom(dayKey(), grade, mode);
  const directed = findDirectedSkill(games, grade, S.selectedSkill, S.selectedGame);
  const recs = recommend({ state, grade, games, limit: 8 });
  const plan = directed
    ? directedSkillPlan({ ...directed, grade, minutes, mode, level: suggestLevel(store, directed.game.id, directed.skill, grade) })
    : planSession({ grade, minutes, mode, state, games, seed });
  const daily = directed ? null : dailyMission({ grade, state, games, mode });
  return { plan, daily, recs, items: missionItems({ plan, games, recs, context: here() }) };
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
const fold = (text) => String(text || "").trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
const focusedSkill = () => (S.selectedSkill ? findDirectedSkill(S.games, S.grade, S.selectedSkill, S.selectedGame) : null);

// A saved play session or an unfinished guided session. While one exists, Continue is the one primary action.
function savedWork() {
  if (!S.loaded) return { play: null, guided: null };
  const guided = createGuidedStore({ profile: S.profile ?? 0 }).state.active;
  return { play: S.store.state.resume || null, guided: guided && !guided.recorded ? guided : null };
}

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
  const saved = savedWork();
  const hasSaved = Boolean(saved.play || saved.guided);
  const cls = `fm2-btn hm-start${hasSaved ? "" : " fm2-btn-primary"}`;
  const label = esc(t(C.start, lang, { min: S.minutes }));
  const start = code
    ? `<a class="${cls}" id="start-link" data-testid="start-session" href="${playUrl({ plan: code, ...here() })}">${label}</a>`
    : `<button type="button" class="${cls}" id="start-link" data-testid="start-session" aria-disabled="true" disabled>${label}</button>`;
  const note = code
    ? t(C.startNote, lang, {
        n: count,
        min: Math.max(1, Math.round(info.plan.estSec / 60)),
        mode: t(C[S.mode], lang),
      })
    : t(S.loaded ? C.noGames : C.loading, lang);
  const replaces = hasSaved && code ? ` ${t(C.savedReplace, lang)}` : "";
  // The guided session picks its own skill, so it is not offered beside a skill someone chose on purpose.
  const guidedOffer = focusedSkill() || saved.guided ? "" : guidedHtml();
  return `<div class="hm-controls">
      <div class="hm-field"><label class="hm-field-label" for="family-grade">${esc(t(C.grade, lang))}</label><select class="hm-grade-select" id="family-grade" name="grade" data-testid="grade-selector">${grades}</select></div>
      <fieldset class="hm-field"><legend>${esc(t(C.length, lang))}</legend><div class="hm-seg" data-testid="length-group">${radios("minutes", MINUTE_CHOICES, (v) => t(C.minutesOpt, lang, { n: v }))}</div></fieldset>
      <fieldset class="hm-field"><legend>${esc(t(C.how, lang))}</legend><div class="hm-seg" data-testid="mode-group">${radios("mode", ["solo", "together"], (v) => t(C[v], lang))}</div></fieldset>
    </div>
    <p class="hm-hint">${esc(t(C[`${S.mode}Hint`], lang))}</p>
    ${start}<p class="hm-note" id="plan-summary" data-testid="plan-summary" role="status">${esc(note + replaces)}</p>
    ${S.requestedSkillState === "invalid" ? `<p class="hm-note" role="status">${esc(t(C.skillInvalid, lang))}</p>` : ""}
    ${S.requestedSkillState === "unavailable" ? `<p class="hm-note" role="status">${esc(t(C.skillUnavailable, lang))}</p>` : ""}
    ${guidedOffer}
    <p class="hm-else">${esc(t(C.elseText, lang))} <a href="#skills-region">${esc(t(C.elseLink, lang))}</a></p>`;
}

// The guided session is a different experience (Learn, Try, Play, Explain), so it stays a separate, quieter choice.
function guidedHtml() {
  const { lang } = S;
  const minutes = S.minutes === 5 ? 5 : 10;
  const query = new URLSearchParams({ grade: S.grade, profile: S.profile ?? 0, lang, minutes, new: 1 });
  return `<div class="hm-guided-box"><a class="fm2-btn hm-guided" id="guided-start" data-testid="start-guided" data-fk="guided-start" href="session.html?${query}">${esc(t(C.guidedStart, lang))}</a><p class="hm-note" id="guided-note">${esc(t(C.guidedNote, lang, { min: minutes }))}</p></div>`;
}

function missionHtml(info) {
  const { lang } = S;
  if (!info.items.length)
    return `<div class="pk-empty" data-testid="mission-empty"><strong>${esc(t(C.missionEmptyTitle, lang))}</strong>${esc(t(C.missionEmpty, lang))}</div>`;
  const rows = info.items.map((item) => {
    const title = L(item.skill?.title, lang);
    const gameTitle = L(item.game?.title, lang);
    const aria = t(C.practiceThisAria, lang, { skill: title, game: gameTitle });
    const why = item.reason ? `<p class="hm-why">${esc(reasonText(item.reason, lang))}</p>` : "";
    return `<li class="hm-act" data-testid="mission-activity" data-game="${item.gameId}" data-skill="${item.skillId}">${icon(item.game)}<div class="hm-act-main"><p class="hm-act-meta"><span class="hm-role" data-role="${item.role}">${esc(t(KIT.roles[item.role], lang))}</span> · <span class="hm-min">${esc(t(KIT.min, lang, { n: item.minutes }))}</span></p><h3 class="hm-act-title"><a class="hm-act-link" href="${item.href}" data-testid="mission-skill-link">${esc(title)}</a></h3><p class="hm-act-game">${esc(gameTitle)}</p><p class="hm-act-note">${esc(item.note)}</p>${why}</div><a class="fm2-btn hm-act-go" href="${item.href}" aria-label="${esc(aria)}" data-testid="mission-practice">${esc(t(C.practiceThis, lang))}</a></li>`;
  });
  const total = t(C.totalTime, lang, { n: Math.max(1, Math.round(info.plan.estSec / 60)) });
  return `<ol class="hm-acts">${rows.join("")}</ol><p class="hm-total">${esc(total)}${S.selectedSkill ? "" : ` ${esc(t(C.missionLead, lang))}`}</p>`;
}

function progressHtml() {
  const { lang, store } = S;
  const state = store.state;
  const stars = Object.values(state.skills).reduce((n, record) => n + starsFor(record), 0);
  const empty = !state.sessions.length && !Object.keys(state.skills).length;
  const tile = (value, label, id) =>
    `<div class="hm-stat"><b data-testid="${id}">${value}</b><span>${esc(t(label, lang))}</span></div>`;
  return `<div class="hm-stats">${tile(streak(state), C.streak, "stat-streak")}${tile(Math.round(minutesThisWeek(state)), C.week, "stat-minutes")}${tile(stars, C.starsEarned, "stat-stars")}</div>
    <p class="hm-note hm-note-start" data-testid="progress-note">${esc(t(empty ? C.progressEmpty : C.progressNote, lang))}</p>
    <details class="hm-week"><summary data-fk="week-summary">${esc(t(C.weekSummary, lang))}</summary>${weekReportHtml({ lang, profile: S.profile ?? 0, grade: S.grade })}</details>
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

// ONE skill browser: search, groups by topic, and the explanation, example and share tools on demand inside each row.
const TOPIC_ORDER = [...STRAND_KEYS, "binomial-area"];
function skillsHtml() {
  const { lang, grade, store } = S;
  const entries = skillsFor(S.games, grade);
  if (!entries.length)
    return `<div class="pk-empty" data-testid="skills-empty"><strong>${esc(t(C.missionEmptyTitle, lang))}</strong>${esc(t(C.noGames, lang))}</div>`;
  const needle = fold(S.search);
  const groups = new Map();
  let matches = 0;
  for (const entry of entries) {
    const game = gameOf(entry.gameId);
    const skill = skillOf(entry.gameId, entry.skillId);
    if (!game || !skill) continue;
    if (needle && !skillSearchText(game, skill).includes(needle)) continue;
    const key = topicOfSkill(game, skill);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ game, skill, entry });
    matches += 1;
  }
  const keys = TOPIC_ORDER.filter((k) => groups.has(k));
  if (!S.strands.size && keys.length) S.strands.add(keys[0]);
  const groupHtml = keys
    .map((key) => {
      const rows = groups.get(key).map(({ game, skill, entry }) => {
        const level = suggestLevel(store, entry.gameId, skill, grade);
        const href = playUrl({ game: entry.gameId, skill: entry.skillId, level, ...here() });
        const title = L(skill.title, lang);
        const label = `${t(C.practice, lang)}: ${title} (${L(game.title, lang)})`;
        return `<li class="hm-skill" data-testid="skill-row" data-game="${entry.gameId}" data-skill="${entry.skillId}">${icon(game)}<div class="hm-skill-main"><a class="hm-skill-link" href="${href}" data-testid="skill-link">${esc(title)}</a><span>${esc(L(game.title, lang))}</span>${starsHtml(store.stars(entry.gameId, entry.skillId), lang)}</div><a class="fm2-btn hm-practice" href="${href}" aria-label="${esc(label)}" data-testid="skill-practice">${esc(t(C.practice, lang))}</a><details class="hm-skill-more"><summary>${esc(t(C.skillDetails, lang))}<span class="hm-sr"> — ${esc(title)}</span></summary><p>${esc(skillExplanation(skill, lang, game.id))}</p><p class="hm-skill-example"><b>${esc(t(C.examplePrompt, lang))}</b> ${esc(skillExample(game, skill, grade, lang))}</p><p class="hm-std"><b>${esc(t(C.standardLabel, lang))}</b> ${esc(entry.standard)}</p><button type="button" class="pk-link-btn" aria-label="${esc(`${t(C.focusSkill, lang)}: ${title}`)}" data-select-skill="${entry.skillId}" data-game="${game.id}" data-fk="select-${game.id}-${entry.skillId}">${esc(t(C.focusSkill, lang))}</button></details></li>`;
      });
      const open = needle || S.strands.has(key) ? "open" : "";
      return `<details class="hm-strand" data-strand="${key}" data-testid="strand-group" ${open}><summary data-fk="strand-${key}"><span>${esc(t(STRAND_LABEL[key], lang))}</span><small>${esc(rows.length === 1 ? t(C.skillOne, lang) : t(C.skillCount, lang, { n: rows.length }))}</small></summary><ul class="hm-skills">${rows.join("")}</ul></details>`;
    })
    .join("");
  const status = needle
    ? matches
      ? t(C.searchCount, lang, { n: matches })
      : t(C.searchNone, lang, { q: S.search.trim() })
    : "";
  return `<div class="hm-browser" data-testid="teacher-skill-picker"><div class="hm-search"><label for="skill-search">${esc(t(C.skillSearch, lang))}</label><input id="skill-search" type="search" value="${esc(S.search)}" autocomplete="off" data-testid="skill-search" data-fk="skill-search"></div><p class="hm-search-status" role="status">${esc(status)}</p>${sharePanelHtml()}${groupHtml}</div>`;
}

// Opened from a skill's Details: a message and a link for another family member, plus today's focus on that skill.
function sharePanelHtml() {
  const { lang, grade } = S;
  const selected = focusedSkill();
  if (!selected) return "";
  const url = new URL(teacherSkillLink({ grade, gameId: selected.game.id, skillId: selected.skill.id, minutes: S.shareMinutes, mode: S.mode, lang, path: location.pathname }), location.href).href;
  const message = teacherMessage({ skill: selected.skill, gameId: selected.game.id, grade, minutes: S.shareMinutes, lang, url });
  const durationOptions = [5, 10, 15].map((n) => `<option value="${n}" ${n === S.shareMinutes ? "selected" : ""}>${esc(t(C.minutesOpt, lang, { n }))}</option>`).join("");
  return `<div class="hm-share" data-testid="share-panel"><p><strong id="share-heading" tabindex="-1">${esc(t(C.focusSelected, lang, { skill: L(selected.skill.title, lang) }))}</strong></p><p>${esc(skillExplanation(selected.skill, lang, selected.game.id))}</p><p class="hm-skill-example"><b>${esc(t(C.examplePrompt, lang))}</b> ${esc(skillExample(selected.game, selected.skill, grade, lang))}</p><label for="share-minutes">${esc(t(C.shareLength, lang))}</label><select id="share-minutes" data-testid="share-minutes">${durationOptions}</select><label for="teacher-message">${esc(t(C.teacherMessage, lang))}</label><textarea id="teacher-message" readonly rows="4" data-testid="teacher-message">${esc(message)}</textarea><button type="button" class="fm2-btn" data-copy-message>${esc(t(C.copyMessage, lang))}</button><span role="status" aria-live="polite">${esc(S.shareState === "copied" ? t(C.copied, lang) : S.shareState === "fallback" ? t(C.copyFallback, lang) : "")}</span><label for="teacher-link">${esc(t(C.teacherLink, lang))}</label><input id="teacher-link" type="url" readonly value="${esc(url)}" data-testid="teacher-link"><button type="button" class="fm2-btn" data-copy-link>${esc(t(C.copyLink, lang))}</button><button type="button" class="pk-link-btn" data-clear-skill>${esc(t(C.clearSkill, lang))}</button></div>`;
}

// The coaching card is about an activity in the mission above (its main one), or the skill that was chosen on purpose.
function coachHtml(info) {
  const { lang, grade } = S;
  const lead = S.selectedSkill ? info.items[0] : info.items.find((i) => i.role === "main") || info.items[0];
  if (!lead?.skill)
    return {
      html: `<div class="pk-empty" data-testid="coach-empty">${esc(t(C.coachEmpty, lang))}</div>`,
      sub: "",
    };
  const { game, skill } = lead;
  const card = coachingCard({ gameId: game.id, skillId: skill.id, strand: skill.strand, grade, topic: topicOfSkill(game, skill) });
  const row = (label, text) =>
    `<p class="hm-coach-row"><b>${esc(t(C[label], lang))}</b> ${esc(L(text, lang))}</p>`;
  const title = L(skill.title, lang);
  return {
    sub: t(S.selectedSkill ? C.coachForPicked : C.coachFor, lang, { skill: title }),
    html: `<p class="pk-print-only">${esc(t(C.printCoach, lang, { grade: gradeName(grade, lang) }))}</p><blockquote class="hm-quote" data-testid="coach-ask">${esc(L(card.ask, lang))}</blockquote>${row("lookFor", withoutListenLead(card.lookFor))}${row("ifStuck", card.ifStuck)}<details class="hm-more-ideas"><summary data-fk="more-ideas">${esc(t(C.moreIdeas, lang))}</summary>${row("extend", card.extend)}${row("tip", gameTip(game.id))}</details><p class="hm-noprint"><a class="fm2-btn" href="${lead.href}" data-testid="coach-practice" aria-label="${esc(t(C.practiceThisAria, lang, { skill: title, game: L(game.title, lang) }))}">${esc(t(C.practiceThis, lang))}</a></p>`,
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
  const { lang } = S;
  const saved = savedWork();
  const banners = [];
  if (saved.play) {
    const play = saved.play;
    const game = gameOf(play.gameId);
    const skill = skillOf(play.gameId, play.skillId);
    const href = playUrl({
      game: play.gameId,
      skill: play.skillId,
      plan: play.plan || undefined,
      grade: play.grade,
      profile: S.profile,
      lang,
      mode: play.mode,
      resume: true,
    });
    const total = Math.max(1, play.rounds || 1);
    const round = Math.min(total, (play.index || 0) + 1);
    const more = play.plan ? ` ${t(C.resumeSession, lang)}` : "";
    const where = t(C.resumeText, lang, {
      skill: skill ? L(skill.title, lang) : titleCase(play.skillId),
      game: game ? L(game.title, lang) : titleCase(play.gameId),
      n: round,
      total,
    });
    const conflict = S.selectedSkill && (play.skillId !== S.selectedSkill || play.gameId !== S.selectedGame)
      ? `<p role="status">${esc(t(C.resumeConflict, lang))}</p>`
      : "";
    banners.push({ id: "resume", testid: "resume-link", title: t(C.resumeTitle, lang), text: `${where}${more}`, conflict, href, go: t(C.resumeGo, lang) });
  }
  if (saved.guided) {
    const target = saved.guided.target;
    const skill = skillOf(target.gameId, target.skillId);
    const query = new URLSearchParams({ grade: S.grade, profile: S.profile ?? 0, lang, minutes: S.minutes === 5 ? 5 : 10 });
    banners.push({ id: "guided", testid: "start-guided", linkId: "guided-start", title: t(C.guidedResumeTitle, lang), text: skill ? t(C.guidedResumeText, lang, { skill: L(skill.title, lang) }) : "", conflict: "", href: `session.html?${query}`, go: t(C.guidedResume, lang) });
  }
  return banners
    .map((b, i) => `<section class="hm-resume" data-testid="${b.id === "resume" ? "resume-banner" : "guided-resume-banner"}" aria-labelledby="${b.id}-title"><div><h2 id="${b.id}-title">${esc(b.title)}</h2><p>${esc(b.text)}</p>${b.conflict}</div><a class="fm2-btn${i === 0 ? " fm2-btn-primary" : ""}" ${b.linkId ? `id="${b.linkId}" ` : ""}href="${b.href}" data-testid="${b.testid}" data-fk="${b.id}-go">${esc(b.go)}</a></section>`)
    .join("");
}

// ---- draw -----------------------------------------------------------------------------------------------------------
// Print handler for the weekly summary (delegated, because the panel is redrawn on every change).
document.addEventListener("click", (event) => {
  if (!event.target.closest?.("#print-week-report")) return;
  printWeekReport({ lang: S.lang, profile: S.profile ?? 0, grade: S.grade });
});

function draw() {
  const { lang } = S;
  renderTopbar(lang);
  applyStatic(document, C, lang);
  const info = derive();
  const focused = focusedSkill();
  document.querySelector(".hm-hero")?.classList.toggle("is-directed", Boolean(focused));
  if (focused) {
    $("#welcome-title").textContent = t(C.focusedTitle, lang, { skill: L(focused.skill.title, lang) });
    $(".hm-hero-lead").textContent = skillExplanation(focused.skill, lang, focused.game.id);
  }
  // The theme names every activity actually listed below, for the length and mode chosen.
  const theme = themeText(missionTopics(info.plan?.activities, S.games), lang);
  $("#mission-sub").textContent = focused ? t(C.focusSelected, lang, { skill: L(focused.skill.title, lang) }) : theme ? t(C.missionTheme, lang, { theme }) : "";
  $("#skills-sub").textContent = t(C.skillsLead, lang, { grade: gradeName(S.grade, lang) });
  $("#rw-sub").textContent = t(C.rwLead, lang, { grade: gradeName(S.grade, lang) });
  $("#rw-print-title").textContent = t(C.printRealworld, lang, { grade: gradeName(S.grade, lang) });
  paint($("#setup"), setupHtml(info));
  paint($("#resume-region"), resumeHtml());
  paint($("#mission-body"), missionHtml(info));
  paint($("#progress-body"), progressHtml());
  paint($("#games-body"), shelfHtml());
  paint($("#skills-body"), skillsHtml());
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
  const region = kind === "realworld" ? $("#rw-region") : $("#coach-region");
  for (const el of [region, ...region.querySelectorAll("details")]) {
    el.dataset.printOpened = el.open ? "" : "1";
    el.open = true;
  }
  if (item) {
    item.dataset.printing = "";
    item.open = true;
  }
  window.print();
}
window.addEventListener("afterprint", () => {
  delete document.body.dataset.print;
  for (const el of document.querySelectorAll("[data-printing]")) delete el.dataset.printing;
  for (const el of document.querySelectorAll("[data-print-opened]")) {
    if (el.dataset.printOpened === "1") el.open = false;
    delete el.dataset.printOpened;
  }
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
    draw();
    // The share panel sits above the list; move the keyboard and the view to it.
    return $("#share-heading")?.focus();
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
    if (!set || (el.dataset.strand && S.search.trim())) return;
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

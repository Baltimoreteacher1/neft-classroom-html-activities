// My progress: streak, minutes, a 7-day chart (with a real data table), stars per game, a skill mastery grid, what is due
// for review, recent sessions, what to try next, export and reset for ONE learner. Everything is read from this device.
// @fm2 FM-024 FM-025 FM-035 FM-036 FM-020 FM-021
import { PROFILE_NAMES, downloadFile, selectProfile } from "../../school-tools.js";
import { isDue, mastery, starsFor } from "./adapt.js";
import { STRAND_KEYS } from "./coach.js";
import { escapeHtml as esc, L } from "./lang.js";
import {
  covers,
  activeProfile,
  addLearner,
  clearSession,
  applyStatic,
  gradeName,
  gradeShort,
  homeUrl,
  intParam,
  KIT,
  keepUrl,
  loadAvailable,
  paint,
  playUrl,
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
} from "./page-kit.js";
import { P } from "./progress-copy.js";
import { recommend, reasonText } from "./recommend.js";
import { createStore, dayKey, minutesThisWeek, streak } from "./store.js";

const params = new URLSearchParams(location.search);
const $ = (selector) => document.querySelector(selector);
const DAY = 86400000;
const S = {
  lang: startLanguage(params),
  profile: activeProfile(params),
  store: null,
  games: [],
  grade: 1,
  confirm: false,
  notice: "",
  loaded: false,
};

function openProfile(first = false) {
  S.store = createStore({
    profile: S.profile,
    onUnavailable: () => showStorageWarning($("#family-storage-warning"), S.lang),
  });
  S.grade = first
    ? (intParam(params, "grade", 0, 8) ?? S.store.state.settings.grade)
    : S.store.state.settings.grade;
  S.confirm = false;
  S.notice = "";
}
const gameOf = (id) => S.games.find((g) => g.id === id);
const nameOf = (gameId, skillId) =>
  L(gameOf(gameId)?.skills.find((s) => s.id === skillId)?.title, S.lang) || titleCase(skillId);
const gameName = (id) => (gameOf(id) ? L(gameOf(id).title, S.lang) : titleCase(id));
const gradeFor = (skill) =>
  Math.min(skill.grades[1], Math.max(skill.grades[0], S.store.state.settings.grade));
const dateText = (ms, opts) =>
  new Date(ms).toLocaleDateString(S.lang === "es" ? "es" : "en-US", opts);

// ---- pieces ---------------------------------------------------------------------------------------------------------
function summaryHtml() {
  const state = S.store.state;
  const stars = Object.values(state.skills).reduce((n, record) => n + starsFor(record), 0);
  const tile = (value, label, id) =>
    `<div class="pg-stat"><b data-testid="${id}">${value}</b><span>${esc(t(label, S.lang))}</span></div>`;
  return `<div class="pg-stats">${tile(streak(state), P.streak, "stat-streak")}${tile(Math.round(minutesThisWeek(state)), P.week, "stat-minutes")}${tile(stars, P.stars, "stat-stars")}${tile(state.sessions.length, P.sessions, "stat-sessions")}</div>`;
}

function chartHtml() {
  const state = S.store.state;
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => {
    const at = now - (6 - i) * DAY;
    return {
      at,
      minutes: Math.round(state.days[dayKey(at)] || 0),
      label: dateText(at, { weekday: "short" }),
      full: dateText(at, { weekday: "long", month: "short", day: "numeric" }),
    };
  });
  const top = Math.max(10, ...days.map((d) => d.minutes));
  const bars = days
    .map((d, i) => {
      const h = Math.round((d.minutes / top) * 110);
      return `<g><rect x="${i * 52 + 10}" y="${130 - h}" width="34" height="${h}" rx="6" class="pg-bar${d.minutes ? "" : " pg-bar-zero"}"/><text x="${i * 52 + 27}" y="${124 - h}" text-anchor="middle" class="pg-bar-val">${d.minutes}</text><text x="${i * 52 + 27}" y="150" text-anchor="middle" class="pg-bar-day">${esc(d.label)}</text></g>`;
    })
    .join("");
  const summary = days.map((d) => `${d.label} ${d.minutes}`).join(", ");
  const rows = days
    .map((d) => `<tr><th scope="row">${esc(d.full)}</th><td>${d.minutes}</td></tr>`)
    .join("");
  return `<figure class="pg-chart" data-testid="week-chart"><svg viewBox="0 0 364 160" role="img" aria-label="${esc(t(P.chartLabel, S.lang, { data: summary }))}" class="pg-svg">${bars}</svg></figure>
    <details class="pg-table" data-testid="week-table-wrap"><summary data-fk="table">${esc(t(P.viewTable, S.lang))}</summary><table data-testid="week-table"><caption>${esc(t(P.chartTitle, S.lang))}</caption><thead><tr><th scope="col">${esc(t(P.day, S.lang))}</th><th scope="col">${esc(t(P.minutes, S.lang))}</th></tr></thead><tbody>${rows}</tbody></table></details>`;
}

const STATUS = [P.s0, P.s1, P.s2, P.s3];
function cellFor(strand, grade) {
  const skills = S.games.flatMap((g) =>
    g.skills
      .filter((s) => covers(s, grade) && strandOf(g.id, s) === strand)
      .map((s) => ({ g: g.id, id: s.id })),
  );
  if (!skills.length)
    return `<td class="pg-cell pg-cell-none"><span aria-hidden="true">–</span><span class="fm2-sr">${esc(t(P.noSkills, S.lang))}</span></td>`;
  const earned = skills.reduce((n, s) => n + S.store.stars(s.g, s.id), 0);
  const ratio = earned / (skills.length * 3);
  const level = earned === 0 ? 0 : ratio <= 1 / 3 ? 1 : ratio <= 2 / 3 ? 2 : 3;
  const shape = ["○", "◔", "◑", "●"][level];
  return `<td class="pg-cell pg-cell-${level}" data-level="${level}" data-testid="mastery-cell"><span aria-hidden="true">${shape}</span> <b>${earned}/${skills.length * 3}</b><span class="fm2-sr"> ${esc(t(STATUS[level], S.lang))}</span></td>`;
}
function gridHtml() {
  const lang = S.lang;
  const strands = STRAND_KEYS.filter((k) =>
    S.games.some((g) => g.skills.some((s) => strandOf(g.id, s) === k)),
  );
  if (!strands.length) return `<div class="pk-empty">${esc(t(P.gridEmpty, lang))}</div>`;
  const head = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    .map((g) => `<th scope="col" title="${esc(gradeName(g, lang))}">${gradeShort(g)}</th>`)
    .join("");
  const body = strands
    .map(
      (k) =>
        `<tr><th scope="row">${esc(t(STRAND_LABEL[k], lang))}</th>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((g) => cellFor(k, g)).join("")}</tr>`,
    )
    .join("");
  const legend = [0, 1, 2, 3]
    .map(
      (i) =>
        `<li><span aria-hidden="true">${["○", "◔", "◑", "●"][i]}</span> ${esc(t(STATUS[i], lang))}</li>`,
    )
    .join("");
  return `<div class="pg-scroll" role="region" tabindex="0" aria-label="${esc(t(P.gridLabel, lang))}"><table class="pg-grid" data-testid="mastery-grid"><caption class="fm2-sr">${esc(t(P.gridCaption, lang))}</caption><thead><tr><th scope="col">${esc(t(P.strand, lang))}</th>${head}</tr></thead><tbody>${body}</tbody></table></div><ul class="pg-legend">${legend}</ul>`;
}

function gradeListHtml() {
  const lang = S.lang;
  const buttons = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    .map(
      (g) =>
        `<button type="button" class="pg-grade" data-grade="${g}" aria-pressed="${g === S.grade}" aria-label="${esc(gradeName(g, lang))}" data-fk="g-${g}">${gradeShort(g)}</button>`,
    )
    .join("");
  const rows = S.games
    .flatMap((game) => game.skills.filter((s) => covers(s, S.grade)).map((s) => ({ game, s })))
    .map(({ game, s }) => {
      const m = mastery(S.store.skill(game.id, s.id));
      const stars = S.store.stars(game.id, s.id);
      const rec = S.store.skill(game.id, s.id);
      const level = suggestLevel(S.store, game.id, s, S.grade);
      return `<li class="pg-skill" data-testid="skill-row" data-game="${game.id}" data-skill="${s.id}"><div><strong>${esc(L(s.title, lang))}</strong><span>${esc(L(game.title, lang))} · ${esc(t(KIT.levels, lang, { n: rec?.level ?? level }))}</span></div><div class="pg-skill-score">${starsHtml(stars, lang)}<small>${esc(t(STATUS[stars], lang))}${m.n ? ` · ${m.n}` : ""}</small></div><a class="fm2-btn pg-practice" href="${playUrl({ game: game.id, skill: s.id, level, grade: S.grade, profile: S.profile, lang })}" aria-label="${esc(`${t(P.practice, lang)}: ${L(s.title, lang)}`)}">${esc(t(P.practice, lang))}</a></li>`;
    });
  return `<div class="pg-grades" role="group" aria-label="${esc(t(P.pickGrade, lang))}">${buttons}</div><ul class="pg-skills" data-testid="grade-skills">${rows.join("") || `<li class="pk-empty">${esc(t(P.gridEmpty, lang))}</li>`}</ul>`;
}

function dueHtml() {
  const due = Object.entries(S.store.state.skills)
    .filter(([, r]) => isDue(r))
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .slice(0, 6);
  if (!due.length)
    return `<p class="pk-empty" data-testid="due-empty">${esc(t(P.dueEmpty, S.lang))}</p>`;
  const now = Date.now();
  return `<ul class="pg-list" data-testid="due-list">${due
    .map(([key, r]) => {
      const [gameId, skillId] = key.split(":");
      const skill = gameOf(gameId)?.skills.find((s) => s.id === skillId);
      const days = Math.max(0, Math.floor((now - r.dueAt) / DAY));
      const link = skill
        ? `<a class="fm2-btn pg-practice" href="${playUrl({ game: gameId, skill: skillId, level: r.level, grade: gradeFor(skill), profile: S.profile, lang: S.lang })}">${esc(t(P.practice, S.lang))}</a>`
        : "";
      return `<li data-testid="due-row"><div><strong>${esc(nameOf(gameId, skillId))}</strong><span>${esc(gameName(gameId))} · ${esc(days ? t(P.dueDays, S.lang, { n: days }) : t(P.dueToday, S.lang))}</span></div>${link}</li>`;
    })
    .join("")}</ul>`;
}

function nextHtml() {
  const recs = recommend({ state: S.store.state, grade: S.grade, games: S.games, limit: 3 });
  if (!recs.length) return `<p class="pk-empty">${esc(t(P.nextEmpty, S.lang))}</p>`;
  return `<ul class="pg-list" data-testid="next-list">${recs
    .map((r) => {
      const skill = gameOf(r.gameId)?.skills.find((s) => s.id === r.skillId);
      return `<li data-testid="next-row"><div><strong>${esc(nameOf(r.gameId, r.skillId))}</strong><span>${esc(gameName(r.gameId))}</span><p>${esc(reasonText(r, S.lang))}</p></div><a class="fm2-btn pg-practice" href="${playUrl({ game: r.gameId, skill: r.skillId, level: r.level, grade: skill ? gradeFor(skill) : S.grade, profile: S.profile, lang: S.lang })}">${esc(t(P.practice, S.lang))}</a></li>`;
    })
    .join("")}</ul>`;
}

function gamesHtml() {
  const state = S.store.state;
  return `<ul class="pg-list" data-testid="game-stars">${S.games
    .map((game) => {
      const earned = game.skills.reduce((n, s) => n + S.store.stars(game.id, s.id), 0);
      const record = state.games[game.id];
      const best = record?.bestStars || 0;
      return `<li data-testid="game-row" data-game="${game.id}"><span class="pk-ico" aria-hidden="true">${game.icon}</span><div><strong>${esc(L(game.title, S.lang))}</strong><span>${esc(t(P.gameLine, S.lang, { earned, total: game.skills.length * 3, plays: record?.plays || 0 }))}</span></div><div class="pg-skill-score"><small>${esc(t(P.best, S.lang))}</small>${starsHtml(best, S.lang)}</div></li>`;
    })
    .join("")}</ul>`;
}

function sessionsHtml() {
  const list = [...S.store.state.sessions].reverse().slice(0, 8);
  if (!list.length)
    return `<p class="pk-empty" data-testid="sessions-empty">${esc(t(P.sessionsEmpty, S.lang))}</p>`;
  return `<ul class="pg-list" data-testid="session-list">${list.map((s) => `<li data-testid="session-row"><div><strong>${esc(dateText(s.at, { month: "short", day: "numeric", weekday: "short" }))}</strong><span>${esc(gradeName(s.grade, S.lang))} · ${esc(t(KIT.min, S.lang, { n: Math.round(s.minutes) }))} · ${esc(t(P.solved, S.lang, { correct: s.correct, total: s.total }))}</span><span>${esc(s.games.map(gameName).join(", "))}</span></div></li>`).join("")}</ul>`;
}

function dataHtml() {
  const { lang } = S;
  const confirm = S.confirm
    ? `<div class="pg-confirm" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-text" data-testid="reset-confirm"><h3 id="confirm-title">${esc(t(P.confirmTitle, lang))}</h3><p id="confirm-text">${esc(t(P.confirmText, lang, { name: PROFILE_NAMES[S.profile] }))}</p><div class="pg-row"><button type="button" class="fm2-btn pg-danger" data-act="reset-yes" data-fk="reset-yes" data-testid="reset-yes">${esc(t(P.confirmYes, lang))}</button><button type="button" class="fm2-btn" data-act="reset-no" data-fk="reset-no" data-testid="reset-no">${esc(t(P.confirmNo, lang))}</button></div></div>`
    : `<button type="button" class="fm2-btn" data-act="reset" data-fk="reset" data-testid="reset-progress">${esc(t(P.reset, lang))}</button>`;
  return `<p>${esc(t(P.dataText, lang))}</p><div class="pg-row"><button type="button" class="fm2-btn" data-act="export" data-fk="export" data-testid="export-json">${esc(t(P.export, lang))}</button>${confirm}</div><p class="pg-notice" role="status" data-testid="data-notice">${esc(S.notice)}</p>`;
}

const section = (id, title, body, sub = "") =>
  `<section class="pg-section" id="${id}" aria-labelledby="${id}-h"><h2 class="pk-h" id="${id}-h">${esc(t(title, S.lang))}</h2>${sub ? `<p class="pk-lead">${esc(sub)}</p>` : ""}${body}</section>`;

function pageHtml() {
  const state = S.store.state;
  const fresh = !state.sessions.length && !Object.keys(state.skills).length;
  const empty = fresh
    ? `<div class="pk-empty pg-fresh" data-testid="progress-empty"><strong>${esc(t(P.freshTitle, S.lang))}</strong>${esc(t(P.freshText, S.lang))}<br><a class="fm2-btn fm2-btn-primary" href="${homeUrl({ grade: S.grade, profile: S.profile, lang: S.lang })}">${esc(t(P.freshGo, S.lang))}</a></div>`
    : "";
  return `${summaryHtml()}${empty}${section("pg-week", P.weekTitle, chartHtml())}${section("pg-next", P.nextTitle, nextHtml())}${fresh ? "" : section("pg-due", P.dueTitle, dueHtml())}${fresh ? "" : section("pg-games", P.gamesTitle, gamesHtml())}${section("pg-grid", P.gridTitle, gridHtml() + gradeListHtml(), t(P.gridLead, S.lang))}${fresh ? "" : section("pg-sessions", P.sessionsTitle, sessionsHtml())}${section("pg-data", P.dataTitle, dataHtml())}`;
}

function draw() {
  renderTopbar(S.lang);
  applyStatic(document, P, S.lang);
  $("#learner-line").textContent = t(P.learnerLine, S.lang, {
    n: S.profile + 1,
    name: PROFILE_NAMES[S.profile],
  });
  $("#back-link").href = homeUrl({ grade: S.grade, profile: S.profile, lang: S.lang });
  $("#pk-brand").href = homeUrl({ grade: S.grade, profile: S.profile, lang: S.lang });
  document.title = `${t(P.title, S.lang)} · ${t(KIT.family, S.lang)}`;
  paint($("#pg-body"), pageHtml());
  const box = $("#family-storage-warning");
  if (!box.hidden) showStorageWarning(box, S.lang);
}

// ---- events ---------------------------------------------------------------------------------------------------------
function exportData() {
  const payload = {
    app: "EduWonderLab Family Math",
    version: 1,
    exportedAt: new Date().toISOString(),
    learner: { profile: S.profile, name: PROFILE_NAMES[S.profile] },
    data: S.store.state,
  };
  downloadFile(
    `family-math-${PROFILE_NAMES[S.profile].toLowerCase()}-${dayKey()}.json`,
    JSON.stringify(payload, null, 2),
  );
  S.notice = t(P.exported, S.lang);
}
document.addEventListener("click", (event) => {
  const grade = event.target.closest("[data-grade]");
  const act = event.target.closest("[data-act]")?.dataset.act;
  if (grade) S.grade = Number(grade.dataset.grade);
  else if (event.target.closest("#lang-toggle")) S.lang = switchLanguage(S.lang);
  else if (event.target.closest("#add-learner")) {
    const next = addLearner();
    if (next === null) return;
    S.profile = next;
    openProfile();
    keepUrl({ profile: S.profile });
  } else if (act === "export") exportData();
  else if (act === "reset") S.confirm = true;
  else if (act === "reset-no") S.confirm = false;
  else if (act === "reset-yes") {
    S.store.reset();
    clearSession(S.profile);
    S.confirm = false;
    S.grade = S.store.state.settings.grade;
    S.notice = t(P.resetDone, S.lang);
  } else return;
  draw();
});
document.addEventListener("change", (event) => {
  if (event.target.id !== "family-profile") return;
  S.profile = Number(event.target.value);
  selectProfile(S.profile);
  openProfile();
  keepUrl({ profile: S.profile });
  draw();
});
window.addEventListener("fluency-storage-unavailable", () =>
  showStorageWarning($("#family-storage-warning"), S.lang),
);

try {
  openProfile(true);
  draw();
  const { games } = await loadAvailable();
  S.games = games;
  S.loaded = true;
  draw();
} catch (error) {
  console.error(error);
  $("#pg-body").innerHTML = `<div class="pk-banner" role="alert">${esc(t(P.error, S.lang))}</div>`;
}

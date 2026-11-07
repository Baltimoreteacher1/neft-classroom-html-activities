// Story of the day: one short word problem, three levels, English and Spanish, the same all day for a given grade.
// The wording comes from story-problems.js (the practice sessions' own stories), so numbers, answer and Spanish agree
// with the lab. Families read it together, talk, then open the answer. Nothing is timed, scored or saved.
import { ALL_SKILLS, generateProblem } from "../problem-bank.js";
import { storyFor } from "../story-problems.js";
import { escapeHtml as esc, L, tx } from "./fm2/lang.js";
import { makeRng, seedFrom } from "./fm2/rng.js";

export const LEVELS = Object.freeze(["starter", "ontrack", "stretch"]);
const OFFSET = { starter: -1, ontrack: 0, stretch: 1 };
const TRIES = 40;

export const STORY_COPY = {
  title: { en: "Story of the day", es: "Problema del día" },
  lead: {
    en: "One short story problem in three levels. Read it together, talk about it, then check. Nothing is timed or saved.",
    es: "Un problema corto en tres niveles. Léanlo juntos, conversen y luego comprueben. Nada tiene tiempo límite ni se guarda.",
  },
  level: {
    starter: { en: "A little easier", es: "Un poco más fácil" },
    ontrack: { en: "At this grade", es: "En este grado" },
    stretch: { en: "A bigger challenge", es: "Un reto mayor" },
  },
  levelsLabel: { en: "Choose a level", es: "Elijan un nivel" },
  talkTitle: { en: "Talk about it", es: "Conversen" },
  talk: [
    { en: "What is the story asking?", es: "¿Qué pregunta el problema?" },
    {
      en: "Draw it or act it out. Which operation fits the story?",
      es: "Dibújenlo o represéntenlo. ¿Qué operación encaja con el problema?",
    },
    { en: "How could you check your answer?", es: "¿Cómo podrían comprobar su respuesta?" },
  ],
  check: { en: "Check the answer", es: "Comprobar la respuesta" },
  answer: { en: "The answer is {answer}.", es: "La respuesta es {answer}." },
  skill: { en: "Skill: {skill}", es: "Destreza: {skill}" },
};

export const storyIntro = (lang) => ({ title: L(STORY_COPY.title, lang), lead: L(STORY_COPY.lead, lang) });

export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// One story for a grade, drawn with a seeded generator so a day always gives the same one. Tries the skills of the
// grade in a seeded order; returns null when none of its skills has a story shape.
function storyForGrade(grade, seed) {
  const rng = makeRng(seed);
  const skills = ALL_SKILLS.filter((skill) => skill.grade === grade);
  if (!skills.length) return null;
  const start = Math.floor(rng() * skills.length);
  for (let attempt = 0; attempt < TRIES; attempt += 1) {
    const skill = skills[(start + attempt) % skills.length];
    const story = storyFor(generateProblem(skill, rng), rng, skill);
    if (story?.questionEs && story.answers?.length)
      return { skill, item: story };
  }
  return null;
}

// The three levels of the day: the grade below, this grade and the grade above. A grade with no story shape borrows
// the nearest grade that has one, so every level is always filled.
export function dailyStories(grade, day = dayKey()) {
  const g = Math.min(8, Math.max(0, Math.floor(Number(grade)) || 0));
  return LEVELS.map((level) => {
    const target = Math.min(8, Math.max(0, g + OFFSET[level]));
    for (const near of [0, 1, -1, 2, -2, 3, -3]) {
      const found = storyForGrade(target + near, seedFrom("story", day, level, g, target + near));
      if (found && target + near >= 0 && target + near <= 8)
        return {
          level,
          grade: found.skill.grade,
          skill: found.skill.title,
          en: found.item.question,
          es: found.item.questionEs,
          answer: String(found.item.answers[0]),
          unit: found.item.unit || "",
        };
    }
    return null;
  }).filter(Boolean);
}

export function storyHtml(stories, { lang = "en", level = "ontrack" } = {}) {
  if (!stories.length) return "";
  const current = stories.find((story) => story.level === level) || stories[0];
  const tabs = stories
    .map(
      (story) =>
        `<button type="button" class="fm2-btn" data-story-level="${story.level}" data-fk="story-${story.level}" aria-pressed="${story.level === current.level}">${esc(L(STORY_COPY.level[story.level], lang))}</button>`,
    )
    .join("");
  const answer = `${current.answer}${current.unit ? ` ${current.unit}` : ""}`;
  return `<div class="sd-levels" role="group" aria-label="${esc(L(STORY_COPY.levelsLabel, lang))}">${tabs}</div>
    <article class="sd-card" lang="${lang}" data-testid="story-card"><p class="sd-story" data-testid="story-text">${esc(lang === "es" ? current.es : current.en)}</p>
      <h3 class="sd-talk-title">${esc(L(STORY_COPY.talkTitle, lang))}</h3><ul class="sd-talk">${STORY_COPY.talk.map((line) => `<li>${esc(L(line, lang))}</li>`).join("")}</ul>
      <details class="sd-check"><summary data-fk="story-check">${esc(L(STORY_COPY.check, lang))}</summary><p data-testid="story-answer"><strong>${esc(tx(STORY_COPY.answer, lang, { answer }))}</strong></p></details>
      <p class="sd-meta">${esc(tx(STORY_COPY.skill, lang, { skill: current.skill }))}</p></article>`;
}

const hosts = new WeakMap();
const paintStory = (host) => {
  const state = hosts.get(host);
  host.innerHTML = storyHtml(state.stories, state);
};

// Draws into `host` and keeps the chosen level across redraws (a new grade or language redraws the same host).
export function renderStory(host, { grade, lang, day = dayKey() }) {
  const stories = dailyStories(grade, day);
  const kept = hosts.get(host)?.level;
  if (!hosts.has(host))
    host.addEventListener("click", (event) => {
      const level = event.target.closest("[data-story-level]")?.dataset.storyLevel;
      if (!level) return;
      hosts.get(host).level = level;
      paintStory(host);
      host.querySelector(`[data-story-level="${level}"]`)?.focus({ preventScroll: true });
    });
  hosts.set(host, { stories, lang, level: stories.some((story) => story.level === kept) ? kept : "ontrack" });
  paintStory(host);
  return stories;
}

// Today's mission rows: every row links to exactly the game, skill, level and rounds that were planned, carrying the
// page's grade, learner, language and mode; the time shown is the time the planned rounds take; the theme names every
// activity listed. Real games, every grade x length x mode x language x learner. @fm2 FM-003 FM-004 FM-005 FM-035
import assert from "node:assert/strict";
import { covers } from "../../math/fluency-lab/family/fm2/inventory.js";
import { minutesOf, missionItems, showsReason } from "../../math/fluency-lab/family/fm2/mission.js";
import { recommend } from "../../math/fluency-lab/family/fm2/recommend.js";
import { loadAll } from "../../math/fluency-lab/family/fm2/registry.js";
import { seedFrom } from "../../math/fluency-lab/family/fm2/rng.js";
import {
  estFor,
  missionTopics,
  planSession,
  themeText,
} from "../../math/fluency-lab/family/fm2/session.js";
import {
  directedSkillPlan,
  skillExplanation,
} from "../../math/fluency-lab/family/fm2/skill-link.js";
import { topicOfSkill } from "../../math/fluency-lab/family/fm2/skill-notes.js";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};

const games = await loadAll();
const byId = new Map(games.map((g) => [g.id, g]));
const NOW = Date.UTC(2026, 9, 29);
// A learner whose record makes a few skills due for review, so reasons other than "new" show up.
const weak = (gameId, skillId) => [
  `${gameId}:${skillId}`,
  {
    recent: Array.from({ length: 5 }, () => ({ c: 0, h: 1, l: 1, t: 0 })),
    level: 1,
    plays: 5,
    dueAt: 1,
  },
];
const STATES = [
  { skills: {} },
  {
    skills: Object.fromEntries([
      weak("math-market", "costs-more"),
      weak("fraction-kitchen", "fair-shares"),
      weak("number-builder", "g1-tens-ones"),
      weak("math-match", "g1-add"),
    ]),
  },
];

let rows = 0;
let withReason = 0;
for (const state of STATES) {
  for (let grade = 0; grade <= 8; grade += 1) {
    for (const minutes of [5, 10, 15]) {
      for (const mode of ["solo", "together"]) {
        const plan = planSession({
          grade,
          minutes,
          mode,
          state,
          games,
          now: NOW,
          seed: seedFrom("mission", grade, mode),
        });
        const recs = recommend({ state, grade, games, now: NOW, limit: 8 });
        for (const lang of ["en", "es"]) {
          for (const profile of [0, 3]) {
            const context = { grade, profile, lang, mode };
            const items = missionItems({ plan, games, recs, context });
            const label = `g${grade} ${minutes}m ${mode} ${lang} p${profile}`;
            ok(
              items.length === plan.activities.length && items.length > 0,
              `${label}: one row per planned activity`,
            );
            items.forEach((item, i) => {
              const a = plan.activities[i];
              const game = byId.get(a.gameId);
              const skill = game.skills.find((s) => s.id === a.skillId);
              const url = new URL(item.href, "https://example.test/math/fluency-lab/family/");
              const q = url.searchParams;
              rows += 1;
              ok(url.pathname.endsWith("/play.html"), `${label} #${i}: opens the activity page`);
              ok(
                q.get("game") === a.gameId && q.get("skill") === a.skillId,
                `${label} #${i}: the planned game and skill`,
              );
              ok(
                Number(q.get("level")) === a.level && a.level >= 1 && a.level <= 3,
                `${label} #${i}: the planned level`,
              );
              ok(Number(q.get("rounds")) === a.rounds, `${label} #${i}: the planned rounds`);
              // The page's grade, unless the planner picked a review skill from the grade below: that opens at its own grade.
              const linkGrade = covers(skill, grade) ? grade : skill.grades[1];
              ok(
                Number(q.get("grade")) === linkGrade && covers(skill, linkGrade),
                `${label} #${i}: a grade the skill is taught at`,
              );
              ok(
                Number(q.get("profile")) === profile &&
                  q.get("lang") === lang &&
                  q.get("mode") === mode,
                `${label} #${i}: carries learner, language and mode`,
              );
              ok(
                !q.has("plan") && !q.has("resume"),
                `${label} #${i}: opens the skill, never a plan or a saved session`,
              );
              ok(
                covers(skill, grade) || skill.grades[1] === grade - 1,
                `${label} #${i}: taught at this grade, or review from the grade below`,
              );
              ok(
                item.minutes === minutesOf(estFor(game, a.rounds)) && item.minutes >= 1,
                `${label} #${i}: time matches the planned rounds`,
              );
              ok(
                item.note === skillExplanation(skill, lang, a.gameId) && item.note.length > 10,
                `${label} #${i}: an authored explanation`,
              );
              ok(item.role === a.role, `${label} #${i}: role kept`);
              const rec = recs.find((r) => r.gameId === a.gameId && r.skillId === a.skillId);
              ok(
                (item.reason === null) === !(rec && showsReason(rec.reason)),
                `${label} #${i}: a reason only when the record gives one`,
              );
              if (item.reason) withReason += 1;
            });
            // The theme lists every activity's topic once, in play order
            const topics = missionTopics(plan.activities, games);
            const expected = [
              ...new Set(
                plan.activities.map((a) =>
                  topicOfSkill(
                    byId.get(a.gameId),
                    byId.get(a.gameId).skills.find((s) => s.id === a.skillId),
                  ),
                ),
              ),
            ];
            ok(
              JSON.stringify(topics) === JSON.stringify(expected),
              `${label}: theme topics are the activities' topics`,
            );
            ok(themeText(topics, lang).length > 0, `${label}: a theme to show`);
          }
        }
      }
    }
  }
}
ok(rows > 1000, `swept ${rows} rows`);
ok(withReason > 0, "records that call for review produce reasons somewhere in the sweep");

// A mixed pattern + money + addition mission is not "Money"
const mixed = missionTopics(
  [
    { gameId: "pattern-detective", skillId: "k-core" },
    { gameId: "math-market", skillId: "costs-more" },
    { gameId: "math-match", skillId: "g1-add" },
  ],
  games,
);
ok(
  JSON.stringify(mixed) === JSON.stringify(["patterns-algebra", "money", "addition-subtraction"]),
  "pattern, money and addition are three topics",
);
ok(
  themeText(mixed, "en") === "Patterns and algebra · Money · Adding and subtracting",
  "the theme names all three",
);
ok(themeText(mixed, "es") === "Patrones y álgebra · Dinero · Sumar y restar", "and in Spanish");

// A chosen skill gets a one-row mission that opens that skill
const array = byId.get("array-architect");
const g8 = array.skills.find((s) => s.id === "g8-expand");
const directed = directedSkillPlan({
  game: array,
  skill: g8,
  grade: 8,
  minutes: 5,
  mode: "together",
  level: 2,
});
const [only] = missionItems({
  plan: directed,
  games,
  recs: [],
  context: { grade: 8, profile: 1, lang: "es", mode: "together" },
});
const q = new URL(only.href, "https://example.test/").searchParams;
ok(
  q.get("game") === "array-architect" &&
    q.get("skill") === "g8-expand" &&
    q.get("level") === "2" &&
    q.get("mode") === "together" &&
    q.get("lang") === "es" &&
    q.get("profile") === "1",
  "a directed skill row opens that skill with its context",
);
ok(only.reason === null && /binomios/i.test(only.note), "no reason line, and the binomial note");

ok(
  showsReason("review") &&
    showsReason("weak") &&
    showsReason("stretch") &&
    !showsReason("new") &&
    !showsReason(undefined),
  "only evidence-based reasons are shown",
);
console.log(`fm2 mission: ${checks} checks passed.`);

// WIDA 2020 ELD Standard 3: language used to make sense of mathematics.
// These are instructional prompts, never answers or a language proficiency score.
import { getLang, t } from "./i18n.js";
import { framesFor } from "./language-frames.js";
import { getLevel } from "./language-settings.js";
import { languageProfile } from "./language-terms.js";

const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const expectations = () => ({
  1: { use: t("Inform"), code: "ELD-MA.1.Inform", goal: t("Name and describe a mathematical idea or pattern.") },
  2: { use: t("Explain / Argue"), code: "ELD-MA.2-3.Explain; ELD-MA.2-3.Argue", goal: t("Describe steps and give a reason using a model or fact.") },
  3: { use: t("Explain / Argue"), code: "ELD-MA.2-3.Explain; ELD-MA.2-3.Argue", goal: t("Describe steps and justify a pattern or strategy.") },
  4: { use: t("Explain / Argue"), code: "ELD-MA.4-5.Explain; ELD-MA.4-5.Argue", goal: t("Explain a strategy and justify it with a pattern or rule.") },
  5: { use: t("Explain / Argue"), code: "ELD-MA.4-5.Explain; ELD-MA.4-5.Argue", goal: t("Compare strategies and justify a conclusion with a model or rule.") },
  6: { use: t("Explain / Argue"), code: "ELD-MA.6-8.Explain; ELD-MA.6-8.Argue", goal: t("Explain how a representation works and justify a conclusion.") },
  7: { use: t("Explain / Argue"), code: "ELD-MA.6-8.Explain; ELD-MA.6-8.Argue", goal: t("Compare strategies and support a claim with mathematical evidence.") },
  8: { use: t("Explain / Argue"), code: "ELD-MA.6-8.Explain; ELD-MA.6-8.Argue", goal: t("Evaluate a mathematical argument and generalize across cases.") },
});

export function languageExpectation(grade) {
  const all = expectations();
  return all[Number(grade)] || all[6];
}

export function languageMoves(skill) {
  const topic = skill?.title || skill?.name || "this problem";
  const strand = (skill?.strand || topic).toLowerCase();
  const compare = /compare|fraction|ratio|rate|percent|decimal|proportion|probability|data|association/.test(strand);
  const equation = /equation|expression|function|system|balance|inequal/.test(strand);
  const geometry = /area|volume|perimeter|geometry|slope|transform/.test(strand);
  const vocabulary = languageProfile(skill).terms.map((term) => (getLang() === "es" ? term.es : term.en));
  return {
    topic,
    vocabulary,
    notice: compare ? t("What quantities or parts are being compared?") : equation ? t("What is known? What is unknown?") : geometry ? t("What do the diagram and units show?") : t("What do you notice about the numbers or pattern?"),
    explain: compare ? t("How did you compare or scale the quantities?") : equation ? t("How did you keep the relationship true?") : geometry ? t("How does the model show your calculation?") : t("Which strategy did you use, and why did it help?"),
    argue: t("How could a model, related fact, or different method check your claim?"),
  };
}

// One starter each for notice, explain and check, at the learner's chosen level, in the page language.
const starters = (level) =>
  ["notice", "explain", "check"]
    .map((fn) => framesFor(level >= 4 ? 3 : level, fn)[0])
    .filter(Boolean)
    .map((frame) => `“${escapeHtml(getLang() === "es" ? frame.es : frame.en)}”`)
    .join(" ");

export function languagePromptHtml(skill, { compact = false, heading = t("Talk or think about the math") } = {}) {
  const grade = skill?.grade || 6;
  const level = getLevel();
  const standard = languageExpectation(grade);
  const moves = languageMoves(skill);
  return `<aside class="language-bridge${compact ? " language-bridge-compact" : ""}" aria-label="${escapeHtml(t("Math language support"))}">
    <details>
      <summary>${escapeHtml(heading)} <span class="language-bridge-standard">${escapeHtml(standard.use)}</span></summary>
      <div class="language-bridge-body">
        <p class="language-bridge-goal"><strong>${escapeHtml(t("Language goal:"))}</strong> ${escapeHtml(standard.goal)} <small>${escapeHtml(standard.code)}</small></p>
        <ol class="language-bridge-moves">
          <li><strong>${escapeHtml(t("Notice:"))}</strong> ${escapeHtml(moves.notice)}</li>
          <li><strong>${escapeHtml(grade === 1 ? t("Describe:") : t("Explain:"))}</strong> ${escapeHtml(moves.explain)}</li>
          <li><strong>${escapeHtml(t("Check:"))}</strong> ${escapeHtml(moves.argue)}</li>
        </ol>
        <p class="language-bridge-frames"><strong>${escapeHtml(t("Try a start:"))}</strong> ${starters(level)}</p>
        <p class="language-bridge-support">${escapeHtml(t("Point, draw, speak, or write. You may think in a home language first and then try English. Ask a partner: “How do you know?”"))}</p>
        <p class="language-bridge-vocab"><strong>${escapeHtml(t("Useful words:"))}</strong> ${moves.vocabulary.map(escapeHtml).join(" · ")}</p>
      </div>
    </details>
  </aside>`;
}

export function languagePrintPrompt(skill) {
  const moves = languageMoves(skill);
  return `${t("Notice:")} ${moves.notice} ${t("Explain:")} ${moves.explain} ${t("Check:")} ${moves.argue}`;
}

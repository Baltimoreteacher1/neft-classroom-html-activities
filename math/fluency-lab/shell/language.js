// Language support at the point of need, drawn from the lab's one bilingual bank, so a word means the same thing on
// every screen: the skill's key terms (language-terms.js) with a short definition in both languages, and a sentence
// frame for explaining thinking after an answer (language-frames.js). Frames hold no numbers, so none can leak.
import { DEFAULT_LEVEL, framesFor, promptFor, startingFunction } from "../language-frames.js";
import { languageProfile } from "../language-terms.js";
import { esc, lang, tr } from "./words.js";

// Up to four terms; the interface language leads and the other language follows, so an English learner sees
// "ratio · razón" and a Spanish reader "razón · ratio". Cognates are marked: they are a bridge, not a coincidence.
export function wordsToKnow(skill) {
  const terms = (languageProfile(skill).terms || []).filter(Boolean).slice(0, 4);
  if (!terms.length) return "";
  const es = lang() === "es";
  const rows = terms
    .map((t) => {
      const [lead, other] = es ? [t.es, t.en] : [t.en, t.es];
      const def = es ? t.defEs || t.defEn : t.defEn;
      return `<div class="term"><dt><span lang="${es ? "es" : "en"}">${esc(lead)}</span> <span class="term-other" lang="${es ? "en" : "es"}">· ${esc(other)}${t.cognate ? ` <span class="tag">${esc(tr("similar word"))}</span>` : ""}</span></dt><dd>${esc(def || "")}</dd></div>`;
    })
    .join("");
  return `<details class="words"><summary>${esc(tr("Words to know"))}</summary><dl class="terms">${rows}</dl></details>`;
}

// One prompt and two frames, collapsed: offered, never required. After a miss it opens on "fix it".
export function explainFrame({ correct, count }) {
  const fn = startingFunction({ correct, count });
  const prompt = promptFor(fn);
  const frames = framesFor(DEFAULT_LEVEL, fn).slice(0, 2);
  if (!frames.length) return "";
  const pick = (pair) => (lang() === "es" ? pair.es : pair.en);
  return `<details class="say-it"><summary>${esc(tr("Explain your thinking"))}</summary>
    <p class="say-prompt">${esc(pick(prompt))}</p>
    <ul class="frames">${frames.map((f) => `<li>${esc(pick(f)).replaceAll("___", '<span class="blank" aria-label="blank">____</span>')}</li>`).join("")}</ul></details>`;
}

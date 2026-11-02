// Shared shell for the Family Math pages added in Fluency Lab 4.0 (achievements, report): learner and language bar, saved
// evidence for the chosen learner, and one redraw function. Language is shared with the rest of the lab (ewl-fluency-lang-v1).
import { cleanRewards } from "../rewards.js";
import { loadGrowth } from "../growth-access.js";
import { getLang as labLang, setLang as setLabLang } from "../i18n.js";
import { profileKey, readLocal } from "../school-tools.js";
import { emptyTutor, sanitizeTutor } from "../tutor-engine.js";
import { loadTrail } from "../fact-trail.js";
import { addLearner, activeProfile, renderTopbar, startLanguage, switchLanguage } from "./fm2/page-kit.js";
import { selectProfile } from "../school-tools.js";

export const TUTOR_KEY = "ewl-fluency-tutor-v2";
export const REWARDS_KEY = "ewl-fluency-rewards-v1";

export const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// Everything a page needs for one learner, read fresh each time.
export async function loadEvidence(profile) {
  const growth = await loadGrowth(profile);
  return {
    tutor: sanitizeTutor(readLocal(profileKey(TUTOR_KEY, profile), emptyTutor())),
    rewards: cleanRewards(readLocal(profileKey(REWARDS_KEY, profile), {})),
    trail: loadTrail(),
    ...growth,
  };
}

// draw(state) paints the page body. The shell redraws it after a language, learner or storage change.
export function bootPage({ draw, onProfile = () => {} }) {
  const params = new URLSearchParams(location.search);
  const state = { lang: startLanguage(params), profile: activeProfile(params), params };
  setLabLang(state.lang, { persist: false });
  const paint = async () => {
    renderTopbar(state.lang);
    document.documentElement.lang = state.lang;
    await draw(state);
  };
  document.addEventListener("click", (event) => {
    if (event.target.closest("#lang-toggle")) {
      state.lang = switchLanguage(state.lang);
      setLabLang(state.lang, { persist: false });
      paint();
    } else if (event.target.closest("#add-learner")) {
      const next = addLearner();
      if (next === null) return;
      state.profile = next;
      onProfile(state);
      paint();
    }
  });
  document.addEventListener("change", (event) => {
    if (event.target.id !== "family-profile") return;
    state.profile = Number(event.target.value);
    selectProfile(state.profile);
    onProfile(state);
    paint();
  });
  return paint();
}
export { labLang };

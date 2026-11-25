// Assembles one unit's Family Guide in the fixed order: hero, learn, words, talk, try, play, say, help,
// language, celebrate, resources. Each section ends with one quiet "next" link, so every screen has a
// single obvious next action.

import { C } from "./family-copy.js";
import { bi, esc } from "./family-util.js";
import { PLAN, planHtml } from "./family-plan-view.js";
import { heroHtml, learnHtml, talkHtml, wordsHtml } from "./family-view-learn.js";
import { celebrateHtml, helpHtml, languageHtml, navHtml, playHtml, resourcesHtml, sayHtml, tryHtml } from "./family-view-do.js";

const SECTIONS = [
  { id: "learn", head: C.learnHead, icon: "🌱", body: (g) => learnHtml(g) },
  { id: "plan", head: PLAN.head, icon: "📅", body: (g, s) => (s.planOn ? planHtml(g, s.week, s.planDone) : "") },
  { id: "words", head: C.wordsHead, icon: "🔤", body: (g) => wordsHtml(g) },
  { id: "talk", head: C.talkHead, icon: "💬", body: (g) => talkHtml(g), badge: C.anyLanguage },
  { id: "try", head: C.tryHead, icon: "🧪", body: (g, s) => tryHtml(g, s.done) },
  { id: "play", head: C.playHead, icon: "🎲", body: (g) => playHtml(g) },
  { id: "say", head: C.sayHead, icon: "🗣️", body: (g) => sayHtml(g) },
  { id: "help", head: C.helpHead, icon: "🤝", body: (g) => helpHtml(g) },
  { id: "language", head: C.languageHead, icon: "🌎", body: (g) => languageHtml(g) },
  { id: "celebrate", head: C.celebrateHead, icon: "🎉", body: (g) => celebrateHtml(g) },
  { id: "resources", head: C.resourcesHead, icon: "📎", body: (g) => resourcesHtml(g) },
];

export function guideHtml(guide, state, urlFor) {
  const built = SECTIONS.map((s) => ({ ...s, html: s.body(guide, state) })).filter((s) => s.html);
  const sections = built
    .map((s, i) => {
      const next = built[i + 1];
      return `<section class="fb-section" id="${s.id}" aria-labelledby="${s.id}Head">
        <header class="fb-section-head">
          <span class="fb-section-icon" aria-hidden="true">${s.icon}</span>
          <h2 id="${s.id}Head">${bi(s.head)}</h2>
          ${s.badge ? `<span class="fb-badge is-sage">${bi(s.badge)}</span>` : ""}
        </header>
        ${s.html}
        ${next ? `<a class="fb-next" href="#${next.id}">${bi({ en: `${C.nextUp.en}: ${next.head.en}`, es: `${C.nextUp.es}: ${next.head.es}` })} <span aria-hidden="true">↓</span></a>` : ""}
      </section>`;
    })
    .join("");
  return `${heroHtml(guide, built[0]?.id || "words")}
    ${guide.authored ? "" : `<p class="fb-note">${bi(C.fallbackNote)}</p>`}
    ${sections}
    ${navHtml(guide, urlFor)}`;
}

export const unitTitle = (guide) => esc(guide.unit.title);

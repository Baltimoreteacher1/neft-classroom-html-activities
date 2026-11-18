// Student Hub (/students): the student door. Three steps, each one a URL so Back always works:
//   1. grade (?pick=, or the grade this device chose before; K, 1 and 2–3 go to their own early hub at /early),
//   2. "What do you want to do today?": six big picture doors into existing places (destinations come from
//      src/sitemap.js) plus one-click "Start practicing",
//   3. smart start (?skill= then ?support=): skill, then how much help, then a real five-activity Jump in set
//      (src/quick-start.js), started as a practice session so it ends on the "You finished!" screen.
// Continue appears only when this device has real unfinished work (the same rules as the home Continue card).
import { rememberAudience } from "../audience.js";
import { isEarlyBand } from "../bands.js";
import { bandDomains, loadStudioIndex } from "../content.js";
import { getEngagement } from "../engagement.js";
import { activeGradeFocus } from "../grade-focus.js";
import { GRADE_PICKS, currentPick, resolvePick } from "../grade-bands.js";
import { latestModuleResume } from "../home-resume.js";
import { i18nFor } from "../i18n.js";
import { loadStudio } from "../lang/studio.js";
import { jumpSetAttrs, pickSet, practicePool } from "../quick-start.js";
import { DEST_BY_ID, SECTION_BY_ID } from "../sitemap.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, TIERS, html, icon } from "../util.js";
import { continueTarget, recentRoom } from "./home-start.js";

const SKILLS = [...CORE_DOMAINS, "mix"];
const SUPPORT_LABEL = {
  A: ["More support", "Más apoyo"],
  B: ["Some support", "Algo de apoyo"],
  C: ["More on my own", "Más por mi cuenta"],
};

/** Where a band's Student Hub is: the early hub for K–3, this page for grades 3–8. */
export const studentHubHref = (band) =>
  isEarlyBand(band) ? `${BASE}/early?grades=${band}` : `${BASE}/students?grades=${band}`;

/** A ?pick= value: a picker id ("4-5"), or a content band a shared link may carry ("3-5" opens Grades 4–5). */
export function pickFrom(value) {
  if (GRADE_PICKS.some((p) => p.id === value)) return value;
  return GRADE_PICKS.find((p) => p.content.includes(value))?.id || "";
}

const sectionHref = (id, band) => (SECTION_BY_ID[id] ? `${BASE}/explore/${id}?grades=${band}` : "");
const destHref = (id, band) => {
  const d = DEST_BY_ID[id];
  if (!d) return "";
  return d.href.startsWith("/")
    ? d.href
    : `${BASE}/${d.href}${d.href.includes("?") ? "&" : "?"}grades=${band}`;
};

/** The big doors, each into a place that already exists. Pictures are the lab's own spot art. */
export const doors = (band) =>
  [
    {
      id: "play",
      art: "ds/studio-mission",
      href: sectionHref("play", band),
      name: ["Play a game", "Jugar un juego"],
      line: [
        "Language games and worlds. No timers.",
        "Juegos y mundos de lenguaje. Sin cronómetro.",
      ],
    },
    {
      id: "practice",
      art: "ds/hero",
      href: sectionHref("practice", band),
      name: ["Practice English", "Practicar inglés"],
      line: ["Listen, read, speak and write.", "Escucha, lee, habla y escribe."],
    },
    {
      id: "story",
      art: "worlds/storyworks",
      href: destHref("reading-room", band),
      name: ["Explore a story", "Explorar un cuento"],
      line: [
        "Read picture stories and talk about them.",
        "Lee cuentos con dibujos y habla de ellos.",
      ],
    },
    {
      id: "book",
      art: "ds/band-68-studio",
      href: destHref("book-studio", band),
      name: ["Create a book", "Crear un libro"],
      line: ["Write and draw your own book.", "Escribe y dibuja tu propio libro."],
    },
    {
      id: "progress",
      art: "ds/progress-passport",
      href: sectionHref("progress", band),
      name: ["My progress", "Mi progreso"],
      line: ["Your Passport, stamps and journey.", "Tu pasaporte, sellos y recorrido."],
    },
  ].filter((d) => d.href);

const hubUrl = (pick, band, extra = {}) =>
  `${BASE}/students?${new URLSearchParams({ pick, grades: band, ...extra })}`;

function pickerHTML(I, chosen) {
  return html`<section class="stu-step stu-grade" aria-labelledby="stuGradeLabel">
    <h2 class="stu-step-title" id="stuGradeLabel">
      ${I.T("First, what grade are you in?", "Primero, ¿en qué grado estás?")}
    </h2>
    <div class="tb-picker-btns stu-grade-btns">
      ${GRADE_PICKS.map((p) => {
        const band = p.content[0];
        const href = isEarlyBand(band)
          ? `${BASE}/early?grades=${band}`
          : `${BASE}/students?pick=${p.id}&grades=${band}`;
        return html`<a
          class="tb-pick"
          href="${href}"
          data-student-grade="${p.id}"
          aria-current="${p.id === chosen ? "true" : "false"}"
          ><span class="tb-pick-short">${p.short[0]}</span
          ><span class="tb-pick-name">${I.T(p.name[0], p.name[1])}</span></a
        >`;
      })}
    </div>
  </section>`;
}

function doorHTML(I, d, extra = "") {
  return html`<li class="stu-door is-${d.id}">
    <a href="${d.href}" data-student-door="${d.id}">
      <img
        src="${BASE}/pictures/${d.art}.svg"
        width="320"
        height="200"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span class="stu-door-text"
        ><strong>${I.T(...d.name)}</strong><span>${extra || I.T(...d.line)}</span></span
      >
      <span class="stu-go" aria-hidden="true">${icon("arrow-right")}</span>
    </a>
  </li>`;
}

/** Real unfinished work on this device for the band, or null (never a made-up "continue"). */
async function resumeTarget(I, ctx, band) {
  const engagement = getEngagement(ctx.prefs);
  const resume = engagement.activeSession?.band === band ? engagement.activeSession : null;
  const studio = loadStudio();
  const idx = await loadStudioIndex().catch(() => null);
  const open = Object.entries(studio.missions || {})
    .filter(([, m]) => m.started && !m.done)
    .sort(
      ([, a], [, b]) =>
        (Date.parse(b.updatedAt || b.started || "") || 0) -
        (Date.parse(a.updatedAt || a.started || "") || 0),
    )[0];
  const domains = await bandDomains(band).catch(() => ({}));
  const target = continueTarget(I, {
    band,
    resume,
    openMission: open
      ? { id: open[0], started: open[1].started, updatedAt: open[1].updatedAt }
      : null,
    journey: null,
    recent: recentRoom(band, domains, activeGradeFocus(ctx.prefs, band)),
    moduleResume: latestModuleResume({ band, studio, index: idx || {} }),
  });
  return target && target.kind !== "start" && target.href?.startsWith(BASE) ? target : null;
}

const chip = (href, on, label, attrs = "") =>
  html`<a class="stu-chip" href="${href}" aria-current="${on ? "true" : "false"}" ${attrs}
    >${label}</a
  >`;

/** Smart start: skill, then help, then Start. Each choice is a link so the URL holds the state. */
function smartHTML(I, { pick, band, skill, support, pool }) {
  const skillName = (d) =>
    d === "mix" ? I.T("Surprise me", "Sorpréndeme") : I.T(DOMAIN_META[d].name, DOMAIN_META[d].es);
  const skillIcon = (d) => icon(d === "mix" ? "sparkle" : DOMAIN_META[d].icon);
  const skills = SKILLS.filter((d) => d === "mix" || pool.atLevel.some((r) => r.domain === d));
  const set =
    skill && support
      ? pickSet(pool.atLevel, pool.isDone, { domain: skill === "mix" ? "" : skill })
      : [];
  const title =
    skill === "mix" || !skill
      ? I.S("Quick practice · all four skills", "Práctica rápida · las cuatro destrezas")
      : I.S(
          `Quick practice · ${DOMAIN_META[skill].name}`,
          `Práctica rápida · ${DOMAIN_META[skill].es}`,
        );
  return html`<section class="stu-smart panel" id="stuSmart" aria-labelledby="stuSmartTitle">
    <h2 id="stuSmartTitle">${I.T("Build my practice", "Arma mi práctica")}</h2>
    <div class="stu-q" role="group" aria-labelledby="stuQ1">
      <p class="stu-q-label" id="stuQ1">
        <span class="stu-num" aria-hidden="true">1</span
        >${I.T("What would you like to practice?", "¿Qué te gustaría practicar?")}
      </p>
      <div class="stu-chips">
        ${skills.map((d) => chip(hubUrl(pick, band, { skill: d, ...(support ? { support } : {}) }), d === skill, html`${skillIcon(d)} ${skillName(d)}`, `data-student-skill="${d}"`))}
      </div>
    </div>
    ${
      skill
        ? html`<div class="stu-q" role="group" aria-labelledby="stuQ2">
            <p class="stu-q-label" id="stuQ2">
              <span class="stu-num" aria-hidden="true">2</span
              >${I.T("More help, or more on your own?", "¿Más ayuda o más por tu cuenta?")}
            </p>
            <div class="stu-chips">
              ${pool.levels.map((l) => chip(hubUrl(pick, band, { skill, support: l }), l === support, html`<strong>${I.T(...SUPPORT_LABEL[l])}</strong><span>${I.T(TIERS[l].name, TIERS[l].es)}</span>`, `data-student-support="${l}"`))}
            </div>
          </div>`
        : ""
    }
    ${
      set.length
        ? html`<div class="stu-q stu-ready">
            <p class="stu-q-label">
              <span class="stu-num" aria-hidden="true">3</span
              >${I.T(`Ready: ${set.length} short activities`, `Listo: ${set.length} actividades cortas`)}
            </p>
            <a
              class="btn btn-primary btn-big stu-start"
              ${jumpSetAttrs(band, set, title)}
              data-student-start
              >${I.T("Start", "Empezar")} ${icon("arrow-right")}</a
            >
          </div>`
        : skill && support
          ? html`<p class="fine">
              ${I.T("Nothing to practice here yet. Try another skill.", "Todavía no hay práctica aquí. Prueba otra destreza.")}
            </p>`
          : ""
    }
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  rememberAudience("student");
  const route = ctx.route || {};
  const asked = route.pick === "choose";
  const fromUrl = pickFrom(route.pick);
  const pick = asked
    ? ""
    : fromUrl || (ctx.prefs.gradePick ? currentPick(ctx.band, ctx.prefs.gradePick, ctx.bands) : "");
  if (fromUrl && fromUrl !== ctx.prefs.gradePick) ctx.setPrefs({ gradePick: fromUrl });
  const band = pick ? resolvePick(pick, ctx.bands).band : "";
  const head = html`<header class="stu-head">
    <p class="eyebrow">${icon("sparkle")} ${I.T("For students", "Para estudiantes")}</p>
    <h1 id="stuTitle" tabindex="-1">
      ${I.T("What do you want to do today?", "¿Qué quieres hacer hoy?")}
    </h1>
    <p class="lead">${I.T("Choose your grade, then pick one way to learn. You can change your choice anytime.", "Elige tu grado y después una forma de aprender. Puedes cambiar de opción cuando quieras.")}</p>
  </header>`;
  const title = I.S(
    "Students: what do you want to do today?",
    "Estudiantes: ¿qué quieres hacer hoy?",
  );
  if (!band || isEarlyBand(band))
    return {
      title,
      html: html`<article class="stu-page" aria-labelledby="stuTitle">
        ${head}
        ${band ? html`<p class="lead"><a class="btn btn-primary btn-big" href="${studentHubHref(band)}" data-student-early>${I.T("Open your practice", "Abre tu práctica")} ${icon("arrow-right")}</a></p>` : ""}
        ${pickerHTML(I, pick)}
      </article>`,
    };
  const skill = SKILLS.includes(route.skill) ? route.skill : "";
  const pool = await practicePool({ band, prefs: ctx.prefs }, { level: route.support });
  const support = pool.levels.includes(route.support) ? route.support : "";
  const quick = pickSet(pool.atLevel, pool.isDone);
  const resume = await resumeTarget(I, ctx, band);
  const gradeName = GRADE_PICKS.find((p) => p.id === pick)?.name || ["", ""];
  return {
    title,
    html: html`<article class="stu-page" aria-labelledby="stuTitle">
      ${head}
      <div class="stu-bar">
        <p class="stu-grade-now">
          ${I.T(gradeName[0], gradeName[1])} ·
          <a href="${BASE}/students?pick=choose&grades=${band}"
            >${I.T("Change grade", "Cambiar grado")}</a
          >
        </p>
        ${quick.length ? html`<a class="btn btn-primary btn-big stu-quick" ${jumpSetAttrs(band, quick, I.S("Quick practice · all four skills", "Práctica rápida · las cuatro destrezas"))} data-student-quick>${icon("play")} ${I.T("Start practicing", "Empezar a practicar")}</a>` : ""}
      </div>
      <section class="stu-library" aria-labelledby="stuLibraryTitle">
        <div class="stu-section-head">
          <div>
            <p class="eyebrow">${I.T("Your learning library", "Tu biblioteca de aprendizaje")}</p>
            <h2 id="stuLibraryTitle">${I.T("Pick a place to start", "Elige por dónde empezar")}</h2>
          </div>
          <a class="stu-all" href="${BASE}/search?for=student&grades=${band}">${I.T("Find all activities", "Buscar todas las actividades")} ${icon("arrow-right")}</a>
        </div>
        <ul class="stu-doors" role="list">
          ${resume ? doorHTML(I, { id: "continue", art: "ds/progress-growth", href: resume.href, name: ["Continue where I left off", "Seguir donde lo dejé"] }, resume.title) : ""}
          ${doors(band).map((d) => doorHTML(I, d))}
        </ul>
      </section>
      ${pool.rows.length ? smartHTML(I, { pick, band, skill, support, pool }) : ""}
    </article>`,
  };
}

/** After a smart-start choice, bring the next question into view (the URL changed, so the page re-rendered). */
export function mount(root, ctx) {
  const r = ctx.route || {};
  // K, 1 and 2–3 have their own student hub (/early): a grade link or shared ?pick= goes straight there.
  const pick = pickFrom(r.pick);
  const band = pick ? resolvePick(pick, ctx.bands).band : "";
  if (band && isEarlyBand(band)) {
    ctx.navigate(studentHubHref(band), { replace: true });
    return;
  }
  if (!r.skill) return;
  const next =
    root.querySelector(r.support ? "[data-student-start]" : "#stuQ2") ||
    root.querySelector("#stuSmart");
  next?.scrollIntoView({ block: "center" });
  if (r.support) root.querySelector("[data-student-start]")?.focus({ preventScroll: true });
}

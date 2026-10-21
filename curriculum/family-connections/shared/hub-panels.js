/* =============================================================================
 * shared/hub-panels.js — the three pieces of the weekly hub that are not the
 * list of nights: the "Tonight anyway" panel (no homework posted), the welcome
 * note from Mr. Neft, and a night's time chooser.
 * -----------------------------------------------------------------------------
 * Every string is written in both languages here, in the same place, so the
 * Spanish lane cannot be forgotten. Text is set as text, never as HTML.
 * ========================================================================== */
import { el, link } from "./hub-dom.js";
import {
  DEFAULT_ROUTE,
  homeworkHref,
  minutesLabel,
  PRODUCT_NAME,
  ROUTES,
  SECONDARY_ROUTES,
  SESSION_LABELS,
} from "./hub-routes.js";

export const DAILY_BOOST_PATH = "/math/practice-studio/boost/";
export const BROWSE_LESSONS_PATH = "/curriculum/units/";

const pick = (lang, en, es) => (lang === "es" ? es : en);

/**
 * Nothing is posted: a warm, optional place to go instead of a dead end.
 * `catchUpHref` is null when there is no earlier plan to open.
 */
export function tonightAnywayPanel(lang, catchUpHref) {
  const t = (en, es) => pick(lang, en, es);
  const panel = el("section", undefined, "tonight-anyway");
  panel.setAttribute("aria-labelledby", "tonight-anyway-title");
  const heading = el("h3", t("Tonight anyway", "Aun así, para esta noche"));
  heading.id = "tonight-anyway-title";
  panel.append(
    heading,
    el(
      "p",
      t(
        "No homework is posted yet. Everything here is optional.",
        "Todavía no hay tarea publicada. Todo lo que ves aquí es opcional.",
      ),
      "empty-state",
    ),
  );
  const tiles = el("div", undefined, "tonight-tiles");
  const tile = (href, title, detail, extraClass = "") => {
    const node = link(undefined, href, `tonight-tile${extraClass ? ` ${extraClass}` : ""}`);
    node.append(el("strong", title), el("span", detail));
    return node;
  };
  tiles.append(
    tile(
      DAILY_BOOST_PATH,
      t("5-minute Daily Boost", "Impulso diario de 5 minutos"),
      t("A few quick questions. Nothing is graded.", "Unas preguntas rápidas. Nada se califica."),
    ),
    tile(
      BROWSE_LESSONS_PATH,
      t("Practice any lesson", "Practica cualquier lección"),
      t(
        "Every lesson’s homework page is open all year.",
        "La página de tarea de cada lección está abierta todo el año.",
      ),
    ),
  );
  if (catchUpHref)
    tiles.append(
      tile(
        catchUpHref,
        t("Catch up on last week", "Ponte al día con la semana pasada"),
        t("Open the last plan Mr. Neft posted.", "Abre el último plan que publicó el Sr. Neft."),
        "catch-up-link",
      ),
    );
  panel.append(tiles);
  return panel;
}

const VIDEO_TYPES = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm" };
const CAPTION_LABELS = { en: "English", es: "Español" };

/** "A note from Mr. Neft": text in the family's language, optional captioned video. */
export function welcomeCard(note, lang) {
  const t = (en, es) => pick(lang, en, es);
  const card = el("section", undefined, "welcome-note");
  card.setAttribute("aria-labelledby", "welcome-note-title");
  const heading = el("h3", t("A note from Mr. Neft", "Una nota del Sr. Neft"));
  heading.id = "welcome-note-title";
  card.append(heading, el("p", pick(lang, note.en, note.es), "welcome-text"));
  if (note.video) {
    const { src, captions, poster } = note.video;
    const video = el("video", undefined, "welcome-video");
    video.setAttribute("controls", "");
    video.setAttribute("preload", "none");
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-labelledby", "welcome-note-title");
    if (poster) video.setAttribute("poster", poster);
    const source = el("source");
    source.setAttribute("src", src);
    source.setAttribute("type", VIDEO_TYPES[src.split(".").pop().toLowerCase()] ?? "video/mp4");
    video.append(source);
    for (const code of [lang, lang === "es" ? "en" : "es"]) {
      const track = el("track");
      track.setAttribute("kind", "captions");
      track.setAttribute("srclang", code);
      track.setAttribute("label", CAPTION_LABELS[code]);
      track.setAttribute("src", captions[code]);
      if (code === lang) track.setAttribute("default", "");
      video.append(track);
    }
    card.append(video);
  }
  return card;
}

/** Once per week, above the nights: which route we recommend and why the others exist. */
export function routeIntro(lang) {
  const t = (en, es) => pick(lang, en, es);
  const wrap = el("div", undefined, "route-intro");
  wrap.append(
    el(
      "p",
      t(
        `${PRODUCT_NAME.en} (${minutesLabel(DEFAULT_ROUTE)}) is the recommended route. The shorter routes are for busy nights.`,
        `El ${PRODUCT_NAME.es} (${minutesLabel(DEFAULT_ROUTE)}) es la ruta recomendada. Las rutas más cortas son para las noches con poco tiempo.`,
      ),
      "route-recommendation",
    ),
    el(
      "p",
      t(
        "Choose one route. Work saves on this device; bring your work or questions to class. It is not sent automatically.",
        "Elige una ruta. El trabajo se guarda en este dispositivo; lleva tu trabajo o preguntas a clase. No se envía automáticamente.",
      ),
      "assignment-guidance",
    ),
  );
  return wrap;
}

/**
 * One night's time chooser. The Family Math Studio is the primary, recommended
 * route (Joel's decision); the two shorter routes are for busy nights. Every
 * link names its route explicitly so the label is a promise: a family's saved
 * choice on the lesson page never silently turns "Start Family Math Studio"
 * into a different route.
 */
export function routeChooser({ lang, path, sectionId, linkLang, session }) {
  const t = (en, es) => pick(lang, en, es);
  const wrap = el("div", undefined, "route-choice");
  const where = { lang: linkLang, sectionId };
  const primary = link(
    `${t("Start", "Empezar el")} ${PRODUCT_NAME[lang === "es" ? "es" : "en"]} · ${minutesLabel(DEFAULT_ROUTE)}`,
    homeworkHref(path, { route: DEFAULT_ROUTE, ...where }),
    "button route-primary",
  );
  primary.append(
    el(
      "span",
      t(
        `${ROUTES[DEFAULT_ROUTE].label.en} route · recommended`,
        `Ruta del ${ROUTES[DEFAULT_ROUTE].label.es} · recomendada`,
      ),
      "route-sub",
    ),
  );
  const short = el("div", undefined, "route-short");
  short.append(el("span", t("Short on time?", "¿Poco tiempo?"), "route-short-label"));
  for (const route of SECONDARY_ROUTES)
    short.append(
      link(
        `${pick(lang, ROUTES[route].label.en, ROUTES[route].label.es)} · ${minutesLabel(route)}`,
        homeworkHref(path, { route, ...where }),
        "button button-secondary route-secondary",
      ),
    );
  wrap.append(primary, short);
  if (session) wrap.dataset.session = String(session);
  return wrap;
}

/** "Session 1: Concept Launch" — the lesson pages' own words. */
export const sessionLabel = (session, lang) =>
  SESSION_LABELS[session]?.[lang === "es" ? "es" : "en"] ?? "";

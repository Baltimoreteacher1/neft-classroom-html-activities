// English / Spanish chrome. Practice content stays in English (it is English
// practice); Spanish appears as support text, matching the lab's EN+ES pattern.
import { store } from "./store.js";

const STRINGS = {
  en: {
    "nav.arcade": "Arcade",
    "nav.journey": "My journey",
    "nav.how": "How it works",
    "hero.kicker": "Practice, not a test",
    "hero.title": "Five activities.<br />Real language moves.",
    "hero.sub":
      "Rebuilt classroom games for grades 3–8: deeper thinking, audio support, and feedback that teaches instead of scores.",
    "hero.continue": "Continue where you left off",
    "hero.start": "Start a quick session",
    "hero.startMission": "Start today’s mission",
    "hero.daily": "Today’s mission",
    "hero.dailySub": "Three small wins. About six minutes.",
    "player.level": "Level",
    "player.toNext": "xp to next level",
    "player.games": "activities",
    "player.accuracy": "accuracy",
    "player.streak": "day streak",
    "filter.all": "All skills",
    "filter.count": "activities",
    "filter.band": "Grade band",
    "grid.title": "Choose an activity",
    "grid.sub": "Every activity has a grades 3–5 and a grades 6–8 version.",
    "card.play": "Play",
    "card.replay": "Play again",
    "card.minutes": "min",
    "card.best": "Best",
    "card.band": "Grades",
    "card.new": "New",
    "journey.title": "My journey",
    "journey.sub": "Saved on this device only. Nothing is sent anywhere.",
    "journey.badges": "Badges",
    "journey.empty": "Play an activity to start your journey.",
    "journey.reset": "Clear my progress",
    "journey.resetConfirm": "Clear all arcade progress on this device?",
    "journey.next": "Suggested next step",
    "how.title": "How the arcade works",
    "how.p1":
      "Each activity is a short, self-contained game built around one language move: fixing a sentence, matching a word to its meaning, proving an idea with evidence, building a word from its syllables, or echoing a sentence aloud.",
    "how.p2":
      "There are no timers, rankings or failing scores. A miss gets a short explanation and another round. Stars describe accuracy in that session, not a proficiency level.",
    "how.p3":
      "Everything is saved in this browser. Audio uses your device’s built-in voice; microphone practice asks permission and never uploads a recording.",
    "how.close": "Got it",
    "skill.Listening": "Listening",
    "skill.Reading": "Reading",
    "skill.Speaking": "Speaking",
    "skill.Writing": "Writing",
    "band.3-5": "Grades 3–5",
    "band.6-8": "Grades 6–8",
    "daily.one": "Finish one activity",
    "daily.two": "Earn 2 stars in any activity",
    "daily.three": "Try a different skill",
    "badge.locked": "Locked",
    "common.back": "Back to the arcade",
    "common.close": "Close",
    "common.again": "Play again",
    "common.listen": "Listen",
    "common.stop": "Stop",
    "common.continue": "Continue",
    "common.loading": "Loading activity…",
    "common.restart": "Restart",
    "common.quit": "Leave activity",
    "common.sound": "Sound",
    "common.textSize": "Text size",
    "common.motion": "Motion",
    "common.language": "Language",
    "common.pause": "Pause",
    "common.stars": "stars",
    "common.try": "Try again",
    "common.next": "Next activity",
    "common.hint": "Need a hint?",
    "common.skip": "Skip for now",
    "game.round": "Round",
    "game.of": "of",
    "game.score": "Score",
    "game.combo": "combo",
    "game.paused": "Paused",
    "game.pausedSub": "Take your time. Nothing is running.",
    "game.resume": "Keep playing",
    "game.correct": "That’s it",
    "game.partial": "Almost there",
    "game.incorrect": "Not yet — and that’s useful",
    "game.session": "Session complete",
    "game.accuracy": "Accuracy",
    "game.bestStreak": "Best streak",
    "game.xp": "XP earned",
    "game.review": "Worth another look",
    "game.reviewEmpty": "Nothing to revisit. Clean session.",
    "game.levelUp": "Level up",
    "game.recommend": "Try next",
    "game.tooHard": "Play the other grade band",
    "game.quitTitle": "Leave this activity?",
    "game.quitSub": "Your progress in this session will end. Saved XP stays.",
    "micro.one": "One move at a time.",
  },
  es: {
    "nav.arcade": "Arcade",
    "nav.journey": "Mi recorrido",
    "nav.how": "Cómo funciona",
    "hero.kicker": "Práctica, no un examen",
    "hero.title": "Cinco actividades.<br />Movimientos reales del idioma.",
    "hero.sub":
      "Juegos de clase renovados para 3.º a 8.º grado: más razonamiento, apoyo de audio y comentarios que enseñan en vez de calificar.",
    "hero.continue": "Seguir donde lo dejaste",
    "hero.start": "Empezar una sesión corta",
    "hero.startMission": "Empezar la misión de hoy",
    "hero.daily": "Misión de hoy",
    "hero.dailySub": "Tres logros pequeños. Unos seis minutos.",
    "player.level": "Nivel",
    "player.toNext": "xp para el próximo nivel",
    "player.games": "actividades",
    "player.accuracy": "precisión",
    "player.streak": "días seguidos",
    "filter.all": "Todas las destrezas",
    "filter.count": "actividades",
    "filter.band": "Banda de grados",
    "grid.title": "Elige una actividad",
    "grid.sub": "Cada actividad tiene una versión para 3.º–5.º y otra para 6.º–8.º.",
    "card.play": "Jugar",
    "card.replay": "Jugar otra vez",
    "card.minutes": "min",
    "card.best": "Mejor",
    "card.band": "Grados",
    "card.new": "Nueva",
    "journey.title": "Mi recorrido",
    "journey.sub": "Se guarda solo en este dispositivo. No se envía nada.",
    "journey.badges": "Insignias",
    "journey.empty": "Juega una actividad para empezar tu recorrido.",
    "journey.reset": "Borrar mi progreso",
    "journey.resetConfirm": "¿Borrar todo el progreso del arcade en este dispositivo?",
    "journey.next": "Siguiente paso sugerido",
    "how.title": "Cómo funciona el arcade",
    "how.p1":
      "Cada actividad es un juego corto y completo alrededor de un movimiento del idioma: corregir una oración, unir una palabra con su significado, probar una idea con evidencia, formar una palabra con sus sílabas o repetir una oración en voz alta.",
    "how.p2":
      "No hay cronómetros, clasificaciones ni notas de reprobado. Un error recibe una explicación breve y otra ronda. Las estrellas describen la precisión de esa sesión, no un nivel de dominio.",
    "how.p3":
      "Todo se guarda en este navegador. El audio usa la voz de tu dispositivo; la práctica con micrófono pide permiso y nunca sube una grabación.",
    "how.close": "Entendido",
    "skill.Listening": "Escucha",
    "skill.Reading": "Lectura",
    "skill.Speaking": "Habla",
    "skill.Writing": "Escritura",
    "band.3-5": "Grados 3–5",
    "band.6-8": "Grados 6–8",
    "daily.one": "Termina una actividad",
    "daily.two": "Gana 2 estrellas en una actividad",
    "daily.three": "Prueba otra destreza",
    "badge.locked": "Bloqueada",
    "common.back": "Volver al arcade",
    "common.close": "Cerrar",
    "common.again": "Jugar otra vez",
    "common.listen": "Escuchar",
    "common.stop": "Detener",
    "common.continue": "Continuar",
    "common.loading": "Cargando actividad…",
    "common.restart": "Reiniciar",
    "common.quit": "Salir de la actividad",
    "common.sound": "Sonido",
    "common.textSize": "Tamaño del texto",
    "common.motion": "Movimiento",
    "common.language": "Idioma",
    "common.pause": "Pausa",
    "common.stars": "estrellas",
    "common.try": "Intentar de nuevo",
    "common.next": "Siguiente actividad",
    "common.hint": "¿Necesitas una pista?",
    "common.skip": "Saltar por ahora",
    "game.round": "Ronda",
    "game.of": "de",
    "game.score": "Puntos",
    "game.combo": "combo",
    "game.paused": "En pausa",
    "game.pausedSub": "Con calma. No hay nada corriendo.",
    "game.resume": "Seguir jugando",
    "game.correct": "Eso es",
    "game.partial": "Casi",
    "game.incorrect": "Todavía no — y eso sirve",
    "game.session": "Sesión completada",
    "game.accuracy": "Precisión",
    "game.bestStreak": "Mejor racha",
    "game.xp": "XP ganados",
    "game.review": "Para mirar otra vez",
    "game.reviewEmpty": "Nada que repasar. Sesión limpia.",
    "game.levelUp": "Subiste de nivel",
    "game.recommend": "Prueba ahora",
    "game.tooHard": "Prueba la otra banda de grados",
    "game.quitTitle": "¿Salir de esta actividad?",
    "game.quitSub": "Tu progreso de esta sesión termina. Los XP guardados se quedan.",
    "micro.one": "Un movimiento a la vez.",
  },
};

export const LANGS = ["en", "es"];

export function setLang(lang) {
  if (!STRINGS[lang]) return;
  store.setSetting("lang", lang);
  document.documentElement.lang = lang;
}

export function lang() {
  return store.settings.lang === "es" ? "es" : "en";
}

export function t(key, vars) {
  const table = STRINGS[lang()] || STRINGS.en;
  let out = table[key] ?? STRINGS.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      out = out.replaceAll(`{${k}}`, String(v));
    });
  }
  return out;
}

/** Inline bilingual choice for one-off strings. */
export function L(en, es) {
  return lang() === "es" ? es : en;
}

export function applyChrome(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    node.innerHTML = t(node.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
}

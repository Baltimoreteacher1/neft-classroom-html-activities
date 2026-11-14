// Pure helpers for student-made scenes: the character list (the existing Real-Life Scenarios characters), the
// scene shape the scenario art draws, the reply order a player sees, and the copy for refused text.
import { characterSlug, SCENE_CHARACTERS, SCENE_PLACES } from "../../../shared/class-platform/social.js";
import { SCENES } from "../content/scenarios.js";

const byslug = new Map();
for (const s of SCENES)
  for (const npc of [s.npc, s.npc2].filter(Boolean)) if (!byslug.has(characterSlug(npc.name))) byslug.set(characterSlug(npc.name), npc);

/** Every character a learner can pick, in the shared order. */
export const CHARACTERS = SCENE_CHARACTERS.filter((id) => byslug.has(id)).map((id) => ({ id, ...byslug.get(id) }));
export const characterFor = (id) => byslug.get(id) || null;

export const PLACE_NAMES = Object.freeze({
  office: ["School office", "Oficina de la escuela"],
  clinic: ["Doctor's office", "Consultorio médico"],
  bus: ["Bus", "Autobús"],
  lunch: ["Lunchroom", "Comedor"],
  library: ["Library", "Biblioteca"],
  classroom: ["Classroom", "Salón de clases"],
  playground: ["Playground", "Patio de recreo"],
  hallway: ["Hallway", "Pasillo"],
  phone: ["On the phone", "Por teléfono"],
  store: ["Store", "Tienda"],
  street: ["Street", "Calle"],
  pharmacy: ["Pharmacy", "Farmacia"],
  home: ["Home", "Casa"],
});
export const PLACES = SCENE_PLACES;

/** The object scenario-art.js sceneSVG draws: place + the chosen character. */
export const artScene = (scene) => ({
  title: scene.title,
  place: scene.place,
  npc: characterFor(scene.character) || CHARACTERS[0],
});

// Small seeded shuffle so a scene's replies keep one order per scene (not always "good first").
function seeded(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** The replies a player chooses from: every good one (q 2) and the not-so-polite one (q 0, with its why). */
export function replyChoices(scene, seed = scene.title) {
  const list = [...scene.good.map((say) => ({ say, q: 2 })), { say: scene.rude.say, q: 0, why: scene.rude.why }];
  const rand = seeded(seed);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.map((c, i) => ({ ...c, id: String(i) }));
}

/** Copy for the shared text guard and the social routes' refusals. */
export function socialErrorText(S, code) {
  const map = {
    "text-empty": S("Write something first.", "Primero escribe algo."),
    "text-too-long": S("That is too long. Make it shorter.", "Es demasiado largo. Hazlo más corto."),
    "text-contact": S("Do not include an email, a phone number or an @name. Keep personal information private.", "No incluyas un correo, un número de teléfono ni un @nombre. Mantén tu información personal en privado."),
    "text-link": S("Do not include a link or a website.", "No incluyas un enlace ni un sitio web."),
    "text-language": S("Please use kind, school words.", "Por favor usa palabras amables y apropiadas para la escuela."),
    "invalid-reaction": S("Choose one reaction.", "Elige una reacción."),
    "pairs-off": S("Your teacher has not turned on listening partners yet.", "Tu maestro o maestra todavía no activó las parejas para escuchar."),
    "no-partner": S("You do not have a partner yet. Your teacher sets the pairs.", "Todavía no tienes pareja. Tu maestro o maestra forma las parejas."),
    "too-many-takes": S("You have shared a lot of recordings. Delete an old one or try again later.", "Compartiste muchas grabaciones. Borra una vieja o inténtalo más tarde."),
    "take-too-long": S("Keep your recording to 60 seconds or less.", "Haz tu grabación de 60 segundos o menos."),
    "audio-too-large": S("That recording is too big. Record a shorter one.", "Esa grabación es demasiado grande. Graba una más corta."),
    "too-many-scenes": S("You have several scenes waiting. Wait for your teacher, or delete one.", "Tienes varias escenas esperando. Espera a tu maestro o maestra, o borra una."),
    "count-good": S("Write 2 or 3 good replies.", "Escribe 2 o 3 respuestas buenas."),
    "count-lines": S("Write 1 to 3 lines for the other person.", "Escribe de 1 a 3 frases para la otra persona."),
    offline: S("No connection right now. Try again soon.", "No hay conexión ahora. Inténtalo pronto."),
  };
  return map[code] || null;
}

// Vocabulary Academy — the registry of "extra" unit activities (beyond the crossword and the unit test). One entry per
// activity; the router, the unit page, the grade page, the teacher grid and the assignment stops all read this list, so
// adding an activity is one entry here plus one module. A module is loaded only when its page opens and exports
//   start(host, ctx, va, S) -> { destroy() }   S = { gid, g, u, merged, lessons }
// Results go through model.recordResult; the activity's own record is progress.unitWork[gid][id] (see ./work.js).
// Metadata is [english, spanish] pairs. Nothing here may count down, link back to a hub, or print an answer on a miss.
export const EXTRAS = [
  {
    id: "vault",
    icon: "🔒",
    title: ["Word Vault", "Bóveda de palabras"],
    short: ["Word Vault", "Bóveda"],
    blurb: [
      "Open the locks with the unit's words and uncover the secret password.",
      "Abre las cerraduras con las palabras de la unidad y descubre la contraseña secreta.",
    ],
    lead: [
      "Open every lock with the unit's words. Each lock you open shows more of the secret password.",
      "Abre cada cerradura con las palabras de la unidad. Cada una que abres muestra más de la contraseña secreta.",
    ],
    assign: [
      "Word Vault (locks that open with the unit's words)",
      "Bóveda de palabras (cerraduras que se abren con las palabras de la unidad)",
    ],
    doneLabel: ["Opened", "Abierta"],
    load: () => import("./vault.js"),
  },
];
export const EXTRA_IDS = EXTRAS.map((e) => e.id);
export const extraOf = (id) => EXTRAS.find((e) => e.id === id) || null;

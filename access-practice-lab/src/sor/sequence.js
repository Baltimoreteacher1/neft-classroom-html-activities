// Editorially authored starting sequence. These are the lessons available to
// students, not a generated claim of a complete K–8 curriculum.
export const READING_LESSONS = Object.freeze([
  {
    id: "cvc-short-a", stage: 3, unit: "Beginning decoding", title: "Read and spell short-a words",
    objective: "Blend and segment three phonemes in short-a CVC words.", prerequisites: ["Recognize m, s, t, p, c and short a"],
    model: "Point to each spelling in mat: m → a → t. Say each sound, then blend smoothly: mat. In a word with three sounds, use three sound boxes.",
    note: "If a learner does not yet hear the three sounds, model oral segmentation before showing letters. Do not require rhyme mastery.",
    example: { word: "mat", units: ["m", "a", "t"], sounds: ["/m/", "/ă/", "/t/"], meaning: "a small floor covering" },
    build: { word: "sat", units: ["s", "a", "t"], sounds: ["/s/", "/ă/", "/t/"], tiles: ["s", "m", "a", "t", "p"], meaning: "was sitting" },
    read: { word: "map", units: ["m", "a", "p"], sounds: ["/m/", "/ă/", "/p/"], choices: ["map", "mat", "sap"], meaning: "a drawing that shows places" },
    spell: { word: "cap", units: ["c", "a", "p"], sounds: ["/k/", "/ă/", "/p/"], meaning: "a hat" },
    passage: "Sam sat. Sam has a map. A cap is on the mat.",
    exceptions: ["has", "the", "is", "on", "a"],
    question: "Where is the cap?", answerWords: ["mat"],
    transfer: { word: "tap", units: ["t", "a", "p"], sounds: ["/t/", "/ă/", "/p/"], meaning: "a light touch" },
    next: "digraph-sh",
  },
  {
    id: "digraph-sh", stage: 4, unit: "Consonant patterns", title: "One sound, two letters: sh",
    objective: "Map /sh/ to one grapheme and one sound box; blend and spell sh words.", prerequisites: ["Blend and spell short-vowel CVC words"],
    model: "In ship, sh is two letters that represent one sound. Put sh in one sound box, then i and p. Blend /sh/ /ĭ/ /p/: ship.",
    note: "Contrast a digraph with a blend: sh is one phoneme; /s/ plus /t/ in stop is two phonemes.",
    example: { word: "ship", units: ["sh", "i", "p"], sounds: ["/sh/", "/ĭ/", "/p/"], meaning: "a large boat" },
    build: { word: "shop", units: ["sh", "o", "p"], sounds: ["/sh/", "/ŏ/", "/p/"], tiles: ["sh", "s", "h", "o", "p", "i"], meaning: "a place where people buy things" },
    read: { word: "shed", units: ["sh", "e", "d"], sounds: ["/sh/", "/ĕ/", "/d/"], choices: ["shed", "seed", "shell"], meaning: "a small building for storage" },
    spell: { word: "fish", units: ["f", "i", "sh"], sounds: ["/f/", "/ĭ/", "/sh/"], meaning: "an animal that lives in water" },
    passage: "A fish is in the shop. The shop has a big ship on a shelf.",
    exceptions: ["the", "a", "is", "in", "on", "has", "big", "shelf"],
    question: "What is on a shelf?", answerWords: ["ship"],
    transfer: { word: "dish", units: ["d", "i", "sh"], sounds: ["/d/", "/ĭ/", "/sh/"], meaning: "a plate or bowl" },
    next: "long-a-vce",
  },
  {
    id: "long-a-vce", stage: 5, unit: "Long vowel patterns", title: "Change cap to cape",
    objective: "Read and spell long-a words with vowel-consonant-e.", prerequisites: ["Blend CVC words with short a"],
    model: "Compare cap and cape. The final e changes the vowel sound in this pattern. Map cape as c | a_e | p: three phonemes, four letters.",
    note: "Vowel-consonant-e is a useful pattern, not a universal rule. Contrast cap and cape before transfer.",
    example: { word: "cape", units: ["c", "a_e", "p"], sounds: ["/k/", "/ā/", "/p/"], meaning: "a piece of clothing worn over the shoulders" },
    build: { word: "make", units: ["m", "a_e", "k"], sounds: ["/m/", "/ā/", "/k/"], tiles: ["m", "a_e", "k", "c", "e"], meaning: "to create" },
    read: { word: "tape", units: ["t", "a_e", "p"], sounds: ["/t/", "/ā/", "/p/"], choices: ["tape", "tap", "type"], meaning: "a sticky strip" },
    spell: { word: "game", units: ["g", "a_e", "m"], sounds: ["/g/", "/ā/", "/m/"], meaning: "an activity with rules" },
    passage: "Kate can make a game. She can take the tape and make a cape.",
    exceptions: ["Kate", "can", "a", "she", "the", "and"],
    question: "What does Kate make with the tape?", answerWords: ["cape"],
    transfer: { word: "lake", units: ["l", "a_e", "k"], sounds: ["/l/", "/ā/", "/k/"], meaning: "a large body of water" },
    next: "prefix-un",
  },
  {
    id: "prefix-un", stage: 8, unit: "Morphology and meaning", title: "Use un- to change meaning",
    objective: "Read a base word with un- and explain how its meaning changes.", prerequisites: ["Read common base words and identify a prefix"],
    model: "Read the base word fair. Add un- to make unfair. Read both parts, then the whole word. Un- means not, so unfair means not fair.",
    note: "Use this as an entry point for older readers who already decode single-syllable words. Keep language comprehension separate from decoding evidence.",
    example: { word: "unfair", units: ["un", "fair"], sounds: ["/ŭn/", "/fâr/"], meaning: "not fair" },
    build: { word: "unsafe", units: ["un", "safe"], sounds: ["/ŭn/", "/sāf/"], tiles: ["un", "safe", "fair", "re"], meaning: "not safe" },
    read: { word: "unkind", units: ["un", "kind"], sounds: ["/ŭn/", "/kīnd/"], choices: ["unkind", "kind", "unfair"], meaning: "not kind" },
    spell: { word: "unfit", units: ["un", "fit"], sounds: ["/ŭn/", "/fĭt/"], meaning: "not fit or suitable" },
    passage: "The path was unsafe after the rain. The team made a new sign so visitors could take a safer path.",
    exceptions: ["the", "was", "after", "team", "made", "a", "new", "sign", "so", "visitors", "could", "take", "safer", "path"],
    question: "Why did the team make a new sign?", answerWords: ["unsafe", "safer", "path"],
    transfer: { word: "unwell", units: ["un", "well"], sounds: ["/ŭn/", "/wĕl/"], meaning: "not well" },
    next: null,
  },
]);

export const lessonById = (id) => READING_LESSONS.find((lesson) => lesson.id === id);
export function validateLesson(lesson) {
  const errors = [];
  if (!lesson?.id || !lesson.title || !lesson.objective || !lesson.model || !lesson.note) errors.push("missing lesson metadata");
  for (const key of ["example", "build", "read", "spell", "transfer"]) {
    const item = lesson?.[key];
    if (!item?.word || !Array.isArray(item.units) || !Array.isArray(item.sounds) || item.units.length !== item.sounds.length) errors.push(`${key}: units must map one-to-one to sounds`);
  }
  if (!lesson?.build?.tiles?.length || !lesson.build.units.every((unit) => lesson.build.tiles.includes(unit))) errors.push("build: tile bank misses a target grapheme");
  if (!lesson?.read?.choices?.includes(lesson.read.word)) errors.push("read: target missing from choices");
  if (!lesson?.passage || !lesson?.question || !lesson?.answerWords?.length) errors.push("connected reading task incomplete");
  if (lesson?.next && !lessonById(lesson.next)) errors.push("next lesson missing");
  return errors;
}

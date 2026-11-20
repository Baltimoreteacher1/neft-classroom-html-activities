import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ABOUT_ME_PRINTABLES,
  ARRIVAL_PHRASES,
  DOMAIN_LABELS,
  MENU_OPTIONS,
  PARENT_GUIDE_PAGES,
  SCAFFOLD_BANDS,
  SCAFFOLD_SUBJECTS,
  SENTENCE_FRAMES,
  SPEAKING_CARD_TOPICS,
} from "../access-practice-lab/src/packs/newcomer-packs.js";

const dir = resolve("access-practice-lab/content/packs");
await mkdir(dir, { recursive: true });
const pair = (en, es = en) => ({ en, es });
const output = {
  "all-about-me": {
    schema: "lp-newcomer-pack/1",
    reviewStatus: "automated-checks-only",
    id: "all-about-me",
    title: pair("All about me", "Todo sobre mí"),
    printables: ABOUT_ME_PRINTABLES.map((x) => ({
      id: x.id,
      title: pair(...x.title),
      prompts: x.prompts,
    })),
    passportKey: "lp-all-about-me:v1",
  },
  "new-arrival-school": {
    schema: "lp-newcomer-pack/1",
    reviewStatus: "automated-checks-only",
    id: "new-arrival-school",
    title: pair("New arrival at school", "Nueva llegada a la escuela"),
    routines: ["arrival", "lunch", "bus", "restroom", "help"],
    phrases: ARRIVAL_PHRASES.map(([en, es, routine], i) => ({
      id: `phrase-${i + 1}`,
      en,
      es,
      routine,
    })),
    welcome: pair(
      "Welcome to our school. We will help you learn routines, meet people and find the places you need.",
      "Te damos la bienvenida a nuestra escuela. Te ayudaremos a aprender las rutinas, conocer personas y encontrar los lugares que necesitas.",
    ),
    mapLabels: ["classroom", "office", "cafeteria", "library", "bathroom", "bus stop"],
  },
  "speaking-listening-cards": {
    schema: "lp-newcomer-pack/1",
    reviewStatus: "automated-checks-only",
    id: "speaking-listening-cards",
    title: pair("Speaking and listening cards", "Tarjetas para hablar y escuchar"),
    cards: Object.entries(SPEAKING_CARD_TOPICS).flatMap(([klu, stems]) =>
      SCAFFOLD_BANDS.flatMap((band) =>
        stems.map((prompt, i) => ({
          id: `${klu.toLowerCase()}-${band}-${i + 1}`,
          klu,
          band,
          prompt,
          sentenceFrame: SENTENCE_FRAMES[klu][i % SENTENCE_FRAMES[klu].length],
        })),
      ),
    ),
  },
  "sentence-building": {
    schema: "lp-newcomer-pack/1",
    reviewStatus: "automated-checks-only",
    id: "sentence-building",
    title: pair("Sentence building", "Construcción de oraciones"),
    functions: Object.entries(SENTENCE_FRAMES).map(([functionName, frames]) => ({
      function: functionName,
      frames,
    })),
  },
  "independent-menus": {
    schema: "lp-newcomer-pack/1",
    reviewStatus: "automated-checks-only",
    id: "independent-menus",
    title: pair("Independent choice menus", "Menús de opciones independientes"),
    menus: Array.from({ length: 6 }, (_, i) => ({
      id: `menu-${i + 1}`,
      title: pair(`Choice menu ${i + 1}`, `Menú ${i + 1}`),
      choices: MENU_OPTIONS,
    })),
  },
  "scaffold-packs": {
    schema: "lp-newcomer-pack/1",
    reviewStatus: "automated-checks-only",
    id: "scaffold-packs",
    title: pair("Scaffold packs", "Paquetes de apoyos"),
    subjects: SCAFFOLD_SUBJECTS.map((subject) => ({
      subject,
      bands: SCAFFOLD_BANDS.map((band) => ({
        band,
        wordBank: ["observe", "compare", "evidence", "explain"],
        frame:
          band === "K-2"
            ? "I see ___."
            : band === "3-5"
              ? "I notice ___, so ___."
              : "The evidence suggests ___ because ___.",
      })),
    })),
  },
  "parents-carers": {
    schema: "lp-newcomer-pack/1",
    reviewStatus: "automated-checks-only",
    id: "parents-carers",
    title: pair(
      "Guide for families of English learners",
      "Guía para familias de estudiantes de inglés",
    ),
    pages: PARENT_GUIDE_PAGES.map(([title, body, titleEs, bodyEs], i) => ({
      id: `page-${i + 1}`,
      title: pair(title, titleEs),
      body: pair(body, bodyEs),
    })),
  },
  "learner-progress-tracker": {
    schema: "lp-newcomer-pack/1",
    reviewStatus: "automated-checks-only",
    id: "learner-progress-tracker",
    title: pair("My learning tracker", "Mi registro de aprendizaje"),
    domains: DOMAIN_LABELS.map((domain) => ({
      domain,
      goals: [
        pair(
          `I can practice ${domain.toLowerCase()} in a new way.`,
          `Puedo practicar ${domain.toLowerCase()} de una manera nueva.`,
        ),
        pair(
          `I can ask for a helpful next step in ${domain.toLowerCase()}.`,
          `Puedo pedir un siguiente paso útil en ${domain.toLowerCase()}.`,
        ),
      ],
    })),
  },
};
const check = process.argv.includes("--check");
const mismatches = [];
for (const [id, data] of Object.entries(output)) {
  const target = resolve(dir, `${id}.json`);
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (check) {
    if ((await readFile(target, "utf8").catch(() => "")) !== text) mismatches.push(id);
  } else await writeFile(target, text);
}
if (output["speaking-listening-cards"].cards.length !== 36)
  throw new Error("Speaking cards must contain exactly 36 items.");
if (output["all-about-me"].printables.length !== 6 || output["parents-carers"].pages.length !== 8)
  throw new Error("Newcomer pack content count mismatch.");
if (check && mismatches.length) {
  console.error(`Stale generated packs: ${mismatches.join(", ")}`);
  process.exitCode = 1;
} else
  console.log(
    `Generated/checked ${Object.keys(output).length} newcomer packs, including 36 speaking cards and 8 family guide pages.`,
  );

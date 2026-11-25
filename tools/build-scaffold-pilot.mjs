#!/usr/bin/env node
/**
 * Build access-practice-lab/content/scaffold/pilot.json: the Scaffold Studio support sets for the two pilot units
 * (the first unit of each grade band). Words, definitions, examples, Spanish glosses and frames are READ from the
 * lab's own unit files so there is one source; chunking and its plain-language explanations are authored below.
 *
 * Review status is deliberate: every word and gloss is carried over from existing lab content that has never been
 * reviewed, so it is `legacy-unreviewed` + machineDrafted. Chunk annotations were written for this build and are `draft`.
 * Nothing here is `approved`; in a production build students see none of the NEW layer until a person approves it
 * (docs/scaffold-studio/discovery.md, decision 3).
 *
 *   node tools/build-scaffold-pilot.mjs            write
 *   node tools/build-scaffold-pilot.mjs --check    exit 1 if the file on disk is stale
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LAB = join(ROOT, "access-practice-lab");
const OUT = join(LAB, "content/scaffold/pilot.json");
const AUDIO_OUT = join(LAB, "content/scaffold/audio-manifest.json");
const read = (rel) => JSON.parse(readFileSync(join(LAB, rel), "utf8"));

const PILOTS = [
  {
    band: "3-5",
    unitFile: "content/units/g3-5.json",
    chunks: [
      [
        "Roots grow down into the soil.",
        [
          ["who", "Roots"],
          ["did", "grow down"],
          ["where", "into the soil."],
        ],
        "Who is the sentence about? Roots. What do they do? They grow down. Where? Into the soil.",
        "¿De quién habla la oración? De las raíces. ¿Qué hacen? Crecen hacia abajo. ¿Dónde? En la tierra.",
      ],
      [
        "The roots take in water and nutrients.",
        [
          ["who", "The roots"],
          ["did", "take in"],
          ["what", "water and nutrients."],
        ],
        "The roots are the doers. “Take in” is the action. “Water and nutrients” is what they take in.",
        "Las raíces son quienes hacen la acción. “Absorben” es la acción. “Agua y nutrientes” es lo que absorben.",
      ],
      [
        "A stem grows up toward the light.",
        [
          ["who", "A stem"],
          ["did", "grows up"],
          ["where", "toward the light."],
        ],
        "A stem is the doer. It grows up. “Toward the light” tells which way.",
        "Un tallo es quien hace la acción. Crece hacia arriba. “Hacia la luz” dice en qué dirección.",
      ],
    ],
  },
  {
    band: "6-8",
    unitFile: "content/units/g6-8.json",
    chunks: [
      [
        "Long ago, people learned to harness the wind and flowing water.",
        [
          ["when", "Long ago,"],
          ["who", "people"],
          ["did", "learned to harness"],
          ["what", "the wind and flowing water."],
        ],
        "Start with “Long ago” to find when. People are the doers. They learned to harness, which means to put nature to use. What did they harness? The wind and flowing water.",
        "“Hace mucho tiempo” dice cuándo. Las personas son quienes hacen la acción. Aprendieron a aprovechar, es decir, a usar la naturaleza. ¿Qué aprovecharon? El viento y el agua que corre.",
      ],
      [
        "These machines did not burn anything.",
        [
          ["who", "These machines"],
          ["did", "did not burn"],
          ["what", "anything."],
        ],
        "“These machines” are the doers. “Did not burn” tells what they did not do. “Anything” is the thing they did not burn.",
        "“Estas máquinas” son quienes hacen la acción. “No quemaron” dice lo que no hicieron. “Nada” es lo que no quemaron.",
      ],
      [
        "A wind turbine changes moving air into electricity.",
        [
          ["who", "A wind turbine"],
          ["did", "changes"],
          ["what", "moving air"],
          ["where", "into electricity."],
        ],
        "A wind turbine is the doer. It changes one thing into another: moving air becomes electricity.",
        "Una turbina eólica es quien hace la acción. Cambia una cosa en otra: el aire en movimiento se convierte en electricidad.",
      ],
    ],
  },
];

const PURPOSE = {
  word: "Lets a student find a word's meaning, hear it and see it used without leaving the text, so reading keeps going.",
  chunk:
    "Shows who did what, where and when in a long sentence, so a student can follow the grammar and not just the words.",
  frame:
    "Gives a writer a sentence structure that gradually disappears as they become able to write without it (gradual release).",
  briefing:
    "Prepares the reader with the big idea and four key words before reading, so the text is easier to understand (comprehensible input).",
};
const review = (status, machineDrafted) => ({ status, machineDrafted });

function fadeFrame(frames) {
  // Some authored frames use "..." for the blank; one marker everywhere keeps the tray's blank rendering simple.
  const en = frames.map((f) => f.en.replace(/\.{3}|…/g, "___"));
  const lead = (t, n) =>
    t
      .replace(/___.*$/, "")
      .trim()
      .split(/\s+/)
      .slice(0, n)
      .join(" ");
  return [
    { step: "full", text: en.join(" ") },
    { step: "partial", text: [en[0], ...en.slice(1).map((t) => `${lead(t, 2)} ___.`)].join(" ") },
    { step: "hint", text: `Hint: begin with “${lead(en[0], 2).replace(/[,.]$/, "")}”.` },
    { step: "none", text: "" },
  ];
}

export function build() {
  const sets = [];
  for (const p of PILOTS) {
    const unit = read(p.unitFile).units[0];
    const slug = unit.id;
    const anchor = unit.texts.anchor.easier;
    const words = unit.vocab.map((v) => ({
      id: `${slug}-w-${v.term.replace(/\s+/g, "-")}`,
      type: "word",
      purpose: PURPOSE.word,
      canDo: ["R.x.interpret"],
      review: review("legacy-unreviewed", true),
      term: v.term,
      definition: v.def,
      example: v.ex.en,
      exampleEs: v.ex.es,
      glosses: {
        es: {
          text: v.es.replace(/^(el|la|los|las)\s+/i, ""),
          review: review("legacy-unreviewed", true),
        },
      },
    }));
    const chunks = p.chunks.map(([sentence, parts, en, es], i) => {
      if (!anchor.includes(sentence))
        throw new Error(`pilot sentence not found in ${slug} text: ${sentence}`);
      return {
        id: `${slug}-c-${i + 1}`,
        type: "chunk",
        purpose: PURPOSE.chunk,
        canDo: ["R.x.interpret"],
        review: review("draft", true),
        sentence,
        chunks: parts.map(([role, text]) => ({ role, text })),
        explain: { en, es },
      };
    });
    const w = unit.writing[0];
    const frame = {
      id: `${slug}-f-${w.id}`,
      type: "frame",
      purpose: PURPOSE.frame,
      canDo: ["W.x.inform"],
      review: review("draft", true),
      prompt: w.title.en,
      steps: fadeFrame(w.frames),
    };
    const briefing = {
      id: `${slug}-b-1`,
      type: "briefing",
      purpose: PURPOSE.briefing,
      canDo: ["R.x.interpret"],
      review: review("draft", true),
      bigIdea: { en: unit.bigIdea?.en ?? String(unit.bigIdea), es: unit.bigIdea?.es },
      keyWords: words.slice(0, 4).map((x) => x.id),
    };
    sets.push({
      schemaVersion: 1,
      id: `${slug}-reading`,
      band: p.band,
      domain: "Reading",
      unit: slug,
      supports: [briefing, ...words, ...chunks, frame],
    });
  }
  return `${JSON.stringify({ kind: "scaffold-studio-pilot", generatedBy: "tools/build-scaffold-pilot.mjs", sets }, null, 2)}\n`;
}

/**
 * Every key word needs model audio. None is recorded yet, so each is listed as browser speech synthesis, explicitly
 * flagged `needsHumanRecording`. Recording a word means replacing its entry: source "human", src, recordedBy, lufs.
 * tools/validate-scaffold-content.mjs holds the rules (a word with no entry fails; a human entry needs its file).
 */
export function buildAudioManifest(pilot = JSON.parse(build())) {
  const entries = [];
  for (const set of pilot.sets)
    for (const s of set.supports)
      if (s.type === "word")
        entries.push({ id: s.id, text: s.term, source: "tts", needsHumanRecording: true });
  return `${JSON.stringify({ schemaVersion: 1, loudnessTargetLUFS: -16, tolerance: 1.5, folder: "access-practice-lab/audio/scaffold/<unit>/<id>.mp3", entries }, null, 2)}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const next = build();
  const nextAudio = buildAudioManifest(JSON.parse(next));
  if (process.argv.includes("--check")) {
    let cur = "";
    let curAudio = "";
    try {
      cur = readFileSync(OUT, "utf8");
      curAudio = readFileSync(AUDIO_OUT, "utf8");
    } catch {}
    if (cur !== next || curAudio !== nextAudio) {
      console.error("FAIL scaffold pilot.json is stale: run node tools/build-scaffold-pilot.mjs");
      process.exit(1);
    }
    console.log("PASS scaffold pilot.json is current");
  } else {
    writeFileSync(OUT, next);
    writeFileSync(AUDIO_OUT, nextAudio);
    console.log(`wrote ${OUT} and ${AUDIO_OUT}`);
  }
}

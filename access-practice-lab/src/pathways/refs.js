// Connected Learning Engine — shared constants and activity references for the skill graph (see graph.js).
// An activity reference is one letter + id, the compact form a custom pathway URL carries:
//   r<id> ACCESS bank item · s<id> Speaking Studio task · w<id> Writing Studio task · m<id> simulation mission
//   d<id> sitemap destination · b<template> Book Studio book · t independent transfer · f family conversation
export const BANDS = Object.freeze(["3-5", "6-8"]);
export const DOMAINS = Object.freeze(["Reading", "Listening", "Speaking", "Writing"]);
export const DIMENSIONS = Object.freeze(["discourse", "sentence", "word"]);
export const SIM_MISSION = "city-that-stopped-talking";

/** The helps a transfer stage may offer (each one opened makes the work "supported"). Letter = URL code. */
export const SUPPORTS = Object.freeze({
  frames: { code: "f", title: ["Sentence starters", "Comienzos de oración"] },
  words: { code: "w", title: ["Word bank", "Banco de palabras"] },
  plan: { code: "p", title: ["A plan to follow", "Un plan para seguir"] },
  spanish: { code: "e", title: ["The task in Spanish", "La tarea en español"] },
});

/** Sitemap destinations whose own work lands in the ledger under a known `src` (so a stage there can be detected). */
export const DEST_LEDGER_SRC = Object.freeze({
  "language-labs": "labs",
  wordlab: "wordlab",
  sentences: "craft",
});

// ── activity references ──────────────────────────────────────────────────────────────────────────────────────
// key = one letter + id, the compact form a custom pathway URL carries:
//   r<id> ACCESS bank item · s<id> Speaking Studio task · w<id> Writing Studio task · m<id> simulation mission
//   d<id> sitemap destination · b<template> Book Studio book · t independent transfer · f family conversation
export const acc = (band, domain, level, id) => ({
  kind: "access",
  key: `r${id}`,
  band,
  domain,
  level,
  id,
});
export const spk = (id) => ({ kind: "speak", key: `s${id}`, band: "6-8", domain: "Speaking", id });
export const wrt = (id) => ({ kind: "write", key: `w${id}`, band: "6-8", domain: "Writing", id });
export const dest = (id, domain = "") => ({ kind: "dest", key: `d${id}`, domain, id });
export const book = (template) => ({ kind: "book", key: `b${template}`, domain: "Writing", id: template });
export const sim = (id) => ({ kind: "sim", key: `m${id}`, domain: "Speaking", id });

export const P = (en, es) => Object.freeze([en, es]);

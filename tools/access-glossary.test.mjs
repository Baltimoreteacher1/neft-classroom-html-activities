#!/usr/bin/env node
// Tap-a-word help: what gets glossed, what never does, and that the generated glossary is whole.
import assert from "node:assert/strict";
import test from "node:test";

import { glossList, glossSpans, MAX_GLOSSED } from "../access-practice-lab/src/glossary.js";
import { allActivities, buildGlossary } from "./lib/access-lab-content.mjs";

const g = {
  terms: [
    {
      term: "water cycle",
      def: "how water moves",
      es: "ciclo del agua",
      esDef: "cómo se mueve el agua",
    },
    { term: "water", def: "a clear liquid", es: "agua", esDef: "un líquido" },
    { term: "plant", def: "a living thing that grows", es: "planta", esDef: "un ser vivo" },
    { term: "cycle", def: "steps that repeat", es: "ciclo", esDef: "pasos que se repiten" },
    { term: "sun", def: "too short", es: "sol", esDef: "x" },
  ],
};

test("the longest phrase wins and its words are not glossed again", () => {
  const spans = glossSpans("The water cycle moves water.", g);
  assert.deepEqual(
    spans.map((s) => s.term),
    ["water cycle", "water"],
  );
  assert.equal(spans[1].start, "The water cycle moves ".length);
});

test("whole words only, plurals allowed, first occurrence only", () => {
  assert.deepEqual(
    glossSpans("Plants and planted seeds", g).map((s) => s.term),
    ["plant"],
  );
  assert.deepEqual(
    glossSpans("A bicycle trip", g),
    [],
    "'cycle' inside 'bicycle' is not the word cycle",
  );
  assert.equal(glossSpans("plant plant plant", g).length, 1);
});

test("very short words are never glossed", () => {
  assert.deepEqual(glossSpans("The sun is hot", g), []);
});

test("terms already shown in this text are skipped, and the cap holds", () => {
  const seen = new Set(["plant"]);
  assert.deepEqual(
    glossSpans("plant and water", g, { seen }).map((s) => s.term),
    ["water"],
  );
  const many = {
    terms: Array.from({ length: 30 }, (_, i) => ({
      term: `word${String.fromCharCode(97 + (i % 26))}${i}`,
      def: "d",
      es: "e",
      esDef: "f",
    })),
  };
  const text = many.terms.map((t) => t.term).join(" ");
  assert.equal(glossSpans(text, many).length, MAX_GLOSSED);
});

test("the Word help list names each glossed word once, across passage and question", () => {
  const list = glossList(["Water moves in a cycle.", "Which plant needs water?"], g);
  assert.deepEqual(list.map((e) => e.term).sort(), ["cycle", "plant", "water"]);
});

test("the generated glossary holds every authored word, with Spanish, once", () => {
  const glossary = buildGlossary();
  const authored = new Set();
  for (const { activity } of allActivities())
    for (const v of activity.vocabulary || []) authored.add(String(v[0]).trim().toLowerCase());
  assert.equal(glossary.terms.length, authored.size);
  assert.equal(new Set(glossary.terms.map((t) => t.term)).size, glossary.terms.length);
  for (const t of glossary.terms) {
    assert.ok(
      t.def && t.es && t.esDef,
      `${t.term}: needs an English definition and a Spanish word and definition`,
    );
    // The word itself may be a true cognate (canal, animal); the definition must still be written in Spanish.
    assert.notEqual(
      t.esDef.toLowerCase(),
      t.def.toLowerCase(),
      `${t.term}: the Spanish definition must be Spanish, not a copy`,
    );
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { weekDates, wordsFor } from "../access-practice-lab/src/family/today.js";

test("Today at home builds the same Monday–Friday window for a date", () => {
  const input = new Date(2026, 10, 22, 12);
  const days = weekDates(input);
  assert.equal(days.length, 5);
  assert.deepEqual(
    days.map((d) => d.getDay()),
    [1, 2, 3, 4, 5],
  );
  assert.deepEqual(
    days.map((d) => d.getDate()),
    [16, 17, 18, 19, 20],
  );
});

test("daily word cards are deterministic, band-aware and five words long", () => {
  const day = new Date(2026, 10, 19, 12);
  const K = {
    Explain: [
      {
        words: [
          { en: "sun", es: "sol" },
          { en: "green", es: "verde" },
          { en: "water", es: "agua" },
          { en: "grow", es: "crecer" },
          { en: "leaf", es: "hoja" },
          { en: "plant", es: "planta" },
        ],
      },
    ],
  };
  const older = {
    Explain: [
      {
        words: [
          { en: "evidence", es: "evidencia" },
          { en: "claim", es: "afirmación" },
          { en: "compare", es: "comparar" },
          { en: "source", es: "fuente" },
          { en: "because", es: "porque" },
        ],
      },
    ],
  };
  const first = wordsFor("K", day, K);
  assert.deepEqual(wordsFor("K", day, K), first);
  assert.equal(first.length, 5);
  assert.equal(new Set(first.map((word) => word.en)).size, 5);
  assert.notDeepEqual(wordsFor("6-8", day, older), first);
});

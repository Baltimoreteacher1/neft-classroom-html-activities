import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateClarification,
  evaluateCommunication,
  FLAGSHIP_WORLDS,
  matchAdventureInterest,
  validateCustomMission,
} from "../access-practice-lab/src/reality-engine.js";

test("FLAGSHIP_WORLDS provides all three required worlds with 3-5 and 6-8 missions", () => {
  const ids = FLAGSHIP_WORLDS.map((w) => w.id);
  assert.deepEqual(ids, ["mystery-academy", "future-city", "science-expedition"]);

  for (const world of FLAGSHIP_WORLDS) {
    assert.ok(world.art.endsWith(".svg"), `${world.id} must have original SVG art`);
    for (const band of ["3-5", "6-8"]) {
      const missions = world.missions[band];
      assert.ok(
        Array.isArray(missions) && missions.length >= 1,
        `${world.id} band ${band} must have missions`,
      );
      for (const m of missions) {
        assert.ok(m.id);
        assert.ok(m.audioScript.length > 30);
        assert.ok(m.readingClues.length >= 2);
        assert.ok(m.clarifyKeywords.length >= 3);
        assert.ok(m.requiredConcepts.length >= 2);
        assert.ok(m.frames.A && m.frames.B && m.frames.C);
      }
    }
  }
});

test("matchAdventureInterest maps free-text student interests to worlds and roles", () => {
  const ocean = matchAdventureInterest("I want to explore an ocean mystery with sea creatures");
  assert.equal(ocean.worldId, "science-expedition");
  assert.equal(ocean.input, "I want to explore an ocean mystery with sea creatures");

  const city = matchAdventureInterest("design a green park and bus transit in the city");
  assert.equal(city.worldId, "future-city");

  const school = matchAdventureInterest("detective secret clue in school archive");
  assert.equal(school.worldId, "mystery-academy");
});

test("evaluateClarification distinguishes productive clarification from vague/off-topic questions", () => {
  const mission = FLAGSHIP_WORLDS[0].missions["3-5"][0];
  const precise = evaluateClarification(
    "Where on the art drying rack shelf did Leo put the notebook?",
    mission,
  );
  assert.equal(precise.ok, true);
  assert.equal(precise.status, "unlocked");
  assert.ok(precise.matchedKeywords.length >= 2);

  const vague = evaluateClarification("What time is recess today?", mission);
  assert.equal(vague.ok, false);
  assert.equal(vague.status, "needs-focus");
});

test("evaluateCommunication recognizes multiple valid phrasings and produces plausible world consequences", () => {
  const mission = FLAGSHIP_WORLDS[0].missions["3-5"][0];

  // 1. Too brief -> requests clarification
  const shortRes = evaluateCommunication("I think art room.", mission);
  assert.equal(shortRes.ok, false);
  assert.equal(shortRes.outcome, "unclear");

  // 2. Partial (location + reason without connector) -> partial consequence
  const partialRes = evaluateCommunication(
    "The green notebook is on the art drying rack with wet paint on the label.",
    mission,
  );
  assert.equal(partialRes.ok, false);
  assert.equal(partialRes.outcome, "partial");

  // 3. Complete phrasing A -> unlocks full world consequence
  const validA = evaluateCommunication(
    "The notebook is on the art drying rack because Leo needed to dry the wet paint on the label.",
    mission,
  );
  assert.equal(validA.ok, true);
  assert.equal(validA.outcome, "full");
  assert.ok(validA.consequenceText[0].includes("Shelf B"));

  // 4. Complete phrasing B (different legitimate wording) -> also unlocks full world consequence
  const validB = evaluateCommunication(
    "After lunch, Leo carried the notebook to Shelf B of the art rack so the painted label could dry.",
    mission,
  );
  assert.equal(validB.ok, true);
  assert.equal(validB.outcome, "full");
});

test("validateCustomMission validates teacher-authored reality missions", () => {
  const bad = validateCustomMission({ title: "Hi" });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.length >= 3);

  const good = validateCustomMission({
    title: "The Rooftop Weather Station Alert",
    worldId: "science-expedition",
    band: "6-8",
    klu: "Explain",
    characterName: "Meteorologist Lin",
    audioScript:
      "The anemometer recorded a sudden drop in wind speed right before the pressure sensor spiked.",
    readingClue: "Barometric Log: Pressure rose 8 hPa between 1:00 PM and 1:30 PM.",
    communicatePrompt:
      "Explain to Meteorologist Lin why the wind speed dropped and whether Sensor B is reliable.",
    keywords: "pressure, wind, sensor, because, calibrate",
    consequenceFull:
      "Meteorologist Lin publishes the storm advisory using your barometric explanation!",
  });
  assert.equal(good.valid, true);
  assert.equal(good.mission.worldId, "science-expedition");
  assert.ok(good.mission.wordBank.includes("pressure"));
});

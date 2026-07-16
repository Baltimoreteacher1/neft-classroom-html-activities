import assert from "node:assert/strict";
import {
  addSection,
  deleteSection,
  renameSection,
  setDefaultSection,
} from "./section-manager.js";

const base = {
  id: "period-one",
  label: "Period One",
  visible: true,
  isDefault: true,
  week: { label: "This week", startDate: "", note: "", days: [] },
};
const sections = [
  base,
  { ...structuredClone(base), id: "period-two", label: "Period Two", isDefault: false },
];

const renamed = renameSection(sections, "period-one", "  First Period  ");
assert.equal(renamed[0].id, "period-one", "renaming must preserve stable IDs");
assert.equal(renamed[0].label, "First Period");
assert.throws(() => renameSection(sections, "period-one", "   "), /name/i);

const firstAdded = addSection(sections, "Math Lab", base);
assert.equal(firstAdded.section.id, "math-lab");
assert.equal(firstAdded.section.label, "Math Lab");
assert.equal(firstAdded.sections.length, 3);
const duplicateAdded = addSection(firstAdded.sections, "Math Lab", base);
assert.equal(duplicateAdded.section.id, "math-lab-2", "duplicate slugs need stable suffixes");
assert.throws(
  () =>
    addSection(
      Array.from({ length: 12 }, (_, index) => ({ ...base, id: `s-${index}` })),
      "Too many",
      base,
    ),
  /12/,
);

const changedDefault = setDefaultSection(sections, "period-two");
assert.equal(changedDefault[0].isDefault, false);
assert.equal(changedDefault[1].isDefault, true);

assert.throws(() => deleteSection([base], "period-one", "period-one"), /last section/i);
const deletedDefault = deleteSection(sections, "period-one", "period-one");
assert.equal(deletedDefault.sections[0].id, "period-two");
assert.equal(deletedDefault.sections[0].isDefault, true);
assert.equal(deletedDefault.activeId, "period-two");

const three = [
  ...sections,
  { ...structuredClone(base), id: "period-three", label: "Period Three", isDefault: false },
];
const deletedInactive = deleteSection(three, "period-three", "period-two");
assert.equal(deletedInactive.activeId, "period-two");

console.log("Family section manager tests passed.");

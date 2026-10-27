import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderPrerequisiteMap } from "./prerequisite-map.js";

const skill = (grade, id, title, prerequisiteSkills = []) => ({ grade, id, title, prerequisiteSkills });

test("renders grade 1–8 skill nodes, labeled relationships, and selected-grade focus", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='map'></div></body></html>");
  const container = dom.window.document.querySelector("#map");
  const skills = Array.from({ length: 8 }, (_, index) => skill(index + 1, `skill-${index + 1}`, `Skill ${index + 1}`, index ? [`${index}:skill-${index}`] : []));
  renderPrerequisiteMap(container, skills, { "3:skill-3": { prerequisiteSkills: ["2:skill-2"], enrichmentSkills: ["4:skill-4"] } }, { selectedGrade: 3 });
  const nodes = container.querySelectorAll(".ewl-prereq-map__node");
  assert.equal(nodes.length, 8);
  assert.equal(container.querySelectorAll(".ewl-prereq-map__edge").length, 7);
  assert.equal(container.querySelectorAll(".ewl-prereq-map__grade").length, 8);
  assert.equal(container.querySelector("[data-open-key='3:skill-3']").getAttribute("aria-current"), "true");
  assert.equal(container.querySelector("[data-open-key='3:skill-3']").getAttribute("data-prerequisites"), "2:skill-2");
  assert.match(container.querySelector("[data-open-key='3:skill-3']").getAttribute("aria-label"), /Requires: Skill 2/);
  assert.ok(container.querySelector("[data-open-key='2:skill-2']").classList.contains("ewl-prereq-map__node--related"));
});

test("supports pointer and keyboard actions while keeping labels safe text", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='map'></div></body></html>");
  const container = dom.window.document.querySelector("#map");
  let opened = "";
  const skills = [skill(1, "a", "<script>alert(1)</script>"), skill(2, "b", "Target", ["1:a"])];
  renderPrerequisiteMap(container, { skills, selectedGrade: 1, onOpenSkill: (key) => { opened = key; } });
  assert.equal(container.querySelector("script"), null);
  assert.equal(container.querySelector("[data-open-key='1:a'] title").textContent.includes("<script>"), true);
  assert.equal(container.querySelectorAll(".ewl-prereq-map__node[tabindex='0']").length, 2);
  const target = container.querySelector("[data-open-key='2:b']");
  target.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.equal(opened, "2:b");
  target.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.equal(opened, "2:b");
});

// G-45 transfer-candidates (F-11): draft cross-subject-transfer candidates point at real units, are labelled draft and
// queued (never reviewed), match what the generator yields from live data, and the overview shows no empty card without them.
import fs from "node:fs";
import { renderOverview } from "../../bcpss-teachers/overview-tab.js";
import { BLOCK_ID_RE, REVIEW_STATES } from "../../shared/content-schema/review-rules.js";
import { clone } from "./dataset.mjs";
import { setupDom } from "./render.mjs";
import { buildTransferCandidates } from "./transfer-candidates.mjs";

const FILE = new URL("../../data/language-page/transfer-candidates.json", import.meta.url);

/** Pure check of a candidates document against the live units. */
export function checkTransferCandidates(units, doc) {
  const errors = [];
  const byId = new Map(units.map((d) => [d.unit.id, d]));
  const without = units.filter((d) => !d.cross_subject_transfers.length).map((d) => d.unit.id);
  if (doc.status !== "draft") errors.push(`file status "${doc.status}" (must be draft)`);
  if (JSON.stringify(doc.units_without_transfers) !== JSON.stringify(without))
    errors.push("units_without_transfers differs from the units that have no transfers");
  const fresh = buildTransferCandidates(units);
  if (
    JSON.stringify({ candidates: doc.candidates, none: doc.none }) !==
    JSON.stringify({ candidates: fresh.units, none: fresh.none })
  )
    errors.push(
      "candidates differ from what the generator yields: node tools/build-transfer-candidates.mjs",
    );
  for (const [unitId, list] of Object.entries(doc.candidates)) {
    const src = byId.get(unitId);
    if (!src) {
      errors.push(`${unitId}: candidates for an unknown unit`);
      continue;
    }
    if (src.cross_subject_transfers.length) errors.push(`${unitId}: already has real transfers`);
    for (const c of list) {
      const id = `${unitId} -> ${c.unit_id}`;
      const target = byId.get(c.unit_id);
      if (!target) errors.push(`${id}: target is not a real unit`);
      else {
        if (String(target.unit.grade) !== String(src.unit.grade))
          errors.push(`${id}: different grade`);
        if (target.unit.subject === src.unit.subject) errors.push(`${id}: same subject`);
        if (target.unit.unit_title !== c.unit_title || c.subject !== target.unit.subject)
          errors.push(`${id}: title/subject do not match the unit`);
      }
      if (c.status !== "draft") errors.push(`${id}: status "${c.status}" (must be draft)`);
      if (!REVIEW_STATES.includes(c.review?.state) || c.review.state === "reviewed")
        errors.push(`${id}: review state "${c.review?.state}" (must be a not-yet-reviewed state)`);
      if (!BLOCK_ID_RE.test(c.review?.block || "") || c.review.block !== `${unitId}:studio`)
        errors.push(`${id}: review block is not the unit studio block`);
      if (!c.basis?.shared_terms?.length) errors.push(`${id}: no stated basis`);
    }
  }
  return errors;
}

/** The overview must not render a transfer section (an empty card) when a unit has no transfers. */
export function checkEmptyDegrades(units, render) {
  const errors = [];
  const detail = clone(units.find((d) => !d.cross_subject_transfers.length));
  const panel = setupDom().document.createElement("div");
  render(panel, { detail, wida: "3_4" });
  if (panel.querySelector(".ov-transfer, #ovTransferH"))
    errors.push(`${detail.unit.id}: overview renders an empty transfer section`);
  const withT = clone(units.find((d) => d.cross_subject_transfers.length));
  const panel2 = setupDom().document.createElement("div");
  render(panel2, { detail: withT, wida: "3_4" });
  if (!panel2.querySelector(".ov-transfer li"))
    errors.push(`${withT.unit.id}: overview lost its real transfers`);
  return errors;
}

export const g45 = {
  id: "G-45",
  name: "transfer-candidates",
  async run({ data }) {
    const doc = JSON.parse(fs.readFileSync(FILE, "utf8"));
    const errors = [
      ...checkTransferCandidates(data.units, doc),
      ...checkEmptyDegrades(data.units, renderOverview),
    ];
    const links = Object.values(doc.candidates).flat().length;
    if (doc.units_without_transfers.length < 26)
      errors.push("expected 26 units without transfers (audit baseline)");
    return {
      errors,
      info: {
        unitsWithout: doc.units_without_transfers.length,
        unitsWithCandidates: Object.keys(doc.candidates).length,
        links,
        noCandidate: doc.none.length,
      },
    };
  },
  async controls({ data }) {
    const doc = () => JSON.parse(fs.readFileSync(FILE, "utf8"));
    const pick = (d) => Object.values(d.candidates)[0][0];
    const ghost = doc();
    pick(ghost).unit_id = "g9-ela-u9";
    const reviewed = doc();
    pick(reviewed).review.state = "reviewed";
    const sameSubject = doc();
    const first = Object.keys(sameSubject.candidates)[0];
    const src = data.units.find((d) => d.unit.id === first);
    pick(sameSubject).unit_id = data.units.find(
      (d) =>
        d.unit.grade === src.unit.grade &&
        d.unit.subject === src.unit.subject &&
        d.unit.id !== first,
    ).unit.id;
    const emptyCardRender = (panel) => {
      panel.innerHTML =
        '<section class="ov-transfer"><h3 id="ovTransferH">Same language move</h3></section>';
    };
    return [
      {
        name: "candidate targets a unit that does not exist",
        errors: checkTransferCandidates(data.units, ghost).filter((e) => /not a real unit/.test(e)),
      },
      {
        name: "candidate marked reviewed",
        errors: checkTransferCandidates(data.units, reviewed).filter((e) => /review state/.test(e)),
      },
      {
        name: "candidate in the same subject",
        errors: checkTransferCandidates(data.units, sameSubject).filter((e) =>
          /same subject/.test(e),
        ),
      },
      {
        name: "overview that renders an empty transfer card",
        errors: checkEmptyDegrades(data.units, emptyCardRender).filter((e) =>
          /empty transfer/.test(e),
        ),
      },
    ];
  },
};

/**
 * No filter on The Language Page may end on an empty list. Every grade band, domain, Key Language Use, skill and
 * session-length choice a person can make has to land on at least one activity, mission or game.
 *   - the band index holds activities for every band x domain x level
 *   - the teacher mission guide matches a mission for every band x purpose x domain x mission choice
 *   - a purpose and a mission can never conflict (the changed field wins)
 *   - Language Game Studio filters relax to a real list, and the early bands (no studio games) have activities to open
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lab = new URL("../access-practice-lab/", import.meta.url);
const read = async (p) => JSON.parse(await readFile(new URL(p, lab), "utf8"));
const src = (p) => import(new URL(`src/${p}`, lab));

const DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];
const index = await read("content/index.json");
for (const [band, b] of Object.entries(index.bands))
  for (const d of DOMAINS) {
    const levels = Object.entries(b.domains[d]?.levels || {});
    assert.ok(levels.length, `${band} ${d}: no levels`);
    for (const [level, L] of levels)
      assert.ok(L.activities.length, `${band} ${d} ${level}: no activities`);
  }

const cur = await src("journey/curriculum.js");
const gd = await src("journey/ui/guide-data.js");
const modes = await gd.loadModes(cur.loadMission);
let guideChecked = 0;
for (const band of cur.BANDS)
  for (const klu of ["", ...cur.KLUS])
    for (const domain of ["", ...DOMAINS])
      for (const mission of ["", ...cur.MISSION_IDS]) {
        const query = new URLSearchParams(
          Object.entries({ band, klu, domain, mission }).filter(([, v]) => v),
        );
        for (const changed of ["klu", "mission"]) {
          const f = gd.parseFilters(query, band, changed);
          const hits = cur.MISSION_IDS.filter((id) =>
            gd.matchesFilters(f, id, cur.MISSIONS[id], modes),
          );
          assert.ok(
            hits.length,
            `guide: ${band}/${klu}/${domain}/${mission} (${changed} changed) matches no mission`,
          );
          if (f.mission && f.klu)
            assert.equal(cur.MISSIONS[f.mission].klu, f.klu, "purpose and mission conflict");
          guideChecked++;
        }
      }

const plan = await src("games/plan.js");
const reg = await src("games/registry.js");
for (const band of Object.keys(index.bands)) {
  const own = reg.GAMES.filter((g) => plan.bandOk(g, band));
  if (!own.length) continue; // early bands open their activities instead (checked above)
  for (const skill of ["all", ...reg.SKILLS])
    for (const klu of ["all", ...reg.KLUS])
      for (const diff of ["all", "1", "2", "3"])
        for (const min of ["all", "8", "10"]) {
          const { q } = plan.relaxFilters({ skill, klu, diff, min }, band);
          assert.ok(
            plan.filterGames(q, band).length,
            `games ${band}: ${skill}/${klu}/${diff}/${min} stays empty`,
          );
        }
}
const early = Object.keys(index.bands).filter((b) => !reg.GAMES.some((g) => plan.bandOk(g, b)));
assert.deepEqual(early.sort(), ["1", "2-3", "K"], "bands without studio games");

console.log(
  `access-filter-coverage: ${Object.keys(index.bands).length} bands, ${guideChecked} guide filter states, games relaxed — ok`,
);

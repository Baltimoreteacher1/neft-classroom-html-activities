// G-13 data-to-ui-coverage: every populated authored block (root.field paths of the unit documents) is read and drawn by a
// client module, rendered by a registered routine block (proven by G-61..G-63), or listed in
// tools/audit/data-ui-allowlist.json with a written reason of 40+ characters. A stale allowlist entry (path no longer
// populated, or now rendered) fails, so the list cannot become a pile of old absolutions.
import fs from "node:fs";
import { ROUTINE_BLOCKS, registeredPaths } from "../../shared/bcpss-routines/index.js";
import {
  buildMatrix,
  isBlockPath,
  loadClient,
  loadExport,
  ROOT,
  readsPath,
} from "../audit/data-ui-coverage.mjs";
import { clone } from "./dataset.mjs";

const ALLOWLIST = new URL("../audit/data-ui-allowlist.json", import.meta.url);
export const MIN_REASON = 40;

const loadAllowlist = () => JSON.parse(fs.readFileSync(ALLOWLIST, "utf8"));

/** Pure evaluation, so the controls can feed it broken inputs. */
export function evaluate(data, { client, exported, registered, allowlist }) {
  const rows = buildMatrix(data, { client, exported, registered });
  const blocks = rows.filter((r) => isBlockPath(r.path));
  const byPath = new Map(blocks.map((r) => [r.path, r]));
  const errors = [];
  const allowed = new Map();
  for (const e of allowlist) {
    if (allowed.has(e.path)) errors.push(`allowlist: duplicate entry ${e.path}`);
    allowed.set(e.path, e);
    if (String(e.reason || "").trim().length < MIN_REASON)
      errors.push(`allowlist: ${e.path} reason is under ${MIN_REASON} characters`);
    const row = byPath.get(e.path);
    if (!row) errors.push(`allowlist: stale entry ${e.path} (no unit populates it)`);
    else if (row.rendered)
      errors.push(`allowlist: stale entry ${e.path} (a renderer now draws it)`);
  }
  for (const r of blocks)
    if (!r.rendered && !allowed.has(r.path))
      errors.push(`no renderer for ${r.path} (${r.populated} units) and no allowlist reason`);
  for (const [p, id] of registered)
    if (!rows.some((r) => r.path === p))
      errors.push(`registry: ${id} names ${p}, which no unit populates`);
  return { errors, rows, blocks };
}

const inputs = () => ({
  client: loadClient(),
  exported: loadExport(),
  registered: registeredPaths(),
  allowlist: loadAllowlist(),
});

export const g13 = {
  id: "G-13",
  name: "data-to-ui-coverage",
  run({ data }) {
    const { errors, blocks } = evaluate(data, inputs());
    const registered = blocks.filter((r) => r.registered).length;
    return {
      errors,
      info: {
        units: data.units.length,
        blockPaths: blocks.length,
        rendered: blocks.filter((r) => r.rendered).length,
        viaRoutineBlocks: registered,
        allowlisted: loadAllowlist().length,
        routineBlocks: ROUTINE_BLOCKS.length,
        notExported: blocks.filter((r) => !r.exported).length,
      },
    };
  },
  controls({ data }) {
    const base = inputs();
    const dropRegistered = (path) => {
      const m = new Map(base.registered);
      m.delete(path);
      return m;
    };
    // 1. Remove a routine renderer: a block that ONLY the routine registry draws stops being registered, so its
    //    populated data has no renderer. The block is chosen here, not hard-coded: esol_pack.doctor stopped being
    //    registry-only when bcpss-teachers/companion/teach-week.js began reading it, which silently turned this
    //    control into one that could not fail. With no registry-only block left it produces NO errors, so the
    //    runner reports "negative control did NOT fail" instead of passing vacuously.
    const registryOnly = [...base.registered.keys()].filter(
      (p) => !base.client.some((s) => readsPath(s.text, p)),
    );
    const routinePath = registryOnly[0];
    const noRoutine = routinePath
      ? evaluate(data, { ...base, registered: dropRegistered(routinePath) })
      : { errors: [] };
    // 2. Remove every client file that reads writing.bbs (the Writing Lab steps and coach): nothing draws it any more.
    const noClientFile = evaluate(data, {
      ...base,
      client: base.client.filter((s) => !readsPath(s.text, "writing.bbs")),
    });
    // 3. A populated authored block that nothing renders.
    const extra = { ...data, units: data.units.map(clone) };
    extra.units[0].esol_pack.brand_new_block = { x: "authored text nobody draws" };
    const noRenderer = evaluate(extra, base);
    // 4. Stale allowlist entries: a path that is drawn now, a path nobody populates, and a one-word reason.
    const stale = evaluate(data, {
      ...base,
      allowlist: [
        ...base.allowlist,
        {
          path: "esol_pack.doctor",
          reason: "A reason that is long enough to pass the length rule but names a drawn block.",
        },
        {
          path: "esol_pack.never_existed",
          reason: "A reason that is long enough to pass the length rule but names nothing.",
        },
        { path: "esol_pack.version", reason: "internal" },
      ].filter(
        (e, i, all) =>
          all.findIndex((x) => x.path === e.path) === i || e.path === "esol_pack.version",
      ),
    });
    const short = evaluate(data, {
      ...base,
      allowlist: base.allowlist.map((e) =>
        e.path === "esol_pack.version" ? { ...e, reason: "internal" } : e,
      ),
    });
    return [
      {
        name: `routine renderer removed (${routinePath ?? "no registry-only block left"})`,
        errors: noRoutine.errors,
      },
      { name: "every client reader of writing.bbs removed", errors: noClientFile.errors },
      { name: "populated block with no renderer", errors: noRenderer.errors },
      { name: "stale allowlist entries", errors: stale.errors },
      { name: "allowlist reason under 40 characters", errors: short.errors },
    ];
  },
};

export { ROOT };

// G-31 review-state-integrity, G-35 review-log-export-schema.
// Both drive the REAL review endpoints on an in-memory database (tools/language-page/review-fixture.mjs). Neither
// sets any content "reviewed": the fixture reviewer exists only inside the throwaway database, and the gates also
// assert that a database nobody has written to reads Draft for every unit.
import fs from "node:fs";
import path from "node:path";
import { LOG_COLUMNS, parseCsv } from "../../functions/_lib/review/csv.js";
import {
  checkEvent,
  checkLogCsv,
  checkLogJson,
  LOG_JSON_SCHEMA,
} from "../../functions/_lib/review/log-json.js";
import { provenanceOf } from "../../shared/bcpss-provenance.js";
import { verifyEventChain } from "../../shared/content-schema/review-chain.js";
import { TRANSITIONS } from "../../shared/content-schema/v2.mjs";
import { human } from "../review-test-kit.mjs";
import { clone } from "./dataset.mjs";
import {
  call,
  eventRows,
  FIXTURE_UNIT,
  legalSession,
  lessonId,
  logCsvFn,
  logJsonFn,
  move,
  summary,
} from "./review-fixture.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;

// ── G-31 ──────────────────────────────────────────────────────────────────────
/** The seed (v1) review record cannot carry a reviewer or a date, so anything other than "pending" is a forgery. */
export function checkSeedReview(lessonSets) {
  const errors = [];
  let lessons = 0;
  for (const set of lessonSets) {
    for (const l of set.lessons) {
      lessons += 1;
      const r = l.review ?? {};
      const values = [
        ["pedagogy", r.pedagogy],
        ["language_qa", r.language_qa],
        ...Object.entries(r.translation ?? {}).map(([k, v]) => [`translation.${k}`, v]),
      ];
      for (const [field, value] of values)
        if (value !== "pending")
          errors.push(
            `${l.id}: review.${field} is "${value}" in seed data, which has no reviewer or date (only the review log may say reviewed)`,
          );
    }
    const p = provenanceOf(set);
    const anyNotPending = set.lessons.some(
      (l) => l.review?.pedagogy !== "pending" || l.review?.language_qa !== "pending",
    );
    if (p.state === "reviewed" && anyNotPending)
      errors.push(`${set.unit_id}: unit reads reviewed from seed data`);
  }
  return { errors, lessons };
}

/** Invariants over an ordered list of review_event rows. */
export async function checkEventLog(rows) {
  const errors = [];
  const last = new Map();
  for (const [i, e] of rows.entries()) {
    const at = `event ${i} (seq ${e.seq})`;
    errors.push(
      ...checkEvent({ ...e, created_at: new Date(Number(e.created_at)).toISOString() }, at),
    );
    if (!(TRANSITIONS[e.from_state] ?? []).includes(e.to_state))
      errors.push(`${at}: illegal transition ${e.from_state} -> ${e.to_state}`);
    const key = `${e.block_id}|${e.dimension}|${e.lang}`;
    const expected = last.get(key) ?? "draft";
    if (e.from_state !== expected)
      errors.push(`${at}: from_state ${e.from_state} but ${key} was ${expected}`);
    last.set(key, e.to_state);
    if (
      e.to_state === "reviewed" &&
      (!String(e.reviewer_name).trim() || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.reviewer_date)))
    )
      errors.push(`${at}: reviewed without a named reviewer and date`);
    if (i && Number(e.seq) <= Number(rows[i - 1].seq)) errors.push(`${at}: seq not ascending`);
  }
  errors.push(...(await verifyEventChain(rows)));
  return errors;
}

/** The only code allowed to write the log or the projection: store.js (SQL) reached through service-decide.js. */
export function checkWriters(files) {
  const errors = [];
  for (const { file, text } of files) {
    const sql =
      /INSERT INTO review_(event|state)|UPDATE review_|DELETE FROM review_|REPLACE INTO review_/.test(
        text,
      );
    if (sql && !file.endsWith("functions/_lib/review/store.js"))
      errors.push(`${file}: writes review tables outside store.js`);
    if (
      /\bappendEvents\s*\(/.test(text) &&
      !/functions\/_lib\/review\/(store|service-decide)\.js$/.test(file)
    )
      errors.push(`${file}: calls appendEvents outside service-decide.js`);
  }
  return errors;
}

function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${ent.name}`;
      if (ent.isDirectory()) walk(rel);
      else if (/\.(m?js)$/.test(ent.name) && !/\.test\./.test(ent.name))
        out.push({ file: rel, text: fs.readFileSync(path.join(ROOT, rel), "utf8") });
    }
  };
  for (const dir of ["functions", "shared", "bcpss-teachers/studio/views/review"]) walk(dir);
  return out;
}

/** UPDATE and DELETE must both be refused; returns problems when either succeeds. */
export function probeAppendOnly(sqlite) {
  const errors = [];
  const before = eventRows(sqlite).length;
  for (const sql of ["UPDATE review_event SET to_state = 'draft'", "DELETE FROM review_event"]) {
    try {
      sqlite.prepare(sql).run();
      errors.push(`append-only broken: "${sql}" succeeded`);
    } catch (err) {
      if (!/append-only/.test(String(err.message)))
        errors.push(`"${sql}" failed for another reason: ${err.message}`);
    }
  }
  if (eventRows(sqlite).length !== before && !errors.length) errors.push("row count changed");
  return errors;
}

async function liveChecks() {
  const errors = [];
  const { env, sqlite } = await legalSession();
  const rows = eventRows(sqlite);
  errors.push(...(await checkEventLog(rows)));
  errors.push(...probeAppendOnly(sqlite));
  // Illegal moves and non-human reviewers are refused and write nothing.
  const refuse = async (res, status, why) => {
    if (res.status !== status) errors.push(`${why}: expected ${status}, got ${res.status}`);
  };
  await refuse(await move(env, lessonId(4), "reviewed"), 409, "draft -> reviewed");
  await refuse(await move(env, lessonId(3), "in_review"), 409, "retired -> in_review");
  await refuse(await move(env, lessonId(1), "retired"), 400, "retire without a written reason");
  await refuse(
    await move(env, lessonId(5), "in_review", { reviewer: { ...human(), actor: "model" } }),
    403,
    "model actor",
  );
  await refuse(
    await move(env, lessonId(5), "in_review", { reviewer: human("Claude") }),
    403,
    "model name",
  );
  const after = eventRows(sqlite);
  return { errors, rows, after, env };
}

export const g31 = {
  id: "G-31",
  name: "review-state-integrity",
  async run({ data }) {
    const seed = checkSeedReview(data.lessons);
    const errors = [...seed.errors];
    const live = await liveChecks();
    const extra = live.after.length - live.rows.length;
    errors.push(...live.errors);
    if (extra !== 0) errors.push(`refused decisions still wrote ${extra} event(s)`);
    errors.push(...(await checkEventLog(live.after)));
    errors.push(...checkWriters(sourceFiles()));
    // A database nobody has written to must read Draft for every unit: nothing is reviewed by default.
    const fresh = (await legalFresh()).units;
    const reviewedUnits = Object.entries(fresh).filter(([, s]) => s !== "draft");
    if (reviewedUnits.length)
      errors.push(
        `fresh database reports non-draft units: ${reviewedUnits
          .slice(0, 3)
          .map((e) => e.join("="))
          .join(", ")}`,
      );
    return {
      errors,
      info: {
        seedLessons: seed.lessons,
        events: live.after.length,
        units: Object.keys(fresh).length,
      },
    };
  },
  async controls({ data }) {
    const forged = clone(data.lessons.slice(0, 1));
    forged[0].lessons[0].review.pedagogy = "reviewed";
    const { sqlite } = await legalSession();
    const rows = eventRows(sqlite).map((r) => ({ ...r }));
    const bad = (i, patch) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
    const noDate = bad(1, { reviewer_date: "" });
    const illegal = bad(0, { from_state: "draft", to_state: "reviewed" });
    const skipped = rows.slice(1); // first event gone: from_state no longer matches and the chain is broken
    const nonHuman = bad(0, { actor: "model" });
    const { sqlite: tampered } = await legalSession();
    tampered.exec("DROP TRIGGER review_event_no_update");
    tampered.prepare("UPDATE review_event SET reviewer_name = 'Forged Person' WHERE seq = 2").run();
    const { sqlite: open } = await legalSession();
    open.exec("DROP TRIGGER review_event_no_delete");
    return [
      {
        name: "seed lesson marked reviewed with no reviewer",
        errors: checkSeedReview(forged).errors,
      },
      { name: "reviewed event without a reviewer date", errors: await checkEventLog(noDate) },
      { name: "illegal transition draft -> reviewed", errors: await checkEventLog(illegal) },
      { name: "log with its first event removed", errors: await checkEventLog(skipped) },
      { name: "event whose actor is a model", errors: await checkEventLog(nonHuman) },
      { name: "log edited out of band", errors: await checkEventLog(eventRows(tampered)) },
      { name: "database whose delete trigger is gone", errors: probeAppendOnly(open) },
      {
        name: "a second writer of the review tables",
        errors: checkWriters([
          { file: "functions/api/review/shortcut.js", text: "await appendEvents(db, events, {});" },
        ]),
      },
    ];
  },
};

async function legalFresh() {
  const { newEnv } = await import("../review-test-kit.mjs");
  const { env } = newEnv();
  const res = await call(summary, env, { key: "", path: "/api/review/summary" });
  return res.json;
}

// ── G-35 ──────────────────────────────────────────────────────────────────────
async function exportChecks() {
  const errors = [];
  const { env, sqlite } = await legalSession();
  const rows = eventRows(sqlite);
  const csv = await call(logCsvFn, env, { path: "/api/review/log.csv" });
  const json = await call(logJsonFn, env, { path: "/api/review/log.json" });
  if (csv.status !== 200 || json.status !== 200)
    return { errors: [`export status csv ${csv.status}, json ${json.status}`] };
  if (!/application\/json/.test(json.headers.get("content-type") ?? ""))
    errors.push("log.json content-type is not JSON");
  const parsed = parseCsv(csv.text);
  errors.push(...checkLogCsv(csv.text, parsed));
  errors.push(...checkLogJson(json.json));
  if (json.json.events.length !== rows.length)
    errors.push(`json has ${json.json.events.length} events, database ${rows.length}`);
  if (parsed.length !== rows.length)
    errors.push(`csv has ${parsed.length} rows, database ${rows.length}`);
  for (const [i, row] of rows.entries())
    for (const c of LOG_COLUMNS) {
      const want =
        c === "created_at"
          ? new Date(Number(row.created_at)).toISOString()
          : row[c] === null
            ? ""
            : String(row[c]);
      const j = json.json.events[i]?.[c];
      if (String(j ?? "") !== want)
        errors.push(`json row ${i} column ${c}: "${j}" != database "${want}"`);
      if (parsed[i]?.[c] !== want && !(c === "reviewer_name" || c === "comment"))
        errors.push(`csv row ${i} column ${c} differs from database`);
    }
  if (/snapshot/i.test(csv.text) || "snapshot_json" in (json.json.events[0] ?? {}))
    errors.push("snapshots leaked into an export");
  // paging agrees between formats
  const p1 = await call(logJsonFn, env, { path: "/api/review/log.json?limit=2" });
  const p2 = await call(logCsvFn, env, { path: "/api/review/log.csv?limit=2" });
  if (String(p1.json.next_after_seq) !== p2.headers.get("x-next-after-seq"))
    errors.push("json and csv disagree on the paging cursor");
  // the gate is the teacher key
  for (const key of ["", "wrong"])
    if ((await call(logJsonFn, env, { path: "/api/review/log.json", key })).status !== 401)
      errors.push(`log.json answered without the teacher key (${key || "none"})`);
  return { errors, doc: json.json, csvText: csv.text, rows: parsed };
}

export const g35 = {
  id: "G-35",
  name: "review-log-export-schema",
  async run() {
    const r = await exportChecks();
    return { errors: r.errors, info: { schema: LOG_JSON_SCHEMA, columns: LOG_COLUMNS.length } };
  },
  async controls() {
    const { doc, csvText, rows } = await exportChecks();
    const mutate = (fn) => {
      const d = clone(doc);
      fn(d);
      return checkLogJson(d);
    };
    return [
      {
        name: "wrong schema id",
        errors: mutate((d) => {
          d.schema = "other/9";
        }),
      },
      {
        name: "columns reordered",
        errors: mutate((d) => {
          d.columns.reverse();
        }),
      },
      {
        name: "event actor is a model",
        errors: mutate((d) => {
          d.events[0].actor = "model";
        }),
      },
      {
        name: "event missing its digest",
        errors: mutate((d) => {
          delete d.events[1].digest;
        }),
      },
      {
        name: "reviewer date not a date",
        errors: mutate((d) => {
          d.events[0].reviewer_date = "yesterday";
        }),
      },
      {
        name: "seq out of order",
        errors: mutate((d) => {
          d.events.reverse();
        }),
      },
      {
        name: "chain link broken",
        errors: mutate((d) => {
          d.events[2].prior_digest = "0".repeat(64);
        }),
      },
      {
        name: "csv header dropped",
        errors: checkLogCsv(csvText.split("\n").slice(1).join("\n"), rows),
      },
      { name: "csv with CRLF rows", errors: checkLogCsv(csvText.replace(/\n/g, "\r\n"), rows) },
    ];
  },
};

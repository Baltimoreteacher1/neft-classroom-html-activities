// G-05 api-client-contract, G-06 data-integrity, G-08 domain-coverage, G-11 telemetry-validation.
import fs from "node:fs";
import { getInsights, recordTelemetry } from "../../functions/_lib/bcpss/db.js";
import * as apiTelemetry from "../../functions/api/bcpss/telemetry.js";
import { LIMITS } from "../../functions/_lib/security/schema.js";
import { INSIGHTS_KEYS } from "../../shared/bcpss-telemetry-schema.js";
import { clone } from "./dataset.mjs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const baselines = JSON.parse(read("data/language-page-baselines.json"));

// ── G-05 ──────────────────────────────────────────────────────────────────────
/** Row fields the dashboard client reads, discovered from its source (r.<field>). */
export const clientRowFields = (src) => [
  ...new Set([...src.matchAll(/\br\.([a-z_]+)/g)].map((m) => m[1])),
];

export function checkContract(insights, clientSrc) {
  const errors = [];
  const serverKeys = new Set(Object.keys(insights));
  for (const [alias, key] of Object.entries(INSIGHTS_KEYS))
    if (!serverKeys.has(key)) errors.push(`server response lacks "${key}" (schema key "${alias}")`);
  for (const key of serverKeys)
    if (!Object.values(INSIGHTS_KEYS).includes(key))
      errors.push(`server sends "${key}" which the schema does not name`);
  const direct = [...clientSrc.matchAll(/\bdata\.([a-z_]+)|data\[["']([a-z_]+)["']\]/g)];
  if (direct.length)
    errors.push(
      `client reads response keys directly (${direct.map((m) => m[1] || m[2]).join(", ")}); must use INSIGHTS_KEYS`,
    );
  if (/data\[K\.[a-z]+\]\s*\|\|/.test(clientSrc) || /\w+\s*\|\|\s*data\b/.test(clientSrc))
    errors.push("client has a fallback chain of alternative key names");
  const rowKeys = new Set();
  for (const k of ["grades", "units", "tiers", "klus", "events"])
    for (const row of insights[INSIGHTS_KEYS[k]] || [])
      for (const f of Object.keys(row)) rowKeys.add(f);
  for (const f of clientRowFields(clientSrc))
    if (!rowKeys.has(f)) errors.push(`client reads row field "${f}" that no response row carries`);
  return errors;
}

export const g05 = {
  id: "G-05",
  name: "api-client-contract",
  async run() {
    for (const [unit_id, wida_tier, event_type] of [
      ["g6-math-u2", "3_4", "vocab_lookup"],
      ["g2-sci-u2", "1_2", "scaffold_toggle"],
      ["g5-ela-u1", "5_6", "activity_copy"],
      ["g4-ss-u1", "3_4", "esol_routine"],
    ])
      await recordTelemetry({}, { unit_id, wida_tier, event_type });
    const insights = await getInsights({});
    const errors = checkContract(insights, read("bcpss-teachers/insights/insights.js"));
    const populated = ["grades", "units", "tiers", "klus", "events"].every(
      (k) => (insights[INSIGHTS_KEYS[k]] || []).length > 0,
    );
    if (!populated)
      errors.push("contract fixture is not populated: a missing list would hide a missing key");
    return { errors, info: { keys: Object.keys(insights).length } };
  },
  async controls() {
    await recordTelemetry(
      {},
      { unit_id: "g6-math-u2", wida_tier: "3_4", event_type: "vocab_lookup" },
    );
    const insights = await getInsights({});
    const src = read("bcpss-teachers/insights/insights.js");
    const renamed = clone(insights);
    renamed.top_klus = renamed.top_klu_demand;
    delete renamed.top_klu_demand;
    return [
      { name: "server renames top_klu_demand -> top_klus", errors: checkContract(renamed, src) },
      {
        name: "client with a fallback chain",
        errors: checkContract(insights, `${src}\nconst x = data.top_klus || data.klus;`),
      },
    ];
  },
};

// ── G-06 ──────────────────────────────────────────────────────────────────────
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const dupes = (list, label, pick) => {
  const seen = new Map();
  const out = [];
  for (const d of list) {
    const v = String(pick(d) || "")
      .trim()
      .toLowerCase();
    if (!v) continue;
    if (seen.has(v)) out.push(`${label} duplicated: ${seen.get(v)} and ${d.unit.id}`);
    else seen.set(v, d.unit.id);
  }
  return out;
};

export const INTEGRITY_CHECKS = {
  "list/detail agreement": ({ summaries, units }) =>
    summaries.flatMap((s, i) => {
      const d = units[i];
      const e = [];
      if (s.id !== d.unit.id) e.push(`order mismatch ${s.id}/${d.unit.id}`);
      if (s.activity_count !== d.activities.length)
        e.push(`${s.id}: activity_count ${s.activity_count} != ${d.activities.length}`);
      if (s.unit_title !== d.unit.unit_title) e.push(`${s.id}: unit_title differs`);
      if (s.primary_klu !== d.connections[0].wida_klu) e.push(`${s.id}: primary_klu differs`);
      return e;
    }),
  "no duplicate narrative fields": ({ units }) => [
    ...dupes(units, "unit_summary", (d) => d.unit.unit_summary),
    ...dupes(units, "essential_question", (d) => d.unit.essential_question),
    ...dupes(units, "family summary", (d) => d.family?.summary?.en),
    ...dupes(units, "3_4 reading text", (d) => d.reading?.texts?.["3_4"]),
  ],
  "reading answers in bounds": ({ units }) =>
    units.flatMap((d) => {
      const q = d.reading?.questions || [];
      const e = q.length === 3 ? [] : [`${d.unit.id}: ${q.length} reading questions`];
      for (const x of q)
        if (!Number.isInteger(x.answer) || x.answer < 0 || x.answer >= x.options.length)
          e.push(`${d.unit.id}: reading answer out of bounds`);
      return e;
    }),
  "esol answers in bounds": ({ units }) =>
    units.flatMap((d) => [
      ...(d.esol_pack.doctor || [])
        .filter((x) => !(x.answer_index >= 0 && x.answer_index < x.options.length))
        .map(() => `${d.unit.id}: doctor answer out of bounds`),
      ...(d.esol_pack.retrieval || [])
        .filter((x) => !(x.answer_index >= 0 && x.answer_index < x.options.length))
        .map(() => `${d.unit.id}: retrieval answer out of bounds`),
    ]),
  "dictogloss word counts": ({ units }) =>
    units
      .filter((d) => d.esol_pack.dictogloss.word_count !== words(d.esol_pack.dictogloss.text))
      .map((d) => `${d.unit.id}: dictogloss word_count wrong`),
  "family EN/ES parity": ({ units }) =>
    units.flatMap((d) => {
      const e = [];
      for (const k of ["talk", "say_it"]) {
        const list = d.family?.[k] || [];
        for (const row of list)
          if (!row.en || !row.es || row.en === row.es)
            e.push(`${d.unit.id}: family.${k} not bilingual`);
      }
      if ((d.family?.vocab || []).length !== (d.studio?.vocab || []).length)
        e.push(`${d.unit.id}: family vocab count differs from studio vocab`);
      return e;
    }),
  "transfer targets valid": ({ units }) => {
    const byId = new Map(units.map((d) => [d.unit.id, d.unit]));
    return units.flatMap((d) =>
      d.cross_subject_transfers.flatMap((t) => {
        const u = byId.get(t.unit_id);
        if (!u) return [`${d.unit.id}: transfer to unknown unit ${t.unit_id}`];
        return u.unit_title === t.unit_title &&
          String(u.grade) === String(t.grade) &&
          u.subject === t.subject
          ? []
          : [`${d.unit.id}: transfer ${t.unit_id} metadata mismatch`];
      }),
    );
  },
  "vocab fields populated": ({ units }) =>
    units.flatMap((d) =>
      (d.connections[0].tier2_tier3_vocab || []).flatMap((v) =>
        ["term", "student_friendly_def", "example", "nonexample", "cue", "cognate_es"]
          .filter((f) => !String(v[f] || "").trim())
          .map((f) => `${d.unit.id}/${v.term}: ${f} empty`),
      ),
    ),
  "lesson sequence contiguous": ({ lessons }) =>
    lessons.flatMap((doc) =>
      doc.lessons
        .map((l, i) => (l.sequence === i + 1 ? null : `${doc.unit_id}: sequence gap at ${i + 1}`))
        .filter(Boolean),
    ),
  "math standards match grade": ({ units }) =>
    units
      .filter((d) => d.unit.subject === "Math")
      .flatMap((d) =>
        d.unit.core_standards
          .map((s) => String(s).match(/^(K|\d)\./)?.[1])
          .filter((g) => g && g !== String(d.unit.grade))
          .map((g) => `${d.unit.id}: standard grade token ${g}`),
      ),
};

const MUTATIONS = {
  "list/detail agreement": (x) => (x.summaries[3].activity_count += 1),
  "no duplicate narrative fields": (x) =>
    (x.units[5].unit.unit_summary = x.units[4].unit.unit_summary),
  "reading answers in bounds": (x) => (x.units[7].reading.questions[0].answer = 9),
  "esol answers in bounds": (x) => (x.units[7].esol_pack.doctor[0].answer_index = 99),
  "dictogloss word counts": (x) => (x.units[9].esol_pack.dictogloss.word_count += 1),
  "family EN/ES parity": (x) => (x.units[11].family.talk[0].es = x.units[11].family.talk[0].en),
  "transfer targets valid": (x) =>
    (x.units.find((d) => d.cross_subject_transfers.length).cross_subject_transfers[0].unit_id =
      "g9-zzz-u9"),
  "vocab fields populated": (x) => (x.units[13].connections[0].tier2_tier3_vocab[0].cue = ""),
  "lesson sequence contiguous": (x) => (x.lessons[15].lessons[2].sequence = 9),
  "math standards match grade": (x) => {
    const d = x.units.find((u) => u.unit.subject === "Math");
    d.unit.core_standards[0] = "9.RP.A.1";
  },
};

export const g06 = {
  id: "G-06",
  name: "data-integrity",
  async run({ data }) {
    const errors = [];
    const counts = {};
    for (const [name, check] of Object.entries(INTEGRITY_CHECKS)) {
      const e = check(data);
      counts[name] = e.length;
      errors.push(...e.slice(0, 5).map((m) => `[${name}] ${m}`));
    }
    return { errors, info: { checks: Object.keys(INTEGRITY_CHECKS).length } };
  },
  async controls({ data }) {
    return Object.entries(INTEGRITY_CHECKS).map(([name, check]) => {
      const copy = clone(data);
      MUTATIONS[name](copy);
      return { name: `mutated fixture: ${name}`, errors: check(copy) };
    });
  },
};

// ── G-08 ──────────────────────────────────────────────────────────────────────
export function checkDomains({ units }, base = baselines) {
  const errors = [];
  const domains = ["Listening", "Speaking", "Reading", "Writing"];
  let listening = 0;
  for (const d of units) {
    const have = new Set(d.activities.map((a) => a.domain));
    for (const dom of domains) if (!have.has(dom)) errors.push(`${d.unit.id}: no ${dom} activity`);
    listening += d.activities.filter((a) => a.domain === "Listening").length;
  }
  const floor = Math.floor(base.listeningActivities * base.floorRatio);
  if (listening < floor) errors.push(`listening activities ${listening} below floor ${floor}`);
  return errors;
}

export const g08 = {
  id: "G-08",
  name: "domain-coverage",
  async run({ data }) {
    return {
      errors: checkDomains(data),
      info: {
        listening: data.units.reduce(
          (n, d) => n + d.activities.filter((a) => a.domain === "Listening").length,
          0,
        ),
      },
    };
  },
  async controls({ data }) {
    const copy = clone(data);
    for (const d of copy.units.slice(0, 40))
      d.activities = d.activities.filter((a) => a.domain !== "Listening");
    const noWriting = clone(data);
    noWriting.units[0].activities = noWriting.units[0].activities.filter(
      (a) => a.domain !== "Writing",
    );
    return [
      { name: "listening activities removed from 40 units", errors: checkDomains(copy) },
      { name: "a unit loses all Writing", errors: checkDomains(noWriting) },
    ];
  },
};

// ── G-11 ──────────────────────────────────────────────────────────────────────
const post = (handlerFn, body, { ip = "203.0.113.1", raw } = {}) =>
  handlerFn({
    request: new Request("https://x.test/api/bcpss/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
      body: raw ?? JSON.stringify(body),
    }),
    env: {},
    params: {},
    waitUntil() {},
  });

export async function checkTelemetryHandler(onRequest) {
  const errors = [];
  const ok = { unit_id: "g6-math-u2", wida_tier: "3_4", event_type: "vocab_lookup" };
  const expect = async (name, res, status) => {
    if (res.status !== status) errors.push(`${name}: expected ${status}, got ${res.status}`);
  };
  await expect("valid event", await post(onRequest, ok, { ip: "198.51.100.1" }), 202);
  await expect(
    "unknown unit",
    await post(onRequest, { ...ok, unit_id: "g9-math-u9" }, { ip: "198.51.100.2" }),
    400,
  );
  await expect(
    "malformed unit id",
    await post(onRequest, { ...ok, unit_id: "../etc/passwd" }, { ip: "198.51.100.3" }),
    400,
  );
  await expect(
    "bad tier",
    await post(onRequest, { ...ok, wida_tier: "level 9" }, { ip: "198.51.100.4" }),
    400,
  );
  await expect(
    "bad event type",
    await post(onRequest, { ...ok, event_type: "drop table" }, { ip: "198.51.100.5" }),
    400,
  );
  await expect(
    "extra field (PII shaped)",
    await post(onRequest, { ...ok, email: "a@b.c" }, { ip: "198.51.100.6" }),
    400,
  );
  await expect(
    "non-JSON",
    await post(onRequest, null, { raw: "not json", ip: "198.51.100.7" }),
    400,
  );
  await expect(
    "oversize body",
    await post(onRequest, null, {
      raw: JSON.stringify({ ...ok, pad: "x".repeat(LIMITS.telemetry.maxBodyBytes + 100) }),
      ip: "198.51.100.8",
    }),
    413,
  );
  const before = (await getInsights({})).total_events;
  const internal = await post(onRequest, { ...ok, internal: true }, { ip: "198.51.100.9" });
  await expect("internal-flagged event is acknowledged", internal, 202);
  if ((await getInsights({})).total_events !== before)
    errors.push("internal-flagged event was stored");
  let limited = 0;
  for (let i = 0; i < LIMITS.telemetry.rateLimit.max + 5; i += 1)
    if ((await post(onRequest, ok, { ip: "198.51.100.77" })).status === 429) limited += 1;
  if (limited < 1)
    errors.push(`no 429 after ${LIMITS.telemetry.rateLimit.max + 5} rapid writes from one client`);
  return errors;
}

export const g11 = {
  id: "G-11",
  name: "telemetry-validation",
  async run() {
    return { errors: await checkTelemetryHandler(apiTelemetry.onRequest), info: { local: true } };
  },
  async controls() {
    const acceptsAnything = async () => new Response(JSON.stringify({ ok: true }), { status: 202 });
    return [
      {
        name: "handler that accepts everything",
        errors: await checkTelemetryHandler(acceptsAnything),
      },
    ];
  },
};

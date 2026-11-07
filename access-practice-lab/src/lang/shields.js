// Non-numeric growth display: five shields per skill (Cambridge Young Learners model), earned from evidence
// the lab already keeps. A shield names a habit that was shown ("Practised", "On my own"…), never a level, a
// score or a percentage, and a shield once earned is never taken away by a later miss.
//
// Evidence: ledger entries (src/lang/ledger.js) and saved practice records (store.js allRecords: each record's
// `results[id]` carries `evidence` and `date`). Pure logic; views/shields.js draws it.

const s = (en, es) => ({ en, es });

export const SHIELDS = [
  {
    id: "practised",
    name: s("Practised", "Practiqué"),
    how: s("Finish one activity.", "Termina una actividad."),
  },
  {
    id: "kept-going",
    name: s("Kept going", "Seguí adelante"),
    how: s("Finish five activities.", "Termina cinco actividades."),
  },
  {
    id: "on-my-own",
    name: s("On my own", "Por mi cuenta"),
    how: s("Do one activity with no help.", "Haz una actividad sin ayuda."),
  },
  {
    id: "two-days",
    name: s("Two days", "Dos días"),
    how: s(
      "Work on your own on two different days.",
      "Trabaja por tu cuenta en dos días diferentes.",
    ),
  },
  {
    id: "made-better",
    name: s("Made it better", "Lo mejoré"),
    how: s(
      "Revise your work, or do five activities on your own.",
      "Revisa tu trabajo o haz cinco actividades por tu cuenta.",
    ),
  },
];

export const SKILLS = ["Listening", "Reading", "Speaking", "Writing"];

const day = (t) => (typeof t === "string" ? t.slice(0, 10) : "");

/** Evidence counts for one skill from ledger entries and practice records. */
export function skillEvidence(domain, entries = [], records = []) {
  const mine = entries.filter((e) => e?.domain === domain);
  const results = records
    .filter((r) => r?.domain === domain)
    .flatMap((r) => Object.values(r.record?.results || {}))
    .filter((x) => x && typeof x === "object");
  const done = records
    .filter((r) => r?.domain === domain)
    .reduce((n, r) => n + (r.record?.complete?.length || 0), 0);
  const firsts = mine.filter((e) => e.kind !== "revision");
  const ownEntries = firsts.filter((e) => e.stage === "independent");
  const ownResults = results.filter((x) => x.evidence === "independent");
  const ownDays = new Set(
    [...ownEntries.map((e) => day(e.t)), ...ownResults.map((x) => day(x.date))].filter(Boolean),
  );
  return {
    finished: done + firsts.length,
    own: ownEntries.length + ownResults.length,
    ownDays: ownDays.size,
    revisions:
      mine.filter((e) => e.kind === "revision").length +
      results.filter((x) => x.evidence === "revised").length,
  };
}

/** The shields earned for one skill, in order. */
export function shieldsFor(ev) {
  const earned = {
    practised: ev.finished >= 1,
    "kept-going": ev.finished >= 5,
    "on-my-own": ev.own >= 1,
    "two-days": ev.ownDays >= 2,
    "made-better": ev.revisions >= 1 || ev.own >= 5,
  };
  return SHIELDS.map((sh) => ({ ...sh, earned: earned[sh.id] }));
}

export function shieldBoard(entries = [], records = []) {
  return SKILLS.map((domain) => ({
    domain,
    shields: shieldsFor(skillEvidence(domain, entries, records)),
  }));
}

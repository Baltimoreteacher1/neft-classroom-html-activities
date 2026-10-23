// "Send my work to my teacher": a bundle the learner chooses to share, and the reader the Teacher Hub
// uses. No accounts and no uploads — the learner copies a code or downloads a file and hands it over
// (LMS, email, USB), exactly like the existing ACCESS1 progress code, which the reader also accepts.
// Only an alias is included; there is no email, no school ID, no device ID.
import { PREFIX } from "../store.js";
import { loadLedger } from "./ledger.js";
import { loadStudio } from "./studio.js";

export const SHARE_PREFIX = "ACCESST1.";
const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
const unb64 = (s) => decodeURIComponent(escape(atob(s)));
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/** @param {{alias?:string, band?:string, include?:{writing?:boolean,speaking?:boolean,missions?:boolean,detective?:boolean}}} o */
export function buildShare({ alias = "", band = "6-8", include = {} } = {}, ledger = loadLedger(), studio = loadStudio()) {
  const inc = { writing: true, speaking: true, missions: true, detective: true, ...include };
  const keep = (obj, on) => (on ? obj : {});
  const speaking = Object.fromEntries(
    Object.entries(inc.speaking ? studio.speaking : {}).map(([id, s]) => [id, { stage: s.stage, used: s.used, takes: s.takes.map(({ id: tid, t, seconds, audio, transcript, selfReview, teacherReview, finished }) => ({ id: tid, t, seconds, audio, transcript, selfReview, teacherReview, finished })) }]),
  );
  return {
    v: 1,
    kind: "share",
    created: new Date().toISOString(),
    alias: String(alias || "").trim().slice(0, 40) || "Student",
    band,
    ledger: { entries: ledger.entries.filter((e) => e.band === band) },
    studio: { v: 1, writing: keep(studio.writing, inc.writing), speaking, missions: keep(studio.missions, inc.missions), detective: keep(studio.detective, inc.detective), portfolio: studio.portfolio },
  };
}

export const encodeShare = (bundle) => `${SHARE_PREFIX}${b64(JSON.stringify(bundle))}`;

/** Accepts ACCESST1.… share codes, ACCESS1.… progress codes, or the JSON of either. Returns a normalised student. */
export function decodeShare(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Paste a code or choose a file first.");
  if (raw.length > 8_000_000) throw new Error("That file is too large to be a student share file.");
  let obj;
  try {
    if (raw.startsWith(SHARE_PREFIX)) obj = JSON.parse(unb64(raw.slice(SHARE_PREFIX.length)));
    else if (raw.startsWith("ACCESS1.")) obj = fromProgressCode(JSON.parse(unb64(raw.slice(8))));
    else obj = JSON.parse(raw);
  } catch {
    throw new Error("That is not a share code or progress code. Paste the whole code, starting with ACCESST1. or ACCESS1.");
  }
  if (obj?.kind === "share") return normalize(obj);
  if (isObj(obj) && obj.ledger) return normalize(obj);
  throw new Error("That file does not contain student work.");
}

function fromProgressCode(parsed) {
  if (!isObj(parsed?.data)) throw new Error("invalid");
  const d = parsed.data;
  const j = (k) => {
    try {
      return JSON.parse(d[`${PREFIX}:${k}`] || "null");
    } catch {
      return null;
    }
  };
  return { v: 1, kind: "share", alias: String(d[`${PREFIX}:studentName`] || "").slice(0, 40) || "Student", band: "6-8", created: "", ledger: j("ledger") || { entries: [] }, studio: j("studio") || {}, records: Object.fromEntries(Object.entries(d).filter(([k]) => /:(Listening|Reading|Speaking|Writing|Model-Test):[ABC]$/.test(k)).map(([k, v]) => [k.slice(PREFIX.length + 1), safe(v)])) };
}
const safe = (v) => {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

/** Shape the Teacher Hub works with. Never trusts the input's structure. */
export function normalize(o) {
  const entries = Array.isArray(o.ledger?.entries) ? o.ledger.entries.filter((e) => e && typeof e.t === "string" && typeof e.src === "string") : [];
  const s = isObj(o.studio) ? o.studio : {};
  return {
    alias: String(o.alias || "Student").slice(0, 40),
    band: o.band === "3-5" ? "3-5" : "6-8",
    created: String(o.created || ""),
    ledger: { entries },
    studio: { writing: isObj(s.writing) ? s.writing : {}, speaking: isObj(s.speaking) ? s.speaking : {}, missions: isObj(s.missions) ? s.missions : {}, detective: isObj(s.detective) ? s.detective : {} },
  };
}

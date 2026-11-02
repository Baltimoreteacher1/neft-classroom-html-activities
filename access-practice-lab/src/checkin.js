// Passport check-in: the one-tap way a student tells a teacher (or family) which journey stops are finished.
// A check-in is a link, not an upload. It carries a nickname, a date and, per country, which stops are done.
// No answers, writing, audio, email or school ID. The Teacher Hub reads it from the URL fragment in the
// browser, so the server never receives it. It is a progress note, never a score or a level.
import { COUNTRIES } from "./journey.js";
import { CORE_DOMAINS, LEVEL_KEYS, storage } from "./util.js";

export const CHECKIN_PARAM = "checkin";
const SENT_KEY = "accessPracticeLab:v1:checkinSent";
const BANDS = ["3-5", "6-8"];
const MAX_ALIAS = 40;
const MAX_CODE = 4000;

const b64url = (s) =>
  btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const unb64url = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
export const routeKey = (domain, level) => `${domain}:${level}`;
const cleanAlias = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .trim()
    .slice(0, MAX_ALIAS);

/** Stops finished per route since the last successful send, e.g. { "Reading:A": 3 }. */
export function loadSent() {
  try {
    const parsed = JSON.parse(storage.get(SENT_KEY) || "{}");
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([k, n]) => /^[A-Za-z]+:[ABC]$/.test(k) && Number.isInteger(n) && n >= 0 && n <= 12,
      ),
    );
  } catch {
    return {};
  }
}
export const saveSent = (routes) =>
  storage.set(
    SENT_KEY,
    JSON.stringify(
      Object.fromEntries(routes.map((r) => [routeKey(r.domain, r.level), r.stopsDone])),
    ),
  );

/** Routes with stops finished beyond what was last sent. */
export const newSince = (routes, sent = loadSent()) =>
  routes
    .filter((r) => r.stopsDone > (sent[routeKey(r.domain, r.level)] ?? 0))
    .map((r) => ({ ...r, fresh: r.stopsDone - (sent[routeKey(r.domain, r.level)] ?? 0) }));

/** @param {{alias: string, band: string, date: string, routes: ReturnType<import("./journey.js").routeProgress>}} o */
export function buildCheckin({ alias, band, date, routes }) {
  return {
    v: 1,
    kind: "checkin",
    a: cleanAlias(alias),
    b: band,
    t: date,
    r: routes
      .filter((r) => r.stopsDone > 0)
      .map((r) => ({ d: r.domain, l: r.level, s: r.stops.map((on) => (on ? 1 : 0)).join("") })),
  };
}
export const encodeCheckin = (checkin) => b64url(JSON.stringify(checkin));
export const checkinUrl = (checkin, origin = location.origin) =>
  `${origin}/access-teacher/#${CHECKIN_PARAM}=${encodeCheckin(checkin)}`;

/**
 * Accepts a check-in link, the part after `#checkin=`, or the bare code. Throws a plain-language Error on
 * anything else. The input is untrusted: every field is checked against a closed list or a strict pattern.
 * @returns {{alias: string, band: string, date: string, routes: {domain: string, level: string, stops: boolean[]}[]}}
 */
export function decodeCheckin(text) {
  const raw = String(text ?? "").trim();
  if (!raw) throw new Error("Paste a check-in link first.");
  const code = raw.includes(`${CHECKIN_PARAM}=`)
    ? raw.split(`${CHECKIN_PARAM}=`).pop().split(/[\s&]/)[0]
    : raw;
  if (code.length > MAX_CODE || !/^[A-Za-z0-9_-]+$/.test(code))
    throw new Error("That is not a Passport check-in link.");
  let o;
  try {
    o = JSON.parse(unb64url(code));
  } catch {
    throw new Error("That is not a Passport check-in link.");
  }
  if (
    o?.v !== 1 ||
    o.kind !== "checkin" ||
    !BANDS.includes(o.b) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(o.t) ||
    !Array.isArray(o.r) ||
    o.r.length > 12
  )
    throw new Error("That check-in is not in a format this page understands.");
  const alias = cleanAlias(o.a);
  if (!alias) throw new Error("That check-in has no nickname.");
  const seen = new Set();
  const routes = [];
  for (const r of o.r) {
    if (
      !CORE_DOMAINS.includes(r?.d) ||
      !LEVEL_KEYS.includes(r?.l) ||
      !/^[01]{1,12}$/.test(r?.s) ||
      seen.has(routeKey(r.d, r.l))
    )
      throw new Error("That check-in has an unknown country.");
    seen.add(routeKey(r.d, r.l));
    routes.push({ domain: r.d, level: r.l, stops: [...r.s].map((c) => c === "1") });
  }
  return { alias, band: o.b, date: o.t, routes };
}

/** "Japan 5 of 12 stops" for a route row, in the reader's language. */
export const routeLine = (I, r) => {
  const done = r.stops.filter(Boolean).length;
  return I.S(
    `${COUNTRIES[r.domain][r.level][0]}: ${done} of ${r.stops.length} stops`,
    `${COUNTRIES[r.domain][r.level][1]}: ${done} de ${r.stops.length} paradas`,
  );
};

/** Plain-text note a student shares. The teacher version ends with the link; the family version has none. */
export function checkinMessage(I, { alias, routes, url = "" }) {
  const lines = routes
    .map((r) => `• ${routeLine(I, { domain: r.domain, level: r.level, stops: r.stops })}`)
    .join("\n");
  const head = I.S(`${alias}'s Passport check-in`, `Registro del Pasaporte de ${alias}`);
  const tail = url
    ? `\n\n${I.S("Teacher: open this link to add it to your Hub.", "Docente: abra este enlace para agregarlo a su Centro.")}\n${url}`
    : "";
  return `${head}\n${lines}${tail}`;
}

// Pure logic for the Digital Escape Challenge: exact rational arithmetic, puzzle checking, code-piece derivation,
// misconception diagnosis and the door. No DOM, no storage: importable by the browser engine and by Node tests.

// ---------- exact rationals (BigInt) ----------
const big = (n) => BigInt(n);
const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};
export function rat(n, d = 1n) {
  n = big(n);
  d = big(d);
  if (d === 0n) throw new Error("division by zero");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
export const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => rat(a.n * b.n, a.d * b.d);
export const div = (a, b) => rat(a.n * b.d, a.d * b.n);
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const cmp = (a, b) => {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
};
/** Canonical text: lowest terms, "n" for integers, "n/d" otherwise. */
export const canon = (r) => (r.d === 1n ? String(r.n) : `${r.n}/${r.d}`);

const DECIMAL = /^(-?)(\d*)\.(\d+)$/;
function parseNumber(t) {
  let m = /^(-?)(\d+)$/.exec(t);
  if (m) return rat(big(m[1] + m[2]));
  m = DECIMAL.exec(t);
  if (m) return rat(big(m[1] + (m[2] || "0") + m[3]), 10n ** big(m[3].length));
  return null;
}

/** parseRational("3/4" | "0.75" | "7 1/2" | "$12" | 6 | 1.5) -> rational | null. Strict: junk returns null. */
export function parseRational(input) {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return parseRational(String(input));
  }
  const s = String(input ?? "")
    .trim()
    .replace(/^\$/, "")
    .replace(/,/g, "")
    .trim();
  if (!s || !/^[\d\s./-]+$/.test(s)) return null;
  let m = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) {
    if (big(m[4]) === 0n) return null;
    const whole = big(m[2]);
    const part = rat(big(m[3]), big(m[4]));
    const v = add(rat(whole), part);
    return m[1] ? rat(-v.n, v.d) : v;
  }
  m = /^(-?\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) return big(m[2]) === 0n ? null : rat(big(m[1]), big(m[2]));
  return parseNumber(s);
}

/** Exact rational expression evaluator: + - * / ( ) unary minus, integers and decimals. */
export function evalCalc(expr) {
  const toks = String(expr).match(/\d+\.\d+|\d+|[+\-*/()]/g);
  if (!toks || toks.join("") !== String(expr).replace(/\s+/g, ""))
    throw new Error(`calc "${expr}" has unsupported characters`);
  let i = 0;
  const peek = () => toks[i];
  const primary = () => {
    const t = toks[i++];
    if (t === "(") {
      const v = sum();
      if (toks[i++] !== ")") throw new Error("missing )");
      return v;
    }
    if (t === "-") return mul(rat(-1), primary());
    const v = t && parseNumber(t);
    if (!v) throw new Error(`bad calc "${expr}"`);
    return v;
  };
  const product = () => {
    let v = primary();
    while (peek() === "*" || peek() === "/")
      v = toks[i++] === "*" ? mul(v, primary()) : div(v, primary());
    return v;
  };
  const sum = () => {
    let v = product();
    while (peek() === "+" || peek() === "-")
      v = toks[i++] === "+" ? add(v, product()) : sub(v, product());
    return v;
  };
  const out = sum();
  if (i !== toks.length) throw new Error(`bad calc "${expr}"`);
  return out;
}

// ---------- puzzles ----------
export const PUZZLE_TYPES = ["numeric", "choice", "order", "match", "sort", "explain"];
const multi = (p) => Array.isArray(p.answer);
const sortedIdx = (a) => [...new Set(a)].map(Number).sort((x, y) => x - y);

/** The response a learner would give to get it right (used by tests and by the transfer check). */
export function correctResponse(p) {
  if (p.type === "numeric") return canon(parseRational(p.answer));
  if (p.type === "choice" || p.type === "explain") return p.answer;
  if (p.type === "order") return [...p.answer];
  if (p.type === "match") return { ...p.answer };
  if (p.type === "sort") return Object.fromEntries(p.cards.map((c) => [c.id, c.bin]));
  throw new Error(`unknown puzzle type ${p.type}`);
}

/** Is the response complete enough to check? Returns an error message or null. */
export function incomplete(p, resp) {
  if (p.type === "numeric")
    return parseRational(resp) ? null : "Type a number, a fraction like 3/4, or a decimal.";
  if (p.type === "choice") return Number.isInteger(resp) ? null : "Choose an answer first.";
  if (p.type === "explain")
    return multi(p)
      ? sortedIdx(resp || []).length
        ? null
        : "Choose at least one statement."
      : Number.isInteger(resp)
        ? null
        : "Choose a statement first.";
  if (p.type === "order")
    return Array.isArray(resp) && resp.length === p.items.length
      ? null
      : "Put every item in order.";
  if (p.type === "match")
    return p.lefts.every((l) => resp?.[l.id]) ? null : "Choose a match for every item.";
  if (p.type === "sort")
    return p.cards.every((c) => resp?.[c.id]) ? null : "Place every card in a group.";
  return "Unknown puzzle.";
}

export function isCorrect(p, resp) {
  if (incomplete(p, resp)) return false;
  if (p.type === "numeric") return eq(parseRational(resp), parseRational(p.answer));
  if (p.type === "choice") return resp === p.answer;
  if (p.type === "explain")
    return multi(p)
      ? JSON.stringify(sortedIdx(resp)) === JSON.stringify(sortedIdx(p.answer))
      : resp === p.answer;
  if (p.type === "order") return resp.every((id, i) => id === p.answer[i]);
  if (p.type === "match") return p.lefts.every((l) => resp[l.id] === p.answer[l.id]);
  if (p.type === "sort") return p.cards.every((c) => resp[c.id] === c.bin);
  return false;
}

/** The code piece derived from a response. Defined for every complete response (right or wrong); granted only when right. */
export function tokenOf(p, resp) {
  if (incomplete(p, resp)) return null;
  if (p.type === "numeric") return canon(parseRational(resp));
  if (p.type === "choice") return p.tokens[resp];
  if (p.type === "explain")
    return multi(p)
      ? sortedIdx(resp)
          .map((i) => p.tokens[i])
          .join("+")
      : p.tokens[resp];
  if (p.type === "order") return resp.map((id) => p.items.find((x) => x.id === id).token).join(".");
  if (p.type === "match")
    return p.lefts.map((l) => p.rights.find((r) => r.id === resp[l.id]).token).join(".");
  if (p.type === "sort")
    return p.bins
      .map((b) =>
        p.cards
          .filter((c) => resp[c.id] === b.id)
          .map((c) => c.token)
          .join("."),
      )
      .join("|");
  return null;
}

/** Response key and facts, used to match misconceptions. */
export function keyOf(p, resp) {
  if (p.type === "numeric") return canon(parseRational(resp));
  if (p.type === "choice") return resp;
  if (p.type === "explain") return multi(p) ? sortedIdx(resp).join(",") : resp;
  if (p.type === "order") return resp.join(",");
  if (p.type === "match") return p.lefts.map((l) => `${l.id}=${resp[l.id]}`).join(";");
  return "";
}
export function factsOf(p, resp) {
  if (p.type === "numeric") return [canon(parseRational(resp))];
  if (p.type === "choice") return [String(resp)];
  if (p.type === "explain") return (multi(p) ? sortedIdx(resp) : [resp]).map(String);
  if (p.type === "order") {
    const out = [];
    resp.forEach((a, i) => resp.slice(i + 1).forEach((b) => out.push(`${a}>${b}`)));
    return out;
  }
  if (p.type === "match") return p.lefts.map((l) => `${l.id}=${resp[l.id]}`);
  if (p.type === "sort") return p.cards.map((c) => `${c.id}:${resp[c.id]}`);
  return [];
}

/** First misconception that explains a wrong response, or null. */
export function diagnose(p, resp) {
  if (incomplete(p, resp)) return null;
  const key = String(keyOf(p, resp));
  const facts = new Set(factsOf(p, resp));
  return (
    (p.misconceptions || []).find(
      (m) =>
        (m.pick != null && String(m.pick) === key) ||
        (Array.isArray(m.has) && m.has.length && m.has.every((f) => facts.has(String(f)))),
    ) || null
  );
}

/** Item handed to createItemLoop: misconceptions keyed by `match` (= tag), model text from the worked example. */
export function loopItem(room) {
  const p = room.puzzle;
  return {
    id: room.id,
    hints: p.hints,
    model: p.model.text,
    right: p.why,
    transfer: p.transfer,
    misconceptions: (p.misconceptions || []).map((m) => ({ ...m, match: m.tag, pick: undefined })),
  };
}

/** Seeded start order for an order puzzle that is never already correct. */
export function startOrder(p, shuffle, seed) {
  const ids = p.items.map((x) => x.id);
  for (let k = 0; k < 20; k++) {
    const o = shuffle(ids, `${seed}:${k}`);
    if (o.some((id, i) => id !== p.answer[i])) return o;
  }
  return [...ids].reverse();
}

// ---------- session, door, debrief ----------
export const normalizeCode = (s) =>
  String(s ?? "")
    .replace(/[\s.\-·,|+_]/g, "")
    .toUpperCase();

/**
 * createSession({rooms, door}): the only place a code piece is ever granted.
 * submit(roomId, response) grants room.piece = tokenOf(response) iff the response is right.
 */
export function createSession({ rooms, door }, saved = {}) {
  const pieces = { ...(saved.pieces || {}) };
  const find = (id) => rooms.find((r) => r.id === id);
  return {
    pieces,
    submit(roomId, resp) {
      const room = find(roomId);
      const ok = isCorrect(room.puzzle, resp);
      if (ok) pieces[roomId] = tokenOf(room.puzzle, resp);
      return { ok, piece: ok ? pieces[roomId] : null };
    },
    solved: (id) => id in pieces,
    allSolved: () => rooms.every((r) => r.id in pieces),
    /** The expected code, only when every room is solved. */
    code: () =>
      rooms.every((r) => r.id in pieces) ? door.order.map((id) => pieces[id]).join("") : null,
    displayCode: () => door.order.map((id) => pieces[id] ?? "?").join(" · "),
    checkDoor(typed) {
      const want = this.code();
      if (want == null)
        return {
          ok: false,
          missing: rooms.filter((r) => !(r.id in pieces)).map((r) => r.id),
          orderOnly: false,
        };
      const got = normalizeCode(typed);
      if (got === normalizeCode(want)) return { ok: true, missing: [], orderOnly: false };
      const missing = door.order.filter((id) => !got.includes(normalizeCode(pieces[id])));
      return { ok: false, missing, orderOnly: missing.length === 0 };
    },
  };
}

/** Debrief rows from per-room evidence records ({id,tries,hints,ok,tags}) and loop state flags. */
export function debrief(rooms, records) {
  return rooms.map((room) => {
    const r = records[room.id] || { tries: 0, hints: 0, ok: false, tags: [] };
    const secure = !!r.ok && r.tries === 1 && r.hints === 0;
    const used = [];
    if (r.hints) used.push(`${r.hints} ${r.hints === 1 ? "hint" : "hints"}`);
    if (r.tries > 1) used.push(`${r.tries} tries`);
    if (r.model) used.push("a worked example");
    if (r.transfer) used.push("a related puzzle");
    return {
      id: room.id,
      title: room.title,
      concept: room.gate.label,
      secure,
      used,
      tags: r.tags || [],
    };
  });
}

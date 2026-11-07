// A shareable manipulative board: the Model Lab model, the seed that builds its numbers, and the moves made so far,
// carried in the link (#board=b1.<base64url JSON>). Opening the link rebuilds the board by replaying the moves
// through the model's own rules, so a bad or outdated move is refused instead of trusted. Nothing is stored.

export const MAX_MOVES = 60;
export const MAX_TOKEN = 3000;
const ID = /^[\w-]{1,40}$/;

const toB64 = (text) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
const fromB64 = (text) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0)),
  );

// One move is a flat object of short strings, finite numbers and booleans, so a link cannot smuggle anything bigger.
function cleanMove(move) {
  if (!move || typeof move !== "object" || Array.isArray(move)) return null;
  const entries = Object.entries(move);
  if (!entries.length || entries.length > 8) return null;
  const out = {};
  for (const [key, value] of entries) {
    if (!ID.test(key)) return null;
    if (typeof value === "string" && value.length <= 40) out[key] = value;
    else if (typeof value === "number" && Number.isFinite(value) && Math.abs(value) < 1e9) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
    else return null;
  }
  return out;
}

export function cleanBoard(value) {
  if (!value || typeof value !== "object" || !ID.test(String(value.model || ""))) return null;
  const seed = Math.floor(Number(value.seed));
  const grade = Math.floor(Number(value.grade));
  if (!(seed >= 1 && seed <= 99999999) || !(grade >= 0 && grade <= 8)) return null;
  const moves = (Array.isArray(value.moves) ? value.moves : []).slice(0, MAX_MOVES).map(cleanMove);
  return { model: value.model, seed, grade, moves: moves.filter(Boolean) };
}

export function encodeBoard(board) {
  const clean = cleanBoard(board);
  if (!clean) return null;
  const token = `b1.${toB64(JSON.stringify([clean.model, clean.seed, clean.grade, clean.moves]))}`;
  return token.length <= MAX_TOKEN ? token : null;
}

export function decodeBoard(token) {
  const match = /^b1\.([\w-]+)$/.exec(String(token || "").trim());
  if (!match || match[1].length > MAX_TOKEN) return null;
  try {
    const [model, seed, grade, moves] = JSON.parse(fromB64(match[1]));
    return cleanBoard({ model, seed, grade, moves });
  } catch {
    return null;
  }
}

export const boardUrl = (board, base = "https://eduwonderlab.com/math/fluency-lab/") => {
  const token = encodeBoard(board);
  return token ? `${base}?view=models&grade=${board.grade}#board=${token}` : null;
};

export function boardFromHash(hash) {
  const match = /(?:^#|&)board=([^&]+)/.exec(String(hash || ""));
  return match ? decodeBoard(decodeURIComponent(match[1])) : null;
}

// The moves that built the engine's current state: accepted moves in order, with undo, redo and reset applied.
// Returns null when the log was cut short (it keeps the last 400 events), because the start is then unknown.
export function movesFromEngine(engine) {
  const log = engine?.log || [];
  if (log.length >= 400) return null;
  const done = [];
  const undone = [];
  for (const event of log) {
    if (event.type === "move" && event.ok) {
      done.push(event.action);
      undone.length = 0;
    } else if (event.type === "undo" && done.length) undone.push(done.pop());
    else if (event.type === "redo" && undone.length) done.push(undone.pop());
    else if (event.type === "reset") {
      done.length = 0;
      undone.length = 0;
    }
  }
  return done;
}

// Replays moves on a fresh engine. A move the model refuses (or that throws) is skipped; returns how many applied.
export function replayMoves(engine, moves) {
  let applied = 0;
  for (const move of moves) {
    try {
      if (engine.dispatch(move).ok) applied += 1;
    } catch {
      /* a malformed move changes nothing */
    }
  }
  return applied;
}

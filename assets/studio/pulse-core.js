/**
 * Class Pulse core (window.StudioPulseCore): a short, anonymous, checksummed code a student copies from a Practice or Challenge
 * studio and a teacher pastes into /teacher-tools/class-pulse/. Pure and DOM-free; the browser glue is assets/studio/pulse.js.
 *
 * What a code says (no name, no email, nothing that identifies a person):
 *   lesson + mode, how many problems are done in each of the five sections, how many answers were Clean / Assisted / Guessed,
 *   how many were "Certain" and wrong, how many closed items were flagged for the teacher, the seals earned, the student's top
 *   three named misconceptions with counts, and up to three places (section + problem) worth a look.
 *
 * Shape: a version character, a bit-packed payload, a CRC-16 of that payload, all as Crockford base32 in groups of five
 * ("7K3QM-...") so a typo is caught and a pasted code survives line breaks. A trap is carried as a 24-bit hash of its id
 * (data/practice-studio/misconceptions.json); the teacher page reads the hash back to a name from its generated index.
 *
 *   encode(pulse)            -> "7K3QM-..."
 *   decode(text)             -> { ok: true, pulse } | { ok: false, error: "empty"|"chars"|"version"|"length"|"checksum" }
 *   fromSnapshot(snapshot)   -> pulse   (the policy: top three traps, which places to point at, caps)
 *   trapHash(id)             -> 24-bit integer
 *   askAtHome(fix, fixEs)    -> { q, qEs, idea, ideaEs }   the Family Window text for a trap
 *   MAX_CHARS                -> 120, the hard limit on a code's length
 */
(() => {
  const W = /** @type {any} */ (typeof window === "undefined" ? globalThis : window);
  const VERSION = 1;
  const MAX_CHARS = 120;
  const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  /** the ceiling of every counted field, set by its bit width */
  const CAP = { done: 63, tier: 127, count: 31, seal: 15, trapN: 63, trapCount: 3, focusCount: 3 };
  /** why a place is worth a look, in the order a teacher should see them */
  const FOCUS_KINDS = ["teacher", "no-twin", "certain", "guessed"];

  /** @param {number} n @param {number} max */
  const clamp = (n, max) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));

  /* ---- bits ------------------------------------------------------------------------------------------------- */
  /** @param {number[]} bits @param {number} value @param {number} width */
  function put(bits, value, width) {
    for (let i = width - 1; i >= 0; i--) bits.push(Math.floor(value / 2 ** i) % 2);
  }
  /** Reads `width` bits at the cursor, or throws when the code ends early. @param {{bits: number[], at: number}} r */
  function take(r, width) {
    if (r.at + width > r.bits.length) throw new RangeError("short");
    let v = 0;
    for (let i = 0; i < width; i++) v = v * 2 + r.bits[r.at + i];
    r.at += width;
    return v;
  }
  /** @param {number[]} bits */
  function toBytes(bits) {
    const out = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = b * 2 + (bits[i + j] || 0);
      out.push(b);
    }
    return out;
  }
  /** CRC-16/CCITT-FALSE. @param {number[]} bytes */
  function crc16(bytes) {
    let crc = 0xffff;
    for (const b of bytes) {
      crc ^= b << 8;
      for (let k = 0; k < 8; k++)
        crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc;
  }

  /** 24-bit FNV-1a hash of a trap id. The teacher page's index maps it back; the test proves no two real traps collide. @param {string} id */
  function trapHash(id) {
    let h = 0x811c9dc5;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ((h >>> 24) ^ h) & 0xffffff;
  }

  /* ---- encode ----------------------------------------------------------------------------------------------- */
  /** @param {string} lesson */
  function parseLesson(lesson) {
    const m = /^(\d{1,2})-(\d{1,2})$/.exec(String(lesson));
    if (!m || Number(m[1]) > 15 || Number(m[2]) > 63)
      throw new RangeError(`not a lesson id: ${lesson}`);
    return [Number(m[1]), Number(m[2])];
  }

  /** @param {any} p */
  function encode(p) {
    const bits = /** @type {number[]} */ ([]);
    const [unit, num] = parseLesson(p.lesson);
    put(bits, VERSION, 5);
    put(bits, unit, 4);
    put(bits, num, 6);
    put(bits, p.mode === "challenge" ? 1 : 0, 1);
    put(bits, p.u4 ? 1 : 0, 1);
    for (let t = 0; t < 5; t++) put(bits, clamp((p.done || [])[t], CAP.done), 6);
    put(bits, clamp(p.clean, CAP.tier), 7);
    put(bits, clamp(p.assisted, CAP.tier), 7);
    put(bits, clamp(p.guessed, CAP.tier), 7);
    put(bits, clamp(p.certain, CAP.count), 5);
    put(bits, clamp(p.fTeacher, CAP.count), 5);
    put(bits, clamp(p.fNoTwin, CAP.count), 5);
    for (let s = 0; s < 3; s++) put(bits, clamp((p.seals || [])[s], CAP.seal), 4);
    const traps = (p.traps || []).slice(0, CAP.trapCount);
    put(bits, traps.length, 2);
    for (const t of traps) {
      put(bits, t.h ?? trapHash(String(t.id)), 24);
      put(bits, clamp(t.n, CAP.trapN), 6);
    }
    const focus = (p.focus || []).slice(0, CAP.focusCount);
    put(bits, focus.length, 2);
    for (const f of focus) {
      put(bits, Math.max(0, FOCUS_KINDS.indexOf(f.kind)), 2);
      put(bits, clamp(f.tab, 5), 3);
      put(bits, clamp(f.i, CAP.done), 6);
    }
    put(bits, crc16(toBytes(bits)), 16);
    while (bits.length % 5) bits.push(0);
    let text = "";
    for (let i = 0; i < bits.length; i += 5) {
      const idx = bits.slice(i, i + 5).reduce((a, b) => a * 2 + b, 0);
      text += ALPHABET[idx];
      if ((i / 5) % 5 === 4 && i + 5 < bits.length) text += "-";
    }
    return text;
  }

  /* ---- decode ----------------------------------------------------------------------------------------------- */
  /** @param {string} error @param {any} [extra] */
  const fail = (error, extra) => ({ ok: false, error, ...(extra || {}) });

  /** @param {unknown} input */
  function decode(input) {
    const s = String(input ?? "")
      .toUpperCase()
      .replace(/[\s\-_.]+/g, "")
      .replace(/O/g, "0")
      .replace(/[IL]/g, "1");
    if (!s) return fail("empty");
    if (s.length > MAX_CHARS) return fail("length");
    const bits = /** @type {number[]} */ ([]);
    for (const ch of s) {
      const v = ALPHABET.indexOf(ch);
      if (v < 0) return fail("chars");
      put(bits, v, 5);
    }
    const r = { bits, at: 0 };
    try {
      const v = take(r, 5);
      if (v !== VERSION) return fail("version", { version: v });
      const unit = take(r, 4);
      const num = take(r, 6);
      const mode = take(r, 1) ? "challenge" : "practice";
      const u4 = !!take(r, 1);
      const done = [0, 1, 2, 3, 4].map(() => take(r, 6));
      const clean = take(r, 7);
      const assisted = take(r, 7);
      const guessed = take(r, 7);
      const certain = take(r, 5);
      const fTeacher = take(r, 5);
      const fNoTwin = take(r, 5);
      const seals = [0, 1, 2].map(() => take(r, 4));
      const traps = Array.from({ length: take(r, 2) }, () => ({ h: take(r, 24), n: take(r, 6) }));
      const focus = Array.from({ length: take(r, 2) }, () => ({
        kind: FOCUS_KINDS[take(r, 2)],
        tab: take(r, 3),
        i: take(r, 6),
      }));
      const end = r.at;
      const sum = take(r, 16);
      if (sum !== crc16(toBytes(bits.slice(0, end)))) return fail("checksum");
      if (bits.length - r.at >= 5 || bits.slice(r.at).some(Boolean)) return fail("checksum");
      if (num < 1 && unit !== 0) return fail("checksum");
      return {
        ok: true,
        pulse: {
          v,
          lesson: `${unit}-${num}`,
          mode,
          u4,
          done,
          clean,
          assisted,
          guessed,
          certain,
          fTeacher,
          fNoTwin,
          seals,
          traps,
          focus,
        },
      };
    } catch (_e) {
      return fail("length");
    }
  }

  /* ---- policy: a studio snapshot becomes a pulse -------------------------------------------------------------- */
  /**
   * @param {{lesson: string, mode: string, u4?: boolean, done?: number[], tiers?: {clean?: number, assisted?: number, guessed?: number},
   *   misses?: Record<string, {n?: number, auto?: boolean}>, certain?: {tab: number, i: number}[],
   *   flags?: {kind: string, tab: number, i: number}[], guessed?: {tab: number, i: number}[], seals?: number[]}} s
   */
  function fromSnapshot(s) {
    // Only named misconceptions travel: an untagged miss is keyed by a sentence signature ("skill:words"), which is not a trap id.
    const traps = Object.entries(s.misses || {})
      .filter(([tag, r]) => !r?.auto && !tag.includes(":") && Number(r?.n) > 0)
      .sort((a, b) => Number(b[1].n) - Number(a[1].n) || a[0].localeCompare(b[0]))
      .slice(0, CAP.trapCount)
      .map(([id, r]) => ({ id, h: trapHash(id), n: clamp(r.n, CAP.trapN) }));
    const flags = s.flags || [];
    /** @type {{kind: string, tab: number, i: number}[]} */
    const places = [
      ...flags.filter((f) => f.kind === "teacher"),
      ...flags.filter((f) => f.kind === "no-twin"),
      ...(s.certain || []).map((f) => ({ kind: "certain", tab: f.tab, i: f.i })),
      ...(s.guessed || []).map((f) => ({ kind: "guessed", tab: f.tab, i: f.i })),
    ];
    const seen = new Set();
    const focus = places
      .filter((f) => {
        const key = `${f.tab}:${f.i}`;
        if (seen.has(key) || !(f.tab >= 1 && f.tab <= 5 && f.i >= 1)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, CAP.focusCount);
    return {
      v: VERSION,
      lesson: s.lesson,
      mode: s.mode === "challenge" ? "challenge" : "practice",
      u4: !!s.u4,
      done: [0, 1, 2, 3, 4].map((t) => clamp((s.done || [])[t], CAP.done)),
      clean: clamp(s.tiers?.clean, CAP.tier),
      assisted: clamp(s.tiers?.assisted, CAP.tier),
      guessed: clamp(s.tiers?.guessed, CAP.tier),
      certain: clamp((s.certain || []).length, CAP.count),
      fTeacher: clamp(flags.filter((f) => f.kind === "teacher").length, CAP.count),
      fNoTwin: clamp(flags.filter((f) => f.kind === "no-twin").length, CAP.count),
      seals: [0, 1, 2].map((k) => clamp((s.seals || [])[k], CAP.seal)),
      traps,
      focus,
    };
  }

  /* ---- Family Window ------------------------------------------------------------------------------------------- */
  const GENERIC = {
    q: "Can you explain this idea to me in your own words?",
    qEs: "¿Puedes explicarme esta idea con tus propias palabras?",
  };
  /** Every question inside a quick fix ("Ask: would different people give different answers?"), cleaned to read alone. @param {string} text @param {boolean} spanish */
  function questionsIn(text, spanish) {
    const out = [];
    for (const raw of String(text || "").match(/[^.!?¿]*\?/g) || []) {
      // drop a lead-in such as "Ask:" or "Decide first:"
      let q = raw.replace(/^\s+/, "").replace(/^[^:?]{0,40}:\s*/, "");
      if (q.length < 12 || q.length > 140 || !/^[A-Za-zÁÉÍÓÚÑ]/.test(q)) return [];
      q = q.charAt(0).toUpperCase() + q.slice(1);
      out.push(spanish ? `¿${q}` : q);
    }
    return out;
  }
  /**
   * The Family Window text for a trap: one question a family can ask, and the quick fix that tells them the idea. The question is
   * lifted from the fix only when the fix asks the same number of questions in BOTH languages and every one reads alone; otherwise
   * it is the same plain question for every trap.
   * @param {string} fix @param {string} fixEs
   */
  function askAtHome(fix, fixEs) {
    const qs = questionsIn(fix, false);
    const qsEs = questionsIn(fixEs, true);
    // self-talk ("Am I counting equal groups?") does not work as a question for a family to ask, and a Spanish question far shorter
    // or longer than its English twin has lost part of its meaning
    const SELF = /\b(I|my|me|I'm|myself)\b/i;
    const SELF_ES = /\b(mi|mis|me|estoy|yo|dieron)\b/i;
    const near =
      qs.length > 0 && qs[0].length / qsEs[0]?.length < 1.8 && qsEs[0]?.length / qs[0].length < 1.8;
    const both =
      qs.length > 0 &&
      qs.length === qsEs.length &&
      near &&
      !SELF.test(qs[0]) &&
      !SELF_ES.test(qsEs[0]);
    return {
      q: both ? qs[0] : GENERIC.q,
      qEs: both ? qsEs[0] : GENERIC.qEs,
      idea: String(fix || ""),
      ideaEs: String(fixEs || ""),
    };
  }

  W.StudioPulseCore = {
    VERSION,
    MAX_CHARS,
    CAP,
    FOCUS_KINDS,
    encode,
    decode,
    fromSnapshot,
    trapHash,
    askAtHome,
  };
})();

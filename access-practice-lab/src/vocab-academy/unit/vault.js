// Vocabulary Academy — the Word Vault, a unit activity. A locked room with a handful of locks; each lock opens with a
// question about a different word from the unit, and every lock that opens reveals more letters of the vault's
// password. When the last lock is open the learner names the password word from its meaning, then the vault opens.
// Built on the shared game kit, so it has the same supports, hints, keyboard keys, resume and finish cards as the games.
// Retry and hints are always free; nothing is timed; a miss only leaves a lock closed a little longer.
import { recordResult } from "../model.js";
import { workOf } from "./work.js";
import { newMc, buildMix, buildQuestion, available } from "../games/questions.js";
import {
  choicesHTML,
  hintButton,
  html,
  icon,
  mcAct,
  mcFeedback,
  mountGame,
  raw,
  stemHTML,
} from "../games/kit.js";

export const TITLE = ["Word Vault", "La bóveda de palabras"];
const LOCKS = { early: 4, "upper-elem": 5, middle: 6, high: 6 };
const MIN_LOCKS = 3;

/** Letters of a word that can sit in a password slot: a plain run of letters, 4 to 10 long. */
export const passwordOk = (hw) => /^[A-Za-z]{4,10}$/.test(String(hw || ""));

/** How many letters are showing after `opened` of `locks` locks are open. Pure. */
export const revealedCount = (len, opened, locks) =>
  locks <= 0 ? 0 : Math.min(len, Math.ceil((len * Math.max(0, opened)) / locks));

/** Pure engine: the vault for a pool and a seeded rng. { locks:[{q,mc}], word, order, final:{q,mc}, i, stage }. */
export function buildVault(pool, rng, { count } = {}) {
  const want = count || LOCKS[pool.band] || 5;
  const candidates = pool.words.filter((w) => available(w, pool).length);
  if (candidates.length < MIN_LOCKS) return { locks: [], stage: "locks", i: 0 };
  const passwordPool = candidates.filter((w) => passwordOk(w.hw));
  const word = (passwordPool.length ? rng.shuffle(passwordPool) : rng.shuffle(candidates))[0];
  const rest = candidates.filter((w) => w.id !== word.id);
  const lockWords = rng.shuffle(rest.length >= MIN_LOCKS ? rest : candidates).slice(0, want);
  const qs = buildMix(pool, rng, { words: lockWords, count: lockWords.length, idPrefix: "vault" });
  if (qs.length < MIN_LOCKS) return { locks: [], stage: "locks", i: 0 };
  const fq =
    buildQuestion("def-word", word, pool, rng, { variant: 1 }) ||
    buildQuestion("word-def", word, pool, rng, { variant: 1 });
  if (!fq) return { locks: [], stage: "locks", i: 0 };
  fq.id = "vault-final";
  const letters = passwordOk(word.hw) ? word.hw.length : 0;
  return {
    locks: qs.map((q) => ({ q, mc: newMc() })),
    word: { id: word.id, hw: word.hw },
    order: letters ? rng.shuffle([...Array(letters).keys()]) : [],
    final: { q: fq, mc: newMc() },
    i: 0,
    stage: "locks",
    claimed: false,
  };
}

const opened = (s) => s.locks.filter((l) => l.mc.done && l.open).length;
const shownPositions = (s) =>
  new Set(s.order.slice(0, revealedCount(s.order.length, opened(s), s.locks.length)));

function passwordHTML(s, env) {
  const I = env.I;
  if (!s.order.length) return "";
  const show = s.stage === "final" && s.final.mc.done ? new Set(s.order) : shownPositions(s);
  const chars = [...s.word.hw.toUpperCase()];
  const said = chars.map((c, k) => (show.has(k) ? c : I.S("blank", "vacío"))).join(", ");
  return html`<p
    class="va-vault-pass"
    role="img"
    aria-label="${I.S("Vault password", "Contraseña de la bóveda")}: ${said}"
  >
    ${chars.map((c, k) => html`<span class="va-vault-slot" data-on="${show.has(k)}" aria-hidden="true">${show.has(k) ? c : ""}</span>`)}
  </p>`;
}

function locksHTML(s, env) {
  const I = env.I;
  return html`<ol class="va-vault-locks" aria-label="${I.S("Locks", "Cerraduras")}">
    ${s.locks.map((l, k) => {
      const state = l.open ? "open" : k === s.i && s.stage === "locks" ? "now" : "closed";
      const text = {
        open: I.S("open", "abierta"),
        now: I.S("working on this one", "trabajando en esta"),
        closed: I.S("closed", "cerrada"),
      }[state];
      return html`<li
        class="va-lock"
        data-state="${state}"
        role="img"
        aria-label="${I.S("Lock", "Cerradura")} ${k + 1}: ${text}"
      >
        <span aria-hidden="true">${raw(l.open ? "✓" : "🔒")}</span>
      </li>`;
    })}
  </ol>`;
}

function view(s, env) {
  const I = env.I;
  const door = html`<div class="va-vault-door">
    ${locksHTML(s, env)}${passwordHTML(s, env)}
    <p class="vag-fine">
      ${
        s.stage === "locks"
          ? I.T(
              `${s.locks.filter((l) => l.open).length} of ${s.locks.length} locks open. Each one you open shows more of the password.`,
              `${s.locks.filter((l) => l.open).length} de ${s.locks.length} cerraduras abiertas. Cada una que abres muestra más de la contraseña.`,
            )
          : I.T(
              "Every lock is open. Name the password word to open the vault.",
              "Todas las cerraduras están abiertas. Nombra la palabra de la contraseña para abrir la bóveda.",
            )
      }
    </p>
  </div>`;
  if (s.stage === "final") {
    const { q, mc } = s.final;
    return html`${door}
      <div class="vag-qcard" data-type="${q.type}">
        <p class="vag-qtype">
          <strong>${I.T("The vault password", "La contraseña de la bóveda")}</strong>
        </p>
        ${stemHTML(q, env)}${choicesHTML(q, mc, env)}
        <div class="vag-actions">
          ${hintButton(mc, env)}
          ${mc.done ? html`<button type="button" class="btn btn-primary" data-vault-claim data-fk="claim" data-autofocus>${icon("star")}${I.T("Open the vault", "Abrir la bóveda")}</button>` : ""}
        </div>
        ${mcFeedback(q, mc, env)}
      </div>`;
  }
  const lock = s.locks[s.i];
  const last = s.i === s.locks.length - 1;
  return html`${door}
    <div class="vag-qcard" data-type="${lock.q.type}">
      <p class="vag-qtype">
        <strong>${I.T("Lock", "Cerradura")} ${s.i + 1} ${I.T("of", "de")} ${s.locks.length}</strong>
      </p>
      ${stemHTML(lock.q, env)}${choicesHTML(lock.q, lock.mc, env)}
      <div class="vag-actions">
        ${hintButton(lock.mc, env)}
        ${lock.mc.done ? html`<button type="button" class="btn btn-primary" data-vault-next data-fk="next" data-autofocus>${last ? I.T("Open the last lock", "Abrir la última cerradura") : I.T("Open this lock", "Abrir esta cerradura")}${icon("arrow-right")}</button>` : ""}
      </div>
      ${mcFeedback(lock.q, lock.mc, env)}
    </div>`;
}

const spec = {
  id: "word-vault",
  title: TITLE,
  persist: true,
  howTo: [
    [
      "A vault has a few locks. Each lock is a question about a word from this unit.",
      "Una bóveda tiene varias cerraduras. Cada una es una pregunta sobre una palabra de esta unidad.",
    ],
    [
      "Answer to open a lock. If an answer is not right, pick another. Hints are always free.",
      "Responde para abrir una cerradura. Si una respuesta no es correcta, elige otra. Las pistas son gratis.",
    ],
    [
      "Every open lock shows more letters of the secret password word.",
      "Cada cerradura abierta muestra más letras de la palabra secreta.",
    ],
    [
      "When every lock is open, choose the password word from its meaning to open the vault.",
      "Cuando todas las cerraduras estén abiertas, elige la palabra de la contraseña por su significado para abrir la bóveda.",
    ],
  ],
  keys: [
    ["1 to 4", ["choose that answer", "elegir esa respuesta"]],
    ["Enter", ["open the lock or the vault", "abrir la cerradura o la bóveda"]],
  ],
  build: (env) => buildVault(env.pool, env.rng),
  valid: (s) => Array.isArray(s?.locks) && s.locks.length >= MIN_LOCKS && s.final,
  unplayable: (s) => !s.locks.length,
  isDone: (s) => Boolean(s.claimed),
  progress: (s) => ({
    done: s.locks.filter((l) => l.open).length + (s.final.mc.done ? 1 : 0),
    total: s.locks.length + 1,
  }),
  view,
  click(el, s, env) {
    if (s.stage === "final") {
      if (el.closest("[data-vault-claim]")) {
        if (!s.final.mc.done) return false;
        s.claimed = true;
        return true;
      }
      return mcAct(el, s.final.q, s.final.mc, env, { kind: s.final.q.type });
    }
    const lock = s.locks[s.i];
    if (el.closest("[data-vault-next]")) {
      if (!lock.mc.done) return false;
      lock.open = true;
      env.say(env.I.S("Lock open.", "Cerradura abierta."));
      if (s.i >= s.locks.length - 1) s.stage = "final";
      else s.i += 1;
      return true;
    }
    return mcAct(el, lock.q, lock.mc, env, { kind: lock.q.type });
  },
  extra: (s) => ({
    locks: s.locks.length,
    opened: s.locks.filter((l) => l.open).length,
    password: s.word?.hw || "",
  }),
  finishExtra: (s, env) =>
    html`<p class="va-vault-treasure">
      ${icon("star")}
      ${env.I.T("The vault is open. The password was", "La bóveda está abierta. La contraseña era")}
      <strong lang="en">${s.word?.hw}</strong>.
    </p>`,
};

/** Mount the vault into a host element. opts is the games' option bag ({ unit, grade, ctx, onResult, onDone, persist, restore }). */
export const mountVault = (root, opts) => mountGame(root, opts, spec);
export const vaultSpec = spec;

/** The unit page's entry point (see ./extras.js): results through the model, the run kept in unitWork[gid].vault. */
export function start(host, ctx, va, { gid, merged, g }) {
  const vault = (workOf(va.progress, gid).vault ||= {});
  return mountVault(host, {
    unit: merged,
    grade: g,
    ctx: { ...ctx, supports: va.supports("reading") },
    now: Date.now(),
    onResult: (ev) => {
      recordResult(va.progress, {
        wordId: ev.wordId,
        dim: ev.dim,
        ok: ev.ok,
        sup: ev.sup,
        type: ev.type,
        now: new Date(),
        unit: gid,
        grade: g,
      });
      va.save();
    },
    onDone: (sum) => {
      vault.done = true;
      vault.at = new Date().toISOString();
      vault.judged = sum.judged;
      vault.correct = sum.correct;
      va.save();
    },
    persist: (key, state) => {
      if (state) vault.resume = { key, at: Date.now(), state };
      else delete vault.resume;
      va.save();
    },
    restore: (key) => (vault.resume?.key === key ? vault.resume.state : null),
  });
}

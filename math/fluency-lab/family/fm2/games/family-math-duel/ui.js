// Family Math Duel interaction. One state object drives every screen, so a language switch re-renders the same hand,
// turn and typed values. Solo mode plays Orbit by the documented strategy in engine.js; together mode lets both people
// act on the same device, with a hand-over screen between private hands. No timers anywhere. @fm2 FM-016 FM-027 FM-038 FM-039 FM-021 FM-037 FM-079
import { goalSentence, say, ui } from "./copy.js";
import {
  fmtValue,
  orbitClaim,
  pickArrangement,
  pickMove,
  replay,
  seatValue,
  winnerOf,
} from "./engine.js";
import { inspect, parseClaim, scoreOf } from "./logic.js";
import { fillLayout, slotKinds, TEMPLATES } from "./templates.js";
import * as V from "./view.js";

export function mount(root, ctx) {
  const { round } = ctx;
  const together = ctx.mode === "together";
  const kinds = slotKinds(round.tpl);
  const priv = round.variant === "private";
  let lang = ctx.lang;
  let alive = true;
  const S = {
    moves: [],
    fair: false,
    held: null,
    started: false,
    handTo: null,
    lockedSeats: [false, false],
    shown: false,
    claims: ["", ""],
    call: null,
    verdict: null,
    theirs: null,
    input: { claim0: "", claim1: "", counter: "" },
    challengeOpen: false,
    notice: null,
    focus: null,
    locked: false,
    derived: null,
  };
  const orbitCount = () => S.moves.filter((m) => m[0] === 1).length;

  // ---- Orbit (solo only) ----------------------------------------------------------------------------------------------
  function orbitArrange() {
    const state = replay(round, S.moves, false);
    S.moves.push(...pickArrangement(round, state, 1, Boolean(round.orbit.lax[0])));
    S.lockedSeats[1] = true;
  }
  function orbitAct() {
    if (together) return;
    let state = replay(round, S.moves, S.fair);
    while (!priv && !state.complete && state.turn === 1) {
      const move = pickMove(round, state, 1, Boolean(round.orbit.lax[orbitCount()]));
      S.moves.push(move);
      ctx.announce(ui("orbitTook", lang, { card: V.cardText(round.cards[move[1]], lang) }));
      state = replay(round, S.moves, S.fair);
    }
  }

  // ---- derived view of the hand ----------------------------------------------------------------------------------------
  function record(extra = {}) {
    return {
      moves: S.moves,
      fair: S.fair,
      claims: [S.claims[0], S.claims[1]],
      call: S.call,
      verdict: S.verdict,
      theirs: S.theirs,
      ...extra,
    };
  }
  function derive() {
    const state = replay(round, S.moves, S.fair);
    const drafting = priv ? !(S.lockedSeats[0] && S.lockedSeats[1]) : !state.complete;
    const rights = round.rights;
    let phase = "done";
    if (drafting) phase = S.handTo !== null ? "handover" : "draft";
    else if (!S.claims[0]) phase = "claim0";
    else if (together && rights.theirs && S.theirs === null) phase = "theirs";
    else if (rights.challenge && !S.claims[1]) phase = "claim1";
    else if (rights.challenge && !S.call) phase = "call";
    else if (S.verdict === null) phase = "verdict";
    const active = !drafting
      ? null
      : priv
        ? S.lockedSeats[round.first]
          ? 1 - round.first
          : round.first
        : state.turn;
    const names = V.namesFor(ctx.mode, lang);
    const values = state.complete
      ? [seatValue(round, state.seats[0]), seatValue(round, state.seats[1])]
      : null;
    const D = {
      state,
      phase,
      active,
      names,
      together,
      lang,
      goalText: goalSentence(round, lang),
      lockSlot: round.fair.slot,
    };
    D.hidden = [priv && !S.shown && active !== 0, priv && !S.shown && active !== 1];
    D.fairLocked = S.started || S.moves.length > 0;
    D.numeric =
      round.style === "int" &&
      !["frac2", "fracdiv"].includes(round.tpl) &&
      !round.cards.some((c) => c.v && (c.v.n < 0 || c.v.d !== 1));
    D.canUndo = phase === "draft" && lastOwnMove(active) >= 0;
    D.points =
      S.verdict !== null
        ? scoreOf(round, record()).points
        : [S.call?.challenge || S.theirs === true ? 1 : 0, 0];
    D.claimShown = ["", ""];
    if (S.claims[0]) D.claimShown[0] = say("claims", lang, 0, ctx.mode, { name: names[0], value: S.claims[0] });
    if (S.theirs === true) D.claimShown[0] += ` ${ui("theirsHeld", lang, { value: S.claims[0] })}`;
    if (values && S.claims[0]) {
      const exact = fmtValue(values[1], round.style);
      if (!rights.challenge)
        D.claimShown[1] = ui("autoValue", lang, { name: names[1], value: exact });
      else if (S.claims[1])
        D.claimShown[1] = ui(together ? "claims" : "orbitSays", lang, {
          name: names[1],
          value: S.claims[1],
        });
    }
    D.result = phase === "done" && values ? resultLines(D, values) : null;
    return D;
  }
  function lastOwnMove(active) {
    if (active === null) return -1;
    if (priv) return S.moves.map((m) => m[0]).lastIndexOf(active);
    return together ? S.moves.length - 1 : S.moves.map((m) => m[0]).lastIndexOf(0);
  }
  function resultLines(D, values) {
    const lines = [0, 1].map((seat) => {
      const texts = D.state.seats[seat].map((id) => round.cards[id].text);
      return ui("made", lang, {
        name: D.names[seat],
        expr: fillLayout(round.tpl, texts, lang),
        value: fmtValue(values[seat], round.style),
      });
    });
    const truth = winnerOf(round.goal, values[0], values[1]);
    lines.push(truth === 2 ? ui("handTie", lang) : say("handWin", lang, truth, ctx.mode, { name: D.names[truth] }));
    if (S.call?.challenge)
      lines.push(
        ui("challengeWon", lang, {
          name: D.names[1],
          claim: S.claims[1],
          value: fmtValue(values[1], round.style),
        }),
      );
    if (S.theirs === true) lines.push(ui("theirsWon", lang));
    return lines;
  }

  // ---- drawing --------------------------------------------------------------------------------------------------------
  function render() {
    if (!alive) return;
    const D = derive();
    S.derived = D;
    const parts = [V.scoreboard(S, D, lang), V.goalCard(S, D, lang, round, ctx.mode)];
    if (D.phase === "handover") parts.push(V.handover(S, D, lang, round));
    else {
      if (D.phase === "draft") {
        parts.push(V.tableCards(S, D, lang, round));
        if (priv && !together) parts.push(V.hiddenHand(S, D, lang, round, 1 - D.active));
      }
      parts.push(
        `<div class="fd-boards">${V.board(S, D, lang, round, 0)}${V.board(S, D, lang, round, 1)}</div>`,
      );
      parts.push(
        `<section class="fd-panel" data-testid="duel-panel">${V.panel(S, D, lang, round)}</section>`,
      );
    }
    root.innerHTML = `<div class="fd" data-phase="${D.phase}" data-variant="${round.variant}" data-mode="${ctx.mode}" aria-label="${ui("stageLabel", lang)}">${parts.join("")}</div>`;
    for (const group of root.querySelectorAll("[data-group]")) rove(group, S.focus);
    if (S.focus) {
      const target = root.querySelector(`[data-fk="${S.focus}"]`);
      if (target) {
        if (target.closest("[data-group]")) rove(target.closest("[data-group]"), S.focus);
        target.focus({ preventScroll: false });
      }
      S.focus = null;
    }
  }
  function rove(group, key) {
    const items = [...group.querySelectorAll("[data-nav]")].filter((el) => !el.disabled);
    const keep =
      items.find((el) => el.dataset.fk === key) ||
      items.find((el) => el.dataset.taken !== "true") ||
      items[0];
    for (const el of group.querySelectorAll("[data-nav]")) el.tabIndex = el === keep ? 0 : -1;
  }

  // ---- the referee's word, shown through the shell ----------------------------------------------------------------------
  const tell = (rec) => ctx.submit(rec);
  function probe(seat, card, slot) {
    S.held = null;
    ctx.submit({ attempt: { seat, card, slot }, moves: S.moves, fair: S.fair });
    S.focus = `card-${card}`;
    render();
  }
  const compatible = (seat, card) =>
    kinds
      .map((k, i) =>
        k === round.cards[card].kind && replay(round, S.moves, S.fair).seats[seat][i] === null
          ? i
          : -1,
      )
      .filter((i) => i >= 0);

  // ---- drafting ------------------------------------------------------------------------------------------------------------
  function place(seat, card, slot) {
    const next = [...S.moves, [seat, card, slot]];
    if (!replay(round, next, S.fair).ok) return probe(seat, card, slot);
    S.moves = next;
    S.held = null;
    S.started = true;
    ctx.announce(
      ui("placed", lang, {
        name: V.namesFor(ctx.mode, lang)[seat],
        card: V.cardText(round.cards[card], lang),
      }),
    );
    orbitAct();
    const D = derive();
    S.focus = D.phase === "draft" ? firstFreeCard(D) : "fd-in-claim0";
    return render();
  }
  function firstFreeCard(D) {
    const ids = priv ? round.deal[D.active ?? 0] : round.pool;
    const id = ids.find((c) => !D.state.taken(D.active ?? 0, c));
    return id === undefined ? "lock" : `card-${id}`;
  }
  function onCard(id) {
    const D = S.derived;
    if (S.locked || D.phase !== "draft") return;
    const seat = D.active;
    const options = compatible(seat, id);
    if (D.state.taken(seat, id))
      return probe(seat, id, options[0] ?? kinds.findIndex((k) => k === round.cards[id].kind));
    if (!options.length) return probe(seat, id, Math.max(0, kinds.indexOf(round.cards[id].kind)));
    if (S.held === id) {
      S.held = null;
      S.focus = `card-${id}`;
      return render();
    }
    S.held = id;
    S.started = true;
    if (TEMPLATES[round.tpl].free || options.length === 1) return place(seat, id, options[0]);
    ctx.announce(
      ui("placeAsk", lang, { name: D.names[seat], card: V.cardText(round.cards[id], lang) }),
    );
    S.focus = `slot-${seat}-${options[0]}`;
    return render();
  }
  function onSlot(seat, slot) {
    const D = S.derived;
    if (S.locked || D.phase !== "draft" || seat !== D.active) return;
    if (S.held !== null) return place(seat, S.held, slot);
    const at = S.moves.findIndex((m) => m[0] === seat && m[2] === slot);
    if (priv && at >= 0) {
      const [, card] = S.moves[at];
      S.moves = S.moves.filter((_, i) => i !== at);
      S.focus = `card-${card}`;
      render();
    }
  }
  function undo() {
    const D = S.derived;
    const at = lastOwnMove(D.active);
    if (at < 0) return;
    S.moves = priv || together ? S.moves.filter((_, i) => i !== at) : S.moves.slice(0, at);
    S.held = null;
    S.focus = firstFreeCard(derive());
    render();
  }
  function lockIn() {
    const D = S.derived;
    const seat = D.active;
    if (!D.state.seats[seat].every((c) => c !== null)) return;
    S.lockedSeats[seat] = true;
    S.held = null;
    if (!together && seat === 0 && !S.lockedSeats[1]) orbitArrange();
    if (S.lockedSeats[0] && S.lockedSeats[1]) {
      S.shown = true;
      ctx.announce(ui("revealed", lang));
      S.focus = "fd-in-claim0";
    } else if (together) S.handTo = 1 - seat;
    render();
  }

  // ---- claims, challenge and verdict -------------------------------------------------------------------------------------------
  function claim0() {
    const text = S.input.claim0.trim();
    const rec = record({ claims: [text, S.claims[1]] });
    if (!text) return;
    if (inspect(round, rec).problem) {
      tell(rec);
      S.focus = "fd-in-claim0";
      return render();
    }
    S.claims[0] = text;
    const values = S.derived.state.complete
      ? [seatValue(round, S.derived.state.seats[0]), seatValue(round, S.derived.state.seats[1])]
      : null;
    if (!together && round.rights.challenge && values) {
      S.claims[1] = fmtValue(orbitClaim(round, values[1]), round.style);
      ctx.announce(ui("orbitSays", lang, { value: S.claims[1] }));
    }
    S.focus = round.rights.challenge ? (together ? "fd-in-claim1" : "agree") : "verdict-0";
    render();
  }
  function claim1() {
    const text = S.input.claim1.trim();
    if (!text) return;
    if (!parseClaim(text)) {
      S.notice = "unreadable1";
      S.focus = "fd-in-claim1";
      return render();
    }
    S.notice = null;
    S.claims[1] = text;
    S.focus = "agree";
    render();
  }
  function decide(call) {
    const rec = record({ call });
    if (inspect(round, rec).problem) {
      tell(rec);
      S.focus = call.challenge ? "fd-in-counter" : "agree";
      return render();
    }
    S.call = call;
    S.challengeOpen = false;
    S.focus = "verdict-0";
    render();
  }
  function verdict(value) {
    const rec = record({ verdict: value });
    if (inspect(round, rec).problem) {
      tell(rec);
      S.focus = "verdict-0";
      return render();
    }
    S.verdict = value;
    const result = tell(record());
    if (!result?.correct && !S.locked) S.verdict = null;
    render();
  }

  // ---- events ------------------------------------------------------------------------------------------------------------------
  const onClick = (event) => {
    const el = event.target.closest("button");
    if (!el || !root.contains(el) || el.disabled) return;
    if (el.dataset.card !== undefined) return onCard(Number(el.dataset.card));
    if (el.dataset.slot !== undefined)
      return onSlot(Number(el.dataset.seat), Number(el.dataset.slot));
    if (el.dataset.verdict !== undefined) return verdict(Number(el.dataset.verdict));
    const act = el.dataset.act;
    if (act === "undo") undo();
    else if (act === "lock") lockIn();
    else if (act === "handover-ok") {
      S.handTo = null;
      S.started = true;
      S.focus = `card-${(priv ? round.deal[S.derived.active ?? 0] : round.pool)[0]}`;
      render();
    } else if (act === "theirs-yes" || act === "theirs-no") {
      S.theirs = act === "theirs-yes";
      S.focus = round.rights.challenge ? "fd-in-claim1" : "verdict-0";
      render();
    } else if (act === "agree") decide({ challenge: false });
    else if (act === "challenge") {
      S.challengeOpen = !S.challengeOpen;
      S.focus = S.challengeOpen ? "fd-in-counter" : "agree";
      render();
    }
  };
  const onSubmit = (event) => {
    event.preventDefault();
    const form = event.target.dataset.form;
    if (form === "claim0") claim0();
    else if (form === "claim1") claim1();
    else if (form === "counter") decide({ challenge: true, counter: S.input.counter.trim() });
  };
  const onInput = (event) => {
    const el = event.target;
    if (el.id === "fd-in-claim0") S.input.claim0 = el.value;
    else if (el.id === "fd-in-claim1") S.input.claim1 = el.value;
    else if (el.id === "fd-in-counter") S.input.counter = el.value;
  };
  const onChange = (event) => {
    if (event.target.matches("[data-fair]") && !S.derived.fairLocked) {
      S.fair = event.target.checked;
      render();
    }
  };
  const onKey = (event) => {
    const el = event.target.closest?.("[data-nav]");
    if (!el) return;
    const group = el.closest("[data-group]");
    const items = [...group.querySelectorAll("[data-nav]")].filter((x) => !x.disabled);
    const at = items.indexOf(el);
    const to = {
      ArrowRight: at + 1,
      ArrowDown: at + 1,
      ArrowLeft: at - 1,
      ArrowUp: at - 1,
      Home: 0,
      End: items.length - 1,
    }[event.key];
    if (to === undefined || to < 0 || to >= items.length) return;
    event.preventDefault();
    rove(group, items[to].dataset.fk);
    items[to].focus();
  };
  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onChange);
  root.addEventListener("keydown", onKey);
  ctx.onLock?.(() => {
    S.locked = true;
    S.shown = true;
    render();
  });

  // ---- start ------------------------------------------------------------------------------------------------------------------------
  if (priv) {
    if (!together && round.first === 1) orbitArrange();
    if (together) S.handTo = round.first;
  } else orbitAct();
  render();

  return {
    destroy() {
      alive = false;
      root.removeEventListener("click", onClick);
      root.removeEventListener("submit", onSubmit);
      root.removeEventListener("input", onInput);
      root.removeEventListener("change", onChange);
      root.removeEventListener("keydown", onKey);
      root.innerHTML = "";
    },
    setLang(to) {
      lang = to;
      render();
    },
  };
}


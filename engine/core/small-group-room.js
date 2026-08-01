// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// The studio's name promises four students working together; its code promised
// nothing of the kind. State lived in localStorage under nt-sg:<lessonId>, the
// "Team consensus protocol" counted three voices on one device, and the Prove It
// ladder asked students to convince two canned skeptics while three real ones sat
// at the same table. This module is the smallest honest fix: one room code, a
// seat per device, private commits, and a simultaneous reveal.
//
// Design rules, in priority order:
//
// 1. SOLO STILL WORKS. A room is strictly additive. No room, no backend, no
//    network — the studio behaves exactly as it did. Nothing here is allowed to
//    block, throw, or gate a student out of their own lesson.
// 2. NO EARLY REVEAL. Answers are withheld until every seat has committed. A
//    group where the fastest student answers out loud first is a group where
//    nobody else thinks, and that is the failure mode this exists to prevent.
// 3. COMMITS ARE FINAL. You cannot revise after seeing the others. The value is
//    in defending or abandoning a position you actually held.
// 4. SEATS ARE NUMBERS. No names cross the network, ever.

import { el, esc } from "./small-group-ui.js";

const BASE = "/api/sg-room";
const POLL_MS = 3000;
// A room outlives a reload but not the school day, and it is per-lesson so a
// stale code from period 1 never binds period 4's group.
const seatKey = (lessonId) => `nt-sg-room:${lessonId}`;

/**
 * Like call(), but returns the parsed body even when the server says `ok:false`.
 *
 * call() collapses every failure to null, which is right for the room routes
 * whose only question is "did it work". The peer-exchange routes answer a
 * different question: WHY it did not — "write-first", "too-short", "language" —
 * and each of those needs a different sentence in front of a twelve-year-old.
 * Collapsing them to null would produce "something went wrong" for a student who
 * simply needs to write two more words.
 */
async function callRaw(path, options = {}) {
  try {
    const response = await fetch(`${BASE}/${path}`, {
      credentials: "omit",
      ...options,
      headers: options.body ? { "content-type": "application/json" } : undefined,
    });
    return await response.json();
  } catch {
    return null;
  }
}

async function call(path, options = {}) {
  try {
    const response = await fetch(`${BASE}/${path}`, {
      credentials: "omit",
      ...options,
      headers: options.body ? { "content-type": "application/json" } : undefined,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.ok ? data : null;
  } catch {
    // Offline, blocked, or no D1 binding — the caller falls back to solo.
    return null;
  }
}

/**
 * Room membership for this device, persisted so a reload rejoins the same seat
 * instead of consuming a new one.
 */
function loadSeat(lessonId) {
  try {
    const raw = window.localStorage.getItem(seatKey(lessonId));
    const saved = raw ? JSON.parse(raw) : null;
    return saved?.code && saved?.seat ? saved : null;
  } catch {
    return null;
  }
}

function saveSeat(lessonId, value) {
  try {
    if (value) window.localStorage.setItem(seatKey(lessonId), JSON.stringify(value));
    else window.localStorage.removeItem(seatKey(lessonId));
  } catch {
    /* private mode — the room simply will not survive a reload */
  }
}

/**
 * @param {string} lessonId
 * @returns {{
 *   code:()=>string|null, seat:()=>number|null, active:()=>boolean,
 *   open:()=>Promise<boolean>, join:(code:string)=>Promise<string|null>, leave:()=>void,
 *   commit:(itemKey:string, answer:string)=>Promise<object|null>,
 *   watch:(itemKey:string, onChange:(state:object)=>void)=>()=>void,
 * }}
 */
export function createRoom(lessonId) {
  let membership = loadSeat(lessonId);

  return {
    code: () => membership?.code || null,
    seat: () => membership?.seat || null,
    active: () => Boolean(membership?.code),

    async open() {
      const data = await call("open", { method: "POST", body: JSON.stringify({ lessonId }) });
      if (!data) return false;
      membership = { code: data.code, seat: data.seat };
      saveSeat(lessonId, membership);
      return true;
    },

    /** @returns {Promise<string|null>} an error code for display, or null on success. */
    async join(code) {
      const clean = String(code || "")
        .trim()
        .toUpperCase();
      if (!/^[A-Z2-9]{4}$/.test(clean)) return "bad-code";
      const data = await call("join", { method: "POST", body: JSON.stringify({ code: clean }) });
      if (!data) return "no-room";
      membership = { code: data.code, seat: data.seat };
      saveSeat(lessonId, membership);
      return null;
    },

    leave() {
      membership = null;
      saveSeat(lessonId, null);
    },

    async commit(itemKey, answer) {
      if (!membership) return null;
      return call("commit", {
        method: "POST",
        body: JSON.stringify({ code: membership.code, seat: membership.seat, itemKey, answer }),
      });
    },

    /**
     * Peer explanation exchange (MLR 3). Write your reasoning, then read
     * someone else's — in that order, enforced server-side.
     *
     * @returns {Promise<{ok:true,written:number}|{ok:false,error:string}>}
     */
    async explain(itemKey, text) {
      if (!membership) return { ok: false, error: "no-room" };
      const data = await callRaw("explain", {
        method: "POST",
        body: JSON.stringify({ code: membership.code, seat: membership.seat, itemKey, text }),
      });
      if (!data) return { ok: false, error: "offline" };
      return data.ok ? { ok: true, written: data.written } : { ok: false, error: data.error };
    },

    /**
     * Fetch one anonymous peer explanation for the same item.
     * @returns {Promise<{ok:true,waiting:boolean,peer?:string}|{ok:false,error:string}>}
     */
    async peer(itemKey) {
      if (!membership) return { ok: false, error: "no-room" };
      const query = `peer?code=${encodeURIComponent(membership.code)}&seat=${membership.seat}&itemKey=${encodeURIComponent(itemKey)}`;
      const data = await callRaw(query);
      if (!data) return { ok: false, error: "offline" };
      return data.ok
        ? { ok: true, waiting: Boolean(data.waiting), peer: data.peer }
        : { ok: false, error: data.error };
    },

    /**
     * Poll one item until every seat has committed, then stop. Returns an
     * unsubscribe function. Polling (not sockets) on purpose: a 3-second read
     * against D1 is cheap, survives Chromebooks sleeping mid-rotation, and needs
     * no Durable Object to keep alive between periods.
     */
    watch(itemKey, onChange) {
      if (!membership) return () => {};
      let stopped = false;
      let timer = null;
      const tick = async () => {
        if (stopped) return;
        const data = await call(
          `state?code=${encodeURIComponent(membership.code)}&itemKey=${encodeURIComponent(itemKey)}`,
        );
        if (stopped) return;
        if (data) {
          onChange(data);
          // Once revealed there is nothing left to wait for; stop polling rather
          // than heating up a classroom of Chromebooks for no new information.
          if (data.revealed) return;
        }
        timer = window.setTimeout(tick, POLL_MS);
      };
      tick();
      return () => {
        stopped = true;
        if (timer) window.clearTimeout(timer);
      };
    },
  };
}

/**
 * The room chip: open a table, join one, or see which seat you are in. Mounted in
 * the studio hero so it is visible before the work starts — a group that discovers
 * the room halfway through has already answered everything alone.
 */
export function createRoomChip(room, { onJoined = null } = {}) {
  const wrap = el("div", "sg-room-chip");
  const render = () => {
    wrap.innerHTML = "";
    if (room.active()) {
      wrap.appendChild(
        el(
          "span",
          "sg-room-live",
          `👥 Table <b>${esc(room.code())}</b> · you are seat ${room.seat()}`,
        ),
      );
      const leave = el("button", "sg-room-leave", "Leave");
      leave.type = "button";
      leave.onclick = () => {
        room.leave();
        render();
      };
      wrap.appendChild(leave);
      return;
    }
    const openButton = el("button", "sg-room-btn", "👥 Start a table");
    openButton.type = "button";
    const codeInput = el("input", "sg-room-code");
    codeInput.type = "text";
    codeInput.maxLength = 4;
    codeInput.placeholder = "CODE";
    codeInput.setAttribute("aria-label", "Table code");
    const joinButton = el("button", "sg-room-btn ghost", "Join");
    joinButton.type = "button";
    const status = el("span", "sg-room-status");
    status.setAttribute("aria-live", "polite");

    openButton.onclick = async () => {
      openButton.disabled = true;
      status.textContent = "Opening…";
      const ok = await room.open();
      if (!ok) {
        // Rooms are optional infrastructure; say so plainly and stay usable.
        status.textContent = "Tables are unavailable right now — keep going on your own.";
        openButton.disabled = false;
        return;
      }
      onJoined?.();
      render();
    };
    joinButton.onclick = async () => {
      const error = await room.join(codeInput.value);
      if (error === "bad-code") {
        status.textContent = "A table code is 4 letters or numbers.";
        return;
      }
      if (error) {
        status.textContent = "No table with that code. Check it with your group.";
        return;
      }
      onJoined?.();
      render();
    };
    wrap.append(openButton, codeInput, joinButton, status);
  };
  render();
  return wrap;
}

export default createRoom;

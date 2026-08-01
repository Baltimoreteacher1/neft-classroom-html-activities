// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// The Connect phase already asks students to justify their thinking in prose,
// and until now exactly one person could ever read what they wrote: nobody. The
// box saved to localStorage and that was the end of it. Meanwhile the routine
// that makes justification worth writing — reading someone else's reasoning and
// having to engage with it — was simulated, at best, by a canned skeptic.
//
// This swaps the canned skeptic for the student at the next seat.
//
// FOUR DESIGN RULES, all of them load-bearing:
//
//   1. WRITE BEFORE YOU READ. Enforced server-side, not just here. A student who
//      reads a peer's explanation first anchors on it, and the exchange stops
//      being an exchange.
//   2. NO NAMES, NO SEAT NUMBERS. In a group of four, "seat 3" identifies a
//      person as surely as a name. The critique is of the reasoning.
//   3. A WRONG EXPLANATION IS NOT SUPPRESSED. Moderation blocks contact details
//      and slurs and nothing else — critiquing flawed reasoning IS the routine,
//      so filtering for correctness would remove the only thing worth doing.
//   4. THE CRITIQUE STAYS WITH ITS AUTHOR. What a student writes about a peer's
//      work is saved to their own lesson state and never sent back. Grade-6
//      students receiving anonymous written criticism of their thinking is a
//      different, much riskier feature, and it is not this one.
//
// Degrades to nothing: without a D1 binding, or offline, the room calls fail and
// the phase renders exactly as it did before.

import { createRoom } from "./small-group-room.js";

// The frames ARE the routine. Critique-Correct-Clarify is three distinct moves,
// and a student given a blank box will do the first one only ("I disagree").
const CRITIQUE_FRAMES = [
  { key: "understand", label: "What I think they are saying", frame: "They are saying that…" },
  { key: "question", label: "One question I would ask them", frame: "I would ask why…" },
  { key: "add", label: "One thing I would add or change", frame: "I would add that…" },
];

const ERROR_COPY = {
  "too-short": "Write a bit more — at least a full sentence about why.",
  contact: "Take out the link or contact details, then send it again.",
  language: "Rewrite that without the unkind words and send it again.",
  "write-first": "Write your own explanation first, then you can read someone else's.",
  "no-room": "That table code is not open any more. Ask for a new one.",
  offline: "Cannot reach the table right now. Your work is saved on this device.",
  "no-seat": "That seat is not at this table. Try joining again.",
};

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/**
 * Mount the exchange.
 *
 * @param {HTMLElement} host
 * @param {object} opts { config, state, phaseId, itemKey, prompt }
 */
export function mountPeerExchange(host, { config, state, phaseId = 3, itemKey, prompt } = {}) {
  if (!host || !config?.lessonId) return null;
  const key = itemKey || "connect";
  const room = createRoom(config.lessonId);

  const card = document.createElement("section");
  card.className = "card card-indigo peer-exchange";
  card.innerHTML = `
    <h4 style="margin:0 0 var(--sp-2);">🔁 Trade explanations</h4>
    <p style="margin:0 0 var(--sp-3); color:var(--muted); font-size:0.92rem;">
      Write why your answer works. Then you will read someone else's from your table —
      no names — and say what you think of it.
    </p>
    <div class="pe-room"></div>
    <div class="pe-write" hidden></div>
    <div class="pe-read" hidden></div>`;

  const roomSlot = card.querySelector(".pe-room");
  const writeSlot = card.querySelector(".pe-write");
  const readSlot = card.querySelector(".pe-read");

  // ── Table membership ─────────────────────────────────────────────────────
  function paintRoom() {
    if (room.active()) {
      roomSlot.innerHTML = `<p style="margin:0 0 var(--sp-3); font-weight:700;">
        Table <code>${esc(room.code())}</code> · you are seat ${room.seat()}
      </p>`;
      writeSlot.hidden = false;
      paintWrite();
      return;
    }
    roomSlot.innerHTML = `
      <div style="display:flex; gap:var(--sp-2); flex-wrap:wrap; align-items:center;">
        <button type="button" class="btn btn-secondary btn-sm pe-open">Start a table</button>
        <span style="color:var(--muted);">or</span>
        <label class="sr-only" for="pe-code">Table code</label>
        <input id="pe-code" class="text-input pe-code" style="width:7rem;" maxlength="4"
               placeholder="CODE" autocomplete="off" />
        <button type="button" class="btn btn-secondary btn-sm pe-join">Join</button>
        <span class="pe-room-msg" role="status" style="color:var(--muted); font-size:0.9rem;"></span>
      </div>`;

    const msg = roomSlot.querySelector(".pe-room-msg");
    roomSlot.querySelector(".pe-open").addEventListener("click", async () => {
      msg.textContent = "Opening…";
      const ok = await room.open();
      msg.textContent = ok ? "" : "Cannot open a table right now.";
      if (ok) paintRoom();
    });
    roomSlot.querySelector(".pe-join").addEventListener("click", async () => {
      const code = roomSlot.querySelector(".pe-code").value;
      msg.textContent = "Joining…";
      const err = await room.join(code);
      msg.textContent = err ? ERROR_COPY[err] || "That code did not work." : "";
      if (!err) paintRoom();
    });
  }

  // ── Write your own ───────────────────────────────────────────────────────
  function paintWrite() {
    const saved = state?.getResponse?.(phaseId, `pe_mine_${key}`) || "";
    if (saved) {
      writeSlot.innerHTML = `
        <p style="font-weight:700; margin:0 0 var(--sp-2);">Your explanation</p>
        <blockquote style="margin:0 0 var(--sp-3); padding-left:var(--sp-3); border-left:3px solid var(--teal);">${esc(saved)}</blockquote>`;
      readSlot.hidden = false;
      paintRead();
      return;
    }
    writeSlot.innerHTML = `
      <label for="pe-mine" style="font-weight:700; display:block; margin-bottom:var(--sp-2);">
        ${esc(prompt || "Why does your answer work?")}
      </label>
      <textarea id="pe-mine" class="text-input pe-mine" rows="3"
                placeholder="It works because…"></textarea>
      <div style="display:flex; gap:var(--sp-2); align-items:center; margin-top:var(--sp-2); flex-wrap:wrap;">
        <button type="button" class="btn btn-primary btn-sm pe-send">Send to my table</button>
        <span class="pe-write-msg" role="status" style="color:var(--muted); font-size:0.9rem;"></span>
      </div>`;

    const textarea = writeSlot.querySelector(".pe-mine");
    const msg = writeSlot.querySelector(".pe-write-msg");
    writeSlot.querySelector(".pe-send").addEventListener("click", async () => {
      const text = textarea.value.trim();
      msg.textContent = "Sending…";
      const res = await room.explain(key, text);
      if (!res.ok) {
        msg.textContent = ERROR_COPY[res.error] || "That did not send. Try again.";
        return;
      }
      // Keep the student's own words locally too, so the phase reads the same
      // after a reload even if the table has since expired.
      state?.saveResponse?.(phaseId, `pe_mine_${key}`, text);
      try {
        window.NTtelemetry?.track?.("peer_explanation", { standard: config?.standard || "" });
      } catch {
        /* telemetry is best-effort */
      }
      paintWrite();
    });
  }

  // ── Read and critique a peer's ───────────────────────────────────────────
  async function paintRead() {
    readSlot.innerHTML = `<p style="color:var(--muted);">Looking for someone else's explanation…</p>`;
    const res = await room.peer(key);

    if (!res.ok) {
      readSlot.innerHTML = `<p style="color:var(--muted);">${esc(ERROR_COPY[res.error] || "Cannot reach the table right now.")}</p>`;
      return;
    }
    if (res.waiting) {
      readSlot.innerHTML = `
        <p style="color:var(--muted);">Nobody else at your table has sent one yet.</p>
        <button type="button" class="btn btn-secondary btn-sm pe-refresh">Check again</button>`;
      readSlot.querySelector(".pe-refresh").addEventListener("click", paintRead);
      return;
    }

    const savedCritique = state?.getResponse?.(phaseId, `pe_critique_${key}`) || {};
    readSlot.innerHTML = `
      <p style="font-weight:700; margin:var(--sp-4) 0 var(--sp-2);">Someone else at your table wrote:</p>
      <blockquote style="margin:0 0 var(--sp-3); padding:var(--sp-3); background:var(--surface-alt,#f1f5f9); border-radius:8px;">${esc(res.peer)}</blockquote>
      <p style="font-size:0.85rem; color:var(--muted); margin:0 0 var(--sp-3);">
        You are not marking this right or wrong — you are saying what you make of it.
        What you write here is for you and your teacher; it does not go back to them.
      </p>
      ${CRITIQUE_FRAMES.map(
        (f) => `
        <label for="pe-${f.key}" style="font-weight:700; display:block; margin-bottom:var(--sp-1);">${esc(f.label)}</label>
        <textarea id="pe-${f.key}" data-critique="${f.key}" class="text-input" rows="2"
                  style="margin-bottom:var(--sp-3);" placeholder="${esc(f.frame)}">${esc(savedCritique[f.key] || "")}</textarea>`,
      ).join("")}`;

    readSlot.querySelectorAll("[data-critique]").forEach((field) => {
      field.addEventListener("input", () => {
        const value = {};
        readSlot.querySelectorAll("[data-critique]").forEach((f) => {
          value[f.dataset.critique] = f.value;
        });
        state?.saveResponse?.(phaseId, `pe_critique_${key}`, value);
      });
    });
  }

  paintRoom();
  host.append(card);
  return { room };
}

export default mountPeerExchange;

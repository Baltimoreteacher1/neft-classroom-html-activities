// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
// socratic.js — the tutor that will not tell you anything.
//
// The lesson already had an AI tutor endpoint with a careful hint ladder, but
// every rung of that ladder still ASSERTS: level 1 names the next step, level 2
// names the operation and why, level 3 works a parallel problem end to end. That
// is the right design for a student who is stuck and needs to move. It is the
// wrong design for a student who is thinking and needs to keep thinking, because
// the fastest way to end someone's reasoning is to do a step of it for them.
//
// This surface asks questions and nothing else. The server-side prompt (mode
// "socratic" in functions/api/tutor) forbids stating any fact about the problem,
// naming an operation, or confirming an answer.
//
// THE QUESTION LADDER IS THE ARTIFACT. Every question asked and every answer
// given is kept on the lesson's own state, so a teacher can open a student's
// lesson and read the sequence of questions it took — which is a far better
// record of where the thinking broke than "got item 3 wrong". It stays on the
// device with the rest of the lesson responses; only counts go to telemetry.

const MAX_TURNS = 8;

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/**
 * Ask the tutor for the next question.
 * @returns {Promise<{ ok: boolean, question?: string, error?: string }>}
 */
export async function askNextQuestion({ itemText, standard, studentWork, history, replyLang }) {
  try {
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "socratic",
        itemText,
        standard: standard || "",
        studentWork: studentWork || "",
        history: history || [],
        replyLang: replyLang || "",
      }),
    });
    // 503 with { offline: true } is the endpoint's designed answer when
    // ANTHROPIC_API_KEY is unbound (secrets bind at deploy). That is a normal
    // classroom state, not an error to surface — the fixed ladder takes over.
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.offline ? "offline" : `http-${res.status}` };
    }
    const question = String(data.reply || "").trim();
    if (!question) return { ok: false, error: "empty" };
    return { ok: true, question };
  } catch {
    return { ok: false, error: "network" };
  }
}

/**
 * The offline ladder.
 *
 * The tutor endpoint needs a key that is bound at deploy time, and this feature
 * must not become a dead button in a classroom where that key is missing or the
 * network is down. These are real Socratic openers in a fixed order — weaker than
 * an adaptive question, but they still put the student in the position of
 * answering rather than reading, which is the whole point.
 */
export const FALLBACK_LADDER = [
  "What is the question actually asking you to find?",
  "What do you already know from the problem, in your own words?",
  "Which of those numbers goes with which thing?",
  "What is the first step you could take, even if you are not sure it is the right one?",
  "Roughly how big should the answer be? Bigger or smaller than what you started with?",
  "What did you get, and how could you check whether it makes sense?",
];

/**
 * Mount the Socratic dialogue into `host`.
 *
 * @param {HTMLElement} host
 * @param {object} opts { item, config, state, phaseId }
 */
export function mountSocraticDialogue(host, { item, config, state, phaseId = 2 } = {}) {
  if (!host) return null;
  const itemText = item?.stem || item?.prompt || "";
  if (!itemText) return null;

  const key = `socratic_${String(itemText).slice(0, 40)}`;
  const saved = state?.getResponse?.(phaseId, key);
  const turns = Array.isArray(saved?.turns) ? saved.turns : [];

  const wrap = document.createElement("div");
  wrap.className = "socratic";
  wrap.innerHTML = `
    <p class="socratic-intro" style="margin:0 0 var(--sp-2); font-size:0.9rem; color:var(--muted);">
      I will only ask questions — I am not going to tell you the answer. Answer each one and we will
      get there together.
    </p>
    <ol class="socratic-log" style="margin:0 0 var(--sp-3); padding-left:1.2rem;"></ol>
    <div class="socratic-ask">
      <label class="sr-only" for="${key}-in">Your answer</label>
      <textarea id="${key}-in" class="text-input socratic-input" rows="2" placeholder="Type what you think…"></textarea>
      <div style="display:flex; gap:var(--sp-2); margin-top:var(--sp-2); flex-wrap:wrap;">
        <button type="button" class="btn btn-primary btn-sm socratic-send">Answer</button>
        <span class="socratic-status" role="status" style="font-size:0.85rem; color:var(--muted);"></span>
      </div>
    </div>`;

  const log = wrap.querySelector(".socratic-log");
  const input = wrap.querySelector(".socratic-input");
  const send = wrap.querySelector(".socratic-send");
  const status = wrap.querySelector(".socratic-status");

  let fallbackIndex = 0;

  const paint = () => {
    log.innerHTML = turns
      .map(
        (t) =>
          `<li style="margin-bottom:var(--sp-2);"><strong>${esc(t.q)}</strong>${
            t.a ? `<br><span style="color:var(--muted);">You: ${esc(t.a)}</span>` : ""
          }</li>`,
      )
      .join("");
  };

  const persist = () => {
    state?.saveResponse?.(phaseId, key, { turns, stem: itemText });
  };

  const nextQuestion = async () => {
    if (turns.length >= MAX_TURNS) {
      status.textContent = "That is a good place to stop — try the problem now.";
      send.disabled = true;
      return;
    }
    status.textContent = "Thinking of a question…";
    send.disabled = true;
    const history = turns.flatMap((t) => [
      { role: "assistant", text: t.q },
      ...(t.a ? [{ role: "user", text: t.a }] : []),
    ]);
    const res = await askNextQuestion({
      itemText,
      standard: config?.standard,
      studentWork: turns
        .map((t) => t.a)
        .filter(Boolean)
        .join(" | "),
      history,
    });
    let question;
    if (res.ok) {
      question = res.question;
      status.textContent = "";
    } else {
      // Never a dead button: fall back to the fixed ladder and say so plainly.
      question = FALLBACK_LADDER[fallbackIndex % FALLBACK_LADDER.length];
      fallbackIndex += 1;
      status.textContent = "(offline questions)";
    }
    turns.push({ q: question, a: "" });
    paint();
    persist();
    send.disabled = false;
    input.focus();
  };

  send.addEventListener("click", async () => {
    const answer = input.value.trim();
    if (turns.length && !turns[turns.length - 1].a) {
      if (!answer) {
        status.textContent = "Have a go — even a guess moves this forward.";
        return;
      }
      turns[turns.length - 1].a = answer;
      input.value = "";
      paint();
      persist();
      try {
        window.NTtelemetry?.track?.("socratic_turn", {
          standard: config?.standard || "",
          turn: turns.length,
        });
      } catch {
        /* telemetry is best-effort */
      }
    }
    await nextQuestion();
  });

  host.append(wrap);
  paint();
  // Open with a question rather than a blank box: the student should be
  // answering from the first second, not deciding what to type.
  if (!turns.length) nextQuestion();

  return {
    getTurns: () => turns.slice(),
  };
}

/**
 * Every Socratic exchange this device has recorded for a lesson.
 *
 * Reads straight out of the lesson's saved responses, which is where the
 * dialogue already lives — no second store, and nothing that leaves the device.
 *
 * @returns {Array<{ stem: string, turns: Array<{q: string, a: string}> }>}
 */
export function collectQuestionLadders(state) {
  const responses = state?.get?.()?.responses;
  if (!responses || typeof responses !== "object") return [];
  const out = [];
  for (const [key, value] of Object.entries(responses)) {
    if (!/_socratic_/.test(key)) continue;
    if (!value || !Array.isArray(value.turns) || !value.turns.length) continue;
    out.push({ stem: value.stem || "", turns: value.turns });
  }
  return out;
}

/**
 * Teacher-only readout of the question ladders.
 *
 * The point of keeping the ladder is that it answers a question a score cannot:
 * not whether the student got it, but which question they could not answer. That
 * is only useful if a teacher can actually read it, so it renders as the
 * transcript it is rather than as a count.
 */
export function mountQuestionLadderReader(host, state) {
  if (!host) return null;
  const ladders = collectQuestionLadders(state);
  if (!ladders.length) return null;

  const details = document.createElement("details");
  details.className = "socratic-ladder-reader no-print";
  details.innerHTML = `
    <summary style="font-weight:800; cursor:pointer;">
      ❓ Question ladders (${ladders.length})
    </summary>
    <p style="font-size:0.85rem; color:var(--muted); margin:var(--sp-2) 0;">
      Where the thinking actually stopped. Look for the first question with a thin answer —
      that is the one worth asking the whole class.
    </p>
    ${ladders
      .map(
        (l) => `
      <div style="margin:var(--sp-3) 0; padding-left:var(--sp-3); border-left:3px solid var(--teal);">
        <p style="font-weight:700; margin:0 0 var(--sp-2);">${esc(l.stem)}</p>
        <ol style="margin:0; padding-left:1.2rem;">
          ${l.turns
            .map(
              (t) =>
                `<li style="margin-bottom:var(--sp-1);">${esc(t.q)}${
                  t.a
                    ? `<br><span style="color:var(--muted);">${esc(t.a)}</span>`
                    : `<br><span style="color:var(--muted);"><em>no answer</em></span>`
                }</li>`,
            )
            .join("")}
        </ol>
      </div>`,
      )
      .join("")}`;

  host.append(details);
  return details;
}

export default mountSocraticDialogue;

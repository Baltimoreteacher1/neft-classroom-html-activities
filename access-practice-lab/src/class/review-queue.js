// Scoring queue (Language Page teacher tools): one list of the class's shared recordings and writing samples, work
// awaiting feedback first. For each: play or read it, pick descriptor chips from the lab's own 4-point PRACTICE
// rubric (content/rubrics/*.json, original wording, never WIDA's), add a short comment, record a voice note back
// (recordings), and mark it reviewed. The learner sees the chips as plain descriptors and the comment in /class;
// no number, score or level is shown to anyone.
import { BASE } from "../util.js";
import { el, errorText } from "./dom.js";
import { recordingPlayer, voiceNoteButton } from "./voice-note.js";

export const MAX_COMMENT = 280;
const rubricCache = new Map();
export const rubricIdFor = (item) =>
  item.kind === "recording" ? "speaking-practice" : "writing-practice";

export async function loadRubric(id, fetchImpl = (...a) => fetch(...a)) {
  if (!rubricCache.has(id))
    rubricCache.set(
      id,
      fetchImpl(`${BASE}/content/rubrics/${id}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  return rubricCache.get(id);
}

function chipsFieldset(S, rubric, item, chosen) {
  return rubric.dimensions.map((d) =>
    el(
      "fieldset",
      { class: "cls-chips" },
      el("legend", { lang: "en" }, d.label),
      d.descriptors.map((text, i) => {
        const input = el("input", {
          type: "radio",
          name: `chip-${item.itemId}-${d.id}`,
          value: String(i),
          "data-dim": d.id,
        });
        if (chosen[d.id] === i) input.checked = true;
        return el("label", { class: "cls-rchip", lang: "en" }, input, ` ${text}`);
      }),
    ),
  );
}

function itemCard(S, api, item, rubric, refresh, live) {
  const chosen = item.review?.chips || {};
  const comment = el("textarea", {
    rows: "2",
    maxlength: String(MAX_COMMENT),
    "aria-label": S("Short comment for the student", "Comentario breve para el estudiante"),
  });
  comment.value = item.review?.comment || "";
  const form = el("div", { class: "cls-review-form" });
  if (rubric) form.append(...chipsFieldset(S, rubric, item, chosen));
  else
    form.append(
      el(
        "p",
        { class: "fine" },
        S(
          "The practice rubric could not load. You can still leave a comment.",
          "No se pudo cargar la rúbrica de práctica. Aún puedes dejar un comentario.",
        ),
      ),
    );
  const status = el("span", { class: "fine", role: "status" });
  const mark = el(
    "button",
    { type: "button", class: "btn small btn-primary" },
    item.review
      ? S("Update review", "Actualizar revisión")
      : S("Mark reviewed", "Marcar como revisado"),
  );
  mark.addEventListener("click", async () => {
    const chips = {};
    for (const input of form.querySelectorAll("input[type=radio]:checked"))
      chips[input.dataset.dim] = Number(input.value);
    const res = await api.reviewMark({
      itemId: item.itemId,
      rubric: rubricIdFor(item),
      chips,
      comment: comment.value,
    });
    status.textContent = res.ok
      ? S(
          "Reviewed. The student sees it in My class.",
          "Revisado. El estudiante lo ve en Mi clase.",
        )
      : res.error === "empty-review"
        ? S(
            "Pick at least one descriptor or write a comment.",
            "Elige al menos un descriptor o escribe un comentario.",
          )
        : errorText(S, res.error);
    if (res.ok) {
      live.textContent = status.textContent;
      refresh();
    }
  });
  const kind = item.kind === "recording" ? S("Recording", "Grabación") : S("Writing", "Escritura");
  return el(
    "li",
    { class: `cls-review ${item.review ? "is-reviewed" : "is-waiting"}`, "data-item": item.itemId },
    el(
      "p",
      {},
      el("strong", {}, item.alias || ""),
      ` · ${kind} · ${item.label || ""} · `,
      el(
        "span",
        { class: item.review ? "cls-done" : "cls-new" },
        item.review ? S("Reviewed", "Revisado") : S("Awaiting feedback", "Esperando comentarios"),
      ),
    ),
    item.kind === "recording"
      ? recordingPlayer(api, item)
      : el("blockquote", { class: "cls-writing", lang: "en" }, item.text || ""),
    el(
      "details",
      { open: !item.review },
      el("summary", {}, S("Review", "Revisar")),
      el(
        "p",
        { class: "fine" },
        S(
          "Practice rubric descriptors, not a score. Pick what you heard or read.",
          "Descriptores de la rúbrica de práctica, no un puntaje. Elige lo que escuchaste o leíste.",
        ),
      ),
      form,
      el(
        "label",
        {},
        S("Comment (optional, 280 characters)", "Comentario (opcional, 280 caracteres)"),
        comment,
      ),
      el(
        "div",
        { class: "row-actions" },
        mark,
        item.kind === "recording" ? voiceNoteButton({ S, api, parentId: item.itemId }) : null,
        status,
      ),
    ),
  );
}

/** Draw the queue into `box`. Called on mount and after each review; it is not polled, so nothing resets mid-edit. */
export async function drawReviewQueue(box, { S, api, live }) {
  const res = await api.reviewQueue();
  if (!res.ok) {
    box.replaceChildren(el("p", {}, errorText(S, res.error)));
    return;
  }
  const items = res.items || [];
  const rubrics = Object.fromEntries(
    await Promise.all(
      ["speaking-practice", "writing-practice"].map(async (id) => [id, await loadRubric(id)]),
    ),
  );
  const waiting = items.filter((i) => !i.review).length;
  const refresh = () => drawReviewQueue(box, { S, api, live });
  box.replaceChildren(
    el(
      "p",
      {},
      S(
        `${waiting} awaiting feedback · ${items.length - waiting} reviewed`,
        `${waiting} esperando comentarios · ${items.length - waiting} revisados`,
      ),
      " ",
      el(
        "button",
        { type: "button", class: "btn small ghost", onclick: refresh },
        S("Refresh", "Actualizar"),
      ),
    ),
    items.length
      ? el(
          "ul",
          { class: "cls-list cls-queue" },
          items.map((item) => itemCard(S, api, item, rubrics[rubricIdFor(item)], refresh, live)),
        )
      : el(
          "p",
          {},
          S(
            "Nothing to review yet. Students send a recording from a Speaking task or a finished piece from Writing.",
            "Todavía no hay nada que revisar. Los estudiantes envían una grabación desde una tarea de Hablar o un texto terminado desde Escribir.",
          ),
        ),
  );
}

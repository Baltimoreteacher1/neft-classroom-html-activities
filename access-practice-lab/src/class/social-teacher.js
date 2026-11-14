// Teacher controls for the class social features, mounted inside the class dashboard (roster-panel.js):
//   - Listening partners: turn pairs on or off, auto-pair or pick groups of 2-3, hear and remove any take.
//   - Scenes to approve: read each student scene before the class can see it; Approve, Send back with a note, Delete.
// Server: functions/_lib/class-platform/{pairs,scenes}.js. Text guard shared with the server: social.js.
import {
  checkText,
  LISTENER_QUESTIONS,
  PEER_TAKE_DAYS,
  REACTIONS,
  SCENE_LIMITS,
} from "../../../shared/class-platform/social.js";
import { el, errorText } from "./dom.js";
import { characterFor, PLACE_NAMES, socialErrorText } from "./scene-model.js";
import { lazyAudio } from "./scene-player.js";
import { teacherSocial } from "./social-api.js";

const POLL_MS = 20_000;

export function mountSocialPanel(
  box,
  { S = (en) => en, code, passcode, siteKey, fetchImpl, live } = {},
) {
  const api = teacherSocial({ code, passcode, siteKey, fetchImpl });
  const say = (msg) => live && (live.textContent = msg);
  const errorFor = (c) => socialErrorText(S, c) || errorText(S, c);
  const pairsBox = el("div");
  const scenesBox = el("div");
  box.replaceChildren(
    el(
      "section",
      { class: "cls-card" },
      el("h4", {}, S("Listening partners", "Parejas para escuchar")),
      pairsBox,
    ),
    el(
      "section",
      { class: "cls-card" },
      el("h4", {}, S("Scenes to approve", "Escenas para aprobar")),
      scenesBox,
    ),
  );

  const player = lazyAudio;

  let picking = false;
  async function drawPairs() {
    if (picking) return; // do not redraw under a teacher choosing groups
    const st = await api.pairsState();
    if (!st.ok) return void pairsBox.replaceChildren(el("p", {}, errorFor(st.error)));
    const alias = new Map(st.students.map((s) => [s.studentId, s.alias]));
    const config = async (change, done) => {
      const res = await api.configure(change);
      say(res.ok ? done : errorFor(res.error));
      picking = false;
      drawPairs();
    };
    const groupsList = st.groups.length
      ? el(
          "ul",
          { class: "cls-list" },
          st.groups.map((g, i) =>
            el(
              "li",
              {},
              `${S("Pair", "Pareja")} ${i + 1}: ${g.map((id) => alias.get(id) || "?").join(" + ")}`,
            ),
          ),
        )
      : el("p", { class: "fine" }, S("No pairs yet.", "Todavía no hay parejas."));
    const takes = st.takes.map((t) =>
      el(
        "li",
        {},
        el("strong", {}, `${t.alias} · ${t.taskTitle}`),
        " ",
        player(S(`Recording from ${t.alias}`, `Grabación de ${t.alias}`), () =>
          api.takeBlob(t.takeId),
        ),
        el(
          "p",
          { class: "fine" },
          `${S("Question", "Pregunta")}: ${S(...(LISTENER_QUESTIONS[t.questionId] || ["", ""]))}`,
        ),
        t.replies.map((r) =>
          el(
            "p",
            {},
            `${alias.get(r.studentId) || "?"}: “${r.answer}” · ${S(...(REACTIONS[r.reaction] || ["", ""]))}${r.landed === true ? ` · ${S("landed", "se entendió")}` : r.landed === false ? ` · ${S("not quite", "no del todo")}` : ""}`,
          ),
        ),
        el(
          "button",
          {
            type: "button",
            class: "btn small ghost",
            onclick: async () => {
              const res = await api.deleteTake(t.takeId);
              say(res.ok ? S("Recording removed.", "Grabación quitada.") : errorFor(res.error));
              drawPairs();
            },
          },
          S("Remove", "Quitar"),
        ),
      ),
    );
    pairsBox.replaceChildren(
      el(
        "p",
        { class: "fine" },
        S(
          `Learners share a short recording with their partner only. The partner answers one question and taps a kind reaction (no comments). Recordings are deleted after ${PEER_TAKE_DAYS} days.`,
          `Los estudiantes comparten una grabación corta solo con su pareja. La pareja responde una pregunta y toca una reacción amable (sin comentarios). Las grabaciones se borran después de ${PEER_TAKE_DAYS} días.`,
        ),
      ),
      el(
        "p",
        {},
        st.enabled
          ? S("Pairs are ON.", "Las parejas están ACTIVADAS.")
          : S("Pairs are off.", "Las parejas están desactivadas."),
      ),
      el(
        "div",
        { class: "row-actions" },
        el(
          "button",
          {
            type: "button",
            class: "btn",
            "aria-pressed": String(st.enabled),
            onclick: () =>
              config(
                { enabled: !st.enabled },
                st.enabled
                  ? S("Pairs turned off.", "Parejas desactivadas.")
                  : S("Pairs turned on.", "Parejas activadas."),
              ),
          },
          st.enabled
            ? S("Turn pairs off", "Desactivar parejas")
            : S("Turn pairs on", "Activar parejas"),
        ),
        el(
          "button",
          {
            type: "button",
            class: "btn",
            disabled: st.students.length < 2,
            onclick: () => config({ auto: true }, S("New pairs made.", "Parejas nuevas formadas.")),
          },
          S("Auto-pair the class", "Formar parejas automáticamente"),
        ),
        el(
          "button",
          {
            type: "button",
            class: "btn",
            disabled: st.students.length < 2,
            onclick: () => {
              picking = true;
              pickGroups(st, alias, config);
            },
          },
          S("Pick pairs", "Elegir parejas"),
        ),
      ),
      groupsList,
      el("h5", {}, S("Shared recordings", "Grabaciones compartidas")),
      takes.length
        ? el("ul", { class: "cls-list" }, takes)
        : el(
            "p",
            { class: "fine" },
            S("No recordings shared yet.", "Todavía no hay grabaciones compartidas."),
          ),
    );
  }

  function pickGroups(st, alias, config) {
    const max = Math.max(1, Math.floor(st.students.length / 2));
    const current = new Map(st.groups.flatMap((g, i) => g.map((id) => [id, String(i + 1)])));
    const selects = st.students.map((s) => {
      const id = `ctPair-${s.studentId}`;
      const sel = el("select", { id }, [
        el("option", { value: "" }, S("Not paired", "Sin pareja")),
        ...Array.from({ length: max }, (_, i) =>
          el("option", { value: String(i + 1) }, `${S("Pair", "Pareja")} ${i + 1}`),
        ),
      ]);
      sel.value = current.get(s.studentId) || "";
      return { s, sel, row: el("div", {}, el("label", { for: id }, alias.get(s.studentId)), sel) };
    });
    const err = el("p", { class: "cls-error", role: "alert" });
    pairsBox.replaceChildren(
      el(
        "p",
        {},
        S(
          "Put 2 or 3 learners in each pair number.",
          "Pon 2 o 3 estudiantes en cada número de pareja.",
        ),
      ),
      ...selects.map((x) => x.row),
      err,
      el(
        "div",
        { class: "row-actions" },
        el(
          "button",
          {
            type: "button",
            class: "btn btn-primary",
            onclick: () => {
              const by = new Map();
              for (const { s, sel } of selects)
                if (sel.value) by.set(sel.value, [...(by.get(sel.value) || []), s.studentId]);
              const groups = [...by.values()];
              if (groups.some((g) => g.length < 2 || g.length > 3))
                return void (err.textContent = S(
                  "Each pair needs 2 or 3 learners.",
                  "Cada pareja necesita 2 o 3 estudiantes.",
                ));
              config({ groups }, S("Pairs saved.", "Parejas guardadas."));
            },
          },
          S("Save pairs", "Guardar parejas"),
        ),
        el(
          "button",
          {
            type: "button",
            class: "btn ghost",
            onclick: () => {
              picking = false;
              drawPairs();
            },
          },
          S("Cancel", "Cancelar"),
        ),
      ),
    );
  }

  function sceneDetails(item) {
    const sc = item.scene || {};
    const npc = characterFor(sc.character);
    return el(
      "div",
      { lang: "en" },
      el(
        "p",
        {},
        el("strong", {}, sc.title),
        ` · ${S("by", "de")} ${item.alias} · ${S(...(PLACE_NAMES[sc.place] || ["", ""]))} · ${npc ? npc.name : ""}`,
      ),
      el("p", {}, `${S("Situation", "Situación")}: ${sc.situation}`),
      el("p", {}, `${npc ? npc.name : S("They", "Dice")}: ${(sc.lines || []).join(" / ")}`),
      el(
        "p",
        {},
        `${S("Good replies", "Respuestas buenas")}: ${(sc.good || []).map((g) => `“${g}”`).join(" · ")}`,
      ),
      el(
        "p",
        {},
        `${S("Not so polite", "No tan cortés")}: “${sc.rude?.say || ""}” — ${sc.rude?.why || ""}`,
      ),
      item.hasAudio
        ? player(S("Voice line", "Frase grabada"), () => api.sceneAudio(item.sceneId))
        : null,
    );
  }

  let noting = false;
  async function drawScenes() {
    if (noting) return;
    const res = await api.scenes();
    if (!res.ok) return void scenesBox.replaceChildren(el("p", {}, errorFor(res.error)));
    const act = async (call, done) => {
      const r = await call;
      say(r.ok ? done : errorFor(r.error));
      noting = false;
      drawScenes();
    };
    const pending = res.scenes.filter((s) => s.status === "pending");
    const returned = res.scenes.filter((s) => s.status === "returned");
    const approved = res.scenes.filter((s) => s.status === "approved");
    const pendingRow = (item) => {
      const noteId = `ctNote-${item.sceneId}`;
      const note = el("input", {
        id: noteId,
        maxlength: String(SCENE_LIMITS.note),
        autocomplete: "off",
      });
      note.addEventListener("focus", () => (noting = true));
      note.addEventListener("blur", () => (noting = !!note.value));
      const err = el("p", { class: "cls-error", role: "alert" });
      return el(
        "li",
        { class: "cls-note" },
        sceneDetails(item),
        el(
          "div",
          { class: "row-actions" },
          el(
            "button",
            {
              type: "button",
              class: "btn btn-primary",
              onclick: () =>
                act(
                  api.review(item.sceneId, "approve"),
                  S(
                    "Approved. The class can play it now.",
                    "Aprobada. La clase ya la puede jugar.",
                  ),
                ),
            },
            S("Approve", "Aprobar"),
          ),
          el(
            "button",
            {
              type: "button",
              class: "btn ghost",
              onclick: () =>
                confirm(S("Delete this scene?", "¿Borrar esta escena?")) &&
                act(api.deleteScene(item.sceneId), S("Deleted.", "Borrada.")),
            },
            S("Delete", "Borrar"),
          ),
        ),
        el(
          "label",
          { for: noteId },
          S("Note for the writer (optional)", "Nota para quien la escribió (opcional)"),
        ),
        note,
        err,
        el(
          "button",
          {
            type: "button",
            class: "btn",
            onclick: () => {
              const checked = checkText(note.value, SCENE_LIMITS.note, { required: false });
              if (!checked.ok) return void (err.textContent = errorFor(checked.error));
              act(
                api.review(item.sceneId, "return", checked.text),
                S("Sent back to the writer.", "Devuelta a quien la escribió."),
              );
            },
          },
          S("Send back with note", "Devolver con nota"),
        ),
      );
    };
    scenesBox.replaceChildren(
      el(
        "p",
        { class: "fine" },
        S(
          "Only you see a scene until you approve it. Then every learner in the class can play it at /scenes.",
          "Solo tú ves una escena hasta que la apruebas. Luego todos en la clase la pueden jugar en /scenes.",
        ),
      ),
      pending.length
        ? el("ul", { class: "cls-list" }, pending.map(pendingRow))
        : el("p", {}, S("No scenes waiting.", "No hay escenas esperando.")),
      returned.length
        ? el(
            "p",
            { class: "fine" },
            S(
              `${returned.length} sent back and waiting for the writer.`,
              `${returned.length} devueltas, esperando a quien las escribió.`,
            ),
          )
        : null,
      el("h5", {}, S("Approved scenes", "Escenas aprobadas")),
      approved.length
        ? el(
            "ul",
            { class: "cls-list" },
            approved.map((item) =>
              el(
                "li",
                {},
                sceneDetails(item),
                el(
                  "button",
                  {
                    type: "button",
                    class: "btn small ghost",
                    onclick: () =>
                      confirm(S("Delete this scene?", "¿Borrar esta escena?")) &&
                      act(api.deleteScene(item.sceneId), S("Deleted.", "Borrada.")),
                  },
                  S("Delete", "Borrar"),
                ),
              ),
            ),
          )
        : el("p", { class: "fine" }, S("None yet.", "Todavía ninguna.")),
    );
  }

  drawPairs();
  drawScenes();
  const timer = setInterval(() => {
    if (!box.isConnected) return void clearInterval(timer);
    if (document.hidden) return;
    drawPairs();
    drawScenes();
  }, POLL_MS);
  return { unmount: () => clearInterval(timer) };
}

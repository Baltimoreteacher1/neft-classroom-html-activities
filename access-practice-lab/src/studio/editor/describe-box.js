// "Describe it": the teacher says what they want in their own words. The interpreter (x/intent.js) reads the request
// with plain rules (no model, nothing sent anywhere), the box shows the plan in plain words, asks at most three
// concrete questions, and builds only from what the teacher supplied or from verified math problems. A request that
// cannot be met reliably shows the interpreter's own honest message and choices; no result is ever faked.
//
//   describeBox({ S, onBuilt, onOpenMine?, onPickLesson?, context? }) -> HTMLElement
//   onBuilt({ activity, notes: [{en, es}] })   called with a valid activity (passes normalizeActivity + validateActivity)

import {
  announce as say,
  ensureWireCss,
  focusEl,
  noteList,
  notesOf,
  uid,
  xarea,
  xbtn,
  xfield,
} from "../../create/wire-kit.js";
import { buildFromPlan, interpretRequest } from "../x/intent.js";
import { append, h } from "./ui.js";

/** Append children, skipping null and flattening lists (DOM append would write the text "null"). */
const add = (el, ...kids) => append(el, kids);

const KIND_LABEL = {
  worksheet: ["a worksheet", "una hoja de trabajo"],
  interactive: ["an interactive activity", "una actividad interactiva"],
  game: ["a game", "un juego"],
  check: ["a quick check", "una revisión rápida"],
};
// what an answered "which kind?" choice adds to the request line, in words the interpreter reads
const KIND_PHRASE = {
  worksheet: "Make a worksheet.",
  interactive: "Make an interactive activity.",
  game: "Make a game.",
  check: "Make a quick check.",
};
const SUPPORT_LABEL = {
  visuals: ["pictures", "imágenes"],
  spanish: ["Spanish words", "palabras en español"],
  readAloud: ["read aloud", "lectura en voz alta"],
  frames: ["sentence frames", "marcos de oraciones"],
  chunk: ["short parts", "partes cortas"],
};
const SURE = {
  high: [
    "I am sure I read your request the way you meant it.",
    "Estoy seguro de haber leído su pedido como usted lo quería.",
  ],
  medium: [
    "This is my best reading. Look at the result before you use it.",
    "Esta es mi mejor lectura. Revise el resultado antes de usarlo.",
  ],
  low: [
    "I could not read this reliably, so I am not building it yet.",
    "No pude leer esto con seguridad, así que todavía no lo construyo.",
  ],
};

/** What the teacher typed, plus the answers they gave to my questions, as one message for the interpreter. */
export function composeRequest({ request = "", content = "", extras = [] }) {
  const lines = String(request).replace(/\r\n?/g, "\n").split("\n");
  const at = lines.findIndex((l) => l.trim());
  if (at >= 0 && extras.length) lines[at] = `${lines[at].trim()} ${extras.join(" ")}`;
  else if (at < 0 && extras.length) lines.push(extras.join(" "));
  return [lines.join("\n").trim(), String(content).trim()].filter(Boolean).join("\n\n");
}

export function describeBox({ S, onBuilt, onOpenMine, onPickLesson, context = {}, newId }) {
  ensureWireCss();
  const state = { request: "", content: "", extras: {}, plan: null, result: null, text: "" };
  const root = h("section.xw-box", { "data-box": "describe" });
  const live = h("p.xw-status", { role: "status", "aria-live": "polite" });
  const planBox = h("div.xw-plan");
  const reqId = uid("xw-req");

  const request = xarea(state.request, (v) => ((state.request = v), stale()), {
    id: reqId,
    rows: 3,
    maxlength: 12000,
    placeholder: S(
      "Create a worksheet about ecosystems with visual vocabulary and sentence frames",
      "Cree una hoja de trabajo sobre ecosistemas con vocabulario visual y marcos de oraciones",
    ),
  });
  const content = xarea(state.content, (v) => ((state.content = v), stale()), {
    rows: 6,
    maxlength: 12000,
    placeholder: S(
      "habitat - the place where an animal lives\npredator - an animal that hunts other animals",
      "habitat - el lugar donde vive un animal\ndepredador - un animal que caza a otros animales",
    ),
  });
  const more = h(
    "details.xw-more",
    h(
      "summary",
      S(
        "Add my words, questions or a passage (optional)",
        "Agregar mis palabras, preguntas o un texto (opcional)",
      ),
    ),
    xfield(
      S("Your content", "Su contenido"),
      content,
      S(
        "One word per line works: word - meaning. I build only from what you give me; I never make up meanings or answers.",
        "Funciona una palabra por línea: palabra - significado. Construyo solo con lo que usted me da; nunca invento significados ni respuestas.",
      ),
    ),
  );
  const planBtn = xbtn(S("Show my plan", "Mostrar mi plan"), () => plan(), "primary", {
    "data-act": "plan",
  });

  const extrasList = () => Object.values(state.extras).filter(Boolean);
  const message = () =>
    composeRequest({ request: state.request, content: state.content, extras: extrasList() });

  /** The text changed after a plan was shown: the plan no longer describes it. */
  function stale() {
    if (!state.plan && !state.result) return;
    state.plan = state.result = null;
    drawPlan();
  }

  function plan({ focus = true } = {}) {
    const text = message();
    if (!text.trim()) {
      state.result = null;
      state.plan = null;
      live.textContent = S("Write what you want first.", "Primero escriba lo que quiere.");
      request.focus();
      return;
    }
    state.result = interpretRequest(text, context);
    state.text = text;
    state.plan = state.result.plan;
    drawPlan();
    say(
      state.result.ok
        ? S(
            "Here is my plan. Check it, then build.",
            "Este es mi plan. Revíselo y luego construya.",
          )
        : S(
            "I cannot build that yet. Read what I need.",
            "Todavía no puedo construir eso. Lea lo que necesito.",
          ),
    );
    if (focus) focusEl(planBox.querySelector("h3"));
  }

  function answer(choice, option) {
    const show = () => planBtn.focus();
    switch (`${choice.id}:${option.id}`) {
      case "format:worksheet":
      case "format:interactive":
      case "format:game":
      case "format:check":
        state.extras.format = KIND_PHRASE[option.id];
        return plan({ focus: false });
      case "source:paste-content":
      case "source:add-meanings":
      case "meanings:type-meanings":
      case "passage:paste-passage":
      case "math-topic:paste-own":
        more.open = true;
        content.focus();
        live.textContent = S(
          "Paste or type your content here, then press Update my plan.",
          "Pegue o escriba su contenido aquí y luego presione Actualizar mi plan.",
        );
        return;
      case "source:pick-lesson":
      case "meanings:pick-lesson":
      case "passage:pick-lesson":
        if (onPickLesson) return onPickLesson();
        live.textContent = S(
          "Choose a type above, then use Use This Lesson.",
          "Elija un tipo arriba y luego use Usar esta lección.",
        );
        return;
      case "activity:open-activity":
        if (onOpenMine) return onOpenMine();
        live.textContent = S(
          "Open My activities, choose an activity, and describe the change there.",
          "Abra Mis actividades, elija una actividad y describa allí el cambio.",
        );
        return;
      case "activity:describe-first":
        request.focus();
        return;
      case "math-topic:use-closest":
        live.textContent = S(
          "Good. Press Build it to use the closest topic.",
          "Bien. Presione Construir para usar el tema más cercano.",
        );
        return show();
      default:
        live.textContent = S(
          "Add that to your description, then press Update my plan.",
          "Agregue eso a su descripción y luego presione Actualizar mi plan.",
        );
        request.focus();
    }
  }

  function details(p) {
    const rows = [];
    const kind = KIND_LABEL[p.kind];
    if (kind) rows.push([S("Type", "Tipo"), S(...kind)]);
    if (p.topic) rows.push([S("About", "Sobre"), p.topic]);
    if (p.count) rows.push([S("Questions", "Preguntas"), S(`about ${p.count}`, `unas ${p.count}`)]);
    const sup = [
      ...(p.supports || []).map((k) => SUPPORT_LABEL[k] && S(...SUPPORT_LABEL[k])),
      p.wida ? S(`language level ${p.wida}`, `nivel de lenguaje ${p.wida}`) : "",
    ].filter(Boolean);
    if (sup.length) rows.push([S("Supports", "Apoyos"), sup.join(", ")]);
    if ((p.versions || []).length)
      rows.push([
        S("Versions", "Versiones"),
        S(`${p.versions.length} levels`, `${p.versions.length} niveles`),
      ]);
    rows.push([S("How sure I am", "Qué tan seguro estoy"), S(...(SURE[p.confidence] || SURE.low))]);
    return h(
      "dl.xw-facts",
      rows.map(([k, v]) => [h("dt", k), h("dd", v)]),
    );
  }

  function drawPlan() {
    planBox.replaceChildren();
    const r = state.result;
    if (!r) {
      planBtn.className = "xw-btn xw-primary";
      planBtn.textContent = S("Show my plan", "Mostrar mi plan");
      return;
    }
    planBtn.textContent = S("Update my plan", "Actualizar mi plan");
    planBtn.className = `xw-btn xw-${r.ok ? "ghost" : "primary"}`;
    add(planBox, 
      h(
        "h3",
        { tabindex: "-1" },
        r.ok ? S("My plan", "Mi plan") : S("I need a little more", "Necesito un poco más"),
      ),
      h("p.xw-callout", { "data-ok": String(r.ok) }, S(r.explanation.en, r.explanation.es)),
      r.plan ? details(r.plan) : null,
    );
    for (const c of r.choices) {
      add(planBox, 
        h(
          "div.xw-choice",
          { role: "group", "aria-labelledby": `xw-q-${c.id}` },
          h("p.xw-q", { id: `xw-q-${c.id}` }, S(c.question.en, c.question.es)),
          h(
            "div.xw-opts",
            c.options.map((o) =>
              xbtn(S(o.label.en, o.label.es), () => answer(c, o), "ghost", { "data-opt": o.id }),
            ),
          ),
        ),
      );
    }
    if (r.ok)
      add(planBox, 
        h(
          "div.xw-row",
          xbtn(S("Build it", "Construir"), build, "primary", { "data-act": "build" }),
        ),
      );
  }

  function build() {
    if (!state.plan || !state.result?.ok) return;
    const ctx = { ...context, request: state.text };
    const res = buildFromPlan(state.plan, ctx, newId ? { newId } : {});
    if (!res.activity) {
      const notes = notesOf(res.review);
      planBox.replaceChildren(
        h("h3", { tabindex: "-1" }, S("I could not build it", "No pude construirlo")),
        notes.length
          ? noteList(S, notes)
          : h(
              "p",
              S("There was not enough to build from.", "No había suficiente con qué construir."),
            ),
      );
      focusEl(planBox.querySelector("h3"));
      return;
    }
    onBuilt({ activity: res.activity, notes: notesOf(res.review), versions: res.versions || [] });
  }

  add(root, 
    h(
      "p.xw-lead",
      S(
        "Say what you want in your own words. I will show you my plan before anything is made.",
        "Diga lo que quiere con sus propias palabras. Le mostraré mi plan antes de hacer nada.",
      ),
    ),
    xfield(S("What would you like to make?", "¿Qué le gustaría crear?"), request),
    more,
    h("div.xw-row", planBtn),
    live,
    planBox,
  );
  return root;
}

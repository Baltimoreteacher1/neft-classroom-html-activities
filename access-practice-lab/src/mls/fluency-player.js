import { framesFor, promptFor } from "../../../math/fluency-lab/language-frames.js";
import { languageProfile } from "../../../math/fluency-lab/language-terms.js";
import { CALM_PACES, rivalAt, TRACK, winner } from "../../../math/fluency-lab/race-core.js";
import { choicesEs, isWordy, questionEs } from "../../../math/fluency-lab/question-es.js";
import { stepLeaks } from "../../../math/fluency-lab/step-leak.js";
import { scaffold } from "../../../math/fluency-lab/studio/adaptive.js";
import { feedbackFor } from "../../../math/fluency-lab/tutor-engine.js";
import { activeSlot, emptyProgress, progressFor, selectSlot, SLOTS } from "./fluency-progress.js";
import { hasStretchRange, practiceProblem, sourceSkill, validateAnswer } from "./fluency-problems.js";
import { h, speak, speechAvailable, stopSpeech } from "./ui-kit.js";

const EXAMPLE_OFFSET = 10007;
const FRAME_LEVEL = { more: 1, standard: 2, extension: 4, "1-2": 1, "3-4": 2, "5-6": 4 };
const maxSeed = 0xffffffff;
const encodeSeed = (seed, index) => (seed + index) >>> 0;
const plainText = (text) => String(text || "").replace(/<[^>]+>/g, "");

export function questionIn(item, lang = "en") {
  const translated = lang !== "en" && questionEs(item);
  return translated
    ? { text: translated, lang: "es", original: lang === "bi" ? item.question : "" }
    : { text: item.question, lang: lang !== "en" && !isWordy(item.question) ? "es" : "en", original: "" };
}

export function parallelExample(skill, current, seed, level) {
  for (let i = 0; i < 32; i += 1) {
    const example = practiceProblem(skill, encodeSeed(seed, EXAMPLE_OFFSET + i), level);
    if (example.question !== current.question && !example.answers.some((answer) => validateAnswer(answer, current))) return example;
  }
  return null;
}

// Use only a source strategy or misconception that survives the source's answer-leak guard.
export function safeStrategy(item, candidate) {
  const tip = plainText(candidate);
  if (!tip || stepLeaks(tip, item)) return "";
  // A number can repeat a number already in the question yet still state the solution.
  const normalized = tip.replaceAll("−", "-").replace(/,(?=\d{3}\b)/g, "");
  const containsResult = item.answers.some((answer) => {
    const result = String(answer).replaceAll("−", "-").replace(/,(?=\d{3}\b)/g, "").trim();
    if (!result || /^[-+<>=≤≥]$/.test(result)) return false;
    const escaped = result.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![\\w./-])${escaped}(?![\\w/]|\\.\\d)`, "i").test(normalized);
  });
  return containsResult ? "" : tip;
}

function earlyPicture(item, tr) {
  const model = item.model;
  if (model?.type === "dotpattern") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("width", "132");
    svg.setAttribute("height", "132");
    svg.setAttribute("role", "img");
    // Announce the spatial groups, so that counting or subitizing the groups remains the learner's task.
    const groups = [...new Set(model.dots.map(([, y]) => y))].sort((a, b) => a - b)
      .map((y) => model.dots.filter(([, row]) => row === y).length).join(", ");
    svg.setAttribute("aria-label", tr(`Dots by row: ${groups}.`, `Puntos en cada fila: ${groups}.`));
    for (const [x, y] of model.dots) {
      const dot = document.createElementNS(svg.namespaceURI, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", 6);
      dot.setAttribute("fill", "currentColor");
      svg.append(dot);
    }
    return svg;
  }
  if (model?.type === "dataTable") {
    return h("table", {},
      h("thead", { lang: "en" }, h("tr", {}, ...model.headers.map((name) => h("th", { scope: "col" }, name)))),
      h("tbody", { lang: "en" }, ...model.rows.map((row) => h("tr", {}, ...row.map((value) => h("td", {}, value))))),
    );
  }
  if (model?.type === "coins") {
    return h("ul", { class: "ml-fluency-coins", "aria-label": tr("Coins", "Monedas") }, ...model.counts.map((n, i) =>
      h("li", {}, `${n} × ${[25, 10, 5, 1][i]}¢`),
    ));
  }
  if (model?.type !== "counters") return null;
  const filled = model.kind === "takeAway" ? model.target : model.filled;
  const countSet = model.kind === "countSet";
  const columns = countSet && model.layout === "pairs" ? 2 : countSet && model.layout === "line" ? 10 : 5;
  const rows = Array.from({ length: Math.ceil((countSet ? filled : model.total) / columns) }, (_, n) =>
    Math.max(0, Math.min(columns, filled - n * columns)),
  );
  return h("div", {
    role: "img",
    class: "ml-fluency-counters",
    "aria-label": tr(`Filled dots by row: ${rows.join(", ")}.`, `Fichas en cada fila: ${rows.join(", ")}.`),
  }, ...rows.map((n) => h("div", { "aria-hidden": "true" }, "●".repeat(n) + (countSet ? "" : "○".repeat(columns - n)))));
}

export function mountFluency(root, options) {
  const skill = sourceSkill(options.grade, options.sourceId);
  const controller = new AbortController();
  const { signal } = controller;
  const requestedLang = ["en", "es", "bi"].includes(options.lang) ? options.lang : "en";
  const lang = requestedLang === "es" ? "es" : "en";
  const racing = options.stage === "game";
  const resume = options.resume !== false && !racing;
  const tr = (en, es) => lang === "es" ? es : en;
  const pick = (text) => text[lang];
  const level = [1, 2, 3].includes(options.level) ? options.level : 2;
  const chosenSeed = Number(options.seed);
  const seed = Number.isInteger(chosenSeed) && chosenSeed >= 1 && chosenSeed <= maxSeed ? chosenSeed : 1;
  const count = racing ? CALM_PACES[0] : Math.max(1, Math.min(12, Math.trunc(Number(options.count)) || 8));
  const config = { grade: options.grade, sourceId: options.sourceId, level, seed, count, learnerId: options.learnerId };
  let destroyModel = null;
  let itemController;
  let currentSlot;
  let revision = 0;
  let spoke = false;
  const speech = (text, language) => {
    if (speechAvailable()) spoke = speak(text, { lang: language === "es" ? "es-US" : "en-US" });
  };
  const stop = () => { if (spoke) stopSpeech(); spoke = false; };
  const fail = () => root.replaceChildren(h("p", { role: "status" }, tr(
    "This activity could not load. Refresh to try again.",
    "No se pudo cargar esta actividad. Actualiza la página para intentarlo de nuevo.",
  )));
  const cancelItem = () => {
    itemController?.abort();
    destroyModel?.();
    destroyModel = null;
    stop();
  };
  const cleanup = () => {
    controller.abort();
    cancelItem();
    root.replaceChildren();
  };
  if (!skill) {
    fail();
    return cleanup;
  }
  root.lang = lang;
  const body = h("div");
  const saveStatus = h("p", { class: "fine", role: "status" });
  const settings = h("details", {}, h("summary", {}, tr("Shared device", "Dispositivo compartido")));
  const slot = h("select", {}, ...SLOTS.map((n) => h("option", { value: n }, tr(`Learner ${n}`, `Estudiante ${n}`))));
  slot.value = String(activeSlot());
  settings.append(
    h("label", { class: "ml-inline" }, tr("Local learner", "Estudiante en este dispositivo"), slot),
    h("p", { class: "fine" }, tr(
      "Use a different number for each learner. Progress stays under that number on this browser.",
      "Usa un número diferente para cada estudiante. El progreso queda bajo ese número en este navegador.",
    )),
  );
  if (options.stage === "model") {
    root.replaceChildren(body);
    body.append(h("p", { role: "status" }, tr("Loading the example…", "Cargando el ejemplo…")));
    const baseline = practiceProblem(skill, seed, level);
    const example = parallelExample(skill, baseline, seed, level) || practiceProblem(skill, encodeSeed(seed, EXAMPLE_OFFSET), level);
    import("./fluency-model.js").then(({ mountWorkedExample }) => {
      if (signal.aborted) return;
      const model = h("div");
      body.replaceChildren(model);
      destroyModel = mountWorkedExample(model, example, { lang, question: questionIn(example, requestedLang), speak: speech });
      if (options.practiceHref) body.append(h("p", {}, h("a", { class: "btn btn-primary", href: options.practiceHref }, tr("Practice this skill", "Practicar esta destreza"))));
    }).catch(() => { if (!signal.aborted) fail(); });
    return cleanup;
  }

  root.replaceChildren(body, saveStatus);
  if (level === 3 && !hasStretchRange(skill)) root.append(h("p", { class: "fine" }, tr(
    "Challenge keeps the grade-level problems and folds away the hints until you need them.",
    "El desafío mantiene los problemas del grado y deja las pistas ocultas hasta que las necesites.",
  )));
  if (resume && !options.learnerId) root.append(settings);
  async function start(slotId) {
    cancelItem();
    const turn = ++revision;
    body.replaceChildren(h("p", { role: "status" }, tr("Opening practice…", "Abriendo la práctica…")));
    saveStatus.textContent = "";
    let progress;
    try {
      progress = resume
        ? await progressFor(config, slotId)
        : { state: emptyProgress(), persistent: false, save: async () => {} };
    } catch {
      if (turn === revision && !signal.aborted) fail();
      return;
    }
    if (signal.aborted || turn !== revision) return;
    currentSlot = slotId;
    const state = progress.state;
    let playerPosition = 0;
    let round = 0;
    let result = null;
    const track = h("div", { class: "ml-fluency-track" });
    const raceTip = tr(
      `Each correct answer moves you one space. The rival finishes after ${count} turns. There is no clock.`,
      `Cada respuesta correcta te mueve un espacio. El rival llega al final tras ${count} turnos. No hay reloj.`,
    );

    function paintTrack(turn) {
      const meter = (name, value) => h("label", {},
        `${name} · ${value}/${TRACK}`,
        h("progress", { max: TRACK, value }),
      );
      track.replaceChildren(meter(tr("You", "Tú"), playerPosition), meter(tr("Rival", "Rival"), rivalAt(turn, count)));
    }
    if (resume && !progress.persistent) saveStatus.textContent = tr(
      "Progress lasts for this visit. This browser could not save it.",
      "El progreso dura lo que dura esta visita. El navegador no pudo guardarlo.",
    );
    const persist = (write = progress.save(state)) => write.catch(() => {
      if (!signal.aborted && currentSlot === slotId) saveStatus.textContent = tr(
        "This browser could not save the latest change.",
        "El navegador no pudo guardar el último cambio.",
      );
    });

    function next(pass = false) {
      if (!state.correct && !(racing && pass)) return;
      if (racing) {
        playerPosition += Number(state.correct);
        result = winner(playerPosition, rivalAt(state.index + 1, count));
        paintTrack(state.index + 1);
      }
      if (result || state.index + 1 === count) {
        state.finished = true;
      } else {
        state.index += 1;
        state.correct = false;
        state.tries = 0;
        state.helped = false;
      }
      persist();
      draw(true);
    }

    function draw(focus = false) {
      cancelItem();
      itemController = new AbortController();
      const itemSignal = itemController.signal;
      const bind = (node, event, handle) => node.addEventListener(event, handle, { signal: itemSignal });
      if (state.finished) {
        const finished = result === "you" ? tr("You won the race", "Ganaste la carrera")
          : result === "rival" ? tr("The rival won this race", "El rival ganó esta carrera")
          : tr("Practice complete", "Práctica terminada");
        const heading = h("h2", { tabindex: "-1" }, finished);
        const replay = h("button", { class: "btn", type: "button" }, racing
          ? tr("Race again", "Jugar otra carrera")
          : tr("Practice this set again", "Volver a practicar este conjunto"));
        bind(replay, "click", () => {
          const recent = state.recent;
          Object.assign(state, emptyProgress(), { recent });
          playerPosition = 0;
          result = null;
          round += 1;
          persist();
          draw(true);
        });
        body.replaceChildren(heading, racing ? track : h("p", {}, tr(`You checked all ${count} problems.`, `Comprobaste los ${count} problemas.`)), replay);
        if (focus) heading.focus();
        return;
      }

      const itemSeed = encodeSeed(seed, state.index + (racing ? round * count : 0));
      const item = practiceProblem(skill, itemSeed, level);
      const question = questionIn(item, requestedLang);
      const prompt = h("h2", { tabindex: "-1", lang: question.lang, class: "ml-fluency-question" }, question.text);
      const position = h("p", { class: "eyebrow" }, racing
        ? tr(`Turn ${state.index + 1} of ${count}`, `Turno ${state.index + 1} de ${count}`)
        : tr(`Problem ${state.index + 1} of ${count}`, `Problema ${state.index + 1} de ${count}`));
      const feedback = h("p", { class: "ml-fb", role: "status", "aria-live": "polite" });
      const form = h("form", { autocomplete: "off" });
      const translations = requestedLang !== "en" && choicesEs(item);
      const choiceLabels = translations || item.choices;
      const read = h("button", { type: "button", class: "btn small" }, tr("Read aloud", "Leer en voz alta"));
      const answerArea = h("div");
      const response = h("input", { type: "text", name: "fluency-answer", maxlength: 280, required: true, "aria-invalid": "false", spellcheck: "false" });
      const check = h("button", { type: "submit", class: "btn btn-primary" }, tr("Check answer", "Comprobar respuesta"));
      const raceOver = racing && winner(playerPosition + 1, rivalAt(state.index + 1, count));
      const moveOn = h("button", { type: "button", class: "btn btn-primary" },
        raceOver ? tr("Finish race", "Terminar la carrera")
        : state.index + 1 === count ? tr("Finish practice", "Terminar la práctica")
        : tr("Next problem", "Siguiente problema"),
      );
      const pass = h("button", { type: "button", class: "btn small" }, tr("Pass this turn", "Pasar este turno"));
      const hint = h("button", { type: "button", class: "btn small" }, tr("Show a hint", "Ver una pista"));
      const hintText = h("p", { class: "ml-man-sum", role: "status", hidden: true });
      const worked = h("details", {}, h("summary", {}, tr("See a different worked example", "Ver otro ejemplo resuelto")));
      const workedPane = h("div");
      worked.append(workedPane);
      const supportLevel = level === 1 ? 3 : Math.min(level === 3 ? 1 : 3, scaffold(state.recent));
      const helpOptions = h("details", {}, h("summary", {}, tr("Help with this problem", "Ayuda con este problema")));
      const model = skill.grade <= 2 ? earlyPicture(item, tr) : null;
      const words = languageProfile(skill).terms.filter(Boolean);
      const vocab = h("details", {}, h("summary", {}, tr("Math words", "Palabras de matemáticas")),
        h("dl", { class: "ml-words" }, ...words.flatMap((word) => [
          h("dt", {}, requestedLang === "bi" ? `${word.en} · ${word.es}` : word[lang]),
          h("dd", {}, lang === "es" ? word.defEs : word.defEn),
        ])),
      );
      if (FRAME_LEVEL[options.support] === 1) vocab.open = true;
      const more = h("div");
      let attempt = null;
      let workedStarted = false;
      const markHelp = () => {
        if (state.correct || state.helped) return;
        state.helped = true;
        persist();
      };
      const defaultHint = tr(
        "Name what you know and what you need to find. Try the first step.",
        "Nombra lo que sabes y lo que necesitas encontrar. Intenta el primer paso.",
      );
      const hintFor = () => lang === "es" ? defaultHint
        : safeStrategy(item, hintText.hidden && state.tries >= 2 ? item.steps[0] : item.hint) || defaultHint;
      bind(hint, "click", () => {
        markHelp();
        hintText.textContent = hintFor();
        hintText.hidden = false;
        hint.disabled = true;
      });
      bind(worked, "toggle", () => {
        if (!worked.open || workedStarted) return;
        workedStarted = true;
        markHelp();
        const example = parallelExample(skill, item, itemSeed, level);
        if (!example) {
          workedPane.textContent = defaultHint;
          return;
        }
        workedPane.textContent = tr("Loading the example…", "Cargando el ejemplo…");
        import("./fluency-model.js").then(({ mountWorkedExample }) => {
          if (itemSignal.aborted) return;
          destroyModel = mountWorkedExample(workedPane, example, {
            lang, question: questionIn(example, requestedLang), guided: false, speak: speech,
          });
        }).catch(() => {
          if (!itemSignal.aborted) workedPane.textContent = defaultHint;
        });
      });
      if (speechAvailable()) bind(read, "click", () => speech(
        [question.text, choiceLabels?.join(", ")].filter(Boolean).join(". "),
        question.lang,
      ));
      bind(moveOn, "click", () => next());
      if (racing) bind(pass, "click", () => next(true));
      if (choiceLabels) {
        answerArea.append(h("fieldset", {},
          h("legend", {}, tr("Choose an answer", "Elige una respuesta")),
          ...choiceLabels.map((label, i) => h("label", { class: "ml-fluency-choice" },
            h("input", { type: "radio", name: "fluency-answer", value: i, required: true }),
            h("span", { lang: translations ? "es" : "en" }, label),
          )),
        ));
      } else {
        const format = item.kind === "order" ? tr("Separate the values with commas.", "Separa los valores con comas.")
          : item.kind === "inequality" ? tr("Include the variable and the inequality symbol.", "Incluye la variable y el símbolo de desigualdad.")
          : item.kind === "fraction" ? tr("Use a slash to write a fraction.", "Usa una barra para escribir una fracción.")
          : "";
        if (format) answerArea.append(h("p", { class: "fine", id: "ml-fluency-format" }, format));
        if (format) response.setAttribute("aria-describedby", "ml-fluency-format");
        answerArea.append(h("label", {}, tr("Your answer", "Tu respuesta"), item.unit ? ` (${item.unit})` : "", response));
      }
      form.append(answerArea, check);
      bind(form, "input", () => response.setAttribute("aria-invalid", "false"));
      bind(form, "submit", (event) => {
        event.preventDefault();
        if (state.correct) return;
        const raw = new FormData(form).get("fluency-answer");
        const answer = choiceLabels ? item.choices[Number(raw)] : raw;
        if (!String(answer || "").trim()) return;
        const ok = validateAnswer(answer, item);
        const supported = state.helped || state.tries > 0;
        // One independent result per problem. Retries can be kept as supported evidence.
        state.recent = [...state.recent, { kind: "try", ok, supported }].slice(-12);
        state.tries = Math.min(99, state.tries + 1);
        state.correct = ok;
        persist();
        if (ok) {
          showCorrect(true);
          return;
        }
        attempt = lang === "es" ? defaultHint : safeStrategy(item, feedbackFor(skill, item, answer)) || defaultHint;
        showRetry();
        if (!choiceLabels) {
          response.setAttribute("aria-invalid", "true");
          response.focus();
          response.select();
        }
      });

      function showRetry() {
        feedback.className = "ml-fb ml-fb-try";
        feedback.textContent = `${tr("Try again.", "Inténtalo de nuevo.")} ${attempt || hintFor()}`;
        if (state.tries >= 2 && !more.contains(worked)) more.append(worked);
        if (more.contains(helpOptions)) helpOptions.open = true;
      }

      function showCorrect(moveFocus) {
        feedback.className = "ml-fb ml-fb-ok";
        feedback.textContent = tr("Correct.", "Correcto.");
        form.hidden = true;
        more.replaceChildren();
        if (resume && ((state.index + 1) % 3 === 0 || state.index + 1 === count)) {
          const fn = (state.index + 1) % 6 === 0 ? "check" : "explain";
          more.append(explain(fn));
        }
        more.append(moveOn);
        if (moveFocus) moveOn.focus();
      }

      function explain(fn) {
        const box = h("details", {}, h("summary", {}, tr("Explain your thinking", "Explica tu razonamiento")));
        const textarea = h("textarea", { maxlength: 500, rows: 3 });
        const save = h("button", { type: "button", class: "btn small" }, tr("Save explanation on this device", "Guardar la explicación en este dispositivo"));
        const journalStatus = h("p", { class: "fine", role: "status" });
        const frame = framesFor(FRAME_LEVEL[options.support] || 2, fn)[0];
        let opened = false;
        bind(box, "toggle", () => {
          if (!box.open || opened) return;
          opened = true;
          progress.journal().then((entry) => {
            // Restore the saved entry only into an empty box, so words already typed are never replaced.
            if (!itemSignal.aborted && !textarea.value && typeof entry === "string") textarea.value = entry;
          }).catch(() => {});
        });
        bind(save, "click", () => {
          const text = textarea.value;
          if (!text.trim()) return;
          journalStatus.textContent = "";
          progress.saveExplanation(text).then(() => {
            if (itemSignal.aborted) return;
            journalStatus.textContent = progress.persistent
              ? tr("Saved as your latest explanation for this skill.", "Guardada como tu última explicación para esta destreza.")
              : tr("Saved for this visit.", "Guardada para esta visita.");
          }).catch(() => {
            if (!itemSignal.aborted) journalStatus.textContent = tr("Could not save the explanation.", "No se pudo guardar la explicación.");
          });
        });
        box.append(
          h("p", {}, pick(promptFor(fn))),
          frame ? h("p", {}, pick(frame)) : null,
          h("label", {}, tr("Optional explanation", "Explicación opcional"), textarea),
          save, journalStatus,
        );
        return box;
      }

      const tools = h("div", { class: "ml-inline" }, speechAvailable() ? read : null);
      if (racing) paintTrack(state.index);
      body.replaceChildren(...(racing ? [h("p", {}, raceTip), track] : []), position, ...(model ? [model] : []), prompt,
        ...(question.original ? [h("p", { lang: "en" }, question.original)] : []), tools, vocab, form, feedback, more);
      helpOptions.append(hint, hintText);
      more.append(helpOptions);
      if (racing) more.append(pass);
      if (supportLevel >= 2 && level !== 3) helpOptions.open = true;
      if (state.correct) showCorrect(false);
      else if (state.tries) showRetry();
      if (focus) prompt.focus();
    }
    draw();
  }

  slot.addEventListener("change", () => {
    const selected = Number(slot.value);
    selectSlot(selected);
    start(selected);
  }, { signal });
  start(Number(slot.value));
  return cleanup;
}

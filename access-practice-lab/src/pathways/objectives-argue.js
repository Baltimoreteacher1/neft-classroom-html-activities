// Skill graph objectives: the two Argue objectives (data only; graph.js adds the shared fields and validates every reference).
import { P, acc, book, dest, spk, wrt } from "./refs.js";

export const ARGUE = [
  {
    id: "argue-claim-evidence",
    keyUse: "Argue",
    standards: ["ELD-LA", "ELD-SS", "ELD-SC", "ELD-SI"],
    skills: [
      "reading.evidence-selection-strategy",
      "speaking.evidence",
      "speaking.reasoning",
      "writing.evidence",
      "writing.explain-evidence",
    ],
    title: P("Make a claim and support it", "Hacer una afirmación y apoyarla"),
    student: P(
      "I can say what I think and give reasons and evidence for it.",
      "Puedo decir lo que pienso y dar razones y evidencia.",
    ),
    features: {
      discourse: P(
        "State the claim, give a reason, support it with evidence, restate the claim.",
        "Di la afirmación, da una razón, apóyala con evidencia y repite la afirmación.",
      ),
      sentence: P(
        "Tie the reason to the claim with because and the evidence with for example.",
        "Une la razón a la afirmación con because y la evidencia con for example.",
      ),
      word: P(
        "Use claim words: I believe, the evidence shows, therefore.",
        "Usa palabras de afirmación: I believe, the evidence shows, therefore.",
      ),
    },
    activities: [
      acc("6-8", "Reading", "C", "68c-r-street-trees-evidence"),
      acc("6-8", "Reading", "C", "68c-r-garden-cer-sort"),
      acc("3-5", "Reading", "C", "g35-r-c-author-purpose"),
      acc("6-8", "Listening", "C", "68c-l-bee-evidence"),
      acc("3-5", "Listening", "C", "g35-l-c-speaker-purpose"),
      spk("spk-startime-argue"),
      spk("spk-fundraiser-argue"),
      acc("3-5", "Speaking", "C", "g35-s-c-new-playground"),
      wrt("wrt-school-start-paragraph"),
      wrt("wrt-crosswalk-letter"),
      acc("3-5", "Writing", "C", "g35-w-c-argue-uniform"),
      dest("arena", "Speaking"),
      dest("evidence", "Writing"),
      book("persuasive-book"),
    ],
    needs: [
      {
        id: "cite-source",
        sign: P(
          "gives an opinion and a reason but no evidence",
          "da una opinión y una razón pero no evidencia",
        ),
        activity: "devidence",
      },
      {
        id: "find-evidence",
        sign: P(
          "chooses evidence that does not support the claim",
          "elige evidencia que no apoya la afirmación",
        ),
        activity: "r68c-r-garden-cer-sort",
      },
    ],
    transfer: [
      {
        id: "school-change",
        prompt: P(
          "Your school can add one thing: more recess time or a later start. Choose one. State your claim, give a reason, and give one piece of evidence from your own school day.",
          "Tu escuela puede agregar una cosa: más tiempo de recreo o empezar más tarde. Elige una. Di tu afirmación, da una razón y da una evidencia de tu propio día escolar.",
        ),
      },
    ],
    frames: [
      P("I believe ___ because ___.", "Creo que ___ porque ___."),
      P("For example, ___.", "Por ejemplo, ___."),
      P("That is why ___.", "Por eso ___."),
    ],
    talk: [
      P(
        "What is one rule at home you would change? Why?",
        "¿Qué regla de la casa cambiarías? ¿Por qué?",
      ),
      P(
        "Give me one example that shows your idea is a good one.",
        "Dame un ejemplo que muestre que tu idea es buena.",
      ),
      P(
        "I will give a different opinion. Tell me your strongest reason.",
        "Yo doy una opinión diferente. Dime tu razón más fuerte.",
      ),
    ],
    stretch: "wwrt-crosswalk-letter",
  },
  {
    id: "argue-counterclaim",
    keyUse: "Argue",
    standards: ["ELD-LA", "ELD-SS", "ELD-SI"],
    skills: [
      "reading.compare-sources",
      "speaking.reasoning",
      "speaking.cohesion",
      "writing.transitions",
    ],
    title: P("Answer another point of view", "Responder a otro punto de vista"),
    student: P(
      "I can name what someone else thinks and answer it with a reason.",
      "Puedo nombrar lo que piensa otra persona y responder con una razón.",
    ),
    features: {
      discourse: P(
        "State your claim, name the other view fairly, answer it, close.",
        "Di tu afirmación, nombra la otra opinión con respeto, respóndela y cierra.",
      ),
      sentence: P(
        "Hold two views in one sentence with although or however.",
        "Pon dos opiniones en una oración con although o however.",
      ),
      word: P(
        "Use words that show the turn: some people say, however, on the other hand.",
        "Usa palabras que marcan el cambio: some people say, however, on the other hand.",
      ),
    },
    activities: [
      acc("6-8", "Reading", "C", "68c-r-four-day-counterclaim"),
      acc("3-5", "Reading", "C", "g35-r-c-crosswalk"),
      acc("6-8", "Listening", "C", "68c-l-water-station-debate"),
      acc("3-5", "Listening", "C", "g35-l-c-plastic-bottles"),
      acc("6-8", "Speaking", "C", "68c-s-counterclaim-service"),
      spk("spk-lot-discuss"),
      acc("3-5", "Speaking", "C", "g35-s-c-argue-recess"),
      acc("6-8", "Writing", "C", "68c-w-start-time-counterclaim"),
      acc("6-8", "Writing", "B", "write-counterclaim"),
      acc("3-5", "Writing", "C", "g35-w2-c-opinion-buddy"),
      dest("arena", "Speaking"),
      book("evidence-argument"),
    ],
    needs: [
      {
        id: "link-ideas",
        sign: P(
          "states the other view but does not answer it",
          "dice la otra opinión pero no la responde",
        ),
        activity: "darena",
      },
      {
        id: "find-evidence",
        sign: P(
          "has trouble finding the other view in a text",
          "tiene dificultad para encontrar la otra opinión en un texto",
        ),
        activity: "r68c-r-four-day-counterclaim",
      },
    ],
    transfer: [
      {
        id: "homework-view",
        prompt: P(
          "Some people say students should have no homework. Say what you think, name the other view, and answer it with a reason.",
          "Algunas personas dicen que los estudiantes no deberían tener tarea. Di lo que piensas, nombra la otra opinión y respóndela con una razón.",
        ),
      },
    ],
    frames: [
      P("Some people say ___.", "Algunas personas dicen que ___."),
      P("However, ___ because ___.", "Sin embargo, ___ porque ___."),
    ],
    talk: [
      P(
        "Tell me something we do not agree on. What do I think? What do you think?",
        "Dime algo en lo que no estamos de acuerdo. ¿Qué pienso yo? ¿Qué piensas tú?",
      ),
      P(
        "Say my idea in your own words before you answer it.",
        "Di mi idea con tus palabras antes de responder.",
      ),
      P("What reason might change my mind?", "¿Qué razón podría hacerme cambiar de opinión?"),
    ],
    stretch: "r68c-w-start-time-counterclaim",
  },
];

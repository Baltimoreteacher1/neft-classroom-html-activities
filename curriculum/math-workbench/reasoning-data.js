(function (root) {
  "use strict";

  const SKILLS = {
    ratio: {
      label: "Ratios & rates",
      standard: "6.RP.A.1–3",
      reps: ["ratio table", "double number line", "equation", "words"],
      concepts: ["for every", "per", "each", "scale"],
      signal: "The multiplicative relationship is not explicit yet.",
      move: "Name what one quantity is for every one of the other quantity.",
    },
    percent: {
      label: "Percents",
      standard: "6.RP.A.3c",
      reps: ["hundred model", "ratio table", "equation", "words"],
      concepts: ["per hundred", "100", "whole", "part"],
      signal: "The connection among the part, whole, and 100 is not explicit yet.",
      move: "Explain what the whole represents and how the part compares with 100.",
    },
    fraction: {
      label: "Fraction division",
      standard: "6.NS.A.1",
      reps: ["fraction model", "number line", "equation", "words"],
      concepts: ["groups", "fit", "size", "each"],
      signal: "The meaning of division is not visible yet.",
      move: "Say whether you are finding a number of groups or the size of each group.",
    },
    equation: {
      label: "Equations",
      standard: "6.EE.B.5–7",
      reps: ["balance model", "tape diagram", "equation", "words"],
      concepts: ["both sides", "equal", "inverse", "balance"],
      signal: "The equality relationship is not justified yet.",
      move: "Explain why the same move preserves equality on both sides.",
    },
    area: {
      label: "Area",
      standard: "6.G.A.1",
      reps: ["shape model", "array", "equation", "words"],
      concepts: ["base", "height", "square units", "half"],
      signal: "The measurements are not yet connected to the area model.",
      move: "Connect each number in the equation to a labeled part of the shape.",
    },
    statistics: {
      label: "Statistics",
      standard: "6.SP.A–B",
      reps: ["data display", "table", "calculation", "claim"],
      concepts: ["data", "typical", "spread", "outlier"],
      signal: "The statistical claim does not cite evidence from the data yet.",
      move: "Name one feature of the distribution that supports your claim.",
    },
  };

  const STEMS = {
    en: {
      1: "My model shows ____. I used ____ because ____.",
      2: "First I ____. Then I ____ because ____.",
      3: "The ____ and ____ representations match because ____.",
      4: "My claim is ____. Evidence from ____ shows ____; therefore ____.",
    },
    es: {
      1: "Mi modelo muestra ____. Usé ____ porque ____.",
      2: "Primero ____. Después ____ porque ____.",
      3: "Las representaciones ____ y ____ coinciden porque ____.",
      4: "Mi afirmación es ____. La evidencia de ____ muestra ____; por lo tanto ____.",
    },
  };

  const TEXT = {
    en: {
      title: "Reasoning Studio",
      subtitle: "Model · connect · explain · revise",
      privacy: "Your words stay on this device unless you choose to export them.",
      provisional: "This is a provisional learning signal, not a grade or a label.",
    },
    es: {
      title: "Estudio de razonamiento",
      subtitle: "Modela · conecta · explica · revisa",
      privacy: "Tus palabras permanecen en este dispositivo a menos que decidas exportarlas.",
      provisional: "Esta es una señal provisional de aprendizaje, no una nota ni una etiqueta.",
    },
  };

  function words(value) {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function includesAny(value, terms) {
    const normalized = String(value || "").toLowerCase();
    return terms.some((term) => normalized.includes(term));
  }

  function analyze(input) {
    const skill = SKILLS[input.skill] || SKILLS.ratio;
    const response = String(input.response || "").trim();
    const responseWords = words(response);
    const snapshot = input.snapshot || {};
    const selected = Array.isArray(input.representations) ? input.representations : [];
    const modelEvidence = Number(snapshot.modelCount || 0) + selected.length;
    const causal = includesAny(response, ["because", "so that", "therefore", "since", "porque"]);
    const concept = includesAny(response, skill.concepts);
    const units = includesAny(response, ["unit", "dollar", "mile", "cup", "%", "square", "unidad"]);

    if (responseWords.length < 7) {
      return {
        status: "reasoning-not-yet-visible",
        signal: "There is not enough written reasoning yet to follow the mathematical decision.",
        evidence: `${responseWords.length} words are visible.`,
        nextMove: "Write what you did first and why that move fits the problem.",
        confidence: 0.92,
      };
    }
    if (modelEvidence < 2) {
      return {
        status: "representation-connection-needed",
        signal: "Only one representation is visible, so the connection between ideas cannot be checked yet.",
        evidence: `${modelEvidence} representation signal is visible.`,
        nextMove: "Add a second representation and write one sentence explaining how the two match.",
        confidence: 0.84,
      };
    }
    if (!concept) {
      return {
        status: "concept-link-needed",
        signal: skill.signal,
        evidence: `The response does not yet use a relationship phrase such as ${skill.concepts.slice(0, 2).join(" or ")}.`,
        nextMove: skill.move,
        confidence: 0.72,
      };
    }
    if (!causal) {
      return {
        status: "justification-link-needed",
        signal: "The steps are present, but the reason connecting them is not explicit yet.",
        evidence: "No causal connector such as because, since, or therefore is visible.",
        nextMove: "Join one step to its reason with because, since, or therefore.",
        confidence: 0.78,
      };
    }
    if (!units && input.expectUnits) {
      return {
        status: "unit-meaning-needed",
        signal: "The quantities are present, but what they measure is not explicit yet.",
        evidence: "No unit or quantity label is visible in the explanation.",
        nextMove: "Add the unit and explain what the final quantity means in this situation.",
        confidence: 0.7,
      };
    }
    return {
      status: "connected-reasoning-visible",
      signal: "The available evidence shows a model, a relationship, and a stated reason.",
      evidence: `${modelEvidence} representation signals and ${responseWords.length} words are visible.`,
      nextMove: "Test the explanation with a new case or compare it with a different strategy.",
      confidence: 0.68,
    };
  }

  root.MWReasoningData = Object.freeze({ SKILLS, STEMS, TEXT, analyze });
})(window);

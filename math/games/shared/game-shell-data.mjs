/**
 * Shared game-shell copy and answer checks.
 * Student-facing miss lines name a possible misunderstanding and do not print
 * the worked value. The check functions call the existing publisher models.
 */
import {
  applyBothSides,
  connectedRatio,
  equationSolution,
  isExponentProductBug,
  repairExponent,
} from "../../../engine/core/publisher-models.js";

export const SHELL_KEY = "ewl-game-shell-v1";

/** Playable cabinets. Directories that are not a student game stay out of this table. */
export const GAME_SHELL = {
  "u1-decimal-dash": {
    objective: "Place each decimal on its exact mark on the number line.",
    tutorial: "Start at a labeled mark and count the tenths or hundredths to the target.",
    keys: "Arrow keys move a marker. 1, 2, or 3 picks a marker. Enter locks the answer.",
    miss: "That placement may indicate the marks were counted as the wrong size. Count the spaces between two labels, then move the marker. One try does not show the step you used.",
  },
  "u1-factor-frenzy": {
    objective: "Build a factor pair or a factor tree for the number on the screen.",
    tutorial: "Type one factor that divides the number evenly, then check.",
    keys: "Tab to the factor box, type a number, and press Enter to check.",
    miss: "That factor may indicate a number that does not divide the target. Try a factor that leaves no remainder. This does not show the method you used.",
  },
  "u2-fraction-frenzy": {
    objective: "Shade the fraction the prompt names.",
    tutorial: "Set the number of equal parts first, then shade the numerator.",
    keys: "Left and right change the parts. Up and down change the shading. Enter locks in.",
    miss: "That shading may indicate the numerator and the denominator were swapped. The bottom number is the equal parts. This one answer does not show your reasoning.",
  },
  "u3-ratio-rush": {
    objective: "Build a ratio equivalent to the pair on the screen.",
    tutorial: "Multiply or divide both numbers by the same factor.",
    keys: "Up and down choose a line. Left and right move along it. Enter locks in.",
    miss: "That pair may indicate only one part of the ratio was changed. Multiply or divide both numbers by the same factor. This does not show which factor you used.",
  },
  "u4-percent-power": {
    objective: "Find the percent of a number, or the number a percent describes.",
    tutorial: "Move by 5 percent, then lock in and read the bar.",
    keys: "Left and right change the percent. Enter locks in.",
    miss: "That percent may indicate the part and the whole were swapped. The percent is the part out of 100. This one answer does not show the step you used.",
  },
  "u5-area-attack": {
    objective: "Build a figure with the area the prompt asks for.",
    tutorial: "Set one corner, then count the square units inside the figure.",
    keys: "Arrow keys move. F sets a corner. U undoes. Enter locks in.",
    miss: "That area may indicate the side lengths were added instead of multiplied. Count the square units inside. This does not show the method you used.",
  },
  "u6-expression-express": {
    objective: "Build an expression that matches the value, including exponents.",
    tutorial: "Place one tile, then check the value before you add the next tile.",
    keys: "Left and right change slots. Up and down change tiles. Enter locks in.",
    miss: "That value may indicate the exponent was used as a factor. A power means the base multiplied by itself. One answer does not show the step you used.",
  },
  "u6-power-up-arcade": {
    objective: "Evaluate a numerical expression, doing exponents before multiplying.",
    tutorial: "Tap the operation that the order of operations says to do first.",
    keys: "Tab to an operation and press Enter. Arrow keys move between choices.",
    miss: "That step may indicate the exponent was multiplied by the base. A power means the base multiplied by itself. One answer does not show the step you used.",
  },
  "u7-equation-quest": {
    objective: "Solve the equation by keeping both sides equal.",
    tutorial: "Choose one operation and apply that same operation to both sides.",
    keys: "Up and down choose the operation. Left and right change the amount. Space applies it. Enter checks.",
    miss: "That step may indicate the operation was done on only one side. The same move has to happen on both sides, so the solution stays the same. This does not show your full method.",
  },
  "u8-data-dash": {
    objective: "Build the data display the question describes.",
    tutorial: "Add or remove one dot, then read the center or the spread again.",
    keys: "Left and right change the column. Up adds a dot. Down removes a dot. Enter locks in.",
    miss: "That display may indicate a dot was counted in the wrong column. Check the scale, then try one column again. This does not show how you counted.",
  },
  "u9-coordinate-quest": {
    objective: "Plot or read an ordered pair on the coordinate plane.",
    tutorial: "Move across the x-axis first, then up or down the y-axis.",
    keys: "Arrow keys move the point. 1 through 4 pick a written answer. Enter locks in.",
    miss: "That point may indicate the coordinates were reversed. The first number moves across, and the second moves up or down. This does not show the order you used.",
  },
  "u10-volume-blast": {
    objective: "Find a volume, or the missing dimension, for a rectangular prism.",
    tutorial: "Multiply the three edge lengths, or divide the volume by the two edges you know.",
    keys: "Left and right choose a dimension. Up and down change it by 1. Enter locks in.",
    miss: "That volume may indicate the three edges were added. Volume multiplies length, width, and height. This one answer does not show the step you used.",
  },
  "placement-quest": {
    objective: "Answer one question from each Grade 6 topic you have studied.",
    tutorial: "Read the question, choose an answer, and use the feedback before the next topic.",
    keys: "Tab to an answer and press Enter. Arrow keys move between choices.",
    miss: "That choice may indicate a different operation than the question asked. Read the question once more and try another choice. This does not show your reasoning.",
  },
  "practice-arcade": {
    objective: "Practice the skill from the lesson you opened, at your own pace.",
    tutorial: "Read the prompt, make one move, then press Check.",
    keys: "Tab reaches every control. Arrow keys move a point or a tile. Enter checks.",
    miss: "That answer may indicate a different operation than the prompt asked. Use the hint, then try again. This one answer does not show the step you used.",
  },
};

const GENERIC = /^(not quite|try again|not yet|wrong|casi|incorrect)\b/i;

export function gameIdFromPath(pathname) {
  const match = String(pathname || "").match(/\/math\/games\/([^/]+)/);
  return match ? match[1] : "";
}

export function shellCopy(id) {
  return GAME_SHELL[id] || null;
}

/** Keep a specific game message. Replace a short generic miss with the shell line. */
export function studentFacingMiss(id, message) {
  const text = String(message || "").trim();
  const spec = GAME_SHELL[id];
  if (!spec) return text;
  if (!text || (GENERIC.test(text) && text.length < 90)) return spec.miss;
  return text;
}

export function shellProgress(prev, event) {
  const row = {
    schema_version: 1,
    id: event.id,
    solved: Number(prev?.solved) || 0,
    misses: Number(prev?.misses) || 0,
    attempts: Number(prev?.attempts) || 0,
    lastMessage: prev?.lastMessage || "",
  };
  const message = String(event.message || "");
  if (!message || message === row.lastMessage) return row;
  row.lastMessage = message;
  row.attempts += 1;
  if (event.correct) row.solved += 1;
  else row.misses += 1;
  return row;
}

/**
 * A real check for a move a cabinet already collected.
 * Returns ok, and a student line that does not print a worked value on a miss.
 */
export function checkGameMove(id, move) {
  if (id === "u6-power-up-arcade" || id === "u6-expression-express") {
    const repair = repairExponent(move);
    return {
      ok: repair.correct,
      bug: repair.bug,
      studentMessage: repair.correct
        ? "The power matches the repeated factors."
        : studentFacingMiss(id, "Not quite"),
    };
  }
  if (id === "u3-ratio-rush") {
    const model = connectedRatio(move.a, move.b, move.factor);
    const ok = Number(move.x) === model.table.row[0] && Number(move.y) === model.table.row[1];
    const added = Number(move.x) === Number(move.a) + Number(move.factor);
    return {
      ok,
      bug: added && !ok,
      studentMessage: ok
        ? "Both parts of the ratio used the same factor."
        : studentFacingMiss(id, added ? "Not quite" : "Not quite"),
    };
  }
  if (id === "u7-equation-quest") {
    const { p, q, r } = move.equation;
    const solution = equationSolution(p, q, r);
    const next = applyBothSides(move.equation, move.op);
    const still = equationSolution(next.p, next.q, next.r);
    const ok = still === solution && Number(move.claimed) === solution;
    return {
      ok,
      bug: still !== solution,
      studentMessage: ok
        ? "The same operation kept both sides equal."
        : studentFacingMiss(id, "Not quite"),
    };
  }
  return { ok: false, bug: false, studentMessage: studentFacingMiss(id, move?.message || "Not quite") };
}

export function exponentBugIsProduct(base, exponent, answer) {
  return isExponentProductBug(base, exponent, answer);
}

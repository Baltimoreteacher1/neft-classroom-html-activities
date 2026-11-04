// A pure "oracle solver" for Build tasks: it proposes learner input from the pack's own data and keeps only an
// input the real engine accepts, so the browser run types what a student could type (not a stored answer).

import * as C from "../../access-practice-lab/src/journey/engines/construct.js";
import { CONNECTORS } from "../../access-practice-lab/src/lang/lexicon.js";

const strip = (s) => s.replace(/[.!?]+$/, "");
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function connectorWords(job, task) {
  const alt = (task.altConnectors || []).map((a) => a.word);
  return [...new Set([...alt, ...(CONNECTORS[job] || [])])];
}

function expandCandidates(t) {
  const out = [];
  const jobs = t.needs.filter((n) => n.test.connectorJob);
  const termNeeds = t.needs.filter((n) => n.test.terms);
  const words = jobs.length ? connectorWords(jobs[0].test.connectorJob, t) : [""];
  const terms = termNeeds.map((n) => n.test.terms.filter((x) => /^[a-z]/i.test(x)));
  for (const w of words) {
    for (let a = 0; a < Math.min(terms[0]?.length || 1, 4); a++)
      for (let b = 0; b < Math.min(terms[1]?.length || 1, 4); b++) {
        const t0 = terms[0]?.[a] || "";
        const t1 = terms[1]?.[b] || "";
        const base = strip(t.base);
        out.push(`${base} ${t0} ${w} the ${t1}.`);
        out.push(`${w[0]?.toUpperCase() || ""}${w.slice(1)} the ${t1}, ${lower1(base)} ${t0}.`);
        out.push(
          `${base} ${t0}. ${w[0]?.toUpperCase() || ""}${w.slice(1)}, the ${t1} was important.`,
        );
      }
  }
  return out.map((s) => s.replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1"));
}

function combineCandidates(t) {
  const [a, b] = t.pair.map(strip);
  const words = connectorWords(t.relation, t);
  const out = [];
  for (const w of words.slice(0, 10)) {
    out.push(`${b} ${w} ${lower1(a)}.`, `${a} ${w} ${lower1(b)}.`, `${a}, ${w} ${lower1(b)}.`);
    out.push(`${w[0].toUpperCase()}${w.slice(1)} ${lower1(a)}, ${lower1(b)}.`);
  }
  return out;
}

/** The input a learner types/selects for a task (or its transfer item); throws when no input is accepted. */
export function solve(task, transfer = false) {
  const t = C.resolveTask(task, transfer);
  switch (t.module) {
    case "expand":
    case "combine": {
      const cands = t.module === "expand" ? expandCandidates(t) : combineCandidates(t);
      for (const text of cands)
        if (C.evaluate(task, { text }, { transfer }).accepted) return { text };
      throw new Error(`no accepted sentence found for ${t.module} "${t.base || t.pair?.[0]}"`);
    }
    case "connector":
      return { answers: t.gaps.map((g) => [g.ok].flat()[0]) };
    case "pronoun":
      return { answers: t.pronouns.map((p) => [p.ok].flat()[0]) };
    case "discourse":
      return { order: t.order, connectors: (t.connectors || []).map((c) => c.word) };
    case "morphology":
      return { words: t.words };
    default:
      throw new Error(`unknown module ${t.module}`);
  }
}

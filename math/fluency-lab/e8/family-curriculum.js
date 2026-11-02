// Family Math curriculum (Phase 6E): a year of short, no-materials talk routines for each grade, one per standard cluster,
// each with a home move, a question that never gives the answer away, and two talk problems taken from the authored bank.
import { ASK_ANYTIME, ASK_BY_DOMAIN, HOME_ACTIVITIES } from "./family-studio.js";

const DOMAIN_OF = {
  CC: "number", NBT: "number", OA: "operations", NF: "fractions", MD: "measurement", G: "geometry", RP: "ratio", NS: "number", EE: "algebra", SP: "data", F: "algebra",
};
const bi = (en, es) => ({ en, es });

export function familyCurriculum(grade, standards, bank) {
  const clusters = new Map();
  for (const s of standards.filter((x) => x.grade === Number(grade)))
    (clusters.get(`${s.domain}.${s.cluster}`) || clusters.set(`${s.domain}.${s.cluster}`, []).get(`${s.domain}.${s.cluster}`)).push(s);
  return [...clusters.entries()].map(([id, list], i) => {
    const domain = DOMAIN_OF[list[0].domain] || "number";
    const items = bank.filter((it) => it.grade === Number(grade) && it.cluster === list[0].cluster && it.domain === list[0].domain && it.dok <= 2 && ["mc", "numeric", "application", "fraction"].includes(it.type)).slice(0, 2);
    return {
      week: i + 1,
      cluster: id,
      standards: list.map((s) => s.code),
      // The standards table is English only; the page shows it as written and does not invent a translation.
      focus: { en: list[0].text, es: null },
      home: HOME_ACTIVITIES[domain],
      ask: [ASK_ANYTIME[i % ASK_ANYTIME.length], ASK_BY_DOMAIN[domain]],
      talkProblems: items.map((it) => ({ id: it.id, stem: it.stem })),
    };
  });
}

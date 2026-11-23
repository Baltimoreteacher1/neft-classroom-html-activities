// Scaffolds: what changes (access to language) and what never changes (the learning target and the task).
// Pure logic first, then the Scaffold Slider component: one slider per language domain, not one linear slider.
import { supportFor } from "../engines/engine-core.js";
import { announce, h } from "./dom.js";
import { DOMAINS, TIERS, TIER_IDS } from "../data/taxonomy.js";

/** The parts of support that move with a tier. domain: which language domain's tier drives it ("out" = the output domain). */
export const FACETS = [
  { id: "visual", label: "Visual references", domain: "Reading" },
  { id: "vocab", label: "Vocabulary access", domain: "Reading" },
  { id: "directions", label: "Instructions", domain: "Listening" },
  { id: "frames", label: "Sentence frames", domain: "out" },
  { id: "example", label: "Examples and models", domain: "Reading" },
  { id: "structure", label: "Guided structure", domain: "out" },
  { id: "oral", label: "Oral rehearsal", domain: "Speaking" },
  { id: "independence", label: "Independence expected", domain: "out" },
];

const LEVEL_TEXT = {
  ee: {
    visual: "a picture or diagram for every key idea",
    vocab: "a word bank with pictures or home-language help; key words taught first",
    directions: "short steps, read aloud, one at a time",
    frames: "full sentence frames with a word bank",
    example: "a complete worked example to follow",
    structure: "the task split into small steps with hints ready",
    oral: "say it with a partner, in any language, before writing",
    independence: "works with a partner or checks with the teacher at each step",
  },
  dev: {
    visual: "a diagram on the page; the student adds labels",
    vocab: "a word bank of the key terms",
    directions: "steps listed and read aloud on request",
    frames: "frames with part of the sentence started",
    example: "a model with one step left for the student",
    structure: "hints available on request",
    oral: "rehearse one sentence with a partner",
    independence: "checks in after the first item",
  },
  exp: {
    visual: "a diagram on request",
    vocab: "key terms listed; the student chooses which to use",
    directions: "written directions",
    frames: "sentence starters only",
    example: "a short model to look back at",
    structure: "a self-check list",
    oral: "optional rehearsal",
    independence: "works alone and checks at the end",
  },
  br: {
    visual: "the student makes their own visual",
    vocab: "a glossary is available if wanted",
    directions: "written directions; the student plans the steps",
    frames: "no frames; the student chooses the structure",
    example: "the student gives their own example",
    structure: "the student plans their own steps",
    oral: "the student explains to a partner afterward",
    independence: "works independently and checks against the success criteria",
  },
};

const TIER = Object.fromEntries(TIERS.map((t) => [t.id, t]));
export const STAYS_SAME = [
  "The learning target",
  "The question students answer",
  "The correct answer and the thinking it takes to reach it",
];

export function describeTier(tier) {
  const t = TIER[tier];
  if (!t) return null;
  return {
    id: tier,
    label: t.label,
    short: t.short,
    levels: t.levels,
    facets: LEVEL_TEXT[tier],
    summary: `${t.label} (${t.levels}): ${LEVEL_TEXT[tier].frames}, ${LEVEL_TEXT[tier].visual}, ${LEVEL_TEXT[tier].independence}.`,
  };
}

/** perDomainTiers may be one tier id, or { Listening, Speaking, Reading, Writing } with any missing domain set to Developing. */
export function resolveTiers(per) {
  const out = {};
  for (const d of DOMAINS) {
    const v = typeof per === "string" ? per : per?.[d];
    out[d] = TIER_IDS.includes(v) ? v : "dev";
  }
  return out;
}

const outputDomain = (item) => {
  if (item?.output === "speak") return "Speaking";
  if (item?.output === "write") return "Writing";
  const d = item?.domains || [];
  return d.includes("Writing") ? "Writing" : d.includes("Speaking") ? "Speaking" : "Writing";
};

const contentFor = (id, s) => {
  switch (id) {
    case "visual":
      return s.visual ? { count: 1, alt: s.visual.alt || "" } : { count: 0 };
    case "vocab":
      return { count: (s.wordBank || []).length, items: s.wordBank || [] };
    case "directions":
      return { count: s.directions ? 1 : 0, text: s.directions || "" };
    case "frames":
      return { count: (s.frames || []).length, items: s.frames || [] };
    case "structure":
      return { count: s.hint ? 1 : 0, text: s.hint || "" };
    case "oral":
      return { count: s.oral ? 1 : 0, text: s.oral || "" };
    default:
      return { count: 0 };
  }
};

/**
 * scaffoldFor(item, perDomainTiers): the supports one item shows, each driven by the tier of the domain it relies on.
 * item: a guided/independent item { prompt, answer, supports:{ee,dev,exp,br}, output?, domains? }.
 */
export function scaffoldFor(item, perDomainTiers = {}) {
  const tiers = resolveTiers(perDomainTiers);
  const out = outputDomain(item);
  const facets = FACETS.map((f) => {
    const domain = f.domain === "out" ? out : f.domain;
    const tier = tiers[domain];
    const s = supportFor(item, tier);
    return {
      id: f.id,
      label: f.label,
      domain,
      tier,
      tierLabel: TIER[tier].short,
      level: LEVEL_TEXT[tier][f.id],
      content: contentFor(f.id, s),
      support: s,
    };
  });
  return {
    tiers,
    outputDomain: out,
    target: { prompt: item?.prompt || "", stays: STAYS_SAME },
    facets,
    byId: Object.fromEntries(facets.map((f) => [f.id, f])),
  };
}

const countText = (f) => {
  const n = f.content.count;
  const noun = { vocab: "word", frames: "frame" }[f.id];
  if (noun && (n || f.id === "vocab")) return `${n} ${noun}${n === 1 ? "" : "s"}`;
  return "";
};

/** Plain-language difference between two scaffoldFor results: what changed, and what stayed the same. */
export function diffScaffold(a, b) {
  const changed = [];
  const same = [...STAYS_SAME];
  for (const fb of b.facets) {
    const fa = a.facets.find((f) => f.id === fb.id);
    const contentMoved = JSON.stringify(fa.content) !== JSON.stringify(fb.content);
    if (fa.tier === fb.tier && !contentMoved) {
      same.push(`${fb.label} (${fb.tierLabel})`);
      continue;
    }
    const counts = [countText(fa), countText(fb)].filter(Boolean);
    const detail =
      counts.length === 2 && counts[0] !== counts[1] ? ` (${counts[0]} became ${counts[1]})` : "";
    const fromTo =
      fa.tier === fb.tier ? `now shows ${fb.level}` : `moves from ${fa.level} to ${fb.level}`;
    changed.push({
      id: fb.id,
      label: fb.label,
      from: fa.tierLabel,
      to: fb.tierLabel,
      text: `${fb.label}: ${fromTo}${detail}.`,
    });
  }
  return { changed, same };
}

/**
 * recommendTiersFromClass(classProfile): a starting point from class counts (see core/classes.js). Never about any student.
 * Returns { perDomain, primary, alsoPrepare, rationale }. The teacher decides.
 */
export function recommendTiersFromClass(profile = {}) {
  const counts = Object.fromEntries(
    TIER_IDS.map((t) => [t, Math.max(0, Number(profile.proficiency?.[t]) || 0)]),
  );
  const total = TIER_IDS.reduce((n, t) => n + counts[t], 0);
  const percent = profile.proficiencyMode === "percent";
  if (!total) {
    return {
      perDomain: resolveTiers(
        profile.domainTiers &&
          Object.fromEntries(
            Object.entries(profile.domainTiers).filter(([, v]) => TIER_IDS.includes(v)),
          ),
      ),
      primary: "dev",
      alsoPrepare: [],
      rationale:
        "This class has no support-level counts yet, so the slider starts at Developing. Add counts on the class page, or set each domain yourself.",
    };
  }
  const primary = TIER_IDS.reduce((best, t) => (counts[t] > counts[best] ? t : best), TIER_IDS[0]);
  const alsoPrepare = TIER_IDS.filter((t) => t !== primary && counts[t] / total >= 0.2);
  const perDomain = {};
  for (const d of DOMAINS)
    perDomain[d] = TIER_IDS.includes(profile.domainTiers?.[d]) ? profile.domainTiers[d] : primary;
  const share = (t) => (percent ? `${counts[t]}%` : `${counts[t]} of ${total}`);
  const also = alsoPrepare.length
    ? ` Also prepare ${alsoPrepare.map((t) => TIER[t].short).join(" and ")} materials (${alsoPrepare.map(share).join(", ")}).`
    : "";
  return {
    perDomain,
    primary,
    alsoPrepare,
    rationale: `Most of the class is at ${TIER[primary].label} (${share(primary)}), so that is the starting point. Set a domain yourself on the class page if it differs.${also}`,
  };
}

const independent = (a) => {
  const items = a?.items || [];
  return (
    items.length >= 3 &&
    items.filter((i) => i.ok && i.tries === 1 && !i.hints).length / items.length >= 0.8
  );
};

/**
 * fadeSuggestion(attempts, { tier }): suggests lighter support only when at least 3 attempts at that tier were independent.
 * It only suggests. The teacher decides. Attempts are anonymous evidence records (core/evidence.js).
 */
export function fadeSuggestion(attempts = [], { tier } = {}) {
  const list = (attempts || []).filter((a) => a && TIER_IDS.includes(a.tier));
  const counts = Object.fromEntries(
    TIER_IDS.map((t) => [t, list.filter((a) => a.tier === t).length]),
  );
  const at =
    tier && TIER_IDS.includes(tier)
      ? tier
      : TIER_IDS.reduce((best, t) => (counts[t] > counts[best] ? t : best), TIER_IDS[0]);
  const atTier = list.filter((a) => a.tier === at);
  const k = atTier.filter(independent).length;
  const base = { tier: at, n: atTier.length, independent: k, teacherDecides: true };
  if (at === "br")
    return { ...base, action: "keep", text: "This is already the lightest support level." };
  if (atTier.length < 3)
    return {
      ...base,
      action: "keep",
      text: `Only ${atTier.length} attempt${atTier.length === 1 ? "" : "s"} at ${TIER[at].short} so far. Three are needed before a suggestion is shown.`,
    };
  if (k >= 3 && k / atTier.length >= 0.7) {
    const to = TIER_IDS[TIER_IDS.indexOf(at) + 1];
    return {
      ...base,
      action: "lighten",
      from: at,
      to,
      text: `In ${k} of ${atTier.length} attempts at ${TIER[at].short}, students answered nearly every item correctly on the first try without a hint. You could try ${TIER[to].short} supports next. This is a suggestion; you decide.`,
    };
  }
  return {
    ...base,
    action: "keep",
    text: `${k} of ${atTier.length} attempts at ${TIER[at].short} were fully independent. Keep the current supports for now.`,
  };
}

const DOMAIN_VAR = {
  Listening: "--listening",
  Speaking: "--speaking",
  Reading: "--reading",
  Writing: "--writing",
};
let sliderCount = 0;

/**
 * scaffoldSlider({ domains, tiers, item, target, onChange, recommend })
 * One slider per domain. The learning target banner stays visible and unchanged. Returns { el, getTiers, setTiers, setItem }.
 */
export function scaffoldSlider({
  domains = DOMAINS,
  tiers,
  item = null,
  target = "",
  onChange,
  recommend = null,
} = {}) {
  const uid = `st-sl${++sliderCount}`;
  let state = resolveTiers(tiers);
  let current = item;
  const inputs = new Map();
  const outputs = new Map();
  const diffBox = h("div", { class: "st-ll-diff" });
  const live = h("div", { class: "st-sr-only", role: "status", "aria-live": "polite" });
  const snapshot = () => (current ? scaffoldFor(current, state) : null);
  let before = snapshot();

  const renderDiff = (prev, next) => {
    diffBox.replaceChildren();
    if (!next) {
      diffBox.append(
        h(
          "p",
          { class: "st-ll-muted" },
          "Pick an item to see exactly what each support level shows.",
        ),
      );
      return;
    }
    if (!prev || prev === next) {
      diffBox.append(
        h("h4", {}, "What students see now"),
        h(
          "ul",
          { class: "st-ll-list" },
          next.facets.map((f) =>
            h("li", {}, h("strong", {}, `${f.label} (${f.tierLabel}): `), f.level),
          ),
        ),
      );
      return;
    }
    const d = diffScaffold(prev, next);
    diffBox.append(
      h(
        "div",
        { class: "st-ll-diff-cols" },
        h(
          "div",
          {},
          h("h4", {}, "What changed"),
          d.changed.length
            ? h(
                "ul",
                { class: "st-ll-list" },
                d.changed.map((c) => h("li", {}, c.text)),
              )
            : h("p", { class: "st-ll-muted" }, "Nothing changed with that move."),
        ),
        h(
          "div",
          {},
          h("h4", {}, "What stayed the same"),
          h(
            "ul",
            { class: "st-ll-list" },
            d.same.map((s) => h("li", {}, s)),
          ),
        ),
      ),
    );
  };

  const update = (domain, value, announceIt) => {
    const prev = snapshot();
    state = { ...state, [domain]: TIER_IDS[value] };
    outputs.get(domain).textContent = TIER[state[domain]].short;
    inputs.get(domain).setAttribute("aria-valuetext", TIER[state[domain]].label);
    const next = snapshot();
    renderDiff(prev, next);
    before = next;
    if (announceIt) {
      live.textContent = `${domain}: ${TIER[state[domain]].label}. Learning target unchanged.`;
      announce(live.textContent);
    }
    onChange?.({ ...state }, { domain, next, prev });
  };

  const rows = domains.map((d) => {
    const id = `${uid}-${d}`;
    const input = h("input", {
      type: "range",
      id,
      min: "0",
      max: "3",
      step: "1",
      value: String(TIER_IDS.indexOf(state[d])),
      "aria-valuetext": TIER[state[d]].label,
      class: "st-ll-range",
    });
    const out = h("output", { for: id, class: "st-ll-sl-out" }, TIER[state[d]].short);
    input.addEventListener("input", () => update(d, Number(input.value), false));
    input.addEventListener("change", () => update(d, Number(input.value), true));
    inputs.set(d, input);
    outputs.set(d, out);
    return h(
      "div",
      { class: "st-ll-sl-row", style: `--dom:var(${DOMAIN_VAR[d] || "--brand"})` },
      h("label", { for: id }, d),
      h(
        "div",
        { class: "st-ll-sl-track" },
        input,
        h(
          "div",
          { class: "st-ll-ticks", "aria-hidden": "true" },
          TIERS.map((t) => h("span", {}, t.short)),
        ),
      ),
      out,
    );
  });

  const setAll = (tier) => {
    for (const d of domains) {
      inputs.get(d).value = String(TIER_IDS.indexOf(tier));
      outputs.get(d).textContent = TIER[tier].short;
      inputs.get(d).setAttribute("aria-valuetext", TIER[tier].label);
    }
    const prev = snapshot();
    state = { ...state, ...Object.fromEntries(domains.map((d) => [d, tier])) };
    const next = snapshot();
    renderDiff(prev, next);
    announce(`All domains set to ${TIER[tier].label}. Learning target unchanged.`);
    onChange?.({ ...state }, { domain: "all", next, prev });
  };

  const setTiers = (per) => {
    const t = resolveTiers(per);
    const prev = snapshot();
    state = t;
    for (const d of domains) {
      inputs.get(d).value = String(TIER_IDS.indexOf(t[d]));
      outputs.get(d).textContent = TIER[t[d]].short;
      inputs.get(d).setAttribute("aria-valuetext", TIER[t[d]].label);
    }
    renderDiff(prev, snapshot());
    onChange?.({ ...state }, { domain: "all", next: snapshot(), prev });
  };

  const quick = h(
    "div",
    { class: "st-ll-quick", role: "group", "aria-label": "Set every domain at once" },
    h("span", { class: "st-ll-muted" }, "Set all:"),
    TIERS.map((t) =>
      h(
        "button",
        { type: "button", class: "st-ll-btn st-ll-btn-small", onclick: () => setAll(t.id) },
        t.short,
      ),
    ),
    recommend
      ? h(
          "button",
          {
            type: "button",
            class: "st-ll-btn st-ll-btn-small",
            title: recommend.rationale,
            onclick: () => setTiers(recommend.perDomain),
          },
          "Use class recommendation",
        )
      : null,
  );
  const el = h(
    "section",
    { class: "st-ll-slider", "aria-label": "Scaffold slider" },
    h(
      "div",
      { class: "st-ll-target", role: "note" },
      h("strong", {}, "Learning target (never changes)"),
      h("p", {}, target || "Same learning target at every support level."),
    ),
    quick,
    h("div", { class: "st-ll-sl-rows" }, rows),
    live,
    diffBox,
  );
  renderDiff(null, before);
  return {
    el,
    getTiers: () => ({ ...state }),
    setTiers,
    setItem(next) {
      current = next;
      before = snapshot();
      renderDiff(null, before);
    },
  };
}

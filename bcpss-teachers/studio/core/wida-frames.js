// Original, proficiency-sensitive language frames per Key Language Use, domain and support tier.
// Pure data and lookups (no DOM): used by wida-studio, the pathway generator and any engine that needs frames.
//
// Tiers change language ACCESS only. A frame never changes the content task. Entering/Emerging frames are short and
// fill-in-the-blank with a word bank; Developing frames add a connector; Expanding frames are starters that leave the
// sentence open; Bridging prompts name the move and leave the wording to the writer or speaker.
import { DOMAINS, KLUS, TIER_IDS } from "../data/taxonomy.js";

const f = (ee, dev, exp, br) => ({ ee, dev, exp, br });

/** FRAMES[klu][domain][tier] -> string[] */
export const FRAMES = {
  Narrate: {
    Listening: f(
      ["First, ___ happened.", "Then ___."],
      ["First ___. After that, ___."],
      ["The speaker began by telling about ___ and then ___."],
      ["Retell the events in order and name how the speaker moved from one to the next."],
    ),
    Speaking: f(
      ["First, I ___.", "Then, I ___.", "Last, I ___."],
      ["First ___. Then ___. Finally ___."],
      ["At the beginning ___. After a while ___. In the end ___."],
      ["Tell the events in order, with one detail that shows how it felt or why it mattered."],
    ),
    Reading: f(
      ["First, ___.", "At the end, ___."],
      ["First the character ___. Then ___."],
      ["The story begins when ___ and ends when ___."],
      ["Summarize the sequence of events and name the turning point."],
    ),
    Writing: f(
      ["First, ___. Then, ___.", "I ___ and I ___."],
      ["First ___. Next ___. Finally ___."],
      ["Early in the day ___. Later ___. By the end ___."],
      ["Narrate the events in order, using time words and one descriptive detail for each."],
    ),
  },
  Inform: {
    Listening: f(
      ["I hear ___.", "It is ___."],
      ["The speaker says that ___ is ___."],
      ["The speaker describes ___ as ___ and gives ___ as an example."],
      ["Name the topic, two key facts, and how the speaker organized them."],
    ),
    Speaking: f(
      ["This is ___.", "It has ___.", "It can ___."],
      ["___ is a kind of ___. It has ___ and it ___."],
      ["___ is known for ___. For example, ___."],
      ["Describe the topic with at least two precise facts and an example."],
    ),
    Reading: f(
      ["The text is about ___.", "A fact is ___."],
      ["The text tells that ___ has ___."],
      ["According to the text, ___ is ___, which means ___."],
      ["State the topic, the supporting facts, and what the heading or visual adds."],
    ),
    Writing: f(
      ["___ is ___.", "___ has ___.", "___ can ___."],
      ["___ is a ___ that ___. It also ___."],
      ["___ is ___, and it is important because ___. For example, ___."],
      [
        "Write an informative paragraph: topic sentence, facts with precise words, and a closing idea.",
      ],
    ),
  },
  Explain: {
    Listening: f(
      ["___ happens because ___."],
      ["The speaker says ___ happens because ___."],
      ["According to the speaker, ___ results from ___, which leads to ___."],
      ["Explain the cause and effect chain you heard and how the speaker linked each step."],
    ),
    Speaking: f(
      ["First ___. Then ___.", "___ because ___."],
      ["First ___. Because of that, ___. As a result, ___."],
      ["The process starts when ___. As ___, ___. This causes ___."],
      [
        "Explain how or why, linking each step with a cause word and using the subject's vocabulary.",
      ],
    ),
    Reading: f(
      ["The text says ___ because ___."],
      ["The text explains that ___ happens because ___."],
      ["The author explains how ___ by describing ___ and then ___."],
      ["Explain the process or reason, and point to the sentence that shows it."],
    ),
    Writing: f(
      ["___ because ___.", "First ___. Then ___."],
      ["___ because ___. This means ___."],
      ["Because ___, ___. As a result, ___. This shows that ___."],
      ["Write an explanation: claim, evidence or steps, and reasoning that connects them."],
    ),
  },
  Argue: {
    Listening: f(
      ["The speaker thinks ___.", "The speaker says ___."],
      ["The speaker thinks ___ because ___."],
      ["The speaker argues that ___ and supports this with ___."],
      ["Identify the claim, the reasons, and any reason you find weak or strong."],
    ),
    Speaking: f(
      ["I think ___.", "I think ___ because ___."],
      ["I think ___ because ___. Another reason is ___."],
      ["In my opinion, ___ because ___. Some people say ___, but ___."],
      ["Take a position, give two supported reasons, and respond to a different view."],
    ),
    Reading: f(
      ["The author thinks ___.", "A reason is ___."],
      ["The author says ___ because ___."],
      ["The author claims ___ and supports it with ___, but ___."],
      ["Evaluate the claim and the evidence the author uses."],
    ),
    Writing: f(
      ["I think ___ because ___."],
      ["I think ___ because ___. Also, ___."],
      ["I believe ___ because ___. For example, ___. Although ___, ___."],
      ["Write an argument: claim, reasons with evidence, and a response to a counterclaim."],
    ),
  },
};

/** Language targets (checklist statements) per Key Language Use and tier, for Speaking and Writing. */
export const TARGETS = {
  Narrate: f(
    ["I used first and then.", "I told what happened."],
    ["I put events in order with time words.", "I told who, what and where."],
    ["I used time words and details to move the story along."],
    ["I controlled pacing with varied time phrases and precise verbs."],
  ),
  Inform: f(
    ["I named the topic.", "I told facts about it."],
    ["I gave facts with describing words.", "I kept facts on one topic."],
    ["I grouped related facts and gave an example."],
    ["I used precise topic words and combined facts into longer sentences."],
  ),
  Explain: f(
    ["I used because.", "I told steps in order."],
    ["I connected ideas with because and so.", "I told what caused what."],
    ["I linked steps with cause words and used topic words."],
    ["I linked cause and effect across sentences with precise reasoning words."],
  ),
  Argue: f(
    ["I said what I think.", "I gave one reason."],
    ["I gave my position and a reason with because.", "I added a second reason."],
    ["I gave reasons with evidence and answered another view."],
    ["I supported a claim with evidence, reasoning and a response to a counterclaim."],
  ),
};

/** Connecting words that tier supports can surface. Cumulative: a higher tier gets everything below plus its own. */
export const CONNECTORS = f(
  ["and", "because", "then", "first"],
  ["and", "but", "because", "so", "then", "after that", "also"],
  ["however", "for example", "as a result", "in addition", "although", "which means"],
  [
    "therefore",
    "nevertheless",
    "consequently",
    "on the other hand",
    "in contrast",
    "as evidenced by",
  ],
);

const need = (klu, domain) => {
  if (!KLUS.includes(klu)) throw new Error(`Unknown Key Language Use "${klu}"`);
  if (!DOMAINS.includes(domain)) throw new Error(`Unknown domain "${domain}"`);
};
const tierOk = (tier) => {
  if (!TIER_IDS.includes(tier)) throw new Error(`Unknown tier "${tier}"`);
};

/** Frames for one KLU, domain and tier (a copy, safe to mutate). */
export function framesFor(klu, domain, tier) {
  need(klu, domain);
  tierOk(tier);
  return [...FRAMES[klu][domain][tier]];
}

/** All four tiers: { ee, dev, exp, br } of frame arrays. */
export function allTierFrames(klu, domain) {
  need(klu, domain);
  return Object.fromEntries(TIER_IDS.map((t) => [t, [...FRAMES[klu][domain][t]]]));
}

/** Language-target checklist for a KLU and tier. */
export function targetsFor(klu, tier) {
  if (!KLUS.includes(klu)) throw new Error(`Unknown Key Language Use "${klu}"`);
  tierOk(tier);
  return [...TARGETS[klu][tier]];
}

/** Connectors available at a tier (cumulative from Entering/Emerging). */
export function connectorsFor(tier) {
  tierOk(tier);
  const upto = TIER_IDS.indexOf(tier);
  return TIER_IDS.slice(0, upto + 1).flatMap((t) => CONNECTORS[t]);
}

/** A support object {frames, oral?} for a task of this KLU/domain at a tier. */
export function supportsFor(klu, domain, tier, extra = {}) {
  return { frames: framesFor(klu, domain, tier), ...extra };
}

/** One-sentence language purpose of a KLU, used by the pathway generator and the teacher views. */
export const KLU_PURPOSE = {
  Narrate: "sequence events and tell what happened with time words and details",
  Inform: "name a topic and give facts, descriptions and examples",
  Explain: "tell how or why something happens by linking causes, steps and results",
  Argue: "state a position and support it with reasons and evidence",
};

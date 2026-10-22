// Language Error Detective — explainable pattern detectors.
//
// Every detector returns spans of the student's own text and a stable id. Detectors are written for
// PRECISION: a flag the student cannot trust teaches them to ignore the tool. Patterns whose signal
// is weaker are marked confidence:"check" — shown as a question ("does this sentence have a main
// clause?"), never counted as an error in the learner profile.
//
// The pattern ids are a contract with content/detective/patterns.json (lessons, practice, transfer);
// tools/validate-access-studio.mjs runs these detectors over every authored practice sentence.
import { COMMON_VERBS, IRREGULAR, NUMBER_WORDS, COUNTABLE, UNCOUNTABLE, VAGUE } from "./lexicon.js";
import { sentences as splitSentences, tokenize } from "./text.js";

const PRON = new Set(["i", "you", "he", "she", "it", "we", "they"]);
const THIRD = new Set(["he", "she", "it"]);
const AUX = new Set(["do", "does", "did", "is", "are", "was", "were", "am", "can", "could", "will", "would", "should", "have", "has", "had", "must", "may", "might", "shall"]);
const MODALS = new Set(["can", "could", "will", "would", "should", "must", "may", "might", "shall"]);
const SAME_PAST = new Set(["read", "put", "set", "cut", "hit", "let", "hurt", "cost", "shut", "spread"]);
const PAST_FORMS = new Set(Object.entries(IRREGULAR).filter(([b, [p]]) => p !== b).map(([, [p]]) => p));
const BASE_VERBS = new Set([...COMMON_VERBS, ...Object.keys(IRREGULAR)]);
const CAUSE_OF = /^(it|he|she|they|we|i|there)$/;

const P = (re, s, flags = "gi") => [...s.matchAll(new RegExp(re, flags))].map((m) => ({ start: m.index, end: m.index + m[0].length }));
const tokOf = (s) => tokenize(s.text);
const span = (toks, i, j = i) => ({ start: toks[i].start, end: toks[j].end });
const past = (s) => /\b(?:yesterday|last (?:night|week|month|year|summer|weekend)|\d+ (?:days?|weeks?|months?|years?) ago|ago|when i was)\b/i.test(s.text);

// "base+ed" for irregular verbs: goed, eated, runned, maked, teached…
const WRONG_ED = new Map();
for (const [base, [pastForm]] of Object.entries(IRREGULAR)) {
  if (["be", "see", "pay", "read", "put", "set", "cut", "do", "let", "have"].includes(base) || pastForm === base) continue;
  const cands = new Set([`${base}ed`, base.endsWith("e") ? `${base}d` : null, `${base}${base.at(-1)}ed`, base.endsWith("y") ? `${base.slice(0, -1)}ied` : null]);
  for (const c of cands) if (c && c !== pastForm) WRONG_ED.set(c, pastForm);
}
WRONG_ED.set("builded", "built");
WRONG_ED.set("teached", "taught");
WRONG_ED.delete("hearded");

const FIXES = {
  alot: "a lot", definately: "definitely", recieve: "receive", seperate: "separate", wich: "which", becuase: "because", beacuse: "because",
  tommorow: "tomorrow", freind: "friend", thier: "their", teh: "the", adress: "address", enviroment: "environment", goverment: "government",
  oxigen: "oxygen", wensday: "Wednesday", writting: "writing", begining: "beginning", beleive: "believe", calender: "calendar", cummunity: "community",
  diffrent: "different", excercise: "exercise", experiance: "experience", favorit: "favorite", finaly: "finally", grammer: "grammar", happend: "happened",
  intresting: "interesting", knowlege: "knowledge", libary: "library", neccessary: "necessary", occured: "occurred", peice: "piece", probly: "probably",
  realy: "really", sience: "science", sentance: "sentence", succesful: "successful", suprise: "surprise", untill: "until", wierd: "weird", yesturday: "yesterday",
  evrything: "everything", importent: "important", poluttion: "pollution", temperture: "temperature", paragragh: "paragraph", questoin: "question",
};

const DAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
const COMPARATIVES = "better|bigger|smaller|larger|taller|shorter|longer|faster|slower|stronger|weaker|harder|easier|older|younger|higher|lower|cheaper|closer|hotter|colder|happier|richer|safer|smarter|worse|newer|heavier|lighter|darker|brighter|cleaner|greater|bigest|best|worst|biggest|smallest|largest|tallest|shortest|longest|fastest|slowest|strongest|easiest|hardest|oldest|youngest|highest|lowest|cheapest|closest|hottest|coldest|happiest";
const SUBJ_ADJ = new Set("tall short happy sad important different easy difficult beautiful dirty heavy strong weak dangerous young old hot cold big small large ready hungry tired angry afraid sick late wrong".split(" "));
const ADJ_NEXT_OK = new Set(["and", "but", "because", "when", "so", "at", "in", "to", "for", "than", "enough", "now", "today", "again", "too"]);
const PAINT_VERBS = /\b(?:paint(?:ed|s)?|colou?r(?:ed|s)?|made?|makes?|turn(?:ed|s)?|dye(?:d|s)?|drew|draw(?:s)?|keep|kept|painted)\b/i;

/** @type {{id:string,name:string,category:string,confidence?:"high"|"check",run:(s:{text:string,start:number,toks:any[]})=>{start:number,end:number}[]}[]} */
export const DETECTORS = [
  {
    id: "sv-agree-3sg", name: "He/she/it + verb needs -s", category: "syntax",
    run(s) {
      if (past(s)) return [];
      const t = s.toks;
      const out = [];
      for (let i = 0; i < t.length - 1; i++) {
        const w = t[i].lower;
        const nx = t[i + 1].lower;
        const prev = t[i - 1]?.lower;
        const subj = THIRD.has(w) || (["the", "my", "his", "her", "our", "their", "a"].includes(prev) && COUNTABLE.has(w) && !["time", "way"].includes(w));
        const det = ["the", "my", "his", "her", "our", "their", "a"].includes(prev);
        if (AUX.has(prev) || (det && AUX.has(t[i - 2]?.lower))) continue;
        if (!subj || ["make", "makes", "let", "help", "helps", "watch", "see", "saw", "hear", "heard", "how", "way", "to", "that", "where", "when", "what", "of", "for", "with", "at", "on", "in", "by", "from"].includes(prev)) continue;
        if (THIRD.has(w) && ["make", "let", "help", "watch", "see", "saw", "hear", "heard", "had", "get", "got", "have", "want", "wants", "told", "tell", "ask", "asked"].includes(prev)) continue;
        if (BASE_VERBS.has(nx) && !SAME_PAST.has(nx) && !AUX.has(nx) || ["do", "have"].includes(nx) && THIRD.has(w)) out.push(span(t, i, i + 1));
      }
      return out;
    },
  },
  {
    id: "be-agree", name: "Form of 'be' doesn't match the subject", category: "syntax",
    run(s) {
      const t = s.toks;
      const out = [];
      for (let i = 0; i < t.length - 1; i++) {
        const w = t[i].lower;
        const nx = t[i + 1].lower;
        if ((w === "i" && ["is", "are"].includes(nx)) || (THIRD.has(w) && ["are", "were", "am"].includes(nx)) || (["they", "we", "you"].includes(w) && ["is", "am", "was"].includes(nx) && !(w === "you" && nx === "was" && false)))
          out.push(span(t, i, i + 1));
        if (w === "there" && ["is", "was"].includes(nx) && t[i + 2] && (["many", "several", "few", "both"].includes(t[i + 2].lower) || (NUMBER_WORDS.has(t[i + 2].lower) && !["a", "one"].includes(t[i + 2].lower)) || (/^\d+$/.test(t[i + 2].lower) && t[i + 2].lower !== "1")))
          out.push(span(t, i, i + 2));
      }
      return out;
    },
  },
  {
    id: "past-marker", name: "Past-time word needs a past-tense verb", category: "syntax",
    run(s) {
      if (!past(s)) return [];
      const t = s.toks;
      const out = [];
      for (let i = 0; i < t.length - 1; i++) {
        if (!PRON.has(t[i].lower)) continue;
        const nx = t[i + 1].lower;
        const prev = t[i - 1]?.lower;
        if (["to", "can", "could", "will", "would", "should", "must", "did", "didn't", "not", "let", "make", "if", "that"].includes(prev)) continue;
        if ((BASE_VERBS.has(nx) && !SAME_PAST.has(nx) && !AUX.has(nx) && nx !== "be") || (["is", "am", "are"].includes(nx) && t[i].lower !== "it" ? true : ["is"].includes(nx)))
          out.push(span(t, i, i + 1));
        // "yesterday it is …"
      }
      return out;
    },
  },
  {
    id: "irregular-ed", name: "Irregular verb with -ed", category: "morphology",
    run(s) {
      return s.toks.flatMap((tk, i) => (WRONG_ED.has(tk.lower) ? [span(s.toks, i)] : []));
    },
  },
  {
    id: "plural-after-number", name: "Noun needs -s after a number", category: "morphology",
    run(s) {
      const t = s.toks;
      const out = [];
      for (let i = 0; i < t.length - 1; i++) {
        const w = t[i].lower;
        const isNum = (/^\d+(?:\.\d+)?$/.test(w) && Number(w) !== 1) || (NUMBER_WORDS.has(w) && !["both"].includes(w));
        const nx = t[i + 1].lower;
        const irregular = { man: "men", woman: "women", child: "children", person: "people" };
        if (isNum && (COUNTABLE.has(nx) || irregular[nx]) && !["percent", "cent", "foot", "inch", "mile"].includes(nx)) out.push(span(t, i, i + 1));
      }
      return out;
    },
  },
  {
    id: "much-many", name: "Much/many with the wrong kind of noun", category: "morphology",
    run(s) {
      const t = s.toks;
      const out = [];
      for (let i = 0; i < t.length - 1; i++) {
        const w = t[i].lower;
        const nx = t[i + 1].lower;
        if (w === "many" && UNCOUNTABLE.has(nx)) out.push(span(t, i, i + 1));
        if (w === "much" && t[i - 1]?.lower !== "so" || w === "much" && t[i - 1]?.lower === "so")
          if (nx === "people" || (nx.endsWith("s") && COUNTABLE.has(nx.slice(0, -1)))) out.push(span(t, i, i + 1));
      }
      return out;
    },
  },
  {
    id: "article-a-an", name: "A or an?", category: "morphology",
    run(s) {
      const out = [];
      for (const m of s.text.matchAll(/\b(a|an)\s+([A-Za-z]+)/gi)) {
        const art = m[1].toLowerCase();
        const w = m[2].toLowerCase();
        if (w.length < 2) continue;
        const vowelSound = /^(?:hour|honest|honor|heir)/.test(w) || (/^[aeiou]/.test(w) && !/^(?:uni|use|usu|ute|eu|one|once|ubi|uti)/.test(w));
        if ((art === "a" && vowelSound) || (art === "an" && !vowelSound && !/^[A-Z]{2,}$/.test(m[2]) && w !== "h")) out.push({ start: m.index, end: m.index + m[0].length });
      }
      return out;
    },
  },
  {
    id: "comparative-form", name: "Comparative or superlative form", category: "morphology",
    run(s) {
      return [
        ...P(`\\b(?:more|most)\\s+(?:${COMPARATIVES})\\b`, s.text),
        ...P("\\b(?:more|most)\\s+(?:big|small|tall|fast|slow|hard|easy|cheap|old|young|high|low|strong|weak|large|short|long)\\b", s.text),
      ];
    },
  },
  {
    id: "missing-expletive", name: "Sentence needs 'it' or 'there'", category: "syntax",
    run(s) {
      const t = s.toks;
      if (!t.length || /\?\s*$/.test(s.text)) return [];
      const first = t[0].lower;
      const second = t[1]?.lower;
      if (!["is", "are", "was", "were", "has", "exist", "exists", "existed"].includes(first) || !second) return [];
      const NEXT = /^(?:important|necessary|possible|impossible|easy|hard|difficult|good|bad|true|better|dangerous|normal|common|raining|snowing|sunny|cold|hot|windy|cloudy|late|early|time|many|some|several|no|clear|obvious|helpful|useful|interesting|fun|safe|unfair|unlikely|likely|worth)$/i;
      if (NEXT.test(second)) return [span(t, 0, 1)];
      if (second === "a" && /^(?:good|bad|great|important|big|serious|common|nice)$/i.test(t[2]?.lower || "") && /^(?:idea|problem|thing|chance|way|reason|choice|mistake|plan)$/i.test(t[3]?.lower || "")) return [span(t, 0, 3)];
      return [];
    },
  },
  {
    id: "double-negative", name: "Two negatives in one idea", category: "syntax",
    run(s) {
      const t = s.toks;
      const out = [];
      const neg = /^(?:don't|doesn't|didn't|can't|won't|couldn't|wouldn't|shouldn't|haven't|hasn't|hadn't|isn't|aren't|wasn't|weren't|cannot)$/;
      for (let i = 0; i < t.length; i++) {
        if (!neg.test(t[i].lower) && !(t[i].lower === "not" && ["do", "did", "does", "can", "could", "will", "would", "have", "has", "had", "is", "are", "was", "were"].includes(t[i - 1]?.lower))) continue;
        for (let j = i + 1; j <= Math.min(i + 4, t.length - 1); j++) {
          const w = t[j].lower;
          if (["nobody", "nothing", "nowhere", "never", "none"].includes(w) || (w === "no" && t[j + 1] && !["longer", "one"].includes(t[j + 1].lower) ? true : w === "no" && t[j + 1]?.lower === "one")) {
            out.push(span(t, i, j));
            break;
          }
        }
      }
      return out;
    },
  },
  {
    id: "modal-form", name: "Verb form after can/should/must", category: "syntax",
    run(s) {
      const t = s.toks;
      const out = [];
      for (let i = 0; i < t.length - 1; i++) {
        if (!MODALS.has(t[i].lower)) continue;
        const nx = t[i + 1].lower;
        const sForm = nx.endsWith("es") ? [nx.slice(0, -2), nx.slice(0, -1)] : nx.endsWith("s") ? [nx.slice(0, -1)] : [];
        if (nx === "to" || /ing$/.test(nx) && BASE_VERBS.has(nx.replace(/ing$/, "")) || PAST_FORMS.has(nx) && !SAME_PAST.has(nx) && !["be"].includes(nx) || sForm.some((b) => BASE_VERBS.has(b)) || ["goes", "does", "has"].includes(nx))
          out.push(span(t, i, i + 1));
      }
      return out;
    },
  },
  {
    id: "do-support", name: "do / does / did + base verb", category: "syntax",
    run(s) {
      const t = s.toks;
      const out = [];
      for (let i = 0; i < t.length; i++) {
        const w = t[i].lower;
        if (THIRD.has(w) && ["don't"].includes(t[i + 1]?.lower)) out.push(span(t, i, i + 1));
        if (THIRD.has(w) && t[i + 1]?.lower === "do" && t[i + 2]?.lower === "not") out.push(span(t, i, i + 2));
        if (["does", "doesn't"].includes(w)) {
          let j = i + 1;
          if (THIRD.has(t[j]?.lower)) j++;
          const v = t[j]?.lower;
          if (v && /s$/.test(v) && (BASE_VERBS.has(v.slice(0, -1)) || BASE_VERBS.has(v.slice(0, -2))) && !["is", "was", "has"].includes(v)) out.push(span(t, i, j));
        }
        if (["did", "didn't"].includes(w)) {
          let j = i + 1;
          if (PRON.has(t[j]?.lower)) j++;
          const v = t[j]?.lower;
          if (v && ((PAST_FORMS.has(v) && !SAME_PAST.has(v)) || (/ed$/.test(v) && BASE_VERBS.has(v.replace(/ed$/, "")) || (/ed$/.test(v) && BASE_VERBS.has(v.replace(/d$/, "")))))) out.push(span(t, i, j));
        }
      }
      return out;
    },
  },
  {
    id: "question-order", name: "Question word order", category: "syntax",
    run(s) {
      const t = s.toks;
      if (!/\?\s*$/.test(s.text) || t.length < 3) return [];
      if (!["what", "why", "where", "when", "how", "which"].includes(t[0].lower)) return [];
      const subj = new Set([...PRON, "the", "a", "an", "my", "your", "his", "her", "our", "their", "this", "that", "these", "those"]);
      return subj.has(t[1].lower) ? [span(t, 0, 2)] : [];
    },
  },
  {
    id: "fragment-subordinate", name: "A sentence that starts with 'because' and stops", category: "discourse", confidence: "check",
    run(s) {
      const t = s.toks;
      if (!t.length || /,/.test(s.text)) return [];
      const first = t[0].lower;
      if (["because", "although", "though", "since"].includes(first) && t.length <= 8) return [span(t, 0, t.length - 1)];
      if (["when", "if", "while", "after", "before", "until", "unless", "whereas"].includes(first) && t.length <= 5) return [span(t, 0, t.length - 1)];
      return [];
    },
  },
  {
    id: "comma-splice", name: "Two sentences joined by a comma", category: "discourse", confidence: "check",
    run(s) {
      const out = [];
      const t = s.toks;
      const SUBORD = new Set(["when", "while", "although", "because", "since", "if", "after", "before", "as", "once", "unless", "until", "though", "whereas", "in", "on", "at", "during", "with", "for", "by", "from", "after", "first", "next", "then", "finally", "however", "also", "yesterday", "today", "later", "meanwhile", "overall", "instead", "so", "and", "but"]);
      for (const m of s.text.matchAll(/,\s+(?=(?:he|she|it|they|we|i|there|this|that)\s+(?:is|are|was|were|has|have|had|can|will|would|could|did|does|\w+s|\w+ed)\b)/gi)) {
        const before = t.filter((tk) => tk.end <= m.index - s.start + s.start && tk.start < m.index);
        if (before.length < 3 || SUBORD.has(before[0].lower)) continue;
        if (before.some((tk) => ["if", "when", "because", "although", "while", "since"].includes(tk.lower))) continue;
        if (!before.some((tk) => BASE_VERBS.has(tk.lower) || /^(?:is|are|was|were|has|have|had|\w+ed|\w+s)$/.test(tk.lower))) continue;
        out.push({ start: m.index, end: m.index + 1 });
      }
      return out;
    },
  },
  {
    id: "capital-punct", name: "Capital letters and end punctuation", category: "conventions",
    run(s, ctx) {
      const out = [];
      const first = s.text.search(/[A-Za-z]/);
      if (first === 0 && /^[a-z]/.test(s.text)) out.push({ start: 0, end: s.toks[0]?.end || 1 });
      for (const m of s.text.matchAll(/(?<![A-Za-z'’])i(?![A-Za-z'’])/g)) out.push({ start: m.index, end: m.index + 1 });
      if (ctx.isLast && !/[.!?"')]\s*$/.test(s.text) && s.toks.length >= 3) out.push({ start: s.text.length - 1, end: s.text.length });
      return out;
    },
  },
  {
    id: "confused-word", name: "Words that sound alike", category: "conventions",
    run(s) {
      return [
        ...P("\\b(?:should|could|would|must|might) of\\b", s.text),
        ...P("\\btheir (?:is|are|was|were)\\b", s.text),
        ...P("\\bthere (?:own|house|car|friends?|teacher|family|parents|school|class|homework|idea|team|names?)\\b", s.text),
        ...P("\\byour (?:welcome|going|not|doing|being|a|an|the|always|never)\\b", s.text),
        ...P("\\bits (?:a|an|not|been|very|important|raining|going|getting|too|also|easy|hard)\\b", s.text),
        ...P("\\bit's (?:color|colour|name|shape|size|own|owner|habitat|tail|wings?|leaves|roots?|surface|temperature|purpose|meaning|population|main)\\b", s.text),
        ...P("\\b(?:more|less|better|bigger|smaller|larger|faster|slower|higher|lower|taller|shorter|older|younger|rather|other|easier|harder|greater|fewer) then\\b", s.text),
        ...P("\\bto (?:much|late|early|hot|cold|big|small|loud|expensive|difficult)\\b", s.text),
      ];
    },
  },
  {
    id: "preposition-choice", name: "Preposition that doesn't fit the verb or time word", category: "syntax",
    run(s) {
      return [
        ...P("\\bdepends? of\\b|\\bdepended of\\b", s.text),
        ...P("\\barriv(?:e|es|ed|ing) to\\b", s.text),
        ...P("\\bmarried with\\b", s.text),
        ...P("\\bin the other hand\\b", s.text),
        ...P("\\bdiscuss(?:es|ed|ing)? about\\b", s.text),
        ...P("\\bexplain(?:s|ed|ing)? (?:me|him|her|us|them)\\b", s.text),
        ...P("\\baccording with\\b", s.text),
        ...P("\\bdifferent of\\b", s.text),
        ...P("\\binterested (?:on|about)\\b", s.text),
        ...P("\\bconsists? in\\b", s.text),
        ...P("\\blisten(?:s|ed|ing)? (?:the|a|my|your|his|her|our|their|music|radio)\\b", s.text),
        ...P("\\blook(?:s|ed|ing)? (?:the|a|my|your|his|her|our|their)\\b(?! like)", s.text),
        ...P("\\bresponsible of\\b", s.text),
        ...P(`\\bin (?:${DAYS})\\b`, s.text),
        ...P("\\bgood in (?:math|science|reading|writing|english|sports|soccer|art)\\b", s.text),
        ...P("\\bwait(?:s|ed|ing)? (?:the|a|my|your|for the) ?(?:bus|train|teacher|class)?\\b(?<!wait for the (?:bus|train|teacher|class))(?<!wait for the)", s.text).filter(() => false),
        ...P("\\bwait(?:s|ed|ing)? (?:the|a|my|your|his|her|our|their) (?:bus|train|teacher|class|friend|friends|mom|dad|results?)\\b", s.text),
        ...P("\\bsince (?:\\d+|two|three|four|five|six|seven|eight|nine|ten|several|many) (?:years?|months?|weeks?|days?|hours?)\\b", s.text),
      ];
    },
  },
  {
    id: "l1-collocation", name: "Verb + noun pair that English says differently", category: "word-choice",
    run(s) {
      return [
        ...P("\\b(?:i|you|we|they|he|she) (?:have|has) \\d+ years?\\b(?! of)", s.text),
        ...P("\\b(?:have|has) (?:hunger|thirst|sleep|cold|heat)\\b", s.text),
        ...P("\\bmak(?:e|es|ing) (?:a |the |my |your |his |her |our |their )?questions?\\b|\\bmade (?:a |the |my )?questions?\\b", s.text),
        ...P("\\bmak(?:e|es|ing) (?:the |my |your |his |her |our |their )?homework\\b|\\bmade (?:the |my |your |his |her )?homework\\b", s.text),
        ...P("\\b(?:do|does|did|doing) (?:a |the )?(?:mistakes?|decisions?|photos?)\\b|\\bdid (?:a )?mistakes?\\b", s.text),
        ...P("\\b(?:say|said|says) (?:me|him|her|us|them)\\b", s.text),
        ...P("\\b(?:open|close|opened|closed|opens|closes) (?:the )?(?:light|lights|tv|television|radio)\\b", s.text),
        ...P("\\bmak(?:e|es|ing) (?:a |the )?(?:photos?|pictures?)\\b|\\bmade (?:a )?(?:photos?)\\b", s.text),
        ...P("\\b(?:am|is|are) agree\\b", s.text),
        ...P("\\bvery (?:like|love|want|need|enjoy)\\b", s.text),
        ...P("\\b(?:like|likes|love|loves|enjoy|enjoys) very much (?!and\\b|but\\b|because\\b|so\\b|too\\b|when\\b|if\\b|[.,!?]|$)\\w+", s.text),
      ];
    },
  },
  {
    id: "adjective-agreement", name: "Adjectives don't take -s", category: "morphology",
    run(s) {
      return [
        ...P("\\b(?:bigs|smalls|olds|youngs|talls|happys|importants|differents|larges|littles|beautifuls|goods|bads)\\s+[a-z]+", s.text).filter((m) => !/\bgoods\s+(?:and|are|is)\b/i.test(s.text.slice(m.start, m.end + 4))),
        ...P("\\bothers (?:students|people|kids|children|countries|animals|things|ideas|reasons|ways|examples|places|cities|friends|families|teachers|members)\\b", s.text),
      ];
    },
  },
  {
    id: "adjective-position", name: "Adjective goes before the noun", category: "syntax",
    run(s) {
      const out = [];
      for (const m of s.text.matchAll(/\b(?:the|a|an|my|his|her|our|their|your)\s+(?:car|house|book|ball|shirt|flower|dog|cat|bag|box|table|door|hat|shoes|pencil|paper|bike|bus|room)\s+(red|blue|green|yellow|black|white|big|small|new|old|brown|orange|pink|purple)\b/gi)) {
        const before = s.text.slice(Math.max(0, m.index - 24), m.index);
        if (PAINT_VERBS.test(before)) continue;
        if (/\b(?:is|are|was|were|looks?|looked|seems?|seemed|became|become|turns?|turned)\s*$/i.test(before)) continue;
        out.push({ start: m.index, end: m.index + m[0].length });
      }
      return out;
    },
  },
  {
    id: "vague-word", name: "Vague word — say it more precisely", category: "word-choice", confidence: "check",
    run(s) {
      const out = [];
      for (const w of ["a lot of", "lots of", "things", "thing", "stuff", "good", "bad", "nice", "really", "very"]) {
        if (!VAGUE[w]) continue;
        for (const m of s.text.matchAll(new RegExp(`(?<![\\p{L}'])${w}(?![\\p{L}'])`, "giu"))) {
          if (w === "very" && /^\s+much\b/i.test(s.text.slice(m.index + 4))) continue;
          out.push({ start: m.index, end: m.index + m[0].length });
        }
      }
      return out;
    },
  },
  {
    id: "connector-form", name: "Joining words that don't fit together", category: "discourse",
    run(s) {
      return [
        ...P("\\bbecause of (?:it|he|she|they|we|i|there)\\b", s.text),
        ...P("\\bbecause of the \\w+ (?:was|were|is|are|had|has)\\b", s.text),
        ...P("\\b(?:although|though|even though)\\b[^.!?;]*?,\\s*but\\b", s.text).map((m) => ({ start: m.start, end: Math.min(m.end, m.start + 60) })),
        ...P("\\bbecause\\b[^.!?;]*?,\\s*so\\b", s.text).map((m) => ({ start: m.start, end: Math.min(m.end, m.start + 60) })),
        ...P("\\bdespite of\\b", s.text),
      ];
    },
  },
  {
    id: "common-misspelling", name: "Common spelling slip", category: "conventions",
    run(s) {
      return s.toks.flatMap((tk, i) => (FIXES[tk.lower] ? [span(s.toks, i)] : []));
    },
  },
  {
    id: "missing-be", name: "Missing 'am / is / are'", category: "syntax",
    run(s) {
      const t = s.toks;
      const out = [];
      for (let i = 0; i < t.length - 1; i++) {
        const gap = ["very", "so", "too", "really"].includes(t[i + 1]?.lower) ? 1 : 0;
        if (!PRON.has(t[i].lower) || !SUBJ_ADJ.has(t[i + 1 + gap]?.lower)) continue;
        const after = t[i + 2 + gap]?.lower;
        if (after && !ADJ_NEXT_OK.has(after)) continue;
        if (["to", "the", "a", "an", "make", "let", "very", "so", "that"].includes(t[i - 1]?.lower)) continue;
        out.push(span(t, i, i + 1 + gap));
      }
      return out;
    },
  },
];

export const DETECTOR_IDS = DETECTORS.map((d) => d.id);
export const MISSPELLING_FIXES = FIXES;
export const WRONG_ED_FORMS = WRONG_ED;

/** Run every detector. Returns [{ id, name, category, confidence, start, end, text, sentence:{start,end,text} }] sorted by position. */
export function detect(text, { only = null } = {}) {
  const src = String(text || "");
  const sents = splitSentences(src);
  const out = [];
  sents.forEach((s, idx) => {
    const ctxSentence = { text: s.text, start: s.start, toks: tokenize(s.text) };
    const ctx = { isLast: idx === sents.length - 1 };
    for (const d of DETECTORS) {
      if (only && !only.includes(d.id)) continue;
      const seen = new Set();
      for (const hit of d.run(ctxSentence, ctx)) {
        const key = `${hit.start}:${hit.end}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const start = s.start + hit.start;
        const end = s.start + hit.end;
        out.push({
          id: d.id, name: d.name, category: d.category, confidence: d.confidence || "high",
          start, end, text: src.slice(start, end), sentence: { start: s.start, end: s.end, text: s.text },
        });
      }
    }
  });
  return out.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
}

/**
 * Did a revision fix one pattern without breaking anything else, and is it still the same message?
 * `meaning` compares content-word stems so "fix" can't be "delete the sentence".
 */
export function checkRevision(original, revised, patternId, { minOverlap = 0.6 } = {}) {
  const before = detect(original);
  const after = detect(revised);
  const stillThere = after.filter((f) => f.id === patternId);
  const beforeKeys = new Set(before.map((f) => `${f.id}|${f.text.toLowerCase()}`));
  const introduced = after.filter((f) => f.confidence === "high" && f.id !== patternId && !beforeKeys.has(`${f.id}|${f.text.toLowerCase()}`));
  const bag = (t) => new Set(tokenize(t).map((x) => x.lower).filter((w) => w.length > 3));
  const a = bag(original);
  const b = bag(revised);
  const common = [...a].filter((w) => b.has(w)).length;
  const overlap = a.size ? common / a.size : 1;
  const changed = String(original).trim() !== String(revised).trim();
  return {
    fixed: changed && stillThere.length === 0,
    changed,
    introduced,
    sameMessage: overlap >= minOverlap,
    overlap,
    remaining: stillThere,
  };
}

// Language data for the engine: connectors by job, academic vocabulary, word-precision swaps,
// irregular verbs, and the word lists the error detectors lean on. Data only — no logic.

/** Discourse connectors by the job they do. `level` marks how developed the move is for a grade 6-8 writer. */
export const CONNECTORS = {
  sequence: ["first", "second", "third", "next", "then", "after that", "afterward", "later", "finally", "meanwhile", "at the end", "before", "once"],
  addition: ["also", "in addition", "furthermore", "moreover", "another", "besides", "as well as", "additionally"],
  cause: ["because", "since", "due to", "as a result", "consequently", "therefore", "so that", "this means", "which causes", "which leads to", "leads to", "results in", "for this reason", "thanks to"],
  contrast: ["but", "however", "although", "even though", "while", "whereas", "on the other hand", "in contrast", "unlike", "instead", "yet", "despite", "nevertheless"],
  example: ["for example", "for instance", "such as", "like", "to illustrate", "in particular"],
  evidence: ["according to", "the data show", "the data shows", "the chart shows", "the table shows", "the graph shows", "the passage says", "the text says", "the author states", "as shown in", "based on", "evidence", "the report", "this shows", "this proves", "this suggests", "this demonstrates"],
  stance: ["i believe", "i think", "in my opinion", "i argue", "i agree", "i disagree", "i recommend", "i propose", "we should", "should", "must", "it is important"],
  concession: ["some people", "although some", "others may", "one might argue", "it is true that", "admittedly", "even so"],
  conclusion: ["in conclusion", "overall", "to sum up", "in summary", "to conclude", "all in all", "therefore"],
};
export const CONNECTOR_JOBS = Object.keys(CONNECTORS);

/** Subordinators that open a dependent clause. */
export const SUBORDINATORS = ["because", "although", "though", "even though", "since", "while", "whereas", "if", "unless", "when", "whenever", "after", "before", "until", "as soon as", "so that", "once", "which", "who", "whom", "whose", "that"];
export const COORDINATORS = ["and", "but", "or", "so", "yet", "nor", "for"];

/** Tier-2 academic words common in grade 6-8 science, social studies, math and ELA. Authored for this lab. */
export const ACADEMIC = new Set(
  `analyze analysis approach area assume aspect assess associate benefit category cause challenge change circumstance claim classify cognate communicate community compare complex component conclude conclusion conflict consequence consider consist constant construct context contrast contribute convert core create criteria critical culture data debate decrease define demonstrate depend describe design detail determine develop device diagram differ difference distribute document dominant draft economy effect efficient element emphasize enable environment equation estimate evaluate evidence evolve example exhibit explain factor feature function generate identify illustrate impact imply impact increase indicate individual infer influence inform initial interact interpret investigate involve issue justify likely limit locate maintain major method model monitor motive network obtain occur outcome overall participate pattern perspective phenomenon policy predict previous primary principle process produce project proportion purpose range rate reaction region relate relevant rely require research resource respond response restore result reveal role section sequence significant similar source specific stable structure summarize support survey sustain system technique theory transfer trend typical unique vary vital volume`.split(/\s+/),
);

/** Domain-specific Tier-3 terms that signal content knowledge (matched as stems elsewhere). Small, topic-agnostic seeds. */
export const DOMAIN_HINTS = [
  "ecosystem", "habitat", "organism", "oxygen", "nutrient", "runoff", "erosion", "sediment", "climate", "pollution", "energy", "gravity", "orbit", "atmosphere",
  "government", "colony", "treaty", "citizen", "petition", "council", "democracy", "economy", "immigrant", "revolution", "constitution",
  "ratio", "percent", "fraction", "variable", "equation", "median", "mean", "average", "probability", "expression", "coordinate", "proportion",
  "narrator", "theme", "metaphor", "symbol", "inference", "perspective", "protagonist", "setting", "conflict",
];

/** Vague words and precise swaps that depend on topic. Shown as a *question*, never as an error. */
export const VAGUE = {
  thing: ["factor", "object", "cause", "feature", "result", "item"],
  things: ["factors", "objects", "causes", "features", "results", "items"],
  stuff: ["materials", "substances", "objects", "supplies"],
  good: ["beneficial", "effective", "helpful", "successful", "valuable"],
  bad: ["harmful", "damaging", "ineffective", "dangerous", "costly"],
  nice: ["pleasant", "helpful", "effective", "appealing"],
  big: ["large", "significant", "major", "substantial"],
  small: ["minor", "limited", "tiny", "slight"],
  "a lot of": ["many", "numerous", "a large number of", "a great deal of"],
  lots: ["many", "numerous", "a large amount"],
  very: ["extremely", "highly", "significantly"],
  really: ["truly", "especially", "significantly"],
  get: ["receive", "obtain", "become", "gain"],
  got: ["received", "obtained", "became", "gained"],
  make: ["create", "produce", "cause", "build"],
  said: ["stated", "explained", "reported", "argued"],
  show: ["demonstrate", "indicate", "reveal", "illustrate"],
  shows: ["demonstrates", "indicates", "reveals", "illustrates"],
  happen: ["occur", "take place", "result"],
  happened: ["occurred", "took place", "resulted"],
};

/** Irregular verbs: base → [past, participle]. */
export const IRREGULAR = {
  be: ["was", "been"], begin: ["began", "begun"], bring: ["brought", "brought"], build: ["built", "built"], buy: ["bought", "bought"],
  catch: ["caught", "caught"], choose: ["chose", "chosen"], come: ["came", "come"], cut: ["cut", "cut"], do: ["did", "done"], draw: ["drew", "drawn"],
  drink: ["drank", "drunk"], drive: ["drove", "driven"], eat: ["ate", "eaten"], fall: ["fell", "fallen"], feel: ["felt", "felt"], find: ["found", "found"],
  fly: ["flew", "flown"], forget: ["forgot", "forgotten"], get: ["got", "gotten"], give: ["gave", "given"], go: ["went", "gone"], grow: ["grew", "grown"],
  have: ["had", "had"], hear: ["heard", "heard"], hold: ["held", "held"], keep: ["kept", "kept"], know: ["knew", "known"], leave: ["left", "left"],
  lose: ["lost", "lost"], make: ["made", "made"], mean: ["meant", "meant"], meet: ["met", "met"], pay: ["paid", "paid"], put: ["put", "put"],
  read: ["read", "read"], ride: ["rode", "ridden"], run: ["ran", "run"], say: ["said", "said"], see: ["saw", "seen"], sell: ["sold", "sold"],
  send: ["sent", "sent"], set: ["set", "set"], sing: ["sang", "sung"], sit: ["sat", "sat"], sleep: ["slept", "slept"], speak: ["spoke", "spoken"],
  spend: ["spent", "spent"], stand: ["stood", "stood"], swim: ["swam", "swum"], take: ["took", "taken"], teach: ["taught", "taught"], tell: ["told", "told"],
  think: ["thought", "thought"], throw: ["threw", "thrown"], understand: ["understood", "understood"], wear: ["wore", "worn"], win: ["won", "won"], write: ["wrote", "written"],
};

/** Common regular verbs students write (used to recognise a bare base verb after he/she/it or a past-time marker). */
export const COMMON_VERBS = new Set(
  `ask add agree allow appear arrive ask attack believe belong bring build buy call care carry catch change check choose clean climb close come cook cost count cover create cross cry cut dance decide depend describe die discuss do draw dream drink drive drop eat end enjoy enter explain fall feel fight fill find finish fix flow fly follow forget get give go grow happen have hear help hide hit hold hope hurt improve include invite join jump keep kick kill know land last laugh learn leave let like listen live look lose love make matter mean meet mind miss move need notice offer open order own pass pay pick plan plant play point pour practice prefer prepare protect pull push put reach read receive remember remove repeat reply report rest return ride ring rise run save say see seem sell send serve set share show shut sing sit sleep smell speak spend stand start stay stop study suggest support take talk teach tell test thank think throw touch travel try turn use visit wait walk want wash watch wear win wish wonder work worry write`.split(/\s+/),
);

/** Past-time markers that demand a past-tense verb nearby. */
export const PAST_MARKERS = ["yesterday", "last night", "last week", "last month", "last year", "last summer", "ago", "in 1", "when i was", "once upon a time"];

/** Singular countable nouns students often forget to pluralise after a number. */
export const COUNTABLE = new Set(
  `student teacher book pencil desk class friend brother sister cousin dog cat bird animal tree flower plant river lake city country state school week day month year hour minute dollar apple orange egg cookie sandwich car bus bike game team player goal point question answer problem idea reason example fact chart table graph picture story word sentence page letter number sample test station site house room window door ball box bag cup glass bottle mile inch foot yard meter pound ounce gallon cent percent person woman man child family worker farmer scientist citizen leader`.split(/\s+/),
);
export const UNCOUNTABLE = new Set(
  `water information homework advice furniture money music news weather traffic rice bread air oxygen energy pollution knowledge equipment luggage vocabulary research evidence progress behavior electricity sand soil milk food garbage trash`.split(/\s+/),
);
export const NUMBER_WORDS = new Set("two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty hundred several many few both".split(" "));

export const ADJECTIVES = new Set(
  `big small red blue green yellow black white new old good bad young tall short long hot cold happy sad fast slow easy hard important different same large little beautiful dirty clean heavy light dark strong weak rich poor safe dangerous`.split(/\s+/),
);

/** Frames the lab offers by purpose, fading by stage. Frames are scaffolds, never part of an independent attempt. */
export const FRAMES = {
  Narrate: {
    guided: ["At first, ___. Then, ___. Finally, ___.", "The most important moment was ___ because ___."],
    supported: ["Sequence words: first, next, then, after that, finally."],
  },
  Inform: {
    guided: ["___ is a kind of ___ that ___.", "One important feature of ___ is ___. Another is ___."],
    supported: ["Defining words: is a, is called, means, such as."],
  },
  Explain: {
    guided: ["___ happens because ___, which leads to ___.", "First ___. As a result, ___."],
    supported: ["Cause words: because, since, as a result, leads to."],
  },
  Argue: {
    guided: ["I believe ___ because ___.", "According to ___, ___. This shows that ___.", "Although some people say ___, ___."],
    supported: ["Claim, evidence, reasoning: I believe / According to / This shows."],
  },
};

/** Greek and Latin roots/affixes worth teaching in context (morphology scaffold). */
export const MORPHEMES = [
  { m: "bio", kind: "root", meaning: "life", examples: ["biology", "biodiversity"] },
  { m: "geo", kind: "root", meaning: "earth", examples: ["geography", "geology"] },
  { m: "hydro", kind: "root", meaning: "water", examples: ["hydrology", "hydroelectric"] },
  { m: "therm", kind: "root", meaning: "heat", examples: ["thermometer", "thermal"] },
  { m: "photo", kind: "root", meaning: "light", examples: ["photosynthesis", "photograph"] },
  { m: "port", kind: "root", meaning: "carry", examples: ["transport", "export", "import"] },
  { m: "struct", kind: "root", meaning: "build", examples: ["structure", "construct"] },
  { m: "spect", kind: "root", meaning: "look", examples: ["inspect", "perspective"] },
  { m: "dict", kind: "root", meaning: "say", examples: ["predict", "contradict"] },
  { m: "scrib", kind: "root", meaning: "write", examples: ["describe", "scribe"] },
  { m: "script", kind: "root", meaning: "write", examples: ["transcript", "manuscript"] },
  { m: "vert", kind: "root", meaning: "turn", examples: ["convert", "reverse"] },
  { m: "rupt", kind: "root", meaning: "break", examples: ["disrupt", "erupt"] },
  { m: "sect", kind: "root", meaning: "cut", examples: ["section", "intersect"] },
  { m: "demo", kind: "root", meaning: "people", examples: ["democracy", "demographic"] },
  { m: "ject", kind: "root", meaning: "throw", examples: ["project", "reject"] },
  { m: "un", kind: "prefix", meaning: "not", examples: ["unlikely", "unstable"] },
  { m: "in", kind: "prefix", meaning: "not", examples: ["inaccurate", "insufficient"] },
  { m: "im", kind: "prefix", meaning: "not", examples: ["impossible", "imbalance"] },
  { m: "dis", kind: "prefix", meaning: "not / apart", examples: ["disagree", "disconnect"] },
  { m: "re", kind: "prefix", meaning: "again", examples: ["rebuild", "revise"] },
  { m: "pre", kind: "prefix", meaning: "before", examples: ["predict", "prehistoric"] },
  { m: "inter", kind: "prefix", meaning: "between", examples: ["interact", "interstate"] },
  { m: "trans", kind: "prefix", meaning: "across", examples: ["transport", "transform"] },
  { m: "sub", kind: "prefix", meaning: "under", examples: ["subway", "subtract"] },
  { m: "mis", kind: "prefix", meaning: "wrongly", examples: ["misread", "misunderstand"] },
  { m: "tion", kind: "suffix", meaning: "act or result of (noun)", examples: ["pollution", "evaluation"] },
  { m: "ment", kind: "suffix", meaning: "result of (noun)", examples: ["movement", "government"] },
  { m: "ity", kind: "suffix", meaning: "state of (noun)", examples: ["community", "ability"] },
  { m: "ive", kind: "suffix", meaning: "tending to (adjective)", examples: ["effective", "persuasive"] },
  { m: "able", kind: "suffix", meaning: "can be (adjective)", examples: ["renewable", "predictable"] },
  { m: "ly", kind: "suffix", meaning: "in a way (adverb)", examples: ["slowly", "significantly"] },
];

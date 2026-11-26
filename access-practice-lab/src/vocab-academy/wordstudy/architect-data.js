// Word Architect — authored content. Pure data, no DOM. tools/vocab-academy-word-architect.test.mjs checks it.
//
// A word is built as [prefix] + root + [suffix]. Every combination of a root's prefix and suffix tiles is classified
// here exactly once, so the page never guesses:
//   words     real English words, with a kid-friendly meaning, part of speech, example and Spanish
//   rare      real words that big dictionaries list but people almost never use (we say so, and point to the common word)
//   nonwords  combinations that are not English words, each with a reason a learner can use
// The bare root (no prefix, no suffix) is either a word in `words` (port) or explained by `rootAlone`.
// `morph` names the matching part id in content/vocab-academy/morphology.json so the two data sets stay aligned.
// Spelling: words are the plain join of their parts, except where a rule in SPELLING applies (ex + spect → expect).
// The model applies the rules, the page shows the note, and the test checks every join.

export const POS = {
  noun: {
    a: "a noun",
    en: "noun",
    es: "sustantivo",
    cue: { en: "a person, place, thing or idea", es: "una persona, un lugar, una cosa o una idea" },
  },
  verb: { a: "a verb", en: "verb", es: "verbo", cue: { en: "an action word", es: "una palabra de acción" } },
  adjective: {
    a: "an adjective",
    en: "adjective",
    es: "adjetivo",
    cue: { en: "a word that describes", es: "una palabra que describe" },
  },
};

/**
 * Spelling rules applied when parts join. `prefixEnds` + `rootStarts`: the root's first letter is not written.
 * Matches content/vocab-academy/morphology.json (expect: surface ["ex", "pect"]).
 */
export const SPELLING = [
  {
    id: "ex-s",
    prefixEnds: "x",
    rootStarts: "s",
    note: { en: "The s of spect is not written after ex: ex + spect → expect.", es: "La s de spect no se escribe después de ex: ex + spect → expect." },
  },
];

/** Prefix and suffix tiles. `makes` on a suffix is the part of speech it builds. */
export const AFFIXES = {
  trans: {
    type: "prefix",
    form: "trans-",
    morph: "pre.trans",
    mean: { en: "across", es: "a través de" },
  },
  ex: { type: "prefix", form: "ex-", morph: "pre.ex", mean: { en: "out", es: "hacia fuera" } },
  con: { type: "prefix", form: "con-", morph: "pre.con", mean: { en: "together", es: "juntos" } },
  de: {
    type: "prefix",
    form: "de-",
    morph: "pre.de",
    mean: { en: "down; undo", es: "hacia abajo; deshacer" },
  },
  in: {
    type: "prefix",
    form: "in-",
    morph: "pre.in.into",
    mean: { en: "in; into", es: "en; hacia dentro" },
  },
  re: {
    type: "prefix",
    form: "re-",
    morph: "pre.re",
    mean: { en: "back; again", es: "de nuevo; hacia atrás" },
  },
  pre: { type: "prefix", form: "pre-", morph: "pre.pre", mean: { en: "before", es: "antes" } },
  contra: {
    type: "prefix",
    form: "contra-",
    morph: "pre.contra",
    mean: { en: "against", es: "en contra" },
  },
  e: { type: "prefix", form: "e-", morph: "pre.e", mean: { en: "out", es: "hacia fuera" } },
  inter: {
    type: "prefix",
    form: "inter-",
    morph: "pre.inter",
    mean: { en: "between", es: "entre" },
  },
  dis: {
    type: "prefix",
    form: "dis-",
    morph: "pre.dis",
    mean: { en: "apart", es: "separar; aparte" },
  },
  able: {
    type: "suffix",
    form: "-able",
    morph: "suf.able",
    makes: "adjective",
    mean: { en: "can be done", es: "que se puede" },
  },
  ation: {
    type: "suffix",
    form: "-ation",
    morph: "suf.ation",
    makes: "noun",
    mean: { en: "the act of", es: "la acción de" },
  },
  ion: {
    type: "suffix",
    form: "-ion",
    morph: "suf.ion",
    makes: "noun",
    mean: { en: "the act or result of", es: "la acción o el resultado de" },
  },
  ive: {
    type: "suffix",
    form: "-ive",
    morph: "suf.ive",
    makes: "adjective",
    mean: { en: "tending to; doing", es: "que tiende a; que hace" },
  },
  ful: {
    type: "suffix",
    form: "-ful",
    morph: "suf.ful",
    makes: "adjective",
    mean: { en: "full of", es: "lleno de" },
  },
  or: {
    type: "suffix",
    form: "-or",
    morph: "suf.or",
    makes: "noun",
    mean: { en: "a person who", es: "una persona que" },
  },
  ate: {
    type: "suffix",
    form: "-ate",
    morph: "suf.ate",
    makes: "verb",
    mean: { en: "to do; to make", es: "hacer" },
  },
};

// Universal grammar slots. The cue word in front of the blank is the lesson: a noun follows "the", an adjective
// follows "was", a verb follows "to". Each root writes its own verb sentence so the verbs read naturally.
export const SLOT_NOUN = {
  en: "We talked about the ___.",
  es: "Hablamos sobre el/la ___.",
  cue: { en: "After “the” comes a noun.", es: "Después de “the” va un sustantivo." },
};
export const SLOT_ADJ = {
  en: "Everyone agreed it was ___.",
  es: "Todos estuvieron de acuerdo en que era ___.",
  cue: {
    en: "After “it was” comes a word that describes: an adjective.",
    es: "Después de “it was” va una palabra que describe: un adjetivo.",
  },
};
export const VERB_CUE = {
  en: "After “to” comes a verb, an action word.",
  es: "Después de “to” va un verbo, una palabra de acción.",
};

/** Ungraded sentence frames for using a built word. `___` is replaced by the word. */
export const FRAMES = {
  noun: { en: "I think ___ is important because", es: "Creo que ___ es importante porque" },
  verb: { en: "One time I had to ___", es: "Una vez tuve que ___" },
  adjective: { en: "Something ___ that I know is", es: "Algo ___ que conozco es" },
};

const w = (p, s, word, pos, def, how, ex, es, extra = {}) => ({
  p,
  s,
  word,
  pos,
  def,
  how,
  ex,
  es,
  ...extra,
});
const sp = (word, cognate, note) => (note ? { word, cognate, note } : { word, cognate });

export const ROOTS = [
  {
    id: "port",
    form: "port",
    morph: "root.port",
    mean: { en: "carry", es: "llevar" },
    prefixes: ["trans", "ex"],
    suffixes: ["able", "ation", "ful"],
    verbSlot: { en: "Ships are used to ___ goods.", es: "Los barcos se usan para ___ mercancías." },
    words: [
      w(
        "",
        "",
        "port",
        "noun",
        {
          en: "a town or place by the water where ships load and unload goods",
          es: "un pueblo o lugar junto al agua donde los barcos cargan y descargan mercancías",
        },
        {
          en: "Port is also a whole word by itself: a harbor where ships carry goods in and out.",
          es: "Port también es una palabra completa: un puerto donde los barcos llevan mercancías hacia dentro y hacia fuera.",
        },
        { en: "The ship carried bananas into the port.", es: "El barco llevó plátanos al puerto." },
        sp("puerto", true),
      ),
      w(
        "",
        "able",
        "portable",
        "adjective",
        { en: "easy to carry or move", es: "fácil de llevar o mover" },
        {
          en: "port (carry) + -able (can be) = can be carried",
          es: "port (llevar) + -able (se puede) = se puede llevar",
        },
        {
          en: "Grandpa has a portable radio that he takes to the park.",
          es: "El abuelo tiene una radio portátil que lleva al parque.",
        },
        sp("portátil", true),
      ),
      w(
        "trans",
        "",
        "transport",
        "verb",
        {
          en: "to carry people or things from one place to another",
          es: "llevar personas o cosas de un lugar a otro",
        },
        {
          en: "trans- (across) + port (carry) = carry across",
          es: "trans- (a través de) + port (llevar) = llevar de un lado a otro",
        },
        {
          en: "Trucks transport fresh vegetables to the city every morning.",
          es: "Los camiones transportan verduras frescas a la ciudad cada mañana.",
        },
        sp("transportar", true),
        { also: ["noun"] },
      ),
      w(
        "trans",
        "able",
        "transportable",
        "adjective",
        {
          en: "able to be moved from one place to another",
          es: "que se puede mover de un lugar a otro",
        },
        {
          en: "transport (carry across) + -able (can be) = can be carried across",
          es: "transport (llevar de un lado a otro) + -able (se puede) = se puede llevar de un lado a otro",
        },
        {
          en: "The tiny house is transportable, so the family can move it on a truck.",
          es: "La casita es transportable, así que la familia la puede mover en un camión.",
        },
        sp("transportable", true),
      ),
      w(
        "trans",
        "ation",
        "transportation",
        "noun",
        {
          en: "a way of moving people or things from place to place, like buses, trains and trucks",
          es: "una manera de mover personas o cosas de un lugar a otro, como autobuses, trenes y camiones",
        },
        {
          en: "transport (carry across) + -ation (the act of) = the act of carrying across",
          es: "transport (llevar de un lado a otro) + -ation (la acción de) = la acción de llevar de un lado a otro",
        },
        {
          en: "Our city’s public transportation includes buses and a subway.",
          es: "El transporte público de nuestra ciudad incluye autobuses y un metro.",
        },
        sp("transportación, transporte", true),
      ),
      w(
        "ex",
        "",
        "export",
        "verb",
        {
          en: "to send goods to another country to sell them",
          es: "enviar mercancías a otro país para venderlas",
        },
        {
          en: "ex- (out) + port (carry) = carry out of a country",
          es: "ex- (hacia fuera) + port (llevar) = llevar fuera de un país",
        },
        {
          en: "Brazil exports coffee to many countries.",
          es: "Brasil exporta café a muchos países.",
        },
        sp("exportar", true),
        { also: ["noun"] },
      ),
      w(
        "ex",
        "able",
        "exportable",
        "adjective",
        {
          en: "able to be sent to another country to sell",
          es: "que se puede enviar a otro país para vender",
        },
        {
          en: "export (carry out) + -able (can be) = can be carried out to sell",
          es: "export (llevar fuera) + -able (se puede) = se puede llevar fuera para vender",
        },
        {
          en: "Fresh fish is exportable only if it stays cold on the trip.",
          es: "El pescado fresco solo es exportable si se mantiene frío durante el viaje.",
        },
        sp("exportable", true),
      ),
      w(
        "ex",
        "ation",
        "exportation",
        "noun",
        {
          en: "the act of sending goods to another country to sell",
          es: "la acción de enviar mercancías a otro país para vender",
        },
        {
          en: "export (carry out) + -ation (the act of) = the act of carrying out",
          es: "export (llevar fuera) + -ation (la acción de) = la acción de llevar fuera",
        },
        {
          en: "The exportation of coffee brings money to Brazil.",
          es: "La exportación de café trae dinero a Brasil.",
        },
        sp("exportación", true, {
          en: "In everyday English, people often just say “export” for this noun too.",
          es: "En el inglés de todos los días, mucha gente también dice simplemente “export” para este sustantivo.",
        }),
      ),
    ],
    rare: [
      {
        p: "",
        s: "ation",
        word: "portation",
        common: "transportation",
        why: {
          en: "Some very large dictionaries list portation, but people almost never use it. The word you want is transportation.",
          es: "Algunos diccionarios muy grandes incluyen portation, pero casi nadie la usa. La palabra que buscas es transportation.",
        },
      },
    ],
    nonwords: [
      {
        p: "",
        s: "ful",
        word: "portful",
        why: {
          en: "-ful means “full of.” It joins things or feelings you can be full of: hope → hopeful, care → careful. You cannot be full of carrying.",
          es: "-ful significa “lleno de”. Se une a cosas o sentimientos de los que puedes estar lleno: hope → hopeful, care → careful. No puedes estar lleno de llevar.",
        },
      },
      {
        p: "trans",
        s: "ful",
        word: "transportful",
        why: {
          en: "transport is an action, and -ful does not join actions. Try -able (transportable) or -ation (transportation).",
          es: "transport es una acción, y -ful no se une a acciones. Prueba -able (transportable) o -ation (transportation).",
        },
      },
      {
        p: "ex",
        s: "ful",
        word: "exportful",
        why: {
          en: "export is an action, and -ful does not join actions. Try -able (exportable) or -ation (exportation).",
          es: "export es una acción, y -ful no se une a acciones. Prueba -able (exportable) o -ation (exportation).",
        },
      },
    ],
    transfer: {
      word: "reporter",
      parts: [
        { form: "re-", type: "prefix", mean: { en: "back", es: "de vuelta" } },
        { form: "port", type: "root", mean: { en: "carry", es: "llevar" } },
        { form: "-er", type: "suffix", mean: { en: "a person who", es: "una persona que" } },
      ],
      choices: [
        {
          id: "a",
          en: "a person who carries news back to people",
          es: "una persona que lleva noticias de vuelta a la gente",
        },
        { id: "b", en: "a machine that carries boxes", es: "una máquina que lleva cajas" },
        { id: "c", en: "to carry something a second time", es: "llevar algo por segunda vez" },
        { id: "d", en: "a place where ships stop", es: "un lugar donde paran los barcos" },
      ],
      answer: "a",
      es: "reportero, reportera",
    },
  },
  {
    id: "struct",
    form: "struct",
    morph: "root.struct",
    mean: { en: "build", es: "construir" },
    prefixes: ["con", "de", "in"],
    suffixes: ["ion", "ive"],
    verbSlot: { en: "Our job today is to ___.", es: "Nuestro trabajo hoy es ___." },
    rootAlone: {
      en: "struct is a root. It carries the meaning “build,” but it is not a word on its own. Add a prefix or a suffix.",
      es: "struct es una raíz. Lleva el significado “construir”, pero no es una palabra por sí sola. Agrega un prefijo o un sufijo.",
    },
    words: [
      w(
        "con",
        "",
        "construct",
        "verb",
        {
          en: "to build something by putting parts together",
          es: "construir algo juntando sus partes",
        },
        {
          en: "con- (together) + struct (build) = build together",
          es: "con- (juntos) + struct (construir) = construir juntando",
        },
        {
          en: "The class constructed a bridge out of craft sticks.",
          es: "La clase construyó un puente con palitos de manualidades.",
        },
        sp("construir", true),
      ),
      w(
        "con",
        "ion",
        "construction",
        "noun",
        {
          en: "the work of building something, or the thing that is built",
          es: "el trabajo de construir algo, o la cosa que se construye",
        },
        {
          en: "construct (build together) + -ion (the act of) = the act of building",
          es: "construct (construir juntando) + -ion (la acción de) = la acción de construir",
        },
        {
          en: "The construction of the new school will take a year.",
          es: "La construcción de la nueva escuela tomará un año.",
        },
        sp("construcción", true),
      ),
      w(
        "con",
        "ive",
        "constructive",
        "adjective",
        { en: "helpful; meant to make something better", es: "útil; que busca mejorar algo" },
        {
          en: "construct (build) + -ive (tending to) = tending to build up",
          es: "construct (construir) + -ive (que tiende a) = que tiende a construir y mejorar",
        },
        {
          en: "My teacher gave me constructive feedback on my essay.",
          es: "Mi maestra me dio comentarios constructivos sobre mi ensayo.",
        },
        sp("constructivo", true),
      ),
      w(
        "de",
        "ion",
        "destruction",
        "noun",
        {
          en: "great damage; the act of ruining something completely",
          es: "un gran daño; la acción de arruinar algo por completo",
        },
        {
          en: "de- (down; undo) + struct (build) + -ion (the act of) = the act of tearing down what was built",
          es: "de- (deshacer) + struct (construir) + -ion (la acción de) = la acción de derribar lo construido",
        },
        {
          en: "The storm caused destruction along the coast.",
          es: "La tormenta causó destrucción a lo largo de la costa.",
        },
        sp("destrucción", true),
      ),
      w(
        "de",
        "ive",
        "destructive",
        "adjective",
        { en: "causing a lot of damage", es: "que causa mucho daño" },
        {
          en: "de- (undo) + struct (build) + -ive (tending to) = tending to tear down",
          es: "de- (deshacer) + struct (construir) + -ive (que tiende a) = que tiende a derribar",
        },
        {
          en: "Termites can be destructive to wooden houses.",
          es: "Las termitas pueden ser destructivas para las casas de madera.",
        },
        sp("destructivo", true),
      ),
      w(
        "in",
        "",
        "instruct",
        "verb",
        {
          en: "to teach someone or tell them what to do",
          es: "enseñar a alguien o decirle qué hacer",
        },
        {
          en: "in- (into) + struct (build) = build knowledge into someone",
          es: "in- (hacia dentro) + struct (construir) = construir conocimiento dentro de alguien",
        },
        {
          en: "The coach instructed us to stretch before the game.",
          es: "El entrenador nos indicó que estiráramos antes del partido.",
        },
        sp("instruir", true),
      ),
      w(
        "in",
        "ion",
        "instruction",
        "noun",
        {
          en: "words that tell you how to do something",
          es: "palabras que te dicen cómo hacer algo",
        },
        {
          en: "instruct (teach) + -ion (the act or result of) = what you are taught",
          es: "instruct (enseñar) + -ion (la acción o el resultado de) = lo que te enseñan",
        },
        {
          en: "Read each instruction before you start the experiment.",
          es: "Lee cada instrucción antes de empezar el experimento.",
        },
        sp("instrucción", true),
      ),
      w(
        "in",
        "ive",
        "instructive",
        "adjective",
        {
          en: "giving useful information; helping you learn",
          es: "que da información útil; que te ayuda a aprender",
        },
        {
          en: "instruct (teach) + -ive (tending to) = tending to teach",
          es: "instruct (enseñar) + -ive (que tiende a) = que tiende a enseñar",
        },
        {
          en: "The museum visit was instructive and fun.",
          es: "La visita al museo fue instructiva y divertida.",
        },
        sp("instructivo", true),
      ),
    ],
    rare: [
      {
        p: "de",
        s: "",
        word: "destruct",
        common: "destroy",
        why: {
          en: "destruct is a real but rare verb, used mostly in “self-destruct.” Most people say destroy.",
          es: "destruct es un verbo real pero poco común; se usa sobre todo en “self-destruct”. Casi todos dicen destroy.",
        },
      },
    ],
    nonwords: [
      {
        p: "",
        s: "ion",
        word: "struction",
        why: {
          en: "-ion joins a verb, like construct → construction. struct by itself is not a verb, so it needs a prefix first.",
          es: "-ion se une a un verbo, como construct → construction. struct por sí sola no es un verbo, así que primero necesita un prefijo.",
        },
      },
      {
        p: "",
        s: "ive",
        word: "structive",
        why: {
          en: "struct needs a prefix before -ive can join it: constructive, destructive, instructive.",
          es: "struct necesita un prefijo antes de que -ive se pueda unir: constructive, destructive, instructive.",
        },
      },
    ],
    transfer: {
      word: "reconstruct",
      parts: [
        { form: "re-", type: "prefix", mean: { en: "again", es: "de nuevo" } },
        { form: "con-", type: "prefix", mean: { en: "together", es: "juntos" } },
        { form: "struct", type: "root", mean: { en: "build", es: "construir" } },
      ],
      choices: [
        { id: "a", en: "to break something into pieces", es: "romper algo en pedazos" },
        {
          id: "b",
          en: "to build something again after it was damaged",
          es: "construir algo de nuevo después de que se dañó",
        },
        { id: "c", en: "a person who builds houses", es: "una persona que construye casas" },
        { id: "d", en: "the plan for a building", es: "el plano de un edificio" },
      ],
      answer: "b",
      es: "reconstruir",
    },
  },
  {
    id: "spect",
    form: "spect",
    morph: "root.spect",
    mean: { en: "look", es: "mirar" },
    prefixes: ["in", "re", "ex"],
    suffixes: ["ion", "or", "ful"],
    verbSlot: { en: "It is wise to ___ the facts.", es: "Es sabio ___ los hechos." },
    rootAlone: {
      en: "spect is a root. It carries the meaning “look,” but it is not a word on its own. Add a prefix.",
      es: "spect es una raíz. Lleva el significado “mirar”, pero no es una palabra por sí sola. Agrega un prefijo.",
    },
    words: [
      w(
        "in",
        "",
        "inspect",
        "verb",
        {
          en: "to look at something closely to check it",
          es: "mirar algo de cerca para revisarlo",
        },
        {
          en: "in- (into) + spect (look) = look into",
          es: "in- (hacia dentro) + spect (mirar) = mirar por dentro",
        },
        {
          en: "The mechanic inspected the bike’s brakes.",
          es: "El mecánico inspeccionó los frenos de la bicicleta.",
        },
        sp("inspeccionar", true),
      ),
      w(
        "in",
        "ion",
        "inspection",
        "noun",
        {
          en: "a careful look to check that something is safe or correct",
          es: "una revisión cuidadosa para comprobar que algo es seguro o correcto",
        },
        {
          en: "inspect (look into) + -ion (the act of) = the act of looking into",
          es: "inspect (mirar por dentro) + -ion (la acción de) = la acción de revisar",
        },
        {
          en: "The restaurant passed its health inspection.",
          es: "El restaurante pasó su inspección de salud.",
        },
        sp("inspección", true),
      ),
      w(
        "in",
        "or",
        "inspector",
        "noun",
        {
          en: "a person whose job is to look closely and check things",
          es: "una persona cuyo trabajo es mirar de cerca y revisar cosas",
        },
        {
          en: "inspect (look into) + -or (a person who) = a person who looks into things",
          es: "inspect (mirar por dentro) + -or (una persona que) = una persona que revisa",
        },
        {
          en: "The inspector checked every fire alarm in the building.",
          es: "La inspectora revisó cada alarma de incendios del edificio.",
        },
        sp("inspector, inspectora", true),
      ),
      w(
        "re",
        "",
        "respect",
        "verb",
        {
          en: "to show that you think someone or something is important and deserves good treatment",
          es: "mostrar que alguien o algo es importante y merece buen trato",
        },
        {
          en: "re- (back) + spect (look) = look back at, look at with care",
          es: "re- (hacia atrás) + spect (mirar) = volver a mirar, mirar con cuidado",
        },
        {
          en: "We respect our classmates’ ideas, even when we disagree.",
          es: "Respetamos las ideas de nuestros compañeros, aunque no estemos de acuerdo.",
        },
        sp("respetar", true),
        { also: ["noun"] },
      ),
      w(
        "re",
        "ful",
        "respectful",
        "adjective",
        { en: "polite; showing respect", es: "cortés; que muestra respeto" },
        {
          en: "respect + -ful (full of) = full of respect",
          es: "respect + -ful (lleno de) = lleno de respeto",
        },
        {
          en: "Please use a respectful voice in the library.",
          es: "Por favor usa una voz respetuosa en la biblioteca.",
        },
        sp("respetuoso, respetuosa", true),
      ),
      w(
        "ex",
        "",
        "expect",
        "verb",
        { en: "to think that something will happen", es: "pensar que algo va a pasar" },
        {
          en: "ex- (out) + spect (look) = look out for something that is coming",
          es: "ex- (hacia fuera) + spect (mirar) = estar atento a algo que viene",
        },
        {
          en: "We expect rain this afternoon, so bring an umbrella.",
          es: "Esperamos lluvia esta tarde, así que trae un paraguas.",
        },
        sp("esperar", false, {
          en: "Not a cognate. The Spanish noun expectativa (expectation) does share the root.",
          es: "No es un cognado. El sustantivo expectativa sí comparte la raíz.",
        }),
      ),
    ],
    rare: [],
    nonwords: [
      {
        p: "",
        s: "ion",
        word: "spection",
        why: {
          en: "spect needs a prefix first: in + spect + ion = inspection.",
          es: "spect primero necesita un prefijo: in + spect + ion = inspection.",
        },
      },
      {
        p: "",
        s: "or",
        word: "spector",
        why: {
          en: "spect needs a prefix first: in + spect + or = inspector.",
          es: "spect primero necesita un prefijo: in + spect + or = inspector.",
        },
      },
      {
        p: "",
        s: "ful",
        word: "spectful",
        why: {
          en: "spect needs a prefix first: re + spect + ful = respectful.",
          es: "spect primero necesita un prefijo: re + spect + ful = respectful.",
        },
      },
      {
        p: "in",
        s: "ful",
        word: "inspectful",
        why: {
          en: "-ful means “full of,” and you cannot be full of inspecting. Try -ion or -or.",
          es: "-ful significa “lleno de”, y no puedes estar lleno de inspeccionar. Prueba -ion o -or.",
        },
      },
      {
        p: "re",
        s: "ion",
        word: "respection",
        why: {
          en: "respect is already a noun as well as a verb (“We show respect”), so it does not need -ion.",
          es: "respect ya es sustantivo además de verbo (“We show respect”), así que no necesita -ion.",
        },
      },
      {
        p: "re",
        s: "or",
        word: "respector",
        why: {
          en: "English does not name a person this way. We say “a respectful person.”",
          es: "El inglés no nombra a una persona de esta manera. Decimos “a respectful person”.",
        },
      },
      {
        p: "ex",
        s: "ion",
        word: "expection",
        why: {
          en: "Close! The real noun is expectation. It adds -ation, not -ion: expect + ation.",
          es: "¡Casi! El sustantivo real es expectation. Lleva -ation, no -ion: expect + ation.",
        },
      },
      {
        p: "ex",
        s: "or",
        word: "expector",
        why: {
          en: "English does not name a person this way. Try in + spect + or = inspector.",
          es: "El inglés no nombra a una persona de esta manera. Prueba in + spect + or = inspector.",
        },
      },
      {
        p: "ex",
        s: "ful",
        word: "expectful",
        why: {
          en: "-ful does not join expect. The describing word is expectant (waiting for something).",
          es: "-ful no se une a expect. La palabra que describe es expectant (que espera algo).",
        },
      },
    ],
    transfer: {
      word: "spectator",
      parts: [
        { form: "spect", type: "root", mean: { en: "look", es: "mirar" } },
        { form: "-ator", type: "suffix", mean: { en: "a person who", es: "una persona que" } },
      ],
      choices: [
        {
          id: "a",
          en: "a tool for looking at stars",
          es: "una herramienta para mirar las estrellas",
        },
        {
          id: "b",
          en: "to look closely to check something",
          es: "mirar de cerca para revisar algo",
        },
        { id: "c", en: "a person who watches an event", es: "una persona que mira un evento" },
        { id: "d", en: "a careful look", es: "una mirada cuidadosa" },
      ],
      answer: "c",
      es: "espectador, espectadora",
    },
  },
  {
    id: "dict",
    form: "dict",
    morph: "root.dict",
    mean: { en: "say", es: "decir" },
    prefixes: ["pre", "contra"],
    suffixes: ["ion", "able", "ate"],
    verbSlot: {
      en: "In this game, you try to ___ what the robot says.",
      es: "En este juego, tratas de ___ lo que dice el robot.",
    },
    rootAlone: {
      en: "dict is a root. It carries the meaning “say,” but it is not a word on its own. Add a prefix or a suffix.",
      es: "dict es una raíz. Lleva el significado “decir”, pero no es una palabra por sí sola. Agrega un prefijo o un sufijo.",
    },
    words: [
      w(
        "",
        "ion",
        "diction",
        "noun",
        {
          en: "the way a person says words; how clearly they speak",
          es: "la manera en que una persona dice las palabras; qué tan claro habla",
        },
        {
          en: "dict (say) + -ion (the act of) = the act of saying",
          es: "dict (decir) + -ion (la acción de) = la acción de decir",
        },
        {
          en: "The singer’s diction was so clear that we understood every word.",
          es: "La dicción de la cantante era tan clara que entendimos cada palabra.",
        },
        sp("dicción", true),
      ),
      w(
        "",
        "ate",
        "dictate",
        "verb",
        {
          en: "to say words out loud so someone else can write them down",
          es: "decir palabras en voz alta para que otra persona las escriba",
        },
        {
          en: "dict (say) + -ate (to do) = to say words for writing",
          es: "dict (decir) + -ate (hacer) = decir palabras para que se escriban",
        },
        {
          en: "Our teacher dictated three sentences, and we wrote them down.",
          es: "Nuestro maestro dictó tres oraciones y las escribimos.",
        },
        sp("dictar", true),
      ),
      w(
        "pre",
        "",
        "predict",
        "verb",
        {
          en: "to say what you think will happen before it happens",
          es: "decir lo que crees que va a pasar antes de que pase",
        },
        {
          en: "pre- (before) + dict (say) = say before",
          es: "pre- (antes) + dict (decir) = decir antes",
        },
        {
          en: "Can you predict how the story will end?",
          es: "¿Puedes predecir cómo terminará el cuento?",
        },
        sp("predecir", true),
      ),
      w(
        "pre",
        "ion",
        "prediction",
        "noun",
        { en: "a guess about what will happen", es: "una suposición sobre lo que va a pasar" },
        {
          en: "predict (say before) + -ion (the result of) = something said before it happens",
          es: "predict (decir antes) + -ion (el resultado de) = algo que se dice antes de que pase",
        },
        {
          en: "My prediction was right: the ice melted in ten minutes.",
          es: "Mi predicción fue correcta: el hielo se derritió en diez minutos.",
        },
        sp("predicción", true),
      ),
      w(
        "pre",
        "able",
        "predictable",
        "adjective",
        {
          en: "easy to know ahead of time; happening the way you expected",
          es: "fácil de saber de antemano; que pasa como esperabas",
        },
        {
          en: "predict (say before) + -able (can be) = can be said before it happens",
          es: "predict (decir antes) + -able (se puede) = se puede decir antes de que pase",
        },
        {
          en: "The movie was so predictable that I guessed the ending.",
          es: "La película era tan predecible que adiviné el final.",
        },
        sp("predecible", true),
      ),
      w(
        "contra",
        "",
        "contradict",
        "verb",
        {
          en: "to say the opposite of what someone else said",
          es: "decir lo contrario de lo que otra persona dijo",
        },
        {
          en: "contra- (against) + dict (say) = say against",
          es: "contra- (en contra) + dict (decir) = decir en contra",
        },
        {
          en: "The second witness contradicted the first one.",
          es: "El segundo testigo contradijo al primero.",
        },
        sp("contradecir", true),
      ),
      w(
        "contra",
        "ion",
        "contradiction",
        "noun",
        {
          en: "two ideas or statements that cannot both be true",
          es: "dos ideas o afirmaciones que no pueden ser ciertas al mismo tiempo",
        },
        {
          en: "contradict (say against) + -ion (the result of) = ideas that say against each other",
          es: "contradict (decir en contra) + -ion (el resultado de) = ideas que se contradicen",
        },
        {
          en: "Saying you hate pizza and then eating four slices is a contradiction.",
          es: "Decir que odias la pizza y luego comer cuatro pedazos es una contradicción.",
        },
        sp("contradicción", true),
      ),
    ],
    rare: [
      {
        p: "contra",
        s: "able",
        word: "contradictable",
        common: "",
        why: {
          en: "Some big dictionaries list contradictable, but you will almost never see it.",
          es: "Algunos diccionarios grandes incluyen contradictable, pero casi nunca la verás.",
        },
      },
    ],
    nonwords: [
      {
        p: "",
        s: "able",
        word: "dictable",
        why: {
          en: "-able needs a verb to join. dict is not a verb, but predict is: predict + able = predictable.",
          es: "-able necesita unirse a un verbo. dict no es un verbo, pero predict sí: predict + able = predictable.",
        },
      },
      {
        p: "pre",
        s: "ate",
        word: "predictate",
        why: {
          en: "predict is already a verb, so it does not need -ate. It looks a little like predicate, which is a different word.",
          es: "predict ya es un verbo, así que no necesita -ate. Se parece un poco a predicate, que es otra palabra.",
        },
      },
      {
        p: "contra",
        s: "ate",
        word: "contradictate",
        why: {
          en: "contradict is already a verb, so it does not need -ate.",
          es: "contradict ya es un verbo, así que no necesita -ate.",
        },
      },
    ],
    transfer: {
      word: "unpredictable",
      parts: [
        { form: "un-", type: "prefix", mean: { en: "not", es: "no" } },
        { form: "pre-", type: "prefix", mean: { en: "before", es: "antes" } },
        { form: "dict", type: "root", mean: { en: "say", es: "decir" } },
        { form: "-able", type: "suffix", mean: { en: "can be", es: "se puede" } },
      ],
      choices: [
        { id: "a", en: "easy to guess", es: "fácil de adivinar" },
        { id: "b", en: "to say something again", es: "decir algo otra vez" },
        { id: "c", en: "a person who makes guesses", es: "una persona que adivina" },
        {
          id: "d",
          en: "not able to be known ahead of time",
          es: "que no se puede saber de antemano",
        },
      ],
      answer: "d",
      es: "impredecible",
    },
  },
  {
    id: "rupt",
    form: "rupt",
    morph: "root.rupt",
    mean: { en: "break", es: "romper" },
    prefixes: ["e", "inter", "dis"],
    suffixes: ["ion", "ive"],
    verbSlot: { en: "Please try not to ___.", es: "Por favor trata de no ___." },
    rootAlone: {
      en: "rupt is a root. It carries the meaning “break,” but it is not a word on its own. Add a prefix.",
      es: "rupt es una raíz. Lleva el significado “romper”, pero no es una palabra por sí sola. Agrega un prefijo.",
    },
    words: [
      w(
        "e",
        "",
        "erupt",
        "verb",
        {
          en: "to burst out suddenly, like lava from a volcano",
          es: "salir de golpe, como la lava de un volcán",
        },
        {
          en: "e- (out) + rupt (break) = break out",
          es: "e- (hacia fuera) + rupt (romper) = romper hacia fuera",
        },
        {
          en: "The volcano erupted and sent ash into the sky.",
          es: "El volcán hizo erupción y lanzó ceniza al cielo.",
        },
        sp("hacer erupción", true),
      ),
      w(
        "e",
        "ion",
        "eruption",
        "noun",
        {
          en: "a sudden bursting out, like lava from a volcano",
          es: "una salida repentina, como la lava de un volcán",
        },
        {
          en: "erupt (break out) + -ion (the act of) = the act of breaking out",
          es: "erupt (romper hacia fuera) + -ion (la acción de) = la acción de salir de golpe",
        },
        {
          en: "Scientists watched the eruption from a safe distance.",
          es: "Los científicos observaron la erupción desde una distancia segura.",
        },
        sp("erupción", true),
      ),
      w(
        "e",
        "ive",
        "eruptive",
        "adjective",
        {
          en: "bursting out, or likely to burst out (often said about volcanoes)",
          es: "que sale de golpe o que puede salir de golpe (se dice a menudo de los volcanes)",
        },
        {
          en: "erupt (break out) + -ive (tending to) = tending to break out",
          es: "erupt (romper hacia fuera) + -ive (que tiende a) = que tiende a salir de golpe",
        },
        {
          en: "Scientists study the volcano’s eruptive history to keep people safe.",
          es: "Los científicos estudian la historia eruptiva del volcán para proteger a la gente.",
        },
        sp("eruptivo", true),
      ),
      w(
        "inter",
        "",
        "interrupt",
        "verb",
        {
          en: "to stop someone while they are talking or doing something",
          es: "detener a alguien mientras habla o hace algo",
        },
        {
          en: "inter- (between) + rupt (break) = break in between",
          es: "inter- (entre) + rupt (romper) = romper en medio",
        },
        {
          en: "Please don’t interrupt your sister while she is speaking.",
          es: "Por favor no interrumpas a tu hermana mientras habla.",
        },
        sp("interrumpir", true),
      ),
      w(
        "inter",
        "ion",
        "interruption",
        "noun",
        {
          en: "something that stops an activity for a moment",
          es: "algo que detiene una actividad por un momento",
        },
        {
          en: "interrupt (break in between) + -ion (the act of) = a break in the middle",
          es: "interrupt (romper en medio) + -ion (la acción de) = una pausa en medio",
        },
        {
          en: "The fire drill was an interruption to our math lesson.",
          es: "El simulacro de incendio fue una interrupción en nuestra clase de matemáticas.",
        },
        sp("interrupción", true),
      ),
      w(
        "dis",
        "",
        "disrupt",
        "verb",
        {
          en: "to stop something from going on in the normal way",
          es: "impedir que algo siga de la manera normal",
        },
        {
          en: "dis- (apart) + rupt (break) = break apart",
          es: "dis- (aparte) + rupt (romper) = romper en pedazos",
        },
        {
          en: "Loud noise in the hallway disrupted the class.",
          es: "El ruido fuerte en el pasillo alteró la clase.",
        },
        sp("alterar, interrumpir", false, {
          en: "Not a cognate for the verb, but the noun is: disruption → disrupción.",
          es: "El verbo no es cognado, pero el sustantivo sí: disruption → disrupción.",
        }),
      ),
      w(
        "dis",
        "ion",
        "disruption",
        "noun",
        { en: "something that stops normal activity", es: "algo que detiene la actividad normal" },
        {
          en: "disrupt (break apart) + -ion (the result of) = a break in what is normal",
          es: "disrupt (romper en pedazos) + -ion (el resultado de) = un corte en lo normal",
        },
        {
          en: "The snowstorm caused a disruption in bus service.",
          es: "La tormenta de nieve causó una interrupción en el servicio de autobuses.",
        },
        sp("disrupción, interrupción", true),
      ),
      w(
        "dis",
        "ive",
        "disruptive",
        "adjective",
        {
          en: "causing trouble so that things cannot go on normally",
          es: "que causa problemas y no deja que las cosas sigan con normalidad",
        },
        {
          en: "disrupt (break apart) + -ive (tending to) = tending to break things apart",
          es: "disrupt (romper en pedazos) + -ive (que tiende a) = que tiende a romper el orden",
        },
        {
          en: "Talking during the movie is disruptive.",
          es: "Hablar durante la película es disruptivo.",
        },
        sp("disruptivo", true),
      ),
    ],
    rare: [
      {
        p: "inter",
        s: "ive",
        word: "interruptive",
        common: "disruptive",
        why: {
          en: "interruptive is a real but uncommon word. Most people say disruptive.",
          es: "interruptive es una palabra real pero poco común. Casi todos dicen disruptive.",
        },
      },
    ],
    nonwords: [
      {
        p: "",
        s: "ion",
        word: "ruption",
        why: {
          en: "rupt needs a prefix first: e + rupt + ion = eruption.",
          es: "rupt primero necesita un prefijo: e + rupt + ion = eruption.",
        },
      },
      {
        p: "",
        s: "ive",
        word: "ruptive",
        why: {
          en: "rupt needs a prefix first: dis + rupt + ive = disruptive.",
          es: "rupt primero necesita un prefijo: dis + rupt + ive = disruptive.",
        },
      },
    ],
    transfer: {
      word: "uninterrupted",
      parts: [
        { form: "un-", type: "prefix", mean: { en: "not", es: "no" } },
        { form: "inter-", type: "prefix", mean: { en: "between", es: "entre" } },
        { form: "rupt", type: "root", mean: { en: "break", es: "romper" } },
        {
          form: "-ed",
          type: "suffix",
          mean: { en: "describes what happened", es: "describe lo que pasó" },
        },
      ],
      choices: [
        { id: "a", en: "going on without being stopped", es: "que sigue sin que lo detengan" },
        { id: "b", en: "stopped many times", es: "detenido muchas veces" },
        { id: "c", en: "broken into two pieces", es: "roto en dos pedazos" },
        { id: "d", en: "a loud noise", es: "un ruido fuerte" },
      ],
      answer: "a",
      es: "ininterrumpido",
    },
  },
];

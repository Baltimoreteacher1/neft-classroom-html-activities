// Grades 6–8 layer for the templates both bands share (src/book/templates-*.js are written for grades 3–5 by default).
// For each template: the language goals, the word bank and "You will make" a 6–8 writer works toward. Sentence frames
// already differ per page (`frames68`). `templateForBand()` is the one place a template meets a band; the create
// page, the bookshelf cards and the editor's word bank all read it. Pure data: Node-testable.
const tr = (en, es) => ({ en, es });
const words = (list) => list.map(([en, es]) => tr(en, es));

const G68 = {
  "personal-narrative": {
    finished: tr(
      "A 6-page memoir about one turning point, with a scene-setting lead, a slowed-down key moment and a reflection, narrated in your voice.",
      "Unas memorias de 6 páginas sobre un momento decisivo, con un comienzo que crea la escena, un momento clave contado despacio y una reflexión, narradas con tu voz.",
    ),
    targets: [
      tr(
        "Open with a scene, dialogue or thought that drops the reader into the moment.",
        "Empieza con una escena, un diálogo o un pensamiento que ponga al lector en el momento.",
      ),
      tr(
        "Slow down the key moment with dialogue, sensory detail and inner thoughts; summarize the rest.",
        "Haz más lento el momento clave con diálogo, detalles sensoriales y pensamientos; resume lo demás.",
      ),
      tr(
        "Reflect on why the moment mattered with I realized ___ / Since then, ___.",
        "Reflexiona sobre por qué importó el momento con Me di cuenta de que ___ / Desde entonces, ___.",
      ),
    ],
    wordBank: words([
      ["meanwhile", "mientras tanto"],
      ["in that instant", "en ese instante"],
      ["I realized", "me di cuenta"],
      ["reluctant", "reacio"],
      ["overwhelmed", "abrumado"],
      ["determined", "decidido"],
      ["turning point", "momento decisivo"],
      ["looking back", "al recordar"],
      ["since then", "desde entonces"],
      ["significant", "significativo"],
    ]),
  },
  "my-community": {
    finished: tr(
      "A 6-page community profile with a map, sourced facts, an interview quote and a proposal to improve one place.",
      "Un perfil de 6 páginas de tu comunidad con un mapa, datos con fuente, una cita de entrevista y una propuesta para mejorar un lugar.",
    ),
    targets: [
      tr(
        "Introduce the community and preview how the book is organized.",
        "Presenta la comunidad y anticipa cómo está organizado el libro.",
      ),
      tr(
        "Support each section with a fact, a quote from an interview or an observation, and say where it came from.",
        "Apoya cada sección con un dato, una cita de una entrevista o una observación, y di de dónde viene.",
      ),
      tr(
        "Propose one improvement and explain its effect with If ___, then ___ would ___.",
        "Propón una mejora y explica su efecto con Si ___, entonces ___.",
      ),
    ],
    wordBank: words([
      ["resident", "residente"],
      ["according to", "según"],
      ["landmark", "lugar emblemático"],
      ["population", "población"],
      ["resource", "recurso"],
      ["heritage", "herencia"],
      ["interview", "entrevista"],
      ["propose", "proponer"],
      ["benefit", "beneficio"],
      ["in contrast", "en cambio"],
    ]),
  },
  "science-investigation": {
    finished: tr(
      "A 6-page lab report with a testable question, a controlled procedure, a data table or graph, and a claim-evidence-reasoning conclusion.",
      "Un informe de laboratorio de 6 páginas con una pregunta comprobable, un procedimiento controlado, una tabla o gráfica de datos y una conclusión con afirmación, evidencia y razonamiento.",
    ),
    targets: [
      tr(
        "Name the independent, dependent and controlled variables.",
        "Nombra las variables independiente, dependiente y controladas.",
      ),
      tr(
        "Describe trends in the data with increased, decreased, remained constant and by how much.",
        "Describe las tendencias de los datos con aumentó, disminuyó, se mantuvo igual y cuánto.",
      ),
      tr(
        "Write a conclusion with a claim, evidence and reasoning, and name one source of error.",
        "Escribe una conclusión con afirmación, evidencia y razonamiento, y nombra una fuente de error.",
      ),
    ],
    wordBank: words([
      ["independent variable", "variable independiente"],
      ["dependent variable", "variable dependiente"],
      ["controlled variable", "variable controlada"],
      ["trial", "prueba"],
      ["trend", "tendencia"],
      ["increased", "aumentó"],
      ["remained constant", "se mantuvo constante"],
      ["the data suggest", "los datos sugieren"],
      ["source of error", "fuente de error"],
      ["reasoning", "razonamiento"],
    ]),
  },
  "character-setting": {
    finished: tr(
      "A 6-page story that develops a character through actions, dialogue and setting, and shows how a conflict changes them.",
      "Un cuento de 6 páginas que desarrolla a un personaje con acciones, diálogo y ambiente, y muestra cómo un conflicto lo cambia.",
    ),
    targets: [
      tr(
        "Show traits through what the character says, does and thinks, not only adjectives.",
        "Muestra los rasgos con lo que el personaje dice, hace y piensa, no solo con adjetivos.",
      ),
      tr(
        "Use the setting to build mood with precise sensory language.",
        "Usa el ambiente para crear un estado de ánimo con lenguaje sensorial preciso.",
      ),
      tr(
        "Show internal or external conflict and how the character changes because of it.",
        "Muestra un conflicto interno o externo y cómo el personaje cambia por él.",
      ),
    ],
    wordBank: words([
      ["motivation", "motivación"],
      ["conflict", "conflicto"],
      ["internal", "interno"],
      ["external", "externo"],
      ["mood", "estado de ánimo"],
      ["atmosphere", "ambiente"],
      ["hesitated", "dudó"],
      ["defiant", "desafiante"],
      ["transformed", "se transformó"],
      ["despite", "a pesar de"],
    ]),
  },
  "vocabulary-picture-book": {
    finished: tr(
      "A 6-page academic word book: four content words, each with a definition, word parts, an example, a non-example and a sentence from the unit.",
      "Un libro de 6 páginas de palabras académicas: cuatro palabras del contenido, cada una con definición, partes de la palabra, ejemplo, no ejemplo y una oración de la unidad.",
    ),
    targets: [
      tr(
        "Define each word precisely, naming its category and what makes it different.",
        "Define cada palabra con precisión, nombrando su categoría y lo que la hace diferente.",
      ),
      tr(
        "Break words into roots, prefixes and suffixes and connect them to related words.",
        "Divide las palabras en raíces, prefijos y sufijos, y conéctalas con palabras relacionadas.",
      ),
      tr(
        "Use each word in a sentence about the unit's content, not only everyday life.",
        "Usa cada palabra en una oración sobre el contenido de la unidad, no solo de la vida diaria.",
      ),
    ],
    wordBank: words([
      ["defined as", "se define como"],
      ["category", "categoría"],
      ["characteristic", "característica"],
      ["root", "raíz"],
      ["prefix", "prefijo"],
      ["suffix", "sufijo"],
      ["related to", "relacionado con"],
      ["in contrast to", "a diferencia de"],
      ["context", "contexto"],
      ["cognate", "cognado"],
    ]),
  },
  "cause-effect": {
    finished: tr(
      "A 5-page explanation of a cause-and-effect chain with a diagram, evidence for each link and a conclusion about why it matters.",
      "Una explicación de 5 páginas de una cadena de causas y efectos con un diagrama, evidencia para cada eslabón y una conclusión sobre por qué importa.",
    ),
    targets: [
      tr(
        "Explain multiple causes or effects, not just one, and show how they connect.",
        "Explica varias causas o efectos, no solo uno, y muestra cómo se conectan.",
      ),
      tr(
        "Use precise transitions: consequently, as a result, due to, which led to.",
        "Usa transiciones precisas: por consiguiente, como resultado, debido a, lo que llevó a.",
      ),
      tr(
        "Support each link with a fact or example.",
        "Apoya cada eslabón con un dato o un ejemplo.",
      ),
    ],
    wordBank: words([
      ["consequently", "por consiguiente"],
      ["due to", "debido a"],
      ["as a result", "como resultado"],
      ["which led to", "lo que llevó a"],
      ["triggered", "desencadenó"],
      ["contributed to", "contribuyó a"],
      ["impact", "impacto"],
      ["factor", "factor"],
      ["chain reaction", "reacción en cadena"],
      ["therefore", "por lo tanto"],
    ]),
  },
  "compare-contrast": {
    finished: tr(
      "A 5-page comparison organized point by point, with a chart, evidence for each point and a conclusion that says what the comparison shows.",
      "Una comparación de 5 páginas organizada punto por punto, con una tabla, evidencia para cada punto y una conclusión que dice qué muestra la comparación.",
    ),
    targets: [
      tr(
        "Organize by points of comparison (size, purpose, history), not one thing then the other.",
        "Organiza por puntos de comparación (tamaño, propósito, historia), no una cosa y luego la otra.",
      ),
      tr(
        "Use precise contrast language: whereas, on the other hand, in contrast, similarly.",
        "Usa lenguaje de contraste preciso: mientras que, por otro lado, en cambio, de manera similar.",
      ),
      tr(
        "End with what the comparison reveals, not only a list of similarities.",
        "Termina con lo que revela la comparación, no solo una lista de semejanzas.",
      ),
    ],
    wordBank: words([
      ["whereas", "mientras que"],
      ["on the other hand", "por otro lado"],
      ["similarly", "de manera similar"],
      ["in contrast", "en cambio"],
      ["likewise", "asimismo"],
      ["distinct", "distinto"],
      ["comparable", "comparable"],
      ["criteria", "criterios"],
      ["significantly", "considerablemente"],
      ["reveals", "revela"],
    ]),
  },
  "persuasive-book": {
    finished: tr(
      "A 6-page persuasive book for a real audience: a claim, two reasons with evidence, a counterclaim with a rebuttal and a specific call to action.",
      "Un libro persuasivo de 6 páginas para un público real: una afirmación, dos razones con evidencia, un contraargumento con refutación y un llamado a la acción concreto.",
    ),
    targets: [
      tr(
        "State a precise claim and name your audience.",
        "Plantea una afirmación precisa y nombra a tu público.",
      ),
      tr(
        "Support reasons with facts, data or expert quotes, and cite where they came from.",
        "Apoya tus razones con datos, cifras o citas de expertos, y cita de dónde vienen.",
      ),
      tr(
        "Acknowledge a counterclaim and rebut it with While some argue ___, ___.",
        "Reconoce un contraargumento y refútalo con Aunque algunos dicen que ___, ___.",
      ),
    ],
    wordBank: words([
      ["claim", "afirmación"],
      ["evidence", "evidencia"],
      ["according to", "según"],
      ["counterclaim", "contraargumento"],
      ["rebuttal", "refutación"],
      ["while some argue", "aunque algunos dicen"],
      ["furthermore", "además"],
      ["consequently", "por consiguiente"],
      ["urge", "instar"],
      ["credible", "confiable"],
    ]),
  },
  biography: {
    finished: tr(
      "A 7-page biography with a timeline, a turning point, the person's impact on others and a list of sources.",
      "Una biografía de 7 páginas con una línea de tiempo, un momento decisivo, el impacto de la persona en otros y una lista de fuentes.",
    ),
    targets: [
      tr(
        "Explain how events and the time period shaped the person's choices.",
        "Explica cómo los sucesos y la época influyeron en las decisiones de la persona.",
      ),
      tr(
        "Use quotations or facts from at least two sources and name them.",
        "Usa citas o datos de por lo menos dos fuentes y nómbralas.",
      ),
      tr(
        "Evaluate the person's legacy: who was affected, and how?",
        "Evalúa el legado de la persona: ¿a quién afectó y cómo?",
      ),
    ],
    wordBank: words([
      ["influenced", "influyó"],
      ["era", "época"],
      ["obstacle", "obstáculo"],
      ["persevered", "perseveró"],
      ["turning point", "momento decisivo"],
      ["legacy", "legado"],
      ["impact", "impacto"],
      ["source", "fuente"],
      ["according to", "según"],
      ["significant", "significativo"],
    ]),
  },
  "comic-conversation": {
    finished: tr(
      "A 5-page comic of a conversation that resolves a disagreement, with each speaker's point of view shown in speech, thought and expression.",
      "Un cómic de 5 páginas de una conversación que resuelve un desacuerdo, con el punto de vista de cada personaje en diálogos, pensamientos y expresiones.",
    ),
    targets: [
      tr(
        "Disagree respectfully with I see your point, but ___ / I understand, however ___.",
        "Discrepa con respeto con Entiendo tu punto, pero ___ / Comprendo; sin embargo, ___.",
      ),
      tr(
        "Paraphrase the other speaker before responding: So you're saying ___?",
        "Parafrasea al otro antes de responder: ¿O sea que dices que ___?",
      ),
      tr(
        "Reach a compromise and show how each character's thinking changed.",
        "Lleguen a un acuerdo y muestra cómo cambió lo que piensa cada personaje.",
      ),
    ],
    wordBank: words([
      ["I see your point", "entiendo tu punto"],
      ["however", "sin embargo"],
      ["So you're saying", "o sea que dices"],
      ["perspective", "punto de vista"],
      ["compromise", "acuerdo"],
      ["suggest", "sugerir"],
      ["clarify", "aclarar"],
      ["reluctantly", "a regañadientes"],
      ["frustrated", "frustrado"],
      ["agreed", "acordaron"],
    ]),
  },
  "mystery-story": {
    finished: tr(
      "A 6-page mystery with planted clues, a red herring, rising suspense and a reveal that the reader could have solved.",
      "Un misterio de 6 páginas con pistas sembradas, una pista falsa, suspenso creciente y una revelación que el lector podría haber resuelto.",
    ),
    targets: [
      tr(
        "Plant clues early and fairly so the reader can solve it too.",
        "Siembra pistas temprano y con justicia para que el lector también pueda resolverlo.",
      ),
      tr(
        "Build suspense with pacing: short sentences, cliffhanger page endings, withheld information.",
        "Crea suspenso con el ritmo: oraciones cortas, finales de página con intriga, información oculta.",
      ),
      tr(
        "Make inferences with modals and evidence: The muddy boots suggest ___ must have ___.",
        "Haz inferencias con verbos modales y evidencia: Las botas con lodo sugieren que ___ debió ___.",
      ),
    ],
    wordBank: words([
      ["suspect", "sospechoso"],
      ["alibi", "coartada"],
      ["motive", "motivo"],
      ["deduce", "deducir"],
      ["suggests", "sugiere"],
      ["must have", "debió de"],
      ["red herring", "pista falsa"],
      ["foreshadow", "presagiar"],
      ["suspicious", "sospechoso"],
      ["revealed", "reveló"],
    ]),
  },
  "how-to": {
    finished: tr(
      "A 6-page procedural guide for a specific audience, with materials, precise numbered steps, a diagram, troubleshooting tips and safety notes.",
      "Una guía de procedimiento de 6 páginas para un público específico, con materiales, pasos numerados precisos, un diagrama, consejos para resolver problemas y notas de seguridad.",
    ),
    targets: [
      tr(
        "Write for a named audience and say what they need before they start.",
        "Escribe para un público nombrado y di qué necesitan antes de empezar.",
      ),
      tr(
        "Use precise verbs and measurements, and explain why a step matters (so that ___).",
        "Usa verbos y medidas precisas, y explica por qué importa un paso (para que ___).",
      ),
      tr(
        "Add troubleshooting: If ___ happens, ___.",
        "Agrega cómo resolver problemas: Si pasa ___, ___.",
      ),
    ],
    wordBank: words([
      ["procedure", "procedimiento"],
      ["ensure", "asegurarse de"],
      ["approximately", "aproximadamente"],
      ["so that", "para que"],
      ["optional", "opcional"],
      ["caution", "precaución"],
      ["troubleshoot", "resolver problemas"],
      ["adjust", "ajustar"],
      ["once", "una vez que"],
      ["repeat until", "repetir hasta que"],
    ]),
  },
  "informational-report": {
    finished: tr(
      "A 7-page report with a contents page, sections developed from two or more sources, text features, a glossary and a bibliography.",
      "Un informe de 7 páginas con índice, secciones desarrolladas con dos o más fuentes, elementos del texto, glosario y bibliografía.",
    ),
    targets: [
      tr(
        "Develop each section with facts, definitions, quotations and examples from sources.",
        "Desarrolla cada sección con datos, definiciones, citas y ejemplos de fuentes.",
      ),
      tr(
        "Paraphrase instead of copying, and credit each source.",
        "Parafrasea en lugar de copiar y da crédito a cada fuente.",
      ),
      tr(
        "Use text features (headings, captions, a labeled diagram) that help a reader find information.",
        "Usa elementos del texto (títulos, pies de foto, un diagrama rotulado) que ayuden a encontrar la información.",
      ),
    ],
    wordBank: words([
      ["according to", "según"],
      ["research shows", "las investigaciones muestran"],
      ["in addition", "además"],
      ["for instance", "por ejemplo"],
      ["primarily", "principalmente"],
      ["significant", "significativo"],
      ["process", "proceso"],
      ["function", "función"],
      ["paraphrase", "parafrasear"],
      ["bibliography", "bibliografía"],
    ]),
  },
  "poetry-collection": {
    finished: tr(
      "A 6-page collection of four poems that use figurative language, line breaks and sound with purpose, with an author's note and recordings.",
      "Una colección de 6 páginas de cuatro poemas que usan lenguaje figurado, cortes de verso y sonido con intención, con una nota del autor y grabaciones.",
    ),
    targets: [
      tr(
        "Use metaphor, personification and imagery to show an idea instead of stating it.",
        "Usa metáforas, personificación e imágenes para mostrar una idea en lugar de decirla.",
      ),
      tr(
        "Choose line breaks and stanzas that control rhythm and emphasis.",
        "Elige cortes de verso y estrofas que controlen el ritmo y el énfasis.",
      ),
      tr(
        "Explain one craft choice in an author's note: I chose ___ to ___.",
        "Explica una decisión de autor en una nota: Elegí ___ para ___.",
      ),
    ],
    wordBank: words([
      ["metaphor", "metáfora"],
      ["personification", "personificación"],
      ["imagery", "imágenes"],
      ["stanza", "estrofa"],
      ["rhythm", "ritmo"],
      ["alliteration", "aliteración"],
      ["tone", "tono"],
      ["symbol", "símbolo"],
      ["evokes", "evoca"],
      ["emphasis", "énfasis"],
    ]),
  },
  "bilingual-storybook": {
    finished: tr(
      "A 6-page bilingual story in English and your home language, with dialogue, a clear conflict, and a translator's note about one phrase that changes between languages.",
      "Un cuento bilingüe de 6 páginas en inglés y tu lengua materna, con diálogo, un conflicto claro y una nota del traductor sobre una frase que cambia entre idiomas.",
    ),
    targets: [
      tr(
        "Develop a conflict and resolution with dialogue and description in both languages.",
        "Desarrolla un conflicto y su solución con diálogo y descripción en los dos idiomas.",
      ),
      tr(
        "Choose words that keep the same tone in both languages, not word-for-word translation.",
        "Elige palabras que mantengan el mismo tono en los dos idiomas, no una traducción palabra por palabra.",
      ),
      tr(
        "Explain one idiom, cognate or false friend in a translator's note.",
        "Explica un modismo, un cognado o un falso amigo en una nota del traductor.",
      ),
    ],
    wordBank: words([
      ["conflict", "conflicto"],
      ["resolution", "resolución"],
      ["dialogue", "diálogo"],
      ["idiom", "modismo"],
      ["cognate", "cognado"],
      ["false friend", "falso amigo"],
      ["literally", "literalmente"],
      ["tone", "tono"],
      ["translate", "traducir"],
      ["expression", "expresión"],
    ]),
  },
  "reading-response": {
    finished: tr(
      "A 7-page literary response with an objective summary, a theme claim supported by two quotations, an analysis of the author's craft and a recommendation.",
      "Una respuesta literaria de 7 páginas con un resumen objetivo, una idea sobre el tema apoyada con dos citas, un análisis de la técnica del autor y una recomendación.",
    ),
    targets: [
      tr(
        "Write an objective summary in present tense, without opinions.",
        "Escribe un resumen objetivo en presente, sin opiniones.",
      ),
      tr(
        "State a theme and support it with quoted evidence and page numbers.",
        "Plantea un tema y apóyalo con citas y números de página.",
      ),
      tr(
        "Analyze how an author's choice (point of view, word choice, structure) shapes meaning.",
        "Analiza cómo una decisión del autor (punto de vista, vocabulario, estructura) da forma al significado.",
      ),
    ],
    wordBank: words([
      ["theme", "tema"],
      ["the author conveys", "el autor transmite"],
      ["point of view", "punto de vista"],
      ["for instance", "por ejemplo"],
      ["this suggests", "esto sugiere"],
      ["analyze", "analizar"],
      ["objective summary", "resumen objetivo"],
      ["evidence", "evidencia"],
      ["implies", "implica"],
      ["recommend", "recomendar"],
    ]),
  },
  "language-growth-portfolio": {
    finished: tr(
      "A 7-page portfolio that analyzes a first draft and a revision, explains each change, sets a measurable goal and includes a recording of you speaking now.",
      "Un portafolio de 7 páginas que analiza un primer borrador y una revisión, explica cada cambio, fija una meta medible e incluye una grabación tuya hablando ahora.",
    ),
    targets: [
      tr(
        "Analyze specific changes between drafts with evidence from your own writing.",
        "Analiza cambios concretos entre borradores con evidencia de tu propia escritura.",
      ),
      tr(
        "Explain why a revision is stronger using writing vocabulary (precise, organized, developed).",
        "Explica por qué una revisión es mejor usando vocabulario de escritura (preciso, organizado, desarrollado).",
      ),
      tr(
        "Set a measurable goal with a plan: By ___, I will ___ by ___.",
        "Fija una meta medible con un plan: Para ___, voy a ___ mediante ___.",
      ),
    ],
    wordBank: words([
      ["revision", "revisión"],
      ["feedback", "comentarios"],
      ["precise", "preciso"],
      ["developed", "desarrollado"],
      ["evidence of growth", "evidencia de progreso"],
      ["compared to", "comparado con"],
      ["strategy", "estrategia"],
      ["measurable", "medible"],
      ["reflect", "reflexionar"],
      ["consistently", "de manera constante"],
    ]),
  },
  "mission-report": {
    finished: tr(
      "A 6-page mission report with a goal, evidence you gathered, a supported conclusion, a reflection on your strategy and advice for the next explorer.",
      "Un informe de misión de 6 páginas con una meta, la evidencia que reuniste, una conclusión apoyada, una reflexión sobre tu estrategia y consejos para el próximo explorador.",
    ),
    targets: [
      tr(
        "Report what you did in precise past tense, including what did not work.",
        "Informa lo que hiciste en pasado preciso, incluido lo que no funcionó.",
      ),
      tr(
        "Connect evidence to a conclusion with which indicates, this demonstrates, therefore.",
        "Conecta la evidencia con una conclusión con lo que indica, esto demuestra, por lo tanto.",
      ),
      tr(
        "Evaluate your strategy and give advice with If I did it again, I would ___.",
        "Evalúa tu estrategia y da consejos con Si lo hiciera otra vez, ___.",
      ),
    ],
    wordBank: words([
      ["objective", "objetivo"],
      ["evidence", "evidencia"],
      ["indicates", "indica"],
      ["demonstrates", "demuestra"],
      ["therefore", "por lo tanto"],
      ["strategy", "estrategia"],
      ["obstacle", "obstáculo"],
      ["revised", "corregí"],
      ["recommend", "recomendar"],
      ["if I did it again", "si lo hiciera otra vez"],
    ]),
  },
  "conversation-book": {
    finished: tr(
      "A 5-page narrated comic of a conversation in which two speakers build on each other's ideas, ask follow-up questions and reach a conclusion.",
      "Un cómic narrado de 5 páginas de una conversación en la que dos personas amplían las ideas del otro, hacen preguntas de seguimiento y llegan a una conclusión.",
    ),
    targets: [
      tr(
        "Build on a partner's idea: Adding to what you said, ___.",
        "Amplía la idea de tu compañero: Para agregar a lo que dijiste, ___.",
      ),
      tr(
        "Ask follow-up questions that push for evidence: What makes you think that?",
        "Haz preguntas de seguimiento que pidan evidencia: ¿Qué te hace pensar eso?",
      ),
      tr(
        "Match register and intonation to the situation when you record each speaker.",
        "Ajusta el registro y la entonación a la situación al grabar a cada personaje.",
      ),
    ],
    wordBank: words([
      ["Adding to what you said", "para agregar a lo que dijiste"],
      ["What makes you think that?", "¿qué te hace pensar eso?"],
      ["I see it differently", "yo lo veo distinto"],
      ["Can you give an example?", "¿puedes dar un ejemplo?"],
      ["that's a fair point", "es un buen punto"],
      ["on the other hand", "por otro lado"],
      ["to sum up", "en resumen"],
      ["clarify", "aclarar"],
      ["perspective", "punto de vista"],
      ["conclude", "concluir"],
    ]),
  },
};

/** The template as a writer in `band` meets it: 6–8 gets the grades 6–8 goals, word bank and finished product. */
export function templateForBand(tpl, band) {
  if (!tpl || band !== "6-8") return tpl;
  const g = G68[tpl.id];
  return g ? { ...tpl, ...g } : tpl;
}

/** Ids that have a 6–8 layer (for tests and docs). */
export const BAND_LAYER_IDS = Object.freeze(Object.keys(G68));

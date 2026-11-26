// Language for Social Studies: argue for one of two community proposals with a claim and two pieces of evidence
// that match it. Either proposal can win: what counts is that the evidence supports the claim. Original content;
// Riverbend and its numbers are invented and shown on the fact card.
const SOURCES = [
  { id: "traffic", text: ["the traffic count", "el conteo de tráfico"], ref: "walkers" },
  { id: "police", text: ["the police report", "el informe de la policía"], ref: "nearmiss" },
  { id: "survey", text: ["the park survey", "la encuesta del parque"], ref: "teens" },
  { id: "map", text: ["the city map", "el mapa de la ciudad"], ref: "distance" },
  { id: "friends", text: ["my friends", "mis amigos"], ref: "opinion", tags: ["opinion"] },
];
const FACTS = [
  {
    id: "walkers",
    text: [
      "340 students cross Pine Street every school day",
      "340 estudiantes cruzan la calle Pine cada día de clases",
    ],
    ref: "walkers",
    tags: ["crosswalk"],
  },
  {
    id: "nearmiss",
    text: [
      "drivers reported 9 near misses at that corner this year",
      "los conductores reportaron 9 casi choques en esa esquina este año",
    ],
    ref: "nearmiss",
    tags: ["crosswalk"],
  },
  {
    id: "teens",
    text: [
      "210 teens said they have no safe place to skate",
      "210 adolescentes dijeron que no tienen un lugar seguro para patinar",
    ],
    ref: "teens",
    tags: ["skate"],
  },
  {
    id: "distance",
    text: [
      "the nearest skate area is 6 miles away",
      "la zona de patinaje más cercana está a 6 millas",
    ],
    ref: "distance",
    tags: ["skate"],
  },
  {
    id: "everyone",
    text: ["everyone likes the idea", "a todos les gusta la idea"],
    ref: "opinion",
    tags: ["opinion"],
  },
];
const evidenceRules = (prev) => [
  {
    when: [{ slot: "fact", has: "opinion" }],
    status: "evidence",
    say: [
      "Mr. Osei shakes his head: “That is an opinion, not evidence. What did a count, a report, a survey or a map show?”",
      "El Sr. Osei niega con la cabeza: “Eso es una opinión, no evidencia. ¿Qué mostró un conteo, un informe, una encuesta o un mapa?”",
    ],
    revise: ["Choose a fact from the fact card.", "Elige un dato de la tarjeta de datos."],
  },
  {
    when: [{ slot: "source", has: "opinion" }],
    status: "evidence",
    say: [
      "“Your friends are not a source the council can check,” says Mr. Osei. “Who measured that?”",
      "“Tus amigos no son una fuente que el concejo pueda comprobar”, dice el Sr. Osei. “¿Quién midió eso?”",
    ],
    revise: ["Name the source that reported this fact.", "Nombra la fuente que reportó este dato."],
  },
  ...(prev
    ? [
        {
          when: [{ slot: "fact", is: [`@${prev}.fact`] }],
          status: "evidence",
          say: [
            "“You already told me that,” says Mr. Osei. “The council wants a second, different reason.”",
            "“Eso ya me lo dijiste”, dice el Sr. Osei. “El concejo quiere una segunda razón, diferente.”",
          ],
          revise: [
            "Choose a different fact that also supports your claim.",
            "Elige otro dato que también apoye tu afirmación.",
          ],
        },
      ]
    : []),
  {
    when: [{ slot: "fact", has: "@claim.proposal", not: true }],
    status: "evidence",
    say: [
      "Mr. Osei frowns: “That fact helps the other proposal. Why would it make me vote for yours?”",
      "El Sr. Osei frunce el ceño: “Ese dato ayuda a la otra propuesta. ¿Por qué me haría votar por la tuya?”",
    ],
    revise: [
      "Choose evidence that supports the project in your claim.",
      "Elige evidencia que apoye el proyecto de tu afirmación.",
    ],
  },
  {
    when: [{ link: ["source", "fact"], not: true }],
    status: "data",
    say: [
      "Mr. Osei checks the fact card: “That source did not report that fact. If I repeat it at the meeting, I will be wrong.”",
      "El Sr. Osei revisa la tarjeta: “Esa fuente no reportó ese dato. Si lo repito en la reunión, me equivocaré.”",
    ],
    revise: [
      "Match the fact to the source that reported it.",
      "Une el dato con la fuente que lo reportó.",
    ],
  },
];

export const CIVICS = {
  id: "town-choice",
  title: ["The Council Vote", "La votación del concejo"],
  summary: [
    "Riverbend can build only one project. Convince a council member with a claim and evidence, not opinions.",
    "Riverbend solo puede construir un proyecto. Convence a un miembro del concejo con una afirmación y evidencia, no con opiniones.",
  ],
  feature: [
    "Argue: a claim, two pieces of evidence with their sources, and words that add support",
    "Argumentar: una afirmación, dos evidencias con sus fuentes y palabras que agregan apoyo",
  ],
  area: ["Language for Social Studies", "Lenguaje para los estudios sociales"],
  keyUse: "Argue",
  standards: {
    "3-5": ["ELD-SS.4-5.Argue.Expressive", "ELD-SI.4-12.Argue"],
    "6-8": ["ELD-SS.6-8.Argue.Expressive", "ELD-SI.4-12.Argue"],
  },
  character: {
    name: "Mr. Osei",
    role: ["Council member", "Miembro del concejo"],
    look: "official",
  },
  card: {
    title: ["Riverbend fact card", "Tarjeta de datos de Riverbend"],
    lines: [
      [
        "Proposal A: a crosswalk with a signal on Pine Street, by the middle school.",
        "Propuesta A: un cruce peatonal con semáforo en la calle Pine, junto a la escuela intermedia.",
      ],
      [
        "Proposal B: a covered skate and bike area in Riverbend Park.",
        "Propuesta B: una zona techada para patinar y andar en bicicleta en el parque Riverbend.",
      ],
      [
        "Traffic count: 340 students cross Pine Street every school day.",
        "Conteo de tráfico: 340 estudiantes cruzan la calle Pine cada día de clases.",
      ],
      [
        "Police report: drivers reported 9 near misses at that corner this year.",
        "Informe de la policía: los conductores reportaron 9 casi choques en esa esquina este año.",
      ],
      [
        "Park survey: 210 teens said they have no safe place to skate.",
        "Encuesta del parque: 210 adolescentes dijeron que no tienen un lugar seguro para patinar.",
      ],
      [
        "City map: the nearest skate area is 6 miles away.",
        "Mapa de la ciudad: la zona de patinaje más cercana está a 6 millas.",
      ],
    ],
  },
  rounds: [
    {
      id: "claim",
      kind: "talk",
      situation: [
        "Mr. Osei says: “I vote tomorrow. Which project should Riverbend build, and why?” You choose the side.",
        "El Sr. Osei dice: “Voto mañana. ¿Qué proyecto debe construir Riverbend y por qué?” Tú eliges el lado.",
      ],
      frame: "I think the town should build {proposal} {conn} {reason}.",
      slots: [
        {
          id: "proposal",
          label: ["Your claim", "Tu afirmación"],
          options: [
            { id: "crosswalk", text: ["the crosswalk", "el cruce peatonal"] },
            { id: "skate", text: ["the skate area", "la zona de patinaje"] },
          ],
        },
        {
          id: "conn",
          label: ["Connecting word", "Palabra de enlace"],
          options: [
            { id: "because", text: ["because", "porque"] },
            { id: "although", text: ["although", "aunque"] },
            { id: "but", text: ["but", "pero"] },
          ],
        },
        {
          id: "reason",
          label: ["Reason", "Razón"],
          options: [
            {
              id: "safe",
              text: [
                "it would keep students safe on the way to school",
                "mantendría seguros a los estudiantes camino a la escuela",
              ],
              tags: ["crosswalk"],
            },
            {
              id: "active",
              text: [
                "it would give teens a safe place to be active",
                "les daría a los adolescentes un lugar seguro para moverse",
              ],
              tags: ["skate"],
            },
            { id: "cool", text: ["it would look cool", "se vería genial"], tags: ["opinion"] },
            { id: "like", text: ["I like it", "me gusta"], tags: ["opinion"] },
          ],
        },
      ],
      rules: [
        {
          when: [{ slot: "reason", has: "opinion" }],
          status: "evidence",
          say: [
            "Mr. Osei smiles: “That tells me what you like. How would it help the people of Riverbend?”",
            "El Sr. Osei sonríe: “Eso me dice lo que te gusta. ¿Cómo ayudaría a la gente de Riverbend?”",
          ],
          revise: [
            "Choose a reason about the community, not about your taste.",
            "Elige una razón sobre la comunidad, no sobre tus gustos.",
          ],
        },
        {
          when: [{ slot: "reason", has: "@claim.proposal", not: true }],
          status: "clarify",
          say: [
            "Mr. Osei is confused: “Your reason is about a different project. Which one do you mean?”",
            "El Sr. Osei está confundido: “Tu razón es sobre otro proyecto. ¿Cuál quieres decir?”",
          ],
          revise: [
            "Make your reason match the project in your claim.",
            "Haz que tu razón coincida con el proyecto de tu afirmación.",
          ],
        },
        {
          when: [{ slot: "conn", is: ["although", "but"] }],
          status: "connect",
          say: [
            "“That word makes your reason sound like a point against your own claim,” says Mr. Osei. “Are you for it or against it?”",
            "“Esa palabra hace que tu razón suene como un punto en contra de tu propia afirmación”, dice el Sr. Osei. “¿Estás a favor o en contra?”",
          ],
          revise: [
            "Choose the word that introduces a reason that supports the claim.",
            "Elige la palabra que presenta una razón que apoya la afirmación.",
          ],
        },
        { when: [{ slot: "conn", is: ["because"] }], ok: true },
        {
          status: "clarify",
          say: [
            "Mr. Osei asks you to say your claim again.",
            "El Sr. Osei te pide que repitas tu afirmación.",
          ],
          revise: [
            "Check the claim, the word and the reason.",
            "Revisa la afirmación, la palabra y la razón.",
          ],
        },
      ],
      bank: [
        ["claim: what you think should happen", "afirmación: lo que crees que debe pasar"],
        ["because: introduces a reason", "because: presenta una razón"],
        [
          "although / but: introduce an opposite idea",
          "although / but: presentan una idea contraria",
        ],
        ["community: the people who live in a place", "comunidad: la gente que vive en un lugar"],
      ],
      tip: [
        "A claim says what should happen. A reason says how it helps the community.",
        "Una afirmación dice qué debe pasar. Una razón dice cómo ayuda a la comunidad.",
      ],
      success: [
        "Mr. Osei writes your claim at the top of his notes: “Clear claim. Now give me evidence the council can check.”",
        "El Sr. Osei escribe tu afirmación al inicio de sus notas: “Afirmación clara. Ahora dame evidencia que el concejo pueda comprobar.”",
      ],
    },
    {
      id: "evidence1",
      kind: "talk",
      situation: [
        "Mr. Osei asks: “What is your first piece of evidence? Tell me where it comes from.”",
        "El Sr. Osei pregunta: “¿Cuál es tu primera evidencia? Dime de dónde viene.”",
      ],
      frame: "According to {source}, {fact}.",
      slots: [
        { id: "source", label: ["Source", "Fuente"], options: SOURCES },
        { id: "fact", label: ["Evidence", "Evidencia"], options: FACTS },
      ],
      rules: [
        ...evidenceRules(null),
        {
          ok: true,
          when: [{ link: ["source", "fact"] }, { slot: "fact", has: "@claim.proposal" }],
        },
        {
          status: "evidence",
          say: ["Mr. Osei asks for evidence again.", "El Sr. Osei vuelve a pedir evidencia."],
          revise: ["Use the fact card.", "Usa la tarjeta de datos."],
        },
      ],
      bank: [
        [
          "according to: says who reported the fact",
          "according to (según): dice quién reportó el dato",
        ],
        ["evidence: a fact that supports a claim", "evidencia: un dato que apoya una afirmación"],
        ["opinion: what someone thinks or feels", "opinión: lo que alguien piensa o siente"],
      ],
      tip: [
        "Strong evidence names its source, so others can check it.",
        "La evidencia sólida nombra su fuente para que otros puedan comprobarla.",
      ],
      success: [
        "Mr. Osei underlines it: “That I can repeat at the meeting. Do you have a second piece?”",
        "El Sr. Osei lo subraya: “Eso lo puedo repetir en la reunión. ¿Tienes una segunda evidencia?”",
      ],
    },
    {
      id: "evidence2",
      kind: "talk",
      situation: [
        "Mr. Osei says: “One fact is good. Two are better. Add a second, different piece of evidence.”",
        "El Sr. Osei dice: “Un dato es bueno. Dos son mejores. Agrega una segunda evidencia diferente.”",
      ],
      frame: "{add} according to {source}, {fact}.",
      slots: [
        {
          id: "add",
          label: ["Linking phrase", "Frase de enlace"],
          options: [
            { id: "addition", text: ["In addition,", "Además,"] },
            { id: "however", text: ["However,", "Sin embargo,"] },
            { id: "instead", text: ["Instead,", "En cambio,"] },
          ],
        },
        { id: "source", label: ["Source", "Fuente"], options: SOURCES },
        { id: "fact", label: ["Evidence", "Evidencia"], options: FACTS },
      ],
      rules: [
        ...evidenceRules("evidence1"),
        {
          when: [{ slot: "add", is: ["however", "instead"] }],
          status: "connect",
          say: [
            "Mr. Osei looks up: “That phrase tells me you are switching sides. Are you?”",
            "El Sr. Osei levanta la vista: “Esa frase me dice que cambias de lado. ¿Es así?”",
          ],
          revise: [
            "You are adding support. Choose the phrase that adds.",
            "Estás agregando apoyo. Elige la frase que agrega.",
          ],
        },
        { ok: true, when: [{ slot: "add", is: ["addition"] }] },
        {
          status: "evidence",
          say: [
            "Mr. Osei asks for the second piece again.",
            "El Sr. Osei vuelve a pedir la segunda evidencia.",
          ],
          revise: ["Use the fact card.", "Usa la tarjeta de datos."],
        },
      ],
      bank: [
        [
          "in addition: adds another reason on the same side",
          "in addition (además): agrega otra razón del mismo lado",
        ],
        [
          "however / instead: introduce the other side",
          "however / instead: presentan el otro lado",
        ],
        ["source: where a fact comes from", "fuente: de dónde viene un dato"],
      ],
      tip: [
        "Linking phrases tell the listener whether the next idea adds to your side or switches sides.",
        "Las frases de enlace le dicen a quien escucha si la siguiente idea suma a tu lado o cambia de lado.",
      ],
      success: [
        "Mr. Osei closes his notebook: “A clear claim and two checked facts. You convinced me: I will vote for your proposal.”",
        "El Sr. Osei cierra su cuaderno: “Una afirmación clara y dos datos comprobados. Me convenciste: votaré por tu propuesta.”",
      ],
    },
  ],
};

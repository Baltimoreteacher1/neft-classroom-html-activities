// Mentor Text Explorer content: eight writer's moves, 32 short original mentor texts, and try-it tasks.
// Marked text uses {move:phrase}; notes are listed in the same order as the markers: [English, Español].
// Practice content (the mentor texts and try-it sentences) stays English; notes carry both languages.

export const MOVES = [
  {
    id: "verb",
    name: "Strong verb",
    es: "Verbo fuerte",
    icon: "play",
    how: "Choose a verb that shows how something happened, not just that it happened.",
    howEs: "Elige un verbo que muestre cómo ocurrió algo, no solo que ocurrió.",
    goal: "Swap a plain verb for a precise one.",
    goalEs: "Cambia un verbo simple por uno preciso.",
  },
  {
    id: "sense",
    name: "Sensory detail",
    es: "Detalle sensorial",
    icon: "volume",
    how: "Give the reader something to see, hear, smell, touch, or taste.",
    howEs: "Dale al lector algo para ver, oír, oler, tocar o saborear.",
    goal: "Add one sense detail to a plain sentence.",
    goalEs: "Agrega un detalle de los sentidos a una oración simple.",
  },
  {
    id: "hook",
    name: "Hook",
    es: "Gancho",
    icon: "star",
    how: "Open with something that makes the reader want to keep going.",
    howEs: "Empieza con algo que haga que el lector quiera seguir.",
    goal: "Write an opening line that pulls the reader in.",
    goalEs: "Escribe una primera línea que atrape al lector.",
  },
  {
    id: "trans",
    name: "Transition",
    es: "Transición",
    icon: "arrow-right",
    how: "Use a small word or phrase that shows how two ideas connect.",
    howEs: "Usa una palabra o frase pequeña que muestre cómo se conectan dos ideas.",
    goal: "Connect two ideas with the right kind of transition.",
    goalEs: "Conecta dos ideas con el tipo de transición adecuado.",
  },
  {
    id: "evid",
    name: "Evidence signal",
    es: "Señal de evidencia",
    icon: "evidence",
    how: "Tell the reader where a fact or quote comes from before you share it.",
    howEs: "Dile al lector de dónde viene un dato o una cita antes de compartirlo.",
    goal: "Introduce evidence with a signal phrase.",
    goalEs: "Presenta evidencia con una frase señal.",
  },
  {
    id: "coh",
    name: "Cohesion device",
    es: "Recurso de cohesión",
    icon: "language",
    how: "Point back to an earlier idea with words like this, these, another, or a repeated key word.",
    howEs:
      "Remite a una idea anterior con palabras como this, these, another o una palabra clave repetida.",
    goal: "Tie a second sentence to the first.",
    goalEs: "Une una segunda oración con la primera.",
  },
  {
    id: "comp",
    name: "Comparison",
    es: "Comparación",
    icon: "bulb",
    how: "Compare something new to something the reader already knows.",
    howEs: "Compara algo nuevo con algo que el lector ya conoce.",
    goal: "Use like or as to make a picture in the reader's mind.",
    goalEs: "Usa like o as para crear una imagen en la mente del lector.",
  },
  {
    id: "prec",
    name: "Precise detail",
    es: "Detalle preciso",
    icon: "pin",
    how: "Use an exact number, measurement, or name instead of a general word.",
    howEs: "Usa un número exacto, una medida o un nombre en lugar de una palabra general.",
    goal: "Replace a general word with an exact detail.",
    goalEs: "Reemplaza una palabra general por un detalle exacto.",
  },
];
export const findMove = (id) => MOVES.find((m) => m.id === id) || null;

export const GENRES = [
  { id: "story", name: "Story", es: "Cuento" },
  { id: "describe", name: "Description", es: "Descripción" },
  { id: "inform", name: "Informational", es: "Informativo" },
  { id: "explain", name: "Science explanation", es: "Explicación científica" },
  { id: "argue", name: "Opinion and argument", es: "Opinión y argumento" },
  { id: "howto", name: "How-to", es: "Instrucciones" },
  { id: "letter", name: "Letter and review", es: "Carta y reseña" },
  { id: "bio", name: "Biography and history", es: "Biografía e historia" },
];

// [id, band, genre, title, titleEs, marked text, notes]
const ROWS = [
  [
    "m01",
    "3-5",
    "story",
    "The Storm Window",
    "La ventana de la tormenta",
    "{hook:Crack!} The window rattled in its frame. Maya {verb:tiptoed} to the glass and watched {sense:silver rain bounce off the porch}. {trans:Then} the lights flickered and went out. Her little brother {comp:clung to her sleeve like a baby monkey}.",
    [
      [
        "Starting with a sound word grabs the reader before anything else happens.",
        "Empezar con una palabra de sonido atrapa al lector antes de que pase nada.",
      ],
      [
        "“Tiptoed” shows how Maya moved: slowly and quietly. “Walked” would not.",
        "“Tiptoed” muestra cómo se movió Maya: despacio y en silencio. “Walked” no lo haría.",
      ],
      [
        "You can see the rain: silver, and it bounces. That is a sight detail.",
        "Puedes ver la lluvia: plateada, y rebota. Es un detalle de la vista.",
      ],
      [
        "“Then” is a time transition. It tells us the next thing that happened.",
        "“Then” es una transición de tiempo. Nos dice lo siguiente que pasó.",
      ],
      [
        "Comparing his grip to a baby monkey helps us picture how tightly he held on.",
        "Comparar su agarre con un monito nos ayuda a imaginar con cuánta fuerza se sujetaba.",
      ],
    ],
  ],
  [
    "m02",
    "3-5",
    "story",
    "The Lost Mitten",
    "El guante perdido",
    '"{hook:Has anyone seen my red mitten?}" Omar asked the whole bus. He {verb:dug} through his backpack, {prec:three pockets and one lunch bag}. {trans:Finally}, he found it {sense:soft and warm}, tucked in his hood.',
    [
      [
        "A question opens the story and makes the reader want to know the answer.",
        "Una pregunta abre el cuento y hace que el lector quiera saber la respuesta.",
      ],
      [
        "“Dug” shows he searched hard and fast, more than “looked” would.",
        "“Dug” muestra que buscó con ganas y rápido, más que “looked”.",
      ],
      [
        "Counting exactly where he searched makes the scene feel real.",
        "Contar exactamente dónde buscó hace que la escena se sienta real.",
      ],
      [
        "“Finally” is a time transition. It shows the search is ending.",
        "“Finally” es una transición de tiempo. Muestra que la búsqueda termina.",
      ],
      [
        "“Soft and warm” are touch words. We can feel the mitten.",
        "“Soft and warm” son palabras del tacto. Podemos sentir el guante.",
      ],
    ],
  ],
  [
    "m03",
    "3-5",
    "story",
    "Night at the Lake",
    "Noche en el lago",
    "The campfire {sense:crackled and smelled like sweet pine smoke}. Lena {verb:gripped} her flashlight. Across the water, something {verb:splashed}. {trans:Suddenly}, a pair of eyes {comp:glowed like two small moons}.",
    [
      [
        "Two senses at once: we hear the crackle and smell the pine.",
        "Dos sentidos a la vez: oímos el crepitar y olemos el pino.",
      ],
      [
        "“Gripped” shows she held on tightly because she was nervous.",
        "“Gripped” muestra que se agarró fuerte porque estaba nerviosa.",
      ],
      [
        "“Splashed” gives us a sound and tells us something moved in the water.",
        "“Splashed” nos da un sonido y nos dice que algo se movió en el agua.",
      ],
      [
        "“Suddenly” signals a surprise. The story changes in a moment.",
        "“Suddenly” señala una sorpresa. El cuento cambia en un momento.",
      ],
      [
        "Comparing the eyes to moons helps us see their round, shining shape.",
        "Comparar los ojos con lunas nos ayuda a ver su forma redonda y brillante.",
      ],
    ],
  ],
  [
    "m04",
    "3-5",
    "describe",
    "The Farmers' Market",
    "El mercado de agricultores",
    "{hook:Imagine a street where every table is a rainbow.} The strawberries are {sense:bright red and smell like summer}. A seller {verb:calls out} the price of {prec:twelve kinds of tomatoes}. The crowd {comp:moves like a slow river} between the stands.",
    [
      [
        "“Imagine” speaks directly to the reader and starts a picture.",
        "“Imagine” le habla directo al lector y empieza una imagen.",
      ],
      [
        "Color and smell together make the strawberries real.",
        "El color y el olor juntos hacen reales las fresas.",
      ],
      [
        "“Calls out” is more exact than “says”: it shows how a seller speaks in a busy market.",
        "“Calls out” es más exacto que “says”: muestra cómo habla un vendedor en un mercado lleno.",
      ],
      [
        "Naming the exact number shows the writer looked closely.",
        "Nombrar el número exacto muestra que el escritor miró de cerca.",
      ],
      [
        "A slow river is a good picture for a crowd that drifts along.",
        "Un río lento es una buena imagen para una multitud que avanza despacio.",
      ],
    ],
  ],
  [
    "m05",
    "3-5",
    "describe",
    "My Grandmother's Kitchen",
    "La cocina de mi abuela",
    "My grandmother's kitchen {sense:smells like cinnamon and warm bread}. The old stove {verb:hums} all morning. Her wooden spoon is {comp:as worn as a river stone}. {trans:Every Sunday}, we {verb:knead} the dough together.",
    [
      [
        "The smell is specific: cinnamon and warm bread, not just “good”.",
        "El olor es específico: canela y pan caliente, no solo “bueno”.",
      ],
      [
        "“Hums” gives the stove a sound and a sense of being alive.",
        "“Hums” le da a la estufa un sonido y una sensación de estar viva.",
      ],
      [
        "“As worn as a river stone” shows the spoon is smooth from years of use.",
        "“As worn as a river stone” muestra que la cuchara está lisa por los años de uso.",
      ],
      [
        "“Every Sunday” is a time transition that shows a routine.",
        "“Every Sunday” es una transición de tiempo que muestra una rutina.",
      ],
      [
        "“Knead” names the exact action. It is more precise than “make”.",
        "“Knead” nombra la acción exacta. Es más preciso que “make”.",
      ],
    ],
  ],
  [
    "m06",
    "3-5",
    "describe",
    "The Playground After Rain",
    "El patio después de la lluvia",
    "After the storm, the playground {sense:shines and drips}. Puddles {verb:mirror} the sky. Our sneakers {sense:squelch in the cold mud}. {trans:Nearby}, a robin {verb:hops} from puddle to puddle.",
    [
      [
        "“Shines and drips” gives sight and sound in two small words.",
        "“Shines and drips” da vista y sonido en dos palabras pequeñas.",
      ],
      [
        "“Mirror” is a strong verb: puddles show the sky like a mirror does.",
        "“Mirror” es un verbo fuerte: los charcos muestran el cielo como un espejo.",
      ],
      [
        "“Squelch” is a sound word, and “cold mud” adds touch.",
        "“Squelch” es una palabra de sonido y “cold mud” agrega el tacto.",
      ],
      [
        "“Nearby” moves the reader's eyes to a new place.",
        "“Nearby” lleva la mirada del lector a un lugar nuevo.",
      ],
      [
        "“Hops” shows exactly how a robin moves.",
        "“Hops” muestra exactamente cómo se mueve un petirrojo.",
      ],
    ],
  ],
  [
    "m07",
    "3-5",
    "inform",
    "Honeybees at Work",
    "Abejas trabajando",
    "{hook:Did you know a honeybee visits about fifty flowers on one trip?} {coh:This} busy work gives the hive its food. Bees {verb:gather} nectar and {verb:store} it as honey. {evid:According to beekeepers}, a hive can hold {prec:up to 50,000 bees} in summer.",
    [
      [
        "A surprising fact in a question is a hook.",
        "Un dato sorprendente en forma de pregunta es un gancho.",
      ],
      [
        "“This” points back to the idea in the first sentence, so the two sentences connect.",
        "“This” remite a la idea de la primera oración, así que las dos se conectan.",
      ],
      ["“Gather” is more exact than “get”.", "“Gather” es más exacto que “get”."],
      [
        "“Store” tells us what bees do with nectar, which is more exact than “put”.",
        "“Store” nos dice qué hacen las abejas con el néctar, más exacto que “put”.",
      ],
      [
        "“According to beekeepers” tells us who knows this.",
        "“According to beekeepers” nos dice quién sabe esto.",
      ],
      [
        "An exact number gives a clear idea of the hive's size.",
        "Un número exacto da una idea clara del tamaño de la colmena.",
      ],
    ],
  ],
  [
    "m08",
    "3-5",
    "inform",
    "The Life of a Frog",
    "La vida de una rana",
    "A frog's life begins as an egg in the water. {trans:Next}, a tadpole {verb:wriggles} out and breathes with gills. {trans:After about twelve weeks}, legs {verb:sprout}. {coh:This change} is called metamorphosis. {evid:The science book explains} that the adult frog breathes air.",
    [
      [
        "“Next” is a time transition that moves us to the second stage.",
        "“Next” es una transición de tiempo que nos lleva a la segunda etapa.",
      ],
      [
        "“Wriggles” shows how a tadpole moves, not just that it moves.",
        "“Wriggles” muestra cómo se mueve un renacuajo, no solo que se mueve.",
      ],
      [
        "“After about twelve weeks” is a time transition with a measure.",
        "“After about twelve weeks” es una transición de tiempo con una medida.",
      ],
      [
        "“Sprout” is a strong verb borrowed from plants, and it fits growing legs.",
        "“Sprout” es un verbo fuerte tomado de las plantas, y encaja con crecer patas.",
      ],
      [
        "“This change” names what came before, so the ideas link together.",
        "“This change” nombra lo anterior, así que las ideas se enlazan.",
      ],
      [
        "The signal phrase names the source before the fact.",
        "La frase señal nombra la fuente antes del dato.",
      ],
    ],
  ],
  [
    "m09",
    "3-5",
    "inform",
    "Why We Have Seasons",
    "Por qué hay estaciones",
    "Earth {comp:spins like a tilted top} as it travels around the sun. {coh:Because of this tilt}, the north gets more direct sunlight in June. {trans:As a result}, summer days are {sense:long and warm}. {evid:Scientists at NASA say} the tilt is about 23.5 degrees.",
    [
      [
        "Comparing Earth to a tilted top makes an idea we cannot see easier to picture.",
        "Comparar la Tierra con un trompo inclinado hace más fácil imaginar algo que no vemos.",
      ],
      [
        "“Because of this tilt” points back to the tilt and explains a cause.",
        "“Because of this tilt” remite a la inclinación y explica una causa.",
      ],
      [
        "“As a result” is a cause-and-effect transition.",
        "“As a result” es una transición de causa y efecto.",
      ],
      [
        "“Long and warm” gives touch and time details.",
        "“Long and warm” da detalles de tacto y de tiempo.",
      ],
      [
        "Naming the source and an exact measure makes the fact more believable.",
        "Nombrar la fuente y una medida exacta hace el dato más creíble.",
      ],
    ],
  ],
  [
    "m10",
    "3-5",
    "howto",
    "How to Plant a Bean",
    "Cómo sembrar un frijol",
    "{hook:Want to watch a plant grow in a week?} {trans:First}, {verb:tuck} a bean between a damp paper towel and the side of a clear jar. {trans:Next}, set the jar in a {sense:warm, bright window}. {trans:After five days}, a {prec:two-inch root} will appear.",
    [
      [
        "A question that promises something exciting is a hook.",
        "Una pregunta que promete algo emocionante es un gancho.",
      ],
      ["“First” starts the steps in order.", "“First” empieza los pasos en orden."],
      [
        "“Tuck” shows how gently the bean is placed.",
        "“Tuck” muestra con qué suavidad se coloca el frijol.",
      ],
      ["“Next” keeps the steps moving.", "“Next” mantiene los pasos en movimiento."],
      [
        "“Warm, bright” tells the reader exactly what kind of window.",
        "“Warm, bright” le dice al lector exactamente qué tipo de ventana.",
      ],
      [
        "“After five days” is a time transition that tells how long to wait.",
        "“After five days” es una transición de tiempo que dice cuánto esperar.",
      ],
      [
        "A measurement tells the reader what to look for.",
        "Una medida le dice al lector qué buscar.",
      ],
    ],
  ],
  [
    "m11",
    "3-5",
    "howto",
    "How to Build a Paper Plane",
    "Cómo hacer un avión de papel",
    "{trans:Begin} with one sheet of paper. {verb:Crease} it down the middle, then {verb:fold} both top corners to the center line. {coh:These folds} make the pointed nose. {sense:Smooth each crease flat with your thumb} so the plane flies straight.",
    [
      ["“Begin” opens the steps in order.", "“Begin” abre los pasos en orden."],
      [
        "“Crease” is more exact than “fold” here: it means press a sharp line.",
        "“Crease” es más exacto que “fold” aquí: significa marcar una línea nítida.",
      ],
      [
        "“Fold” names the action the reader will do.",
        "“Fold” nombra la acción que hará el lector.",
      ],
      [
        "“These folds” points back to the steps just given.",
        "“These folds” remite a los pasos recién dados.",
      ],
      [
        "Touch is part of the instruction: the reader can feel when the crease is flat.",
        "El tacto es parte de la instrucción: el lector siente cuándo el doblez está plano.",
      ],
    ],
  ],
  [
    "m12",
    "3-5",
    "argue",
    "Let Us Have Longer Recess",
    "Más tiempo de recreo",
    "{hook:Fifteen minutes is not enough to finish one kickball game.} I believe our school should add ten more minutes of recess. {evid:According to health groups}, children should get at least {prec:sixty minutes} of active play each day. {coh:This extra time} would help us move and pay attention in class.",
    [
      [
        "Describing a real problem in the first line is a hook for an argument.",
        "Describir un problema real en la primera línea es un gancho para un argumento.",
      ],
      [
        "“According to health groups” names the source of the evidence.",
        "“According to health groups” nombra la fuente de la evidencia.",
      ],
      [
        "An exact number makes the evidence stronger than “a lot”.",
        "Un número exacto hace la evidencia más fuerte que “mucho”.",
      ],
      [
        "“This extra time” links the reasoning back to the claim.",
        "“This extra time” une el razonamiento con la afirmación.",
      ],
    ],
  ],
  [
    "m13",
    "3-5",
    "argue",
    "Books Beat Screens at Bedtime",
    "Libros mejor que pantallas",
    "Reading a paper book at night is a better choice than using a tablet. {evid:The librarian told us} that a book has no games or messages to {verb:distract} you. {trans:Also}, a book never {verb:glows} in your eyes. {trans:For these reasons}, I {verb:urge} families to try book time.",
    [
      [
        "The signal phrase tells us who gave the fact.",
        "La frase señal nos dice quién dio el dato.",
      ],
      [
        "“Distract” is a precise verb that names the problem.",
        "“Distract” es un verbo preciso que nombra el problema.",
      ],
      ["“Also” adds a second reason.", "“Also” agrega una segunda razón."],
      [
        "“Glows” gives a picture of the screen light.",
        "“Glows” da una imagen de la luz de la pantalla.",
      ],
      ["“For these reasons” signals a conclusion.", "“For these reasons” señala una conclusión."],
      [
        "“Urge” is stronger than “ask” and shows how much the writer cares.",
        "“Urge” es más fuerte que “ask” y muestra cuánto le importa al escritor.",
      ],
    ],
  ],
  [
    "m14",
    "3-5",
    "letter",
    "A Note to Our Principal",
    "Una nota a nuestro director",
    "Dear Principal Rivera, {hook:Our school garden is thirsty.} Last week, the carrots {verb:wilted} in the sun. We would like a rain barrel by {prec:Room 12}. {trans:If you agree}, our class will {verb:collect} water every Friday. Thank you for reading.",
    [
      [
        "A short, surprising sentence at the start gets the principal's attention.",
        "Una oración corta y sorprendente al inicio atrae la atención del director.",
      ],
      [
        "“Wilted” shows exactly what happened to the carrots.",
        "“Wilted” muestra exactamente qué les pasó a las zanahorias.",
      ],
      [
        "A specific place helps the reader picture the request.",
        "Un lugar específico ayuda al lector a imaginar la petición.",
      ],
      [
        "“If you agree” connects the request to a promise.",
        "“If you agree” conecta la petición con una promesa.",
      ],
      [
        "“Collect” is a clear, precise verb for the plan.",
        "“Collect” es un verbo claro y preciso para el plan.",
      ],
    ],
  ],
  [
    "m15",
    "3-5",
    "bio",
    "Mae Jemison Reaches for the Stars",
    "Mae Jemison alcanza las estrellas",
    "As a girl in Chicago, Mae Jemison {verb:gazed} at the night sky. {trans:Later}, she became a doctor. {evid:NASA records show} that in {prec:1992} she {verb:soared} into space aboard the shuttle Endeavour. {coh:This trip} made her the first Black woman in space.",
    [
      [
        "“Gazed” shows how she looked: long and with wonder.",
        "“Gazed” muestra cómo miró: por mucho tiempo y con asombro.",
      ],
      ["“Later” moves us forward in time.", "“Later” nos mueve hacia adelante en el tiempo."],
      [
        "The signal phrase tells us where the fact is recorded.",
        "La frase señal nos dice dónde está registrado el dato.",
      ],
      ["An exact year is a precise detail.", "Un año exacto es un detalle preciso."],
      [
        "“Soared” is a strong verb that fits a launch.",
        "“Soared” es un verbo fuerte que encaja con un lanzamiento.",
      ],
      [
        "“This trip” points back to the flight, so the history links up.",
        "“This trip” remite al viaje, así que la historia se enlaza.",
      ],
    ],
  ],
  [
    "m16",
    "3-5",
    "explain",
    "How a Seed Becomes a Sunflower",
    "De semilla a girasol",
    "A seed holds a tiny plant {comp:packed like a sleeping bag}. {trans:When water arrives}, the seed {verb:swells} and the root {verb:pushes} down. {coh:This root} drinks water for the plant. {sense:Soon, a green shoot rises, soft and bending}, toward the light.",
    [
      [
        "The comparison helps us picture a plant folded up inside a seed.",
        "La comparación nos ayuda a imaginar una planta doblada dentro de una semilla.",
      ],
      [
        "“When water arrives” is a time and cause transition.",
        "“When water arrives” es una transición de tiempo y causa.",
      ],
      [
        "“Swells” shows exactly how the seed changes.",
        "“Swells” muestra exactamente cómo cambia la semilla.",
      ],
      ["“Pushes” shows effort and direction.", "“Pushes” muestra esfuerzo y dirección."],
      [
        "“This root” points back to the root we just named.",
        "“This root” remite a la raíz que acabamos de nombrar.",
      ],
      [
        "We can see the shoot and almost feel how soft it is.",
        "Podemos ver el brote y casi sentir lo suave que es.",
      ],
    ],
  ],
  // ── Grades 6-8 ─────────────────────────────────────────────────────────────
  [
    "m17",
    "6-8",
    "story",
    "The Last Bus Home",
    "El último autobús a casa",
    "{hook:The bus was gone before Dani reached the corner.} Rain {verb:hammered} the shelter roof. {sense:The air smelled of wet pavement and diesel}. She {verb:fumbled} for her phone, {trans:but} the screen was dead. {comp:Streetlights buzzed like tired insects} above her.",
    [
      [
        "Starting in the middle of trouble pulls the reader in right away.",
        "Empezar en medio de un problema atrapa al lector enseguida.",
      ],
      [
        "“Hammered” gives both sound and force to the rain.",
        "“Hammered” da sonido y fuerza a la lluvia.",
      ],
      [
        "Smell is a sense writers use less, so it stands out.",
        "El olfato es un sentido que se usa menos, por eso destaca.",
      ],
      [
        "“Fumbled” shows she was clumsy because she was anxious.",
        "“Fumbled” muestra que estaba torpe por la ansiedad.",
      ],
      [
        "“But” is a contrast transition: her plan fails.",
        "“But” es una transición de contraste: su plan falla.",
      ],
      [
        "Comparing buzzing lights to tired insects adds sound and mood.",
        "Comparar luces que zumban con insectos cansados agrega sonido y ambiente.",
      ],
    ],
  ],
  [
    "m18",
    "6-8",
    "story",
    "The Violin Case",
    "El estuche del violín",
    'Inés {verb:hesitated} at the stage door. Her violin case {sense:felt cold and heavy in her hand}. {trans:Meanwhile}, the audience {verb:murmured} beyond the curtain. {hook:"Play like no one is listening," her teacher had said.} {coh:That advice} finally made her smile.',
    [
      [
        "“Hesitated” shows doubt, which tells us how she feels.",
        "“Hesitated” muestra duda, lo que nos dice cómo se siente.",
      ],
      [
        "Cold and heavy are touch words that also hint at her nerves.",
        "Cold and heavy son palabras de tacto que también sugieren sus nervios.",
      ],
      [
        "“Meanwhile” moves to what is happening elsewhere at the same time.",
        "“Meanwhile” pasa a lo que ocurre en otro lugar al mismo tiempo.",
      ],
      [
        "“Murmured” is a sound verb for a crowd talking quietly.",
        "“Murmured” es un verbo de sonido para una multitud que habla bajito.",
      ],
      [
        "Dialogue from a memory works as a hook for the turning point.",
        "El diálogo de un recuerdo funciona como gancho del punto de giro.",
      ],
      [
        "“That advice” points back to the teacher's words.",
        "“That advice” remite a las palabras de la maestra.",
      ],
    ],
  ],
  [
    "m19",
    "6-8",
    "story",
    "Eleven Seconds",
    "Once segundos",
    "The final whistle was {prec:eleven seconds} away. Marcus {verb:dribbled} past two defenders, his lungs {sense:burning, his cleats thudding on the wet grass}. {trans:In that moment}, the stadium {verb:roared}. {comp:The ball left his foot like a shot from a slingshot}.",
    [
      [
        "An exact number of seconds raises the tension.",
        "Un número exacto de segundos aumenta la tensión.",
      ],
      [
        "“Dribbled” names the exact skill he used.",
        "“Dribbled” nombra la habilidad exacta que usó.",
      ],
      ["Burning and thudding give touch and sound.", "Burning y thudding dan tacto y sonido."],
      [
        "“In that moment” slows time down on the key action.",
        "“In that moment” hace más lento el tiempo en la acción clave.",
      ],
      [
        "“Roared” shows how loud and strong the crowd was.",
        "“Roared” muestra lo fuerte y poderosa que era la multitud.",
      ],
      [
        "The slingshot comparison shows the speed and snap of the kick.",
        "La comparación con la honda muestra la velocidad y el golpe de la patada.",
      ],
    ],
  ],
  [
    "m20",
    "6-8",
    "describe",
    "Market Day in Oaxaca",
    "Día de mercado en Oaxaca",
    "{hook:Smell the chocolate before you see the stall.} {sense:Roasted cacao and cinnamon curl through the narrow aisles.} Vendors {verb:haggle} in two languages. Pyramids of {prec:red, green, and yellow chiles} {verb:glisten} under striped awnings. {comp:The crowd flows like a ribbon} through the stalls.",
    [
      [
        "A command that starts with the senses puts the reader there.",
        "Una orden que empieza con los sentidos pone al lector en el lugar.",
      ],
      [
        "Smell and movement together describe the air in the market.",
        "El olfato y el movimiento juntos describen el aire del mercado.",
      ],
      [
        "“Haggle” names exactly what bargaining sounds like.",
        "“Haggle” nombra exactamente cómo suena regatear.",
      ],
      ["Naming the colors gives a precise picture.", "Nombrar los colores da una imagen precisa."],
      ["“Glisten” shows how the chiles shine.", "“Glisten” muestra cómo brillan los chiles."],
      [
        "A ribbon shows the flowing, winding shape of the crowd.",
        "Una cinta muestra la forma fluida y sinuosa de la multitud.",
      ],
    ],
  ],
  [
    "m21",
    "6-8",
    "describe",
    "The Abandoned Observatory",
    "El observatorio abandonado",
    "The dome {verb:loomed} over the hill, its paint {sense:peeling in gray curls}. Inside, dust {verb:drifted} through one beam of light. {trans:Beyond the door}, the telescope {comp:pointed at the ceiling like a rusted finger}. {sense:The air tasted of metal and old paper.}",
    [
      [
        "“Loomed” shows the dome as large and a little threatening.",
        "“Loomed” muestra la cúpula grande y un poco amenazante.",
      ],
      [
        "Peeling paint is a sight detail with texture.",
        "La pintura que se pela es un detalle visual con textura.",
      ],
      ["“Drifted” shows slow, gentle movement.", "“Drifted” muestra un movimiento lento y suave."],
      [
        "“Beyond the door” moves the reader's eye to a new place.",
        "“Beyond the door” lleva la mirada del lector a un lugar nuevo.",
      ],
      [
        "The rusted finger makes the telescope seem alive and old.",
        "El dedo oxidado hace que el telescopio parezca vivo y viejo.",
      ],
      [
        "Taste and smell together make the setting feel real.",
        "El gusto y el olfato juntos hacen real el ambiente.",
      ],
    ],
  ],
  [
    "m22",
    "6-8",
    "describe",
    "Subway at Rush Hour",
    "Metro en hora pico",
    "The train {verb:screeched} into the station and the doors {verb:sighed} open. {sense:A wall of warm air smelled of coffee and rain.} Commuters {verb:surged} forward, {comp:a human tide pulled by an invisible moon}. {prec:Platform 4} was packed to the yellow line.",
    [
      [
        "“Screeched” is a sound verb that matches metal on metal.",
        "“Screeched” es un verbo de sonido que coincide con metal sobre metal.",
      ],
      [
        "“Sighed” gives the doors a gentle, human sound.",
        "“Sighed” da a las puertas un sonido suave y humano.",
      ],
      [
        "Warm air and smells put the reader inside the station.",
        "El aire tibio y los olores ponen al lector dentro de la estación.",
      ],
      [
        "“Surged” shows a strong forward rush.",
        "“Surged” muestra una oleada fuerte hacia adelante.",
      ],
      [
        "The tide comparison shows a crowd moving as one.",
        "La comparación con la marea muestra una multitud moviéndose como una sola.",
      ],
      [
        "A named platform makes the scene specific.",
        "Un andén con nombre hace la escena específica.",
      ],
    ],
  ],
  [
    "m23",
    "6-8",
    "inform",
    "How Coral Reefs Form",
    "Cómo se forman los arrecifes",
    "{hook:Coral looks like rock, but it is alive.} {evid:According to marine biologists}, a reef grows only {prec:a few centimeters a year}. Tiny animals called polyps {verb:secrete} limestone skeletons. {coh:These skeletons} pile up over centuries. {trans:As a result}, a single reef may be thousands of years old.",
    [
      [
        "A surprising contrast, rock versus alive, is a hook.",
        "Un contraste sorprendente, roca contra ser vivo, es un gancho.",
      ],
      [
        "The signal phrase names the experts behind the fact.",
        "La frase señal nombra a los expertos detrás del dato.",
      ],
      [
        "An exact rate makes the growth speed clear.",
        "Una tasa exacta aclara la velocidad de crecimiento.",
      ],
      [
        "“Secrete” is the exact science verb for what polyps do.",
        "“Secrete” es el verbo científico exacto para lo que hacen los pólipos.",
      ],
      [
        "“These skeletons” points back to what polyps made.",
        "“These skeletons” remite a lo que hicieron los pólipos.",
      ],
      [
        "“As a result” links the slow growth to the age of the reef.",
        "“As a result” une el crecimiento lento con la edad del arrecife.",
      ],
    ],
  ],
  [
    "m24",
    "6-8",
    "inform",
    "The Printing Press Changes Reading",
    "La imprenta cambia la lectura",
    "Before {prec:1450}, scribes {verb:copied} books by hand, so a single book could take months. {trans:Then} Johannes Gutenberg {verb:perfected} movable metal type. {coh:This invention} made books cheaper and faster to make. {evid:Historians note} that literacy rose across Europe in the following centuries.",
    [
      [
        "An exact year anchors the reader in history.",
        "Un año exacto ubica al lector en la historia.",
      ],
      [
        "“Copied” says exactly what scribes did.",
        "“Copied” dice exactamente qué hacían los escribas.",
      ],
      ["“Then” moves the story forward in time.", "“Then” avanza la historia en el tiempo."],
      [
        "“Perfected” shows he improved something that already existed.",
        "“Perfected” muestra que mejoró algo que ya existía.",
      ],
      [
        "“This invention” points back to the movable type.",
        "“This invention” remite a los tipos móviles.",
      ],
      [
        "“Historians note” tells us the claim comes from experts.",
        "“Historians note” nos dice que la afirmación viene de expertos.",
      ],
    ],
  ],
  [
    "m25",
    "6-8",
    "explain",
    "Why the Sky Is Blue",
    "Por qué el cielo es azul",
    "{hook:If sunlight is white, why is the sky blue?} Air molecules {verb:scatter} short blue waves far more than long red ones. {coh:This scattering} fills the whole sky with blue light. {trans:By sunset}, the light travels through more air, {trans:so} the blue is scattered away and {sense:red and orange glow near the horizon}.",
    [
      [
        "A puzzle in question form makes the reader want the explanation.",
        "Un enigma en forma de pregunta hace que el lector quiera la explicación.",
      ],
      [
        "“Scatter” is the exact science verb for what the air does to light.",
        "“Scatter” es el verbo científico exacto para lo que el aire hace con la luz.",
      ],
      [
        "“This scattering” turns the verb into a noun to link two sentences.",
        "“This scattering” convierte el verbo en sustantivo para unir dos oraciones.",
      ],
      [
        "“By sunset” is a time transition that starts the second half of the explanation.",
        "“By sunset” es una transición de tiempo que inicia la segunda mitad de la explicación.",
      ],
      ["“So” shows cause and effect.", "“So” muestra causa y efecto."],
      [
        "Red and orange glow give us a sight detail that matches the science.",
        "Rojo y naranja brillando nos dan un detalle visual que coincide con la ciencia.",
      ],
    ],
  ],
  [
    "m26",
    "6-8",
    "explain",
    "How a Vaccine Trains the Body",
    "Cómo entrena una vacuna al cuerpo",
    "A vaccine shows the immune system a harmless piece of a germ, {comp:like a wanted poster before the criminal arrives}. {trans:Next}, white blood cells {verb:memorize} its shape. {coh:That memory} lets the body {verb:react} faster later. {evid:The CDC explains} that most vaccines need more than one dose.",
    [
      [
        "The wanted poster makes an abstract idea easy to picture.",
        "El cartel de “se busca” hace fácil imaginar una idea abstracta.",
      ],
      ["“Next” orders the steps of the process.", "“Next” ordena los pasos del proceso."],
      ["“Memorize” gives the cells a clear job.", "“Memorize” da a las células un trabajo claro."],
      [
        "“That memory” links back to what the cells learned.",
        "“That memory” remite a lo que aprendieron las células.",
      ],
      [
        "“React” is precise for what the body does.",
        "“React” es preciso para lo que hace el cuerpo.",
      ],
      [
        "Naming the CDC as the source builds trust in the fact.",
        "Nombrar la fuente da confianza en el dato.",
      ],
    ],
  ],
  [
    "m27",
    "6-8",
    "argue",
    "Phones Belong in Lockers",
    "Los teléfonos van en los casilleros",
    "I believe students should keep phones in lockers during the school day. {evid:One teacher reported} that discussions {verb:improved} once phones were put away. {trans:Although} some students use phones for research, {coh:that benefit} can be handled with school devices. {hook:Imagine a lunch table where everyone looks up.}",
    [
      [
        "The signal phrase shows the evidence comes from a person with experience.",
        "La frase señal muestra que la evidencia viene de alguien con experiencia.",
      ],
      ["“Improved” states the effect precisely.", "“Improved” expresa el efecto con precisión."],
      [
        "“Although” starts a concession: the writer admits the other side.",
        "“Although” inicia una concesión: el escritor admite el otro lado.",
      ],
      [
        "“That benefit” points back to research use and responds to it.",
        "“That benefit” remite al uso para investigar y lo responde.",
      ],
      [
        "Ending with an image invites the reader to picture the result.",
        "Terminar con una imagen invita al lector a imaginar el resultado.",
      ],
    ],
  ],
  [
    "m28",
    "6-8",
    "argue",
    "Close the Street at Drop-Off",
    "Cerrar la calle en la entrada",
    "Every morning, {prec:112 cars} crowd the block in front of our school. {evid:A crossing guard told us} she sees a near miss almost every week. {trans:For example}, last Monday a bike {verb:swerved} to avoid a van. {coh:These close calls} show why the street should be closed to cars. {trans:In conclusion}, safety must come first.",
    [
      [
        "A counted number is stronger than “a lot of cars”.",
        "Un número contado es más fuerte que “muchos autos”.",
      ],
      [
        "The signal phrase names a person who sees the problem daily.",
        "La frase señal nombra a una persona que ve el problema cada día.",
      ],
      ["“For example” introduces a specific case.", "“For example” presenta un caso específico."],
      [
        "“Swerved” shows a sudden dangerous move.",
        "“Swerved” muestra un movimiento brusco y peligroso.",
      ],
      [
        "“These close calls” collects the evidence and links it to the claim.",
        "“These close calls” reúne la evidencia y la une con la afirmación.",
      ],
      ["“In conclusion” signals the final point.", "“In conclusion” señala el punto final."],
    ],
  ],
  [
    "m29",
    "6-8",
    "howto",
    "How to Test Soil Acidity",
    "Cómo medir la acidez del suelo",
    "{hook:Is your garden too sour for tomatoes?} {trans:To begin}, {verb:scoop} two tablespoons of soil into a clean cup. {trans:Then} add distilled water and {verb:stir} until the mixture is {sense:thick and muddy}. {coh:This mixture} is what you test. A reading near {prec:pH 6.5} is ideal for most vegetables.",
    [
      [
        "A question the reader cares about opens the instructions.",
        "Una pregunta que le importa al lector abre las instrucciones.",
      ],
      ["“To begin” opens the sequence.", "“To begin” abre la secuencia."],
      ["“Scoop” is more exact than “put”.", "“Scoop” es más exacto que “put”."],
      ["“Then” moves to step two.", "“Then” pasa al paso dos."],
      ["“Stir” names the action precisely.", "“Stir” nombra la acción con precisión."],
      [
        "Thick and muddy tell the reader what to feel and see.",
        "Thick and muddy dicen al lector qué sentir y ver.",
      ],
      [
        "“This mixture” points back to what was just made.",
        "“This mixture” remite a lo que se acaba de preparar.",
      ],
      ["An exact number gives the target.", "Un número exacto da la meta."],
    ],
  ],
  [
    "m30",
    "6-8",
    "letter",
    "A Review of the Science Museum",
    "Reseña del museo de ciencias",
    "The Science Museum is worth a Saturday. {hook:I walked in expecting boring signs and left holding a live tarantula.} {sense:The planetarium hummed softly, and the room smelled faintly of popcorn.} {trans:However}, the line for the dinosaur hall was {prec:forty minutes} long. {evid:According to a guide}, mornings are quieter.",
    [
      [
        "A funny, surprising contrast works as a hook for a review.",
        "Un contraste gracioso y sorprendente funciona como gancho en una reseña.",
      ],
      [
        "Sound and smell give the reader a feel for the place.",
        "El sonido y el olfato dan al lector una idea del lugar.",
      ],
      [
        "“However” shows a fair complaint after the praise.",
        "“However” muestra una queja justa después del elogio.",
      ],
      [
        "An exact wait time is more useful than “a long line”.",
        "Un tiempo exacto de espera es más útil que “una fila larga”.",
      ],
      [
        "The signal phrase tells us where the tip comes from.",
        "La frase señal nos dice de dónde viene el consejo.",
      ],
    ],
  ],
  [
    "m31",
    "6-8",
    "bio",
    "Katherine Johnson's Careful Math",
    "Las matemáticas cuidadosas de Katherine Johnson",
    "Katherine Johnson {verb:calculated} flight paths by hand for NASA. {evid:NASA archives record} that astronaut John Glenn asked her to check the computer's numbers before his {prec:1962} orbit. {trans:In the end}, her answers {verb:matched} the machine. {coh:This trust} says as much about her accuracy as about her courage.",
    [
      [
        "“Calculated” is exact for the work she did.",
        "“Calculated” es exacto para el trabajo que hacía.",
      ],
      [
        "The signal phrase shows where the historical claim comes from.",
        "La frase señal muestra de dónde viene la afirmación histórica.",
      ],
      ["An exact year places the event.", "Un año exacto ubica el hecho."],
      [
        "“In the end” is a time transition that closes the story.",
        "“In the end” es una transición de tiempo que cierra la historia.",
      ],
      [
        "“Matched” shows her result agreed with the computer.",
        "“Matched” muestra que su resultado coincidió con la computadora.",
      ],
      ["“This trust” points back to Glenn's request.", "“This trust” remite al pedido de Glenn."],
    ],
  ],
  [
    "m32",
    "6-8",
    "bio",
    "Wangari Maathai Plants a Movement",
    "Wangari Maathai siembra un movimiento",
    "In Kenya, Wangari Maathai {verb:rallied} women to plant trees. {coh:Their effort} grew into the Green Belt Movement. {evid:The Nobel Committee reports} that over {prec:fifty million trees} were planted. {trans:Because of this work}, she became the first African woman to win the Peace Prize. {comp:Her roots ran deep, like the trees she loved.}",
    [
      [
        "“Rallied” shows she brought people together with energy.",
        "“Rallied” muestra que reunió a la gente con energía.",
      ],
      ["“Their effort” points back to the planting.", "“Their effort” remite a la siembra."],
      [
        "The signal phrase gives the source of a big number.",
        "La frase señal da la fuente de un número grande.",
      ],
      [
        "An exact count shows how large the movement became.",
        "Una cifra exacta muestra qué tan grande se volvió el movimiento.",
      ],
      [
        "“Because of this work” shows cause and effect.",
        "“Because of this work” muestra causa y efecto.",
      ],
      [
        "The comparison ends the text with an image.",
        "La comparación termina el texto con una imagen.",
      ],
    ],
  ],
];

const MARK = /\{(\w+):([^}]+)\}/g;
/** Splits marked text into segments: { t: plain text } or { move, t, note: [en, es], i }. Also numbers sentences. */
export function parseMentor(text, notes) {
  const segs = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(MARK)) {
    if (m.index > last) segs.push({ t: text.slice(last, m.index) });
    segs.push({ move: m[1], t: m[2], note: notes[k] || ["", ""], i: k });
    k += 1;
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ t: text.slice(last) });
  // Split plain text at sentence ends and number every piece with its sentence.
  const out = [];
  let sent = 0;
  const ends = (t) => /[.!?]["”]?$/.test(t);
  for (const seg of segs) {
    if (seg.move) {
      seg.sent = sent;
      out.push(seg);
      if (ends(seg.t)) sent += 1;
      continue;
    }
    for (const piece of seg.t.split(/(?<=[.!?]["”]?)(?=\s)/)) {
      if (!piece) continue;
      out.push({ t: piece, sent });
      if (ends(piece)) sent += 1;
    }
  }
  return out;
}
export const plainText = (marked) => marked.replace(MARK, "$2");

const unpack = ([id, band, genre, title, titleEs, text, notes]) => ({
  id,
  band,
  genre,
  title,
  titleEs,
  text,
  notes,
  plain: plainText(text),
});
export const TEXTS = ROWS.map(unpack);
export const textsFor = (band) => TEXTS.filter((t) => t.band === band);
export const findText = (id) => TEXTS.find((t) => t.id === id) || null;
export const movesIn = (t) => [...new Set([...t.text.matchAll(MARK)].map((m) => m[1]))];

// Try-it tasks: [prompt, weak verbs to replace (verb) | transition kind (trans), model sentence].
// Each move has two tasks per band.
const TRY_ROWS = {
  verb: {
    "3-5": [
      ["The dog went to the door.", ["went"], "The dog bolted to the door."],
      ["She walked across the room.", ["walked"], "She tiptoed across the room."],
    ],
    "6-8": [
      ["The player ran toward the goal.", ["ran"], "The player sprinted toward the goal."],
      ["He said the answer.", ["said"], "He whispered the answer."],
    ],
  },
  sense: {
    "3-5": [
      [
        "Write one sentence about a bakery. Add a smell or a sound.",
        [],
        "The bakery smelled like warm cinnamon and crackling crust.",
      ],
      [
        "Write one sentence about snow. Add something you can feel.",
        [],
        "The icy snow stung my cheeks.",
      ],
    ],
    "6-8": [
      [
        "Write one sentence about a busy hallway. Add a sound and a smell.",
        [],
        "Sneakers squeaked on the floor, and the hall smelled of floor wax and pizza.",
      ],
      [
        "Write one sentence about a thunderstorm. Add a sight detail.",
        [],
        "Silver lightning flickered across the dark sky.",
      ],
    ],
  },
  hook: {
    "3-5": [
      [
        "Write the first line of a story about a surprise party.",
        [],
        "Shh! Did you hear a key in the door?",
      ],
      [
        "Write the first line of a report about owls.",
        [],
        "Did you know an owl can turn its head almost all the way around?",
      ],
    ],
    "6-8": [
      [
        "Write the first line of an article about sleep and teens.",
        [],
        "Imagine falling asleep in first period every day.",
      ],
      [
        "Write the first line of a story that starts in the middle of a problem.",
        [],
        '"The lights just went out," Ana whispered.',
      ],
    ],
  },
  trans: {
    "3-5": [
      [
        "Connect these ideas with a time word: We packed our bags. We left for the beach.",
        "time",
        "First we packed our bags. Then we left for the beach.",
      ],
      [
        "Connect these ideas with a contrast word: I wanted to swim. The water was cold.",
        "contrast",
        "I wanted to swim, but the water was cold.",
      ],
    ],
    "6-8": [
      [
        "Connect with a cause word: The road flooded. School closed.",
        "cause",
        "The road flooded, so school closed.",
      ],
      [
        "Connect with a contrast word: Many students like the idea. Some worry about the cost.",
        "contrast",
        "Many students like the idea; however, some worry about the cost.",
      ],
    ],
  },
  evid: {
    "3-5": [
      [
        "Share this fact with a signal phrase: Owls hunt at night.",
        [],
        "According to the science book, owls hunt at night.",
      ],
      [
        "Share this fact with a signal phrase: A cheetah can run 60 miles per hour.",
        [],
        "The article says a cheetah can run 60 miles per hour.",
      ],
    ],
    "6-8": [
      [
        "Introduce this evidence: Teens need 8 to 10 hours of sleep.",
        [],
        "According to sleep experts, teens need 8 to 10 hours of sleep.",
      ],
      [
        "Introduce this evidence: Plastic bottles take hundreds of years to break down.",
        [],
        "Research suggests that plastic bottles take hundreds of years to break down.",
      ],
    ],
  },
  coh: {
    "3-5": [
      [
        "Write two sentences about a cat. Start the second with This, These, or They.",
        [],
        "A cat sat on my porch. This cat has a torn ear.",
      ],
      [
        "Write two sentences about a storm. Start the second with This or That.",
        [],
        "A storm rolled in at noon. That storm knocked out the power.",
      ],
    ],
    "6-8": [
      [
        "Write two sentences about a school rule. Make the second point back to the first.",
        [],
        "Our school banned phones in class. This rule changed how students talk at lunch.",
      ],
      [
        "Write two sentences about a science discovery. Use These or Another in the second.",
        [],
        "Scientists found a new kind of frog. This frog lives only on one mountain.",
      ],
    ],
  },
  comp: {
    "3-5": [
      ["Describe the moon. Use like or as.", [], "The moon was like a silver coin."],
      ["Describe a fast runner. Use like or as.", [], "She ran as fast as the wind."],
    ],
    "6-8": [
      [
        "Describe a crowded hallway. Use a comparison.",
        [],
        "The hallway was like a river of backpacks.",
      ],
      [
        "Describe a quiet room before a test. Use a comparison.",
        [],
        "The room was as silent as a frozen lake.",
      ],
    ],
  },
  prec: {
    "3-5": [
      [
        "Make this sentence exact: We saw many animals at the zoo.",
        [],
        "We saw twelve animals at the zoo.",
      ],
      ["Make this sentence exact: A girl came into the room.", [], "Mia came into the room."],
    ],
    "6-8": [
      [
        "Make this sentence exact: A lot of people came to the game.",
        [],
        "About 800 people came to the game.",
      ],
      ["Make this sentence exact: He lives in a big city.", [], "He lives in Chicago."],
    ],
  },
};
export const TRY = Object.fromEntries(
  Object.entries(TRY_ROWS).map(([move, bands]) => [
    move,
    Object.fromEntries(
      Object.entries(bands).map(([band, list]) => [
        band,
        list.map(([prompt, extra, model], i) => ({
          id: `${move}-${band}-${i + 1}`,
          prompt,
          weak: move === "verb" ? extra : [],
          fn: move === "trans" ? extra : "",
          model,
        })),
      ]),
    ),
  ]),
);

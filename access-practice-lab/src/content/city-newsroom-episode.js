// Language City episode: The Neighborhood Newsroom (/city/library/neighborhood-newsroom).
// Key Language Use: Argue — separate direct observation from interpretation, check source
// transparency, assemble a verified evidence packet, rehearse a supported argument aloud,
// and write a short editorial with named sources. Practice, not a test.
import { bi } from "./city-kit.js";

export const NEWSROOM_EPISODE = {
  id: "neighborhood-newsroom",
  place: "library",
  use: "Argue",
  storageKey: "accessPracticeLab:v1:city-newsroom-episode",
  title: bi("The Neighborhood Newsroom", "La Redacción del Vecindario"),
  blurb: bi(
    "Separate observation from interpretation, check who the source is, build a verified story packet and argue your conclusion with evidence.",
    "Separa la observación de la interpretación, revisa quién es la fuente, arma un paquete verificado y defiende tu conclusión con evidencia.",
  ),
  eyebrow: bi(
    "Language City · an episode at Maple Street Library Newsroom (Argue)",
    "Ciudad del lenguaje · un episodio en la Redacción de la Biblioteca (Argumentar)",
  ),
  spotsNeeded: { A: 4, B: 5, C: 6 },
  people: {
    elena: { name: "Elena", role: bi("student editor", "editora estudiantil") },
    marcus: { name: "Marcus", role: bi("student reporter", "reportero estudiantil") },
  },
  spots: [
    {
      id: "park-sign",
      label: bi("city park notice", "aviso del parque municipal"),
      at: [16, 44],
      sign: {
        head: bi("Parks Department Notice (Signed: M. Alvarez, Director)", "Aviso del Depto. de Parques (Firmado: M. Alvarez, Directora)"),
        lines: [
          bi("Oak Park lights are off from 6:00 p.m. on Tuesday and Wednesday.", "Las luces de Oak Park estarán apagadas desde las 6:00 p. m. martes y miércoles."),
          bi("Reason: crews are replacing 12 broken light poles.", "Motivo: cuadrillas reemplazarán 12 postes de luz dañados."),
          bi("Normal 9:00 p.m. hours return Thursday.", "El horario normal de 9:00 p. m. vuelve el jueves."),
        ],
      },
      word: { en: "source", es: "fuente", def: bi("the named person or document that gives information", "la persona o el documento con nombre que da la información") },
    },
    {
      id: "photo-log",
      label: bi("reporter photo log", "registro de fotos del reportero"),
      at: [35, 58],
      sign: {
        head: bi("Direct Observation (Tuesday, 5:45 p.m.)", "Observación directa (martes, 5:45 p. m.)"),
        lines: [
          bi("Two utility trucks are parked near the basketball court.", "Dos camiones de servicio están estacionados cerca de la cancha."),
          bi("Workers are lifting a new metal light pole.", "Los trabajadores están levantando un poste de luz metálico nuevo."),
        ],
      },
      word: { en: "observation", es: "observación", def: bi("something you directly saw, heard, or measured", "algo que viste, escuchaste o mediste directamente") },
    },
    {
      id: "rumor-post",
      label: bi("unsigned social post", "publicación sin firma"),
      at: [55, 42],
      sign: {
        head: bi("Anonymous Post (“ParkFan99”)", "Publicación anónima (“ParkFan99”)"),
        lines: [
          bi("“The city is shutting down Oak Park forever because they don't care about kids!”", "“¡La ciudad está cerrando Oak Park para siempre porque no le importan los niños!”"),
          bi("No name, no document, no date.", "Sin nombre, sin documento, sin fecha."),
        ],
      },
      word: { en: "interpretation", es: "interpretación", def: bi("an opinion or guess about what a fact means", "una opinión o suposición sobre lo que significa un hecho") },
    },
    {
      id: "coach-quote",
      label: bi("interview notebook", "cuaderno de entrevistas"),
      at: [72, 60],
      sign: {
        head: bi("Interview: Coach Lin (Oak Park Youth League)", "Entrevista: Entrenador Lin (Liga Juvenil de Oak Park)"),
        lines: [
          bi("“Practice moved to the gym on Tuesday and Wednesday, and we return to Oak Park Thursday.”", "“La práctica pasó al gimnasio el martes y miércoles, y volvemos a Oak Park el jueves.”"),
        ],
      },
      word: { en: "evidence", es: "evidencia", def: bi("facts or quotes that support a claim", "hechos o citas que apoyan una afirmación") },
    },
    {
      id: "transparency-card",
      label: bi("source transparency checklist", "lista de transparencia de fuentes"),
      at: [86, 40],
      sign: {
        head: bi("Newsroom Transparency Rule", "Regla de transparencia de la redacción"),
        lines: [
          bi("Name WHO said it and HOW they know.", "Nombra QUIÉN lo dijo y CÓMO lo sabe."),
          bi("Separate what was observed from what someone assumes.", "Separa lo observado de lo que alguien supone."),
        ],
      },
      word: { en: "transparent", es: "transparente", def: bi("open and clear about where information comes from", "abierto y claro sobre de dónde viene la información") },
    },
    {
      id: "headline-board",
      label: bi("draft headline board", "pizarra de titulares borrador"),
      at: [46, 74],
      sign: {
        head: bi("Two Draft Headlines", "Dos titulares borrador"),
        lines: [
          bi("Draft 1: City Closes Oak Park Forever", "Borrador 1: La ciudad cierra Oak Park para siempre"),
          bi("Draft 2: Oak Park Closes at 6 p.m. for 2 Nights to Replace 12 Light Poles", "Borrador 2: Oak Park cierra a las 6 p. m. por 2 noches para reemplazar 12 postes"),
        ],
      },
      word: { en: "claim", es: "afirmación", def: bi("a statement you argue is true using evidence", "una declaración que defiendes como verdadera usando evidencia") },
    },
  ],
  dialogue: [
    {
      who: "marcus",
      ...bi(
        "Elena, people online are saying the city closed Oak Park forever. Should we publish that headline?",
        "Elena, la gente en internet dice que la ciudad cerró Oak Park para siempre. ¿Publicamos ese titular?",
      ),
    },
    {
      who: "elena",
      ...bi(
        "Hold on. Who is the source of that post, and what did you actually observe at the park?",
        "Espera. ¿Quién es la fuente de esa publicación y qué observaste realmente en el parque?",
      ),
    },
    {
      who: "marcus",
      ...bi(
        "The post is unsigned. At the park, I observed two utility trucks and workers installing new light poles, and the Parks Director's notice says normal hours return Thursday.",
        "La publicación no tiene firma. En el parque observé dos camiones de servicio y trabajadores instalando postes nuevos, y el aviso de la directora dice que el horario normal vuelve el jueves.",
      ),
    },
    {
      who: "elena",
      ...bi(
        "That is the difference between observation and interpretation. Let's name the Parks Director and Coach Lin as our sources so readers can check the facts themselves.",
        "Esa es la diferencia entre observación e interpretación. Nombremos a la directora de Parques y al entrenador Lin como fuentes para que los lectores puedan verificar los hechos.",
      ),
    },
  ],
  listenQ: {
    A: {
      ask: bi("What did Marcus directly observe at Oak Park?", "¿Qué observó Marcus directamente en Oak Park?"),
      opts: [
        { id: "a", ...bi("Workers installing new light poles", "Trabajadores instalando postes de luz nuevos"), why: bi("Yes. Marcus saw two utility trucks and workers installing new light poles.", "Sí. Marcus vio dos camiones y trabajadores instalando postes nuevos.") },
        { id: "b", ...bi("A locked gate that said Closed Forever", "Una reja cerrada que decía Cerrado para siempre"), why: bi("That was a rumor in the unsigned post, not what Marcus observed.", "Eso era un rumor en la publicación sin firma, no lo que observó Marcus.") },
        { id: "c", ...bi("A new swimming pool", "Una piscina nueva"), why: bi("Neither reporter mentions a swimming pool.", "Ningún reportero menciona una piscina.") },
      ],
      answer: "a",
    },
    B: {
      ask: bi("Why does Elena reject the unsigned social post as evidence?", "¿Por qué rechaza Elena la publicación sin firma como evidencia?"),
      opts: [
        { id: "a", ...bi("It is too short.", "Es demasiado corta."), why: bi("Length is not the issue—source transparency is.", "La longitud no es el problema, sino la transparencia de la fuente.") },
        { id: "b", ...bi("It has no named source and makes an unsupported interpretation.", "No tiene fuente con nombre y hace una interpretación sin respaldo."), why: bi("Yes. Readers cannot verify an anonymous guess with no document.", "Sí. Los lectores no pueden verificar una suposición anónima sin documento.") },
        { id: "c", ...bi("She prefers Draft 1.", "Ella prefiere el Borrador 1."), why: bi("Elena argues against Draft 1 because the evidence contradicts it.", "Elena argumenta contra el Borrador 1 porque la evidencia lo contradice.") },
      ],
      answer: "b",
    },
    C: {
      ask: bi("How does naming the Parks Director and Coach Lin make the article transparent?", "¿Cómo hace transparente al artículo nombrar a la directora de Parques y al entrenador Lin?"),
      opts: [
        { id: "a", ...bi("It lets readers see who gave the facts and verify them independently.", "Permite a los lectores ver quién dio los hechos y verificarlos por su cuenta."), why: bi("Yes. Source transparency shows readers where every claim comes from.", "Sí. La transparencia de fuentes muestra a los lectores de dónde viene cada afirmación.") },
        { id: "b", ...bi("It proves the reporters never make mistakes.", "Demuestra que los reporteros nunca se equivocan."), why: bi("Naming sources invites checking; it does not claim perfection.", "Nombrar fuentes invita a verificar; no afirma perfección.") },
        { id: "c", ...bi("It hides which facts were observed.", "Oculta qué hechos fueron observados."), why: bi("Transparency makes observations clearer, not hidden.", "La transparencia hace más claras las observaciones, no ocultas.") },
      ],
      answer: "a",
    },
  },
  readQ: {
    A: {
      ask: bi("Read the two draft headlines. Which headline matches the Parks Department notice?", "Lee los dos titulares borrador. ¿Cuál coincide con el aviso del Depto. de Parques?"),
      opts: [
        { id: "a", ...bi("Draft 1: City Closes Oak Park Forever", "Borrador 1: La ciudad cierra Oak Park para siempre"), why: bi("The notice says normal hours return Thursday.", "El aviso dice que el horario normal vuelve el jueves.") },
        { id: "b", ...bi("Draft 2: Oak Park Closes at 6 p.m. for 2 Nights to Replace 12 Light Poles", "Borrador 2: Oak Park cierra a las 6 p. m. por 2 noches para reemplazar 12 postes"), why: bi("Yes. Draft 2 states the exact documented facts.", "Sí. El Borrador 2 indica los hechos documentados con exactitud.") },
        { id: "c", ...bi("Neither headline mentions Oak Park.", "Ningún titular menciona Oak Park."), why: bi("Both drafts name Oak Park.", "Ambos borradores nombran Oak Park.") },
      ],
      answer: "b",
    },
    B: {
      ask: bi("Which statement is an OBSERVATION rather than an INTERPRETATION?", "¿Qué enunciado es una OBSERVACIÓN y no una INTERPRETACIÓN?"),
      opts: [
        { id: "a", ...bi("“The city doesn't care about kids.”", "“A la ciudad no le importan los niños.”"), why: bi("That guesses someone's feelings—it is an interpretation.", "Eso supone los sentimientos de alguien: es una interpretación.") },
        { id: "b", ...bi("“Two utility trucks are parked near the basketball court at 5:45 p.m.”", "“Dos camiones de servicio están estacionados cerca de la cancha a las 5:45 p. m.”"), why: bi("Yes. That can be directly seen and verified in the photo log.", "Sí. Eso se puede ver y verificar directamente en el registro de fotos.") },
        { id: "c", ...bi("“Oak Park will never reopen.”", "“Oak Park nunca volverá a abrir.”"), why: bi("That is an unsupported prediction, not an observation.", "Esa es una predicción sin respaldo, no una observación.") },
      ],
      answer: "b",
    },
    C: {
      ask: bi("Why should a reporter separate observation from interpretation even when they have a strong opinion?", "¿Por qué debe un reportero separar la observación de la interpretación incluso cuando tiene una opinión fuerte?"),
      opts: [
        { id: "a", ...bi("So readers can see the verified facts first and judge whether the argument is supported.", "Para que los lectores vean primero los hechos verificados y juzguen si el argumento tiene respaldo."), why: bi("Yes. Clear evidence and named sources let readers evaluate the claim fairly.", "Sí. La evidencia clara y las fuentes con nombre permiten evaluar la afirmación con justicia.") },
        { id: "b", ...bi("Because observations are always false.", "Porque las observaciones siempre son falsas."), why: bi("Observations are the direct facts you verify.", "Las observaciones son los hechos directos que verificas.") },
        { id: "c", ...bi("So the article needs no sources.", "Para que el artículo no necesite fuentes."), why: bi("Good reporting still names every source transparently.", "El buen periodismo siempre nombra cada fuente con transparencia.") },
      ],
      answer: "a",
    },
  },
  task: {
    title: bi("Build the verified story packet", "Arma el paquete verificado de la noticia"),
    prompt: bi(
      "Choose ONLY the 3 items that are direct observations or transparent, named sources.",
      "Elige SOLO los 3 elementos que son observaciones directas o fuentes transparentes con nombre.",
    ),
    items: [
      { id: "notice", required: true, label: bi("Parks Director M. Alvarez's signed notice (12 light poles, reopens Thursday)", "Aviso firmado por la directora M. Alvarez (12 postes, reabre el jueves)") },
      { id: "photo", required: true, label: bi("Photo log: 2 utility trucks and workers installing a metal pole at 5:45 p.m.", "Registro de fotos: 2 camiones y trabajadores instalando un poste a las 5:45 p. m.") },
      { id: "coach", required: true, label: bi("Named quote from Coach Lin: youth league returns to Oak Park Thursday", "Cita con nombre del entrenador Lin: la liga vuelve a Oak Park el jueves") },
      { id: "rumor", required: false, label: bi("Anonymous post (“ParkFan99”) claiming the park is closing forever", "Publicación anónima (“ParkFan99”) diciendo que el parque cierra para siempre") },
      { id: "guess", required: false, label: bi("Unsupported interpretation: “The city does not care about kids”", "Interpretación sin respaldo: “A la ciudad no le importan los niños”") },
    ],
  },
  speak: {
    A: {
      task: bi("Tell Elena which headline to publish and name one source.", "Dile a Elena qué titular publicar y nombra una fuente."),
      starters: [bi("We should publish ___ .", "Debemos publicar ___."), bi("My source is ___ .", "Mi fuente es ___.")],
      model: bi("We should publish Draft 2. My source is the Parks Director's signed notice.", "Debemos publicar el Borrador 2. Mi fuente es el aviso firmado de la directora de Parques."),
    },
    B: {
      task: bi("Argue why Draft 2 is more accurate than Draft 1, naming one observation and one source.", "Argumenta por qué el Borrador 2 es más preciso que el Borrador 1, nombrando una observación y una fuente."),
      starters: [bi("Draft 2 is accurate because ___ observed ___ .", "El Borrador 2 es preciso porque ___ observó ___."), bi("According to ___, ___ .", "Según ___, ___.")],
      model: bi("Draft 2 is accurate because Marcus observed workers replacing light poles. According to Parks Director M. Alvarez, normal hours return Thursday.", "El Borrador 2 es preciso porque Marcus observó a trabajadores reemplazando postes. Según la directora M. Alvarez, el horario normal vuelve el jueves."),
    },
    C: {
      task: bi("Deliver a 2-sentence editorial pitch explaining observation vs interpretation and source transparency.", "Presenta un argumento de 2 oraciones explicando observación vs interpretación y transparencia de fuentes."),
      starters: [bi("Although the anonymous post claims ___, direct observation shows ___ .", "Aunque la publicación anónima afirma ___, la observación directa muestra ___."), bi("Because we name ___ as our source, readers can ___ .", "Como nombramos a ___ como fuente, los lectores pueden ___.")],
      model: bi("Although the anonymous post claims Oak Park is closing forever, direct observation and Coach Lin confirm crews are only replacing twelve light poles for two nights. Because we name Parks Director M. Alvarez as our source, readers can verify the facts themselves.", "Aunque la publicación anónima afirma que Oak Park cierra para siempre, la observación directa y el entrenador Lin confirman que solo reemplazan doce postes por dos noches. Como nombramos a la directora M. Alvarez como fuente, los lectores pueden verificar los hechos."),
    },
  },
  write: {
    A: {
      task: bi("Write 2 sentences stating what is really happening at Oak Park and who your source is.", "Escribe 2 oraciones diciendo qué pasa realmente en Oak Park y quién es tu fuente."),
      frames: [bi("Oak Park is closing early for ___ .", "Oak Park cierra temprano por ___."), bi("According to ___, it reopens ___ .", "Según ___, reabre ___.")],
      minWords: 4,
    },
    B: {
      task: bi("Write a short newsroom note arguing for Draft 2 using an observation and a named source.", "Escribe una nota breve argumentando a favor del Borrador 2 con una observación y una fuente con nombre."),
      frames: [bi("The claim in Draft 1 is only an interpretation because ___ .", "La afirmación del Borrador 1 es solo una interpretación porque ___."), bi("According to ___, the real reason is ___ .", "Según ___, el motivo real es ___.")],
      minWords: 10,
    },
    C: {
      task: bi("Write a short editorial arguing why readers should trust verified observations and named sources, using because, but, and so.", "Escribe un editorial breve argumentando por qué los lectores deben confiar en observaciones verificadas y fuentes con nombre, usando because, but y so."),
      frames: [bi("We should publish Draft 2 because ___ .", "Debemos publicar el Borrador 2 porque ___."), bi("The social post sounded urgent, but ___ .", "La publicación sonaba urgente, pero ___."), bi("We named every source, so ___ .", "Nombramos cada fuente, así que ___.")],
      minWords: 22,
    },
  },
};

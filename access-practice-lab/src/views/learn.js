// Interactive Learn Hub: Notice -> Predict -> Interact -> Respond -> Feedback -> Revise -> Apply
// Covers Listening, Speaking, Reading, Writing, Academic Vocabulary, and WIDA Key Language Uses
// across Grades 3-5 (Visual Language Discovery) and Grades 6-8 (Academic Language Studio).
import { bandSwitchHTML, crumbsHTML, domainGlyph } from "../components.js";
import { i18nFor } from "../i18n.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { canSpeak, speak } from "../speech.js";
import { ART, BASE, announce, bandLabel, html, icon, raw, storage, wordCount } from "../util.js";

const LEARN_KEY = "accessPracticeLab:v1:learnEngine";
const IGN = raw("data-nsr-ignore");

function loadLearnState() {
  try {
    return JSON.parse(storage.get(LEARN_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLearnState(state) {
  storage.set(LEARN_KEY, JSON.stringify(state));
}

const TRACKS = [
  {
    id: "Listening",
    icon: "listening",
    domain: "Listening",
    colorClass: "d-listening",
    title: ["Listening Detective", "Detective de escucha"],
    klu: "Explain",
    eld: "ELD-SC · Science & Inquiry",
    studioHref: (band) => `${BASE}/Listening/A?grades=${band}`,
    deepHref: (band) => `${BASE}/worlds/signal-station?grades=${band}`,
    deepLabel: ["Signal Station World", "Mundo Estación de Señales"],
    lessons: {
      "3-5": {
        topic: ["School Garden Rain Gauge", "Pluviómetro del jardín escolar"],
        audioScript:
          "First, set the clear rain tube upright near the garden bed. However, do not place it under the oak tree because leaves block the rain. Finally, read the millimeter line at eye level.",
        noticePrompt: [
          "1. Notice: Listen or read the audio clue. Which signal word warns you about a mistake to avoid?",
          "1. Observar: Escucha o lee la pista de audio. ¿Qué palabra señal te advierte sobre un error que debes evitar?",
        ],
        noticeOptions: [
          {
            id: "however",
            label: ["however — signals a contrast or warning", "however — señala un contraste o advertencia"],
            ok: true,
            why: [
              "Right! 'However, do not place it under the oak tree' warns the listener what NOT to do.",
              "¡Correcto! 'However, do not place it under the oak tree' advierte al oyente qué NO hacer.",
            ],
          },
          {
            id: "first",
            label: ["first — signals a contrast or warning", "first — señala un contraste o advertencia"],
            ok: false,
            why: [
              "Not quite. 'First' starts step 1. Look for the word that shifts to what you should NOT do.",
              "Todavía no. 'First' inicia el paso 1. Busca la palabra que cambia hacia lo que NO debes hacer.",
            ],
          },
          {
            id: "finally",
            label: ["finally — signals a contrast or warning", "finally — señala un contraste o advertencia"],
            ok: false,
            why: [
              "Not quite. 'Finally' introduces the last step. Check the middle sentence.",
              "Todavía no. 'Finally' presenta el último paso. Revisa la oración del medio.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: What happens if a student puts the rain tube under the oak tree?",
          "2. Predecir e interactuar: ¿Qué pasa si un estudiante pone el tubo de lluvia debajo del roble?",
        ],
        predictOptions: [
          {
            id: "blocked",
            label: ["Tree leaves block the rain, so the measurement is too low.", "Las hojas bloquean la lluvia, por lo que la medición es demasiado baja."],
            ok: true,
            why: [
              "Spot on! You connected the cause ('leaves block the rain') to the measurement effect.",
              "¡Exacto! Conectaste la causa ('leaves block the rain') con el efecto en la medición.",
            ],
          },
          {
            id: "overflow",
            label: ["The tube fills twice as fast under the branches.", "El tubo se llena el doble de rápido bajo las ramas."],
            ok: false,
            why: [
              "Listen closely to 'because leaves block the rain.' Blocking rain means less water enters.",
              "Escucha con atención 'because leaves block the rain'. Bloquear la lluvia significa que entra menos agua.",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Revise: Explain in 1–2 sentences where to put the rain tube and why. Use a signal word like 'first', 'however', or 'because'.",
          "3. Responder y revisar: Explica en 1 o 2 oraciones dónde colocar el tubo de lluvia y por qué. Usa una palabra señal como 'first', 'however' o 'because'.",
        ],
        frames: [
          "First, place the rain tube ___ because ___.",
          "However, do not put it ___ because ___.",
        ],
        targetWords: ["first", "however", "because", "rain", "leaves", "oak", "tube"],
      },
      "6-8": {
        topic: ["Watershed Runoff Lab Briefing", "Informe de laboratorio sobre escorrentía"],
        audioScript:
          "Initially, both trays received 500 milliliters of water. Whereas the bare-soil tray lost 68 percent of its water as muddy runoff, the clover-covered tray retained most of the moisture because root networks slowed the flow.",
        noticePrompt: [
          "1. Notice: Which academic connector signals a direct comparison between the two experimental trays?",
          "1. Observar: ¿Qué conector académico señala una comparación directa entre las dos bandejas experimentales?",
        ],
        noticeOptions: [
          {
            id: "whereas",
            label: ["whereas — contrasts two experimental conditions", "whereas — contrasta dos condiciones experimentales"],
            ok: true,
            why: [
              "Confirmed. 'Whereas' sets up a precise scientific contrast between bare soil and clover cover.",
              "Confirmado. 'Whereas' establece un contraste científico preciso entre suelo descubierto y trébol.",
            ],
          },
          {
            id: "initially",
            label: ["initially — contrasts two experimental conditions", "initially — contrasta dos condiciones experimentales"],
            ok: false,
            why: [
              "'Initially' marks the starting condition for both trays. Look for the word that contrasts them.",
              "'Initially' marca la condición inicial de ambas bandejas. Busca la palabra que las contrasta.",
            ],
          },
          {
            id: "both",
            label: ["both — contrasts two experimental conditions", "both — contrasta dos condiciones experimentales"],
            ok: false,
            why: [
              "'Both' shows what was kept constant. Find the connector that contrasts the two outcomes.",
              "'Both' muestra lo que se mantuvo constante. Encuentra el conector que contrasta los dos resultados.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: Based on the briefing, why did the clover tray retain more moisture?",
          "2. Predecir e interactuar: Según el informe, ¿por qué retuvo más humedad la bandeja con trébol?",
        ],
        predictOptions: [
          {
            id: "roots",
            label: ["Root networks slowed the water flow, reducing runoff.", "Las redes de raíces frenaron el flujo de agua, reduciendo la escorrentía."],
            ok: true,
            why: [
              "Strong listening! You caught the causal mechanism ('because root networks slowed the flow').",
              "¡Excelente escucha! Captaste el mecanismo causal ('because root networks slowed the flow').",
            ],
          },
          {
            id: "lesswater",
            label: ["The clover tray received less water at the start.", "La bandeja de trébol recibió menos agua al principio."],
            ok: false,
            why: [
              "Check the first sentence: 'Initially, both trays received 500 milliliters of water.'",
              "Revisa la primera oración: 'Initially, both trays received 500 milliliters of water.'",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Revise: Summarize the lab finding using 'whereas' or 'because' and cite the runoff evidence.",
          "3. Responder y revisar: Resume el hallazgo del laboratorio usando 'whereas' o 'because' y cita la evidencia de escorrentía.",
        ],
        frames: [
          "Whereas the bare-soil tray ___, the clover tray ___ because ___.",
          "The clover cover reduced runoff because ___.",
        ],
        targetWords: ["whereas", "because", "runoff", "clover", "retained", "roots", "soil"],
      },
    },
  },
  {
    id: "Speaking",
    icon: "speaking",
    domain: "Speaking",
    colorClass: "d-speaking",
    title: ["Speaking Rehearsal Coach", "Entrenador de expresión oral"],
    klu: "Argue",
    eld: "ELD-SI · Academic Discussion",
    studioHref: (band) => `${BASE}/speak?grades=${band}`,
    deepHref: (band) => `${BASE}/conversation?grades=${band}`,
    deepLabel: ["Conversation Simulator", "Simulador de conversación"],
    lessons: {
      "3-5": {
        topic: ["Choosing a Class Field Trip", "Elegir una excursión de la clase"],
        audioScript:
          "Partner A says: I think our class should visit the science museum. Partner B adds: I agree with your idea because the museum has a hands-on weather station where we can test wind speed.",
        noticePrompt: [
          "1. Notice: What makes Partner B's spoken response strong in a classroom discussion?",
          "1. Observar: ¿Qué hace que la respuesta oral del Compañero B sea sólida en una conversación de clase?",
        ],
        noticeOptions: [
          {
            id: "reason",
            label: ["It builds on Partner A's idea and gives a specific reason with 'because'.", "Amplía la idea del Compañero A y da una razón específica con 'because'."],
            ok: true,
            why: [
              "Yes! Strong speakers connect to their partner's idea and name a concrete detail ('hands-on weather station').",
              "¡Sí! Los buenos hablantes conectan con la idea de su compañero y nombran un detalle concreto ('hands-on weather station').",
            ],
          },
          {
            id: "loud",
            label: ["It repeats the exact same words Partner A used.", "Repite exactamente las mismas palabras que usó el Compañero A."],
            ok: false,
            why: [
              "Repeating isn't enough—Partner B added a specific reason why the museum helps the class learn.",
              "Repetir no basta: el Compañero B agregó una razón específica de por qué el museo ayuda a la clase.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: Which sentence starter best helps you respectfully disagree and offer another option?",
          "2. Predecir e interactuar: ¿Qué comienzo de oración te ayuda mejor a expresar desacuerdo con respeto y ofrecer otra opción?",
        ],
        predictOptions: [
          {
            id: "respectful",
            label: ["I see your point, but I prefer the botanical garden because...", "Entiendo tu punto, pero prefiero el jardín botánico porque..."],
            ok: true,
            why: [
              "Great choice! 'I see your point, but...' acknowledges your classmate before giving your reason.",
              "¡Gran elección! 'I see your point, but...' reconoce a tu compañero antes de dar tu razón.",
            ],
          },
          {
            id: "blunt",
            label: ["No, that trip is boring.", "No, esa excursión es aburrida."],
            ok: false,
            why: [
              "In academic discussion, we respect our partner's idea and explain our own reason with evidence.",
              "En la discusión académica, respetamos la idea del compañero y explicamos nuestra razón con evidencia.",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Rehearse: Write or say your own 2-sentence turn for the field trip discussion, then click 'Speak my response aloud' to hear and rehearse it!",
          "3. Responder y ensayar: Escribe o di tu propio turno de 2 oraciones para la conversación sobre la excursión y luego haz clic en 'Escuchar mi respuesta' para ensayarla.",
        ],
        frames: [
          "I think our class should visit ___ because ___.",
          "I see your point, and I also notice that ___.",
        ],
        targetWords: ["because", "think", "prefer", "museum", "garden", "learn", "station"],
      },
      "6-8": {
        topic: ["School Start-Time Seminar", "Seminario sobre el horario escolar"],
        audioScript:
          "Speaker 1: Shifting middle school start times to 8:30 a.m. improves student alertness. Specifically, the district pilot data showed a 22 percent drop in first-period tardies and higher participation.",
        noticePrompt: [
          "1. Notice: How does Speaker 1 strengthen the claim after the first sentence?",
          "1. Observar: ¿Cómo fortalece el Hablante 1 la afirmación después de la primera oración?",
        ],
        noticeOptions: [
          {
            id: "specifically",
            label: ["Uses 'Specifically' to introduce quantitative evidence from the pilot study.", "Usa 'Specifically' para presentar evidencia cuantitativa del estudio piloto."],
            ok: true,
            why: [
              "Exactly. Moving from a general claim to specific evidence ('Specifically, the district pilot data...') makes oral arguments persuasive.",
              "Exactamente. Pasar de una afirmación general a evidencia específica ('Specifically, the district pilot data...') hace persuasivo el argumento oral.",
            ],
          },
          {
            id: "opinion",
            label: ["Changes the topic to after-school sports.", "Cambia el tema a los deportes después de clases."],
            ok: false,
            why: [
              "Look at the second sentence: it stays on start times and cites a 22 percent drop in tardies.",
              "Mira la segunda oración: se mantiene en los horarios de entrada y cita una reducción del 22 por ciento en tardanzas.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: If a classmate raises a concern about bus schedules, which response move keeps the seminar rigorous?",
          "2. Predecir e interactuar: Si un compañero plantea una duda sobre los autobuses, ¿qué respuesta mantiene el rigor del seminario?",
        ],
        predictOptions: [
          {
            id: "acknowledge",
            label: ["While bus scheduling is a valid constraint, the data show that staggered routes solved this in neighboring districts.", "Si bien el horario de autobuses es una limitación válida, los datos muestran que las rutas escalonadas lo resolvieron."],
            ok: true,
            why: [
              "Strong academic move! 'While... is a valid constraint' acknowledges the counterargument before answering with evidence.",
              "¡Excelente recurso académico! 'While... is a valid constraint' reconoce el contraargumento antes de responder con evidencia.",
            ],
          },
          {
            id: "ignore",
            label: ["Buses do not matter at all.", "Los autobuses no importan para nada."],
            ok: false,
            why: [
              "Dismissing a concern weakens your argument. Acknowledge the trade-off with 'While...' or 'Although...'.",
              "Descartar una preocupación debilita tu argumento. Reconoce la compensación con 'While...' o 'Although...'.",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Rehearse: Draft your seminar turn using 'Specifically' or 'While', then play it back to rehearse your pacing!",
          "3. Responder y ensayar: Redacta tu turno de seminario usando 'Specifically' o 'While' y luego reprodúcelo para ensayar tu ritmo.",
        ],
        frames: [
          "Specifically, the evidence shows that ___ because ___.",
          "While ___ is an important consideration, the data indicate that ___.",
        ],
        targetWords: ["specifically", "while", "evidence", "data", "because", "alertness", "pilot"],
      },
    },
  },
  {
    id: "Reading",
    icon: "reading",
    domain: "Reading",
    colorClass: "d-reading",
    title: ["Reading Evidence Lab", "Laboratorio de evidencia lectora"],
    klu: "Inform",
    eld: "ELD-LA & ELD-SC · Text Evidence",
    studioHref: (band) => `${BASE}/reading-room?grades=${band}`,
    deepHref: (band) => `${BASE}/evidence?grades=${band}`,
    deepLabel: ["Evidence Studio", "Estudio de evidencia"],
    lessons: {
      "3-5": {
        topic: ["How Desert Cactus Plants Store Water", "Cómo almacenan agua los cactus del desierto"],
        audioScript:
          "[1] Desert rain falls only a few days each year. [2] Because water is scarce, the saguaro cactus spreads shallow roots wide under the sand to catch rain quickly. [3] Its pleated green stem expands like an accordion to store water for dry months.",
        noticePrompt: [
          "1. Notice: Read the 3 numbered sentences. Which sentence explains HOW the cactus stem changes shape to hold water?",
          "1. Observar: Lee las 3 oraciones numeradas. ¿Qué oración explica CÓMO cambia de forma el tallo del cactus para guardar agua?",
        ],
        noticeOptions: [
          {
            id: "s3",
            label: ["Sentence [3]: 'Its pleated green stem expands like an accordion to store water...'", "Oración [3]: 'Its pleated green stem expands like an accordion to store water...'"],
            ok: true,
            why: [
              "Direct hit! Sentence [3] names the part ('pleated green stem') and how it changes ('expands like an accordion').",
              "¡Acierto directo! La oración [3] nombra la parte ('pleated green stem') y cómo cambia ('expands like an accordion').",
            ],
          },
          {
            id: "s1",
            label: ["Sentence [1]: 'Desert rain falls only a few days each year.'", "Oración [1]: 'Desert rain falls only a few days each year.'"],
            ok: false,
            why: [
              "Sentence [1] describes the desert weather, not the cactus stem. Check Sentence [3].",
              "La oración [1] describe el clima del desierto, no el tallo del cactus. Revisa la oración [3].",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: Why are the cactus roots shallow and wide instead of only deep?",
          "2. Predecir e interactuar: ¿Por qué las raíces del cactus son poco profundas y anchas en lugar de solo profundas?",
        ],
        predictOptions: [
          {
            id: "catch",
            label: ["To catch desert rain quickly before the hot sun dries the sand.", "Para atrapar rápido la lluvia del desierto antes de que el sol seque la arena."],
            ok: true,
            why: [
              "You used Sentence [2] as evidence! 'Spreads shallow roots wide... to catch rain quickly.'",
              "¡Usaste la oración [2] como evidencia! 'Spreads shallow roots wide... to catch rain quickly.'",
            ],
          },
          {
            id: "rocks",
            label: ["Because desert sand has no rocks.", "Porque la arena del desierto no tiene rocas."],
            ok: false,
            why: [
              "The passage doesn't mention rocks. Look at the purpose stated at the end of Sentence [2].",
              "El texto no menciona rocas. Mira el propósito al final de la oración [2].",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Revise: Cite one detail from Sentence [2] or [3] to explain how a saguaro survives dry months.",
          "3. Responder y revisar: Cita un detalle de la oración [2] o [3] para explicar cómo sobrevive un saguaro en los meses secos.",
        ],
        frames: [
          "According to the passage, the saguaro survives because ___.",
          "For example, its ___ helps it ___.",
        ],
        targetWords: ["because", "roots", "stem", "store", "water", "rain", "expands"],
      },
      "6-8": {
        topic: ["Urban Tree Canopy & Street Temperatures", "Dosel arbóreo urbano y temperatura en las calles"],
        audioScript:
          "[1] In a July sensor study across three city neighborhoods, blocks with less than 10 percent tree canopy reached 96°F by late afternoon. [2] By contrast, blocks with at least 40 percent canopy averaged 87°F. [3] Researchers concluded that leaves both block direct solar radiation and release cooling water vapor through transpiration.",
        noticePrompt: [
          "1. Notice: Which sentence provides the scientific mechanism (the 'why') behind the temperature difference?",
          "1. Observar: ¿Qué oración aporta el mecanismo científico (el 'por qué') detrás de la diferencia de temperatura?",
        ],
        noticeOptions: [
          {
            id: "s3",
            label: ["Sentence [3]: explains solar blocking and transpiration.", "Oración [3]: explica el bloqueo solar y la transpiración."],
            ok: true,
            why: [
              "Correct! Sentences [1] and [2] report the temperature data (96°F vs 87°F), while Sentence [3] explains the mechanism.",
              "¡Correcto! Las oraciones [1] y [2] informan los datos (96°F vs 87°F), mientras que la [3] explica el mecanismo.",
            ],
          },
          {
            id: "s1",
            label: ["Sentence [1]: reports 96°F on low-canopy blocks.", "Oración [1]: informa 96°F en cuadras con pocos árboles."],
            ok: false,
            why: [
              "Sentence [1] gives a data measurement, not the biological mechanism. Check Sentence [3].",
              "La oración [1] da una medición de datos, no el mecanismo biológico. Revisa la oración [3].",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: How many degrees cooler were the high-canopy blocks compared to low-canopy blocks?",
          "2. Predecir e interactuar: ¿Cuántos grados más frescas estuvieron las cuadras con muchos árboles comparadas con las de pocos árboles?",
        ],
        predictOptions: [
          {
            id: "nine",
            label: ["9°F cooler (87°F vs. 96°F), supported by Sentences [1] and [2].", "9°F más frescas (87°F frente a 96°F), respaldado por las oraciones [1] y [2]."],
            ok: true,
            why: [
              "Precise synthesis! You combined quantitative evidence across Sentences [1] and [2].",
              "¡Síntesis precisa! Combinaste evidencia cuantitativa de las oraciones [1] y [2].",
            ],
          },
          {
            id: "forty",
            label: ["40°F cooler.", "40°F más frescas."],
            ok: false,
            why: [
              "Careful: 40 percent is the tree canopy coverage, not the temperature difference (96°F - 87°F = 9°F).",
              "Cuidado: 40 por ciento es la cobertura de árboles, no la diferencia de temperatura (96°F - 87°F = 9°F).",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Revise: Write an evidence-based explanation connecting the 9°F difference to how trees cool the street.",
          "3. Responder y revisar: Escribe una explicación basada en evidencia que conecte la diferencia de 9°F con cómo los árboles enfrían la calle.",
        ],
        frames: [
          "The sensor data show that high-canopy blocks were ___ cooler because ___.",
          "By contrast, blocks with 40 percent canopy averaged 87°F because leaves ___.",
        ],
        targetWords: ["canopy", "because", "contrast", "radiation", "transpiration", "blocks", "data"],
      },
    },
  },
  {
    id: "Writing",
    icon: "writing",
    domain: "Writing",
    colorClass: "d-writing",
    title: ["Writing Coach & Revision Lab", "Entrenador de escritura y revisión"],
    klu: "Argue",
    eld: "ELD-LA & ELD-SS · Claim, Evidence, Reasoning",
    studioHref: (band) => `${BASE}/write?grades=${band}`,
    deepHref: (band) => `${BASE}/construction?grades=${band}`,
    deepLabel: ["Sentence Construction Lab", "Laboratorio de construcción de oraciones"],
    lessons: {
      "3-5": {
        topic: ["Expanding a Kernel Sentence with Details", "Ampliar una oración base con detalles"],
        audioScript:
          "Draft 1: The students planted seeds. -> Revised Draft 2: On Tuesday morning, the third-grade students carefully planted bean seeds in the sunny school garden so the sprouts could grow.",
        noticePrompt: [
          "1. Notice: Compare Draft 1 and Revised Draft 2. What did the writer add to make Draft 2 much clearer?",
          "1. Observar: Compara el Borrador 1 y el Borrador 2 revisado. ¿Qué agregó el escritor para que el Borrador 2 fuera mucho más claro?",
        ],
        noticeOptions: [
          {
            id: "details",
            label: ["Added WHEN ('On Tuesday morning'), WHERE ('in the sunny school garden'), and WHY ('so the sprouts could grow').", "Agregó CUÁNDO ('On Tuesday morning'), DÓNDE ('in the sunny school garden') y POR QUÉ ('so the sprouts could grow')."],
            ok: true,
            why: [
              "Exactly! Adding time, place, and purpose turns a 4-word kernel into a vivid academic sentence.",
              "¡Exacto! Agregar tiempo, lugar y propósito convierte una oración de 4 palabras en una oración académica vívida.",
            ],
          },
          {
            id: "longer",
            label: ["Repeated the word 'seeds' five times.", "Repitió la palabra 'seeds' cinco veces."],
            ok: false,
            why: [
              "Good revision adds specific details (when, where, why), not repetition.",
              "Una buena revisión agrega detalles específicos (cuándo, dónde, por qué), no repetición.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: Which connector best joins these two ideas? 'The soil was dry. ___ we watered the garden bed.'",
          "2. Predecir e interactuar: ¿Qué conector une mejor estas dos ideas? 'The soil was dry. ___ we watered the garden bed.'",
        ],
        predictOptions: [
          {
            id: "therefore",
            label: ["Therefore, / So (shows cause and effect)", "Therefore, / So (muestra causa y efecto)"],
            ok: true,
            why: [
              "Right! Dry soil is the reason (cause), and watering the bed is the action (effect).",
              "¡Correcto! La tierra seca es la razón (causa) y regar el jardín es la acción (efecto).",
            ],
          },
          {
            id: "although",
            label: ["Although (shows an unexpected contrast)", "Although (muestra un contraste inesperado)"],
            ok: false,
            why: [
              "Watering dry soil is expected, not a surprise contrast. Use 'So' or 'Therefore'.",
              "Regar tierra seca es esperado, no un contraste sorpresivo. Usa 'So' o 'Therefore'.",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Revise: Expand this kernel sentence by adding WHERE and WHY: 'The class recycled paper.'",
          "3. Responder y revisar: Amplía esta oración base agregando DÓNDE y POR QUÉ: 'The class recycled paper.'",
        ],
        frames: [
          "Every Friday, our class recycled paper in ___ so that ___.",
          "The class recycled paper because ___.",
        ],
        targetWords: ["because", "so", "recycled", "paper", "class", "classroom", "bins"],
      },
      "6-8": {
        topic: ["Strengthening Claim-Evidence-Reasoning (CER)", "Fortalecer Afirmación-Evidencia-Razonamiento (CER)"],
        audioScript:
          "Weak Draft: Composting in the cafeteria is good. It helps a lot. -> Revised CER: The school should add cafeteria compost bins because audit data show 42 percent of lunch waste is compostable food scraps. Consequently, diverting these scraps would cut landfill trash nearly in half while producing rich soil for the science garden.",
        noticePrompt: [
          "1. Notice: In the Revised CER, what role does the sentence starting with 'Consequently' play?",
          "1. Observar: En el texto CER revisado, ¿qué función cumple la oración que empieza con 'Consequently'?",
        ],
        noticeOptions: [
          {
            id: "reasoning",
            label: ["Reasoning: explains why the 42% evidence matters and what outcome it causes.", "Razonamiento: explica por qué importa la evidencia del 42% y qué resultado produce."],
            ok: true,
            why: [
              "Spot on! 'Consequently' links the data (42% compostable waste) to the real-world impact on landfill trash and garden soil.",
              "¡Exacto! 'Consequently' vincula los datos (42% de residuos compostables) con el impacto real en la basura y el suelo.",
            ],
          },
          {
            id: "greeting",
            label: ["It introduces a brand-new unrelated topic.", "Presenta un tema nuevo sin relación."],
            ok: false,
            why: [
              "Look closely: 'diverting these scraps' refers directly back to the 42% food scraps in the first sentence.",
              "Mira con atención: 'diverting these scraps' se refiere directamente al 42% de restos de comida de la primera oración.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: If you want to revise a vague phrase like 'It helps a lot', what is the strongest academic replacement?",
          "2. Predecir e interactuar: Si quieres revisar una frase vaga como 'It helps a lot', ¿cuál es el reemplazo académico más sólido?",
        ],
        predictOptions: [
          {
            id: "precise",
            label: ["Name the measurable effect: 'reduces cafeteria landfill volume by 42 percent.'", "Nombrar el efecto medible: 'reduces cafeteria landfill volume by 42 percent.'"],
            ok: true,
            why: [
              "Yes! Replacing vague verbs ('helps a lot') with precise verbs and quantities makes academic writing authoritative.",
              "¡Sí! Reemplazar verbos vagos ('helps a lot') con verbos precisos y cantidades hace que la escritura académica sea sólida.",
            ],
          },
          {
            id: "very",
            label: ["Add more intensifiers: 'It really, truly helps a whole lot!'", "Agregar más intensificadores: 'It really, truly helps a whole lot!'"],
            ok: false,
            why: [
              "Intensifiers ('really, truly') still leave the reader asking HOW it helps. Use specific evidence instead.",
              "Los intensificadores ('really, truly') dejan al lector preguntándose CÓMO ayuda. Usa evidencia específica.",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Revise: Revise a claim about school recycling or composting using 'because' (evidence) and 'consequently' or 'therefore' (reasoning).",
          "3. Responder y revisar: Revisa una afirmación sobre reciclaje o compostaje escolar usando 'because' (evidencia) y 'consequently' o 'therefore' (razonamiento).",
        ],
        frames: [
          "Our school should ___ because audit data show ___. Consequently, ___.",
          "Because ___ percent of waste is ___, the cafeteria should ___; therefore, ___.",
        ],
        targetWords: ["because", "consequently", "therefore", "data", "compost", "waste", "evidence"],
      },
    },
  },
  {
    id: "Vocabulary",
    icon: "words",
    domain: "Reading",
    colorClass: "d-reading",
    title: ["Academic Vocabulary & Word Builder", "Vocabulario académico y constructor de palabras"],
    klu: "Explain",
    eld: "ELD-SI & ELD-SC · Morphology & Cognates",
    studioHref: (band) => `${BASE}/vocabulary?grades=${band}`,
    deepHref: (band) => `${BASE}/flashcards?grades=${band}`,
    deepLabel: ["Word Cards & Partner Talk", "Tarjetas de palabras y conversación"],
    lessons: {
      "3-5": {
        topic: ["Unlocking Words with Prefixes & Cognates (re-, pre-, -tion)", "Descifrar palabras con prefijos y cognados"],
        audioScript:
          "Word family clue: predict (pre = before, dict = say) · observe / observar (Spanish cognate) · rebuild (re = again, build = make).",
        noticePrompt: [
          "1. Notice: In the science sentence 'We will retest the paper bridge after we strengthen the legs,' what does the prefix 're-' tell you?",
          "1. Observar: En la oración 'We will retest the paper bridge after we strengthen the legs', ¿qué te indica el prefijo 're-'?",
        ],
        noticeOptions: [
          {
            id: "again",
            label: ["'re-' means 'again' — the class will test the bridge a second time.", "'re-' significa 'otra vez': la clase probará el puente por segunda vez."],
            ok: true,
            why: [
              "Spot on! Knowing 're-' = 'again' unlocks hundreds of academic words (retest, reread, rebuild, revise).",
              "¡Exacto! Saber que 're-' = 'otra vez' desbloquea cientos de palabras académicas (retest, reread, rebuild, revise).",
            ],
          },
          {
            id: "never",
            label: ["'re-' means 'never test'.", "'re-' significa 'nunca probar'."],
            ok: false,
            why: [
              "Check the model: rebuild = build again. So retest = test again.",
              "Revisa el modelo: rebuild = construir otra vez. Entonces retest = probar otra vez.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: Which English academic word is a true cognate with Spanish 'observar' and means 'to watch carefully'?",
          "2. Predecir e interactuar: ¿Qué palabra académica en inglés es un cognado verdadero del español 'observar' y significa 'mirar con atención'?",
        ],
        predictOptions: [
          {
            id: "observe",
            label: ["observe (observation) — shares the same root as Spanish observar", "observe (observation) — comparte la misma raíz que el español observar"],
            ok: true,
            why: [
              "Yes! Your Spanish knowledge is a superpower: observar <-> observe, observación <-> observation.",
              "¡Sí! Tu conocimiento del español es un superpoder: observar <-> observe, observación <-> observation.",
            ],
          },
          {
            id: "forget",
            label: ["forget", "forget"],
            ok: false,
            why: [
              "Look for the word that looks and sounds almost identical to 'observar': observe!",
              "Busca la palabra que se ve y suena casi igual a 'observar': ¡observe!",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Apply: Write one sentence about a science experiment using 'observe', 'predict', or 'retest'.",
          "3. Responder y aplicar: Escribe una oración sobre un experimento de ciencias usando 'observe', 'predict' o 'retest'.",
        ],
        frames: [
          "Before we retest the ___, we predict that ___.",
          "We observe that the ___ changes when ___.",
        ],
        targetWords: ["observe", "predict", "retest", "rebuild", "because", "experiment"],
      },
      "6-8": {
        topic: ["Academic Morphology & Nominalization (-tion, -ity, inter-, trans-)", "Morfología académica y nominalización"],
        audioScript:
          "Morphology clue: evaporate (verb) -> evaporation (noun: the process of evaporating) · investigate -> investigation · Biodiversity (bio = life, diverse + -ity = state of variety).",
        noticePrompt: [
          "1. Notice: How does adding the suffix '-tion' change a verb like 'evaporate' or 'investigate'?",
          "1. Observar: ¿Cómo cambia un verbo como 'evaporate' o 'investigate' al agregar el sufijo '-tion'?",
        ],
        noticeOptions: [
          {
            id: "noun",
            label: ["Turns the action verb into an abstract noun naming the process (evaporation, investigation).", "Convierte el verbo de acción en un sustantivo abstracto que nombra el proceso (evaporation, investigation)."],
            ok: true,
            why: [
              "Exactly! Middle-school science and history texts use nominalization ('Rapid evaporation caused...') to pack a whole process into the subject of a sentence.",
              "¡Exacto! Los textos de ciencias e historia de secundaria usan la nominalización ('Rapid evaporation caused...') para condensar un proceso en el sujeto de la oración.",
            ],
          },
          {
            id: "past",
            label: ["Turns the word into a past-tense verb.", "Convierte la palabra en un verbo en pasado."],
            ok: false,
            why: [
              "Past tense uses '-ed' (evaporated). The suffix '-tion' creates a noun (cognate with Spanish '-ción': evaporación).",
              "El pasado usa '-ed' (evaporated). El sufijo '-tion' crea un sustantivo (cognado con '-ción' en español: evaporación).",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: Rewrite 'Because the city conserved water, the reservoir stayed full' using the noun form 'conservation'.",
          "2. Predecir e interactuar: Reescribe 'Because the city conserved water, the reservoir stayed full' usando el sustantivo 'conservation'.",
        ],
        predictOptions: [
          {
            id: "nominal",
            label: ["Water conservation kept the city reservoir full.", "Water conservation kept the city reservoir full."],
            ok: true,
            why: [
              "Strong academic register! Turning 'the city conserved water' into the noun phrase 'Water conservation' creates a concise topic subject.",
              "¡Registro académico sólido! Convertir 'the city conserved water' en la frase nominal 'Water conservation' crea un sujeto conciso.",
            ],
          },
          {
            id: "informal",
            label: ["The water stuff was saved a lot.", "The water stuff was saved a lot."],
            ok: false,
            why: [
              "Avoid vague words like 'stuff'. Use the nominalized academic term 'Water conservation'.",
              "Evita palabras vagas como 'stuff'. Usa el término académico nominalizado 'Water conservation'.",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Apply: Write an academic sentence using a '-tion' or '-ity' noun (such as evaporation, conservation, investigation, or biodiversity).",
          "3. Responder y aplicar: Escribe una oración académica usando un sustantivo con '-tion' o '-ity' (como evaporation, conservation, investigation o biodiversity).",
        ],
        frames: [
          "Our investigation showed that water conservation ___.",
          "Rapid evaporation increases when ___, which affects biodiversity.",
        ],
        targetWords: ["evaporation", "conservation", "investigation", "biodiversity", "because", "process"],
      },
    },
  },
  {
    id: "KLU",
    icon: "compass",
    domain: "Writing",
    colorClass: "d-writing",
    title: ["WIDA Key Language Uses Lab", "Laboratorio de Usos Clave del Lenguaje WIDA"],
    klu: "Narrate · Inform · Explain · Argue",
    eld: "All 5 WIDA 2020 ELD Standards",
    studioHref: (band) => `${BASE}/missions?grades=${band}`,
    deepHref: (band) => `${BASE}/detective?grades=${band}`,
    deepLabel: ["Error Detective Studio", "Estudio Detective de Errores"],
    lessons: {
      "3-5": {
        topic: ["Choosing the Right Key Language Use (Narrate, Inform, Explain, Argue)", "Elegir el Uso Clave del Lenguaje adecuado"],
        audioScript:
          "WIDA Key Language Uses: Narrate tells a story in time order (First, next, suddenly). Inform describes facts and categories (For example, consists of). Explain shows how or why (Because, as a result). Argue makes a claim with evidence (Should, the data show).",
        noticePrompt: [
          "1. Notice: Read this student sentence: 'Our school playground needs a shade sail because the metal slide gets too hot in May.' Which Key Language Use is the student using?",
          "1. Observar: Lee esta oración: 'Our school playground needs a shade sail because the metal slide gets too hot in May.' ¿Qué Uso Clave del Lenguaje está usando el estudiante?",
        ],
        noticeOptions: [
          {
            id: "argue",
            label: ["Argue — makes a claim ('needs a shade sail') and supports it with a reason ('because...').", "Argue (Argumentar) — hace una afirmación ('needs a shade sail') y la apoya con una razón ('because...')."],
            ok: true,
            why: [
              "Yes! Whenever you state what should happen and prove it with a reason or evidence, you are using ARGUE.",
              "¡Sí! Siempre que dices lo que debería pasar y lo pruebas con una razón o evidencia, estás usando ARGUE (Argumentar).",
            ],
          },
          {
            id: "narrate",
            label: ["Narrate — tells a fictional fairy tale.", "Narrate (Narrar) — cuenta un cuento de hadas."],
            ok: false,
            why: [
              "Narrate tells a sequence of events ('First, I walked...'). Here the student is making a claim about what the playground needs.",
              "Narrate cuenta una secuencia de eventos. Aquí el estudiante hace una afirmación sobre lo que necesita el patio.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: If your science teacher asks 'How does a shadow change from morning to noon?', which Key Language Use and signal word fit best?",
          "2. Predecir e interactuar: Si tu maestro de ciencias pregunta '¿Cómo cambia una sombra de la mañana al mediodía?', ¿qué Uso Clave y palabra señal encajan mejor?",
        ],
        predictOptions: [
          {
            id: "explain",
            label: ["Explain — 'As the sun rises higher in the sky, the shadow becomes shorter.'", "Explain (Explicar) — 'As the sun rises higher in the sky, the shadow becomes shorter.'"],
            ok: true,
            why: [
              "Spot on! Questions about HOW or WHY a phenomenon happens call for EXPLAIN with cause-and-effect language.",
              "¡Exacto! Las preguntas sobre CÓMO o POR QUÉ ocurre un fenómeno requieren EXPLAIN (Explicar) con lenguaje de causa y efecto.",
            ],
          },
          {
            id: "argue2",
            label: ["Argue — 'Shadows are my favorite thing at recess.'", "Argue — 'Las sombras son mi cosa favorita en el recreo.'"],
            ok: false,
            why: [
              "A personal preference doesn't explain how the shadow changes length. Use EXPLAIN.",
              "Una preferencia personal no explica cómo cambia de longitud la sombra. Usa EXPLAIN.",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Apply: Pick either EXPLAIN (how something works) or ARGUE (what your school should do) and write 1–2 sentences using its signal words!",
          "3. Responder y aplicar: Elige EXPLAIN (cómo funciona algo) o ARGUE (qué debería hacer tu escuela) y escribe 1 o 2 oraciones usando sus palabras señal.",
        ],
        frames: [
          "[Explain] As the sun moves higher, ___ because ___.",
          "[Argue] Our school should ___ because ___.",
        ],
        targetWords: ["because", "should", "therefore", "shadow", "sun", "school", "evidence"],
      },
      "6-8": {
        topic: ["Distinguishing Inform, Explain, and Argue Across Disciplines", "Distinguir Informar, Explicar y Argumentar en las disciplinas"],
        audioScript:
          "In WIDA 2020: INFORM defines and classifies ('Wetlands consist of marshes and swamps'). EXPLAIN traces causal mechanisms ('Wetlands prevent flooding because peat soil absorbs storm surge'). ARGUE evaluates competing claims with evidence ('The city council should protect the marsh rather than pave it because...').",
        noticePrompt: [
          "1. Notice: What shifts when a writer moves from EXPLAIN to ARGUE on the same wetland topic?",
          "1. Observar: ¿Qué cambia cuando un escritor pasa de EXPLAIN (Explicar) a ARGUE (Argumentar) sobre el mismo tema de los humedales?",
        ],
        noticeOptions: [
          {
            id: "shift",
            label: ["Explain shows how the wetland works; Argue takes a stance on a decision and weighs evidence against alternatives.", "Explain muestra cómo funciona el humedal; Argue toma postura ante una decisión y evalúa evidencia frente a alternativas."],
            ok: true,
            why: [
              "Precisely! Both use evidence, but ARGUE defends a claim or policy choice ('should protect... rather than...').",
              "¡Precisamente! Ambos usan evidencia, pero ARGUE defiende una afirmación o decisión ('should protect... rather than...').",
            ],
          },
          {
            id: "noevidence",
            label: ["Explain uses evidence, whereas Argue uses only feelings.", "Explain usa evidencia, mientras que Argue usa solo sentimientos."],
            ok: false,
            why: [
              "In academic English, Argue relies heavily on verifiable evidence and reasoning, not just feelings.",
              "En el inglés académico, Argue se basa en evidencia verificable y razonamiento, no solo en sentimientos.",
            ],
          },
        ],
        predictPrompt: [
          "2. Predict & Interact: Match this social studies prompt to its primary Key Language Use: 'Trace how the Erie Canal lowered shipping costs and accelerated western trade.'",
          "2. Predecir e interactuar: Une esta consigna de estudios sociales con su Uso Clave principal: 'Trace how the Erie Canal lowered shipping costs and accelerated western trade.'",
        ],
        predictOptions: [
          {
            id: "explain-ss",
            label: ["Explain (ELD-SS.6-8.Explain) — traces historical causes and economic effects.", "Explain (ELD-SS.6-8.Explain) — rastrea causas históricas y efectos económicos."],
            ok: true,
            why: [
              "Correct! Tracing how one historical development caused another is the hallmark of ELD-SS.6-8.Explain.",
              "¡Correcto! Rastrear cómo un hecho histórico causó otro es el sello distintivo de ELD-SS.6-8.Explain.",
            ],
          },
          {
            id: "narrate-ss",
            label: ["Narrate — tells a personal bedtime story.", "Narrate — cuenta un cuento personal."],
            ok: false,
            why: [
              "Although it is history, the prompt asks for causal analysis ('how it lowered costs and accelerated trade'), which is Explain.",
              "Aunque es historia, la consigna pide análisis causal ('cómo redujo costos y aceleró el comercio'), que es Explain.",
            ],
          },
        ],
        respondPrompt: [
          "3. Respond & Apply: Write one EXPLAIN sentence (how/why) or one ARGUE sentence (should + evidence) about wetlands or historical trade.",
          "3. Responder y aplicar: Escribe una oración de EXPLAIN (cómo/por qué) o una de ARGUE (should + evidencia) sobre los humedales o el comercio histórico.",
        ],
        frames: [
          "Wetlands reduce flood damage because ___; consequently, ___.",
          "The city council should preserve the wetland rather than ___ because ___.",
        ],
        targetWords: ["because", "consequently", "should", "rather", "wetlands", "evidence", "trade"],
      },
    },
  },
];

function evaluateDraft(text, lesson, I) {
  const words = wordCount(text);
  const lower = String(text || "").toLowerCase();
  const matched = (lesson.targetWords || []).filter((w) => lower.includes(w.toLowerCase()));
  const hasConnector = /\b(because|however|therefore|consequently|whereas|while|first|finally|specifically|so|although|according)\b/i.test(
    text,
  );
  if (words < 5) {
    return {
      ok: false,
      words,
      matched,
      hasConnector,
      msg: I.T(
        "Keep going! Write at least one complete sentence (5 or more words) so we can check your language moves.",
        "¡Sigue adelante! Escribe al menos una oración completa (5 palabras o más) para revisar tus recursos del lenguaje.",
      ),
    };
  }
  if (!hasConnector && matched.length === 0) {
    return {
      ok: false,
      words,
      matched,
      hasConnector,
      msg: I.T(
        `Good start (${words} words)! Revise by adding a signal connector (such as 'because', 'however', or 'therefore') or one key word from the lesson (${lesson.targetWords.slice(0, 3).join(", ")}).`,
        `¡Buen comienzo (${words} palabras)! Revisa agregando un conector señal (como 'because', 'however' o 'therefore') o una palabra clave de la lección (${lesson.targetWords.slice(0, 3).join(", ")}).`,
      ),
    };
  }
  return {
    ok: true,
    words,
    matched,
    hasConnector,
    msg: I.T(
      `Strong academic response (${words} words)! You used ${matched.length ? `key language (${matched.join(", ")})` : "a clear connector"} to explain your thinking. Ready to apply this skill in full practice!`,
      `¡Respuesta académica sólida (${words} palabras)! Usaste ${matched.length ? `lenguaje clave (${matched.join(", ")})` : "un conector claro"} para explicar tu razonamiento. ¡Listo para aplicar esta destreza en la práctica completa!`,
    ),
  };
}

export async function render(ctx) {
  const band = ctx.band;
  const I = i18nFor(ctx);
  const { T, S } = I;
  const state = loadLearnState();
  const activeTrackId =
    TRACKS.find((t) => t.id === state.activeTrack)?.id ||
    new URLSearchParams(location.search).get("track") ||
    "Listening";
  const track = TRACKS.find((t) => t.id === activeTrackId) || TRACKS[0];
  const lesson = track.lessons[band] || track.lessons["6-8"];
  const key = `${band}:${track.id}`;
  const prog = state[key] || {};
  const noticeChoice = lesson.noticeOptions.find((o) => o.id === prog.notice);
  const predictChoice = lesson.predictOptions.find((o) => o.id === prog.predict);
  const draft = prog.draft || "";
  const checked = prog.checked ? evaluateDraft(draft, lesson, I) : null;

  const completedCount = TRACKS.filter((t) => state[`${band}:${t.id}`]?.completed).length;

  return {
    title: S("Interactive Learn Hub", "Centro interactivo de aprendizaje"),
    html: html`${crumbsHTML([
      [S("My Home", "Mi inicio"), `${BASE}/?grades=${band}`],
      [S("Learn", "Aprender"), null],
    ])}
    <div class="learn-page" data-band="${band}">
      <header class="prog-hero learn-hero ${track.colorClass} is-tint">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("bulb")} ${
            band === "3-5"
              ? T("Grades 3–5 · Visual Language Discovery", "Grados 3–5 · Descubrimiento visual del lenguaje")
              : T("Grades 6–8 · Academic Language Studio", "Grados 6–8 · Estudio de lenguaje académico")
          }</p>
          <h1 tabindex="-1">${T("Interactive Language Learning Engine", "Motor interactivo de aprendizaje del lenguaje")}</h1>
          <p class="lead">${T(
            "Every explanation is active: Notice a language move, Predict what works, Respond in your own words, get instant coaching, and Apply it in a real activity.",
            "Cada explicación es activa: Observa un recurso del lenguaje, Predice qué funciona, Responde con tus propias palabras, recibe comentarios al instante y Aplícalo en una actividad real.",
          )}</p>
          <div class="learn-hero-bar">
            ${bandSwitchHTML(band, ctx.bands, { i18n: I })}
            <span class="learn-progress-pill" role="status">
              ${icon("check")} ${T(
                `${completedCount} of ${TRACKS.length} interactive lessons completed (${bandLabel(band)})`,
                `${completedCount} de ${TRACKS.length} lecciones interactivas completadas (${bandLabel(band)})`,
              )}
            </span>
          </div>
        </div>
        <div class="prog-hero-art">
          <img src="${ART}/learn-interactive.svg" alt="" width="360" height="270" />
        </div>
      </header>

      <nav class="learn-tracks" aria-label="${S("Choose an interactive learning topic", "Elige un tema de aprendizaje interactivo")}">
        ${TRACKS.map((t) => {
          const isCurrent = t.id === track.id;
          const isDone = Boolean(state[`${band}:${t.id}`]?.completed);
          return html`<button
            type="button"
            class="learn-track-tab ${t.colorClass} ${isCurrent ? "is-active" : ""} ${isDone ? "is-done" : ""}"
            data-learn-track="${t.id}"
            aria-pressed="${String(isCurrent)}"
          >
            <span class="learn-tab-ico">${icon(t.icon === "compass" ? "worlds" : t.icon)}</span>
            <span class="learn-tab-text">
              <strong>${T(...t.title)}</strong>
              <small>${t.klu} · ${isDone ? T("Completed", "Completado") : T("Interactive", "Interactivo")}</small>
            </span>
            ${isDone ? html`<span class="learn-tab-check" aria-hidden="true">${icon("check")}</span>` : ""}
          </button>`;
        })}
      </nav>

      <article class="panel learn-workbench ${track.colorClass}" aria-labelledby="learnLessonTitle" data-content>
        <header class="learn-wb-head">
          <div>
            <p class="eyebrow">${domainGlyph(track.domain)} ${track.eld} · ${T("Key Language Use:", "Uso clave:")} <strong>${track.klu}</strong></p>
            <h2 id="learnLessonTitle">${T(...lesson.topic)}</h2>
          </div>
          <div class="learn-cycle-steps" aria-label="${S("Interactive learning steps", "Pasos de aprendizaje interactivo")}">
            <span class="cycle-pill ${noticeChoice?.ok ? "is-done" : "is-now"}">1 · ${T("Notice", "Observar")}</span>
            <span class="cycle-pill ${predictChoice?.ok ? "is-done" : noticeChoice?.ok ? "is-now" : ""}">2 · ${T("Predict & Interact", "Predecir")}</span>
            <span class="cycle-pill ${checked?.ok ? "is-done" : predictChoice?.ok ? "is-now" : ""}">3 · ${T("Respond & Revise", "Responder")}</span>
            <span class="cycle-pill ${prog.completed ? "is-done" : ""}">4 · ${T("Apply", "Aplicar")}</span>
          </div>
        </header>

        <section class="learn-stimulus-box" aria-label="${S("Model language stimulus", "Estímulo modelo de lenguaje")}">
          <div class="learn-stimulus-head">
            <strong>${icon("volume")} ${T("Model Text & Audio Clue", "Texto modelo y pista de audio")}</strong>
            ${
              canSpeak()
                ? html`<button type="button" class="btn small" data-learn-say="${lesson.audioScript}">
                    ${icon("play")} ${T("Listen to model", "Escuchar el modelo")}
                  </button>`
                : ""
            }
          </div>
          <blockquote class="learn-quote" lang="en">${lesson.audioScript}</blockquote>
        </section>

        <div class="learn-steps-grid">
          <section class="learn-step-card ${noticeChoice?.ok ? "is-complete" : ""}" aria-labelledby="stepNoticeTitle">
            <h3 id="stepNoticeTitle">${icon("search")} ${T(...lesson.noticePrompt)}</h3>
            <div class="learn-options" role="group" aria-labelledby="stepNoticeTitle">
              ${lesson.noticeOptions.map(
                (opt) => html`<button
                  type="button"
                  class="learn-opt-btn ${prog.notice === opt.id ? (opt.ok ? "is-correct" : "is-try") : ""}"
                  data-learn-notice="${opt.id}"
                  aria-pressed="${String(prog.notice === opt.id)}"
                >
                  <span class="learn-opt-indicator">${icon(prog.notice === opt.id ? (opt.ok ? "check" : "retry") : "chevron-right")}</span>
                  <span>${T(...opt.label)}</span>
                </button>`,
              )}
            </div>
            ${
              noticeChoice
                ? html`<div class="feedback ${noticeChoice.ok ? "is-ok" : "is-hint"}" role="status">
                    <p><strong>${noticeChoice.ok ? T("You noticed the move!", "¡Observaste el recurso!") : T("Look closer:", "Mira más de cerca:")}</strong> ${T(...noticeChoice.why)}</p>
                  </div>`
                : ""
            }
          </section>

          <section class="learn-step-card ${predictChoice?.ok ? "is-complete" : ""}" aria-labelledby="stepPredictTitle">
            <h3 id="stepPredictTitle">${icon("bulb")} ${T(...lesson.predictPrompt)}</h3>
            <div class="learn-options" role="group" aria-labelledby="stepPredictTitle">
              ${lesson.predictOptions.map(
                (opt) => html`<button
                  type="button"
                  class="learn-opt-btn ${prog.predict === opt.id ? (opt.ok ? "is-correct" : "is-try") : ""}"
                  data-learn-predict="${opt.id}"
                  aria-pressed="${String(prog.predict === opt.id)}"
                >
                  <span class="learn-opt-indicator">${icon(prog.predict === opt.id ? (opt.ok ? "check" : "retry") : "chevron-right")}</span>
                  <span>${T(...opt.label)}</span>
                </button>`,
              )}
            </div>
            ${
              predictChoice
                ? html`<div class="feedback ${predictChoice.ok ? "is-ok" : "is-hint"}" role="status">
                    <p><strong>${predictChoice.ok ? T("Prediction confirmed!", "¡Predicción confirmada!") : T("Re-check the clue:", "Vuelve a revisar la pista:")}</strong> ${T(...predictChoice.why)}</p>
                  </div>`
                : ""
            }
          </section>
        </div>

        <section class="learn-step-card learn-respond-card ${checked?.ok ? "is-complete" : ""}" aria-labelledby="stepRespondTitle">
          <h3 id="stepRespondTitle">${icon("writing")} ${T(...lesson.respondPrompt)}</h3>
          <div class="learn-frames-bar">
            <span class="fine"><strong>${T("Click a starter or word to insert it:", "Haz clic en un comienzo o palabra para insertarla:")}</strong></span>
            <div class="learn-chip-row">
              ${lesson.frames.map(
                (f) => html`<button type="button" class="cat-chip" data-learn-insert="${f.replace(/___/g, "")}">
                  ${icon("writing")} ${f}
                </button>`,
              )}
            </div>
            <div class="learn-chip-row">
              ${lesson.targetWords.map(
                (w) => html`<button type="button" class="cat-chip is-word" data-learn-insert="${w}">
                  + ${w}
                </button>`,
              )}
            </div>
          </div>
          <label class="field">
            <span class="visually-hidden">${T("Your practice response", "Tu respuesta de práctica")}</span>
            <textarea
              id="learnResponseInput"
              rows="3"
              data-learn-draft
              placeholder="${S("Type your sentence here...", "Escribe tu oración aquí...")}"
              ${IGN}
            >${draft}</textarea>
          </label>
          <div class="row-actions">
            <button type="button" class="btn btn-primary" data-learn-check>
              ${icon("check")} ${T("Check & Coach My Response", "Revisar y entrenar mi respuesta")}
            </button>
            ${
              canSpeak()
                ? html`<button type="button" class="btn" data-learn-speak-draft>
                    ${icon("volume")} ${T("Speak my response aloud", "Escuchar mi respuesta")}
                  </button>`
                : ""
            }
            <button type="button" class="ghost small" data-learn-reset>
              ${icon("retry")} ${T("Reset lesson", "Reiniciar lección")}
            </button>
          </div>
          ${
            checked
              ? html`<div class="feedback ${checked.ok ? "is-ok" : "is-hint"}" role="status">
                  <p>${checked.msg}</p>
                </div>`
              : ""
          }
        </section>

        <footer class="learn-apply-footer">
          <div>
            <h3>${icon("launch")} ${T("4. Apply What You Learned", "4. Aplica lo que aprendiste")}</h3>
            <p class="fine">${T(
              "Now transfer this move into a full studio task, domain room, or interactive world.",
              "Ahora transfiere este recurso a una tarea completa de estudio, sala de destrezas o mundo interactivo.",
            )}</p>
          </div>
          <div class="row-actions">
            <a class="btn btn-primary" href="${track.studioHref(band)}">
              ${T(`Practice ${track.domain} Now`, `Practicar ${track.domain} ahora`)} ${icon("arrow-right")}
            </a>
            <a class="btn" href="${BASE}/reality?grades=${band}">
              ${icon("worlds")} ${T("Explore This in Language Reality", "Explorar esto en Realidad del Lenguaje")}
            </a>
            <a class="btn" href="${track.deepHref(band)}">
              ${icon("launch")} ${T(...track.deepLabel)}
            </a>
          </div>
        </footer>
      </article>
    </div>`,
  };
}

export function onInput(e, ctx) {
  if (!e.target.matches?.("[data-learn-draft]")) return;
  const state = loadLearnState();
  const activeTrackId = state.activeTrack || new URLSearchParams(location.search).get("track") || "Listening";
  const key = `${ctx.band}:${activeTrackId}`;
  state[key] = { ...(state[key] || {}), draft: e.target.value };
  saveLearnState(state);
}

export function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const state = loadLearnState();
  const activeTrackId = state.activeTrack || new URLSearchParams(location.search).get("track") || "Listening";
  const track = TRACKS.find((t) => t.id === activeTrackId) || TRACKS[0];
  const lesson = track.lessons[band] || track.lessons["6-8"];
  const key = `${band}:${track.id}`;
  const current = state[key] || {};

  const tabBtn = e.target.closest?.("[data-learn-track]");
  if (tabBtn) {
    state.activeTrack = tabBtn.dataset.learnTrack;
    saveLearnState(state);
    ctx.rerender();
    return true;
  }

  const sayBtn = e.target.closest?.("[data-learn-say]");
  if (sayBtn) {
    speak(sayBtn.dataset.learnSay, { rate: 0.92 });
    return true;
  }

  const speakDraftBtn = e.target.closest?.("[data-learn-speak-draft]");
  if (speakDraftBtn) {
    const text = (document.getElementById("learnResponseInput")?.value || current.draft || "").trim();
    if (!text) {
      announce(I.S("Write a few words first, then listen to your response.", "Escribe algunas palabras primero y luego escucha tu respuesta."));
      return true;
    }
    speak(text, { rate: 0.92 });
    return true;
  }

  const noticeBtn = e.target.closest?.("[data-learn-notice]");
  if (noticeBtn) {
    const id = noticeBtn.dataset.learnNotice;
    state[key] = { ...current, notice: id };
    saveLearnState(state);
    ctx.rerender();
    return true;
  }

  const predictBtn = e.target.closest?.("[data-learn-predict]");
  if (predictBtn) {
    const id = predictBtn.dataset.learnPredict;
    state[key] = { ...current, predict: id };
    saveLearnState(state);
    ctx.rerender();
    return true;
  }

  const insertBtn = e.target.closest?.("[data-learn-insert]");
  if (insertBtn) {
    const snippet = insertBtn.dataset.learnInsert;
    const box = document.getElementById("learnResponseInput");
    const prev = (box ? box.value : current.draft || "").trim();
    const next = prev ? `${prev} ${snippet}` : snippet;
    state[key] = { ...current, draft: next };
    saveLearnState(state);
    ctx.rerender().then(() => {
      const input = document.getElementById("learnResponseInput");
      input?.focus();
    });
    return true;
  }

  if (e.target.closest?.("[data-learn-check]")) {
    const box = document.getElementById("learnResponseInput");
    const draft = box ? box.value : current.draft || "";
    const res = evaluateDraft(draft, lesson, I);
    const noticeOk = lesson.noticeOptions.find((o) => o.id === current.notice)?.ok;
    const predictOk = lesson.predictOptions.find((o) => o.id === current.predict)?.ok;
    const completed = Boolean(res.ok && (noticeOk || predictOk));
    state[key] = { ...current, draft, checked: true, completed: current.completed || completed };
    saveLearnState(state);
    if (res.ok) {
      const ledger = loadLedger();
      appendEntry(ledger, {
        src: "writing",
        task: `learn:${band}:${track.id}`,
        band,
        domain: track.domain,
        use: track.klu.split(" ")[0] || "Explain",
        kind: current.checked ? "revision" : "first",
        stage: "guided",
        supports: { frames: true, bank: true },
        m: {
          words: res.words,
          link: res.hasConnector ? 1 : 0,
          academic: res.matched.length,
        },
      });
      saveLedger(ledger);
    }
    ctx.rerender();
    return true;
  }

  if (e.target.closest?.("[data-learn-reset]")) {
    delete state[key];
    saveLearnState(state);
    ctx.rerender();
    return true;
  }

  return false;
}

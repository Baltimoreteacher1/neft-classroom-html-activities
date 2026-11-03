// Language Reality Engine — Declarative World Schema, Personalized World Matcher,
// and Communicative Consequence Intelligence (ACCESS Practice Lab 7.0).
//
// Evaluates student communication within meaningful story situations across Listening,
// Reading, Speaking, and Writing. Recognizes multiple legitimate ways of communicating,
// separates observed language evidence from content conclusions, and updates world state
// deterministically without inventing WIDA proficiency scores.

import { safeJson, storage, wordCount } from "./util.js";

export const REALITY_STORAGE_KEY = "accessPracticeLab:v1:realityEngine";

export const FLAGSHIP_WORLDS = [
  {
    id: "mystery-academy",
    art: "reality-mystery.svg",
    domain: "Listening",
    colorClass: "d-listening",
    eld: "ELD-LA & ELD-SC · School & Inquiry",
    klu: "Narrate & Explain",
    title: ["Mystery Academy", "Academia de Misterios"],
    tagline: [
      "Investigate school mysteries by interviewing witnesses, pinning clues, and explaining what happened.",
      "Investiga misterios escolares entrevistando testigos, fijando pistas y explicando qué ocurrió.",
    ],
    characters: [
      { id: "maya", name: "Maya Lin", role: ["Student Archivist", "Archivista estudiantil"] },
      { id: "ortiz", name: "Mr. Ortiz", role: ["Science Lab Coordinator", "Coordinador del laboratorio"] },
    ],
    missions: {
      "3-5": [
        {
          id: "missing-terrarium-log",
          title: ["Case 1: The Missing Terrarium Notebook", "Caso 1: El cuaderno perdido del terrario"],
          goal: [
            "Find out where the class terrarium notebook went and explain the clue trail.",
            "Descubre adónde fue el cuaderno del terrario de la clase y explica el rastro de pistas.",
          ],
          klu: "Explain",
          eldStandard: "ELD-SI.K-12.Explain",
          expectation: "ELD-LA.4-5.Narrate.Expressive / ELD-SC.4-5.Explain.Expressive",
          audioCharacter: "Maya Lin",
          audioScript:
            "I saw someone carry the green terrarium notebook after lunch. However, they did not go to the playground. Instead, they walked toward the art drying rack because the cover had wet paint on it.",
          readingTitle: ["Hallway Sign-Out Sheet & Map Note", "Hoja de salida del pasillo y nota del mapa"],
          readingClues: [
            {
              id: "clue-art",
              label: ["12:40 PM · Art Room Drying Rack: Leo signed out a green notebook to dry a painted label.", "12:40 PM · Estante de secado de arte: Leo registró un cuaderno verde para secar una etiqueta pintada."],
              relevant: true,
            },
            {
              id: "clue-gym",
              label: ["11:15 AM · Gym Equipment Closet: Two basketballs were returned before lunch.", "11:15 AM · Armario del gimnasio: Se devolvieron dos balones antes del almuerzo."],
              relevant: false,
            },
            {
              id: "clue-library",
              label: ["1:05 PM · Library Return Cart: Ms. Kim shelved three blue dictionaries.", "1:05 PM · Carrito de la biblioteca: La Sra. Kim guardó tres diccionarios azules."],
              relevant: false,
            },
          ],
          clarifyPrompt: [
            "Ask Maya a clarification question to unlock the shelf number:",
            "Hazle a Maya una pregunta de aclaración para desbloquear el número de estante:",
          ],
          clarifyKeywords: ["who", "where", "which", "shelf", "rack", "paint", "why", "took", "take", "green", "notebook", "art"],
          clarifyUnlock: [
            "Maya answers: 'Great question! Look on Shelf B of the art drying rack—Leo left a yellow sticky note next to the notebook.'",
            "Maya responde: '¡Gran pregunta! Mira en el Estante B del secador de arte: Leo dejó una nota adhesiva amarilla junto al cuaderno.'",
          ],
          clarifyFallback: [
            "Maya says: 'I am not sure what you mean. Try asking WHO took the notebook or WHERE on the art rack it was placed.'",
            "Maya dice: 'No estoy segura de entender. Intenta preguntar QUIÉN llevó el cuaderno o DÓNDE se colocó en el estante de arte.'",
          ],
          communicatePrompt: [
            "Explain to Mr. Ortiz where the terrarium notebook is and why it was taken there. Use evidence from Maya and the sign-out sheet.",
            "Explícale al Sr. Ortiz dónde está el cuaderno del terrario y por qué lo llevaron allí. Usa evidencia de Maya y de la hoja de salida.",
          ],
          requiredConcepts: [
            { id: "location", words: ["art", "rack", "shelf", "drying"], label: ["where the notebook is (art drying rack / Shelf B)", "dónde está el cuaderno (estante de secado de arte)"] },
            { id: "reason", words: ["paint", "wet", "dry", "label", "leo"], label: ["why it was moved (wet paint / drying the label)", "por qué se movió (pintura húmeda / secar la etiqueta)"] },
            { id: "connector", words: ["because", "since", "so", "however", "instead", "after"], label: ["a connecting word (because, so, after, instead)", "una palabra conectora (because, so, after, instead)"] },
          ],
          frames: {
            A: [
              "The notebook is on the art drying rack because ___.",
              "After lunch, Leo took it there so ___.",
            ],
            B: [
              "Instead of going to the playground, Leo brought the notebook to the art rack because ___.",
              "The sign-out sheet shows ___ so ___.",
            ],
            C: [
              "Use your own connected sentences with a cause/effect signal word (because, consequently, so).",
            ],
          },
          wordBank: ["notebook", "art rack", "because", "wet paint", "instead", "dry", "Shelf B"],
          consequences: {
            full: [
              "CONSEQUENCE UNLOCKED: Mr. Ortiz walks straight to Shelf B in the Art Room, retrieves the dry terrarium notebook, and invites you to lead the afternoon frog observation!",
              "CONSECUENCIA DESBLOQUEADA: ¡El Sr. Ortiz va directo al Estante B en el salón de arte, recupera el cuaderno seco del terrario y te invita a dirigir la observación de ranas!",
            ],
            partial: [
              "CHARACTER FOLLOW-UP: Mr. Ortiz says, 'You gave me a good start, but I still need both WHERE the notebook is and WHY it was taken there so I check the right place.'",
              "SEGUIMIENTO DEL PERSONAJE: El Sr. Ortiz dice: 'Me diste un buen comienzo, pero aún necesito saber DÓNDE está el cuaderno y POR QUÉ lo llevaron allí para buscar en el lugar correcto.'",
            ],
            unclear: [
              "CHARACTER REQUESTS CLARIFICATION: Mr. Ortiz asks, 'Could you clarify which room has the notebook and what clue proves it?'",
              "EL PERSONAJE PIDE ACLARACIÓN: El Sr. Ortiz pregunta: '¿Podrías aclarar qué salón tiene el cuaderno y qué pista lo demuestra?'",
            ],
          },
          transferPrompt: [
            "Fresh Apply Step: A student leaves a microscope slide by the window. Write or say one sentence explaining what might happen and why.",
            "Paso de aplicación nueva: Un estudiante deja un portaobjetos junto a la ventana. Escribe o di una oración explicando qué podría pasar y por qué.",
          ],
        },
        {
          id: "clock-tower-chime",
          title: ["Case 2: The Silent Morning Announcement", "Caso 2: El anuncio matutino silencioso"],
          goal: [
            "Discover why the morning announcement speaker stayed quiet in Hallway C and help the media team fix it.",
            "Descubre por qué el altavoz del anuncio matutino quedó en silencio en el Pasillo C y ayuda al equipo de medios.",
          ],
          klu: "Explain",
          eldStandard: "ELD-SI.K-12.Explain",
          expectation: "ELD-SC.4-5.Explain.Expressive",
          audioCharacter: "Maya Lin",
          audioScript:
            "First, we tested the microphone in the studio, and the green light blinked. However, Hallway C heard nothing because the hallway switch was flipped to Assembly Mode after yesterday's concert.",
          readingTitle: ["Media Booth Checklist", "Lista de control de la cabina de medios"],
          readingClues: [
            {
              id: "clue-switch",
              label: ["Control Panel Note: Hallway C switch is still set to 'Assembly Mute' from Thursday's band concert.", "Nota del panel: El interruptor del Pasillo C sigue en 'Silencio de asamblea' desde el concierto del jueves."],
              relevant: true,
            },
            {
              id: "clue-battery",
              label: ["Studio Desk: All four wireless microphones have 100% charged batteries.", "Escritorio del estudio: Los cuatro micrófonos inalámbricos tienen 100% de batería."],
              relevant: false,
            },
          ],
          clarifyPrompt: [
            "Ask Maya a question about the studio test or control switch:",
            "Hazle a Maya una pregunta sobre la prueba del estudio o el interruptor de control:",
          ],
          clarifyKeywords: ["switch", "why", "hallway", "microphone", "assembly", "mute", "concert", "work", "how", "fix"],
          clarifyUnlock: [
            "Maya replies: 'Good question! The microphone worked fine—only Switch 3 on the wall panel needs to be flipped back to Daily Classroom Mode.'",
            "Maya responde: '¡Buena pregunta! El micrófono funcionó bien; solo hay que cambiar el Interruptor 3 del panel al Modo Diario.'",
          ],
          clarifyFallback: [
            "Maya says: 'Ask me about the hallway switch or why Hallway C was muted.'",
            "Maya dice: 'Pregúntame sobre el interruptor del pasillo o por qué se silenció el Pasillo C.'",
          ],
          communicatePrompt: [
            "Explain to Mr. Ortiz why Hallway C heard no sound and how to fix it.",
            "Explícale al Sr. Ortiz por qué el Pasillo C no escuchó sonido y cómo solucionarlo.",
          ],
          requiredConcepts: [
            { id: "cause", words: ["switch", "assembly", "mute", "concert"], label: ["the cause (switch left on Assembly Mute)", "la causa (interruptor en silencio de asamblea)"] },
            { id: "fix", words: ["flip", "turn", "change", "daily", "classroom", "panel", "hallway"], label: ["how to fix it (flip the panel switch to Daily/Classroom mode)", "cómo arreglarlo (cambiar el interruptor a modo diario)"] },
            { id: "connector", words: ["because", "so", "however", "after", "first", "then"], label: ["a signal word (because, so, however, then)", "una palabra señal (because, so, however, then)"] },
          ],
          frames: {
            A: ["Hallway C was quiet because ___. To fix it, flip ___."],
            B: ["Although the microphone worked, Hallway C heard nothing because ___, so we should ___."],
            C: ["Explain the cause and solution in your own words using a connector."],
          },
          wordBank: ["switch", "because", "assembly", "microphone", "hallway", "flip", "daily"],
          consequences: {
            full: [
              "CONSEQUENCE UNLOCKED: Mr. Ortiz flips Switch 3 to Daily Mode—the chime rings clearly through Hallway C and your morning broadcast goes live!",
              "CONSECUENCIA DESBLOQUEADA: ¡El Sr. Ortiz cambia el Interruptor 3 al Modo Diario, el timbre suena con claridad en el Pasillo C y tu transmisión sale al aire!",
            ],
            partial: [
              "CHARACTER FOLLOW-UP: Mr. Ortiz asks, 'I see part of the issue, but tell me both WHY it was muted and WHICH switch we need to change.'",
              "SEGUIMIENTO DEL PERSONAJE: El Sr. Ortiz pregunta: 'Veo parte del problema, pero dime POR QUÉ estaba en silencio y QUÉ interruptor debemos cambiar.'",
            ],
            unclear: [
              "CHARACTER REQUESTS CLARIFICATION: Mr. Ortiz says, 'Should I replace the microphone batteries or check the control panel switch? Explain using the clue.'",
              "EL PERSONAJE PIDE ACLARACIÓN: El Sr. Ortiz dice: '¿Debo cambiar las baterías del micrófono o revisar el interruptor del panel? Explica usando la pista.'",
            ],
          },
          transferPrompt: [
            "Fresh Apply Step: Explain why checking a checklist step-by-step helps a team solve problems faster.",
            "Paso de aplicación nueva: Explica por qué revisar una lista paso a paso ayuda a un equipo a resolver problemas más rápido.",
          ],
        },
      ],
      "6-8": [
        {
          id: "archive-water-stain",
          title: ["Case 1: The Flooded Historical Archive", "Caso 1: El archivo histórico inundado"],
          goal: [
            "Investigate competing witness accounts of the Saturday leak, identify the true source, and write an evidence-based finding.",
            "Investiga relatos de testigos sobre la filtración del sábado, identifica la fuente real y escribe una conclusión basada en evidencia.",
          ],
          klu: "Argue",
          eldStandard: "ELD-LA.6-8.Argue",
          expectation: "ELD-LA.6-8.Argue.Expressive",
          audioCharacter: "Maya Lin",
          audioScript:
            "Initially, the custodian thought rain entered through the west window. Whereas the window sill was completely dry at 8:00 AM, the ceiling pipe directly above Table 4 was dripping condensation because the chiller valve stayed open overnight.",
          readingTitle: ["Facility Sensor Log & Witness Notes", "Registro de sensores e informes de testigos"],
          readingClues: [
            {
              id: "clue-pipe",
              label: ["Sensor Log 07:45 AM: Chiller pipe above Table 4 recorded 94% humidity and active condensation drips.", "Registro 07:45 AM: La tubería sobre la Mesa 4 registró 94% de humedad y goteo por condensación."],
              relevant: true,
            },
            {
              id: "clue-window",
              label: ["Weather Station Log: Zero millimeters of rain fell on Saturday morning; west window latch was locked and dry.", "Estación meteorológica: Cero milímetros de lluvia el sábado; la ventana oeste estaba cerrada y seca."],
              relevant: true,
            },
            {
              id: "clue-vending",
              label: ["Cafeteria Log: The first-floor ice machine was serviced on Tuesday.", "Registro de cafetería: La máquina de hielo del primer piso recibió mantenimiento el martes."],
              relevant: false,
            },
          ],
          clarifyPrompt: [
            "Ask Maya a targeted question comparing the window theory and the ceiling pipe evidence:",
            "Hazle a Maya una pregunta específica comparando la teoría de la ventana y la evidencia de la tubería:",
          ],
          clarifyKeywords: ["window", "pipe", "valve", "chiller", "condensation", "dry", "rain", "table", "why", "evidence", "how"],
          clarifyUnlock: [
            "Maya responds: 'Sharp inquiry! Because the weather log recorded 0 mm of rain and the window sill was dry, the water had to come from the overhead chiller pipe valve.'",
            "Maya responde: '¡Excelente pregunta! Como el registro marcó 0 mm de lluvia y la ventana estaba seca, el agua tuvo que venir de la válvula de la tubería superior.'",
          ],
          clarifyFallback: [
            "Maya says: 'Ask specifically about the west window, the chiller pipe, or the sensor humidity log.'",
            "Maya dice: 'Pregunta específicamente sobre la ventana oeste, la tubería de enfriamiento o el registro de humedad.'",
          ],
          communicatePrompt: [
            "Write or record your investigative conclusion for Mr. Ortiz. Refute the window claim and argue what actually caused the water damage on Table 4.",
            "Escribe o graba tu conclusión investigativa para el Sr. Ortiz. Refuta la hipótesis de la ventana y argumenta qué causó realmente el daño en la Mesa 4.",
          ],
          requiredConcepts: [
            { id: "refute", words: ["window", "dry", "rain", "zero"], label: ["evidence refuting the window theory (dry sill / zero rain)", "evidencia que refuta la teoría de la ventana (ventana seca / sin lluvia)"] },
            { id: "cause", words: ["pipe", "chiller", "valve", "condensation", "table"], label: ["the true cause (chiller pipe / condensation above Table 4)", "la causa real (tubería / condensación sobre la Mesa 4)"] },
            { id: "discourse", words: ["whereas", "although", "however", "because", "therefore", "consequently", "evidence"], label: ["academic argumentation connector (whereas, although, because, therefore)", "conector argumentativo académico (whereas, although, because, therefore)"] },
          ],
          frames: {
            A: [
              "Although people thought water came from the window, the sill was dry. The leak came from ___ because ___.",
            ],
            B: [
              "Whereas the west window remained dry with zero rain, the sensor log proves that ___ because ___.",
            ],
            C: [
              "Construct a complete claim-evidence-reasoning argument contrasting both accounts.",
            ],
          },
          wordBank: ["whereas", "although", "condensation", "chiller pipe", "window sill", "because", "evidence"],
          consequences: {
            full: [
              "CONSEQUENCE UNLOCKED: Mr. Ortiz closes the overhead chiller valve and relocates the rare maps from Table 4 before any historical documents are lost!",
              "CONSECUENCIA DESBLOQUEADA: ¡El Sr. Ortiz cierra la válvula superior y reubica los mapas históricos de la Mesa 4 antes de que se dañen los documentos!",
            ],
            partial: [
              "CHARACTER FOLLOW-UP: Mr. Ortiz says, 'You named the pipe, but the facilities director still thinks the window leaked. Add evidence showing why the window theory is wrong.'",
              "SEGUIMIENTO DEL PERSONAJE: El Sr. Ortiz dice: 'Mencionaste la tubería, pero el director aún cree que fue la ventana. Agrega evidencia que demuestre por qué no fue la ventana.'",
            ],
            unclear: [
              "CHARACTER REQUESTS CLARIFICATION: Mr. Ortiz asks, 'Which specific sensor evidence proves where the water came from?'",
              "EL PERSONAJE PIDE ACLARACIÓN: El Sr. Ortiz pregunta: '¿Qué evidencia específica del sensor demuestra de dónde vino el agua?'",
            ],
          },
          transferPrompt: [
            "Fresh Apply Step: Why is it important for investigators to explain both why their claim is supported AND why an alternative explanation fails?",
            "Paso de aplicación nueva: ¿Por qué es importante que los investigadores expliquen tanto la evidencia a favor de su afirmación como por qué falla una explicación alternativa?",
          ],
        },
        {
          id: "science-fair-sabotage",
          title: ["Case 2: The Shifted Solar Tracker", "Caso 2: El rastreador solar desplazado"],
          goal: [
            "Compare two lab logs to explain why Team Atlas's solar panel voltage dropped at 2:00 PM.",
            "Compara dos registros de laboratorio para explicar por qué bajó el voltaje del panel solar del Equipo Atlas a las 2:00 PM.",
          ],
          klu: "Explain",
          eldStandard: "ELD-SC.6-8.Explain",
          expectation: "ELD-SC.6-8.Explain.Expressive",
          audioCharacter: "Maya Lin",
          audioScript:
            "Nobody touched the wires on Team Atlas's solar tracker. However, at 1:45 PM the stage crew rolled the tall backdrop banner in front of the south courtyard window, casting a shadow across Table 2.",
          readingTitle: ["Voltage Telemetry & Courtyard Diagram", "Telemetría de voltaje y diagrama del patio"],
          readingClues: [
            {
              id: "clue-shadow",
              label: ["1:45 PM Stage Log: A 3-meter vinyl banner was positioned in front of the south window, blocking direct sunlight to Table 2.", "1:45 PM Registro de escenario: Se colocó un cartel de 3 metros frente a la ventana sur, bloqueando la luz hacia la Mesa 2."],
              relevant: true,
            },
            {
              id: "clue-wires",
              label: ["2:05 PM Multimeter Check: All copper leads and resistors on Team Atlas's circuit remained tightly connected.", "2:05 PM Revisión de multímetro: Todos los cables y resistencias del circuito seguían bien conectados."],
              relevant: true,
            },
          ],
          clarifyPrompt: [
            "Ask Maya a question about the circuit wires or the south window:",
            "Hazle a Maya una pregunta sobre los cables del circuito o la ventana sur:",
          ],
          clarifyKeywords: ["wire", "banner", "shadow", "window", "south", "voltage", "light", "sun", "drop", "why"],
          clarifyUnlock: [
            "Maya confirms: 'Exactly—the circuit was intact! Moving the stage banner two meters east restores full sunlight to Table 2.'",
            "Maya confirma: '¡Exacto, el circuito estaba intacto! Mover el cartel dos metros al este devuelve toda la luz solar a la Mesa 2.'",
          ],
          clarifyFallback: [
            "Maya says: 'Ask about what blocked the south window at 1:45 PM or whether the wires were loose.'",
            "Maya dice: 'Pregunta qué bloqueó la ventana sur a la 1:45 PM o si los cables estaban sueltos.'",
          ],
          communicatePrompt: [
            "Explain to the judges why the voltage dropped and what adjustment restores a fair test.",
            "Explica a los jueces por qué cayó el voltaje y qué ajuste restablece una prueba justa.",
          ],
          requiredConcepts: [
            { id: "shadow", words: ["banner", "shadow", "window", "sunlight", "light", "blocked"], label: ["the cause of the drop (stage banner blocking sunlight)", "la causa de la caída (cartel bloqueando la luz solar)"] },
            { id: "circuit", words: ["wire", "circuit", "connected", "intact", "move", "east"], label: ["circuit status or solution (wires intact / move the banner)", "estado del circuito o solución (cables intactos / mover el cartel)"] },
            { id: "connector", words: ["however", "because", "consequently", "therefore", "although", "while"], label: ["causal/contrast connector (however, because, consequently)", "conector causal o de contraste (however, because, consequently)"] },
          ],
          frames: {
            A: ["The wires were connected, however the voltage dropped because ___. We should ___."],
            B: ["Although the circuit remained intact, voltage dropped at 2:00 PM because ___; therefore, ___."],
            C: ["Synthesize the multimeter and stage logs to explain the voltage drop and solution."],
          },
          wordBank: ["although", "because", "banner", "sunlight", "voltage", "circuit", "therefore"],
          consequences: {
            full: [
              "CONSEQUENCE UNLOCKED: The stage crew shifts the banner two meters east—Team Atlas's solar tracker climbs back to 5.8 volts and the judges award a Fair Inquiry commendation!",
              "CONSECUENCIA DESBLOQUEADA: ¡El equipo mueve el cartel dos metros al este, el panel sube a 5.8 voltios y los jueces otorgan un reconocimiento de Investigación Justa!",
            ],
            partial: [
              "CHARACTER FOLLOW-UP: The head judge asks, 'You mentioned one detail, but please explain both what blocked the light and how we know the circuit wasn't broken.'",
              "SEGUIMIENTO DEL PERSONAJE: El juez principal pregunta: 'Mencionaste un detalle, pero explica qué bloqueó la luz y cómo sabemos que el circuito no estaba roto.'",
            ],
            unclear: [
              "CHARACTER REQUESTS CLARIFICATION: The judge asks, 'Did the solar panel break, or did something in the room change at 1:45 PM?'",
              "EL PERSONAJE PIDE ACLARACIÓN: El juez pregunta: '¿Se rompió el panel solar o cambió algo en el salón a la 1:45 PM?'",
            ],
          },
          transferPrompt: [
            "Fresh Apply Step: In any science experiment, why must you check environmental variables before assuming equipment is broken?",
            "Paso de aplicación nueva: En cualquier experimento científico, ¿por qué debes revisar las variables del entorno antes de suponer que el equipo está roto?",
          ],
        },
      ],
    },
  },
  {
    id: "future-city",
    art: "reality-city.svg",
    domain: "Writing",
    colorClass: "d-writing",
    eld: "ELD-SS & ELD-MA · Civic Planning & Data",
    klu: "Argue & Inform",
    title: ["Future City", "Ciudad del Futuro"],
    tagline: [
      "Evaluate community proposals, listen to residents, analyze maps and data, and persuade the City Council.",
      "Evalúa propuestas comunitarias, escucha a los vecinos, analiza mapas y datos, y persuade al Concejo Municipal.",
    ],
    characters: [
      { id: "chen", name: "Councilor Chen", role: ["City Planning Chair", "Presidenta de Planificación Urbana"] },
      { id: "elena", name: "Elena Ramos", role: ["Neighborhood Transit Advocate", "Defensora del transporte vecinal"] },
    ],
    missions: {
      "3-5": [
        {
          id: "shade-park-plaza",
          title: ["Mission 1: Cooling the Concrete Plaza", "Misión 1: Enfriar la plaza de concreto"],
          goal: [
            "Recommend the best plan to cool Oak Street Plaza for families and bus riders using temperature data.",
            "Recomienda el mejor plan para enfriar la Plaza Oak Street para las familias y usuarios de autobús usando datos de temperatura.",
          ],
          klu: "Argue",
          eldStandard: "ELD-SS.4-5.Argue",
          expectation: "ELD-SS.4-5.Argue.Expressive",
          audioCharacter: "Elena Ramos",
          audioScript:
            "Every afternoon at 3:00 PM, families wait for the bus on Oak Street Plaza. Because there are no trees or shade canopies, the concrete bench reaches 96 degrees Fahrenheit, and seniors have nowhere cool to sit.",
          readingTitle: ["City Budget & Cooling Comparison Table", "Presupuesto municipal y tabla comparativa de enfriamiento"],
          readingClues: [
            {
              id: "clue-trees",
              label: ["Option A — Shade Trees + Drinking Fountain: Lowers bench temperature by 14°F, costs $18,000, fits within the $20,000 neighborhood grant.", "Opción A — Árboles de sombra + bebedero: Baja la temperatura 14°F, cuesta $18,000 y cabe en el presupuesto de $20,000."],
              relevant: true,
            },
            {
              id: "clue-statue",
              label: ["Option B — Bronze Clock Statue: Lowers temperature by 0°F, costs $19,500, adds no seating or shade.", "Opción B — Estatua de bronce: Baja la temperatura 0°F, cuesta $19,500, no agrega sombra ni asientos."],
              relevant: false,
            },
          ],
          clarifyPrompt: [
            "Ask Elena or Councilor Chen a question about the budget limit or temperature drop:",
            "Hazle a Elena o a la Concejala Chen una pregunta sobre el límite de presupuesto o la temperatura:",
          ],
          clarifyKeywords: ["budget", "cost", "tree", "shade", "temperature", "cool", "bench", "bus", "how", "much", "why"],
          clarifyUnlock: [
            "Councilor Chen replies: 'Good question! Our neighborhood grant is $20,000, and planting shade trees with a fountain costs $18,000 while cooling the benches by 14 degrees.'",
            "La Concejala Chen responde: '¡Buena pregunta! Nuestra subvención es de $20,000, y plantar árboles con bebedero cuesta $18,000 mientras enfría las bancas 14 grados.'",
          ],
          clarifyFallback: [
            "Councilor Chen says: 'Ask me how much the shade trees cost or how many degrees they cool the plaza.'",
            "La Concejala Chen dice: 'Pregúntame cuánto cuestan los árboles de sombra o cuántos grados enfrían la plaza.'",
          ],
          communicatePrompt: [
            "Present your recommendation to Councilor Chen. State which option the city should build and support it with temperature or budget evidence.",
            "Presenta tu recomendación a la Concejala Chen. Indica qué opción debe construir la ciudad y apóyala con evidencia de temperatura o presupuesto.",
          ],
          requiredConcepts: [
            { id: "claim", words: ["tree", "shade", "fountain", "option a"], label: ["a clear recommendation (shade trees / Option A)", "una recomendación clara (árboles de sombra / Opción A)"] },
            { id: "evidence", words: ["14", "18,000", "20,000", "96", "cool", "degree", "bus", "senior", "family"], label: ["supporting evidence (14°F cooler, $18,000 budget, bus riders)", "evidencia de apoyo (14°F más fresco, presupuesto de $18,000, usuarios de autobús)"] },
            { id: "connector", words: ["because", "since", "so", "therefore", "should"], label: ["argument language (should, because, so, therefore)", "lenguaje argumentativo (should, because, so, therefore)"] },
          ],
          frames: {
            A: ["The city should choose shade trees because ___ and ___."],
            B: ["I recommend Option A (shade trees and a fountain) because it cools the plaza by ___ and costs ___."],
            C: ["Write a persuasive recommendation citing both resident needs and budget data."],
          },
          wordBank: ["should", "shade trees", "because", "14 degrees", "budget", "bus riders", "therefore"],
          consequences: {
            full: [
              "CONSEQUENCE UNLOCKED: The City Council votes 5–0 to fund Option A! Crews plant eight canopy trees and install a cool water station at the Oak Street bus stop.",
              "CONSECUENCIA DESBLOQUEADA: ¡El Concejo Municipal vota 5–0 para financiar la Opción A! Se plantan ocho árboles de sombra y un bebedero en la parada de autobús.",
            ],
            partial: [
              "CHARACTER FOLLOW-UP: Councilor Chen says, 'I hear your choice, but the council needs specific evidence from the table (like the temperature change or budget cost) before voting.'",
              "SEGUIMIENTO DEL PERSONAJE: La Concejala Chen dice: 'Escucho tu elección, pero el concejo necesita evidencia específica de la tabla (como el cambio de temperatura o el costo) antes de votar.'",
            ],
            unclear: [
              "CHARACTER REQUESTS CLARIFICATION: Councilor Chen asks, 'Which option are you recommending for Oak Street Plaza, and how does it help bus riders?'",
              "EL PERSONAJE PIDE ACLARACIÓN: La Concejala Chen pregunta: '¿Qué opción recomiendas para la Plaza Oak Street y cómo ayuda a los pasajeros?'",
            ],
          },
          transferPrompt: [
            "Fresh Apply Step: Why does including numbers from a chart make a community proposal more convincing?",
            "Paso de aplicación nueva: ¿Por qué incluir números de una tabla hace que una propuesta comunitaria sea más convincente?",
          ],
        },
      ],
      "6-8": [
        {
          id: "bioswale-transit-corridor",
          title: ["Mission 1: The Flood-Resilient Transit Corridor", "Misión 1: El corredor de transporte resistente a inundaciones"],
          goal: [
            "Evaluate two engineering proposals for Riverfront Avenue and argue which design solves both stormwater flooding and bus delays.",
            "Evalúa dos propuestas de ingeniería para la Avenida Riverfront y argumenta qué diseño resuelve tanto las inundaciones como los retrasos de autobuses.",
          ],
          klu: "Argue",
          eldStandard: "ELD-SS.6-8.Argue",
          expectation: "ELD-SS.6-8.Argue.Expressive",
          audioCharacter: "Elena Ramos",
          audioScript:
            "Whenever a summer storm drops more than three centimeters of rain, runoff floods the lower lane of Riverfront Avenue. Consequently, Electric Bus Route 12 is delayed by 25 minutes, and students arrive late to school.",
          readingTitle: ["Civil Engineering Impact Matrix", "Matriz de impacto de ingeniería civil"],
          readingClues: [
            {
              id: "clue-bioswale",
              label: ["Plan A — Permeable Bus Lane + Native Bioswales: Absorbs 78% of stormwater runoff, reduces bus delays to under 3 minutes, filters road pollutants.", "Plan A — Carril permeable + biozanjas nativas: Absorbe el 78% de la escorrentía, reduce los retrasos a menos de 3 minutos y filtra contaminantes."],
              relevant: true,
            },
            {
              id: "clue-repaint",
              label: ["Plan B — Repainting Existing Asphalt Lanes: Absorbs 0% of stormwater, leaves 25-minute storm delays unchanged, lowest upfront cost.", "Plan B — Repintar el asfalto existente: Absorbe 0% del agua pluvial, mantiene los retrasos de 25 minutos, menor costo inicial."],
              relevant: true,
            },
          ],
          clarifyPrompt: [
            "Ask Councilor Chen or Elena a question about runoff absorption or bus reliability:",
            "Hazle a la Concejala Chen o a Elena una pregunta sobre la absorción de escorrentía o los autobuses:",
          ],
          clarifyKeywords: ["bioswale", "permeable", "runoff", "flood", "delay", "bus", "78", "plan", "cost", "storm", "why"],
          clarifyUnlock: [
            "Councilor Chen notes: 'Important point: while Plan B is cheaper upfront, it absorbs 0% of runoff, whereas Plan A absorbs 78% of storm water and keeps Route 12 on schedule.'",
            "La Concejala Chen señala: 'Punto importante: aunque el Plan B es más barato al inicio, absorbe 0% de escorrentía, mientras que el Plan A absorbe el 78% y mantiene la Ruta 12 a tiempo.'",
          ],
          clarifyFallback: [
            "Councilor Chen says: 'Ask how much stormwater Plan A absorbs compared to Plan B, or how flooding affects Route 12.'",
            "La Concejala Chen dice: 'Pregunta cuánta agua pluvial absorbe el Plan A en comparación con el Plan B, o cómo afecta la inundación a la Ruta 12.'",
          ],
          communicatePrompt: [
            "Draft or record your formal proposal to the City Council. State your claim, cite data from the engineering matrix, and address why the alternative plan falls short.",
            "Escribe o graba tu propuesta formal para el Concejo Municipal. Expresa tu afirmación, cita datos de la matriz de ingeniería y explica por qué falla el plan alternativo.",
          ],
          requiredConcepts: [
            { id: "claim", words: ["plan a", "bioswale", "permeable"], label: ["a clear claim selecting Plan A (permeable lane + bioswales)", "una afirmación clara eligiendo el Plan A (carril permeable + biozanjas)"] },
            { id: "data", words: ["78%", "78", "runoff", "delay", "3 minutes", "25", "route 12", "flood"], label: ["quantitative evidence (78% runoff absorbed / bus delays reduced)", "evidencia cuantitativa (78% de escorrentía absorbida / menos retrasos)"] },
            { id: "counter", words: ["although", "whereas", "while", "however", "because", "consequently", "therefore"], label: ["academic reasoning/counterargument connector (although, whereas, because, therefore)", "conector académico de razonamiento o contrapunto (although, whereas, because, therefore)"] },
          ],
          frames: {
            A: ["The council should approve Plan A (bioswales) because it absorbs 78% of runoff and ___."],
            B: ["Although Plan B costs less initially, the city should adopt Plan A because bioswales absorb 78% of runoff and reduce Route 12 delays to ___."],
            C: ["Compose a counterargument-supported civic proposal using data from both plans."],
          },
          wordBank: ["although", "whereas", "bioswales", "permeable", "78%", "runoff", "consequently", "therefore"],
          consequences: {
            full: [
              "CONSEQUENCE UNLOCKED: The City Council adopts your Permeable Transit & Bioswale Ordinance! During the next storm, Riverfront Avenue drains cleanly and Route 12 arrives on time.",
              "CONSECUENCIA DESBLOQUEADA: ¡El Concejo Municipal aprueba tu ordenanza de biozanjas! En la siguiente tormenta, la Avenida Riverfront drena sin problemas y la Ruta 12 llega a tiempo.",
            ],
            partial: [
              "CHARACTER FOLLOW-UP: Councilor Chen responds, 'You named a plan, but skeptical council members need the specific runoff percentage (78%) and an explanation of why Plan B fails during storms.'",
              "SEGUIMIENTO DEL PERSONAJE: La Concejala Chen responde: 'Nombraste un plan, pero los concejales necesitan el porcentaje específico (78%) y por qué falla el Plan B en tormentas.'",
            ],
            unclear: [
              "CHARACTER REQUESTS CLARIFICATION: Councilor Chen asks, 'Which engineering plan solves the 25-minute bus delay, and what evidence proves it?'",
              "EL PERSONAJE PIDE ACLARACIÓN: La Concejala Chen pregunta: '¿Qué plan de ingeniería resuelve el retraso de 25 minutos y qué evidencia lo prueba?'",
            ],
          },
          transferPrompt: [
            "Fresh Apply Step: Explain how addressing a counterargument (such as upfront cost) strengthens an engineering recommendation.",
            "Paso de aplicación nueva: Explica cómo responder a un contraargumento (como el costo inicial) fortalece una recomendación de ingeniería.",
          ],
        },
      ],
    },
  },
  {
    id: "science-expedition",
    art: "reality-science.svg",
    domain: "Reading",
    colorClass: "d-reading",
    eld: "ELD-SC · Ecosystems & Earth Systems",
    klu: "Explain & Inform",
    title: ["Science Expedition", "Expedición Científica"],
    tagline: [
      "Explore living ecosystems, interpret sensor observations, sequence processes, and explain scientific relationships.",
      "Explora ecosistemas vivos, interpreta observaciones de sensores, ordena procesos y explica relaciones científicas.",
    ],
    characters: [
      { id: "dr-patel", name: "Dr. Priya Patel", role: ["Watershed Ecologist", "Ecóloga de cuencas hidrográficas"] },
      { id: "kofi", name: "Kofi Mensah", role: ["Field Sensor Technician", "Técnico de sensores de campo"] },
    ],
    missions: {
      "3-5": [
        {
          id: "pollinator-meadow",
          title: ["Expedition 1: The Quiet Pollinator Meadow", "Expedición 1: La pradera silenciosa de polinizadores"],
          goal: [
            "Investigate why fewer monarch butterflies visited Plot B and explain how native milkweed restores the habitat.",
            "Investiga por qué menos mariposas monarca visitaron la Parcela B y explica cómo el algodoncillo nativo restaura el hábitat.",
          ],
          klu: "Explain",
          eldStandard: "ELD-SC.4-5.Explain",
          expectation: "ELD-SC.4-5.Explain.Expressive",
          audioCharacter: "Dr. Priya Patel",
          audioScript:
            "In Plot A, we counted 18 monarch butterflies this morning because native milkweed and purple coneflowers are blooming there. However, Plot B had only 2 monarchs because mower crews cut the wildflowers before they bloomed.",
          readingTitle: ["Field Observation Chart · Meadow Plots A & B", "Tabla de observación de campo · Parcelas A y B"],
          readingClues: [
            {
              id: "clue-plot-a",
              label: ["Plot A (Uncut Native Meadow): 24 blooming milkweed stems, 18 monarch butterflies observed feeding and laying eggs.", "Parcela A (Pradera nativa sin cortar): 24 tallos de algodoncillo en flor, 18 mariposas monarca observadas."],
              relevant: true,
            },
            {
              id: "clue-plot-b",
              label: ["Plot B (Mowed Lawn Strip): 0 blooming wildflowers, 2 monarchs passing through without landing.", "Parcela B (Franja de césped cortado): 0 flores silvestres, 2 monarcas pasando sin posarse."],
              relevant: true,
            },
          ],
          clarifyPrompt: [
            "Ask Dr. Patel a question about why monarchs need milkweed or what happened in Plot B:",
            "Hazle a la Dra. Patel una pregunta sobre por qué las monarcas necesitan algodoncillo o qué pasó en la Parcela B:",
          ],
          clarifyKeywords: ["milkweed", "monarch", "butterfly", "plot", "mow", "cut", "flower", "bloom", "egg", "nectar", "why"],
          clarifyUnlock: [
            "Dr. Patel explains: 'Monarch caterpillars eat only milkweed leaves, and adult butterflies need blooming flowers for nectar. If we protect Plot B from mowing, the milkweed will regrow!'",
            "La Dra. Patel explica: 'Las orugas monarca solo comen hojas de algodoncillo y los adultos necesitan néctar. ¡Si protegemos la Parcela B del corte, el algodoncillo volverá a crecer!'",
          ],
          clarifyFallback: [
            "Dr. Patel says: 'Try asking why Plot A had 18 monarchs or what happened to the wildflowers in Plot B.'",
            "La Dra. Patel dice: 'Intenta preguntar por qué la Parcela A tenía 18 monarcas o qué pasó con las flores en la Parcela B.'",
          ],
          communicatePrompt: [
            "Explain why Plot A had more monarch butterflies than Plot B, and what the field team should do to restore Plot B.",
            "Explica por qué la Parcela A tuvo más mariposas monarca que la Parcela B, y qué debe hacer el equipo para restaurar la Parcela B.",
          ],
          requiredConcepts: [
            { id: "plants", words: ["milkweed", "flower", "bloom", "nectar", "mow", "cut"], label: ["the habitat cause (blooming milkweed vs. mowed flowers)", "la causa del hábitat (algodoncillo en flor vs. flores cortadas)"] },
            { id: "comparison", words: ["18", "plot a", "plot b", "more", "fewer", "protect", "grow", "restore"], label: ["comparison of Plot A and Plot B or restoration step", "comparación entre Parcela A y B o paso de restauración"] },
            { id: "connector", words: ["because", "however", "so", "when", "if", "therefore"], label: ["cause/effect or contrast connector (because, however, so, if)", "conector de causa/efecto o contraste (because, however, so, if)"] },
          ],
          frames: {
            A: ["Plot A had 18 monarchs because ___. To help Plot B, we should ___."],
            B: ["Plot A attracted 18 monarchs because milkweed was blooming; however, Plot B had only 2 because ___."],
            C: ["Explain the ecological relationship between mowing, native milkweed, and monarch populations."],
          },
          wordBank: ["milkweed", "because", "however", "Plot A", "Plot B", "blooming", "restore"],
          consequences: {
            full: [
              "CONSEQUENCE UNLOCKED: Kofi posts 'Pollinator Habitat Zone — Do Not Mow' signs around Plot B! Within three weeks, milkweed sprouts and monarch butterflies return to both plots.",
              "CONSECUENCIA DESBLOQUEADA: ¡Kofi coloca letreros de 'Zona de Hábitat de Polinizadores' en la Parcela B! En tres semanas brota el algodoncillo y regresan las monarcas.",
            ],
            partial: [
              "CHARACTER FOLLOW-UP: Dr. Patel says, 'You noticed part of the pattern, but remember to connect the milkweed flowers to why the butterflies stayed in Plot A.'",
              "SEGUIMIENTO DEL PERSONAJE: La Dra. Patel dice: 'Notaste parte del patrón, pero recuerda conectar las flores de algodoncillo con por qué las mariposas se quedaron en la Parcela A.'",
            ],
            unclear: [
              "CHARACTER REQUESTS CLARIFICATION: Dr. Patel asks, 'What plant difference between Plot A and Plot B explains the butterfly counts?'",
              "EL PERSONAJE PIDE ACLARACIÓN: La Dra. Patel pregunta: '¿Qué diferencia de plantas entre la Parcela A y la Parcela B explica el conteo de mariposas?'",
            ],
          },
          transferPrompt: [
            "Fresh Apply Step: If a school plants native flowers near the vegetable garden, how might that affect tomato and bean plants? Explain with 'because'.",
            "Paso de aplicación nueva: Si una escuela planta flores nativas cerca del huerto, ¿cómo podría afectar eso a las plantas de tomate y frijol? Explica con 'because'.",
          ],
        },
      ],
      "6-8": [
        {
          id: "estuary-dissolved-oxygen",
          title: ["Expedition 1: The Estuary Dissolved-Oxygen Drop", "Expedición 1: La caída de oxígeno disuelto en el estuario"],
          goal: [
            "Analyze sensor telemetry from Creek Station 3, sequence the nutrient-runoff mechanism, and explain why dissolved oxygen fell.",
            "Analiza la telemetría de la Estación 3, ordena el mecanismo de escorrentía de nutrientes y explica por qué cayó el oxígeno disuelto.",
          ],
          klu: "Explain",
          eldStandard: "ELD-SC.6-8.Explain",
          expectation: "ELD-SC.6-8.Explain.Expressive",
          audioCharacter: "Dr. Priya Patel",
          audioScript:
            "After Tuesday's heavy rain washed lawn fertilizer into Creek Station 3, nitrogen levels spiked. Consequently, surface algae multiplied rapidly. When those dense algae mats died and decomposed, bacteria consumed the dissolved oxygen in the water.",
          readingTitle: ["Estuary Sensor Telemetry · Stations 1 & 3", "Telemetría de sensores del estuario · Estaciones 1 y 3"],
          readingClues: [
            {
              id: "clue-st3",
              label: ["Station 3 (Below Fertilizer Outflow): Nitrogen 4.8 mg/L (High), Algal Bloom Density High, Dissolved Oxygen 2.4 mg/L (Stressful for fish).", "Estación 3 (Bajo descarga de fertilizante): Nitrógeno 4.8 mg/L (Alto), Floración algal alta, Oxígeno disuelto 2.4 mg/L."],
              relevant: true,
            },
            {
              id: "clue-st1",
              label: ["Station 1 (Upstream Forested Buffer): Nitrogen 0.6 mg/L (Low), Clear Water, Dissolved Oxygen 8.1 mg/L (Healthy).", "Estación 1 (Bosque aguas arriba): Nitrógeno 0.6 mg/L (Bajo), Agua clara, Oxígeno disuelto 8.1 mg/L (Saludable)."],
              relevant: true,
            },
          ],
          clarifyPrompt: [
            "Ask Dr. Patel or Kofi a question about how algae decomposition affects dissolved oxygen:",
            "Hazle a la Dra. Patel o a Kofi una pregunta sobre cómo la descomposición de algas afecta el oxígeno disuelto:",
          ],
          clarifyKeywords: ["algae", "oxygen", "fertilizer", "nitrogen", "bacteria", "decompose", "rain", "runoff", "station", "fish", "why", "how"],
          clarifyUnlock: [
            "Kofi replies: 'Key mechanism: fertilizer nitrogen feeds rapid algal blooms, and when the algae die, decomposing bacteria use up the dissolved oxygen—dropping Station 3 to 2.4 mg/L.'",
            "Kofi responde: 'Mecanismo clave: el nitrógeno del fertilizante alimenta las algas y, cuando mueren, las bacterias consumen el oxígeno disuelto, bajando la Estación 3 a 2.4 mg/L.'",
          ],
          clarifyFallback: [
            "Kofi says: 'Ask about the connection between fertilizer nitrogen, algae blooms, and dissolved oxygen at Station 3.'",
            "Kofi dice: 'Pregunta sobre la conexión entre el nitrógeno del fertilizante, las algas y el oxígeno disuelto en la Estación 3.'",
          ],
          communicatePrompt: [
            "Write or record a scientific explanation of why dissolved oxygen dropped to 2.4 mg/L at Station 3 compared to 8.1 mg/L at Station 1. Trace the cause-and-effect chain.",
            "Escribe o graba una explicación científica de por qué el oxígeno disuelto cayó a 2.4 mg/L en la Estación 3 frente a 8.1 mg/L en la Estación 1. Traza la cadena de causa y efecto.",
          ],
          requiredConcepts: [
            { id: "nutrient", words: ["fertilizer", "nitrogen", "runoff", "rain"], label: ["the initial trigger (fertilizer / nitrogen runoff)", "el desencadenante inicial (escorrentía de fertilizante / nitrógeno)"] },
            { id: "mechanism", words: ["algae", "algal", "bloom", "bacteria", "decompose", "oxygen", "2.4", "8.1"], label: ["the biological mechanism (algae bloom/decomposition consuming dissolved oxygen)", "el mecanismo biológico (floración de algas/bacterias que consumen oxígeno)"] },
            { id: "connector", words: ["because", "consequently", "therefore", "when", "after", "whereas", "result"], label: ["causal/sequence language (after, consequently, when, because, therefore)", "lenguaje causal o de secuencia (after, consequently, when, because, therefore)"] },
          ],
          frames: {
            A: ["After rain washed fertilizer into Station 3, algae grew and ___, so dissolved oxygen dropped to 2.4 mg/L."],
            B: ["Whereas Station 1 kept 8.1 mg/L of oxygen, Station 3 dropped to 2.4 mg/L because fertilizer runoff caused ___, which led to ___."],
            C: ["Explain the multi-step eutrophication chain from fertilizer runoff to dissolved-oxygen depletion."],
          },
          wordBank: ["consequently", "whereas", "fertilizer", "nitrogen", "algae", "bacteria", "dissolved oxygen"],
          consequences: {
            full: [
              "CONSEQUENCE UNLOCKED: Your causal chain is verified! Dr. Patel transmits the Station 3 report to the Watershed Restoration Team, unlocking the wetland buffer experiment!",
              "CONSECUENCIA DESBLOQUEADA: ¡Tu cadena causal está verificada! La Dra. Patel transmite el informe de la Estación 3 al Equipo de Restauración de Cuencas.",
            ],
            partial: [
              "CHARACTER FOLLOW-UP: Dr. Patel notes, 'You identified part of the data, but a complete scientific explanation must link the fertilizer runoff to the algae bloom AND explain why oxygen dropped.'",
              "SEGUIMIENTO DEL PERSONAJE: La Dra. Patel señala: 'Identificaste parte de los datos, pero una explicación completa debe conectar el fertilizante con las algas Y explicar por qué bajó el oxígeno.'",
            ],
            unclear: [
              "CHARACTER REQUESTS CLARIFICATION: Dr. Patel asks, 'How did the rain and fertilizer at Station 3 lead to lower dissolved oxygen?'",
              "EL PERSONAJE PIDE ACLARACIÓN: La Dra. Patel pregunta: '¿Cómo provocaron la lluvia y el fertilizante en la Estación 3 una caída del oxígeno disuelto?'",
            ],
          },
          transferPrompt: [
            "Fresh Apply Step: Based on Station 1's data (8.1 mg/L oxygen with a forested buffer), how would planting native shrubs along Creek Station 3 change future storm results?",
            "Paso de aplicación nueva: Según los datos de la Estación 1 (8.1 mg/L con bosque protector), ¿cómo cambiaría los resultados futuros plantar arbustos nativos junto a la Estación 3?",
          ],
        },
      ],
    },
  },
];

const INTEREST_TEMPLATES = [
  {
    keywords: ["ocean", "sea", "water", "fish", "whale", "coral", "river", "creek", "science", "experiment", "nature", "animal", "butterfly", "plant"],
    worldId: "science-expedition",
    roleTitle: ["Ecological Field Investigator", "Investigador ecológico de campo"],
    explanation: [
      "Matched to Science Expedition: You will investigate living ecosystems, analyze water and habitat sensors, and explain scientific cause-and-effect!",
      "Conectado con Expedición Científica: ¡Investigarás ecosistemas vivos, analizarás sensores de agua y hábitat, y explicarás causas y efectos científicos!",
    ],
  },
  {
    keywords: ["city", "park", "bus", "coach", "soccer", "sport", "event", "school event", "mayor", "build", "plan", "design", "community", "garden"],
    worldId: "future-city",
    roleTitle: ["Community & Event Planner", "Planificador comunitario y de eventos"],
    explanation: [
      "Matched to Future City: You will interview community stakeholders, compare budgets and schedules, and persuade decision-makers with evidence!",
      "Conectado con Ciudad del Futuro: ¡Entrevistarás a miembros de la comunidad, compararás presupuestos y persuadirás con evidencia!",
    ],
  },
  {
    keywords: ["mystery", "detective", "clue", "journalist", "news", "interview", "story", "secret", "find", "missing", "case"],
    worldId: "mystery-academy",
    roleTitle: ["Lead Investigative Reporter & Detective", "Reportero de investigación y detective"],
    explanation: [
      "Matched to Mystery Academy: You will interview witnesses, cross-check clues, ask clarification questions, and solve the case!",
      "Conectado con Academia de Misterios: ¡Entrevistarás testigos, cruzarás pistas, harás preguntas de aclaración y resolverás el caso!",
    ],
  },
];

/**
 * Match a student's free-text interest prompt ("I want to interview a soccer coach", "ocean mystery")
 * to a validated world template without executing arbitrary code or inventing unvalidated worlds.
 */
export function matchAdventureInterest(rawInput = "") {
  const clean = String(rawInput || "").trim().slice(0, 200);
  if (!clean) return null;
  const lower = clean.toLowerCase();
  for (const tpl of INTEREST_TEMPLATES) {
    if (tpl.keywords.some((k) => lower.includes(k))) {
      return {
        input: clean,
        worldId: tpl.worldId,
        roleTitle: tpl.roleTitle,
        explanation: tpl.explanation,
      };
    }
  }
  return {
    input: clean,
    worldId: "mystery-academy",
    roleTitle: ["Field Communicator & Investigator", "Comunicador e investigador de campo"],
    explanation: [
      "Closest validated world: Mystery Academy — where you can practice interviewing people, gathering clues, and explaining your findings.",
      "Mundo validado más cercano: Academia de Misterios, donde puedes practicar entrevistar personas, reunir pistas y explicar tus hallazgos.",
    ],
  };
}

/**
 * Evaluate a student's clarification question.
 */
export function evaluateClarification(questionText, mission) {
  const clean = String(questionText || "").trim();
  const words = wordCount(clean);
  if (words < 2) {
    return {
      ok: false,
      status: "too-short",
      matchedKeywords: [],
    };
  }
  const lower = clean.toLowerCase();
  const matchedKeywords = (mission.clarifyKeywords || []).filter((k) => lower.includes(k.toLowerCase()));
  const hasQuestionMove = /\?|(\b(who|what|where|when|why|how|which|can|did|does|is|was|quién|qué|dónde|cuándo|por qué|cómo|cuál)\b)/i.test(clean);
  const ok = matchedKeywords.length >= 1 && (hasQuestionMove || words >= 3);
  return {
    ok,
    status: ok ? "unlocked" : "needs-focus",
    matchedKeywords,
  };
}

/**
 * Communicative Consequence Intelligence:
 * Evaluates a student's spoken/written communication against the mission's communicative concepts.
 * Never demands one exact sentence; checks whether key ideas and discourse connectors are communicated.
 */
export function evaluateCommunication(responseText, mission) {
  const clean = String(responseText || "").trim();
  const words = wordCount(clean);
  const lower = clean.toLowerCase();
  const concepts = (mission.requiredConcepts || []).map((c) => {
    const matched = c.words.filter((w) => lower.includes(w.toLowerCase()));
    return {
      id: c.id,
      label: c.label,
      met: matched.length > 0,
      matched,
    };
  });
  const metCount = concepts.filter((c) => c.met).length;
  const total = concepts.length || 1;
  let outcome = "unclear";
  if (words >= 6 && metCount === total) outcome = "full";
  else if (words >= 4 && metCount >= Math.max(1, total - 1)) outcome = "partial";

  return {
    outcome,
    ok: outcome === "full",
    words,
    concepts,
    metCount,
    total,
    consequenceText: mission.consequences?.[outcome] || mission.consequences?.unclear,
  };
}

/**
 * Validate a teacher-created Reality Mission schema so teachers can author, preview, save, and share
 * missions without writing code.
 */
export function validateCustomMission(rawMission = {}) {
  const title = String(rawMission.title || "").trim().slice(0, 120);
  const worldId = FLAGSHIP_WORLDS.some((w) => w.id === rawMission.worldId) ? rawMission.worldId : "future-city";
  const band = rawMission.band === "3-5" ? "3-5" : "6-8";
  const klu = ["Narrate", "Inform", "Explain", "Argue"].includes(rawMission.klu) ? rawMission.klu : "Argue";
  const eldStandard = String(rawMission.eldStandard || "ELD-SS.6-8.Argue").trim().slice(0, 60);
  const characterName = String(rawMission.characterName || "Councilor Chen").trim().slice(0, 60);
  const audioScript = String(rawMission.audioScript || "").trim().slice(0, 600);
  const readingClue = String(rawMission.readingClue || "").trim().slice(0, 400);
  const communicatePrompt = String(rawMission.communicatePrompt || "").trim().slice(0, 300);
  const keywords = String(rawMission.keywords || "because, evidence, should")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
  const consequenceFull = String(
    rawMission.consequenceFull ||
      "Your evidence-based communication convinced the team and unlocked the next stage of the project!",
  )
    .trim()
    .slice(0, 300);

  const errors = [];
  if (title.length < 4) errors.push("Mission title must be at least 4 characters.");
  if (audioScript.length < 15) errors.push("Listening script must be at least 15 characters.");
  if (readingClue.length < 15) errors.push("Reading evidence clue must be at least 15 characters.");
  if (communicatePrompt.length < 10) errors.push("Communication prompt must be at least 10 characters.");
  if (keywords.length === 0) errors.push("Include at least one target keyword or connector.");

  const mission = {
    id: rawMission.id || `custom-${Date.now().toString(36)}`,
    custom: true,
    worldId,
    band,
    title: [title, title],
    goal: [communicatePrompt, communicatePrompt],
    klu,
    eldStandard,
    expectation: `${eldStandard}.${klu}.Expressive`,
    audioCharacter: characterName,
    audioScript,
    readingTitle: ["Authoring Studio Source Document", "Documento fuente del estudio"],
    readingClues: [
      { id: "clue-custom-1", label: [readingClue, readingClue], relevant: true },
    ],
    clarifyPrompt: [
      `Ask ${characterName} a clarification question about the source:`,
      `Hazle a ${characterName} una pregunta de aclaración sobre la fuente:`,
    ],
    clarifyKeywords: [...new Set([...keywords, "why", "how", "what", "where", "who"])],
    clarifyUnlock: [
      `${characterName} replies: 'Key detail: focus on ${keywords.slice(0, 3).join(", ")} when you build your response.'`,
      `${characterName} responde: 'Detalle clave: enfócate en ${keywords.slice(0, 3).join(", ")} al construir tu respuesta.'`,
    ],
    clarifyFallback: [
      `${characterName} says: 'Ask me a question using one of the key ideas (${keywords.slice(0, 2).join(", ")}).'`,
      `${characterName} dice: 'Hazme una pregunta usando una de las ideas clave (${keywords.slice(0, 2).join(", ")}).'`,
    ],
    communicatePrompt: [communicatePrompt, communicatePrompt],
    requiredConcepts: [
      {
        id: "target-idea",
        words: keywords,
        label: [`key mission concepts (${keywords.slice(0, 3).join(", ")})`, `conceptos clave de la misión (${keywords.slice(0, 3).join(", ")})`],
      },
      {
        id: "connector",
        words: ["because", "so", "therefore", "however", "although", "whereas", "first", "should"],
        label: ["a connecting or reasoning word (because, therefore, should, however)", "una palabra conectora o de razonamiento"],
      },
    ],
    frames: {
      A: [`I think we should ___ because ${keywords[0] || "the evidence"} shows ___.`],
      B: [`Based on the source, ___ because ___ (${keywords.slice(0, 2).join(", ")}).`],
      C: ["State your claim, cite the source detail, and explain the consequence in your own words."],
    },
    wordBank: [...new Set([...keywords, "because", "therefore", "evidence"])],
    consequences: {
      full: [consequenceFull, consequenceFull],
      partial: [
        `${characterName} says: 'Good start! Add a connecting word (like because or therefore) and cite ${keywords[0] || "the source"}.'`,
        `${characterName} dice: '¡Buen comienzo! Agrega un conector (como because o therefore) y cita ${keywords[0] || "la fuente"}.'`,
      ],
      unclear: [
        `${characterName} asks: 'Could you clarify your response using details from the source and ${keywords[0] || "evidence"}?'`,
        `${characterName} pregunta: '¿Podrías aclarar tu respuesta usando detalles de la fuente y ${keywords[0] || "evidencia"}?'`,
      ],
    },
    transferPrompt: [
      "Fresh Apply Step: Explain in one sentence how your communication solved the problem.",
      "Paso de aplicación nueva: Explica en una oración cómo tu comunicación resolvió el problema.",
    ],
  };

  return { valid: errors.length === 0, errors, mission };
}

export function loadRealityState(read = (k) => storage.get(k)) {
  const parsed = safeJson(read(REALITY_STORAGE_KEY), null);
  return {
    v: 1,
    activeWorldId: parsed?.activeWorldId || "mystery-academy",
    activeMissionId: parsed?.activeMissionId || "",
    supportTier: ["A", "B", "C"].includes(parsed?.supportTier) ? parsed?.supportTier : "B",
    interestMatch: parsed?.interestMatch || null,
    progress: parsed?.progress && typeof parsed.progress === "object" ? parsed.progress : {},
    customMissions: Array.isArray(parsed?.customMissions) ? parsed.customMissions : [],
    storyBuilder: parsed?.storyBuilder && typeof parsed.storyBuilder === "object" ? parsed.storyBuilder : null,
    collab: parsed?.collab && typeof parsed.collab === "object" ? parsed.collab : null,
    studentGame: parsed?.studentGame && typeof parsed.studentGame === "object" ? parsed.studentGame : null,
  };
}

export function saveRealityState(state, write = (k, v) => storage.set(k, v)) {
  write(REALITY_STORAGE_KEY, JSON.stringify({ v: 1, ...state }));
}

// Language Escape Room, room 4 in both bands: the greenhouse control challenge (content only; schema: engine.js).
// 3-5: three locks on a garden greenhouse control room. 6-8: four locks on a rooftop greenhouse controller, where
// rules (not a map) decide what is allowed. Every lock is an interpret step (choose) and then an explain step (write)
// with the same `lock` number. All charts, logs and readings are invented for practice, and each case says so.
const C = (en, es) => [en, es];

export const GREENHOUSE_35 = {
  id: "er35-greenhouse",
  title: "The Greenhouse Control Room",
  art: ["bg-forest", "char-maya"],
  intro:
    "The hunt is over, but Ms. Rivera has one bonus door. Across the yard, the greenhouse control room is locked, and the seedlings need the right settings before the sun gets hot. A note is taped to the door, and a plant chart hangs beside it. (The chart is made up for practice.)",
  introEs:
    "La búsqueda terminó, pero la Sra. Rivera tiene una puerta extra. Al otro lado del patio, el cuarto de control del invernadero está cerrado, y las plantitas necesitan los ajustes correctos antes de que el sol caliente. Hay una nota pegada en la puerta y una tabla de plantas al lado. (La tabla está inventada para practicar.)",
  outro:
    "The control room door opens. A small screen shows the right settings: cool, steady and bright. Ms. Rivera claps. “You read every clue and explained every lock,” she says. “The seedlings say thank you!”",
  docs: [
    {
      id: "note",
      kind: "note",
      title: "Note on the control room door",
      from: "Ms. Rivera",
      lines: [
        "Turn the dial to the best temperature for the plant we water every day.",
        "The room is warm today. Use the switch that moves warm air out of the room.",
        "Turn on the grow lights 15 minutes after the fan starts.",
      ],
    },
    {
      id: "plants",
      kind: "schedule",
      title: "Plant care chart (practice chart)",
      cols: ["Plant", "Water", "Best temperature"],
      rows: [
        ["Basil", "Every 2 days", "22 degrees"],
        ["Lettuce", "Every day", "16 degrees"],
        ["Tomato", "Every 3 days", "24 degrees"],
        ["Mint", "Every 2 days", "20 degrees"],
      ],
    },
    {
      id: "panel",
      kind: "diagram",
      title: "Control panel",
      art: "obj-lightbulb",
      parts: [
        { label: "Switch A", text: "Heater: makes the room warmer" },
        { label: "Switch B", text: "Vent fan: moves warm air out of the room" },
        { label: "Switch C", text: "Water pump: sends water to the benches" },
        { label: "Switch D", text: "Grow lights: add light for the plants" },
      ],
    },
    {
      id: "morning",
      kind: "schedule",
      title: "Morning jobs",
      cols: ["Time", "Job"],
      rows: [
        ["7:00", "Open the vents"],
        ["7:15", "Start the fan"],
        ["8:00", "Water the benches"],
      ],
    },
  ],
  steps: [
    {
      id: "l1-read",
      lock: 1,
      type: "choose",
      docs: ["note", "plants"],
      prompt: "Which temperature opens the first lock?",
      help: "Lee la nota: ¿qué planta regamos todos los días? Busca esa planta en la tabla y mira su mejor temperatura.",
      options: [
        {
          id: "a",
          text: "22 degrees",
          why: "22 degrees is for basil. How often do we water basil?",
        },
        {
          id: "b",
          text: "16 degrees",
          ok: true,
        },
        {
          id: "c",
          text: "24 degrees",
          why: "24 degrees is the warmest number, but it belongs to tomatoes. How often do they get water?",
        },
        {
          id: "d",
          text: "20 degrees",
          why: "20 degrees is for mint. Does the chart say we water mint every day?",
        },
      ],
      rule: C(
        "Find the water words in the note, then find the same words in the chart.",
        "Busca las palabras sobre el riego en la nota y luego esas mismas palabras en la tabla.",
      ),
      explain: "We water lettuce every day, and the best temperature for lettuce is 16 degrees.",
    },
    {
      id: "l1-explain",
      lock: 1,
      type: "write",
      docs: ["note", "plants"],
      prompt: "Tell how you know the temperature. Use the chart.",
      help: "Di el número. Luego di qué planta regamos todos los días. Usa because y nombra la tabla.",
      check: {
        min: 10,
        ideas: [
          { any: ["16"], clue: C("Say the number.", "Di el número.") },
          {
            any: ["lettuce", "every day"],
            clue: C(
              "Say which plant, or how often we water it.",
              "Di qué planta o cada cuánto la regamos.",
            ),
          },
        ],
        connector: ["cause"],
        evidence: true,
      },
      rule: C(
        "Give your answer, then give the reason from the chart.",
        "Da tu respuesta y luego la razón que está en la tabla.",
      ),
      frame: "The dial is ___ because the chart says ___.",
      model: "The dial is 16 because the chart says we water lettuce every day.",
      keep: "The temperature code",
    },
    {
      id: "l2-read",
      lock: 2,
      type: "choose",
      docs: ["note", "panel"],
      prompt: "The room is warm. Which switch do you turn on?",
      help: "La nota dice que el cuarto está caliente y que uses el interruptor que saca el aire caliente. Lee el diagrama del tablero: ¿cuál interruptor hace eso?",
      options: [
        {
          id: "a",
          text: "Switch A",
          why: "Switch A makes the room warmer. Is that what a warm room needs?",
        },
        {
          id: "b",
          text: "Switch B",
          ok: true,
        },
        {
          id: "c",
          text: "Switch C",
          why: "Switch C sends water to the benches. Does water move warm air out of the room?",
        },
        {
          id: "d",
          text: "Switch D",
          why: "Switch D adds light. Does the note ask for more light now?",
        },
      ],
      rule: C(
        "Say what the room needs, then find the switch that does that job.",
        "Di qué necesita el cuarto y luego busca el interruptor que hace ese trabajo.",
      ),
      explain: "Switch B is the vent fan, and it moves warm air out of the room.",
    },
    {
      id: "l2-explain",
      lock: 2,
      type: "write",
      docs: ["note", "panel"],
      prompt: "Tell why that switch is the right one. Use the panel.",
      help: "Di qué interruptor usas y qué hace. Usa because y nombra el tablero.",
      check: {
        min: 8,
        ideas: [
          {
            any: ["vent fan", "fan", "switch b"],
            clue: C("Name the switch or what it is.", "Nombra el interruptor o qué es."),
          },
          {
            any: ["warm air", "moves", "cool*", "out"],
            clue: C("Say what it does for the warm room.", "Di qué hace por el cuarto caliente."),
          },
        ],
        connector: ["cause"],
      },
      rule: C(
        "Say which switch, then say what it does.",
        "Di qué interruptor y luego di qué hace.",
      ),
      frame: "I turn on the ___ because it ___.",
      model: "I turn on the vent fan because it moves warm air out of the room.",
      keep: "Which switch, and why",
    },
    {
      id: "l3-read",
      lock: 3,
      type: "choose",
      docs: ["note", "morning"],
      prompt: "At what time do you turn on the grow lights?",
      help: "La nota dice que las luces se encienden 15 minutos DESPUÉS de que empieza el ventilador. Busca cuándo empieza el ventilador en la lista y suma 15 minutos.",
      options: [
        {
          id: "a",
          text: "7:00",
          why: "7:00 is when the vents open. When does the fan start?",
        },
        {
          id: "b",
          text: "7:15",
          why: "7:15 is when the fan starts. The note says to wait after that. How long?",
        },
        {
          id: "c",
          text: "7:30",
          ok: true,
        },
        {
          id: "d",
          text: "8:00",
          why: "8:00 is when we water the benches. Is that 15 minutes after the fan starts?",
        },
      ],
      rule: C(
        "Find the starting time in the list, then add the waiting time from the note.",
        "Busca la hora de inicio en la lista y luego suma el tiempo de espera de la nota.",
      ),
      explain: "The fan starts at 7:15, and 15 minutes later is 7:30.",
    },
    {
      id: "l3-explain",
      lock: 3,
      type: "write",
      docs: ["note", "morning"],
      prompt: "Tell your team when the lights go on and how you worked it out.",
      help: "Di la hora. Luego di cuándo empieza el ventilador y cuánto hay que esperar. Usa because.",
      check: {
        min: 12,
        ideas: [
          { any: ["7:30"], clue: C("Say the time for the lights.", "Di la hora de las luces.") },
          {
            any: ["7:15", "fan", "15 minutes"],
            clue: C(
              "Say when the fan starts, or how long you wait.",
              "Di cuándo empieza el ventilador o cuánto esperas.",
            ),
          },
        ],
        connector: ["cause"],
      },
      rule: C(
        "Give the time, then show the start time and the wait that you added.",
        "Da la hora y luego muestra la hora de inicio y la espera que sumaste.",
      ),
      frame: "The lights go on at ___ because the fan starts at ___, and we wait ___.",
      model:
        "The lights go on at 7:30 because the fan starts at 7:15, and the note says to wait 15 minutes after that.",
      keep: "When the lights go on",
    },
  ],
};

export const GREENHOUSE_68 = {
  id: "er68-greenhouse",
  title: "The Rooftop Greenhouse Controller",
  art: ["bg-lab", "char-scientist"],
  intro:
    "After the museum, your team gets a new job on the Ridgeview roof. The greenhouse controller is locked in safe mode, and it opens only for operators who can read its rules and its sensor log correctly. The manual, the old memo and Tuesday's readings are on the desk. (All readings are made up for practice.)",
  introEs:
    "Después del museo, tu equipo recibe un trabajo nuevo en el techo de Ridgeview. El controlador del invernadero está en modo seguro y solo se abre para operadores que sepan leer correctamente sus reglas y su registro de sensores. El manual, el memorando viejo y las lecturas del martes están en el escritorio. (Todas las lecturas están inventadas para practicar.)",
  outro:
    "The controller's screen turns green and the vents hum. “Safe mode off,” it reads. Mr. Chen, the facilities manager, laughs at the door. “Whoever trained you read the rules, checked the data, and did not trust the old memo.”",
  docs: [
    {
      id: "manual",
      kind: "note",
      title: "Controller manual (updated May 12)",
      from: "Mr. Chen, facilities manager",
      lines: [
        "Vent rule: open the vents when the temperature is above 28 degrees in two readings in a row.",
        "Fan rule: run the fan for any zone with humidity above 75 percent.",
        "Safety lock: never run the water pump while the vents are open. Close the vents first.",
        "These rules replace the March memo.",
      ],
    },
    {
      id: "memo",
      kind: "record",
      title: "March memo (replaced)",
      rows: [
        ["Vent rule", "Open the vents above 26 degrees"],
        ["Fan rule", "Run the fan above 70 percent humidity"],
      ],
    },
    {
      id: "log",
      kind: "schedule",
      title: "Sensor log, Tuesday (readings invented for practice)",
      cols: ["Time", "Temperature", "Vents"],
      rows: [
        ["9:00 a.m.", "26 degrees", "Closed"],
        ["10:00 a.m.", "29 degrees", "Closed"],
        ["11:00 a.m.", "27 degrees", "Closed"],
        ["12:00 p.m.", "29 degrees", "Closed"],
        ["1:00 p.m.", "30 degrees", "Closed"],
        ["2:00 p.m.", "31 degrees", "Open"],
      ],
    },
    {
      id: "panel",
      kind: "diagram",
      title: "Control panel",
      art: "obj-lightbulb",
      parts: [
        { label: "Switch 1", text: "Vents: open or close the roof vents" },
        { label: "Switch 2", text: "Fan: moves air through the room" },
        { label: "Switch 3", text: "Water pump: sends water to the benches" },
        { label: "Switch 4", text: "Lights: add light for the plants" },
      ],
    },
    {
      id: "humidity",
      kind: "chart",
      title: "Humidity by zone, Tuesday at noon",
      unit: "%",
      bars: [
        { label: "Zone A", value: 62 },
        { label: "Zone B", value: 78 },
        { label: "Zone C", value: 71 },
        { label: "Zone D", value: 80 },
      ],
      source: "Zone sensors (numbers invented for practice)",
    },
    {
      id: "boyd",
      kind: "witness",
      title: "Note from the night technician",
      who: "Mr. Boyd",
      role: "night technician",
      said: "The greenhouse never went above 28 degrees on Tuesday, so the controller worked perfectly.",
    },
  ],
  steps: [
    {
      id: "l1-read",
      lock: 1,
      type: "choose",
      docs: ["manual", "memo", "log"],
      prompt: "Under the updated vent rule, at what time was the rule first met on Tuesday?",
      help: "La regla nueva pide MÁS de 28 grados en DOS lecturas seguidas. Revisa la columna de temperatura del registro: busca dos lecturas seguidas por encima de 28. No uses el memorando viejo.",
      options: [
        {
          id: "a",
          text: "10:00 a.m.",
          why: "29 degrees is above 28, but the rule needs two readings in a row. What was the next reading?",
        },
        {
          id: "b",
          text: "12:00 p.m.",
          why: "The 12:00 reading is above 28, but it is only the first of a pair. When does the second one come?",
        },
        {
          id: "c",
          text: "1:00 p.m.",
          ok: true,
        },
        {
          id: "d",
          text: "2:00 p.m.",
          why: "2:00 is when the log shows the vents open. Was the rule already met before then?",
        },
      ],
      rule: C(
        "Check every part of the rule: above 28 degrees, and in two readings in a row. The second reading is when the rule is met.",
        "Revisa cada parte de la regla: más de 28 grados y en dos lecturas seguidas. La segunda lectura es cuando se cumple la regla.",
      ),
      explain:
        "The 12:00 reading (29 degrees) and the 1:00 reading (30 degrees) are two in a row above 28, so the rule was first met at 1:00 p.m.",
    },
    {
      id: "l1-explain",
      lock: 1,
      type: "write",
      docs: ["manual", "log"],
      prompt:
        "Explain to the next operator why the rule was met at that time, and why 10:00 did not count.",
      help: "Escribe dos oraciones. Di a qué hora se cumplió la regla y cuáles dos lecturas la cumplen. Luego explica por qué la lectura de las 10:00 no contó (la siguiente bajó). Nombra el registro y usa because.",
      check: {
        min: 24,
        ideas: [
          {
            any: ["1:00"],
            clue: C("Say the time the rule was met.", "Di la hora en que se cumplió la regla."),
          },
          {
            any: ["two readings", "two in a row", "in a row", "12:00", "30 degrees"],
            clue: C("Say which readings make two in a row.", "Di qué lecturas hacen dos seguidas."),
          },
          {
            any: ["10:00", "27", "only one", "one reading"],
            clue: C(
              "Say why the 10:00 reading did not count.",
              "Di por qué la lectura de las 10:00 no contó.",
            ),
          },
        ],
        connector: ["cause"],
        evidence: true,
      },
      rule: C(
        "A strong explanation gives the answer, the readings that prove it, and why the tempting reading does not count.",
        "Una explicación fuerte da la respuesta, las lecturas que la prueban y por qué no cuenta la lectura que tienta.",
      ),
      frame:
        "The rule was met at ___ because the log shows ___ and ___ in a row. The ___ reading did not count because ___.",
      model:
        "The rule was met at 1:00 p.m. because the sensor log shows 29 degrees at 12:00 and 30 degrees at 1:00, two in a row above 28. The 10:00 reading did not count because the next reading was 27, so only one reading was above 28.",
      keep: "Why the vent rule was met",
    },
    {
      id: "l2-read",
      lock: 2,
      type: "choose",
      docs: ["manual", "panel"],
      prompt: "The vents are open, and a bench is dry. What should you do?",
      help: "Lee la regla de seguridad del manual. ¿Se puede encender la bomba con las ventilas abiertas? Piensa qué hay que hacer primero y qué interruptor del tablero lo hace.",
      options: [
        {
          id: "a",
          text: "Turn on the water pump right now.",
          why: "Read the safety lock in the manual. What does it say about the pump and the vents?",
        },
        {
          id: "b",
          text: "Close the vents, then turn on the water pump.",
          ok: true,
        },
        {
          id: "c",
          text: "Turn on the fan, then the water pump.",
          why: "The fan moves air. Does it close the vents the safety lock is talking about?",
        },
        {
          id: "d",
          text: "Wait until the vents close by themselves.",
          why: "Does the manual say the vents ever close by themselves? What does it tell the operator to do first?",
        },
      ],
      rule: C(
        "A safety rule names a condition (the vents are open) and a step to take first.",
        "Una regla de seguridad nombra una condición (las ventilas están abiertas) y un paso que se hace primero.",
      ),
      explain:
        "The safety lock says never to run the pump while the vents are open, and to close the vents first. Switch 1 closes them.",
    },
    {
      id: "l2-explain",
      lock: 2,
      type: "write",
      docs: ["manual", "panel"],
      prompt:
        "Write the steps for a new operator, and use if and then to show what depends on what.",
      help: "Escribe una o dos oraciones con if ... then. Di qué pasa si las ventilas están abiertas y cuál es el orden de los pasos. Explica por qué con la regla de seguridad del manual.",
      check: {
        min: 20,
        ideas: [
          {
            any: ["close*"],
            clue: C("Say what you do to the vents.", "Di qué haces con las ventilas."),
          },
          {
            any: ["pump"],
            clue: C("Say when the pump can run.", "Di cuándo puede funcionar la bomba."),
          },
          {
            any: ["never", "safety", "rule", "manual"],
            clue: C("Name the rule that is the reason.", "Nombra la regla que es la razón."),
          },
        ],
        connector: ["condition"],
        evidence: true,
      },
      rule: C(
        "Use if to name the condition and then to name the step. Add the rule that explains why.",
        "Usa if para nombrar la condición y then para nombrar el paso. Agrega la regla que explica por qué.",
      ),
      frame: "If ___, then ___ first, and ___ after that, because the manual says ___.",
      model:
        "If the vents are open, then close them first, and run the water pump after that, because the manual says never to run the pump while the vents are open.",
      keep: "The pump safety steps",
    },
    {
      id: "l3-read",
      lock: 3,
      type: "choose",
      docs: ["manual", "memo", "humidity"],
      prompt: "Under the updated fan rule, which zones need the fan at noon?",
      help: "La regla nueva dice MÁS de 75 por ciento. Compara cada barra de la gráfica con 75. Cuidado: el memorando viejo usaba otro número.",
      options: [
        {
          id: "a",
          text: "Zones B and D",
          ok: true,
        },
        {
          id: "b",
          text: "Zones B, C and D",
          why: "Zone C is 71 percent. That would pass the old memo's number, but the manual replaced the memo. What is the updated number?",
        },
        {
          id: "c",
          text: "Zone D only",
          why: "Zone D is the highest, but the rule applies to any zone above the limit. Check the other bars.",
        },
        {
          id: "d",
          text: "Zones A and C",
          why: "Zone A is 62 percent and zone C is 71 percent. Is either one above the updated limit?",
        },
      ],
      rule: C(
        "Use the updated number (75 percent) and compare it with every zone, not only the highest one.",
        "Usa el número actualizado (75 por ciento) y compáralo con cada zona, no solo con la más alta.",
      ),
      explain:
        "Zone B is 78 percent and zone D is 80 percent, both above 75. Zone C is 71 percent and zone A is 62 percent, so neither needs the fan.",
    },
    {
      id: "l3-explain",
      lock: 3,
      type: "write",
      docs: ["manual", "humidity"],
      prompt: "Explain which zones get the fan, and why zone C does not. Use the chart.",
      help: "Escribe dos oraciones. Di qué zonas necesitan el ventilador y por qué (están por encima de 75 por ciento). Luego explica por qué la zona C no (71 es menor que 75). Usa but o however y nombra la gráfica.",
      check: {
        min: 20,
        ideas: [
          {
            any: ["zone b", "zones b", "b and d", "78", "80"],
            clue: C(
              "Name the zones that need the fan.",
              "Nombra las zonas que necesitan el ventilador.",
            ),
          },
          {
            any: ["75", "75%"],
            clue: C("Name the limit from the rule.", "Nombra el límite de la regla."),
          },
          {
            any: ["zone c", "71"],
            clue: C(
              "Say why zone C does not get the fan.",
              "Di por qué la zona C no recibe el ventilador.",
            ),
          },
        ],
        connector: ["contrast", "cause"],
        evidence: true,
      },
      rule: C(
        "Name what meets the rule, name the limit, and say why the near miss does not meet it.",
        "Nombra lo que cumple la regla, nombra el límite y di por qué lo que casi cumple no la cumple.",
      ),
      frame:
        "Zones ___ need the fan because the chart shows ___ is above ___, but zone ___ is only ___.",
      model:
        "Zones B and D need the fan because the chart shows 78 and 80 percent, which are above 75, but zone C is only 71 percent, so it stays off under the updated rule.",
      keep: "Which zones get the fan",
    },
    {
      id: "l4-read",
      lock: 4,
      type: "choose",
      docs: ["log", "boyd"],
      prompt:
        "Mr. Boyd's note makes a claim about Tuesday. Which statement does the sensor log support?",
      help: "Compara cada frase con la columna de temperatura y la columna de ventilas del registro. Busca la frase que los números del registro confirman, no la que suena tranquilizadora.",
      options: [
        {
          id: "a",
          text: "The temperature went above 28 degrees several times.",
          ok: true,
        },
        {
          id: "b",
          text: "The temperature stayed at or below 28 degrees all day.",
          why: "Look at the 10:00 a.m. reading and the readings after noon. Are they at or below 28?",
        },
        {
          id: "c",
          text: "The vents opened as soon as the rule was met.",
          why: "Compare the time the rule was met with the time the log shows the vents open.",
        },
        {
          id: "d",
          text: "The controller worked perfectly.",
          why: "This is a judgment. Which numbers in the log would you use to check it?",
        },
      ],
      rule: C(
        "Check a claim against the numbers in the record, and treat words like perfectly as judgments to test.",
        "Revisa una afirmación con los números del registro, y trata palabras como perfectly como juicios que hay que probar.",
      ),
      explain:
        "The log shows 29, 29, 30 and 31 degrees at different times, all above 28, so Mr. Boyd's claim is not supported.",
    },
    {
      id: "l4-explain",
      lock: 4,
      type: "write",
      docs: ["log", "boyd"],
      prompt: "Correct Mr. Boyd's note for the report. Use two readings from the log.",
      help: "Escribe una o dos oraciones. Di lo que dijo el Sr. Boyd y usa but o however para corregirlo con dos lecturas del registro (por ejemplo, 30 grados a la 1:00 y 31 a las 2:00). Nombra el registro.",
      check: {
        min: 20,
        ideas: [
          {
            any: ["29", "30", "31"],
            clue: C("Use readings from the log.", "Usa lecturas del registro."),
          },
          {
            any: ["28"],
            clue: C(
              "Mention the limit Mr. Boyd named.",
              "Menciona el límite que nombró el Sr. Boyd.",
            ),
          },
        ],
        connector: ["contrast"],
        evidence: true,
      },
      rule: C(
        "To correct a claim, say what it claimed, then use but and exact numbers from the record.",
        "Para corregir una afirmación, di lo que afirmó y luego usa but y números exactos del registro.",
      ),
      frame: "Mr. Boyd said ___, but the sensor log shows ___ at ___ and ___ at ___.",
      model:
        "Mr. Boyd said the greenhouse never went above 28 degrees, but the sensor log shows 30 degrees at 1:00 p.m. and 31 degrees at 2:00 p.m.",
      keep: "My correction for the report",
    },
  ],
};

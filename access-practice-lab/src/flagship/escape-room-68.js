// Language Escape Room, grades 6-8: "After Hours at the Harbor Museum". Content only (schema: engine.js).
// Every lock is an interpret step (choose) followed by an explain step (write) with the same `lock` number.
import { GREENHOUSE_68 } from "./escape-room-greenhouse.js";

const C = (en, es) => [en, es];

export const BAND_68 = {
  premise:
    "The Harbor Museum closed at five, and your team is still inside. The curator, Ms. Okafor, left notes, maps and schedules behind. Every door has a lock, and every lock opens only when you read the evidence and explain your thinking. After the museum, one more job waits on the roof.",
  premiseEs:
    "El Museo del Puerto cerró a las cinco y tu equipo sigue adentro. La curadora, la Sra. Okafor, dejó notas, mapas y horarios. Cada puerta tiene un candado, y cada candado se abre solo cuando lees la evidencia y explicas lo que piensas. Después del museo, te espera un trabajo más en el techo.",
  chapters: [
    {
      id: "er68-archive",
      title: "The Archive Office",
      art: ["bg-museum", "char-detective"],
      intro:
        "The archive door has a keypad with three digits. A note is taped above it, and a schedule is pinned to the wall. An old poster hangs beside the schedule.",
      introEs:
        "La puerta del archivo tiene un teclado de tres dígitos. Hay una nota pegada encima y un horario en la pared. Al lado del horario hay un cartel viejo.",
      outro:
        "The last lock clicks. The archive door swings open, and a cold hallway leads toward the Robots exhibit. On the floor is a second note in Ms. Okafor's handwriting.",
      docs: [
        {
          id: "note",
          kind: "note",
          title: "Note taped to the door",
          from: "Ms. Okafor, curator",
          lines: [
            "The door code is the room number of the exhibit that opens LAST on Saturday.",
            "Use the updated schedule. Do not trust the poster: it was printed in March, before the changes.",
            "The key for the next room is kept with the keys for that room's floor.",
          ],
        },
        {
          id: "schedule",
          kind: "schedule",
          title: "Saturday exhibit schedule (updated Friday)",
          cols: ["Exhibit", "Room", "Opens", "Closes"],
          rows: [
            ["Ocean Life", "214", "9:00", "12:00"],
            ["Ancient Maps", "305", "10:30", "3:00"],
            ["Weather Lab", "260", "11:45", "2:00"],
            ["Robots Then and Now", "118", "1:15", "4:30"],
          ],
        },
        {
          id: "poster",
          kind: "record",
          title: "Old poster (printed in March)",
          rows: [
            ["Robots Then and Now", "Room 118, opens 9:30"],
            ["Weather Lab", "Room 260, opens 2:30"],
          ],
        },
        {
          id: "cabinet",
          kind: "diagram",
          title: "Key cabinet",
          art: "obj-key",
          parts: [
            { label: "A, top drawer", text: "rolled maps of the harbor" },
            { label: "B, middle drawer", text: "keys for rooms 100 to 199 (first floor)" },
            {
              label: "C, bottom drawer",
              text: "keys for rooms 200 to 399 (second and third floors)",
            },
            { label: "D, side door", text: "cleaning supplies" },
          ],
        },
        {
          id: "map",
          kind: "map",
          title: "First-floor map",
          places: [
            { name: "Archive", x: 1, y: 1 },
            { name: "Hall A", x: 4, y: 1 },
            { name: "Hall B", x: 1, y: 4 },
            { name: "Stairs", x: 7, y: 1 },
            { name: "Room 118", x: 7, y: 4 },
          ],
          paths: [
            [0, 1],
            [0, 2],
            [1, 3],
            [3, 4],
            [2, 4],
          ],
          notes: ["Hall B is closed tonight: the floor is wet.", "Room 118 is next to the Stairs."],
        },
      ],
      steps: [
        {
          id: "l1-read",
          lock: 1,
          type: "choose",
          docs: ["note", "schedule", "poster"],
          prompt: "Which three digits open the archive door?",
          help: "La nota dice que el código es el número de sala de la exhibición que abre AL FINAL el sábado. Compara las horas de apertura en el horario nuevo. No uses el cartel viejo.",
          options: [
            {
              id: "a",
              text: "214",
              why: "214 is Ocean Life, which opens at 9:00. The note asks for the exhibit that opens last, not first.",
            },
            {
              id: "b",
              text: "260",
              why: "260 is the Weather Lab. Its 2:30 time is on the old poster, and the note says not to trust the poster.",
            },
            { id: "c", text: "118", ok: true },
            {
              id: "d",
              text: "305",
              why: "305 is Ancient Maps, which opens at 10:30. Is that the latest opening time on the updated schedule?",
            },
          ],
          rule: C(
            "Use only the updated schedule, read the Opens column, and find the latest time of day.",
            "Usa solo el horario nuevo, lee la columna Opens y busca la hora más tarde del día.",
          ),
          explain:
            "Robots Then and Now opens at 1:15, the latest opening on the updated schedule, and it is in Room 118.",
        },
        {
          id: "l1-explain",
          lock: 1,
          type: "write",
          docs: ["note", "schedule", "poster"],
          prompt: "Explain how you know the code. Use the schedule and the note.",
          help: "Escribe una o dos oraciones. Di el código, di qué exhibición abre al final y a qué hora, y nombra la evidencia (el horario, la nota). Usa because para unir tu idea y tu razón.",
          check: {
            min: 14,
            ideas: [
              { any: ["118"], clue: C("Say the code you chose.", "Di el código que elegiste.") },
              {
                any: ["1:15", "last", "latest"],
                clue: C(
                  "Say when that exhibit opens compared with the others.",
                  "Di cuándo abre esa exhibición comparada con las otras.",
                ),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "A strong explanation gives the answer, the reason, and where the reason comes from.",
            "Una explicación fuerte da la respuesta, la razón y de dónde viene la razón.",
          ),
          frame: "The code is ___ because the ___ shows that ___ opens ___.",
          model:
            "The code is 118 because the updated schedule shows that Robots Then and Now opens last, at 1:15, and the note says not to trust the old poster.",
          keep: "How I cracked the door code",
        },
        {
          id: "l2-read",
          lock: 2,
          type: "choose",
          docs: ["note", "cabinet"],
          prompt: "You need the key to Room 118. Which part of the cabinet do you open?",
          help: "La nota dice que la llave de la próxima sala está con las llaves de ese piso. Busca en el diagrama qué cajón guarda las llaves de las salas 100 a 199.",
          options: [
            {
              id: "a",
              text: "A, the top drawer",
              why: "The top drawer holds rolled maps. You need a key.",
            },
            { id: "b", text: "B, the middle drawer", ok: true },
            {
              id: "c",
              text: "C, the bottom drawer",
              why: "The bottom drawer holds keys, but for rooms 200 to 399. Is 118 in that range?",
            },
            {
              id: "d",
              text: "D, the side door",
              why: "The side door holds cleaning supplies, not keys.",
            },
          ],
          rule: C(
            "Match the room number to a range: 118 is between which two numbers?",
            "Busca el rango del número de la sala: ¿entre qué dos números está 118?",
          ),
          explain:
            "Room 118 is between 100 and 199, and the middle drawer holds the first-floor keys for rooms 100 to 199.",
        },
        {
          id: "l2-explain",
          lock: 2,
          type: "write",
          docs: ["note", "cabinet"],
          prompt: "Explain why that drawer holds the key you need.",
          help: "Di qué cajón abres y por qué: el número de la sala está dentro del rango de llaves de ese cajón. Nombra el diagrama o la nota como evidencia.",
          check: {
            min: 12,
            ideas: [
              {
                any: ["middle", "drawer b", "b drawer", "b"],
                clue: C("Name the drawer you open.", "Nombra el cajón que abres."),
              },
              {
                any: ["100", "199", "first floor", "range", "between"],
                clue: C(
                  "Say which rooms that drawer has keys for.",
                  "Di para qué salas tiene llaves ese cajón.",
                ),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "Connect the number to the category it fits: 118 belongs to a group, and the diagram names the group.",
            "Une el número con la categoría a la que pertenece: 118 está en un grupo, y el diagrama nombra el grupo.",
          ),
          frame:
            "I open the ___ drawer because the diagram shows it holds keys for ___, and 118 is ___.",
          model:
            "I open the middle drawer because the diagram shows it holds keys for rooms 100 to 199, and 118 is between 100 and 199.",
          keep: "Which key, and why",
        },
        {
          id: "l3-read",
          lock: 3,
          type: "choose",
          docs: ["map"],
          prompt: "Which route takes you from the Archive to Room 118 tonight?",
          help: "Mira el mapa y lee las notas debajo. Un pasillo está cerrado esta noche. Busca un camino que no lo use.",
          options: [
            {
              id: "a",
              text: "Archive → Hall B → Room 118",
              why: "That route is short, but read the notes under the map: what is wrong with Hall B tonight?",
            },
            { id: "b", text: "Archive → Hall A → Stairs → Room 118", ok: true },
            {
              id: "c",
              text: "Archive → Stairs → Room 118",
              why: "Look at the lines on the map: is the Archive connected straight to the Stairs?",
            },
          ],
          rule: C(
            "A route must follow the lines on the map, and it cannot use a place the notes close.",
            "Una ruta debe seguir las líneas del mapa y no puede usar un lugar que las notas cierran.",
          ),
          explain:
            "Hall B is closed because of the wet floor, so you go through Hall A, then the Stairs, and Room 118 is right next to the Stairs.",
        },
        {
          id: "l3-explain",
          lock: 3,
          type: "write",
          docs: ["map"],
          prompt: "Write the route in order for a teammate, and say why you skip the other way.",
          help: "Escribe la ruta en orden con palabras como first, then, after that. Luego explica por qué no usas el pasillo B (las notas del mapa).",
          check: {
            min: 16,
            ideas: [
              {
                any: ["hall a"],
                clue: C(
                  "Name the hallway you walk through.",
                  "Nombra el pasillo por el que caminas.",
                ),
              },
              {
                any: ["stairs"],
                clue: C(
                  "Name the place you reach before Room 118.",
                  "Nombra el lugar al que llegas antes de la sala 118.",
                ),
              },
              {
                any: ["hall b", "wet", "closed"],
                clue: C("Say why you skip the other way.", "Di por qué no usas el otro camino."),
              },
            ],
            connector: ["sequence"],
          },
          rule: C(
            "Directions use order words (first, then, after that), and a reason uses because or since.",
            "Las instrucciones usan palabras de orden (first, then, after that), y una razón usa because o since.",
          ),
          frame: "First, walk through ___. Then, ___. We skip ___ because ___.",
          model:
            "First, walk from the Archive through Hall A. Then, go to the Stairs, and Room 118 is right next to them. We skip Hall B because the map says it is closed with a wet floor.",
          keep: "The route to Room 118",
        },
        {
          id: "l4-read",
          lock: 4,
          type: "choose",
          docs: ["note", "schedule", "poster"],
          prompt: "The final lock asks: which piece of evidence could have fooled you tonight?",
          help: "Piensa en las tres fuentes: la nota, el horario nuevo y el cartel viejo. ¿Cuál tenía información vieja que no se debe usar?",
          options: [
            {
              id: "a",
              text: "The updated schedule",
              why: "The note tells you to use the updated schedule. It is the one to trust.",
            },
            { id: "b", text: "The old poster", ok: true },
            {
              id: "c",
              text: "The key cabinet diagram",
              why: "The diagram matched the note about floors. Which source had out-of-date times?",
            },
          ],
          rule: C(
            "Check the date of a source: older information can be wrong after a change.",
            "Revisa la fecha de una fuente: la información vieja puede estar mal después de un cambio.",
          ),
          explain:
            "The poster was printed in March, before the changes, so its times for Robots and the Weather Lab were wrong.",
        },
        {
          id: "l4-explain",
          lock: 4,
          type: "write",
          docs: ["note", "schedule", "poster"],
          prompt: "Warn the next team: which source should they not trust, and why?",
          help: "Escribe una advertencia para el próximo equipo. Di qué fuente no deben usar y por qué (la fecha, los cambios). Puedes usar however o but para comparar las dos fuentes.",
          check: {
            min: 14,
            ideas: [
              {
                any: ["poster"],
                clue: C(
                  "Name the source they should not trust.",
                  "Nombra la fuente en la que no deben confiar.",
                ),
              },
              {
                any: ["march", "old", "before the changes", "out of date", "outdated", "printed"],
                clue: C("Say what is wrong with that source.", "Di qué tiene de malo esa fuente."),
              },
            ],
            connector: ["cause", "contrast"],
          },
          rule: C(
            "A warning names the problem and the reason, and can contrast the bad source with the good one.",
            "Una advertencia nombra el problema y la razón, y puede comparar la fuente mala con la buena.",
          ),
          frame: "Do not trust the ___ because ___. Use the ___ instead.",
          model:
            "Do not trust the old poster because it was printed in March, before the changes. Use the updated schedule instead, since it shows the real Saturday times.",
          keep: "A warning for the next team",
        },
      ],
    },
    {
      id: "er68-robots",
      title: "The Robots Exhibit",
      art: ["bg-lab", "char-robot"],
      intro:
        "Room 118 is dark except for one glass case. Inside, an old robot arm holds something small and shiny in its closed hand. A wiring panel, a battery shelf and a visitor chart hang on the wall, and Ms. Okafor's second note is in your hand.",
      introEs:
        "La sala 118 está oscura, menos una vitrina de vidrio. Adentro, un brazo robótico viejo tiene algo pequeño y brillante en la mano cerrada. En la pared hay un panel de cables, un estante de baterías y una gráfica de visitantes, y tienes en la mano la segunda nota de la Sra. Okafor.",
      outro:
        "The robot arm whirs, lifts, and opens its hand. A plastic key card drops into your palm: HARBOR CONTROL ROOM, TOP FLOOR. Somewhere above you, a radio crackles. Someone else is still in the building.",
      docs: [
        {
          id: "note",
          kind: "note",
          title: "Second note",
          from: "Ms. Okafor, curator",
          lines: [
            "The robot arm holds the key card for the Control Room. Power the arm, and it will open its hand.",
            "Power must go from the battery, through the switch, to the arm motor. A wire that skips the switch is not safe.",
            "Use the battery with the most charge, unless the repair log says it is damaged.",
            "The glass case code is the day when visits jumped the most from the day before.",
          ],
        },
        {
          id: "wiring",
          kind: "diagram",
          title: "Wiring panel behind the case",
          art: "sci-battery",
          parts: [
            {
              label: "Red wire",
              text: "battery straight to the arm motor; it does not pass through the switch",
            },
            { label: "Blue wire", text: "battery to the switch, then the switch to the arm motor" },
            {
              label: "Green wire",
              text: "battery to the switch, then the switch to the case light",
            },
            {
              label: "Yellow wire",
              text: "battery to the switch, then to the arm motor; the tag says CUT IN TWO PLACES",
            },
          ],
        },
        {
          id: "batteries",
          kind: "chart",
          title: "Battery charge on the shelf",
          unit: "% charged",
          bars: [
            { label: "Battery A", value: 35 },
            { label: "Battery B", value: 80 },
            { label: "Battery C", value: 95 },
            { label: "Battery D", value: 60 },
          ],
          source: "Charging station readout, 4:45 PM",
        },
        {
          id: "repairs",
          kind: "record",
          title: "Repair log",
          rows: [
            ["Nov. 2", "Battery A: charged and tested, works"],
            ["Nov. 9", "Battery C: leaking, do not use until repaired"],
            ["Nov. 12", "Battery D: new, tested, works"],
          ],
        },
        {
          id: "visits",
          kind: "chart",
          title: "Robots exhibit visitors last week",
          unit: "visitors",
          bars: [
            { label: "Monday", value: 40 },
            { label: "Tuesday", value: 55 },
            { label: "Wednesday", value: 90 },
            { label: "Thursday", value: 100 },
            { label: "Friday", value: 70 },
          ],
          source: "Front desk visitor counter",
        },
      ],
      steps: [
        {
          id: "l1-read",
          lock: 1,
          type: "choose",
          docs: ["note", "wiring"],
          prompt: "Which wire powers the robot arm safely?",
          help: "Lee la segunda línea de la nota: la energía debe ir de la batería, por el interruptor, hasta el motor del brazo. Luego revisa cada cable en el diagrama: ¿a dónde llega y está dañado?",
          options: [
            {
              id: "a",
              text: "The red wire",
              why: "The red wire reaches the motor, but read the note: what must the power pass through on the way?",
            },
            { id: "b", text: "The blue wire", ok: true },
            {
              id: "c",
              text: "The green wire",
              why: "The green wire goes through the switch, but where does it end? The arm needs the power, not the light.",
            },
            {
              id: "d",
              text: "The yellow wire",
              why: "Read the tag on the yellow wire. Can power travel through a wire in that condition?",
            },
          ],
          rule: C(
            "Follow each path from start to end, and check it against every condition in the note.",
            "Sigue cada camino de principio a fin y compáralo con cada condición de la nota.",
          ),
          explain:
            "The blue wire is the only path that goes from the battery, through the switch, to the arm motor without damage.",
        },
        {
          id: "l1-explain",
          lock: 1,
          type: "write",
          docs: ["note", "wiring"],
          prompt: "Explain why that wire is the safe one. Use the note and the diagram.",
          help: "Di qué cable eliges y describe su camino: de dónde sale, por dónde pasa y a dónde llega. Nombra la evidencia (el diagrama, la nota) y usa because para dar la razón.",
          check: {
            min: 16,
            ideas: [
              {
                any: ["blue"],
                clue: C("Name the wire you chose.", "Nombra el cable que elegiste."),
              },
              {
                any: ["switch"],
                clue: C(
                  "Say what the wire passes through on the way.",
                  "Di por dónde pasa el cable en el camino.",
                ),
              },
              {
                any: ["motor", "arm"],
                clue: C("Say where the wire ends.", "Di a dónde llega el cable."),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "A strong explanation traces the path step by step and connects it to the rule in the source.",
            "Una explicación fuerte sigue el camino paso a paso y lo une con la regla de la fuente.",
          ),
          frame: "We use the ___ wire because the diagram shows ___, and the note says ___.",
          model:
            "We use the blue wire because the diagram shows it goes from the battery through the switch to the arm motor, and the note says a wire that skips the switch is not safe.",
          keep: "The safe wire",
        },
        {
          id: "l2-read",
          lock: 2,
          type: "choose",
          docs: ["note", "batteries", "repairs"],
          prompt: "Which battery do you put in the robot arm?",
          help: "La nota dice: usa la batería con más carga, a menos que el registro de reparaciones diga que está dañada. Mira la gráfica y luego revisa el registro.",
          options: [
            {
              id: "a",
              text: "Battery A",
              why: "Battery A works, but compare its charge with the others on the chart.",
            },
            { id: "b", text: "Battery B", ok: true },
            {
              id: "c",
              text: "Battery C",
              why: "This one has the most charge on the chart. Now read the repair log: is it safe to use?",
            },
            {
              id: "d",
              text: "Battery D",
              why: "Battery D is new, but the note asks for the most charge. Is 60 the highest safe number?",
            },
          ],
          rule: C(
            "First remove the options a source rules out, then compare the ones that are left.",
            "Primero quita las opciones que una fuente descarta y luego compara las que quedan.",
          ),
          explain:
            "Battery C has more charge (95%), but the repair log says it is leaking. Of the safe batteries, Battery B has the most charge, 80%.",
        },
        {
          id: "l2-explain",
          lock: 2,
          type: "write",
          docs: ["note", "batteries", "repairs"],
          prompt: "Explain your choice. Say why you did not use the battery with the most charge.",
          help: "Primero di qué batería tiene más carga y por qué no la usas (mira el registro). Luego di cuál usas y cuánta carga tiene. Usa but para mostrar la diferencia.",
          check: {
            min: 18,
            ideas: [
              {
                any: ["battery b", "80"],
                clue: C(
                  "Name the battery you used and its charge.",
                  "Nombra la batería que usaste y su carga.",
                ),
              },
              {
                any: ["leak*", "repair*", "damaged", "broken", "unsafe", "not safe"],
                clue: C(
                  "Say what is wrong with the battery that has the most charge.",
                  "Di qué problema tiene la batería con más carga.",
                ),
              },
            ],
            connector: ["contrast"],
            evidence: true,
          },
          rule: C(
            "When the obvious answer is wrong, say what makes it look right, then what rules it out.",
            "Cuando la respuesta obvia está mal, di por qué parece correcta y luego qué la descarta.",
          ),
          frame: "Battery ___ has the most charge, but ___. So we used Battery ___ because ___.",
          model:
            "Battery C has the most charge, but the repair log says it is leaking. So we used Battery B because the chart shows it has 80 percent, the most of the safe batteries.",
          keep: "Choosing a safe battery",
        },
        {
          id: "l3-read",
          lock: 3,
          type: "choose",
          docs: ["note", "visits"],
          prompt: "The glass case has a button for each weekday. Which day opens it?",
          help: "La nota no pide el día con más visitantes. Pide el día en que las visitas subieron MÁS comparado con el día anterior. Resta cada barra menos la barra de antes.",
          options: [
            {
              id: "a",
              text: "Tuesday",
              why: "Tuesday went up from 40 to 55. Is a jump of 15 the biggest one?",
            },
            { id: "b", text: "Wednesday", ok: true },
            {
              id: "c",
              text: "Thursday",
              why: "Thursday has the tallest bar, but the note asks about the biggest jump from the day before. How much did Thursday go up?",
            },
            {
              id: "d",
              text: "Friday",
              why: "On Friday the number went down, not up.",
            },
          ],
          rule: C(
            "A change is the difference between two values: subtract the earlier value from the later one.",
            "Un cambio es la diferencia entre dos valores: resta el valor anterior del valor siguiente.",
          ),
          explain:
            "Visits went from 55 on Tuesday to 90 on Wednesday, a jump of 35. Thursday has the most visitors, but it only went up by 10.",
        },
        {
          id: "l3-explain",
          lock: 3,
          type: "write",
          docs: ["note", "visits"],
          prompt:
            "Explain how you found the day. Show the math, and say why the tallest bar is not the answer.",
          help: "Escribe dos oraciones. En la primera, di el día y muestra la resta (de cuánto a cuánto subió). En la segunda, explica por qué el día con más visitantes no es la respuesta. Usa but.",
          check: {
            min: 20,
            ideas: [
              {
                any: ["wednesday"],
                clue: C("Name the day you chose.", "Nombra el día que elegiste."),
              },
              {
                any: ["35", "thirty five"],
                clue: C(
                  "Show the math: how much did visits go up that day?",
                  "Muestra la cuenta: ¿cuánto subieron las visitas ese día?",
                ),
              },
              {
                any: ["thursday", "tallest", "highest", "most visitors"],
                clue: C(
                  "Say why the day with the most visitors is not the answer.",
                  "Di por qué el día con más visitantes no es la respuesta.",
                ),
              },
            ],
            connector: ["contrast"],
            evidence: true,
          },
          rule: C(
            "Data explanations name the numbers you compared and separate the biggest value from the biggest change.",
            "Las explicaciones con datos nombran los números que comparaste y separan el valor más grande del cambio más grande.",
          ),
          frame:
            "The code is ___ because the chart shows visits went from ___ to ___, a jump of ___. ___ has the most visitors, but ___.",
          model:
            "The code is Wednesday because the chart shows visits went from 55 to 90, a jump of 35. Thursday has the most visitors, but it only went up by 10.",
          keep: "Biggest value or biggest change?",
        },
      ],
    },
    {
      id: "er68-control",
      title: "The Harbor Control Room",
      art: ["bg-night", "char-detective"],
      intro:
        "The key card opens the Harbor Control Room on the top floor. Through the wide window you see the dark harbor, two piers and the boathouse. A tide schedule, a harbor map and two messages wait on the desk, and the messages do not agree.",
      introEs:
        "La tarjeta abre la Sala de Control del Puerto en el último piso. Por la ventana ves el puerto oscuro, dos muelles y la casa de botes. En el escritorio hay un horario de mareas, un mapa del puerto y dos mensajes, y los mensajes no dicen lo mismo.",
      outro:
        'At 8:00 the dock gate slides open. On Pier 1, a flashlight waves: it is Ms. Okafor. "The whole night was a test for my new museum guides," she says. "You read every source and explained every lock. Tomorrow, you lead the tours."',
      docs: [
        {
          id: "note",
          kind: "note",
          title: "Note on the desk (4:00 PM)",
          from: "Ms. Okafor, curator",
          lines: [
            "When you get out, meet me at Pier 2.",
            "After closing, the dock gate is the only way out of the museum.",
          ],
        },
        {
          id: "radio",
          kind: "witness",
          title: "Radio message (7:30 PM)",
          who: "Mr. Delgado",
          role: "night guard",
          said: "Change of plan: Pier 2 is closed for repairs tonight, so Ms. Okafor will wait at Pier 1. The dock gate opens only from inside the Boathouse, and only when the tide is above 4 feet.",
        },
        {
          id: "tides",
          kind: "schedule",
          title: "Tide schedule for tonight",
          cols: ["Time", "Tide height"],
          rows: [
            ["6:00 PM", "2.1 feet"],
            ["7:00 PM", "3.8 feet"],
            ["8:00 PM", "5.2 feet"],
            ["9:00 PM", "4.6 feet"],
            ["10:00 PM", "3.0 feet"],
          ],
        },
        {
          id: "map",
          kind: "map",
          title: "Harbor map",
          places: [
            { name: "Control Room", x: 1, y: 1 },
            { name: "West Stairs", x: 1, y: 4 },
            { name: "Pier 2", x: 4, y: 1 },
            { name: "Boathouse", x: 4, y: 4 },
            { name: "Pier 1", x: 7, y: 4 },
            { name: "Lighthouse", x: 7, y: 1 },
          ],
          paths: [
            [0, 1],
            [0, 2],
            [1, 3],
            [2, 3],
            [3, 4],
            [2, 5],
          ],
          notes: [
            "The dock gate is inside the Boathouse.",
            "There is no walkway between the Lighthouse and Pier 1.",
          ],
        },
      ],
      steps: [
        {
          id: "l1-read",
          lock: 1,
          type: "choose",
          docs: ["note", "radio"],
          prompt: "The two messages disagree. Where will Ms. Okafor meet you?",
          help: "Compara la hora de cada mensaje: la nota es de las 4:00 y el mensaje de radio es de las 7:30. ¿Cuál es más nuevo? ¿Qué cambió?",
          options: [
            { id: "a", text: "At Pier 1", ok: true },
            {
              id: "b",
              text: "At Pier 2",
              why: "That was the plan at 4:00 PM. Check the time of the other message: did anything change after that?",
            },
            {
              id: "c",
              text: "At the Lighthouse",
              why: "Neither message names the Lighthouse as a meeting place.",
            },
            {
              id: "d",
              text: "At the Boathouse",
              why: "The Boathouse is where the gate opens. Is it where she said she will wait?",
            },
          ],
          rule: C(
            "When two sources disagree, compare their times: the newer source can report a change.",
            "Cuando dos fuentes no coinciden, compara sus horas: la fuente más nueva puede informar un cambio.",
          ),
          explain:
            "The radio message at 7:30 PM is newer than the 4:00 PM note, and it says Pier 2 is closed, so Ms. Okafor will wait at Pier 1.",
        },
        {
          id: "l1-explain",
          lock: 1,
          type: "write",
          docs: ["note", "radio"],
          prompt: "Explain which message you follow and why.",
          help: "Di qué decía la nota, luego usa but para decir qué dice el mensaje de radio y por qué es más confiable (la hora, el cambio). Termina con el lugar de encuentro.",
          check: {
            min: 22,
            ideas: [
              {
                any: ["pier 1", "pier one"],
                clue: C(
                  "Say where you will meet Ms. Okafor.",
                  "Di dónde vas a encontrarte con la Sra. Okafor.",
                ),
              },
              {
                any: ["7:30", "newer", "later", "more recent", "latest", "changed", "change"],
                clue: C(
                  "Say why the message you follow is the one to trust.",
                  "Di por qué el mensaje que sigues es el confiable.",
                ),
              },
            ],
            connector: ["contrast"],
            evidence: true,
          },
          rule: C(
            "To settle a conflict, name both sources, say how they differ, and give the reason one wins.",
            "Para resolver un conflicto, nombra las dos fuentes, di en qué se diferencian y da la razón por la que una gana.",
          ),
          frame:
            "The note says ___, but the radio message is ___ and says ___. So we will meet at ___.",
          model:
            "The note says to meet at Pier 2, but the radio message from 7:30 PM is newer and says Pier 2 is closed for repairs. So we will meet Ms. Okafor at Pier 1.",
          keep: "Which message to trust",
        },
        {
          id: "l2-read",
          lock: 2,
          type: "choose",
          docs: ["radio", "tides"],
          prompt: "What is the earliest time the dock gate can open tonight?",
          help: "El guardia dice que la puerta abre solo cuando la marea está a más de 4 pies. Busca en el horario la primera hora con una altura mayor que 4.",
          options: [
            {
              id: "a",
              text: "6:00 PM",
              why: "At 6:00 the tide is only 2.1 feet.",
            },
            {
              id: "b",
              text: "7:00 PM",
              why: "At 7:00 the tide is 3.8 feet. Is that above the 4 feet the guard said?",
            },
            { id: "c", text: "8:00 PM", ok: true },
            {
              id: "d",
              text: "9:00 PM",
              why: "The tide is high enough at 9:00, but is it the first time it is high enough?",
            },
          ],
          rule: C(
            'Read a condition exactly: "above 4" means more than 4, so check each value against it in time order.',
            'Lee la condición con exactitud: "above 4" significa más de 4, así que revisa cada valor en orden de hora.',
          ),
          explain:
            "The gate opens only when the tide is above 4 feet. At 7:00 it is 3.8 feet, still too low; at 8:00 it is 5.2 feet, the first time above 4.",
        },
        {
          id: "l2-explain",
          lock: 2,
          type: "write",
          docs: ["radio", "tides"],
          prompt: "Explain when the gate can open. Use an if ... then sentence.",
          help: "Escribe la condición con if (si la marea está a más de 4 pies...). Luego usa el horario: di qué pasa a las 7:00 y por qué la puerta abre a la hora que elegiste.",
          check: {
            min: 22,
            ideas: [
              {
                any: ["8:00", "8 pm", "8pm", "eight"],
                clue: C("Say the time the gate opens.", "Di la hora en que abre la puerta."),
              },
              {
                any: ["4 feet", "4 ft", "four feet", "above 4", "above four", "5.2", "3.8"],
                clue: C(
                  "Say the tide height the gate needs, or the heights you compared.",
                  "Di la altura de marea que necesita la puerta o las alturas que comparaste.",
                ),
              },
            ],
            connector: ["condition"],
            evidence: true,
          },
          rule: C(
            "A condition sentence says what must be true (if ...) and what happens when it is (then ...).",
            "Una oración de condición dice qué debe ser cierto (if ...) y qué pasa cuando lo es (then ...).",
          ),
          frame:
            "If the tide is ___, then the gate ___. The schedule shows ___ at 7:00, so the gate can open at ___.",
          model:
            "If the tide is above 4 feet, then the gate can open. The schedule shows only 3.8 feet at 7:00, so the gate can open at 8:00, when the tide is 5.2 feet.",
          keep: "When the gate opens",
        },
        {
          id: "l3-read",
          lock: 3,
          type: "choose",
          docs: ["radio", "map"],
          prompt: "Which route takes you from the Control Room to Pier 1 tonight?",
          help: "Sigue las líneas del mapa. Recuerda dos cosas del mensaje de radio: un muelle está cerrado y la puerta se abre desde adentro de la casa de botes.",
          options: [
            {
              id: "a",
              text: "Control Room → Pier 2 → Boathouse → Pier 1",
              why: "Look back at the radio message: can you walk across Pier 2 tonight?",
            },
            { id: "b", text: "Control Room → West Stairs → Boathouse → Pier 1", ok: true },
            {
              id: "c",
              text: "Control Room → Pier 2 → Lighthouse → Pier 1",
              why: "Read the notes under the map: can you walk from the Lighthouse to Pier 1?",
            },
            {
              id: "d",
              text: "Control Room → West Stairs → Pier 1",
              why: "Follow the lines on the map: what is between the West Stairs and Pier 1? And where is the gate?",
            },
          ],
          rule: C(
            "A route must follow the map's lines, avoid closed places, and pass every place the plan needs.",
            "Una ruta debe seguir las líneas del mapa, evitar lugares cerrados y pasar por cada lugar que el plan necesita.",
          ),
          explain:
            "Pier 2 is closed, so you take the West Stairs down to the Boathouse, open the dock gate there, and walk to Pier 1.",
        },
        {
          id: "l3-explain",
          lock: 3,
          type: "write",
          docs: ["radio", "map"],
          prompt: "Give your team the directions in order, and say why the route avoids one place.",
          help: "Escribe la ruta en orden con first, then, finally. Luego explica por qué no pasas por el muelle 2 (el mensaje de radio).",
          check: {
            min: 24,
            ideas: [
              {
                any: ["west stairs", "stairs"],
                clue: C(
                  "Name where you go first from the Control Room.",
                  "Nombra a dónde vas primero desde la Sala de Control.",
                ),
              },
              {
                any: ["boathouse"],
                clue: C(
                  "Name the place where the gate opens.",
                  "Nombra el lugar donde se abre la puerta.",
                ),
              },
              {
                any: ["pier 2", "pier two", "closed", "repair*"],
                clue: C("Say which place you avoid and why.", "Di qué lugar evitas y por qué."),
              },
            ],
            connector: ["sequence"],
          },
          rule: C(
            "Directions use order words (first, then, finally), and a reason uses because or since.",
            "Las instrucciones usan palabras de orden (first, then, finally), y una razón usa because o since.",
          ),
          frame: "First, ___. Then, ___. Finally, ___. We avoid ___ because ___.",
          model:
            "First, take the West Stairs down from the Control Room. Then, go into the Boathouse and open the dock gate. Finally, walk to Pier 1. We avoid Pier 2 because it is closed for repairs.",
          keep: "The route to Pier 1",
        },
        {
          id: "l4-read",
          lock: 4,
          type: "choose",
          docs: ["note", "radio", "tides", "map"],
          prompt: "The last lock asks for the whole plan. Which plan uses all the evidence?",
          help: "Revisa las tres partes del plan: el lugar (el mensaje más nuevo), la hora (el horario de mareas) y la ruta (el mapa). Una sola opción tiene las tres bien.",
          options: [
            {
              id: "a",
              text: "Pier 2 at 8:00 PM, by the West Stairs and the Boathouse",
              why: "The time and the route work. Which message is newer about the meeting place?",
            },
            {
              id: "b",
              text: "Pier 1 at 7:00 PM, by the West Stairs and the Boathouse",
              why: "Check the tide schedule at 7:00: can the gate open yet?",
            },
            { id: "c", text: "Pier 1 at 8:00 PM, by the West Stairs and the Boathouse", ok: true },
            {
              id: "d",
              text: "Pier 1 at 8:00 PM, across Pier 2",
              why: "The place and time fit, but the route crosses a place the radio message closes.",
            },
          ],
          rule: C(
            "A plan built from several sources is right only when every part matches its own source.",
            "Un plan hecho con varias fuentes es correcto solo cuando cada parte coincide con su fuente.",
          ),
          explain:
            "Only this plan uses the newer radio message (Pier 1), the tide schedule (8:00 PM, the first time above 4 feet) and the map (around closed Pier 2, through the Boathouse gate).",
        },
        {
          id: "l4-explain",
          lock: 4,
          type: "write",
          docs: ["note", "radio", "tides", "map"],
          prompt:
            "Write the escape plan for Ms. Okafor's notebook: where, when and how. Explain which evidence you trusted and why.",
          help: "Escribe dos o tres oraciones. Di el lugar, la hora y la ruta. Explica una condición con if (la marea) y un contraste con but (la nota vieja y el mensaje nuevo). Nombra tus fuentes.",
          check: {
            min: 30,
            max: 80,
            ideas: [
              {
                any: ["pier 1", "pier one"],
                clue: C("Say where you will meet.", "Di dónde se van a encontrar."),
              },
              {
                any: ["8:00", "8 pm", "8pm", "eight"],
                clue: C("Say when the gate opens.", "Di cuándo abre la puerta."),
              },
              {
                any: ["boathouse", "west stairs", "stairs"],
                clue: C("Say how you will get there.", "Di cómo van a llegar."),
              },
              {
                any: ["radio", "newer", "7:30", "later", "more recent", "changed"],
                clue: C(
                  "Say which message you trusted about the place, and why.",
                  "Di en qué mensaje confiaste sobre el lugar y por qué.",
                ),
              },
            ],
            connector: ["contrast", "condition"],
            evidence: true,
          },
          rule: C(
            "A complete plan answers where, when and how, and backs each part with the source it came from.",
            "Un plan completo responde dónde, cuándo y cómo, y apoya cada parte con la fuente de donde viene.",
          ),
          frame:
            "We will meet at ___ at ___. First we ___, because ___. The note said ___, but the radio message ___.",
          model:
            "We will meet Ms. Okafor at Pier 1 at 8:00 PM, when the tide is above 4 feet. We take the West Stairs to the Boathouse to open the gate. Her note said Pier 2, but the newer radio message says it is closed.",
          keep: "Our escape plan",
        },
      ],
    },
    GREENHOUSE_68,
  ],
};

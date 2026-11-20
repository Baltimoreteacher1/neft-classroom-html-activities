// Evidence Detective, case 4 in both bands: a museum evidence investigation (content only; schema: engine.js).
// 3-5: where did a shell from a museum case go? 6-8: what does the evidence say about when a museum object was made?
// Every record, label and witness in these cases is invented for practice, and the case files say so.
const C = (en, es) => [en, es];

const RELEVANT = { id: "relevant", label: C("Helps solve the case", "Ayuda a resolver el caso") };
const IRRELEVANT = { id: "irrelevant", label: C("Does not help", "No ayuda") };

export const MUSEUM_35 = {
  id: "ed35-museum",
  title: "Case 4: The Blue Shell in the Museum Case",
  art: ["bg-museum", "char-detective"],
  intro:
    'Detective Paz has one more file, and this one comes from the town museum. In the Shell Case, a blue spiral shell was there on Friday and gone on Saturday. "Remember," she says, "these records are made up for practice. Read them like a real detective: facts first."',
  introEs:
    "La detective Paz tiene un expediente más, y este viene del museo del pueblo. En la vitrina de las conchas, una concha azul en espiral estaba el viernes y ya no estaba el sábado. «Recuerda», dice, «estos registros están inventados para practicar. Léelos como un detective de verdad: primero los hechos».",
  outro:
    "Mr. Okoro carries the shell back on Monday morning and sets it in the case. The museum guard hangs a new card inside: “Out on loan: ask the front desk.” Detective Paz smiles at your report. “Four cases, four answers. You did not guess once.”",
  docs: [
    {
      id: "checklist",
      kind: "record",
      title: "Shell Case checklist (practice record)",
      rows: [
        ["Friday, 3:30 p.m.", "6 shells in the case. Case locked."],
        ["Saturday, 9:00 a.m.", "5 shells in the case. The blue spiral shell is gone."],
        ["Who has the key?", "Museum staff and approved borrowers"],
      ],
    },
    {
      id: "slip",
      kind: "note",
      title: "Slip found on the floor under the case",
      from: "Mr. Okoro, science teacher with a staff key",
      lines: [
        "Borrowed: one blue spiral shell.",
        "I am taking it to Room 12 for our ocean lesson.",
        "Friday, 3:45 p.m. I will bring it back on Monday.",
      ],
    },
    {
      id: "lopez",
      kind: "witness",
      title: "What Mr. Lopez said",
      who: "Mr. Lopez",
      role: "museum guard",
      said: "I locked the shell case at 3:30 on Friday. The case key is limited to museum staff and approved borrowers. At 3:45 I saw Mr. Okoro, a science teacher with a staff key, walk down the hall with a small box.",
    },
    {
      id: "cleaning",
      kind: "record",
      title: "Cleaning log (practice record)",
      rows: [
        ["Friday", "Dusted the outside of the shell case. Nothing was removed."],
        ["Shell cleaning", "Done by the museum staff in June"],
      ],
    },
    {
      id: "shop",
      kind: "record",
      title: "Gift shop price list (practice record)",
      rows: [
        ["Small shells", "$2"],
        ["Postcards", "$1"],
      ],
    },
    {
      id: "card",
      kind: "witness",
      title: "Visitor comment card",
      who: "A visitor",
      role: "age 9",
      said: "The blue shell was the prettiest thing in the whole museum! I felt so sad when I saw the empty spot.",
    },
  ],
  steps: [
    {
      id: "sort",
      type: "sort",
      docs: ["checklist", "slip", "lopez", "cleaning", "shop", "card"],
      prompt: "Sort the clues. Does each clue help find the blue shell? Then pick the reason.",
      help: "Lee cada pista. Pregúntate: ¿esta pista dice cuándo desapareció la concha, adónde fue o quién pudo llevársela? Si es un sentimiento o habla de otra cosa, no ayuda. Después elige la razón.",
      cats: [RELEVANT, IRRELEVANT],
      reasons: [
        { id: "when", text: "It tells when the shell went missing" },
        { id: "where", text: "It shows where the shell went" },
        { id: "who", text: "It shows who could take it" },
        { id: "feeling", text: "It is a feeling, not a fact" },
        { id: "other", text: "It is about something else" },
      ],
      items: [
        {
          id: "count",
          text: "The checklist says 6 shells at 3:30 on Friday and 5 on Saturday.",
          cat: "relevant",
          reason: "when",
          clue: C(
            "Compare the two numbers. What changed, and between which two times?",
            "Compara los dos números. ¿Qué cambió y entre qué dos horas?",
          ),
        },
        {
          id: "slip",
          text: "A slip says the blue shell went to Room 12 on Friday.",
          cat: "relevant",
          reason: "where",
          clue: C(
            "Does the slip name a place the shell went?",
            "¿La nota nombra un lugar adonde fue la concha?",
          ),
        },
        {
          id: "key",
          text: "The guard locked the case, and staff or approved borrowers have the key.",
          cat: "relevant",
          reason: "who",
          clue: C(
            "If staff or approved borrowers can open the case, who could have taken the shell?",
            "Si el personal o quienes tienen un préstamo aprobado pueden abrir la vitrina, ¿quién pudo llevarse la concha?",
          ),
        },
        {
          id: "prettiest",
          text: "A visitor says the blue shell was the prettiest.",
          cat: "irrelevant",
          reason: "feeling",
          clue: C(
            'Is "prettiest" a fact you can check, or what the visitor feels?',
            "¿«Prettiest» es un dato que puedes comprobar o lo que siente la visitante?",
          ),
        },
        {
          id: "price",
          text: "The gift shop sells small shells for $2.",
          cat: "irrelevant",
          reason: "other",
          clue: C(
            "Does a price tell you anything about the museum's blue shell?",
            "¿Un precio te dice algo sobre la concha azul del museo?",
          ),
        },
        {
          id: "sad",
          text: "A visitor felt sad about the empty spot.",
          cat: "irrelevant",
          reason: "feeling",
          clue: C(
            "Is this something that happened, or how the visitor feels?",
            "¿Esto es algo que pasó o es cómo se siente la visitante?",
          ),
        },
      ],
      rule: C(
        "A clue helps when it is a fact that shows when, where or who. Feelings and other topics do not help.",
        "Una pista ayuda cuando es un dato que muestra cuándo, dónde o quién. Los sentimientos y otros temas no ayudan.",
      ),
      explain:
        "The checklist shows when the shell went missing, the slip shows where it went, and the guard shows who had the key. Feelings and gift shop prices do not help.",
    },
    {
      id: "choose",
      type: "choose",
      docs: ["checklist", "slip", "lopez", "cleaning", "shop"],
      prompt: "Which idea do the clues support best?",
      help: "Prueba cada idea con las pistas que ayudan: la lista, la nota, el guardia y el registro de limpieza. La mejor idea es la que encaja con todas y no choca con ninguna.",
      options: [
        {
          id: "a",
          text: "A visitor put the blue shell in a pocket and took it home.",
          why: "Read what the guard said. Who can open the case after 3:30 on Friday?",
        },
        {
          id: "b",
          text: "Mr. Okoro, a science teacher with a staff key, borrowed the shell and took it to Room 12.",
          ok: true,
          why: "Yes! The slip names Room 12, and the guard saw a teacher with a small box.",
        },
        {
          id: "c",
          text: "The shell is in storage to be cleaned.",
          why: "Check the cleaning log. Did anyone remove a shell on Friday?",
        },
        {
          id: "d",
          text: "The gift shop is selling the blue shell.",
          why: "The price list only shows prices. Does it say anything about this shell?",
        },
      ],
      rule: C(
        "The best idea fits ALL the helpful clues, and no clue goes against it.",
        "La mejor idea encaja con TODAS las pistas que ayudan, y ninguna pista va en contra.",
      ),
      explain:
        "The slip says the shell went to Room 12, the guard saw a teacher with a small box at 3:45, and the cleaning log shows nothing was removed for cleaning.",
    },
    {
      id: "defend",
      type: "write",
      docs: ["checklist", "slip", "lopez"],
      prompt:
        "Write your report for Detective Paz. Say where the blue shell is and give two clues that show it.",
      help: "Escribe una o dos oraciones. Di dónde está la concha azul. Da dos pistas: por ejemplo, lo que dice la nota y lo que vio el guardia. Usa because para unir tu idea y tu razón.",
      check: {
        min: 14,
        ideas: [
          {
            any: ["room 12", "mr. okoro", "okoro", "teacher"],
            clue: C(
              "Say where the shell is, or who has it.",
              "Di dónde está la concha o quién la tiene.",
            ),
          },
          {
            any: ["slip", "borrowed", "guard", "checklist", "locked", "small box", "3:45"],
            clue: C(
              "Add a clue from the slip, the guard or the checklist.",
              "Agrega una pista de la nota, del guardia o de la lista.",
            ),
          },
        ],
        connector: ["cause"],
        evidence: true,
      },
      rule: C(
        "A detective says the answer, then the clues, then why the clues fit.",
        "Un detective dice la respuesta, luego las pistas y luego por qué encajan.",
      ),
      frame: "The blue shell is in ___ because the ___ says ___, and the ___ saw ___.",
      model:
        "The blue shell is in Room 12 because the slip says Mr. Okoro borrowed it, and the guard saw Mr. Okoro carry a small box at 3:45.",
      keep: "My claim and evidence",
    },
    {
      id: "answer",
      type: "write",
      docs: ["checklist", "slip", "lopez"],
      npc: {
        who: "Sam",
        art: "char-sam",
        line: "I still think a visitor took it. The case has a glass door, so anybody could open it!",
      },
      prompt: "Answer Sam kindly. Say what is true, then give a clue that shows he is wrong.",
      help: "Primero di algo que Sam tiene bien con It is true that... Luego usa but y da una pista: el guardia cerró con llave, solo el personal tiene la llave, o la nota dice Room 12.",
      check: {
        min: 14,
        ideas: [
          {
            any: ["locked", "key", "staff", "guard", "slip", "room 12", "borrowed"],
            clue: C(
              "Give Sam a clue: the lock, the key, the guard or the slip.",
              "Dale a Sam una pista: el candado, la llave, el guardia o la nota.",
            ),
          },
        ],
        connector: ["contrast", "concession"],
      },
      rule: C(
        "To answer the other side, say what could be true, then use but and a clue.",
        "Para responder al otro lado, di lo que podría ser verdad y luego usa but y una pista.",
      ),
      frame: "It is true that ___, but the ___ shows ___.",
      model:
        "It is true that the case has a glass door, but the guard locked it, Mr. Okoro had a staff key, and the slip says the shell went to Room 12.",
      keep: "My answer to the other side",
    },
  ],
};

export const MUSEUM_68 = {
  id: "ed68-museum",
  title: "Case 4: The Ferry Ticket Label",
  art: ["bg-museum", "char-detective"],
  intro:
    'The Ridgeview Local History Museum has a problem. A visitor says the label on its old ferry ticket is wrong, and the curator wants the Evidence Unit to decide. Principal Vega adds a note to the file: "Every record in this case is invented for practice. Treat it as if a real label depended on it."',
  introEs:
    "El Museo de Historia Local de Ridgeview tiene un problema. Una visitante dice que la etiqueta del viejo boleto de transbordador está mal, y el curador quiere que la Unidad de Evidencia decida. La directora Vega agrega una nota al expediente: «Todos los registros de este caso están inventados para practicar. Trátalo como si una etiqueta de verdad dependiera de ti».",
  outro:
    "The curator reprints the label that afternoon: “Ferry ticket, printed between 1949 and 1952.” Under it, a new line explains how the museum knows. Principal Vega adds a fourth report to the front-office frame. “Careful dates,” she says. “That is what a label is for.”",
  docs: [
    {
      id: "label",
      kind: "record",
      title: "Museum label in the display case (practice record)",
      rows: [
        ["Object", "Paper ferry ticket"],
        ["Label says", "Printed about 1945"],
        ["Given to the museum", "1983, by the Alvarez family"],
      ],
    },
    {
      id: "ticket",
      kind: "record",
      title: "What is printed on the ticket itself",
      rows: [
        ["Company", "Bayside Ferry Co."],
        ["Pier", "Pier 4"],
        ["Fare", "15 cents"],
        ["Date stamp", "Smudged and not readable"],
      ],
    },
    {
      id: "fares",
      kind: "chart",
      title: "Bayside Ferry fare by years",
      unit: "cents",
      bars: [
        { label: "1946 to 1948", value: 10 },
        { label: "1949 to 1952", value: 15 },
        { label: "1953 to 1960", value: 25 },
      ],
      source: "Bayside Ferry Co. fare book (invented for practice)",
    },
    {
      id: "mehta",
      kind: "witness",
      title: "What Dr. Mehta said",
      who: "Dr. Mehta",
      role: "local historian",
      said: "Pier 4 opened in 1947. Before that, Bayside boats used Pier 2, so a ticket that names Pier 4 cannot be older than 1947.",
    },
    {
      id: "attic",
      kind: "record",
      title: "Donation card (practice record)",
      rows: [
        ["Given by", "The Alvarez family, 1983"],
        ["Found", "In a coat pocket in a family attic"],
      ],
    },
    {
      id: "kim",
      kind: "witness",
      title: "Comment from a museum visitor",
      who: "Kim",
      role: "visitor who asked for the review",
      said: "I do not trust the label. The donation card says 1983, so the label should say 1983.",
    },
  ],
  steps: [
    {
      id: "sort",
      type: "sort",
      docs: ["ticket", "fares", "mehta", "attic", "kim"],
      prompt:
        "Sort the clues. Does each one help date when the ticket was printed? Then pick the reason.",
      help: "Pregúntate si cada pista ayuda a decir CUÁNDO se imprimió el boleto. Un dato del mismo boleto o de un registro de tarifas ayuda. Cuándo lo recibió el museo no dice cuándo se imprimió. Después elige la razón.",
      cats: [RELEVANT, IRRELEVANT],
      reasons: [
        { id: "date", text: "It helps date the printing" },
        { id: "later", text: "It tells about a later event, not the printing" },
        { id: "opinion", text: "It is an opinion or a guess" },
        { id: "other", text: "It does not help date the ticket" },
      ],
      items: [
        {
          id: "details",
          text: "The ticket names Pier 4 and a 15-cent fare.",
          cat: "relevant",
          reason: "date",
          clue: C(
            "Details printed on the ticket can be matched to records. Which records?",
            "Los datos impresos en el boleto se pueden comparar con registros. ¿Con cuáles?",
          ),
        },
        {
          id: "fare",
          text: "The fare book shows 15 cents was charged only from 1949 to 1952.",
          cat: "relevant",
          reason: "date",
          clue: C(
            "Which year range goes with the fare on the ticket?",
            "¿Qué rango de años va con la tarifa del boleto?",
          ),
        },
        {
          id: "pier",
          text: "The historian says Pier 4 opened in 1947.",
          cat: "relevant",
          reason: "date",
          clue: C(
            "Could a ticket naming a pier be printed before the pier opened?",
            "¿Se puede imprimir un boleto con el nombre de un muelle antes de que el muelle abra?",
          ),
        },
        {
          id: "gift",
          text: "The Alvarez family gave the ticket to the museum in 1983; that date does not narrow when it was printed.",
          cat: "irrelevant",
          reason: "later",
          clue: C(
            "Does the year the museum received a ticket tell you when the paper was printed?",
            "¿El año en que el museo recibió un boleto dice cuándo se imprimió el papel?",
          ),
        },
        {
          id: "yellow",
          text: "The ticket paper looks yellow to a visitor.",
          cat: "irrelevant",
          reason: "opinion",
          clue: C(
            "Can you check how old paper is by how yellow it looks, or is that a guess?",
            "¿Se puede saber qué tan viejo es un papel por lo amarillo que se ve, o es solo una suposición?",
          ),
        },
        {
          id: "attic",
          text: "The ticket was found in a coat pocket in an attic.",
          cat: "irrelevant",
          reason: "other",
          clue: C(
            "Does the place it was found say what year it was printed?",
            "¿El lugar donde se encontró dice en qué año se imprimió?",
          ),
        },
      ],
      rule: C(
        "A clue helps date an object when it is a checkable fact tied to the object's making. When the museum got it, or how it looks, does not date it.",
        "Una pista ayuda a fechar un objeto cuando es un dato comprobable ligado a cómo se hizo. Cuándo lo recibió el museo, o cómo se ve, no lo fecha.",
      ),
      explain:
        "The ticket's own details, the fare book and the pier's opening date can all be checked and tied to the printing. The 1983 gift does not narrow when it was printed; the yellow paper and the attic say nothing about when it was printed.",
    },
    {
      id: "choose",
      type: "choose",
      docs: ["label", "ticket", "fares", "mehta"],
      prompt: "A visitor says the label is wrong. Which revision does the evidence support best?",
      help: "Compara los datos del boleto con la gráfica de tarifas y con lo que dice la historiadora. Una buena revisión da un rango de años que encaje con todo y no dice más de lo que muestran los datos.",
      options: [
        {
          id: "a",
          text: "Keep the label: the ticket was printed about 1945.",
          why: "Look at what the historian said about Pier 4. Could a ticket naming it be printed that early?",
        },
        {
          id: "b",
          text: "Change it to 1983, the year the family gave the ticket to the museum.",
          why: "A gift date tells when the museum received the object. Does it tell you when the paper was printed?",
        },
        {
          id: "c",
          text: "Change it to between 1949 and 1952.",
          ok: true,
        },
        {
          id: "d",
          text: "Change it to after 1953, when fares went up.",
          why: "Check the fare on the ticket against the chart. In which years was that fare charged?",
        },
        {
          id: "e",
          text: "Change it to 1947 or 1948, right after Pier 4 opened.",
          why: "Pier 4 sets the earliest possible year, but not the latest. Compare the fare on the ticket with the chart as well.",
        },
      ],
      rule: C(
        "Combine every date limit: the revision must fit each fact, not just one.",
        "Combina todos los límites de fecha: la revisión debe encajar con cada dato, no solo con uno.",
      ),
      explain:
        "A 15-cent fare matches only 1949 to 1952 in the fare book, and Pier 4 opened in 1947, so a printing date between 1949 and 1952 fits every fact.",
    },
    {
      id: "strongest",
      type: "choose",
      docs: ["ticket", "fares", "mehta", "attic"],
      prompt: "Which single piece of evidence narrows the date the most?",
      help: "Piensa en qué evidencia da un rango de años más corto. Una fecha de apertura solo dice «después de». Una tarifa unida a un libro de tarifas puede decir «entre» dos años.",
      options: [
        {
          id: "a",
          text: "The 15-cent fare on the ticket, matched to the fare book",
          ok: true,
          why: "Yes. One fare in one book points to a short range of years.",
        },
        {
          id: "b",
          text: "The historian's date for the opening of Pier 4",
          why: "It tells you the earliest year, but it gives no latest year. Which source gives both ends?",
        },
        {
          id: "c",
          text: "The donation card",
          why: "It tells you when the museum received the ticket, which is long after the printing.",
        },
      ],
      rule: C(
        "The strongest evidence is exact, can be checked, and narrows the range from both ends.",
        "La evidencia más fuerte es exacta, se puede comprobar y reduce el rango por los dos lados.",
      ),
      explain:
        "The fare, matched to the fare book, limits the printing to 1949 through 1952. The pier date only sets a starting point.",
    },
    {
      id: "defend",
      type: "write",
      docs: ["ticket", "fares", "mehta"],
      prompt:
        "Write the Unit's report for the curator. Give the years the ticket was printed, use two pieces of evidence, and explain how they work together.",
      help: "Escribe dos o tres oraciones. Di los años de impresión. Usa la tarifa del boleto con el libro de tarifas, y agrega una segunda evidencia, como la apertura del muelle 4. Explica con because o so por qué juntas encajan.",
      check: {
        min: 26,
        ideas: [
          {
            any: ["1949", "1952"],
            clue: C(
              "Say the years that the evidence supports.",
              "Di los años que apoya la evidencia.",
            ),
          },
          {
            any: ["15 cent*", "15¢", "fare*"],
            clue: C("Use the fare printed on the ticket.", "Usa la tarifa impresa en el boleto."),
          },
          {
            any: ["pier 4", "1947", "fare book", "chart"],
            clue: C(
              "Add a second piece of evidence: the pier or the fare book.",
              "Agrega una segunda evidencia: el muelle o el libro de tarifas.",
            ),
          },
        ],
        connector: ["cause"],
        evidence: true,
      },
      rule: C(
        "A full argument gives the claim, the strongest evidence, and the reasoning that links the evidence to the claim.",
        "Un argumento completo da la afirmación, la evidencia más fuerte y el razonamiento que une la evidencia con la afirmación.",
      ),
      frame:
        "The ticket was printed between ___ and ___. The ticket shows ___, and the ___ says ___, so ___.",
      model:
        "The ticket was printed between 1949 and 1952. The ticket shows a 15-cent fare, and the fare book says Bayside charged 15 cents only in those years, so the printing date fits them. Pier 4 opened in 1947, which agrees, because a ticket naming it cannot be older.",
      keep: "My claim and evidence",
    },
    {
      id: "answer",
      type: "write",
      docs: ["label", "fares", "kim"],
      npc: {
        who: "Kim",
        art: "char-amara",
        line: "The donation card says 1983, so the label should say 1983. Why would the museum print a different year?",
      },
      prompt:
        "Respond to Kim respectfully. Grant what is true about 1983, then use the evidence to show why the label should not say 1983.",
      help: "Empieza aceptando lo que es verdad (It is true that...). Luego usa but o however. Explica qué dice una fecha de donación y qué NO dice, y agrega evidencia del boleto o del libro de tarifas.",
      check: {
        min: 24,
        ideas: [
          {
            any: ["printed", "printing", "made", "created"],
            clue: C(
              "Say what a donation date does not tell us: when the ticket was made.",
              "Di lo que una fecha de donación no dice: cuándo se hizo el boleto.",
            ),
          },
          {
            any: ["15", "fare*", "1949", "1952", "pier 4"],
            clue: C(
              "Add evidence from the ticket or the fare book.",
              "Agrega evidencia del boleto o del libro de tarifas.",
            ),
          },
        ],
        connector: ["contrast", "concession"],
      },
      rule: C(
        "A respectful rebuttal grants the fair point, then shows with evidence why the conclusion still stands.",
        "Una refutación respetuosa acepta el punto justo y luego muestra con evidencia por qué la conclusión sigue en pie.",
      ),
      frame: "It is true that ___, but a donation date tells ___, not ___. The ___ shows ___.",
      model:
        "It is true that the family donated the ticket in 1983, but a donation date tells when the museum received it, not when it was printed. The 15-cent fare matches 1949 to 1952 in the fare book.",
      keep: "My answer to the other side",
    },
  ],
};

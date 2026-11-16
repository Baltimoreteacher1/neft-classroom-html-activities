// Language Escape Room, grades 3-5: "The Green Sprouts Scavenger Hunt". Content only (schema: engine.js).
// Every lock is an interpret step (choose) followed by an explain step (write) with the same `lock` number.
const C = (en, es) => [en, es];

export const BAND_35 = {
  premise:
    "Your school club, the Green Sprouts, is on a scavenger hunt. Ms. Rivera, the club teacher, hid clues in the garden shed, the treehouse and the school library. Every door has a lock. Read the clues, tell how you know, and open the lock!",
  premiseEs:
    "Tu club de la escuela, los Green Sprouts, está en una búsqueda del tesoro. La maestra Rivera escondió pistas en el cobertizo del jardín, la casa del árbol y la biblioteca de la escuela. Cada puerta tiene un candado. ¡Lee las pistas, di cómo lo sabes y abre el candado!",
  chapters: [
    {
      id: "er35-shed",
      title: "The Garden Shed",
      art: ["bg-park", "char-maya"],
      intro:
        "The garden shed door clicks shut behind you. The lock has four color buttons. A note is on the door, and a watering chart hangs on the wall.",
      introEs:
        "La puerta del cobertizo se cierra detrás de ti. El candado tiene cuatro botones de colores. Hay una nota en la puerta y una tabla de riego en la pared.",
      outro:
        "The shed door opens! A paper arrow on the path points past the flower bed. High in the old trees, you can see a little treehouse.",
      docs: [
        {
          id: "note",
          kind: "note",
          title: "Note on the door",
          from: "Ms. Rivera",
          lines: [
            "Push the color of the flowers we water on Tuesday.",
            "The key to the next lock is with the tool we use to dig holes for seeds.",
            "Then walk to the treehouse. Stay away from the pond. It is very muddy today!",
          ],
        },
        {
          id: "chart",
          kind: "schedule",
          title: "Watering chart",
          cols: ["Day", "Plant", "Flower color"],
          rows: [
            ["Monday", "Roses", "red"],
            ["Tuesday", "Sunflowers", "yellow"],
            ["Wednesday", "Violets", "purple"],
            ["Thursday", "Daisies", "white"],
          ],
        },
        {
          id: "shelf",
          kind: "diagram",
          title: "Tool shelf",
          art: "obj-key",
          parts: [
            { label: "Top shelf", text: "rain boots" },
            { label: "Middle shelf", text: "a small shovel" },
            { label: "Bottom shelf", text: "a watering can" },
            { label: "Hook", text: "a sun hat" },
          ],
        },
        {
          id: "map",
          kind: "map",
          title: "Garden map",
          places: [
            { name: "Shed", x: 1, y: 1 },
            { name: "Pond", x: 4, y: 1 },
            { name: "Flower Bed", x: 1, y: 4 },
            { name: "Bench", x: 4, y: 4 },
            { name: "Treehouse", x: 7, y: 3 },
          ],
          paths: [
            [0, 1],
            [0, 2],
            [1, 4],
            [2, 3],
            [3, 4],
          ],
          notes: ["The pond is muddy today."],
        },
      ],
      steps: [
        {
          id: "l1-read",
          lock: 1,
          type: "choose",
          docs: ["note", "chart"],
          prompt: "Which color opens the lock?",
          help: "Lee la nota: ¿qué día dice? Busca ese día en la tabla de riego y mira el color de las flores.",
          options: [
            { id: "a", text: "red", why: "Red is for Monday. The note says a different day." },
            { id: "b", text: "yellow", ok: true },
            {
              id: "c",
              text: "purple",
              why: "Purple is for Wednesday. Find the day from the note.",
            },
            { id: "d", text: "white", why: "White is for Thursday. Look at the day in the note." },
          ],
          rule: C(
            "Find the day in the note, then find the same day in the chart.",
            "Busca el día en la nota y luego busca el mismo día en la tabla.",
          ),
          explain: "On Tuesday we water the sunflowers, and sunflowers are yellow.",
        },
        {
          id: "l1-explain",
          lock: 1,
          type: "write",
          docs: ["note", "chart"],
          prompt: "Tell how you know the color. Use the chart.",
          help: "Di el color. Luego di qué flor regamos ese día. Usa because.",
          check: {
            min: 8,
            ideas: [
              { any: ["yellow"], clue: C("Say the color.", "Di el color.") },
              {
                any: ["sunflower*", "tuesday"],
                clue: C("Say which flowers or which day.", "Di qué flores o qué día."),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "Give your answer, then give the reason from the chart.",
            "Da tu respuesta y luego la razón que está en la tabla.",
          ),
          frame: "The color is ___ because the chart says ___.",
          model: "The color is yellow because the chart says we water sunflowers on Tuesday.",
          keep: "The color code",
        },
        {
          id: "l2-read",
          lock: 2,
          type: "choose",
          docs: ["note", "shelf"],
          prompt: "Where is the key?",
          help: "La nota dice que la llave está con la herramienta que usamos para hacer hoyos para las semillas. ¿Cuál herramienta sirve para cavar?",
          options: [
            {
              id: "a",
              text: "The top shelf",
              why: "Rain boots keep your feet dry. Can you dig with them?",
            },
            { id: "b", text: "The middle shelf", ok: true },
            {
              id: "c",
              text: "The bottom shelf",
              why: "A watering can gives plants water. Does it dig holes?",
            },
            { id: "d", text: "The hook", why: "A sun hat keeps the sun off you. Which tool digs?" },
          ],
          rule: C(
            "Think about what each tool is used for.",
            "Piensa para qué sirve cada herramienta.",
          ),
          explain: "You dig holes for seeds with a shovel, and the shovel is on the middle shelf.",
        },
        {
          id: "l2-explain",
          lock: 2,
          type: "write",
          docs: ["note", "shelf"],
          prompt: "Tell why the key is there.",
          help: "Di en qué parte está la llave y qué herramienta está ahí. Usa because.",
          check: {
            min: 8,
            ideas: [
              { any: ["middle"], clue: C("Say which shelf.", "Di qué estante.") },
              {
                any: ["shovel", "dig*"],
                clue: C("Say which tool is there.", "Di qué herramienta está ahí."),
              },
            ],
            connector: ["cause"],
          },
          rule: C(
            "Say where, then say why with because.",
            "Di dónde y luego di por qué con because.",
          ),
          frame: "The key is on the ___ shelf because ___.",
          model: "The key is on the middle shelf because we dig holes with the shovel.",
          keep: "Where the key was",
        },
        {
          id: "l3-read",
          lock: 3,
          type: "choose",
          docs: ["note", "map"],
          prompt: "Which way do you walk to the treehouse?",
          help: "Mira las líneas del mapa. La nota dice que no pases por un lugar. Busca otro camino.",
          options: [
            {
              id: "a",
              text: "Shed → Pond → Treehouse",
              why: "This way is short. But what does the note say about the pond?",
            },
            { id: "b", text: "Shed → Flower Bed → Bench → Treehouse", ok: true },
            {
              id: "c",
              text: "Shed → Bench → Treehouse",
              why: "Look at the lines. Does a line go from the Shed to the Bench?",
            },
          ],
          rule: C(
            "Walk only on the lines of the map, and skip the place the note says to stay away from.",
            "Camina solo por las líneas del mapa y evita el lugar que la nota dice.",
          ),
          explain:
            "The pond is muddy, so you walk to the flower bed, then the bench, then the treehouse.",
        },
        {
          id: "l3-explain",
          lock: 3,
          type: "write",
          docs: ["note", "map"],
          prompt: "Tell your team the way to go. Say why you skip one place.",
          help: "Di el camino en orden con first y then. Luego di por qué no pasas por el estanque.",
          check: {
            min: 10,
            ideas: [
              {
                any: ["flower bed", "flowers", "flower"],
                clue: C("Say where you walk first.", "Di a dónde caminas primero."),
              },
              { any: ["bench"], clue: C("Say where you go next.", "Di a dónde vas después.") },
              {
                any: ["pond", "mud*"],
                clue: C("Say which place you skip, and why.", "Di qué lugar evitas y por qué."),
              },
            ],
            connector: ["sequence"],
          },
          rule: C(
            "Use order words like first and then.",
            "Usa palabras de orden como first y then.",
          ),
          frame: "First, walk to the ___. Then, go to the ___. We skip the ___ because ___.",
          model:
            "First, walk to the flower bed. Then, go to the bench and the treehouse. We skip the pond because it is muddy.",
          keep: "The way to the treehouse",
        },
      ],
    },
    {
      id: "er35-treehouse",
      title: "The Treehouse",
      art: ["bg-forest", "char-leo"],
      intro:
        "You climb the rope ladder into the treehouse. A small box has a number lock, and a big trunk has a name lock. A bird chart, a snack schedule and a tree picture are on the wall.",
      introEs:
        "Subes por la escalera de cuerda a la casa del árbol. Una caja pequeña tiene un candado de números y un baúl grande tiene un candado de nombres. En la pared hay una gráfica de pájaros, un horario de meriendas y un dibujo de árboles.",
      outro:
        'The club flag is tied to a branch of the maple tree. On it, Ms. Rivera wrote: "Last stop: the library. Look for a true book about bugs." You climb down and run to school.',
      docs: [
        {
          id: "note",
          kind: "note",
          title: "Note in the box",
          from: "Ms. Rivera",
          lines: [
            "Box lock: the number of the bird we saw the most.",
            "Trunk lock: the name of the friend who brings snack the day after Wednesday.",
            "The club flag is in the tallest tree that is safe to climb.",
            "Trees taller than 30 feet are NOT safe.",
          ],
        },
        {
          id: "birds",
          kind: "chart",
          title: "Birds at our feeder this week",
          unit: "birds",
          bars: [
            { label: "Robins", value: 6 },
            { label: "Blue jays", value: 9 },
            { label: "Sparrows", value: 4 },
            { label: "Cardinals", value: 7 },
          ],
          source: "Green Sprouts bird count",
        },
        {
          id: "snacks",
          kind: "schedule",
          title: "Snack schedule",
          cols: ["Day", "Who brings snack", "Snack"],
          rows: [
            ["Monday", "Maya", "apples"],
            ["Tuesday", "Amara", "crackers"],
            ["Wednesday", "Leo", "grapes"],
            ["Thursday", "Kai", "carrots"],
            ["Friday", "Sam", "popcorn"],
          ],
        },
        {
          id: "trees",
          kind: "diagram",
          title: "Trees near the treehouse",
          art: "nat-tree",
          parts: [
            { label: "Oak", text: "20 feet tall" },
            { label: "Pine", text: "35 feet tall" },
            { label: "Maple", text: "25 feet tall" },
          ],
        },
      ],
      steps: [
        {
          id: "l1-read",
          lock: 1,
          type: "choose",
          docs: ["note", "birds"],
          prompt: "What number opens the box?",
          help: "La nota pide el número del pájaro que vimos MÁS veces. Busca la barra más alta en la gráfica.",
          options: [
            { id: "a", text: "6", why: "6 is the robins. Look for a bigger number." },
            { id: "b", text: "9", ok: true },
            { id: "c", text: "4", why: "4 is the smallest bar. The note asks for the most." },
            { id: "d", text: "7", why: "7 is the cardinals. Is that the tallest bar?" },
          ],
          rule: C(
            "The most means the biggest number: find the tallest bar.",
            "Más significa el número más grande: busca la barra más alta.",
          ),
          explain: "The blue jays bar is the tallest. We saw 9 blue jays.",
        },
        {
          id: "l1-explain",
          lock: 1,
          type: "write",
          docs: ["note", "birds"],
          prompt: "Tell how you know the number.",
          help: "Di el número. Luego di qué pájaro es y qué muestra la gráfica. Usa because.",
          check: {
            min: 10,
            ideas: [
              { any: ["9", "nine"], clue: C("Say the number.", "Di el número.") },
              {
                any: ["blue jay*", "most", "tallest", "biggest"],
                clue: C(
                  "Say which bird, or why it is that one.",
                  "Di qué pájaro o por qué es ese.",
                ),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "Give the answer and say what the chart shows.",
            "Da la respuesta y di lo que muestra la gráfica.",
          ),
          frame: "The number is ___ because the chart shows ___.",
          model: "The number is 9 because the chart shows we saw blue jays the most.",
          keep: "The bird number",
        },
        {
          id: "l2-read",
          lock: 2,
          type: "choose",
          docs: ["note", "snacks"],
          prompt: "Which name opens the trunk?",
          help: "Primero piensa: ¿qué día viene después del miércoles (Wednesday)? Luego busca ese día en el horario.",
          options: [
            {
              id: "a",
              text: "Leo",
              why: "Leo brings snack on Wednesday. The note says the day after.",
            },
            { id: "b", text: "Kai", ok: true },
            { id: "c", text: "Amara", why: "Amara is on Tuesday. That is before Wednesday." },
            { id: "d", text: "Sam", why: "Sam is on Friday. Is Friday right after Wednesday?" },
          ],
          rule: C(
            "The day after means the next day in the week.",
            "El día después significa el día siguiente de la semana.",
          ),
          explain: "Thursday comes right after Wednesday, and Kai brings snack on Thursday.",
        },
        {
          id: "l2-explain",
          lock: 2,
          type: "write",
          docs: ["note", "snacks"],
          prompt: "Tell how you found the name.",
          help: "Di el nombre y el día. Explica que ese día viene después del miércoles. Usa because.",
          check: {
            min: 12,
            ideas: [
              { any: ["kai"], clue: C("Say the name.", "Di el nombre.") },
              {
                any: ["thursday", "after wednesday"],
                clue: C("Say which day you looked for.", "Di qué día buscaste."),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "Say the answer, the day, and where you found it.",
            "Di la respuesta, el día y dónde lo encontraste.",
          ),
          frame: "The name is ___ because the schedule says ___.",
          model:
            "The name is Kai because the schedule says Kai brings snack on Thursday, the day after Wednesday.",
          keep: "The name code",
        },
        {
          id: "l3-read",
          lock: 3,
          type: "choose",
          docs: ["note", "trees"],
          prompt: "Which tree has the club flag?",
          help: "La nota dice: el árbol más alto que sea seguro. Los árboles de más de 30 pies NO son seguros. Primero quita el árbol que no es seguro.",
          options: [
            {
              id: "a",
              text: "The oak",
              why: "The oak is safe. But is it the tallest safe tree?",
            },
            {
              id: "b",
              text: "The pine",
              why: "The pine is the tallest. Read the note: is a 35-foot tree safe?",
            },
            { id: "c", text: "The maple", ok: true },
          ],
          rule: C(
            "First take out the trees that are not safe. Then find the tallest one left.",
            "Primero quita los árboles que no son seguros. Luego busca el más alto de los que quedan.",
          ),
          explain:
            "The pine is 35 feet, too tall to be safe. The maple is 25 feet, the tallest tree under 30 feet.",
        },
        {
          id: "l3-explain",
          lock: 3,
          type: "write",
          docs: ["note", "trees"],
          prompt: "Tell why the flag is not in the tallest tree.",
          help: "Di cuál es el árbol más alto y por qué no es seguro. Usa but. Luego di dónde está la bandera.",
          check: {
            min: 12,
            ideas: [
              { any: ["maple"], clue: C("Say where the flag is.", "Di dónde está la bandera.") },
              {
                any: ["pine"],
                clue: C("Name the tallest tree.", "Nombra el árbol más alto."),
              },
              {
                any: [
                  "35",
                  "not safe",
                  "too tall",
                  "too high",
                  "over 30",
                  "more than 30",
                  "taller than 30",
                ],
                clue: C(
                  "Say what is wrong with the tallest tree.",
                  "Di qué problema tiene el árbol más alto.",
                ),
              },
            ],
            connector: ["contrast"],
          },
          rule: C(
            "Use but to show why the first idea does not work.",
            "Usa but para mostrar por qué la primera idea no funciona.",
          ),
          frame: "The ___ is the tallest, but ___. So the flag is in the ___.",
          model:
            "The pine is the tallest tree, but it is 35 feet and not safe. So the flag is in the maple.",
          keep: "The safe tree",
        },
      ],
    },
    {
      id: "er35-library",
      title: "The School Library",
      art: ["bg-classroom", "char-teacher"],
      intro:
        "The library is quiet. Click! The door to the back room locks behind you. A book list, a library map, two notes and a room schedule are on the desk. This is the last room of the hunt.",
      introEs:
        "La biblioteca está en silencio. ¡Clic! La puerta del cuarto de atrás se cierra detrás de ti. En el escritorio hay una lista de libros, un mapa de la biblioteca, dos notas y un horario. Esta es la última sala de la búsqueda.",
      outro:
        'The Art Room door opens. Ms. Rivera is there with the whole club and a big bowl of popcorn. "You read every clue and told me how you knew," she says. "You are real clue experts!" The hunt is over, and the Green Sprouts are free.',
      docs: [
        {
          id: "books",
          kind: "record",
          title: "Book list: books about bugs",
          rows: [
            ["Bug Jokes for Kids", "Funny Books, shelf 7"],
            ["The Dragon Bug's Big Day", "Story Books, shelf 2"],
            ["Bugs Up Close", "True Books: Animals, shelf 3"],
          ],
        },
        {
          id: "map",
          kind: "map",
          title: "Library map",
          places: [
            { name: "Door", x: 1, y: 1 },
            { name: "Reading Rug", x: 4, y: 1 },
            { name: "Computers", x: 1, y: 4 },
            { name: "Animals Shelf", x: 7, y: 3 },
          ],
          paths: [
            [0, 1],
            [0, 2],
            [1, 3],
            [2, 3],
          ],
          notes: ["Story time is on the reading rug. Please walk around it."],
        },
        {
          id: "note1",
          kind: "note",
          title: "Note from this morning (9:00)",
          from: "Ms. Rivera",
          lines: [
            "Find the true book about bugs. Not jokes, and not a made-up story.",
            "Then meet me at the front desk at 3:00.",
          ],
        },
        {
          id: "note2",
          kind: "note",
          title: "Sticky note on the book (1:00)",
          from: "Mr. Park, librarian",
          lines: [
            "Ms. Rivera had to change the plan!",
            "Do not go to the front desk. Meet her in the Art Room at 3:00.",
          ],
        },
        {
          id: "rooms",
          kind: "schedule",
          title: "Art Room today",
          cols: ["Time", "What happens"],
          rows: [
            ["1:00", "Clay class"],
            ["2:00", "Painting class"],
            ["3:00", "Free for clubs"],
            ["4:00", "Room closed"],
          ],
        },
      ],
      steps: [
        {
          id: "l1-read",
          lock: 1,
          type: "choose",
          docs: ["note1", "books"],
          prompt: "Which book has the next clue?",
          help: "La nota pide un libro VERDADERO sobre insectos: no de chistes y no un cuento inventado. Mira en qué sección está cada libro.",
          options: [
            {
              id: "a",
              text: "Bug Jokes for Kids",
              why: "This book is in Funny Books. The note says not jokes.",
            },
            {
              id: "b",
              text: "The Dragon Bug's Big Day",
              why: "This book is in Story Books. Is a dragon bug real?",
            },
            { id: "c", text: "Bugs Up Close", ok: true },
          ],
          rule: C(
            "The section of a book tells you what kind of book it is.",
            "La sección de un libro te dice qué tipo de libro es.",
          ),
          explain: "Bugs Up Close is in True Books: Animals, so it is a true book about bugs.",
        },
        {
          id: "l1-explain",
          lock: 1,
          type: "write",
          docs: ["note1", "books"],
          prompt: "Tell why this is the right book.",
          help: "Di el nombre del libro. Luego di qué dice la lista sobre ese libro. Usa because.",
          check: {
            min: 12,
            ideas: [
              {
                any: ["bugs up close", "up close"],
                clue: C("Say the name of the book.", "Di el nombre del libro."),
              },
              {
                any: ["true", "real", "not a story", "not jokes", "facts", "animals"],
                clue: C("Say what kind of book it is.", "Di qué tipo de libro es."),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "Say your answer and what the list shows about it.",
            "Di tu respuesta y lo que muestra la lista.",
          ),
          frame: "It is ___ because the book list says ___.",
          model: "It is Bugs Up Close because the book list says it is a true book about animals.",
          keep: "The right book",
        },
        {
          id: "l2-read",
          lock: 2,
          type: "choose",
          docs: ["map"],
          prompt: "Which way do you walk to the Animals Shelf?",
          help: "Sigue las líneas del mapa. Lee la nota debajo del mapa: hay un lugar que debes rodear.",
          options: [
            {
              id: "a",
              text: "Door → Reading Rug → Animals Shelf",
              why: "This way is short. What does the map note say about the rug?",
            },
            { id: "b", text: "Door → Computers → Animals Shelf", ok: true },
            {
              id: "c",
              text: "Door → Animals Shelf",
              why: "Look at the lines. Does a line go straight from the Door to the shelf?",
            },
          ],
          rule: C(
            "Walk only on the lines, and go around the place the note talks about.",
            "Camina solo por las líneas y rodea el lugar del que habla la nota.",
          ),
          explain: "Story time is on the rug, so you walk past the Computers to the Animals Shelf.",
        },
        {
          id: "l2-explain",
          lock: 2,
          type: "write",
          docs: ["map"],
          prompt: "Tell a friend how to walk to the shelf, and why.",
          help: "Di el camino en orden con first y then. Luego di por qué no pasas por la alfombra.",
          check: {
            min: 14,
            ideas: [
              {
                any: ["computer*"],
                clue: C("Say where you walk first.", "Di a dónde caminas primero."),
              },
              {
                any: ["rug", "story time"],
                clue: C(
                  "Say which place you go around, and why.",
                  "Di qué lugar rodeas y por qué.",
                ),
              },
            ],
            connector: ["sequence"],
          },
          rule: C(
            "Use order words like first and then, and give a reason with because.",
            "Usa palabras de orden como first y then, y da una razón con because.",
          ),
          frame: "First, walk to the ___. Then, go to the ___. We go around the ___ because ___.",
          model:
            "First, walk from the door to the computers. Then, go to the Animals Shelf. We go around the rug because story time is there.",
          keep: "The way to the shelf",
        },
        {
          id: "l3-read",
          lock: 3,
          type: "choose",
          docs: ["note1", "note2"],
          prompt: "The two notes do not match. Where will you meet Ms. Rivera?",
          help: "Mira la hora de cada nota: una es de las 9:00 y la otra es de la 1:00. ¿Cuál es más nueva? ¿Qué dice?",
          options: [
            {
              id: "a",
              text: "At the front desk",
              why: "That was the plan at 9:00. Is there a newer note?",
            },
            { id: "b", text: "In the Art Room", ok: true },
            {
              id: "c",
              text: "On the reading rug",
              why: "Neither note says to meet on the rug.",
            },
          ],
          rule: C(
            "When two notes do not match, the newer note tells you what changed.",
            "Cuando dos notas no coinciden, la nota más nueva te dice qué cambió.",
          ),
          explain:
            "Mr. Park's note is from 1:00, after Ms. Rivera's 9:00 note. It says the plan changed: meet in the Art Room.",
        },
        {
          id: "l3-explain",
          lock: 3,
          type: "write",
          docs: ["note1", "note2"],
          prompt: "Tell which note you follow and why.",
          help: "Di qué decía la primera nota. Usa but para decir qué dice la nota nueva. Termina con el lugar.",
          check: {
            min: 14,
            ideas: [
              {
                any: ["art room"],
                clue: C("Say where you will meet.", "Di dónde se van a encontrar."),
              },
              {
                any: ["1:00", "newer", "later", "new", "changed", "change"],
                clue: C("Say why you follow that note.", "Di por qué sigues esa nota."),
              },
            ],
            connector: ["contrast", "cause"],
            evidence: true,
          },
          rule: C(
            "Say what the first note said, then what the newer note says.",
            "Di qué decía la primera nota y luego qué dice la nota más nueva.",
          ),
          frame: "The first note says ___, but the newer note says ___. So we meet in the ___.",
          model:
            "The first note says the front desk, but the newer note from 1:00 says the plan changed. So we meet in the Art Room.",
          keep: "Which note to follow",
        },
        {
          id: "l4-read",
          lock: 4,
          type: "choose",
          docs: ["note1", "note2", "books", "rooms"],
          prompt: "Last lock! Which plan is right?",
          help: "Revisa tres cosas: el lugar (la nota más nueva), la hora (el horario del salón de arte) y el libro (la lista de libros).",
          options: [
            {
              id: "a",
              text: "Art Room at 2:00 with Bugs Up Close",
              why: "Look at the Art Room schedule. What is happening at 2:00?",
            },
            {
              id: "b",
              text: "Front desk at 3:00 with Bugs Up Close",
              why: "The time is right. Which note is newer about the place?",
            },
            { id: "c", text: "Art Room at 3:00 with Bugs Up Close", ok: true },
            {
              id: "d",
              text: "Art Room at 3:00 with Bug Jokes for Kids",
              why: "The place and time fit. Which book did the note ask for?",
            },
          ],
          rule: C(
            "Check every part of the plan with its own clue.",
            "Revisa cada parte del plan con su propia pista.",
          ),
          explain:
            "The newer note says the Art Room, the schedule says it is free for clubs at 3:00, and Bugs Up Close is the true book about bugs.",
        },
        {
          id: "l4-explain",
          lock: 4,
          type: "write",
          docs: ["note1", "note2", "books", "rooms"],
          prompt: "Write a message to your club. Say where, when, and what to bring. Tell why.",
          help: "Escribe dos oraciones. Di el lugar, la hora y el libro. Luego usa but o because para explicar por qué no van a la recepción.",
          check: {
            min: 14,
            max: 40,
            ideas: [
              { any: ["art room"], clue: C("Say where to meet.", "Di dónde se encuentran.") },
              {
                any: ["3:00", "3 pm", "3pm", "three"],
                clue: C("Say what time.", "Di a qué hora."),
              },
              {
                any: ["bugs up close", "bug book", "book"],
                clue: C("Say what to bring.", "Di qué deben llevar."),
              },
            ],
            connector: ["contrast", "cause"],
            evidence: true,
          },
          rule: C(
            "A good message says where, when and what, and gives a reason.",
            "Un buen mensaje dice dónde, cuándo y qué, y da una razón.",
          ),
          frame: "Meet in the ___ at ___ and bring ___. The first note said ___, but ___.",
          model:
            "Meet in the Art Room at 3:00 and bring Bugs Up Close. The first note said the front desk, but the newer note says the Art Room.",
          keep: "Our message to the club",
        },
      ],
    },
  ],
};

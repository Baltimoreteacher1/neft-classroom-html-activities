// Evidence Detective, grades 3-5: "The Willow Creek Detective Club". Content only (schema: engine.js).
// Every case: sort the clues (helps / does not help, with a reason), choose the best-supported conclusion,
// defend it (claim + evidence + reasoning), then answer someone who disagrees.
import { MUSEUM_35 } from "./evidence-detective-museum.js";

const C = (en, es) => [en, es];

const CATS = [
  { id: "relevant", label: C("Helps solve the case", "Ayuda a resolver el caso") },
  { id: "irrelevant", label: C("Does not help", "No ayuda") },
];

export const BAND_35 = {
  premise:
    "You just joined the Detective Club at Willow Creek School. Detective Paz has one rule: a good detective does not guess. You read every clue, keep the ones that help, and explain your thinking. Four cases are waiting in the case box, and the last one is a museum mystery.",
  premiseEs:
    "Acabas de entrar al Club de Detectives de la Escuela Willow Creek. La detective Paz tiene una regla: un buen detective no adivina. Lees cada pista, guardas las que ayudan y explicas lo que piensas. Hay cuatro casos esperando en la caja de casos, y el último es un misterio de museo.",
  chapters: [
    {
      id: "ed35-hamster",
      title: "Case 1: Where Is Peanut?",
      art: ["bg-classroom", "char-detective"],
      intro:
        'On Tuesday morning, the hamster cage in Room 12 is empty. Peanut the hamster is gone! Detective Paz hands you the case file. "Read it all," she says. "Some clues help. Some do not."',
      introEs:
        "El martes por la mañana, la jaula del hámster del Salón 12 está vacía. ¡El hámster Peanut no está! La detective Paz te da el expediente. «Léelo todo», dice. «Algunas pistas ayudan. Otras no».",
      outro:
        "You open the supply closet very slowly. Behind a box of paper towels, two little eyes look up at you. Peanut is safe! Detective Paz smiles and pulls a new folder from the case box. It has a muddy paw print on the cover.",
      docs: [
        {
          id: "board",
          kind: "record",
          title: "Room 12 class board",
          rows: [
            ["Monday note", "The cage latch is loose. Fix it soon!"],
            ["Feed Peanut", "Tuesday: Leo"],
            ["Classroom door", "Closed and locked all night"],
            ["Lunch on Tuesday", "Pizza"],
          ],
        },
        {
          id: "photo",
          kind: "photo",
          title: "Photo of the cage",
          art: "obj-food-bowl",
          caption:
            "The cage door is open. A line of sunflower seeds goes across the floor to the supply closet.",
        },
        {
          id: "diaz",
          kind: "witness",
          title: "What Mr. Diaz said",
          who: "Mr. Diaz",
          role: "school custodian",
          said: "I came in at 7:30 this morning. I heard little scratching sounds inside the supply closet.",
        },
        {
          id: "kids",
          kind: "witness",
          title: "What Amara and Leo said",
          who: "Amara and Leo",
          role: "students in Room 12",
          said: "Amara: Peanut is the cutest hamster in the whole school! Leo: I feel so sad and worried about him.",
        },
      ],
      steps: [
        {
          id: "sort",
          type: "sort",
          docs: ["board", "photo", "diaz", "kids"],
          prompt: "Sort the clues. Does each clue help find Peanut? Then pick the reason.",
          help: "Lee cada pista. Pregúntate: ¿esta pista me dice cómo salió Peanut o adónde fue? Si es un sentimiento o habla de otra cosa, no ayuda. Después elige la razón.",
          cats: CATS,
          reasons: [
            { id: "how", text: "It tells how it could happen" },
            { id: "where", text: "It shows where Peanut went" },
            { id: "feeling", text: "It is a feeling, not a fact" },
            { id: "other", text: "It is about something else" },
          ],
          items: [
            {
              id: "latch",
              text: "The cage latch was loose on Monday.",
              cat: "relevant",
              reason: "how",
              clue: C(
                "Think: could a loose latch let a hamster out?",
                "Piensa: ¿un seguro flojo puede dejar salir a un hámster?",
              ),
            },
            {
              id: "seeds",
              text: "Seeds make a line to the supply closet.",
              cat: "relevant",
              reason: "where",
              clue: C("Where does the line of seeds go?", "¿Adónde va la línea de semillas?"),
            },
            {
              id: "scratch",
              text: "Mr. Diaz heard scratching in the closet.",
              cat: "relevant",
              reason: "where",
              clue: C(
                "A sound tells you where something might be. Where was the sound?",
                "Un sonido te dice dónde puede estar algo. ¿Dónde estaba el sonido?",
              ),
            },
            {
              id: "cute",
              text: "Amara says Peanut is the cutest hamster.",
              cat: "irrelevant",
              reason: "feeling",
              clue: C(
                'Is "cutest" a fact you can check, or what Amara feels?',
                "¿«Cutest» es un dato que puedes comprobar o es lo que siente Amara?",
              ),
            },
            {
              id: "pizza",
              text: "Lunch on Tuesday was pizza.",
              cat: "irrelevant",
              reason: "other",
              clue: C(
                "Does lunch tell you anything about the hamster?",
                "¿El almuerzo te dice algo sobre el hámster?",
              ),
            },
            {
              id: "sad",
              text: "Leo feels sad and worried.",
              cat: "irrelevant",
              reason: "feeling",
              clue: C(
                "Is this something that happened, or how Leo feels?",
                "¿Esto es algo que pasó o es cómo se siente Leo?",
              ),
            },
          ],
          rule: C(
            "A clue helps when it is a fact about the case. Feelings and other topics do not help.",
            "Una pista ayuda cuando es un dato sobre el caso. Los sentimientos y otros temas no ayudan.",
          ),
          explain:
            "The loose latch tells how Peanut got out. The seeds and the scratching show where he went. Feelings and lunch do not help find him.",
        },
        {
          id: "choose",
          type: "choose",
          docs: ["board", "photo", "diaz"],
          prompt: "Which idea do the clues support best?",
          help: "Mira las pistas que ayudan: el seguro flojo, las semillas y lo que oyó el Sr. Diaz. ¿Qué idea usa todas esas pistas? Revisa también si la puerta del salón estaba abierta.",
          options: [
            {
              id: "a",
              text: "Someone took Peanut home in a backpack.",
              why: "Look at the photo. If someone carried him away, why would seeds lead across the floor?",
            },
            {
              id: "b",
              text: "Peanut got out and is hiding in the supply closet.",
              ok: true,
              why: "Yes! You used the latch, the seeds and the sound.",
            },
            {
              id: "c",
              text: "Peanut ran out the door to the playground.",
              why: "Read the class board. Was the classroom door open at night?",
            },
            {
              id: "d",
              text: "Peanut is hiding in the reading corner.",
              why: "Where did Mr. Diaz hear the scratching? Where do the seeds go?",
            },
          ],
          rule: C(
            "The best idea fits ALL the helpful clues, not just one.",
            "La mejor idea encaja con TODAS las pistas que ayudan, no solo con una.",
          ),
          explain:
            "The latch was loose, so Peanut could get out. The seeds go to the closet, and Mr. Diaz heard scratching there.",
        },
        {
          id: "defend",
          type: "write",
          docs: ["photo", "diaz"],
          prompt: "Tell Detective Paz where Peanut is. Give one clue that proves it.",
          help: "Escribe una oración. Di dónde está Peanut y por qué. Nombra una pista: la foto o lo que dijo el Sr. Diaz. Usa because.",
          check: {
            min: 8,
            ideas: [
              {
                any: ["closet", "supply room"],
                clue: C("Say where Peanut is.", "Di dónde está Peanut."),
              },
              {
                any: ["seed*", "scratch*", "sound*", "heard", "latch*", "loose"],
                clue: C(
                  "Add a clue from the photo or from Mr. Diaz.",
                  "Agrega una pista de la foto o del Sr. Diaz.",
                ),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "A detective says the answer, then the clue, then why the clue matters.",
            "Un detective dice la respuesta, luego la pista y luego por qué importa la pista.",
          ),
          frame: "Peanut is in the ___ because the ___ shows ___.",
          model:
            "Peanut is in the supply closet because the photo shows seeds going to the closet.",
          keep: "My claim and evidence",
        },
        {
          id: "answer",
          type: "write",
          docs: ["photo", "diaz", "board"],
          npc: {
            who: "Sam",
            art: "char-sam",
            line: "I don't think so. I think somebody took Peanut home in a backpack!",
          },
          prompt: "Answer Sam kindly. Say what is true, then give a clue.",
          help: "Primero di algo que Sam tiene bien con It is true that... Luego usa but y da una pista: las semillas, el ruido o el seguro flojo.",
          check: {
            min: 10,
            ideas: [
              {
                any: ["seed*", "scratch*", "sound*", "heard", "latch*", "loose", "closet"],
                clue: C(
                  "Give Sam a clue from the case file.",
                  "Dale a Sam una pista del expediente.",
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
            "It is true that Peanut is small, but the seeds go to the closet, not to a backpack.",
          keep: "My answer to the other side",
        },
      ],
    },
    {
      id: "ed35-tomatoes",
      title: "Case 2: The Missing Tomatoes",
      art: ["bg-park", "char-detective"],
      intro:
        'The school garden had eight red tomatoes on Monday. On Tuesday morning, only two are left. Bitten tomatoes lie on the ground. Detective Paz points at the muddy paw print on the folder. "Who was in the garden last night?"',
      introEs:
        "El huerto de la escuela tenía ocho tomates rojos el lunes. El martes por la mañana solo quedan dos. Hay tomates mordidos en el suelo. La detective Paz señala la huella con lodo en la carpeta. «¿Quién estuvo en el huerto anoche?»",
      outro:
        "That night, the club watches from the window. At dusk, a gray raccoon climbs the fence and sniffs the trash can. Case closed! The club puts a lid lock on the can. The next morning, a librarian knocks on the door holding a very wet book.",
      docs: [
        {
          id: "park",
          kind: "witness",
          title: "What Ms. Park said",
          who: "Ms. Park",
          role: "garden helper",
          said: "I came early on Tuesday, at 6:00 in the morning. I saw a gray animal with a striped tail climb over the fence.",
        },
        {
          id: "prints",
          kind: "photo",
          title: "Photo of the garden bench",
          art: "obj-magnifier",
          caption:
            "Muddy prints on the bench. Each print has five long toes and looks like a tiny hand.",
        },
        {
          id: "log",
          kind: "record",
          title: "Garden log",
          rows: [
            ["Monday, 3:00 p.m.", "8 red tomatoes on the vine"],
            ["Monday night", "Gate locked. Trash can lid left open."],
            ["Tuesday, 7:00 a.m.", "2 tomatoes left. Bitten ones on the ground."],
          ],
        },
        {
          id: "kai",
          kind: "witness",
          title: "What Kai said",
          who: "Kai",
          role: "garden club member",
          said: "I think bunnies are so cute! And I love tomatoes on pizza.",
        },
      ],
      steps: [
        {
          id: "sort",
          type: "sort",
          docs: ["park", "prints", "log", "kai"],
          prompt: "Sort the clues. Does each clue help find the tomato eater?",
          help: "Para cada pista pregúntate: ¿me dice quién estuvo en el huerto o cuándo pasó? Si es un sentimiento o algo que no tiene que ver, no ayuda.",
          cats: CATS,
          reasons: [
            { id: "who", text: "It shows who was there" },
            { id: "when", text: "It tells when it happened" },
            { id: "feeling", text: "It is a feeling, not a fact" },
            { id: "other", text: "It is about something else" },
          ],
          items: [
            {
              id: "tail",
              text: "Ms. Park saw a gray animal with a striped tail.",
              cat: "relevant",
              reason: "who",
              clue: C("Does this describe the visitor?", "¿Esto describe al visitante?"),
            },
            {
              id: "hands",
              text: "The muddy prints look like tiny hands.",
              cat: "relevant",
              reason: "who",
              clue: C(
                "Different animals leave different prints. What does a print tell you?",
                "Animales diferentes dejan huellas diferentes. ¿Qué te dice una huella?",
              ),
            },
            {
              id: "monday",
              text: "There were 8 tomatoes on Monday afternoon.",
              cat: "relevant",
              reason: "when",
              clue: C(
                "This tells you the tomatoes were still there at a certain time.",
                "Esto te dice que los tomates seguían ahí a cierta hora.",
              ),
            },
            {
              id: "tuesday",
              text: "Only 2 tomatoes were left on Tuesday morning.",
              cat: "relevant",
              reason: "when",
              clue: C(
                "Put this next to the Monday clue. What time does it point to?",
                "Pon esta pista junto a la del lunes. ¿A qué hora apunta?",
              ),
            },
            {
              id: "bunnies",
              text: "Kai thinks bunnies are so cute.",
              cat: "irrelevant",
              reason: "feeling",
              clue: C(
                'Is "cute" something you can check?',
                "¿«Cute» es algo que puedes comprobar?",
              ),
            },
            {
              id: "pizza",
              text: "Kai loves tomatoes on pizza.",
              cat: "irrelevant",
              reason: "other",
              clue: C(
                "Does Kai's favorite food tell you who was in the garden?",
                "¿La comida favorita de Kai te dice quién estuvo en el huerto?",
              ),
            },
          ],
          rule: C(
            "Keep facts about who was there and when. Leave out feelings and other topics.",
            "Guarda los datos sobre quién estuvo y cuándo. Deja fuera los sentimientos y otros temas.",
          ),
          explain:
            "The striped tail and the hand-like prints show who was there. The garden log shows it happened Monday night. Kai's feelings and pizza do not help.",
        },
        {
          id: "choose",
          type: "choose",
          docs: ["park", "prints", "log"],
          prompt: "Who ate the tomatoes? Pick the idea the clues support best.",
          help: "Compara cada idea con las pistas: la cola con rayas, las huellas como manos, la puerta cerrada con llave y la basura abierta. ¿Qué idea encaja con todas?",
          options: [
            {
              id: "a",
              text: "A rabbit hopped in and ate them.",
              why: "Rabbits do eat plants. But look at the tail Ms. Park saw and the shape of the prints. Do those fit a rabbit?",
            },
            {
              id: "b",
              text: "Some kids picked them after school.",
              why: "Read the garden log. Could kids get in that night? And kids do not bite tomatoes and leave them on the ground.",
            },
            {
              id: "c",
              text: "A raccoon climbed the fence and ate them at night.",
              ok: true,
              why: "Yes! The tail, the prints and the open trash can all fit.",
            },
            {
              id: "d",
              text: "Birds pecked them in the morning.",
              why: "Birds do peck tomatoes. But would a bird leave prints like tiny hands?",
            },
          ],
          rule: C(
            "Check each idea against every clue. Throw out an idea if one clue goes against it.",
            "Compara cada idea con cada pista. Descarta una idea si una pista va en contra.",
          ),
          explain:
            "Raccoons have striped tails and prints like tiny hands, they climb fences, and the open trash can may have pulled one in. The gate was locked, so people could not get in.",
        },
        {
          id: "defend",
          type: "write",
          docs: ["park", "prints", "log"],
          prompt: "Write your claim for the case file: who ate the tomatoes? Give two clues.",
          help: "Escribe una o dos oraciones. Di quién se comió los tomates. Nombra dos pistas: lo que vio la Sra. Park y lo que muestra la foto. Usa because.",
          check: {
            min: 10,
            ideas: [
              {
                any: ["raccoon*"],
                clue: C("Name the animal in your claim.", "Nombra al animal en tu afirmación."),
              },
              {
                any: ["striped", "stripe*", "tail"],
                clue: C("Add what Ms. Park saw.", "Agrega lo que vio la Sra. Park."),
              },
              {
                any: ["print*", "hand*", "paw*", "toe*"],
                clue: C("Add what the photo shows.", "Agrega lo que muestra la foto."),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "A claim is stronger with two clues that point to the same answer.",
            "Una afirmación es más fuerte con dos pistas que apuntan a la misma respuesta.",
          ),
          frame: "A ___ ate the tomatoes because Ms. Park saw ___ and the photo shows ___.",
          model:
            "A raccoon ate the tomatoes because Ms. Park saw a striped tail and the photo shows prints like tiny hands.",
          keep: "My claim and evidence",
        },
        {
          id: "answer",
          type: "write",
          docs: ["log", "prints"],
          npc: {
            who: "Kai",
            art: "char-kai",
            line: "Hmm. Maybe kids from the after-school club picked them. Kids love tomatoes!",
          },
          prompt: "Answer Kai. Say what is true, then use a clue from the log or the photo.",
          help: "Empieza con It is true that... para mostrar que escuchaste a Kai. Luego usa but y una pista: el registro dice algo sobre la puerta, y la foto muestra las huellas.",
          check: {
            min: 12,
            ideas: [
              {
                any: ["lock*", "gate", "night", "print*", "hand*", "bitten", "bite*", "ground"],
                clue: C(
                  "Give Kai a clue from the garden log or the photo.",
                  "Dale a Kai una pista del registro del huerto o de la foto.",
                ),
              },
            ],
            connector: ["contrast", "concession"],
          },
          rule: C(
            "Agree with the part that could be true, then show the clue that goes against it.",
            "Acepta la parte que podría ser verdad y luego muestra la pista que va en contra.",
          ),
          frame: "It is true that ___, but the log says ___.",
          model:
            "It is true that kids like tomatoes, but the log says the gate was locked all night.",
          keep: "My answer to the other side",
        },
      ],
    },
    {
      id: "ed35-book",
      title: "Case 3: The Wet Library Book",
      art: ["bg-classroom", "char-owl"],
      intro:
        'Mr. Ortiz the librarian holds up a book called The Sea Turtle Trip. The bottom corner is wet and sticky. "Lena returned it this way on Thursday," he says. "I need to know what happened before I fix it." This case file is the biggest yet.',
      introEs:
        "El Sr. Ortiz, el bibliotecario, levanta un libro llamado The Sea Turtle Trip. La esquina de abajo está mojada y pegajosa. «Lena lo devolvió así el jueves», dice. «Necesito saber qué pasó antes de arreglarlo». Este expediente es el más grande hasta ahora.",
      outro:
        'Lena reads your report and nods. "The juice box! I forgot it was in there." Mr. Ortiz dries the pages, and Lena gets a zipper bag for drinks. Detective Paz pins a gold detective badge on your shirt. "Three cases, three answers, and no guessing," she says. "Welcome to the club."',
      docs: [
        {
          id: "return",
          kind: "record",
          title: "Library return log",
          rows: [
            ["Book", "The Sea Turtle Trip"],
            ["Returned by", "Lena, Thursday at 3:30"],
            [
              "Librarian note",
              "Only the bottom corner is wet. It is sticky and smells like apples.",
            ],
            ["Library news", "New chairs arrive next week!"],
          ],
        },
        {
          id: "weather",
          kind: "schedule",
          title: "Weather this week",
          cols: ["Day", "Weather"],
          rows: [
            ["Monday", "Rain"],
            ["Tuesday", "Rain"],
            ["Wednesday", "Sunny"],
            ["Thursday", "Sunny, no rain all day"],
          ],
        },
        {
          id: "backpack",
          kind: "photo",
          title: "Inside Lena's backpack",
          art: "obj-book",
          caption:
            "The book was next to an empty apple juice box. The juice box has a small hole near the bottom.",
        },
        {
          id: "lena",
          kind: "witness",
          title: "What Lena said",
          who: "Lena",
          role: "student",
          said: "I walked home on Thursday. I did not open the book that day. The bottom of my backpack felt wet. This book is my favorite!",
        },
        {
          id: "ortiz",
          kind: "witness",
          title: "What Mr. Ortiz said",
          who: "Mr. Ortiz",
          role: "librarian",
          said: "Ten kids are waiting to read this book next.",
        },
      ],
      steps: [
        {
          id: "sort",
          type: "sort",
          docs: ["return", "weather", "backpack", "lena", "ortiz"],
          prompt: "Sort the clues. Does each clue help explain the wet book?",
          help: "Hay más pistas en este caso. Para cada una pregúntate: ¿me dice qué mojó el libro o cómo estaba el día? Si es un sentimiento o habla de otra cosa, no ayuda.",
          cats: CATS,
          reasons: [
            { id: "what", text: "It shows what made it wet" },
            { id: "day", text: "It tells what the day was like" },
            { id: "feeling", text: "It is a feeling, not a fact" },
            { id: "other", text: "It is about something else" },
          ],
          items: [
            {
              id: "apples",
              text: "The wet pages smell like apples.",
              cat: "relevant",
              reason: "what",
              clue: C(
                "A smell can tell you what liquid it was.",
                "Un olor te puede decir qué líquido fue.",
              ),
            },
            {
              id: "hole",
              text: "The juice box has a small hole.",
              cat: "relevant",
              reason: "what",
              clue: C(
                "What could come out of a hole in a juice box?",
                "¿Qué podría salir por un hoyo en una caja de jugo?",
              ),
            },
            {
              id: "corner",
              text: "Only the bottom corner is wet.",
              cat: "relevant",
              reason: "what",
              clue: C(
                "Where is the book wet? What was at the bottom of the backpack?",
                "¿Dónde está mojado el libro? ¿Qué había en el fondo de la mochila?",
              ),
            },
            {
              id: "sunny",
              text: "Thursday was sunny with no rain.",
              cat: "relevant",
              reason: "day",
              clue: C(
                "Could rain have made the book wet on Thursday?",
                "¿La lluvia pudo mojar el libro el jueves?",
              ),
            },
            {
              id: "favorite",
              text: "Lena says the book is her favorite.",
              cat: "irrelevant",
              reason: "feeling",
              clue: C(
                'Is "favorite" a fact about the water, or what Lena feels?',
                "¿«Favorite» es un dato sobre el agua o lo que siente Lena?",
              ),
            },
            {
              id: "ten",
              text: "Ten kids want to read the book next.",
              cat: "irrelevant",
              reason: "other",
              clue: C(
                "Does a waiting list tell you how the book got wet?",
                "¿Una lista de espera te dice cómo se mojó el libro?",
              ),
            },
            {
              id: "chairs",
              text: "New chairs arrive at the library next week.",
              cat: "irrelevant",
              reason: "other",
              clue: C("Is this about the book at all?", "¿Esto tiene que ver con el libro?"),
            },
          ],
          rule: C(
            "A clue helps only if it is a fact about this case. Feelings and other news do not help.",
            "Una pista solo ayuda si es un dato sobre este caso. Los sentimientos y otras noticias no ayudan.",
          ),
          explain:
            "The apple smell, the hole in the juice box and the wet bottom corner show what made it wet. The sunny weather tells us it was not rain. The rest is feelings or other news.",
        },
        {
          id: "choose",
          type: "choose",
          docs: ["return", "weather", "backpack", "lena"],
          prompt: "Why did the book come back wet? Pick the idea the clues support best.",
          help: "Prueba cada idea con las pistas: el olor a manzana, el clima del jueves, la caja de jugo y la parte del libro que está mojada.",
          options: [
            {
              id: "a",
              text: "Rain got it wet on the walk home.",
              why: "Lena did walk home. But check the weather for Thursday.",
            },
            {
              id: "b",
              text: "Lena dropped it in a puddle.",
              why: "A puddle needs rain. What does the weather chart say about Thursday? And would puddle water smell like apples?",
            },
            {
              id: "c",
              text: "The juice box leaked in the backpack.",
              ok: true,
              why: "Yes! The smell, the hole and the wet bottom all fit.",
            },
            {
              id: "d",
              text: "Lena spilled water while she was reading.",
              why: "Read what Lena said. Did she open the book on Thursday?",
            },
          ],
          rule: C(
            "The best idea fits every helpful clue. One clue against an idea is enough to drop it.",
            "La mejor idea encaja con todas las pistas que ayudan. Una pista en contra basta para descartar una idea.",
          ),
          explain:
            "The pages smell like apples, the juice box has a hole, and only the bottom corner is wet, where the juice would pool. Thursday was sunny, so it was not rain.",
        },
        {
          id: "strongest",
          type: "choose",
          docs: ["return", "weather", "backpack", "lena"],
          prompt: "Which clue is the strongest proof of what made the book wet?",
          help: "Una pista fuerte apunta a una sola respuesta. Pregúntate: ¿esta pista dice qué líquido fue o solo dice que algo estaba mojado?",
          options: [
            {
              id: "a",
              text: "Lena's backpack felt wet.",
              why: "This shows something was wet, but it does not say what.",
            },
            {
              id: "b",
              text: "The pages smell like apples.",
              ok: true,
              why: "Yes! Rain and puddles do not smell like apples.",
            },
            {
              id: "c",
              text: "Thursday was sunny.",
              why: "This helps rule out rain, but it does not tell you what the liquid was.",
            },
          ],
          rule: C(
            "The strongest clue points to only one answer.",
            "La pista más fuerte apunta a una sola respuesta.",
          ),
          explain: "The apple smell matches the apple juice box and nothing else in the case file.",
        },
        {
          id: "defend",
          type: "write",
          docs: ["return", "weather", "backpack"],
          prompt:
            "Write your report for Mr. Ortiz. What made the book wet? Give two clues and say why they matter.",
          help: "Escribe una o dos oraciones. Di qué mojó el libro. Nombra dos pistas (el olor, la caja de jugo con hoyo, la esquina de abajo) y explica por qué importan. Usa because o so.",
          check: {
            min: 14,
            ideas: [
              {
                any: ["juice*", "juice box"],
                clue: C("Say what made the book wet.", "Di qué mojó el libro."),
              },
              {
                any: ["apple*", "smell*", "sticky"],
                clue: C(
                  "Add what the librarian noticed about the pages.",
                  "Agrega lo que notó el bibliotecario sobre las páginas.",
                ),
              },
              {
                any: ["hole", "leak*", "bottom", "corner"],
                clue: C(
                  "Add a clue from the photo of the backpack.",
                  "Agrega una pista de la foto de la mochila.",
                ),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "A strong report gives the claim, two clues, and the word because to link them.",
            "Un buen reporte da la afirmación, dos pistas y la palabra because para unirlas.",
          ),
          frame: "The ___ leaked on the book because the pages ___ and the photo shows ___.",
          model:
            "The juice box leaked on the book because the pages smell like apples and the photo shows a hole in the juice box.",
          keep: "My claim and evidence",
        },
        {
          id: "answer",
          type: "write",
          docs: ["weather", "return"],
          npc: {
            who: "Leo",
            art: "char-leo",
            line: "I bet Lena dropped it in a puddle on the way home. That happens to me all the time!",
          },
          prompt:
            "Answer Leo. Say what is true, then use the weather or the smell to show why a puddle does not fit.",
          help: "Empieza con It is true that... (Lena sí caminó a casa). Luego usa but y una pista: el clima del jueves o el olor de las páginas. Puedes terminar con so.",
          check: {
            min: 14,
            ideas: [
              {
                any: ["sunny", "sun", "no rain", "did not rain", "didn't rain", "dry"],
                clue: C(
                  "Use the weather chart: what was Thursday like?",
                  "Usa la tabla del clima: ¿cómo estuvo el jueves?",
                ),
              },
            ],
            connector: ["contrast", "concession"],
          },
          rule: C(
            "Agree with what is true, then use but and a clue that goes against the other idea.",
            "Acepta lo que es verdad, luego usa but y una pista que va en contra de la otra idea.",
          ),
          frame: "It is true that ___, but the weather chart shows ___, so ___.",
          model:
            "It is true that Lena walked home, but the weather chart shows Thursday was sunny, so there were no puddles.",
          keep: "My answer to the other side",
        },
      ],
    },
    MUSEUM_35,
  ],
};

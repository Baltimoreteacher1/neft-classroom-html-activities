/*!
 * mentor-roster.js — Neft Lesson Platform · Unit 0 mentor roster (data only).
 *
 * The roster behind "Choose Your Math Mentor" (/mentor-lab/). Pure data: no DOM,
 * no storage, no side effects beyond defining window.NTMentorRoster. Loaded by
 * both the Unit 0 experience and assets/lesson-mentor.js.
 *
 * DESIGN RULES (enforced by assets/mentor-roster.test.mjs — read before editing):
 *
 *  1. A mentor is a MENTOR, not a costume. Copy never speaks in first person and
 *     never asks a student to "be" a real person who lived.
 *  2. No invented math. None of these people researched grade 6 ratios. The link
 *     to the curriculum is a HABIT OF MIND (the lab), never a topic.
 *  3. `rep` is an internal coverage tag. It guarantees the roster is diverse by
 *     construction and is asserted by the test. It is NEVER rendered, sorted on,
 *     filtered by, or shown to a student. Students browse by lab, or A-Z.
 *  4. Stories are STRUGGLE stories, not achievement stories. Achievement-only
 *     narratives do nothing for the students who need them most.
 *  5. Portraits are generated monogram medallions, never photographs — a wrong
 *     or unlicensed portrait of a real person is worse than no portrait.
 *
 * Every mentor: { id, name, say, years, where, lab, thought, did, struggle, rep }
 *   say      — plain-English pronunciation. A student will not choose a name
 *              they are afraid to say out loud.
 *   thought  — one line: what they actually thought about.
 *   did      — 1-2 sentences of real work.
 *   struggle — the honest hard part.
 */
(function () {
  "use strict";

  if (window.NTMentorRoster && window.NTMentorRoster.__loaded) return;

  /* ── The eight labs ──────────────────────────────────────────────────
   * The lab IS the thinking move. Each carries its own Spanish strings and
   * two vocabulary words, because the lab card is the first thing a student
   * reads and vocab-first is not optional here.
   */
  var LABS = [
    {
      "id": "noticing",
      "name": "The Noticing Lab",
      "move": "Notice before you calculate.",
      "blurb": "You look at a problem before you start pushing numbers around.",
      "sounds": "I like to look things over first.",
      "color": "#0f766e",
      "emblem": "◎",
      "tryIt": {
        "prompt": "Look at 48 + 27 + 52. Before adding left to right — notice anything?",
        "answer": "48 and 52 make 100. Noticing that first turns three additions into 100 + 27."
      },
      "es": {
        "name": "El Laboratorio de Observar",
        "move": "Observa antes de calcular.",
        "blurb": "Miras bien el problema antes de mover números.",
        "sounds": "Me gusta mirar bien las cosas primero."
      },
      "vocab": [
        {
          "word": "notice",
          "def": "to see something important before you act",
          "es": "notar"
        },
        {
          "word": "calculate",
          "def": "to work out an answer with numbers",
          "es": "calcular"
        }
      ]
    },
    {
      "id": "balance",
      "name": "The Balance Lab",
      "move": "Do the same thing to both sides.",
      "blurb": "You keep things fair and even, and you undo one step at a time.",
      "sounds": "I like rules that always work.",
      "color": "#b45309",
      "emblem": "⚖",
      "tryIt": {
        "prompt": "x + 7 = 12. What do you do to BOTH sides?",
        "answer": "Subtract 7 from both sides. The scale stays balanced, and x = 5."
      },
      "es": {
        "name": "El Laboratorio del Equilibrio",
        "move": "Haz lo mismo en los dos lados.",
        "blurb": "Mantienes todo parejo y deshaces un paso a la vez.",
        "sounds": "Me gustan las reglas que siempre funcionan."
      },
      "vocab": [
        {
          "word": "balance",
          "def": "both sides stay equal",
          "es": "equilibrio"
        },
        {
          "word": "undo",
          "def": "to reverse a step you already did",
          "es": "deshacer"
        }
      ]
    },
    {
      "id": "drawing",
      "name": "The Drawing Lab",
      "move": "Make it bigger and slower.",
      "blurb": "You draw the problem out instead of holding it in your head.",
      "sounds": "I understand things better when I can see them.",
      "color": "#7c3aed",
      "emblem": "✎",
      "tryIt": {
        "prompt": "A recipe uses 3 cups flour to 2 cups milk. Draw it. What do you draw?",
        "answer": "Three boxes and two boxes. Now doubling the recipe is obvious: six and four."
      },
      "es": {
        "name": "El Laboratorio de Dibujar",
        "move": "Hazlo más grande y más lento.",
        "blurb": "Dibujas el problema en vez de guardarlo en la cabeza.",
        "sounds": "Entiendo mejor cuando puedo verlo."
      },
      "vocab": [
        {
          "word": "model",
          "def": "a picture that shows how a problem works",
          "es": "modelo"
        },
        {
          "word": "represent",
          "def": "to show an idea another way",
          "es": "representar"
        }
      ]
    },
    {
      "id": "pattern",
      "name": "The Pattern Lab",
      "move": "Find what repeats.",
      "blurb": "You hunt for the part that happens again, then use it.",
      "sounds": "I notice when things repeat.",
      "color": "#be123c",
      "emblem": "❋",
      "tryIt": {
        "prompt": "2, 4, 8, 16, … what repeats here?",
        "answer": "Each step doubles. The repeating action is ×2 — that is the pattern, not the numbers."
      },
      "es": {
        "name": "El Laboratorio de Patrones",
        "move": "Busca lo que se repite.",
        "blurb": "Buscas la parte que pasa otra vez, y la usas.",
        "sounds": "Me doy cuenta cuando algo se repite."
      },
      "vocab": [
        {
          "word": "pattern",
          "def": "something that repeats in the same way",
          "es": "patrón"
        },
        {
          "word": "repeat",
          "def": "to happen again",
          "es": "repetir"
        }
      ]
    },
    {
      "id": "small-start",
      "name": "The Small-Start Lab",
      "move": "Try a smaller number first.",
      "blurb": "When a problem is too big, you shrink it until you can see it.",
      "sounds": "Big numbers freak me out a little.",
      "color": "#1d4ed8",
      "emblem": "▵",
      "tryIt": {
        "prompt": "Stuck on 25% of 840? Try it on a friendlier number first.",
        "answer": "25% of 100 is 25 — a quarter. So 25% of 840 is a quarter of 840, which is 210."
      },
      "es": {
        "name": "El Laboratorio del Comienzo Pequeño",
        "move": "Prueba primero con un número más pequeño.",
        "blurb": "Cuando el problema es muy grande, lo haces pequeño para verlo.",
        "sounds": "Los números grandes me asustan un poco."
      },
      "vocab": [
        {
          "word": "estimate",
          "def": "a smart guess that is close",
          "es": "estimar"
        },
        {
          "word": "simpler",
          "def": "easier, with smaller parts",
          "es": "más simple"
        }
      ]
    },
    {
      "id": "reality",
      "name": "The Reality Lab",
      "move": "Ask whether the answer makes sense.",
      "blurb": "You check your answer against the real world before you trust it.",
      "sounds": "I want to know if it's actually right.",
      "color": "#047857",
      "emblem": "◈",
      "tryIt": {
        "prompt": "You calculate that a pencil costs $340. What do you do?",
        "answer": "Stop. No pencil costs $340, so a step went wrong. Reality caught the error, not the arithmetic."
      },
      "es": {
        "name": "El Laboratorio de la Realidad",
        "move": "Pregunta si la respuesta tiene sentido.",
        "blurb": "Comparas tu respuesta con el mundo real antes de confiar en ella.",
        "sounds": "Quiero saber si de verdad está bien."
      },
      "vocab": [
        {
          "word": "reasonable",
          "def": "makes sense in the real world",
          "es": "razonable"
        },
        {
          "word": "check",
          "def": "to look again to be sure",
          "es": "revisar"
        }
      ]
    },
    {
      "id": "record",
      "name": "The Record Lab",
      "move": "Write down every try, then look back.",
      "blurb": "You keep track of what you tried so you never repeat a dead end.",
      "sounds": "I like to keep track of my work.",
      "color": "#a16207",
      "emblem": "▤",
      "tryIt": {
        "prompt": "Why write down a try that DIDN'T work?",
        "answer": "So you never spend time on it twice — and so you can see where the thinking turned."
      },
      "es": {
        "name": "El Laboratorio del Registro",
        "move": "Anota cada intento y luego revisa.",
        "blurb": "Apuntas lo que probaste para no repetir un camino sin salida.",
        "sounds": "Me gusta llevar apuntes de mi trabajo."
      },
      "vocab": [
        {
          "word": "record",
          "def": "to write down what you did",
          "es": "registrar"
        },
        {
          "word": "revise",
          "def": "to change your work to make it better",
          "es": "revisar"
        }
      ]
    },
    {
      "id": "second-way",
      "name": "The Second-Way Lab",
      "move": "Solve it again, a different way.",
      "blurb": "You check yourself by finding another route to the same answer.",
      "sounds": "I like finding my own way to do things.",
      "color": "#0369a1",
      "emblem": "⇄",
      "tryIt": {
        "prompt": "You got 1/2 of 18 = 9 by dividing. What is a second way?",
        "answer": "Split 18 into two equal piles and count one: 9. Two routes, same answer — now you trust it."
      },
      "es": {
        "name": "El Laboratorio del Segundo Camino",
        "move": "Resuélvelo otra vez, de otra manera.",
        "blurb": "Te revisas encontrando otro camino a la misma respuesta.",
        "sounds": "Me gusta encontrar mi propia manera de hacer las cosas."
      },
      "vocab": [
        {
          "word": "strategy",
          "def": "a plan for solving something",
          "es": "estrategia"
        },
        {
          "word": "verify",
          "def": "to prove your answer is right",
          "es": "verificar"
        }
      ]
    }
  ];

  /* ── Mentors ─────────────────────────────────────────────────────────
   * `face` drives assets/mentor-avatar.js — descriptive drawing features,
   * never a category. `simple` is the plain-language line (ESOL/Level 1).
   * `es` carries the short Spanish strings; long stories use read-aloud.
   * Ordered A–Z by name at render time, never grouped by `rep`.
   */
  var MENTORS = [
    {
      "id": "benjamin-banneker",
      "name": "Benjamin Banneker",
      "say": "BEN-ja-min BAN-uh-ker",
      "years": "1731–1806",
      "where": "Maryland, United States",
      "lab": "record",
      "rep": "black-men",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s6",
        "hair": "short",
        "hairColor": "white",
        "clothes": "cravat",
        "clothesColor": "#3f4c63"
      },
      "thought": "How to predict where the stars and planets would be, months ahead.",
      "simple": "He taught himself to predict where the stars would be.",
      "did": "Taught himself astronomy from borrowed books and calculated the star and tide tables for a series of almanacs — page after page of arithmetic, all by hand. He also built a striking wooden clock, carving every gear himself, after taking apart a pocket watch to see how it worked.",
      "struggle": "He had almost no formal schooling and no teacher. Everything he learned about astronomy came from books lent to him by a neighbor, worked through alone at night at a table by the window. His first attempt at an almanac was rejected by publishers. He kept the calculations, corrected them, and tried again the next year.",
      "es": {
        "thought": "Cómo predecir dónde estarían las estrellas y los planetas.",
        "simple": "Aprendió solo a predecir dónde estarían las estrellas."
      }
    },
    {
      "id": "david-blackwell",
      "name": "David Blackwell",
      "say": "DAY-vid BLACK-well",
      "years": "1919–2010",
      "where": "Illinois, United States",
      "lab": "reality",
      "rep": "black-men",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "receding",
        "hairColor": "saltpepper",
        "clothes": "suit",
        "tie": "#7f1d1d"
      },
      "thought": "How to make the best decision when you do not have all the information.",
      "simple": "He studied how to choose well when you are not sure.",
      "did": "Worked on statistics and game theory — the mathematics of choosing well under uncertainty. He wrote a statistics textbook so clear it is still read today, and he was the first Black scholar elected to the National Academy of Sciences.",
      "struggle": "He earned his PhD at 22, and then could not get hired. He applied to universities that would not consider a Black professor, and spent a year at Princeton where his appointment was objected to. He taught at Howard University for ten years before Berkeley finally offered him a position.",
      "es": {
        "thought": "Cómo tomar la mejor decisión sin tener toda la información.",
        "simple": "Estudió cómo decidir bien cuando no estás seguro."
      }
    },
    {
      "id": "elbert-cox",
      "name": "Elbert Frank Cox",
      "say": "EL-bert FRANK COX",
      "years": "1895–1969",
      "where": "Indiana, United States",
      "lab": "small-start",
      "rep": "black-men",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "short",
        "hairColor": "black",
        "clothes": "suit",
        "tie": "#1e3a5f"
      },
      "thought": "How to solve equations by starting with the simplest possible case.",
      "simple": "He was the first Black person in the world with a math PhD.",
      "did": "In 1925 he became the first Black person in the world to earn a PhD in mathematics. He then taught for decades at Howard University, where he mentored generations of students who went on to their own mathematics careers.",
      "struggle": "To have his doctorate recognized internationally, his dissertation had to be accepted by a university abroad — and he had to have it translated. Two universities turned it away before one in Japan accepted it. He paid for the translation himself.",
      "es": {
        "thought": "Cómo resolver ecuaciones empezando por el caso más simple.",
        "simple": "Fue la primera persona negra del mundo con un doctorado en matemáticas."
      }
    },
    {
      "id": "ernest-wilkins",
      "name": "J. Ernest Wilkins Jr.",
      "say": "ER-nist WILL-kinz",
      "years": "1923–2011",
      "where": "Illinois, United States",
      "lab": "small-start",
      "rep": "black-men",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "short",
        "hairColor": "black",
        "clothes": "suit",
        "tie": "#334155"
      },
      "thought": "How to break an enormous physics problem into layers you can handle.",
      "simple": "He started college at 13 and finished his PhD at 19.",
      "did": "Entered the University of Chicago at 13 and finished his PhD in mathematics at 19. He later worked on how radiation passes through matter — mathematics still used today in shielding design.",
      "struggle": "Newspapers called him a 'negro genius,' which followed him for years and reduced decades of real work to a headline about his age. After the war, despite his record, he could not get an academic job in the segregated South and worked in industry for much of his career.",
      "es": {
        "thought": "Cómo partir un problema enorme en capas que sí puedes manejar.",
        "simple": "Entró a la universidad a los 13 años y terminó su doctorado a los 19."
      }
    },
    {
      "id": "arlie-petters",
      "name": "Arlie Petters",
      "say": "AR-lee PET-erz",
      "years": "born 1964",
      "where": "Belize, and the United States",
      "lab": "drawing",
      "rep": "black-men",
      "face": {
        "beard": "short",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s6",
        "hair": "short",
        "hairColor": "black",
        "clothes": "collar",
        "clothesColor": "#1e40af"
      },
      "thought": "How gravity bends light, and what that bending lets us see.",
      "simple": "He works out how gravity bends light in space.",
      "did": "Built the mathematics of gravitational lensing — describing how the light from a distant star curves around a heavy object in between, so astronomers can work out what is there even when they cannot see it directly.",
      "struggle": "He grew up in Belize and did not meet his father until he was a teenager, when he moved to New York. He arrived in a new country and a new school system at once, and had to work out where he fit while learning mathematics far beyond what his school offered.",
      "es": {
        "thought": "Cómo la gravedad dobla la luz, y qué nos deja ver ese doblez.",
        "simple": "Estudia cómo la gravedad dobla la luz en el espacio."
      }
    },
    {
      "id": "clarence-stephens",
      "name": "Clarence Stephens",
      "say": "CLAIR-ence STEE-vens",
      "years": "1917–2018",
      "where": "North Carolina, United States",
      "lab": "noticing",
      "rep": "black-men",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "receding",
        "hairColor": "gray",
        "clothes": "suit",
        "tie": "#166534"
      },
      "thought": "Why some students believe they can do mathematics, and others do not.",
      "simple": "He proved that ordinary students can be great at math.",
      "did": "Built a way of teaching — later called the Potsdam Model — that took ordinary students and produced an extraordinary number of mathematics majors, by assuming every student could succeed and building a community rather than a filter.",
      "struggle": "He was orphaned young and raised by relatives. He was the ninth Black American to earn a mathematics PhD, at a time when almost no university would hire one. He spent his career at colleges that were overlooked, and proved there that the students were never the problem.",
      "es": {
        "thought": "Por qué unos estudiantes creen que pueden con las matemáticas y otros no.",
        "simple": "Demostró que cualquier estudiante puede ser bueno en matemáticas."
      }
    },
    {
      "id": "katherine-johnson",
      "name": "Katherine Johnson",
      "say": "KATH-rin JOHN-son",
      "years": "1918–2020",
      "where": "West Virginia, United States",
      "lab": "reality",
      "rep": "black-women",
      "face": {
        "beard": "none",
        "glasses": "round",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "curls",
        "hairColor": "white",
        "clothes": "dress",
        "clothesColor": "#1e3a5f",
        "earrings": "#f5f5f4"
      },
      "thought": "Exactly where a spacecraft would be, and exactly when.",
      "simple": "She checked NASA's computer by hand so astronauts could fly.",
      "did": "Calculated flight paths for NASA — including the trajectory for the first American in space, and the orbital return path for John Glenn. When NASA began using electronic computers, Glenn asked for her to check the machine's numbers by hand before he would fly.",
      "struggle": "She worked in a building where she was not allowed to use the same bathroom or coffee pot as her colleagues, and was initially left off the meetings where the work she was doing was discussed. She asked to attend anyway, repeatedly, until they stopped saying no.",
      "es": {
        "thought": "Exactamente dónde estaría una nave espacial, y exactamente cuándo.",
        "simple": "Revisó a mano la computadora de la NASA para que los astronautas pudieran volar."
      }
    },
    {
      "id": "dorothy-vaughan",
      "name": "Dorothy Vaughan",
      "say": "DOR-uh-thee VAWN",
      "years": "1910–2008",
      "where": "Missouri, United States",
      "lab": "pattern",
      "rep": "black-women",
      "face": {
        "beard": "none",
        "glasses": "cateye",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "bob",
        "hairColor": "black",
        "clothes": "dress",
        "clothesColor": "#7c2d12"
      },
      "thought": "How to get a machine to do the repeating work.",
      "simple": "She learned computer code early and taught her whole team.",
      "did": "Led NASA's West Area Computing group, then saw that electronic computers were about to replace hand calculation — so she taught herself the FORTRAN programming language and taught it to her whole team before the change arrived.",
      "struggle": "She ran her group for years before NASA would give her the title of supervisor. When the machines came, she understood that her team's jobs were about to disappear, and rather than wait for it, she retrained every one of them.",
      "es": {
        "thought": "Cómo lograr que una máquina haga el trabajo repetitivo.",
        "simple": "Aprendió programación antes que nadie y le enseñó a todo su equipo."
      }
    },
    {
      "id": "mary-jackson",
      "name": "Mary Jackson",
      "say": "MAIR-ee JACK-son",
      "years": "1921–2005",
      "where": "Virginia, United States",
      "lab": "second-way",
      "rep": "black-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "curls",
        "hairColor": "black",
        "clothes": "dress",
        "clothesColor": "#065f46"
      },
      "thought": "What the air actually does around a wing, rather than what it should do.",
      "simple": "She tested real air on wings instead of just predicting it.",
      "did": "Became NASA's first Black female engineer, analyzing data from wind tunnel experiments — testing real air against the predictions, at nearly twice the speed of sound. Later she left engineering deliberately to work on hiring and promoting other women at NASA.",
      "struggle": "The engineering courses she needed were taught at a segregated white high school. She had to petition the City of Hampton for permission to attend classes in a building she was otherwise barred from entering — and then sit through them as the only Black student in the room.",
      "es": {
        "thought": "Qué hace el aire de verdad alrededor de un ala, no lo que debería hacer.",
        "simple": "Probó el aire real en las alas en vez de solo predecirlo."
      }
    },
    {
      "id": "gladys-west",
      "name": "Gladys West",
      "say": "GLAD-iss WEST",
      "years": "born 1930",
      "where": "Virginia, United States",
      "lab": "reality",
      "rep": "black-women",
      "face": {
        "beard": "none",
        "glasses": "round",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "curls",
        "hairColor": "gray",
        "clothes": "dress",
        "clothesColor": "#5b21b6",
        "earrings": "#f5f5f4"
      },
      "thought": "What shape the Earth really is — not the smooth ball in the textbook.",
      "simple": "Her model of Earth's real shape helps GPS know where you are.",
      "did": "Programmed the calculations that modeled the Earth's true, slightly lumpy shape using satellite data. That model is part of the foundation that makes GPS accurate — the reason a phone can tell you which street you are standing on.",
      "struggle": "She grew up on a farm where the expected future was farm work or a tobacco factory, and she studied her way out by finishing first in her high school class for a scholarship. For decades almost no one knew what her work had become; the GPS connection only became widely known after she had retired.",
      "es": {
        "thought": "Qué forma tiene de verdad la Tierra, no la bola lisa del libro.",
        "simple": "Su modelo de la forma real de la Tierra ayuda al GPS a saber dónde estás."
      }
    },
    {
      "id": "euphemia-haynes",
      "name": "Euphemia Lofton Haynes",
      "say": "yoo-FEE-mee-uh LOFF-ton HAYNZ",
      "years": "1890–1980",
      "where": "Washington, D.C., United States",
      "lab": "noticing",
      "rep": "black-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "bun",
        "hairColor": "saltpepper",
        "clothes": "dress",
        "clothesColor": "#1f2937",
        "earrings": "#f5f5f4"
      },
      "thought": "What we actually mean when we say two amounts have a ratio.",
      "simple": "She worked out the rules underneath every ratio problem.",
      "did": "In 1943 she became the first Black American woman to earn a PhD in mathematics. Her dissertation worked out the careful rules underneath comparing two quantities — the ideas that sit under every ratio problem. She then spent 47 years teaching in D.C. schools and fought to end their segregated 'track' system.",
      "struggle": "She earned her doctorate at 52, having taught full time the entire way. When she later served on the school board, she was arguing against a tracking system that was steering Black students out of exactly the mathematics she had spent her life on.",
      "es": {
        "thought": "Qué queremos decir de verdad cuando decimos que dos cantidades tienen una razón.",
        "simple": "Descubrió las reglas que están debajo de cada problema de razones."
      }
    },
    {
      "id": "marjorie-lee-browne",
      "name": "Marjorie Lee Browne",
      "say": "MAR-jor-ee LEE BROWN",
      "years": "1914–1979",
      "where": "Tennessee, United States",
      "lab": "pattern",
      "rep": "black-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "bun",
        "hairColor": "black",
        "clothes": "dress",
        "clothesColor": "#7f1d1d"
      },
      "thought": "The structures that stay the same no matter how you turn them.",
      "simple": "She studied shapes that stay the same when you turn them.",
      "did": "One of the first Black American women to earn a mathematics PhD. She built the mathematics department at North Carolina Central University, and won one of the first grants that put computers into a historically Black college.",
      "struggle": "Her mother died when she was two. She loved mathematics but was steered toward teaching as the only realistic path, and did her doctoral work while teaching full time. She spent her own money on her students' tuition, quietly, for years.",
      "es": {
        "thought": "Las estructuras que no cambian sin importar cómo las gires.",
        "simple": "Estudió formas que siguen iguales aunque las gires."
      }
    },
    {
      "id": "evelyn-boyd-granville",
      "name": "Evelyn Boyd Granville",
      "say": "EV-uh-lin BOYD GRAN-vill",
      "years": "1924–2023",
      "where": "Washington, D.C., United States",
      "lab": "record",
      "rep": "black-women",
      "face": {
        "beard": "none",
        "glasses": "cateye",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s5",
        "hair": "curls",
        "hairColor": "saltpepper",
        "clothes": "dress",
        "clothesColor": "#0f766e"
      },
      "thought": "The exact path a spacecraft takes, computed before anyone flies it.",
      "simple": "She programmed the paths that rockets would fly.",
      "did": "The second Black American woman to earn a mathematics PhD. She wrote computer programs for the Vanguard and Mercury space programs, calculating orbits and rocket trajectories, and later spent decades teaching mathematics to future teachers.",
      "struggle": "She graduated from Yale with a doctorate and was still turned down for teaching positions. Told later in life that she must have faced discrimination, she said she had simply been unaware of it at the time — she had been too busy doing the work to be stopped by it.",
      "es": {
        "thought": "El camino exacto de una nave, calculado antes de que alguien vuele.",
        "simple": "Programó los caminos que volarían los cohetes."
      }
    },
    {
      "id": "federico-ardila",
      "name": "Federico Ardila",
      "say": "feh-deh-REE-koh ar-DEE-lah",
      "years": "born 1977",
      "where": "Colombia, and the United States",
      "lab": "second-way",
      "rep": "hispanic-men",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s3",
        "hair": "wave",
        "hairColor": "darkbrown",
        "clothes": "collar",
        "clothesColor": "#0f766e"
      },
      "thought": "How many ways can this be arranged — and can I count it a different way?",
      "simple": "He counts how many ways things can be arranged.",
      "did": "Works in combinatorics, the mathematics of counting arrangements. He is also known for a short list of rules he teaches by: that mathematical talent is distributed equally across all people, and that everyone in a room deserves to be there.",
      "struggle": "He arrived in the United States for graduate school from Colombia, and has written about how much of the culture of elite mathematics is unspoken — who is assumed to belong, who is assumed to be lost. He now builds classrooms and research groups deliberately designed so that assumption is not made.",
      "es": {
        "thought": "¿De cuántas maneras se puede acomodar esto? ¿Y puedo contarlo de otra forma?",
        "simple": "Cuenta de cuántas maneras se pueden acomodar las cosas."
      }
    },
    {
      "id": "luis-caffarelli",
      "name": "Luis Caffarelli",
      "say": "loo-EES kaff-ah-REL-lee",
      "years": "born 1948",
      "where": "Argentina, and the United States",
      "lab": "noticing",
      "rep": "hispanic-men",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s2",
        "hair": "receding",
        "hairColor": "white",
        "clothes": "suit",
        "tie": "#1e40af"
      },
      "thought": "The exact edge where something changes from one state to another.",
      "simple": "He studies the exact edge where ice turns into water.",
      "did": "Studies free boundary problems — for example, the moving line where ice meets the water it is melting into. In 2023 he received the Abel Prize, one of the highest honors in mathematics, and the first ever awarded to a Latin American mathematician.",
      "struggle": "He trained in Argentina during a period of severe political turmoil, when universities were raided and faculty forced out. Many of his generation of Argentine scientists left the country; he built his career abroad while much of the mathematical community he came from was scattered.",
      "es": {
        "thought": "El borde exacto donde algo cambia de un estado a otro.",
        "simple": "Estudia el borde exacto donde el hielo se vuelve agua."
      }
    },
    {
      "id": "carlos-castillo-chavez",
      "name": "Carlos Castillo-Chávez",
      "say": "KAR-lohs kas-TEE-yoh CHAH-vez",
      "years": "born 1952",
      "where": "Mexico, and the United States",
      "lab": "drawing",
      "rep": "hispanic-men",
      "face": {
        "beard": "mustache",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s3",
        "hair": "short",
        "hairColor": "gray",
        "clothes": "suit",
        "tie": "#7f1d1d"
      },
      "thought": "How fast something spreads through a population, and what slows it down.",
      "simple": "He uses math to show how fast a sickness spreads.",
      "did": "Builds mathematical models of how diseases move through communities — work that helped shape how public health officials plan for outbreaks. He also founded a summer institute that has mentored hundreds of Latino and Black students into mathematics PhDs.",
      "struggle": "He came to the United States at 18 and worked in a factory, then as a night janitor, while learning English. He did not begin a doctorate until years later, in his thirties, after a stretch of teaching high school.",
      "es": {
        "thought": "Qué tan rápido se contagia algo en una población, y qué lo frena.",
        "simple": "Usa matemáticas para mostrar qué tan rápido se contagia una enfermedad."
      }
    },
    {
      "id": "alberto-calderon",
      "name": "Alberto Calderón",
      "say": "al-BAIR-toh kal-deh-ROHN",
      "years": "1920–1998",
      "where": "Argentina, and the United States",
      "lab": "small-start",
      "rep": "hispanic-men",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s2",
        "hair": "short",
        "hairColor": "darkbrown",
        "clothes": "suit",
        "tie": "#334155"
      },
      "thought": "If you zoom in far enough on something complicated, does it get simple?",
      "simple": "He zoomed in on hard problems until they looked simple.",
      "did": "Co-created a set of tools — now called Calderón–Zygmund theory — for breaking a complicated function into pieces simple enough to analyze. The methods are foundational to the mathematics behind signal and image processing.",
      "struggle": "His father pushed him toward engineering, so he trained and worked as an engineer at an oil company first, doing mathematics on the side. He did not begin his mathematical career properly until a visiting professor noticed him and told him to come to Chicago.",
      "es": {
        "thought": "Si te acercas lo suficiente a algo complicado, ¿se vuelve simple?",
        "simple": "Se acercaba a los problemas difíciles hasta que se veían simples."
      }
    },
    {
      "id": "jose-adem",
      "name": "José Adem",
      "say": "ho-SEH ah-DEM",
      "years": "1921–1991",
      "where": "Mexico",
      "lab": "pattern",
      "rep": "hispanic-men",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s3",
        "hair": "short",
        "hairColor": "black",
        "clothes": "suit",
        "tie": "#166534"
      },
      "thought": "What happens when you do the same operation twice in a row.",
      "simple": "He found what happens when you repeat the same step twice.",
      "did": "Discovered relationships — now called the Adem relations — describing what happens when certain operations in topology are composed. He then returned to Mexico and helped build its national mathematics research institute.",
      "struggle": "He came from a family of Lebanese immigrants to Mexico, and studied at a time when Mexico had almost no research mathematics of its own. Doing serious work meant leaving; building something at home meant coming back and starting a research culture that did not yet exist.",
      "es": {
        "thought": "Qué pasa cuando haces la misma operación dos veces seguidas.",
        "simple": "Descubrió qué pasa cuando repites el mismo paso dos veces."
      }
    },
    {
      "id": "rodrigo-banuelos",
      "name": "Rodrigo Bañuelos",
      "say": "roh-DREE-goh ban-YWEH-lohs",
      "years": "born 1954",
      "where": "Mexico, and the United States",
      "lab": "record",
      "rep": "hispanic-men",
      "face": {
        "beard": "mustache",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s4",
        "hair": "short",
        "hairColor": "saltpepper",
        "clothes": "collar",
        "clothesColor": "#1e3a5f"
      },
      "thought": "Where a wandering, random path is likely to end up.",
      "simple": "He studies where a random path is likely to end up.",
      "did": "Studies probability and the mathematics of random motion — how something that moves unpredictably still follows describable rules over time. He has spent much of his career mentoring students from backgrounds like his own into mathematics.",
      "struggle": "He came to California from rural Mexico at 15 and worked in the fields with his family. He learned English in high school, went to community college, and only then moved on to a university — a route almost nobody in research mathematics takes.",
      "es": {
        "thought": "Dónde es probable que termine un camino que se mueve al azar.",
        "simple": "Estudia dónde puede terminar un camino que se mueve al azar."
      }
    },
    {
      "id": "ruth-gonzalez",
      "name": "Ruth Gonzalez",
      "say": "ROOTH gon-ZAH-lez",
      "years": "born 1954",
      "where": "Texas, United States",
      "lab": "drawing",
      "rep": "hispanic-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s3",
        "hair": "wave",
        "hairColor": "darkbrown",
        "clothes": "dress",
        "clothesColor": "#7c2d12"
      },
      "thought": "How to see the shape of rock miles underground without digging.",
      "simple": "She used math to see rock deep underground.",
      "did": "In 1986 she became the first Hispanic American woman to earn a PhD in mathematics. She worked as a geophysicist, using mathematics to turn echoes of sound waves into pictures of the rock layers below the surface.",
      "struggle": "She was one of very few women and the only Hispanic student through most of her training, in a field where the assumption was that she was in the wrong room. She has described deliberately learning not to spend energy on that assumption.",
      "es": {
        "thought": "Cómo ver la forma de la roca a kilómetros bajo tierra sin excavar.",
        "simple": "Usó matemáticas para ver la roca muy por debajo de la tierra."
      }
    },
    {
      "id": "pamela-harris",
      "name": "Pamela E. Harris",
      "say": "PAM-uh-luh HAIR-iss",
      "years": "born 1983",
      "where": "Mexico, and the United States",
      "lab": "second-way",
      "rep": "hispanic-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s3",
        "hair": "wavylong",
        "hairColor": "darkbrown",
        "clothes": "dress",
        "clothesColor": "#5b21b6"
      },
      "thought": "How many ways there are to build something, counted exactly.",
      "simple": "She counts the exact number of ways to build something.",
      "did": "Works in combinatorics — counting the number of ways structures can be assembled. She also co-founded projects that make the mathematics community visible to students who have never seen a mathematician who looks like them.",
      "struggle": "Her family moved to the United States when she was a child and she was undocumented for years, which meant she could not apply for most scholarships or federal aid and could not be certain she would be allowed to stay. She has written openly about doing a mathematics degree without knowing whether she would be permitted to finish it.",
      "es": {
        "thought": "Cuántas maneras hay de construir algo, contadas con exactitud.",
        "simple": "Cuenta el número exacto de maneras de construir algo."
      }
    },
    {
      "id": "alicia-dickenstein",
      "name": "Alicia Dickenstein",
      "say": "ah-LEE-see-ah DIK-en-stine",
      "years": "born 1955",
      "where": "Argentina",
      "lab": "balance",
      "rep": "hispanic-women",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s2",
        "hair": "bob",
        "hairColor": "gray",
        "clothes": "dress",
        "clothesColor": "#0f766e"
      },
      "thought": "How to turn a shape into an equation, and an equation back into a shape.",
      "simple": "She turns shapes into equations, and back again.",
      "did": "Works in algebraic geometry, connecting geometric shapes to the polynomial equations that describe them — including applications to chemistry and biology. She served as a Vice President of the International Mathematical Union.",
      "struggle": "She studied and taught in Argentina through the years of the military dictatorship, when the university was under direct control and colleagues disappeared. She stayed and built a research group there rather than leaving, in a system with very little funding for it.",
      "es": {
        "thought": "Cómo convertir una forma en una ecuación, y una ecuación en forma.",
        "simple": "Convierte formas en ecuaciones, y ecuaciones en formas."
      }
    },
    {
      "id": "tatiana-toro",
      "name": "Tatiana Toro",
      "say": "tah-tee-AH-nah TOH-roh",
      "years": "born 1964",
      "where": "Colombia, and the United States",
      "lab": "noticing",
      "rep": "hispanic-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s3",
        "hair": "long",
        "hairColor": "darkbrown",
        "clothes": "dress",
        "clothesColor": "#1e40af"
      },
      "thought": "How rough a surface can be and still behave like a smooth one.",
      "simple": "She measures shapes that are too bumpy for normal geometry.",
      "did": "Studies geometric measure theory — the mathematics of measuring shapes that are too jagged for ordinary geometry. She has led the Simons Laufer Mathematical Sciences Institute, one of the world's major mathematics research centers.",
      "struggle": "She came to mathematics through Colombian mathematical olympiads and then left for graduate school abroad, joining a field where almost nobody shared her background or her first language. She has spoken about the work of building a career while being consistently the only one.",
      "es": {
        "thought": "Qué tan áspera puede ser una superficie y aun así portarse como una lisa.",
        "simple": "Mide formas demasiado irregulares para la geometría normal."
      }
    },
    {
      "id": "erika-camacho",
      "name": "Erika Tatiana Camacho",
      "say": "eh-REE-kah tah-tee-AH-nah kah-MAH-choh",
      "years": "born 1974",
      "where": "Mexico, and the United States",
      "lab": "drawing",
      "rep": "hispanic-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s3",
        "hair": "wavylong",
        "hairColor": "black",
        "clothes": "dress",
        "clothesColor": "#be123c"
      },
      "thought": "Why the cells in an eye die, modeled as a system you can write down.",
      "simple": "She models the cells in the eye to understand blindness.",
      "did": "Builds mathematical models of the retina — describing how photoreceptor cells support each other, to understand degenerative diseases that cause blindness. She has also worked at the National Science Foundation on widening access to mathematics.",
      "struggle": "She grew up in East Los Angeles, where her high school teacher Jaime Escalante taught her calculus. Her closest friend from that class died by suicide during college. Camacho has said she continued in mathematics in part to carry the work they had planned to do together.",
      "es": {
        "thought": "Por qué mueren las células del ojo, escrito como un sistema.",
        "simple": "Modela las células del ojo para entender la ceguera."
      }
    },
    {
      "id": "argelia-velez-rodriguez",
      "name": "Argelia Vélez-Rodríguez",
      "say": "ar-HEH-lee-ah VEH-les rod-REE-gez",
      "years": "born 1936",
      "where": "Cuba, and the United States",
      "lab": "record",
      "rep": "hispanic-women",
      "face": {
        "beard": "none",
        "glasses": "cateye",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s4",
        "hair": "curls",
        "hairColor": "gray",
        "clothes": "dress",
        "clothesColor": "#7f1d1d",
        "earrings": "#d4af37"
      },
      "thought": "How to fit a smooth curve to scattered measurements.",
      "simple": "She fits smooth curves to scattered measurements.",
      "did": "In 1960 she became the first Black Cuban woman to earn a doctorate in mathematics in Cuba, working on the theory of certain polynomials. She later directed programs in the U.S. Department of Education aimed at widening access to science and mathematics.",
      "struggle": "She left Cuba in 1962 as a political refugee with her two young children, arriving in the United States with her doctorate and no recognized credentials. She rebuilt her career from the beginning, teaching at community colleges before her qualifications counted again.",
      "es": {
        "thought": "Cómo ajustar una curva suave a medidas dispersas.",
        "simple": "Ajusta curvas suaves a medidas dispersas."
      }
    },
    {
      "id": "rene-descartes",
      "name": "René Descartes",
      "say": "ruh-NAY day-CART",
      "years": "1596–1650",
      "where": "France",
      "lab": "drawing",
      "rep": "white-men",
      "face": {
        "beard": "mustache",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "long",
        "hairColor": "darkbrown",
        "clothes": "ruff",
        "clothesColor": "#1f2937"
      },
      "thought": "How to turn a picture into numbers, and numbers back into a picture.",
      "simple": "He invented the grid with an x-axis and a y-axis.",
      "did": "Connected algebra to geometry by putting shapes on a grid of numbered lines — which is why the coordinate plane is called Cartesian. Every graph with an x-axis and a y-axis descends from this idea.",
      "struggle": "He was a sickly child and was allowed to stay in bed late into the morning at school, a habit he kept for life and did his thinking in. He published carefully and slowly, and withheld one book entirely after hearing that Galileo had been condemned for saying something similar.",
      "es": {
        "thought": "Cómo convertir un dibujo en números, y los números otra vez en dibujo.",
        "simple": "Inventó la cuadrícula con el eje x y el eje y."
      }
    },
    {
      "id": "carl-friedrich-gauss",
      "name": "Carl Friedrich Gauss",
      "say": "KARL FREE-drikh GOWSS",
      "years": "1777–1855",
      "where": "Germany",
      "lab": "noticing",
      "rep": "white-men",
      "face": {
        "beard": "sideburns",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "cap",
        "wrapColor": "#3b2f2f",
        "hairColor": "white",
        "clothes": "cravat",
        "clothesColor": "#1f2937"
      },
      "thought": "Whether there is a shortcut hiding in a problem everyone is grinding through.",
      "simple": "As a boy he added 1 to 100 in seconds by pairing numbers.",
      "did": "As a schoolboy, told to add every number from 1 to 100, he noticed the numbers could be paired — 1 with 100, 2 with 99, and so on — fifty pairs of 101. He gave the answer almost immediately. He went on to reshape number theory, geometry, and astronomy.",
      "struggle": "His father was a bricklayer who saw no reason for him to stay in school and expected him to enter a trade. He only continued because a teacher noticed him and argued for him. Later, he sat on discoveries for years without publishing, and had to watch others announce them first.",
      "es": {
        "thought": "Si hay un atajo escondido en un problema que todos hacen a la fuerza.",
        "simple": "De niño sumó del 1 al 100 en segundos formando parejas."
      }
    },
    {
      "id": "leonhard-euler",
      "name": "Leonhard Euler",
      "say": "LAY-on-hart OY-ler",
      "years": "1707–1783",
      "where": "Switzerland, and Russia",
      "lab": "drawing",
      "rep": "white-men",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "cap",
        "wrapColor": "#4b5563",
        "hairColor": "white",
        "clothes": "cravat",
        "clothesColor": "#3f4c63"
      },
      "thought": "How to redraw a messy real situation as a simple diagram of dots and lines.",
      "simple": "He kept doing math after he went blind.",
      "did": "Asked whether you could walk the seven bridges of Königsberg crossing each exactly once, he threw away the map and drew only the connections — inventing graph theory, and proving it was impossible. He is among the most productive mathematicians who ever lived.",
      "struggle": "He lost sight in one eye in his thirties and went almost completely blind by around sixty. Rather than stopping, he dictated his work to assistants and produced roughly half of his total output after losing his sight, holding the calculations in his head.",
      "es": {
        "thought": "Cómo volver a dibujar una situación real como un diagrama simple de puntos y líneas.",
        "simple": "Siguió haciendo matemáticas después de quedar ciego."
      }
    },
    {
      "id": "blaise-pascal",
      "name": "Blaise Pascal",
      "say": "BLEZZ pas-KAL",
      "years": "1623–1662",
      "where": "France",
      "lab": "pattern",
      "rep": "white-men",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "wavylong",
        "hairColor": "brown",
        "clothes": "ruff",
        "clothesColor": "#1f2937"
      },
      "thought": "How to build the next row of a pattern out of the row above it.",
      "simple": "He built a triangle where each number is the two above it added.",
      "did": "Studied the triangle of numbers that now carries his name, where every entry is the sum of the two above it. With Fermat he worked out the beginnings of probability — how to reason about what is likely rather than what is certain.",
      "struggle": "He was ill for most of his short life and in frequent pain. At 19 he built a mechanical calculator to spare his father months of tax arithmetic, and spent three years and around fifty failed prototypes getting it to work. He died at 39.",
      "es": {
        "thought": "Cómo construir la siguiente fila de un patrón con la fila de arriba.",
        "simple": "Hizo un triángulo donde cada número es la suma de los dos de arriba."
      }
    },
    {
      "id": "fibonacci",
      "name": "Leonardo of Pisa (Fibonacci)",
      "say": "fee-boh-NAH-chee",
      "years": "about 1170–1250",
      "where": "Italy, and North Africa",
      "lab": "pattern",
      "rep": "white-men",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#fde68a",
        "eyes": "#3b2416",
        "skin": "s2",
        "hair": "cap",
        "wrapColor": "#7c2d12",
        "hairColor": "brown",
        "clothes": "robe",
        "clothesColor": "#7c2d12"
      },
      "thought": "Whether there is a better way to write numbers than the one everyone uses.",
      "simple": "He brought the numbers 0 to 9 into Europe.",
      "did": "Grew up around the trading ports of North Africa, learned the Hindu-Arabic digits 0–9 there, and wrote the book that brought them into European use — replacing Roman numerals. The sequence named after him, where each number is the sum of the two before it, appeared in one small example in that book.",
      "struggle": "Merchants and officials resisted the new digits for generations — some cities banned them, suspecting they were easier to alter in an account book than Roman numerals. The system he argued for took roughly three centuries to fully replace the one it beat.",
      "es": {
        "thought": "Si hay una forma mejor de escribir números que la que todos usan.",
        "simple": "Llevó los números del 0 al 9 a Europa."
      }
    },
    {
      "id": "archimedes",
      "name": "Archimedes",
      "say": "ar-kih-MEE-deez",
      "years": "about 287–212 BCE",
      "where": "Syracuse, Sicily",
      "lab": "small-start",
      "rep": "white-men",
      "face": {
        "beard": "full",
        "glasses": "none",
        "clothesAccent": "#f5f5f4",
        "eyes": "#3b2416",
        "skin": "s2",
        "hair": "short",
        "hairColor": "gray",
        "clothes": "robe",
        "clothesColor": "#b8a888"
      },
      "thought": "How to measure a curved thing using straight things you already understand.",
      "simple": "He found a circle's area by squeezing it between shapes.",
      "did": "Found the area of a circle by squeezing it between polygons drawn inside and outside it, then adding more and more sides until the gap almost closed. That squeezing idea is the seed of calculus, about two thousand years early.",
      "struggle": "Much of his work was lost. One of his most important texts survived only because a scribe scraped the ink off the parchment centuries later to reuse it for a prayer book — and the faint original was not read again until the twentieth century.",
      "es": {
        "thought": "Cómo medir algo curvo usando cosas rectas que ya entiendes.",
        "simple": "Halló el área del círculo apretándolo entre otras figuras."
      }
    },
    {
      "id": "emmy-noether",
      "name": "Emmy Noether",
      "say": "EM-ee NUR-ter",
      "years": "1882–1935",
      "where": "Germany, and the United States",
      "lab": "noticing",
      "rep": "white-women",
      "face": {
        "beard": "none",
        "glasses": "round",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "bun",
        "hairColor": "darkbrown",
        "clothes": "dress",
        "clothesColor": "#1f2937"
      },
      "thought": "What stays the same when everything else is changing.",
      "simple": "She found what stays the same while everything else changes.",
      "did": "Proved that every symmetry in a physical system corresponds to something that is conserved — a result so central that physics is still built on it. She also reshaped modern algebra around structure rather than calculation.",
      "struggle": "She was not permitted to enroll as a regular student, and lectured for four years at Göttingen without pay or a title, her courses advertised under a male colleague's name because the faculty would not appoint a woman. In 1933 she was dismissed for being Jewish and left for the United States, where she died two years later.",
      "es": {
        "thought": "Lo que se queda igual mientras todo lo demás cambia.",
        "simple": "Encontró lo que se queda igual mientras todo lo demás cambia."
      }
    },
    {
      "id": "ada-lovelace",
      "name": "Ada Lovelace",
      "say": "AY-duh LUV-lace",
      "years": "1815–1852",
      "where": "England",
      "lab": "record",
      "rep": "white-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#ede9fe",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "ringlets",
        "hairColor": "darkbrown",
        "clothes": "dress",
        "clothesColor": "#4c1d95"
      },
      "thought": "How to write instructions precise enough that a machine could follow them.",
      "simple": "She wrote the first computer program, before computers existed.",
      "did": "While translating a paper about a proposed mechanical computer, she added notes longer than the paper itself — including a step-by-step procedure for the machine to compute a sequence of numbers. It is generally considered the first published computer program.",
      "struggle": "Her mother had her drilled in mathematics specifically to suppress any trace of her father, the poet Byron. She was ill for long stretches, and the machine she wrote for was never built in her lifetime — her notes described a program for a computer that did not exist.",
      "es": {
        "thought": "Cómo escribir instrucciones tan exactas que una máquina pueda seguirlas.",
        "simple": "Escribió el primer programa de computadora, antes de que existieran."
      }
    },
    {
      "id": "florence-nightingale",
      "name": "Florence Nightingale",
      "say": "FLOR-ence NIGHT-in-gale",
      "years": "1820–1910",
      "where": "England",
      "lab": "drawing",
      "rep": "white-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "parted",
        "hairColor": "darkbrown",
        "clothes": "dress",
        "clothesColor": "#1e293b"
      },
      "thought": "How to draw data so clearly that people cannot argue with it.",
      "simple": "She drew data so clearly that leaders had to change the rules.",
      "did": "Collected mortality data in military hospitals and invented a circular diagram to show it — making visible that far more soldiers were dying of preventable infection than of wounds. The picture changed policy where the numbers alone had not. She was the first woman elected to the Royal Statistical Society.",
      "struggle": "Her family expected her to marry, not work, and refused for years to let her train. After the war she was largely bedridden and did most of her statistical work from her room, sending charts and letters to officials who would not have received her in person.",
      "es": {
        "thought": "Cómo dibujar los datos tan claro que nadie pueda discutirlos.",
        "simple": "Dibujó los datos tan claro que los líderes tuvieron que cambiar las reglas."
      }
    },
    {
      "id": "grace-hopper",
      "name": "Grace Hopper",
      "say": "GRACE HOP-er",
      "years": "1906–1992",
      "where": "New York, United States",
      "lab": "second-way",
      "rep": "white-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "short",
        "hairColor": "gray",
        "clothes": "uniform",
        "clothesColor": "#1e293b",
        "tie": "#d4af37"
      },
      "thought": "How to make a computer understand words instead of only numbers.",
      "simple": "She made computers understand words, not just numbers.",
      "did": "Built the first compiler — a program that turns human-readable instructions into machine code — and drove the creation of COBOL, a language written to be readable by people who were not programmers. She also famously taped a moth found in a relay into a logbook, popularizing 'debugging'.",
      "struggle": "She was told repeatedly that her compiler idea was impossible, because 'computers only do arithmetic.' She built it anyway, and then spent years persuading people to use it. The Navy tried to retire her more than once; she kept being recalled, and served until she was 79.",
      "es": {
        "thought": "Cómo hacer que una computadora entienda palabras y no solo números.",
        "simple": "Hizo que las computadoras entendieran palabras, no solo números."
      }
    },
    {
      "id": "julia-robinson",
      "name": "Julia Robinson",
      "say": "JOO-lee-uh ROB-in-son",
      "years": "1919–1985",
      "where": "California, United States",
      "lab": "small-start",
      "rep": "white-women",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "bob",
        "hairColor": "darkbrown",
        "clothes": "dress",
        "clothesColor": "#0f766e"
      },
      "thought": "Whether there could be a single method that decides every equation of a certain kind.",
      "simple": "She worked on one problem for over twenty years.",
      "did": "Spent decades on Hilbert's tenth problem, and built most of the framework that finally settled it — showing no such universal method exists. She became the first woman elected to the mathematics section of the National Academy of Sciences and the first woman president of the American Mathematical Society.",
      "struggle": "Scarlet fever and rheumatic fever cost her more than two years of school as a child and permanently damaged her heart. She was told not to expect a long life. She worked on the same problem for over twenty years without knowing whether it could be solved at all.",
      "es": {
        "thought": "Si puede existir un solo método que resuelva toda una clase de ecuaciones.",
        "simple": "Trabajó en un solo problema por más de veinte años."
      }
    },
    {
      "id": "sophie-germain",
      "name": "Sophie Germain",
      "say": "SOH-fee zhair-MAN",
      "years": "1776–1831",
      "where": "France",
      "lab": "small-start",
      "rep": "white-women",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#fef3c7",
        "eyes": "#3b2416",
        "skin": "s1",
        "hair": "ringlets",
        "hairColor": "darkbrown",
        "clothes": "dress",
        "clothesColor": "#7c2d12"
      },
      "thought": "Whether a rule that fails in general might still hold for a smaller family of cases.",
      "simple": "She studied in secret using a man's name.",
      "did": "Made the first substantial general progress on Fermat's Last Theorem by proving it for a whole class of cases at once — the primes named after her. She also won the French Academy's prize for the mathematics of how surfaces vibrate.",
      "struggle": "Her parents took away her candles and her fire to stop her studying at night; she worked wrapped in blankets. Barred from the École Polytechnique because she was a woman, she obtained lecture notes secondhand and submitted work under a male student's name — Monsieur LeBlanc — for years before revealing who she was.",
      "es": {
        "thought": "Si una regla que falla en general todavía funciona en un grupo más pequeño de casos.",
        "simple": "Estudió en secreto usando el nombre de un hombre."
      }
    },
    {
      "id": "maryam-mirzakhani",
      "name": "Maryam Mirzakhani",
      "say": "mar-YAM meer-zah-KHAH-nee",
      "years": "1977–2017",
      "where": "Iran, and the United States",
      "lab": "drawing",
      "rep": "additional",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s2",
        "hair": "bun",
        "hairColor": "darkbrown",
        "clothes": "collar",
        "clothesColor": "#475569"
      },
      "thought": "The shape of a curved surface, and every path you could take across it.",
      "simple": "She drew huge pictures on the floor to think slowly.",
      "did": "Studied the geometry of curved surfaces and how paths wind around them. In 2014 she became the first woman — and the first Iranian — to receive the Fields Medal, mathematics' highest honor.",
      "struggle": "She described herself as a slow thinker, and worked by sprawling enormous drawings across sheets of paper on the floor, sometimes for months, so her daughter thought she was a painter. As a child she wanted to be a writer and did not think she was good at mathematics. She died of cancer at 40.",
      "es": {
        "thought": "La forma de una superficie curva, y todos los caminos que podrías tomar sobre ella.",
        "simple": "Dibujaba en el piso hojas enormes para pensar despacio."
      }
    },
    {
      "id": "al-khwarizmi",
      "name": "Muhammad al-Khwarizmi",
      "say": "moo-HAM-mad al-KWAR-iz-mee",
      "years": "about 780–850",
      "where": "Baghdad",
      "lab": "balance",
      "rep": "additional",
      "face": {
        "beard": "full",
        "glasses": "none",
        "clothesAccent": "#fde68a",
        "eyes": "#3b2416",
        "skin": "s3",
        "hair": "turban",
        "wrapColor": "#e7e5e4",
        "hairColor": "darkbrown",
        "clothes": "robe",
        "clothesColor": "#14532d"
      },
      "thought": "A single reliable procedure that solves every equation of the same shape.",
      "simple": "Algebra is named after his book. So is the word algorithm.",
      "did": "Wrote the book that gives algebra its name — al-jabr, meaning 'restoring', the move of adding the same thing to both sides to keep an equation balanced. His name, in Latin, became the word 'algorithm'.",
      "struggle": "He worked without symbols. There was no x, no equals sign, no way to write a formula — every equation and every solution had to be set out in full sentences, and every general rule explained through worked examples. The notation that makes algebra easy was still seven centuries away.",
      "es": {
        "thought": "Un solo procedimiento confiable que resuelva toda ecuación de la misma forma.",
        "simple": "El álgebra se llama así por su libro. La palabra algoritmo también."
      }
    },
    {
      "id": "srinivasa-ramanujan",
      "name": "Srinivasa Ramanujan",
      "say": "shree-nih-VAH-suh rah-MAH-noo-jun",
      "years": "1887–1920",
      "where": "India, and England",
      "lab": "pattern",
      "rep": "additional",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s4",
        "hair": "short",
        "hairColor": "black",
        "clothes": "collar",
        "clothesColor": "#334155"
      },
      "thought": "Patterns in numbers that nobody had noticed were there.",
      "simple": "He found number patterns alone, from one old textbook.",
      "did": "Working largely alone from one out-of-date textbook, he produced thousands of results in number theory — many of them true, many of them strange, and some not proved by anyone else for another eighty years.",
      "struggle": "He failed out of college twice, because he would not study anything except mathematics. He worked as a shipping clerk and wrote to English mathematicians asking to be taken seriously; most ignored him. When one finally answered, Ramanujan sailed to England, fell seriously ill in a country whose food and climate he could not tolerate, and died at 32.",
      "es": {
        "thought": "Patrones en los números que nadie había notado que estaban ahí.",
        "simple": "Encontró patrones de números solo, con un libro viejo."
      }
    },
    {
      "id": "shakuntala-devi",
      "name": "Shakuntala Devi",
      "say": "shah-koon-TAH-lah DAY-vee",
      "years": "1929–2013",
      "where": "India",
      "lab": "second-way",
      "rep": "additional",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#dc2626",
        "eyes": "#3b2416",
        "skin": "s4",
        "hair": "bun",
        "hairColor": "black",
        "clothes": "sari",
        "clothesColor": "#7f1d1d",
        "earrings": "#d4af37"
      },
      "thought": "Whether the way you were taught to calculate is really the fastest way.",
      "simple": "She multiplied huge numbers in her head in seconds.",
      "did": "Performed enormous arithmetic mentally — once multiplying two thirteen-digit numbers correctly in under half a minute. She spent much of her life writing books arguing that mental calculation is a set of learnable strategies, not a gift, and teaching those strategies to children.",
      "struggle": "She never went to school. Her family discovered her ability when she was about three and put her on stage to earn the household's income, so her childhood was performances rather than an education. She spent her adult life insisting the ability was technique that anyone could learn, against everyone's preference for calling it magic.",
      "es": {
        "thought": "Si la forma en que te enseñaron a calcular es de verdad la más rápida.",
        "simple": "Multiplicaba números enormes en su cabeza en segundos."
      }
    },
    {
      "id": "seki-takakazu",
      "name": "Seki Takakazu",
      "say": "SEH-kee tah-kah-KAH-zoo",
      "years": "about 1642–1708",
      "where": "Japan",
      "lab": "balance",
      "rep": "additional",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#e7e5e4",
        "eyes": "#3b2416",
        "skin": "s2",
        "hair": "cap",
        "wrapColor": "#1c1917",
        "hairColor": "black",
        "clothes": "robe",
        "clothesColor": "#1e293b"
      },
      "thought": "How to handle several unknown quantities at the same time.",
      "simple": "He solved systems of equations before Europe did.",
      "did": "Developed a method for solving systems of equations using determinants, arriving at the idea independently and at least a decade before Leibniz did in Europe. He built much of the foundation of wasan, the distinct Japanese mathematics of that era.",
      "struggle": "Japan was almost entirely closed to the outside world during his lifetime, so he had no access to European mathematics and it had no access to his. He and his students also kept methods secret from rival schools, which is part of why the extent of his work is still argued over.",
      "es": {
        "thought": "Cómo manejar varias cantidades desconocidas al mismo tiempo.",
        "simple": "Resolvió sistemas de ecuaciones antes que Europa."
      }
    },
    {
      "id": "robert-megginson",
      "name": "Robert Megginson",
      "say": "ROB-ert MEG-in-son",
      "years": "born 1948",
      "where": "Illinois, United States",
      "lab": "noticing",
      "rep": "additional",
      "face": {
        "beard": "none",
        "glasses": "rectangular",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s4",
        "hair": "long",
        "hairColor": "saltpepper",
        "clothes": "collar",
        "clothesColor": "#0f766e"
      },
      "thought": "The structure of spaces that have infinitely many directions.",
      "simple": "He left math for years, then came back at 37.",
      "did": "Works in functional analysis and wrote a standard graduate textbook on Banach space theory. A member of the Oglala Lakota nation, he has spent much of his career building mathematics programs at tribal colleges and bringing Native students into the field.",
      "struggle": "He left mathematics after his master's degree and worked for years as a computer programmer before returning for a doctorate at 37. He has described how few Native American mathematicians there were to follow — and that the work of getting others in had to be built from almost nothing.",
      "es": {
        "thought": "La estructura de espacios que tienen infinitas direcciones.",
        "simple": "Dejó las matemáticas por años y volvió a los 37."
      }
    },
    {
      "id": "freda-porter",
      "name": "Freda Porter",
      "say": "FREE-duh POR-ter",
      "years": "born 1957",
      "where": "North Carolina, United States",
      "lab": "reality",
      "rep": "additional",
      "face": {
        "beard": "none",
        "glasses": "none",
        "clothesAccent": "#f8fafc",
        "eyes": "#3b2416",
        "skin": "s4",
        "hair": "long",
        "hairColor": "black",
        "clothes": "dress",
        "clothesColor": "#065f46",
        "earrings": "#d4af37"
      },
      "thought": "Where the water underground actually goes, and what it carries with it.",
      "simple": "She models where water and pollution move underground.",
      "did": "An applied mathematician and a member of the Lumbee tribe, she models groundwater flow and contamination — mathematics used to work out how pollution spreads beneath the surface and how to clean it up. She has led environmental science programs serving tribal communities.",
      "struggle": "She was one of very few Native American women in doctoral mathematics, and has spoken about how isolating that was. She built her career deliberately around problems affecting her own community, in a field that rewards abstraction and often treats applied work as lesser.",
      "es": {
        "thought": "A dónde va de verdad el agua bajo tierra, y qué lleva consigo.",
        "simple": "Modela por dónde se mueven el agua y la contaminación bajo tierra."
      }
    }
  ];

  /* ── Lookups ───────────────────────────────────────────────────────────── */

  var byLab = {};
  var byId = {};
  var i;
  for (i = 0; i < LABS.length; i++) byLab[LABS[i].id] = [];
  for (i = 0; i < MENTORS.length; i++) {
    byId[MENTORS[i].id] = MENTORS[i];
    if (byLab[MENTORS[i].lab]) byLab[MENTORS[i].lab].push(MENTORS[i]);
  }

  function getLab(labId) {
    for (var k = 0; k < LABS.length; k++) if (LABS[k].id === labId) return LABS[k];
    return null;
  }

  function getMentor(id) {
    return byId[id] || null;
  }

  function mentorsInLab(labId) {
    return (byLab[labId] || []).slice();
  }

  /** Alphabetical by name — the ONLY ordering ever shown to a student. */
  function allMentors() {
    return MENTORS.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  window.NTMentorRoster = {
    __loaded: true,
    version: "1.0.0",
    labs: LABS,
    mentors: MENTORS,
    getLab: getLab,
    getMentor: getMentor,
    mentorsInLab: mentorsInLab,
    allMentors: allMentors,
  };
})();

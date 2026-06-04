/* STORY · Unit 7 · Graphic Novel #1 (Support) · Detective Case Files: The Equation Mysteries
   Phase-2 build: full novel on the comic engine — Act 1 (The First Clue),
   Act 2 (The Locked Boxes), Final (The Vault Mystery), Glossary, Case Solved +
   Master-Rank challenge. All math, answers, distractors, Spanish, sentence
   frames, hints, and glossary are carried verbatim from
   graphic-novels/unit7/graphic-novel-1.html (6.EE.7).
   New: panels, speech, GUMSHOE-voices-the-misconception (operates on ONE side
   only), vocab/hint/coach pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 7,
    version: 1,
    level: "Support",
    title: "Detective Case Files: The Equation Mysteries",
    standard: "6.EE.7",
    readingStandard: "RL.6.1",
    assessment:
      "Graphic Novel U7 #1: Detective Case Files: The Equation Mysteries",
    artBase: "../_art/unit7/",
    home: "../index.html",
  },

  cast: {
    detective: {
      name: "The Detective",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🕵️",
      avatar: null,
      blurb: "You",
    },
    gumshoe: {
      name: "GUMSHOE",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🔎",
      avatar: null,
      blurb: "Rookie partner · only fixes ONE side of the equation",
    },
    log: { name: "Case File", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young detective stands in a cozy office at night with a board of clues and a locked evidence box",
    blurbEn:
      "You are <b>The Detective</b>. &#128373;&#65039; Each clue hides an unknown number. You write an <b>equation</b> and then <b>solve</b> it to open the locked evidence boxes. GUMSHOE, your eager rookie partner, wants to help… but GUMSHOE keeps changing only ONE side of the equation. Catch the mistakes and crack the case!",
    blurbEs:
      "Eres el Detective. Cada pista esconde un n&uacute;mero desconocido. Escribe una ecuaci&oacute;n y resu&eacute;lvela para abrir las cajas.",
    startLabel: "Open the Case &#128373;&#65039;",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The First Clue",
      kicker: "Act 1 · Write Equations",
      title: "The First Clue",
      advanceLabel: "File the clues &#128373;&#65039;",
      steps: [
        {
          type: "beats",
          art: "evidence-room.png",
          alt: "The detective examines a wall of clues with a magnifying glass",
          lastLabel: "Read the clue ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Late at night, a new case lands on the desk. A jar of coins is missing pieces.",
              es: "Tarde en la noche, llega un nuevo caso. Faltan monedas en un frasco.",
            },
            {
              who: "detective",
              en: "Every clue hides an unknown number. I'll call it a variable. First, I write an equation.",
              es: "Cada pista esconde un n&uacute;mero desconocido. Lo llamo variable. Primero escribo una ecuaci&oacute;n.",
              vocab: [
                {
                  term: "variable",
                  en: "A letter that stands for an unknown number. Example: in c &minus; 7 = 12, the variable is c.",
                  es: "Una letra que representa un n&uacute;mero desconocido. Ejemplo: en c &minus; 7 = 12, la variable es c.",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "A good detective reads every word twice. The exact words of a clue decide whether you add or subtract.",
              es: "Un buen detective lee cada palabra dos veces. Las palabras exactas de una pista deciden si sumas o restas.",
            },
            {
              who: "gumshoe",
              misconception: true,
              en: "Coins were added back, right? I'll write c + 7 = 12 — easy!",
              es: "Se a&ntilde;adieron monedas, &iquest;no? Escribo c + 7 = 12.",
              callout: {
                x: 70,
                y: 42,
                icon: "?",
                title: "Clue #1",
                en: "“The thief took 7 coins from the jar. Now 12 coins are left.”",
                es: "“El ladr&oacute;n se llev&oacute; 7 monedas. Quedan 12.”",
              },
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "gumshoe",
            en: "Wait — the note says: &ldquo;The thief took <b>7</b> coins from the jar. Now <b>12</b> coins are left.&rdquo; Let <b>c</b> = how many coins were there at the start. Which equation matches the clue?",
            es: "El ladr&oacute;n se llev&oacute; 7 monedas. Quedan 12. &iquest;Cu&aacute;l ecuaci&oacute;n es correcta?",
          },
          hint: {
            en: "&#128161; Start amount, take away 7, equals 12 left. &ldquo;Take away&rdquo; means subtract: <b>c &minus; 7</b>.",
            es: "Cantidad inicial, quita 7, quedan 12. &ldquo;Quitar&rdquo; es restar: c &minus; 7.",
          },
          frame: {
            en: "&ldquo;The unknown is the letter ____. The words &lsquo;took away&rsquo; mean ____. My equation is ____.&rdquo;",
            es: "&ldquo;La inc&oacute;gnita es la letra ____. &lsquo;Se llev&oacute;&rsquo; significa ____. Mi ecuaci&oacute;n es ____.&rdquo;",
          },
          choices: [
            {
              en: "Not c + 7 — coins were TAKEN. c &minus; 7 = 12 (start, take away 7, leaves 12).",
              es: "c + 7 no: se llevaron monedas. c &minus; 7 = 12.",
              correct: true,
            },
            {
              en: "You're right, GUMSHOE — c + 7 = 12.",
              es: "Tienes raz&oacute;n, GUMSHOE: c + 7 = 12.",
              correct: false,
            },
            {
              en: "7 &minus; c = 12 (this starts with only 7).",
              es: "7 &minus; c = 12 (esto empieza con solo 7).",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Right! &ldquo;Took 7 away&rdquo; means subtract, so c &minus; 7 = 12. (The start was 19, but for now we just WROTE it.)",
          goodEs:
            "&iexcl;Correcto! &ldquo;Se llev&oacute; 7&rdquo; es restar: c &minus; 7 = 12.",
          badEn:
            "&#10060; Not quite. Coins were TAKEN, so we subtract from the start amount c. Try the equation with c &minus; 7.",
          badEs:
            "Casi. Se llevaron monedas, as&iacute; que restamos: c &minus; 7.",
          solveBeat: {
            who: "detective",
            en: "Clue one written! Here's another note about bags of gems. Let me turn the words into math.",
            es: "&iexcl;Pista uno lista! Aqu&iacute; hay otra nota sobre bolsas de gemas. La convierto en matem&aacute;ticas.",
          },
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.beat2",
          ask: {
            who: "log",
            en: "In the story, what does the word <b>variable</b> mean?",
            es: "En la historia, &iquest;qu&eacute; significa la palabra <b>variable</b>?",
          },
          hint: {
            en: "Think about why the Detective uses the letter c for the coins.",
            es: "Piensa por qu&eacute; el Detective usa la letra c para las monedas.",
          },
          choices: [
            {
              en: "A letter that stands for an unknown number.",
              es: "Una letra que representa un n&uacute;mero desconocido.",
              correct: true,
            },
            {
              en: "The answer after you solve the equation.",
              es: "La respuesta despu&eacute;s de resolver la ecuaci&oacute;n.",
              correct: false,
            },
            {
              en: "A clue written on a paper note.",
              es: "Una pista escrita en una nota de papel.",
              correct: false,
            },
          ],
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 1,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "log",
            en: "According to Clue #1, how many coins did the thief take from the jar?",
            es: "Seg&uacute;n la Pista #1, &iquest;cu&aacute;ntas monedas tom&oacute; el ladr&oacute;n del frasco?",
          },
          choices: [
            {
              en: "7 coins.",
              es: "7 monedas.",
              correct: true,
            },
            {
              en: "12 coins.",
              es: "12 monedas.",
              correct: false,
            },
            {
              en: "19 coins.",
              es: "19 monedas.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "detective",
            en: "New clue: &ldquo;<b>3</b> equal bags of gems hold <b>24</b> gems in all.&rdquo; Let <b>g</b> = the number of gems in <b>one</b> bag. Which equation matches?",
            es: "3 bolsas iguales tienen 24 gemas. &iquest;Cu&aacute;l ecuaci&oacute;n es correcta?",
            vocab: [
              {
                term: "equal bags",
                en: "Equal groups means multiply: 3 groups of g is 3 &times; g, written 3g.",
                es: "Grupos iguales significa multiplicar: 3 grupos de g es 3 &times; g, escrito 3g.",
              },
            ],
          },
          hint: {
            en: "&#128161; 3 equal bags means 3 groups of <b>g</b>. Equal groups means multiply: <b>3 &times; g</b>, written <b>3g</b>.",
            es: "3 bolsas iguales son 3 grupos de g. Grupos iguales: multiplica, 3g.",
          },
          frame: {
            en: "&ldquo;The words &lsquo;equal bags&rsquo; mean ____. My equation is ____.&rdquo;",
            es: "&ldquo;Las palabras &lsquo;bolsas iguales&rsquo; significan ____. Mi ecuaci&oacute;n es ____.&rdquo;",
          },
          choices: [
            {
              en: "g + 3 = 24 (this adds 3, not 3 groups).",
              es: "g + 3 = 24 (esto suma 3, no 3 grupos).",
              correct: false,
            },
            {
              en: "g &minus; 3 = 24 (this subtracts 3).",
              es: "g &minus; 3 = 24 (esto resta 3).",
              correct: false,
            },
            {
              en: "3g = 24 (3 equal groups of g = 24).",
              es: "3g = 24 (3 grupos iguales de g = 24).",
              correct: true,
            },
          ],
          goodEn:
            "&#9989; Yes! 3 equal bags means 3 groups of g, so 3g = 24. Clue written! (Each bag holds 8.)",
          goodEs:
            "&iexcl;S&iacute;! 3 bolsas iguales: 3g = 24. (Cada bolsa tiene 8.)",
          badEn:
            "&#10060; Equal bags means equal GROUPS, so we multiply: 3 &times; g = 3g. Try again.",
          badEs: "Bolsas iguales son grupos iguales: multiplicamos, 3g.",
          solveArt: "write-equation.png",
          solveAlt:
            "Detective Mateo writes an equation at his desk under a warm lamp",
          solveBeat: {
            who: "detective",
            en: "Both clues filed. Now to the evidence room — the locked boxes are next.",
            es: "Ambas pistas archivadas. Ahora, a la sala de evidencias: siguen las cajas cerradas.",
          },
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 2,
          interaction: "evidence",
          passageRef: "act1.1a",
          ask: {
            who: "log",
            en: "Tap the line that shows coins were <b>taken away</b> (so the Detective must subtract).",
            es: "Toca la l&iacute;nea que muestra que se <b>quitaron</b> monedas (por eso el Detective debe restar).",
          },
          choices: [
            {
              en: "“The thief took 7 coins from the jar.”",
              es: "“El ladr&oacute;n se llev&oacute; 7 monedas del frasco.”",
              correct: true,
            },
            {
              en: "“3 equal bags of gems hold 24 gems in all.”",
              es: "“3 bolsas iguales tienen 24 gemas en total.”",
              correct: false,
            },
            {
              en: "“Both clues filed.”",
              es: "“Ambas pistas archivadas.”",
              correct: false,
            },
          ],
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: The Locked Boxes",
      kicker: "Act 2 · Solve Equations",
      title: "The Locked Boxes",
      advanceLabel: "Open the next case &#128273;",
      steps: [
        {
          type: "beats",
          art: "unlock-box.png",
          alt: "Detective Mateo opens a locked evidence box with golden light pouring out",
          lastLabel: "Solve box one ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Now we find locked evidence boxes. Each code is the value of the variable.",
              es: "Ahora Mateo encuentra cajas cerradas. Cada c&oacute;digo es el valor de la variable.",
            },
            {
              who: "detective",
              en: "To open a box, I solve the equation. I undo each step with the opposite operation.",
              es: "Para abrir una caja, resuelvo la ecuaci&oacute;n. Deshago cada paso con la operaci&oacute;n opuesta.",
              vocab: [
                {
                  term: "opposite operation",
                  en: "The move that undoes another. Add undoes subtract. Multiply undoes divide.",
                  es: "El movimiento que deshace a otro. Sumar deshace restar. Multiplicar deshace dividir.",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "Whatever you do to one side, you must do to the OTHER side too — that keeps the equation fair and balanced.",
              es: "Lo que haces a un lado, debes hacerlo al OTRO lado tambi&eacute;n: as&iacute; la ecuaci&oacute;n queda justa y balanceada.",
            },
            {
              who: "gumshoe",
              misconception: true,
              en: "x + 8 = 21? I'll just add 8 to the x side and call it x = 29. Done!",
              es: "&iquest;x + 8 = 21? Le sumo 8 al lado de la x: x = 29.",
            },
          ],
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act2.beat1",
          ask: {
            who: "log",
            en: "What is the Detective mainly trying to do in this chapter?",
            es: "&iquest;Qu&eacute; intenta hacer principalmente el Detective en este cap&iacute;tulo?",
          },
          choices: [
            {
              en: "Solve each equation to find the code that opens a locked box.",
              es: "Resolver cada ecuaci&oacute;n para hallar el c&oacute;digo que abre una caja cerrada.",
              correct: true,
            },
            {
              en: "Write the very first equation from a paper clue.",
              es: "Escribir la primera ecuaci&oacute;n a partir de una pista de papel.",
              correct: false,
            },
            {
              en: "Count how many bags of gems are missing.",
              es: "Contar cu&aacute;ntas bolsas de gemas faltan.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "gumshoe",
            en: "Hold on — the first box code is the value of <b>x</b>. Solve <b>x + 8 = 21</b> to get the code. Before I lock it with x = 29!",
            es: "El primer c&oacute;digo es x. Resuelve x + 8 = 21.",
          },
          hint: {
            en: "&#128161; To undo <b>+ 8</b>, do the opposite: <b>subtract 8</b> from both sides. 21 &minus; 8 = ?",
            es: "Para deshacer + 8, haz lo opuesto: resta 8 de ambos lados. 21 &minus; 8 = ?",
          },
          frame: {
            en: "&ldquo;To undo adding 8, I ____ 8 from both sides. So x = ____.&rdquo;",
            es: "&ldquo;Para deshacer sumar 8, ____ 8 de ambos lados. As&iacute; x = ____.&rdquo;",
          },
          choices: [
            {
              en: "Not x = 29 — that added instead of subtracted. x = 13 (21 &minus; 8 = 13).",
              es: "x = 29 no: eso sum&oacute; en vez de restar. x = 13 (21 &minus; 8 = 13).",
              correct: true,
            },
            {
              en: "You're right, GUMSHOE — x = 29.",
              es: "Tienes raz&oacute;n, GUMSHOE: x = 29.",
              correct: false,
            },
            {
              en: "x = 8 (that was already in the equation).",
              es: "x = 8 (eso ya estaba en la ecuaci&oacute;n).",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Box open! To undo + 8 you subtract 8: 21 &minus; 8 = 13, so x = 13. Check: 13 + 8 = 21. ✓",
          goodEs:
            "&iexcl;Caja abierta! 21 &minus; 8 = 13, x = 13. Prueba: 13 + 8 = 21.",
          badEn:
            "&#10060; To undo adding 8, do the OPPOSITE and subtract 8 from both sides. 21 &minus; 8 = ?",
          badEs: "Para deshacer + 8, resta 8 de ambos lados. 21 &minus; 8 = ?",
          solveBeat: {
            who: "detective",
            en: "Box one open! The next box uses multiplication. I'll undo it by dividing.",
            es: "&iexcl;Caja uno abierta! La siguiente usa multiplicaci&oacute;n. La deshago dividiendo.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "detective",
            en: "The second box code is the value of <b>n</b>. Solve <b>5n = 45</b> to get the code.",
            es: "El segundo c&oacute;digo es n. Resuelve 5n = 45.",
            vocab: [
              {
                term: "5n",
                en: "5n means 5 times n. To undo &times; 5, do the opposite: divide by 5.",
                es: "5n significa 5 por n. Para deshacer &times; 5, divide entre 5.",
              },
            ],
          },
          hint: {
            en: "&#128161; <b>5n</b> means 5 times n. To undo &times; 5, do the opposite: <b>divide by 5</b>. 45 &divide; 5 = ?",
            es: "5n es 5 por n. Para deshacer &times; 5, divide entre 5. 45 &divide; 5 = ?",
          },
          frame: {
            en: "&ldquo;To undo multiplying by 5, I ____ by 5. So n = ____.&rdquo;",
            es: "&ldquo;Para deshacer multiplicar por 5, ____ entre 5. As&iacute; n = ____.&rdquo;",
          },
          choices: [
            {
              en: "n = 50 (this added 5).",
              es: "n = 50 (esto sum&oacute; 5).",
              correct: false,
            },
            {
              en: "n = 40 (this subtracted 5).",
              es: "n = 40 (esto rest&oacute; 5).",
              correct: false,
            },
            {
              en: "n = 9 (45 &divide; 5 = 9).",
              es: "n = 9 (45 &divide; 5 = 9).",
              correct: true,
            },
          ],
          goodEn:
            "&#9989; Box open! 5n means 5 &times; n. To undo it, divide by 5: 45 &divide; 5 = 9, so n = 9. Check: 5 &times; 9 = 45. ✓",
          goodEs:
            "&iexcl;Caja abierta! 45 &divide; 5 = 9, n = 9. Prueba: 5 &times; 9 = 45.",
          badEn:
            "&#10060; 5n means MULTIPLY. The opposite is DIVIDE. Divide both sides by 5: 45 &divide; 5 = ?",
          badEs: "5n es multiplicar. Lo opuesto es dividir: 45 &divide; 5 = ?",
          solveBeat: {
            who: "detective",
            en: "Both boxes open. The Vault Mystery is next — let's crack it.",
            es: "Ambas cajas abiertas. Sigue la B&oacute;veda; vamos a resolverla.",
          },
        },
        {
          type: "comprehension",
          id: "c5",
          skill: "sequence",
          standard: "RI.6.3",
          dok: 2,
          interaction: "sequence",
          passageRef: "act2",
          ask: {
            who: "log",
            en: "Put the steps the Detective followed to open the boxes in order.",
            es: "Ordena los pasos que sigui&oacute; el Detective para abrir las cajas.",
          },
          items: [
            {
              en: "GUMSHOE guesses x = 29 by changing only one side.",
              es: "GUMSHOE adivina x = 29 cambiando solo un lado.",
              order: 1,
            },
            {
              en: "The Detective subtracts 8 from both sides and gets x = 13.",
              es: "El Detective resta 8 de ambos lados y obtiene x = 13.",
              order: 2,
            },
            {
              en: "The Detective divides by 5 to solve 5n = 45 and gets n = 9.",
              es: "El Detective divide entre 5 para resolver 5n = 45 y obtiene n = 9.",
              order: 3,
            },
          ],
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Case",
      kicker: "Final Case · Boss",
      title: "The Vault Mystery",
      advanceLabel: "Crack the Vault &#127775;",
      steps: [
        {
          type: "beats",
          art: "final-case.png",
          alt: "Detective Mateo faces a giant vault door covered in locks and dials",
          lastLabel: "Crack it ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The biggest mystery: a giant vault. Its lock needs BOTH skills at once.",
              es: "El misterio m&aacute;s grande: una b&oacute;veda. Necesita AMBAS destrezas.",
            },
            {
              who: "detective",
              en: "Write the equation from the clue, then solve it. I'm ready. Let's crack this vault!",
              es: "Escribir la ecuaci&oacute;n y resolverla. Estoy listo. &iexcl;Vamos a abrir la b&oacute;veda!",
            },
            {
              who: "log",
              caption: true,
              en: "This is the real test, Detective: first WRITE the equation from the clue, then SOLVE it. Two steps, one chance.",
              es: "Esta es la prueba de verdad, Detective: primero ESCRIBE la ecuaci&oacute;n de la pista, luego RESU&Eacute;LVELA. Dos pasos, una oportunidad.",
            },
            {
              who: "gumshoe",
              misconception: true,
              en: "v + 9 = 23 — I'll add 9 to the v side: v = 32. Punching it in!",
              es: "v + 9 = 23 — le sumo 9 al lado de la v: v = 32.",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "detective",
            en: "Careful, GUMSHOE. The final clue: &ldquo;A secret number plus <b>9</b> equals <b>23</b>.&rdquo; Let the number be <b>v</b>. Which line shows both the correct equation and its correct solution for v?",
            es: "Un n&uacute;mero m&aacute;s 9 es 23. &iquest;Cu&aacute;l l&iacute;nea tiene la ecuaci&oacute;n correcta y su soluci&oacute;n correcta?",
          },
          hint: {
            en: "&#128161; &ldquo;plus 9&rdquo; means <b>v + 9</b>. &ldquo;equals 23&rdquo; means <b>= 23</b>. To solve, subtract 9: 23 &minus; 9 = ?",
            es: "&ldquo;m&aacute;s 9&rdquo; es v + 9. &ldquo;es 23&rdquo; es = 23. Para resolver, resta 9: 23 &minus; 9 = ?",
          },
          frame: {
            en: "&ldquo;The equation is v + 9 = 23. To solve I ____ 9 from both sides. The number is v = ____.&rdquo;",
            es: "&ldquo;La ecuaci&oacute;n es v + 9 = 23. Para resolver ____ 9 de ambos lados. El n&uacute;mero es v = ____.&rdquo;",
          },
          choices: [
            {
              en: "v &minus; 9 = 23, so v = 32 (used subtract instead of plus).",
              es: "v &minus; 9 = 23, v = 32 (rest&oacute; en vez de sumar).",
              correct: false,
            },
            {
              en: "v + 9 = 23, so v = 14 (23 &minus; 9 = 14).",
              es: "v + 9 = 23, v = 14 (23 &minus; 9 = 14).",
              correct: true,
            },
            {
              en: "Like GUMSHOE said: v + 9 = 23, so v = 32 (this added instead of subtracted).",
              es: "Como dijo GUMSHOE: v + 9 = 23, v = 32 (sum&oacute; en vez de restar).",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; VAULT OPEN! &ldquo;Plus 9&rdquo; gives v + 9 = 23. Subtract 9: 23 &minus; 9 = 14, so v = 14. Check: 14 + 9 = 23. ✓",
          goodEs:
            "&iexcl;B&Oacute;VEDA ABIERTA! v + 9 = 23, v = 14. Prueba: 14 + 9 = 23.",
          badEn:
            "&#10060; One part is off. &ldquo;Plus 9&rdquo; means v + 9 = 23. To solve, SUBTRACT 9 from both sides: 23 &minus; 9 = 14.",
          badEs:
            "Una parte est&aacute; mal. Es v + 9 = 23. Resta 9: 23 &minus; 9 = 14.",
          solveBeat: {
            who: "detective",
            en: "The vault swings open! Case solved — thanks for the help, GUMSHOE, even the one-sided guesses.",
            es: "&iexcl;La b&oacute;veda se abre! Caso resuelto. Gracias, GUMSHOE.",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 3,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "GUMSHOE keeps changing only ONE side of each equation. Why does GUMSHOE keep getting the wrong code?",
            es: "GUMSHOE sigue cambiando solo UN lado de cada ecuaci&oacute;n. &iquest;Por qu&eacute; GUMSHOE sigue obteniendo el c&oacute;digo incorrecto?",
          },
          hint: {
            en: "Look back: the Case File says whatever you do to one side you must do to the OTHER side too.",
            es: "Mira atr&aacute;s: el Archivo dice que lo que haces a un lado debes hacerlo al OTRO lado tambi&eacute;n.",
          },
          choices: [
            {
              en: "GUMSHOE only changes one side, so the equation is no longer balanced and fair.",
              es: "GUMSHOE solo cambia un lado, as&iacute; que la ecuaci&oacute;n deja de estar balanceada y justa.",
              correct: true,
            },
            {
              en: "GUMSHOE does not want the case to be solved.",
              es: "GUMSHOE no quiere que se resuelva el caso.",
              correct: false,
            },
            {
              en: "The clues on the notes show the wrong numbers.",
              es: "Las pistas en las notas muestran n&uacute;meros equivocados.",
              correct: false,
            },
          ],
        },
        {
          type: "comprehension",
          id: "c7",
          skill: "prediction",
          standard: "RL.6.3",
          dok: 2,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "The vault is open and the case is solved. What will the Detective most likely do next?",
            es: "La b&oacute;veda est&aacute; abierta y el caso resuelto. &iquest;Qu&eacute; har&aacute; probablemente el Detective despu&eacute;s?",
          },
          choices: [
            {
              en: "Recover the missing coins and gems and close the case file.",
              es: "Recuperar las monedas y gemas que faltaban y cerrar el archivo del caso.",
              correct: true,
            },
            {
              en: "Lock the very first evidence box from Act 2 again.",
              es: "Cerrar otra vez la primera caja de evidencia del Acto 2.",
              correct: false,
            },
            {
              en: "Stop writing equations from clues for good.",
              es: "Dejar de escribir ecuaciones a partir de pistas para siempre.",
              correct: false,
            },
          ],
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "&#10067;",
      en: "Variable",
      es: "variable",
      def: "A letter that stands for an unknown number. Example: in c &minus; 7 = 12, the variable is c.",
    },
    {
      ico: "&#9878;&#65039;",
      en: "Equation",
      es: "ecuaci&oacute;n",
      def: "A math sentence that says two amounts are equal, using an equals sign. Example: x + 8 = 21.",
    },
    {
      ico: "&#10133;",
      en: "Sum / Add",
      es: "suma / sumar",
      def: "Putting amounts together. Clue words: plus, increased by, more than. Example: v + 9.",
    },
    {
      ico: "&#10134;",
      en: "Difference / Subtract",
      es: "resta / restar",
      def: "Taking away. Clue words: took away, less than, fewer. Example: c &minus; 7.",
    },
    {
      ico: "&#10006;&#65039;",
      en: "Product / Multiply",
      es: "producto / multiplicar",
      def: "Equal groups joined. Clue words: each, equal groups, times. Example: 3g means 3 &times; g.",
    },
    {
      ico: "&#10135;",
      en: "Quotient / Divide",
      es: "cociente / dividir",
      def: "Sharing into equal groups. Example: 45 &divide; 5 = 9.",
    },
    {
      ico: "&#128260;",
      en: "Opposite operation",
      es: "operaci&oacute;n opuesta",
      def: "The move that undoes another. Add undoes subtract. Multiply undoes divide.",
    },
    {
      ico: "&#9878;&#65039;",
      en: "Both sides",
      es: "ambos lados",
      def: "To keep an equation equal and fair, do the same thing to BOTH sides of the equals sign.",
    },
    {
      ico: "&#9989;",
      en: "Solution",
      es: "soluci&oacute;n",
      def: "The value of the variable that makes the equation true. The code that opens the box!",
    },
  ],

  complete: {
    art: "solved.png",
    alt: "Detective Mateo celebrates with confetti as all the evidence boxes stand open",
    badge: "&#127881;&#128373;&#65039;&#11088;",
    titleEn: "Case Solved!",
    en: "You cracked it, Detective! You <b>wrote equations</b> from the clues and <b>solved</b> them to open every locked box. The mystery is solved. Great detective work!",
    es: "&iexcl;Caso resuelto! Escribiste ecuaciones y las resolviste. &iexcl;Excelente trabajo, detective!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Evidence equation: Solve the multiplication equation to find the value of x: <strong>4x = 24</strong>.",
      promptEs:
        "Resuelve la ecuaci&oacute;n de multiplicaci&oacute;n: 4x = 24.",
      choices: [
        {
          en: "A) x = 20 &nbsp;(subtracted 4 instead of dividing)",
          correct: false,
        },
        { en: "B) x = 6 &nbsp;(24 &divide; 4 = 6) &nbsp;✅", correct: true },
        { en: "C) x = 96 &nbsp;(multiplied 24 by 4)", correct: false },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      badEn:
        "❌ That is incorrect. Review your calculations and try another option!",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};

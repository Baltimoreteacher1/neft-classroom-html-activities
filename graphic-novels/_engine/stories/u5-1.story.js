/* STORY · Unit 5 · Graphic Novel #1 (Support) · Theme Park Engineer: Area Architect
   Phase-2 build on the comic engine — Act 1 (The Slanted Plaza), Act 2 (Signs &
   Stages), Final Build (The Grand Pavilion), Glossary, Mission Complete +
   Master-Rank challenge. All math, answers, distractors, Spanish, sentence
   frames, hints, and glossary are carried verbatim from
   graphic-novels/unit5/graphic-novel-1.html (6.G.1).
   New: panels, speech, BOLT-voices-the-misconception (slant-as-height / forgets
   ÷2), vocab/hint/coach pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 5,
    version: 1,
    level: "Support",
    title: "Theme Park Engineer: Area Architect &#127906;",
    standard: "6.G.1",
    assessment: "Graphic Novel U5 #1: Theme Park Engineer: Area Architect",
    artBase: "../_art/unit5/",
    home: "../index.html",
  },

  cast: {
    engineer: {
      name: "The Engineer",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "&#128104;&#8205;&#128295;",
      avatar: null,
      blurb: "You",
    },
    bolt: {
      name: "BOLT",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "&#129302;",
      avatar: null,
      blurb: "Build-bot · grabs the slant and forgets to halve",
    },
    log: { name: "Park AI", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young engineer named Maya stands on a hill looking at a glowing futuristic amusement park at sunset",
    blurbEn:
      "You are the <b>Engineer</b>. You will build a futuristic theme park! Each ride opens when you find the correct <b>area</b> &mdash; the space inside a shape. BOLT, your build-bot, is eager to help… but BOLT keeps measuring the slanted side and forgetting to take half. Catch its mistakes and let&rsquo;s build!",
    blurbEs:
      "Eres la <b>Ingeniera</b>. Vas a construir un parque. Cada juego se abre cuando encuentras el &aacute;rea (el espacio dentro de una figura). BOLT, tu robot, quiere ayudar… pero usa el lado inclinado y olvida tomar la mitad. &iexcl;Atrapa sus errores y a construir!",
    startLabel: "Start Building &#127906;",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Slanted Plaza",
      kicker: "Act 1 · Area of Parallelograms",
      title: "The Slanted Plaza",
      advanceLabel: "Open the plaza &#127881;",
      steps: [
        {
          type: "beats",
          art: "design-plaza.png",
          alt: "Maya designs a slanted parallelogram-shaped entry plaza on a glowing holographic table",
          lastLabel: "Build the plaza &#9654;",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Welcome, Engineer! The first building is the entry PLAZA. It is shaped like a slanted box &mdash; a parallelogram.",
              es: "&iexcl;Bienvenida, ingeniera! El primer edificio es la PLAZA, con forma de paralelogramo (caja inclinada).",
            },
            {
              who: "engineer",
              en: "Cool! To build it, I need its AREA. For a parallelogram, area = base times height.",
              es: "&iexcl;Genial! Para construirla necesito el &Aacute;REA. Paralelogramo: &aacute;rea = base &times; altura.",
              vocab: [
                {
                  term: "area",
                  en: "The amount of flat space inside a shape. We measure it in square units, like square meters (m&sup2;).",
                  es: "El espacio plano dentro de una figura. Se mide en unidades cuadradas, como m&sup2;.",
                },
              ],
            },
            {
              who: "bolt",
              misconception: true,
              en: "Easy! The slanted side is 7 long, so I&rsquo;ll use 7 as the height. Pouring the floor now!",
              es: "&iexcl;F&aacute;cil! El lado inclinado mide 7, as&iacute; que usar&eacute; 7 como altura. &iexcl;Construyo el piso!",
              callout: {
                x: 50,
                y: 60,
                icon: "?",
                title: "Height vs. slant",
                en: "The height (h) goes STRAIGHT UP and makes a right angle with the base &mdash; it is not the slanted side.",
                es: "La altura (h) va RECTA hacia arriba y forma un &aacute;ngulo recto con la base; no es el lado inclinado.",
              },
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "bolt",
            en: 'Wait &mdash; the entry plaza is a <b>parallelogram</b>. Use <span class="formula">A = b &times; h</span> (base times height). The base is <b>12 m</b> and the height is <b>5 m</b>. What is the area?',
            es: "&Aacute;rea de un paralelogramo = base &times; altura. Base = 12, altura = 5.",
            vocab: [
              {
                term: "parallelogram",
                en: "A slanted four-sided box. Area = base &times; height. Example: 12 &times; 5 = 60.",
                es: "Una caja inclinada de cuatro lados. &Aacute;rea = base &times; altura. Ejemplo: 12 &times; 5 = 60.",
              },
            ],
          },
          hint: {
            en: "Use the <b>height</b> (the straight-up distance, 5), NOT the slanted side. Multiply: 12 &times; 5.",
            es: "Usa la altura (la distancia recta, 5), NO el lado inclinado. Multiplica: 12 &times; 5.",
          },
          frame: {
            en: "&ldquo;The area of a parallelogram is <b>base &times; height</b>. The plaza is ____ &times; ____ = ____ square meters.&rdquo;",
            es: "&ldquo;El &aacute;rea de un paralelogramo es base &times; altura. La plaza es ____ &times; ____ = ____ metros cuadrados.&rdquo;",
          },
          choices: [
            {
              en: "17 m&sup2; &nbsp;(that is 12 + 5, not times)",
              es: "Eso es 12 + 5, no por.",
              correct: false,
            },
            {
              en: "60 m&sup2; &nbsp;(12 &times; 5)",
              es: "12 &times; 5 = 60.",
              correct: true,
            },
            {
              en: "30 m&sup2; &nbsp;(that is &frac12; &times; 12 &times; 5)",
              es: "Eso es &frac12; &times; 12 &times; 5.",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Yes! A = 12 &times; 5 = 60 m&sup2;. The plaza floor is poured!",
          goodEs: "&iexcl;S&iacute;! 12 &times; 5 = 60. &iexcl;Plaza lista!",
          badEn:
            "&#10060; Not yet. For a parallelogram, MULTIPLY base &times; height: 12 &times; 5. Use the hint.",
          badEs:
            "A&uacute;n no. Paralelogramo: multiplica base &times; altura (12 &times; 5).",
          solveBeat: {
            who: "engineer",
            en: "Plaza floor poured! Now a slanted WALKWAY. It is another parallelogram &mdash; same formula!",
            es: "&iexcl;Piso listo! Ahora un PASILLO inclinado: otro paralelogramo. &iexcl;Misma f&oacute;rmula!",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "engineer",
            en: 'Now build a slanted walkway. It is also a <b>parallelogram</b> with base <b>8 m</b> and height <b>4 m</b>. Use <span class="formula">A = b &times; h</span> again. What is the area?',
            es: "Base = 8, altura = 4. &Aacute;rea = b &times; h.",
          },
          hint: {
            en: "8 &times; 4. Think 8, then double it twice: 8, 16, 32.",
            es: "8 &times; 4. Piensa 8, luego dobla dos veces: 8, 16, 32.",
          },
          choices: [
            {
              en: "12 m&sup2; &nbsp;(that is 8 + 4)",
              es: "Eso es 8 + 4.",
              correct: false,
            },
            {
              en: "16 m&sup2; &nbsp;(that is &frac12; &times; 8 &times; 4)",
              es: "Eso es &frac12; &times; 8 &times; 4.",
              correct: false,
            },
            {
              en: "32 m&sup2; &nbsp;(8 &times; 4)",
              es: "8 &times; 4 = 32.",
              correct: true,
            },
          ],
          goodEn:
            "&#9989; Perfect! A = 8 &times; 4 = 32 m&sup2;. The walkway connects the plaza. PLAZA OPEN!",
          goodEs: "&iexcl;Perfecto! 8 &times; 4 = 32. &iexcl;Plaza abierta!",
          badEn:
            "&#10060; Close &mdash; for area you MULTIPLY base &times; height: 8 &times; 4. Try again.",
          badEs: "Multiplica base &times; altura: 8 &times; 4.",
          solveArt: "parallelogram-build.png",
          solveAlt:
            "Maya watches the glowing slanted plaza floor light up as construction robots finish it",
          solveBeat: {
            who: "engineer",
            en: "The plaza glows to life! Next up: the welcome sign and the stage roof.",
            es: "&iexcl;La plaza se enciende! Sigue: el letrero y el techo del escenario.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Signs & Stages",
      kicker: "Act 2 · Triangles & Trapezoids",
      title: "Signs & Stages",
      advanceLabel: "Light up the park &#10024;",
      steps: [
        {
          type: "beats",
          art: "triangle-trapezoid.png",
          alt: "Maya stands beside a triangular neon entrance sign and a trapezoid-shaped stage canopy",
          lastLabel: "Build the sign &#9654;",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Great work! Next, the big welcome SIGN is a triangle, and the stage ROOF is a trapezoid.",
              es: "&iexcl;Buen trabajo! Ahora el LETRERO es un tri&aacute;ngulo y el TECHO del escenario es un trapecio.",
            },
            {
              who: "engineer",
              en: "A triangle is half of a box, so area = one-half times base times height. Let me build the sign!",
              es: "Un tri&aacute;ngulo es la mitad de una caja: &aacute;rea = &frac12; &times; base &times; altura. &iexcl;A construir el letrero!",
              vocab: [
                {
                  term: "triangle",
                  en: "A three-sided shape. It is half of a box. Area = &frac12; &times; base &times; height.",
                  es: "Una figura de tres lados. Es la mitad de una caja. &Aacute;rea = &frac12; &times; base &times; altura.",
                },
              ],
            },
            {
              who: "bolt",
              misconception: true,
              en: "Base 10 times height 6 is 60 &mdash; done! Lighting up the sign at 60!",
              es: "Base 10 por altura 6 es 60, &iexcl;listo! &iexcl;Enciendo el letrero en 60!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "bolt",
            en: 'The big welcome sign is a <b>triangle</b>. A triangle is half of a box. Use <span class="formula">A = &frac12; &times; b &times; h</span>. The base is <b>10 m</b> and the height is <b>6 m</b>. What is the area?',
            es: "&Aacute;rea de un tri&aacute;ngulo = &frac12; &times; base &times; altura. Base = 10, altura = 6.",
          },
          hint: {
            en: "First multiply 10 &times; 6 = 60. Then take <b>half</b>: 60 &divide; 2 = 30.",
            es: "Primero multiplica 10 &times; 6 = 60. Luego toma la mitad: 60 &divide; 2 = 30.",
          },
          choices: [
            {
              en: "60 m&sup2; &nbsp;(forgot to take half)",
              es: "Olvidaste tomar la mitad.",
              correct: false,
            },
            {
              en: "30 m&sup2; &nbsp;(&frac12; &times; 10 &times; 6)",
              es: "&frac12; &times; 10 &times; 6 = 30.",
              correct: true,
            },
            {
              en: "16 m&sup2; &nbsp;(that is 10 + 6)",
              es: "Eso es 10 + 6.",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Yes! &frac12; &times; 10 &times; 6 = 30 m&sup2;. The triangle sign lights up!",
          goodEs:
            "&iexcl;S&iacute;! &frac12; &times; 10 &times; 6 = 30. &iexcl;El letrero brilla!",
          badEn:
            "&#10060; Remember the HALF. First 10 &times; 6 = 60, then divide by 2 = 30.",
          badEs: "Recuerda la MITAD. 10 &times; 6 = 60, luego &divide; 2 = 30.",
          solveBeat: {
            who: "engineer",
            en: "Sign is glowing! Now the trapezoid roof. I add the two flat sides first, then use the half rule.",
            es: "&iexcl;El letrero brilla! Ahora el techo trapecio: sumo los dos lados planos y luego uso la regla de la mitad.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "engineer",
            en: 'The stage roof is a <b>trapezoid</b> (a shape with two flat parallel sides). Use <span class="formula">A = &frac12; &times; (b&#8321; + b&#8322;) &times; h</span>. The two parallel sides are <b>6 m</b> and <b>10 m</b>, and the height is <b>4 m</b>. What is the area?',
            es: "Trapecio: &frac12; &times; (lado1 + lado2) &times; altura. Lados = 6 y 10, altura = 4.",
            vocab: [
              {
                term: "trapezoid",
                en: "A four-sided shape with two parallel sides. Area = &frac12; &times; (side1 + side2) &times; height.",
                es: "Una figura de cuatro lados con dos lados paralelos. &Aacute;rea = &frac12; &times; (lado1 + lado2) &times; altura.",
              },
            ],
          },
          hint: {
            en: "First add the two flat sides: 6 + 10 = 16. Then 16 &times; 4 = 64. Then take half: 64 &divide; 2 = 32.",
            es: "Primero suma los dos lados planos: 6 + 10 = 16. Luego 16 &times; 4 = 64. Luego toma la mitad: 64 &divide; 2 = 32.",
          },
          frame: {
            en: "&ldquo;For a triangle I use <b>&frac12; &times; base &times; height</b>. For a trapezoid I add the two parallel sides first: &frac12; &times; (____ + ____) &times; ____ = ____.&rdquo;",
            es: "&ldquo;Para un tri&aacute;ngulo uso &frac12; &times; base &times; altura. Para un trapecio sumo primero los dos lados paralelos: &frac12; &times; (____ + ____) &times; ____ = ____.&rdquo;",
          },
          choices: [
            {
              en: "64 m&sup2; &nbsp;(forgot to take half)",
              es: "Olvidaste tomar la mitad.",
              correct: false,
            },
            {
              en: "40 m&sup2; &nbsp;(used only one side, 10 &times; 4)",
              es: "Usaste solo un lado, 10 &times; 4.",
              correct: false,
            },
            {
              en: "32 m&sup2; &nbsp;(&frac12; &times; (6 + 10) &times; 4)",
              es: "&frac12; &times; (6 + 10) &times; 4 = 32.",
              correct: true,
            },
          ],
          goodEn:
            "&#9989; Excellent! &frac12; &times; (6 + 10) &times; 4 = &frac12; &times; 64 = 32 m&sup2;. The stage roof is up! PARK LIT!",
          goodEs:
            "&iexcl;Excelente! &frac12; &times; (6 + 10) &times; 4 = 32. &iexcl;Techo listo!",
          badEn:
            "&#10060; Add BOTH parallel sides first (6 + 10 = 16), times 4 = 64, then take half = 32.",
          badEs:
            "Suma los dos lados (6 + 10 = 16), &times; 4 = 64, mitad = 32.",
          solveBeat: {
            who: "engineer",
            en: "The whole park lights up! One build left &mdash; the Grand Pavilion.",
            es: "&iexcl;Todo el parque se enciende! Falta una construcci&oacute;n: el Gran Pabell&oacute;n.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Build",
      kicker: "Final Build · Composite Figure",
      title: "The Grand Pavilion",
      advanceLabel: "Open the park! &#127881;",
      steps: [
        {
          type: "beats",
          art: "composite-challenge.png",
          alt: "Maya faces a giant holographic master blueprint of the whole park made of combined shapes",
          lastLabel: "Build the pavilion &#9654;",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Last build: the GRAND PAVILION. It is a rectangle with a triangle roof &mdash; two shapes joined together.",
              es: "&Uacute;ltima construcci&oacute;n: el PABELL&Oacute;N. Es un rect&aacute;ngulo con techo triangular: dos figuras juntas.",
              vocab: [
                {
                  term: "composite figure",
                  en: "A big shape made of smaller shapes. Find each area, then add them together.",
                  es: "Una figura grande hecha de figuras m&aacute;s peque&ntilde;as. Halla cada &aacute;rea y s&uacute;malas.",
                },
              ],
            },
            {
              who: "engineer",
              en: "I will find each area and ADD them. Rectangle plus triangle. Let's finish the park!",
              es: "Voy a hallar cada &aacute;rea y SUMARLAS: rect&aacute;ngulo m&aacute;s tri&aacute;ngulo. &iexcl;Terminemos el parque!",
            },
            {
              who: "bolt",
              misconception: true,
              en: "Triangle roof: 10 times 6 is 60. Add the rectangle 40 &mdash; total 100! Entering 100!",
              es: "Techo triangular: 10 por 6 es 60. M&aacute;s el rect&aacute;ngulo 40: &iexcl;total 100! &iexcl;Ingreso 100!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "engineer",
            en: "Hold on, BOLT &mdash; the triangle needs the half! The grand pavilion is a <b>composite figure</b>: a <b>rectangle</b> base with a <b>triangle</b> roof on top. Find the area of EACH part, then ADD them. <br />Rectangle: <b>10 m</b> wide &times; <b>4 m</b> tall. <br />Triangle roof: base <b>10 m</b>, height <b>6 m</b>.",
            es: "Figura compuesta: suma el &aacute;rea del rect&aacute;ngulo y la del tri&aacute;ngulo.",
            vocab: [
              {
                term: "rectangle",
                en: "A box with four right angles. Area = length &times; width.",
                es: "Una caja con cuatro &aacute;ngulos rectos. &Aacute;rea = largo &times; ancho.",
              },
            ],
          },
          hint: {
            en: "Rectangle = 10 &times; 4 = 40. Triangle = &frac12; &times; 10 &times; 6 = 30. Now ADD: 40 + 30.",
            es: "Rect&aacute;ngulo = 10 &times; 4 = 40. Tri&aacute;ngulo = &frac12; &times; 10 &times; 6 = 30. Ahora SUMA: 40 + 30.",
          },
          frame: {
            en: "&ldquo;The rectangle area is ____ and the triangle area is ____. The whole pavilion is ____ + ____ = ____ square meters.&rdquo;",
            es: "&ldquo;El &aacute;rea del rect&aacute;ngulo es ____ y la del tri&aacute;ngulo es ____. Todo el pabell&oacute;n es ____ + ____ = ____ metros cuadrados.&rdquo;",
          },
          choices: [
            {
              en: "40 m&sup2; &nbsp;(only the rectangle)",
              es: "Solo el rect&aacute;ngulo.",
              correct: false,
            },
            {
              en: "70 m&sup2; &nbsp;(40 + 30, both parts)",
              es: "40 + 30, las dos partes.",
              correct: true,
            },
            {
              en: "100 m&sup2; &nbsp;(forgot to take half of the triangle)",
              es: "Olvidaste tomar la mitad del tri&aacute;ngulo.",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; AMAZING! Rectangle 10 &times; 4 = 40, triangle &frac12; &times; 10 &times; 6 = 30, total 40 + 30 = 70 m&sup2;. THE PARK IS COMPLETE!",
          goodEs:
            "&iexcl;Incre&iacute;ble! Rect&aacute;ngulo 40 + tri&aacute;ngulo 30 = 70. &iexcl;Parque listo!",
          badEn:
            "&#10060; Find EACH area, then ADD. Rectangle = 10 &times; 4 = 40. Triangle = &frac12; &times; 10 &times; 6 = 30. 40 + 30 = 70.",
          badEs: "Halla cada &aacute;rea y s&uacute;malas: 40 + 30 = 70.",
          solveBeat: {
            who: "engineer",
            en: "The Grand Pavilion rises! Time for the grand opening, BOLT &mdash; thanks for the help, even the wrong guesses.",
            es: "&iexcl;El Gran Pabell&oacute;n se levanta! Hora de la gran apertura, BOLT. Gracias por la ayuda.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "&#128208;",
      en: "Area",
      es: "&aacute;rea",
      def: "The amount of flat space inside a shape. We measure it in square units, like square meters (m&sup2;).",
    },
    {
      ico: "&#9645;",
      en: "Base (b)",
      es: "base",
      def: "The flat bottom side of a shape that we measure along. Example: the bottom of a triangle.",
    },
    {
      ico: "&#8597;",
      en: "Height (h)",
      es: "altura",
      def: "The straight-up distance from the base to the top. It makes a right angle with the base.",
    },
    {
      ico: "&#9647;",
      en: "Parallelogram",
      es: "paralelogramo",
      def: "A slanted four-sided box. Area = base &times; height. Example: 12 &times; 5 = 60.",
    },
    {
      ico: "&#9651;",
      en: "Triangle",
      es: "tri&aacute;ngulo",
      def: "A three-sided shape. It is half of a box. Area = &frac12; &times; base &times; height.",
    },
    {
      ico: "&#9186;",
      en: "Trapezoid",
      es: "trapecio",
      def: "A four-sided shape with two parallel sides. Area = &frac12; &times; (side1 + side2) &times; height.",
    },
    {
      ico: "&#9636;",
      en: "Rectangle",
      es: "rect&aacute;ngulo",
      def: "A box with four right angles. Area = length &times; width.",
    },
    {
      ico: "&#129513;",
      en: "Composite figure",
      es: "figura compuesta",
      def: "A big shape made of smaller shapes. Find each area, then add them together.",
    },
    {
      ico: "&#10006;&#65039;",
      en: "Square unit",
      es: "unidad cuadrada",
      def: "The unit for area, like a square meter (m&sup2;). It is a square that is 1 unit on each side.",
    },
  ],

  complete: {
    art: "grand-opening.png",
    alt: "Maya raises her arms in triumph as the finished theme park glows with rides and fireworks",
    badge: "&#127881;&#127906;&#11088;",
    titleEn: "Grand Opening &mdash; Mission Complete!",
    en: "You built the whole park! You used <b>A = b &times; h</b> for parallelograms, <b>A = &frac12;bh</b> for triangles, and <b>A = &frac12;(b&#8321;+b&#8322;)h</b> for trapezoids. You even added shapes together for the pavilion. Amazing work, Engineer!",
    es: "&iexcl;Construiste todo el parque! Usaste las f&oacute;rmulas del &aacute;rea. &iexcl;Excelente trabajo!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Theme park triangle: A triangular garden bed has a base of <strong>8 meters</strong> and a height of <strong>5 meters</strong>. Find the area of the garden.",
      promptEs:
        "Un jard&iacute;n triangular tiene una base de 8 metros y una altura de 5 metros. Encuentra el &aacute;rea del jard&iacute;n.",
      choices: [
        {
          en: "A) 40 square meters &nbsp;(forgot to divide by 2: base &times; height)",
          correct: false,
        },
        {
          en: "B) 20 square meters &nbsp;(&frac12; &times; 8 &times; 5 = 20) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 13 square meters &nbsp;(added dimensions together)",
          correct: false,
        },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      badEn:
        "❌ That is incorrect. Review your calculations and try another option!",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};

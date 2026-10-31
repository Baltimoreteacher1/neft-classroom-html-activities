// Student tour: second person, short sentences, every anchor sits on the library view.
// `dynamic: true` marks an anchor the app renders at runtime, so it is not in index.html.

export const STUDENT_STEPS = [
  {
    id: "welcome",
    anchor: null,
    en: {
      title: "Welcome to your Math Journey",
      body: [
        "This tour takes about a minute and shows you where everything is.",
        "There are no timers here, and your progress stays on this device.",
      ],
    },
    es: {
      title: "Te damos la bienvenida a tu camino en matemáticas",
      body: [
        "Este recorrido dura como un minuto y te muestra dónde está cada cosa.",
        "Aquí no hay cronómetros, y tu progreso se queda en este dispositivo.",
      ],
    },
  },
  {
    id: "grade",
    anchor: "#grade-tabs",
    en: {
      title: "Choose your grade",
      body: [
        "Start with your own grade. You can switch to another grade any time to review older ideas or try newer ones.",
      ],
    },
    es: {
      title: "Elige tu grado",
      body: [
        "Empieza con tu grado. Puedes cambiar a otro cuando quieras para repasar ideas anteriores o probar otras nuevas.",
      ],
    },
  },
  {
    id: "today",
    anchor: "#personal-dashboard .journey-today",
    dynamic: true,
    demo: "tenframe",
    en: {
      title: "Today's 10",
      body: [
        "Today's 10 is a short set of problems picked for you. Press “Open today’s practice” to start, and try each problem on your own first.",
        "Stuck? Make a ten. For 7 + 5, fill a ten-frame with 7, add 3 more to make 10, then add the last 2.",
      ],
    },
    es: {
      title: "Los 10 de hoy",
      body: [
        "Los 10 de hoy son unos problemas cortos escogidos para ti. Toca “Abre la práctica de hoy” para empezar, y primero intenta cada problema por tu cuenta.",
        "¿Te atascaste? Forma una decena. Para 7 + 5, llena un marco de diez con 7, agrega 3 más para llegar a 10 y luego suma los 2 que faltan.",
      ],
    },
  },
  {
    id: "library",
    anchor: ".skill-search-toolbar",
    en: {
      title: "Find any skill",
      body: [
        "Type a topic, like “fractions,” in the search box, or pick a skill from the list. Every skill has a short lesson and practice.",
      ],
    },
    es: {
      title: "Busca cualquier habilidad",
      body: [
        "Escribe un tema, como “fracciones”, en el cuadro de búsqueda, o elige una habilidad de la lista. Cada habilidad tiene una lección corta y práctica.",
      ],
    },
  },
  {
    id: "games",
    anchor: '#hub-tabs button[data-view="games"]',
    en: {
      title: "Games",
      body: [
        "Play math games with no timer. Use pictures and models to think about numbers in new ways.",
      ],
    },
    es: {
      title: "Juegos",
      body: [
        "Juega juegos de matemáticas sin cronómetro. Usa dibujos y modelos para pensar en los números de nuevas maneras.",
      ],
    },
  },
  {
    id: "mistakes",
    anchor: '#hub-tabs button[data-view="notebook"]',
    demo: "hints",
    en: {
      title: "Fix my mistakes",
      body: [
        "Missed one? It is saved here, and you get a fresh, similar problem to try. Mistakes are clues.",
        "Get two new ones right in a row, on your own, and that mistake counts as fixed.",
      ],
    },
    es: {
      title: "Corregir mis errores",
      body: [
        "¿Fallaste una? Se guarda aquí y recibes un problema nuevo y parecido para intentar. Los errores son pistas.",
        "Si aciertas dos nuevos seguidos, por tu cuenta, ese error cuenta como corregido.",
      ],
    },
  },
  {
    id: "progress",
    anchor: '#hub-tabs button[data-view="path"]',
    en: {
      title: "My progress",
      body: [
        "See what you have practiced and what is ready to look at again. It is a snapshot to help you choose, not a test score.",
      ],
    },
    es: {
      title: "Mi progreso",
      body: [
        "Mira lo que has practicado y lo que está listo para repasar. Es una foto del momento para ayudarte a elegir, no una calificación.",
      ],
    },
  },
  {
    id: "settings",
    anchor: "#settings-toggle",
    en: {
      title: "Make it comfortable",
      body: [
        "Open Settings to change the text size, turn on Focus view or a reading font, or turn sound on.",
      ],
    },
    es: {
      title: "Hazlo cómodo para ti",
      body: [
        "Abre Configuración para cambiar el tamaño del texto, activar la vista de enfoque o una letra más fácil de leer, o encender el sonido.",
      ],
    },
  },
  {
    id: "language",
    anchor: "#lang-toggle",
    en: {
      title: "English or Español",
      body: [
        "Press this button to switch the page between English and Español. Menus and games change; some lesson text may stay in English.",
      ],
    },
    es: {
      title: "Español o English",
      body: [
        "Toca este botón para cambiar la página entre español e inglés. Los menús y los juegos cambian; parte del texto de las lecciones puede quedarse en inglés.",
      ],
    },
  },
];

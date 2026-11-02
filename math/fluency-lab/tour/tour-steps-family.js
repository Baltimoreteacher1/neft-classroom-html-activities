// Family tour: for a parent or caregiver. English speaks to "you"; Spanish speaks to "ustedes".
// Quoted prompts a parent says to a child use "tú". `dynamic: true` marks an anchor rendered at runtime.

export const FAMILY_STEPS = [
  {
    id: "learner",
    anchor: "#profile-select",
    en: {
      title: "Pick the learner",
      body: [
        "Each child gets their own learner slot on this device, so practice is saved separately. These are slots, not accounts, and no names are collected.",
      ],
    },
    es: {
      title: "Elijan al estudiante",
      body: [
        "Cada estudiante tiene su propio espacio en este dispositivo, así que la práctica de cada uno se guarda por separado. Son espacios, no cuentas, y no se pide ningún nombre.",
      ],
    },
  },
  {
    id: "grade",
    anchor: "#grade-tabs",
    en: {
      title: "Choose the grade",
      body: [
        "Pick the grade your child is working on in class. Choosing a lower grade to review is completely fine.",
      ],
    },
    es: {
      title: "Elijan el grado",
      body: [
        "Escojan el grado que su hijo o hija está trabajando en clase. Elegir un grado menor para repasar está perfectamente bien.",
      ],
    },
  },
  {
    id: "today",
    anchor: "#personal-dashboard .journey-today",
    dynamic: true,
    demo: "tenframe",
    en: {
      title: "Today's 10, together",
      body: [
        "Sit side by side and press “Open today’s practice.” Let your child answer first, even if it takes a while. Nothing is timed.",
        "One trick your child may use: for 7 + 5, fill a ten-frame with 7, add 3 more to make 10, then add the last 2.",
      ],
    },
    es: {
      title: "Los 10 de hoy, juntos",
      body: [
        "Siéntense lado a lado y toquen “Abre la práctica de hoy”. Dejen que su hijo o hija responda primero, aunque tarde un poco. Nada tiene cronómetro.",
        "Un truco que su hijo o hija puede usar: para 7 + 5, se llena un marco de diez con 7, se agregan 3 más para llegar a 10 y luego se suman los 2 que faltan.",
      ],
    },
  },
  {
    id: "help",
    anchor: null,
    demo: "hints",
    en: {
      title: "How to help",
      body: [
        "Ask instead of telling. Try “What could you try?” or “What do you notice?” before you show a step.",
        "Hints are always okay. A skill shows as remembered from answers a child gets right on a first try without help, and help is still good practice.",
      ],
    },
    es: {
      title: "Cómo ayudar",
      body: [
        "Pregunten en lugar de decir la respuesta. Prueben con “¿Qué podrías intentar?” o “¿Qué notas?” antes de mostrar un paso.",
        "Las pistas siempre están bien. Una habilidad se muestra como recordada con las respuestas correctas al primer intento y sin ayuda; con ayuda, también es buena práctica.",
      ],
    },
  },
  {
    id: "progress",
    anchor: '#hub-tabs button[data-view="path"]',
    en: {
      title: "See progress",
      body: [
        "Open My progress to see what your child has practiced and what is ready to look at again. It is a snapshot to guide practice, not a grade level or a test score.",
      ],
    },
    es: {
      title: "Vean el progreso",
      body: [
        "Abran Mi progreso para ver qué ha practicado su hijo o hija y qué está listo para repasar. Es una foto del momento para orientar la práctica, no un nivel de grado ni una calificación.",
      ],
    },
  },
  {
    id: "tonight",
    anchor: '.intro .button-row a[href="./family/"]',
    en: {
      title: "Family Math Tonight",
      body: [
        "A guided session for you and your child. It suggests what to say along the way, and you do not need to know every answer.",
      ],
    },
    es: {
      title: "Matemáticas en familia esta noche",
      body: [
        "Una sesión guiada para ustedes y su hijo o hija. Les sugiere qué decir en el camino, y no necesitan saber todas las respuestas.",
      ],
    },
  },
  {
    id: "language",
    anchor: "#lang-toggle",
    en: {
      title: "Pick a language",
      body: [
        "Use this button to switch the page between English and Español. Menus and games change; some lesson text may stay in English.",
      ],
    },
    es: {
      title: "Elijan el idioma",
      body: [
        "Usen este botón para cambiar la página entre español e inglés. Los menús y los juegos cambian; parte del texto de las lecciones puede quedarse en inglés.",
      ],
    },
  },
  {
    id: "expedition",
    anchor: '.intro .button-row a[href="./family-adventure/"]',
    link: {
      href: "./family-adventure/",
      en: "Open the Family Math Expedition",
      es: "Abrir la Expedición de Matemáticas en Familia",
    },
    en: {
      title: "Go further together",
      body: [
        "The Family Math Expedition is a guided tour for families, with more detail on how to learn math together.",
      ],
    },
    es: {
      title: "Sigan avanzando juntos",
      body: [
        "La Expedición de Matemáticas en Familia es un recorrido guiado para familias, con más detalles sobre cómo aprender matemáticas juntos.",
      ],
    },
  },
];

// Language City episode: Morning at Sunrise Clinic (/city/clinic/sunrise-clinic).
// Key Language Use: Inform — read clinic signs & medicine labels, listen to Nurse Amara,
// compare care instructions, assemble a safe care plan, rehearse an explanation aloud,
// and write an informative note home. Practice, not a test (no WIDA/ACCESS items).
import { bi } from "./city-kit.js";

export const CLINIC_EPISODE = {
  id: "sunrise-clinic",
  place: "clinic",
  use: "Inform",
  storageKey: "accessPracticeLab:v1:city-clinic-episode",
  title: bi("Morning at Sunrise Clinic", "Mañana en la Clínica Amanecer"),
  blurb: bi(
    "Read the clinic sign and medicine label, listen to Nurse Amara, compare care instructions and write a clear note home.",
    "Lee el letrero de la clínica y la etiqueta del medicamento, escucha a la enfermera Amara, compara las instrucciones de cuidado y escribe una nota clara para casa.",
  ),
  eyebrow: bi(
    "Language City · an episode at Sunrise Clinic (Inform)",
    "Ciudad del lenguaje · un episodio en la Clínica Amanecer (Informar)",
  ),
  spotsNeeded: { A: 4, B: 5, C: 6 },
  people: {
    amara: { name: "Nurse Amara", role: bi("nurse", "enfermera") },
    diego: { name: "Diego", role: bi("student patient", "estudiante paciente") },
  },
  spots: [
    {
      id: "desk-sign",
      label: bi("front desk sign", "letrero del mostrador"),
      at: [18, 42],
      sign: {
        head: bi("Sunrise Clinic Check-In", "Registro de la Clínica Amanecer"),
        lines: [
          bi("1. Sign your name and time.", "1. Anota tu nombre y la hora."),
          bi("2. Put on a mask if you have a cough or fever.", "2. Ponte una mascarilla si tienes tos o fiebre."),
          bi("3. Wait in the green chairs.", "3. Espera en las sillas verdes."),
        ],
      },
      word: { en: "symptom", es: "síntoma", def: bi("a sign that your body feels sick", "una señal de que tu cuerpo se siente enfermo") },
    },
    {
      id: "thermometer",
      label: bi("temperature chart", "tabla de temperatura"),
      at: [36, 56],
      sign: {
        head: bi("Temperature Guide", "Guía de temperatura"),
        lines: [
          bi("Normal: 98.6°F (37°C)", "Normal: 98.6 °F (37 °C)"),
          bi("Fever: 100.4°F (38°C) or higher", "Fiebre: 100.4 °F (38 °C) o más"),
          bi("Diego's reading: 100.8°F", "Lectura de Diego: 100.8 °F"),
        ],
      },
      word: { en: "fever", es: "fiebre", def: bi("a body temperature higher than normal", "una temperatura del cuerpo más alta de lo normal") },
    },
    {
      id: "label",
      label: bi("medicine label", "etiqueta del medicamento"),
      at: [55, 44],
      sign: {
        head: bi("Children's Fever Syrup", "Jarabe infantil para la fiebre"),
        lines: [
          bi("Ages 6–11: 1 teaspoon (5 mL) every 6 hours.", "Edades 6–11: 1 cucharadita (5 mL) cada 6 horas."),
          bi("Do not take more than 4 doses in 24 hours.", "No tomes más de 4 dosis en 24 horas."),
          bi("Take with water and rest.", "Tómalo con agua y descansa."),
        ],
      },
      word: { en: "dose", es: "dosis", def: bi("the exact amount of medicine to take one time", "la cantidad exacta de medicina que se toma una vez") },
    },
    {
      id: "hydration",
      label: bi("water station", "estación de agua"),
      at: [72, 60],
      sign: {
        head: bi("Rest & Fluids", "Descanso y líquidos"),
        lines: [
          bi("Drink water every hour.", "Toma agua cada hora."),
          bi("Stay home until fever-free for 24 hours.", "Quédate en casa hasta pasar 24 horas sin fiebre."),
        ],
      },
      word: { en: "hydrate", es: "hidratar", def: bi("to drink enough water so your body recovers", "tomar suficiente agua para que tu cuerpo se recupere") },
    },
    {
      id: "hours",
      label: bi("clinic hours", "horario de la clínica"),
      at: [84, 38],
      sign: {
        head: bi("Clinic Hours", "Horario de la clínica"),
        lines: [
          bi("Monday–Friday: 8:00 a.m. – 5:00 p.m.", "Lunes a viernes: 8:00 a. m. – 5:00 p. m."),
          bi("Nurse line: call anytime for questions.", "Línea de enfermería: llama en cualquier momento si tienes preguntas."),
        ],
      },
      word: { en: "instructions", es: "instrucciones", def: bi("clear steps that tell you what to do", "pasos claros que te dicen qué hacer") },
    },
    {
      id: "note-pad",
      label: bi("care summary sheet", "hoja de resumen de cuidado"),
      at: [46, 74],
      sign: {
        head: bi("School Return Rule", "Regla para volver a la escuela"),
        lines: [
          bi("Return to school after 24 hours with no fever.", "Vuelve a la escuela después de 24 horas sin fiebre."),
          bi("Bring this signed note to the school office.", "Trae esta nota firmada a la oficina de la escuela."),
        ],
      },
      word: { en: "recover", es: "recuperarse", def: bi("to get healthy again after being sick", "volver a estar sano después de estar enfermo") },
    },
  ],
  dialogue: [
    {
      who: "amara",
      ...bi(
        "Good morning, Diego. Tell me what symptoms you have and when they started.",
        "Buenos días, Diego. Dime qué síntomas tienes y cuándo empezaron.",
      ),
    },
    {
      who: "diego",
      ...bi(
        "My throat started hurting last night, and I have had a dry cough since this morning.",
        "Me empezó a doler la garganta anoche y tengo tos seca desde esta mañana.",
      ),
    },
    {
      who: "amara",
      ...bi(
        "Your temperature is 100.8 degrees, which is a mild fever. Please wear a mask while you are here.",
        "Tu temperatura es 100.8 grados, que es una fiebre leve. Por favor usa mascarilla mientras estés aquí.",
      ),
    },
    {
      who: "diego",
      ...bi(
        "How much medicine should I take, and when can I go back to school?",
        "¿Cuánta medicina debo tomar y cuándo puedo volver a la escuela?",
      ),
    },
    {
      who: "amara",
      ...bi(
        "Take one teaspoon every six hours—never more than four doses in a day. Drink water, rest, and stay home until you have no fever for twenty-four hours.",
        "Toma una cucharadita cada seis horas, nunca más de cuatro dosis en un día. Toma agua, descansa y quédate en casa hasta pasar veinticuatro horas sin fiebre.",
      ),
    },
  ],
  listenQ: {
    A: {
      ask: bi("What is Diego's temperature?", "¿Cuál es la temperatura de Diego?"),
      opts: [
        { id: "a", ...bi("98.6 degrees", "98.6 grados"), why: bi("98.6 is normal, not Diego's reading.", "98.6 es normal, no la lectura de Diego.") },
        { id: "b", ...bi("100.8 degrees", "100.8 grados"), why: bi("Yes. Nurse Amara says Diego's temperature is 100.8 degrees.", "Sí. La enfermera Amara dice que la temperatura de Diego es 100.8 grados.") },
        { id: "c", ...bi("104 degrees", "104 grados"), why: bi("Nurse Amara never says 104 degrees.", "La enfermera Amara nunca dice 104 grados.") },
      ],
      answer: "b",
    },
    B: {
      ask: bi("How often may Diego take one teaspoon of fever syrup?", "¿Cada cuánto tiempo puede Diego tomar una cucharadita de jarabe?"),
      opts: [
        { id: "a", ...bi("Every 2 hours", "Cada 2 horas"), why: bi("Every 2 hours would be too many doses in one day.", "Cada 2 horas serían demasiadas dosis en un día.") },
        { id: "b", ...bi("Every 6 hours", "Cada 6 horas"), why: bi("Yes. One teaspoon every 6 hours, up to 4 doses in 24 hours.", "Sí. Una cucharadita cada 6 horas, hasta 4 dosis en 24 horas.") },
        { id: "c", ...bi("Once a week", "Una vez a la semana"), why: bi("Listen again for the number of hours between doses.", "Escucha otra vez el número de horas entre dosis.") },
      ],
      answer: "b",
    },
    C: {
      ask: bi("Why must Diego stay home tomorrow if he still has a fever tonight?", "¿Por qué debe quedarse Diego en casa mañana si todavía tiene fiebre esta noche?"),
      opts: [
        { id: "a", ...bi("The school is closed on Fridays.", "La escuela cierra los viernes."), why: bi("Neither speaker mentions the school being closed.", "Ninguno dice que la escuela esté cerrada.") },
        { id: "b", ...bi("He must be fever-free for 24 full hours before returning.", "Debe pasar 24 horas completas sin fiebre antes de volver."), why: bi("Yes. Both the nurse and the school return sheet state the 24-hour fever-free rule.", "Sí. Tanto la enfermera como la hoja de regreso indican la regla de 24 horas sin fiebre.") },
        { id: "c", ...bi("He forgot his medicine at home.", "Olvidó su medicina en casa."), why: bi("That is not the reason Nurse Amara gives.", "Esa no es la razón que da la enfermera Amara.") },
      ],
      answer: "b",
    },
  },
  readQ: {
    A: {
      ask: bi("Read the check-in sign. Where should you wait?", "Lee el letrero de registro. ¿Dónde debes esperar?"),
      opts: [
        { id: "a", ...bi("In the green chairs", "En las sillas verdes"), why: bi("Yes. Step 3 on the check-in sign says to wait in the green chairs.", "Sí. El paso 3 dice que esperes en las sillas verdes.") },
        { id: "b", ...bi("Outside the clinic", "Afuera de la clínica"), why: bi("Check step 3 on the front desk sign.", "Revisa el paso 3 en el letrero del mostrador.") },
        { id: "c", ...bi("At the school office", "En la oficina de la escuela"), why: bi("The school office is where you bring the signed note later.", "A la oficina de la escuela llevas la nota firmada después.") },
      ],
      answer: "a",
    },
    B: {
      ask: bi("Compare the label and the chart. What is the maximum number of doses in 24 hours?", "Compara la etiqueta y la tabla. ¿Cuál es el máximo de dosis en 24 horas?"),
      opts: [
        { id: "a", ...bi("2 doses", "2 dosis"), why: bi("Read line 2 of the medicine label carefully.", "Lee con cuidado la línea 2 de la etiqueta.") },
        { id: "b", ...bi("4 doses", "4 dosis"), why: bi("Yes. Do not take more than 4 doses in 24 hours (1 every 6 hours).", "Sí. No tomes más de 4 dosis en 24 horas (1 cada 6 horas).") },
        { id: "c", ...bi("6 doses", "6 dosis"), why: bi("6 is the number of hours between doses, not the maximum number of doses.", "6 es el número de horas entre dosis, no el máximo de dosis.") },
      ],
      answer: "b",
    },
    C: {
      ask: bi("A cousin says Diego should take 2 teaspoons now so his fever drops faster. What does the label show?", "Un primo dice que Diego debe tomar 2 cucharaditas ahora para que la fiebre baje más rápido. ¿Qué muestra la etiqueta?"),
      opts: [
        { id: "a", ...bi("That is safe as long as he drinks water.", "Eso es seguro si toma agua."), why: bi("Water helps, but it does not change the safe dose on the label.", "El agua ayuda, pero no cambia la dosis segura de la etiqueta.") },
        { id: "b", ...bi("No. For ages 6–11, one dose is 1 teaspoon every 6 hours, and doubling it breaks the safety limit.", "No. Para edades de 6 a 11 años, una dosis es 1 cucharadita cada 6 horas, y duplicarla rompe el límite seguro."), why: bi("Yes. Exact dose instructions prevent taking too much medicine.", "Sí. Las instrucciones exactas evitan tomar demasiada medicina.") },
        { id: "c", ...bi("The label does not give a dose for age 11.", "La etiqueta no da una dosis para los 11 años."), why: bi("Look at line 1: Ages 6–11 includes age 11.", "Mira la línea 1: Edades 6–11 incluye los 11 años.") },
      ],
      answer: "b",
    },
  },
  task: {
    title: bi("Build the care plan", "Arma el plan de cuidado"),
    prompt: bi(
      "Choose ONLY the 3 accurate care instructions from Nurse Amara and the clinic signs.",
      "Elige SOLO las 3 instrucciones correctas de la enfermera Amara y los letreros de la clínica.",
    ),
    items: [
      { id: "dose-5ml", required: true, label: bi("Take 1 teaspoon (5 mL) every 6 hours, max 4 doses/day", "Tomar 1 cucharadita (5 mL) cada 6 horas, máx. 4 dosis/día") },
      { id: "water-rest", required: true, label: bi("Drink water every hour and rest", "Tomar agua cada hora y descansar") },
      { id: "wait-24h", required: true, label: bi("Stay home until fever-free for 24 hours", "Quedarse en casa hasta pasar 24 horas sin fiebre") },
      { id: "double-dose", required: false, label: bi("Take 2 teaspoons at once so the fever drops faster", "Tomar 2 cucharaditas juntas para que baje la fiebre más rápido") },
      { id: "go-school", required: false, label: bi("Go straight to gym class if you feel a little better", "Ir directo a educación física si te sientes un poco mejor") },
    ],
  },
  speak: {
    A: {
      task: bi("Tell Nurse Amara your symptom and ask one question.", "Dile a la enfermera Amara tu síntoma y haz una pregunta."),
      starters: [bi("I have a ___ .", "Tengo ___."), bi("How much ___ should I take?", "¿Cuánta ___ debo tomar?")],
      model: bi("I have a cough and a fever. How much medicine should I take?", "Tengo tos y fiebre. ¿Cuánta medicina debo tomar?"),
    },
    B: {
      task: bi("Explain your symptoms, when they started, and ask about returning to school.", "Explica tus síntomas, cuándo empezaron y pregunta cuándo volver a la escuela."),
      starters: [bi("My ___ started ___, and now I have ___ .", "Mi ___ empezó ___, y ahora tengo ___."), bi("When can I ___ ?", "¿Cuándo puedo ___?")],
      model: bi("My throat started hurting last night, and now I have a fever of 100.8. When can I return to school?", "Me empezó a doler la garganta anoche y ahora tengo fiebre de 100.8. ¿Cuándo puedo volver a la escuela?"),
    },
    C: {
      task: bi("Summarize the full care plan aloud so your family knows the exact dose and return rule.", "Resume en voz alta todo el plan de cuidado para que tu familia sepa la dosis exacta y la regla de regreso."),
      starters: [bi("Nurse Amara said to ___ every ___ hours, and not more than ___ .", "La enfermera Amara dijo que ___ cada ___ horas, y no más de ___."), bi("I must stay home until ___ .", "Debo quedarme en casa hasta ___.")],
      model: bi("Nurse Amara said to take one teaspoon every six hours, and not more than four doses in twenty-four hours. I must drink water, rest, and stay home until I am fever-free for twenty-four hours.", "La enfermera Amara dijo que tome una cucharadita cada seis horas y no más de cuatro dosis en veinticuatro horas. Debo tomar agua, descansar y quedarme en casa hasta pasar veinticuatro horas sin fiebre."),
    },
  },
  write: {
    A: {
      task: bi("Write a short note to your family saying what the nurse found.", "Escribe una nota corta a tu familia diciendo lo que encontró la enfermera."),
      frames: [bi("My temperature is ___ .", "Mi temperatura es ___."), bi("I need to ___ .", "Necesito ___.")],
      minWords: 4,
    },
    B: {
      task: bi("Write an informative note explaining the symptom, the safe dose, and when you can return to school.", "Escribe una nota informativa explicando el síntoma, la dosis segura y cuándo puedes volver a la escuela."),
      frames: [bi("The nurse checked my ___ and found ___ .", "La enfermera revisó mi ___ y encontró ___."), bi("I should take ___ every ___ hours.", "Debo tomar ___ cada ___ horas.")],
      minWords: 10,
    },
    C: {
      task: bi("Write a clear care summary for your family and teacher using because, but, and so.", "Escribe un resumen claro de cuidado para tu familia y docente usando because, but y so."),
      frames: [bi("I have to stay home because ___ .", "Debo quedarme en casa porque ___."), bi("I may feel better tonight, but ___ .", "Puede que me sienta mejor esta noche, pero ___."), bi("The label limits doses to 4 per day, so ___ .", "La etiqueta limita las dosis a 4 al día, así que ___.")],
      minWords: 22,
    },
  },
};

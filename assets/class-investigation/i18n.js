// Our Class Investigation — every word a student, family or teacher reads.
//
// English leads, Spanish is written to read naturally rather than word for word,
// and both live next to each other so a missing sibling is visible in review and
// is caught by i18n.test.mjs. The language is the site-wide `nt-lang` choice.
//
// Placeholders look like {name}. English and Spanish must use the same set.

const T = {};
const s = (key, en, es) => {
  T[key] = { en, es };
};

/* ── page ─────────────────────────────────────────────────────────────────── */
s("title", "Our Class Investigation", "Nuestra investigación de la clase");
s(
  "tagline",
  "One real question all year. Every unit gives us a new tool to answer it.",
  "Una pregunta real durante todo el año. Cada unidad nos da una herramienta nueva para responderla.",
);
s("back", "← Back to curriculum", "← Volver al currículo");
s("skip", "Skip to main content", "Saltar al contenido principal");
s("langLabel", "Language", "Idioma");
s(
  "noScript",
  "This page needs JavaScript to run.",
  "Esta página necesita JavaScript para funcionar.",
);

/* ── join ─────────────────────────────────────────────────────────────────── */
s("joinTitle", "Join your class", "Únete a tu clase");
s(
  "joinHelp",
  "Type the 6-letter class code your teacher gave you. We never ask for your name.",
  "Escribe el código de 6 letras que te dio tu maestro. Nunca te pedimos tu nombre.",
);
s("codeLabel", "Class code", "Código de la clase");
s("joinBtn", "Join", "Unirme");
s("soloBtn", "Work on my own", "Trabajar por mi cuenta");
s(
  "soloNote",
  "On my own: your data stays on this device. Nothing is sent anywhere.",
  "Por mi cuenta: tus datos se quedan en este dispositivo. No se envía nada a ningún lado.",
);
s("inClass", "You are in class {code}.", "Estás en la clase {code}.");
s("leaveBtn", "Leave class", "Salir de la clase");
s(
  "badCode",
  "That code doesn't look right. It has 6 letters and numbers.",
  "Ese código no parece correcto. Tiene 6 letras y números.",
);
s(
  "noClass",
  "We couldn't find that class. Check the code with your teacher.",
  "No encontramos esa clase. Revisa el código con tu maestro.",
);
s(
  "serverDown",
  "Sharing with the class isn't available right now. You can still work on your own.",
  "Compartir con la clase no está disponible ahora. Aún puedes trabajar por tu cuenta.",
);

/* ── status ───────────────────────────────────────────────────────────────── */
s("modeSolo", "Working on my own", "Trabajando por mi cuenta");
s("modeClass", "With my class", "Con mi clase");
s("online", "Online", "Con conexión");
s("offline", "Offline", "Sin conexión");
s("allSent", "Everything is sent.", "Todo está enviado.");
s("waiting", "{n} waiting to send", "{n} esperando para enviarse");
s(
  "savedOffline",
  "Saved on this device. We'll send it when you are online.",
  "Guardado en este dispositivo. Lo enviaremos cuando tengas conexión.",
);
s("syncNow", "Send now", "Enviar ahora");
s("refresh", "Refresh the graph", "Actualizar la gráfica");
s("lastUpdated", "Class data loaded.", "Datos de la clase cargados.");
s(
  "rejectedNote",
  "{n} could not be added because the class moved on to a new question. They are still in your list on this device.",
  "{n} no se pudieron agregar porque la clase pasó a una pregunta nueva. Siguen en tu lista en este dispositivo.",
);

/* ── investigation ────────────────────────────────────────────────────────── */
s("investTitle", "Our investigation", "Nuestra investigación");
s("pickInvest", "Choose an investigation", "Elige una investigación");
s(
  "teacherPicks",
  "Your teacher chooses the active question.",
  "Tu maestro elige la pregunta activa.",
);
s("viewOther", "Look at another question", "Ver otra pregunta");
s("statusOpen", "We are collecting", "Estamos recopilando datos");
s(
  "statusClosed",
  "Closed: we are not collecting right now",
  "Cerrada: ahora no estamos recopilando datos",
);
s("notActive", "Not the active question", "No es la pregunta activa");
s("dotsCount", "{n} dots on our graph", "{n} puntos en nuestra gráfica");
s("whyTitle", "Why it matters", "Por qué importa");

/* ── the form ─────────────────────────────────────────────────────────────── */
s("formTitle", "Add your measurement", "Agrega tu medida");
s(
  "formRule",
  "Check it before you send. Once it's sent, it can't be changed.",
  "Revísala antes de enviarla. Una vez enviada, no se puede cambiar.",
);
s("addBtn", "Add my dot", "Agregar mi punto");
s("optionalTag", "optional", "opcional");
s(
  "optionalHint",
  "You can leave this blank. That's always okay.",
  "Puedes dejarla en blanco. Siempre está bien.",
);
s("pickOne", "Pick one", "Elige una");
s(
  "unusual",
  "{value} {unit} is unusual for our class. Is it right?",
  "{value} {unit} es poco común en nuestra clase. ¿Es correcto?",
);
s("yesRight", "Yes, it's right", "Sí, es correcto");
s("fixIt", "Let me fix it", "Quiero corregirlo");
s("thanks", "Your dot is on the graph. Thank you!", "¡Tu punto ya está en la gráfica! ¡Gracias!");
s(
  "thanksQueued",
  "Your dot is saved. It will join the class graph when you are online.",
  "Tu punto está guardado. Se unirá a la gráfica de la clase cuando tengas conexión.",
);
s(
  "limitReached",
  "This device already added its measurement. For another person, tap “Next person”.",
  "Este dispositivo ya agregó su medida. Para otra persona, toca «Siguiente persona».",
);
s("nextPerson", "Next person", "Siguiente persona");
s(
  "nextPersonNote",
  "Starts a new anonymous entry. There are no names.",
  "Empieza una entrada anónima nueva. No hay nombres.",
);
s("closedForm", "We are not collecting right now.", "Ahora no estamos recopilando datos.");
s(
  "notActiveForm",
  "Switch to the active question to add a dot.",
  "Cambia a la pregunta activa para agregar un punto.",
);
s("errMissing", "Please fill this in.", "Por favor completa esto.");
s("errNumber", "Type a number.", "Escribe un número.");
s(
  "errTooSmall",
  "That's too small. Use {min} {unit} or more.",
  "Es muy pequeño. Usa {min} {unit} o más.",
);
s(
  "errTooLarge",
  "That's too big. Use {max} {unit} or less.",
  "Es muy grande. Usa {max} {unit} o menos.",
);
s("errStep", "Round to the nearest {step}.", "Redondea a {step} más cercano.");
s("errChoice", "Pick one of the choices.", "Elige una de las opciones.");
s(
  "errGeneric",
  "That didn't work. Check the boxes and try again.",
  "No funcionó. Revisa las casillas e inténtalo de nuevo.",
);

/* ── charts ───────────────────────────────────────────────────────────────── */
s("viewDot", "Dot plot", "Gráfica de puntos");
s("viewHist", "Histogram", "Histograma");
s("viewScatter", "Scatter plot", "Diagrama de dispersión");
s("viewBar", "Bar graph", "Gráfica de barras");
s("graphTitle", "Our data, live", "Nuestros datos, en vivo");
s("showVar", "Show", "Mostrar");
s("xVar", "Across (x)", "Horizontal (x)");
s("yVar", "Up (y)", "Vertical (y)");
s("yCount", "Number of dots", "Cantidad de puntos");
s("tableToggle", "Show the data as a table", "Ver los datos como tabla");
s("tableDot", "Dot", "Punto");
s("tableSource", "Added from", "Agregado desde");
s("you", "you", "tú");
s("srcClass", "class", "la clase");
s("srcHome", "home", "casa");
s("legendMine", "Ringed dot = yours", "Punto con aro = el tuyo");
s("emptyData", "No dots yet. Be the first!", "Todavía no hay puntos. ¡Sé la primera persona!");
s(
  "histNote",
  "A value on a boundary goes in the bar that starts there.",
  "Un valor en el límite va en la barra que empieza ahí.",
);
s(
  "altDot",
  "Dot plot of {n} measurements of {label}, from {min} to {max}.",
  "Gráfica de puntos de {n} medidas de {label}, de {min} a {max}.",
);
s(
  "altHist",
  "Histogram of {n} measurements of {label}, from {min} to {max}.",
  "Histograma de {n} medidas de {label}, de {min} a {max}.",
);
s(
  "altScatter",
  "Scatter plot of {n} dots: {x} across and {y} up.",
  "Diagrama de dispersión de {n} puntos: {x} en horizontal y {y} en vertical.",
);
s(
  "altBar",
  "Bar graph of {n} answers to {label}.",
  "Gráfica de barras de {n} respuestas a {label}.",
);
s("barCount", "{label}: {n}", "{label}: {n}");

/* ── toolbox cards ────────────────────────────────────────────────────────── */
s(
  "toolboxTitle",
  "The toolbox: what each unit adds",
  "La caja de herramientas: lo que agrega cada unidad",
);
s(
  "toolboxHelp",
  "Each tool uses the same class data. They are optional practice. Nothing here is graded or saved.",
  "Cada herramienta usa los mismos datos de la clase. Son práctica opcional. Nada aquí se califica ni se guarda.",
);
s("unitTag", "Unit {n}", "Unidad {n}");
s("taughtLast", "taught last", "se enseña al final");
s("openTool", "Open this tool", "Abrir esta herramienta");
s("closeTool", "Close", "Cerrar");
s("tool_u3_name", "Ratios & Rates", "Razones y tasas");
s(
  "tool_u3_desc",
  "Compare two measurements from one dot as a ratio, then find the rate for 1.",
  "Compara dos medidas de un punto como razón y luego halla la tasa por 1.",
);
s("tool_u4_name", "Percentages", "Porcentajes");
s(
  "tool_u4_desc",
  "What percent of our class chose each answer?",
  "¿Qué porcentaje de nuestra clase eligió cada respuesta?",
);
s("tool_u7_name", "The Coordinate Plane", "El plano de coordenadas");
s(
  "tool_u7_desc",
  "Every dot is an ordered pair (x, y). Read one, then plot some yourself.",
  "Cada punto es un par ordenado (x, y). Lee uno y luego ubica algunos tú.",
);
s("tool_u9_name", "Relationships Between Two Variables", "Relaciones entre dos variables");
s(
  "tool_u9_desc",
  "Does one measurement go up when the other does? Use the dots to predict.",
  "¿Una medida sube cuando la otra sube? Usa los puntos para predecir.",
);
s("tool_u2_name", "Statistics", "Estadística");
s(
  "tool_u2_desc",
  "Find the center, spread and shape of our whole dataset.",
  "Halla el centro, la dispersión y la forma de todos nuestros datos.",
);
s(
  "needNumbers",
  "This tool needs a question with measurements. Try another investigation.",
  "Esta herramienta necesita una pregunta con medidas. Prueba otra investigación.",
);
s(
  "needPairs",
  "This tool needs two measurements from each person. Try another investigation.",
  "Esta herramienta necesita dos medidas de cada persona. Prueba otra investigación.",
);
s(
  "needCategories",
  "This tool needs a question with categories. Try another investigation.",
  "Esta herramienta necesita una pregunta con categorías. Prueba otra investigación.",
);
s(
  "needMore",
  "We need more dots first (at least {n}). We have {have}.",
  "Primero necesitamos más puntos (al menos {n}). Tenemos {have}.",
);

/* ── task chrome ──────────────────────────────────────────────────────────── */
s("checkBtn", "Check", "Comprobar");
s("correct", "Yes! That matches our data.", "¡Sí! Coincide con nuestros datos.");
s("tryAgain", "Not yet. Try again.", "Todavía no. Inténtalo de nuevo.");
s("typeFirst", "Type your answer first.", "Primero escribe tu respuesta.");
s(
  "stuck",
  "Still stuck? That's okay. Ask a classmate or your teacher to look at the dots with you.",
  "¿Sigues atascado? Está bien. Pídele a un compañero o a tu maestro que miren los puntos contigo.",
);
s("hintLabel", "Hint", "Pista");
s("chooseVar", "Which measurement?", "¿Cuál medida?");
s("chooseDot", "Which dot?", "¿Cuál punto?");
s("chooseCat", "Which answer?", "¿Cuál respuesta?");
s("dotNumber", "Dot {n}", "Punto {n}");
s("sortBtn", "Sort the data", "Ordenar los datos");
s("sortedList", "Sorted from least to greatest:", "Ordenados de menor a mayor:");

/* ── unit 3 ───────────────────────────────────────────────────────────────── */
s(
  "u3_ratioQ",
  "Dot {n} has {a} = {av} and {b} = {bv}. Write the ratio {a} : {b} in simplest form.",
  "El punto {n} tiene {a} = {av} y {b} = {bv}. Escribe la razón {a} : {b} en su forma más simple.",
);
s("u3_ratioPart1", "First number", "Primer número");
s("u3_ratioPart2", "Second number", "Segundo número");
s(
  "u3_rateQ",
  "For every 1 {b}, about how many {a}? Round to the nearest hundredth.",
  "Por cada 1 de {b}, ¿cuántos de {a} hay aproximadamente? Redondea a la centésima.",
);
s(
  "u3_ratio_equivalent",
  "That's an equal ratio, but it can be simpler. Divide both numbers by the same number.",
  "Es una razón equivalente, pero se puede simplificar. Divide los dos números entre el mismo número.",
);
s(
  "u3_ratio_flipped",
  "Check the order. {a} comes first, then {b}.",
  "Revisa el orden. Primero va {a} y luego {b}.",
);
s(
  "u3_ratio_wrong1",
  "Write the two measurements in order as {a} : {b}. If they have decimals, multiply both by 2 or by 10 to get whole numbers.",
  "Escribe las dos medidas en orden como {a} : {b}. Si tienen decimales, multiplica las dos por 2 o por 10 para obtener números enteros.",
);
s(
  "u3_ratio_wrong2",
  "Try this step: multiply both by {k}. Now find a number that divides both.",
  "Prueba este paso: multiplica las dos por {k}. Ahora busca un número que divida a las dos.",
);
s(
  "u3_ratio_wrong2int",
  "Find a number that divides both {av} and {bv}. Is there a bigger one?",
  "Busca un número que divida a {av} y a {bv}. ¿Hay uno más grande?",
);
s(
  "u3_rate_flipped",
  "You divided the other way. We want {a} for every 1 {b}: divide {a} by {b}.",
  "Dividiste al revés. Queremos {a} por cada 1 de {b}: divide {a} entre {b}.",
);
s(
  "u3_rate_wrong1",
  "A rate for 1 {b} means dividing {a} by {b}.",
  "Una tasa por cada 1 de {b} significa dividir {a} entre {b}.",
);
s(
  "u3_rate_wrong2",
  "Set up {av} ÷ {bv}, then round to 2 decimal places.",
  "Plantea {av} ÷ {bv} y redondea a 2 decimales.",
);

s("u3_rateLabel", "{a} per 1 {b}", "{a} por 1 de {b}");
s("u2_median_label", "Median", "Mediana");
s("u2_mean_label", "Mean", "Media");
s("u2_range_label", "Range", "Rango");
s("u2_iqr_label", "IQR", "RIC");

/* ── unit 4 ───────────────────────────────────────────────────────────────── */
s(
  "u4_q",
  "What percent of our class chose “{cat}”? Give a whole-number percent.",
  "¿Qué porcentaje de nuestra clase eligió «{cat}»? Da un porcentaje entero.",
);
s("u4_unit", "%", "%");
s(
  "u4_count",
  "That's the number of people. A percent compares that number to the whole class, out of 100.",
  "Ese es el número de personas. Un porcentaje compara ese número con toda la clase, sobre 100.",
);
s(
  "u4_decimal",
  "That looks like a decimal. Multiply by 100 to write it as a percent.",
  "Eso parece un decimal. Multiplica por 100 para escribirlo como porcentaje.",
);
s(
  "u4_wrong1",
  "Percent = part ÷ whole × 100. What is the part? What is the whole?",
  "Porcentaje = parte ÷ total × 100. ¿Cuál es la parte? ¿Cuál es el total?",
);
s(
  "u4_wrong2",
  "Part: {part} chose “{cat}”. Whole: {whole} dots in all. Now use them.",
  "Parte: {part} eligieron «{cat}». Total: {whole} puntos en todo. Ahora úsalos.",
);

/* ── unit 7 ───────────────────────────────────────────────────────────────── */
s(
  "u7_readQ",
  "Read the ringed diamond on the graph. What is its ordered pair? Round to the nearest whole number.",
  "Lee el rombo con aro en la gráfica. ¿Cuál es su par ordenado? Redondea al número entero más cercano.",
);
s("u7_x", "x (across)", "x (horizontal)");
s("u7_y", "y (up)", "y (vertical)");
s(
  "u7_swapped",
  "You have x and y switched. In (x, y), x is how far across.",
  "Tienes x e y cambiados. En (x, y), x es cuánto avanzas en horizontal.",
);
s(
  "u7_wrong1",
  "Go across to find x first, then up for y. The order is (x, y).",
  "Primero avanza en horizontal para hallar x y luego sube para hallar y. El orden es (x, y).",
);
s(
  "u7_wrong2",
  "Trace straight down from the diamond to the bottom axis for x. Then trace straight left to the side axis for y.",
  "Baja en línea recta desde el rombo hasta el eje de abajo para hallar x. Luego ve en línea recta a la izquierda hasta el eje de la izquierda para hallar y.",
);
s("u7_another", "Try another dot", "Probar con otro punto");
s("u7_plotTitle", "Plot class points yourself", "Ubica puntos de la clase tú mismo");
s(
  "u7_plotHelp",
  "Tap the grid to plot 5 points from our class data.",
  "Toca la cuadrícula para ubicar 5 puntos de los datos de la clase.",
);
s(
  "u7_plotUnavailable",
  "The plotting grid isn't available right now. Reading dots above still works.",
  "La cuadrícula para ubicar puntos no está disponible ahora. Leer los puntos de arriba sí funciona.",
);

/* ── unit 9 ───────────────────────────────────────────────────────────────── */
s(
  "u9_trendQ",
  "Look at the scatter plot. As {x} gets bigger, {y} tends to…",
  "Mira el diagrama de dispersión. Cuando {x} aumenta, {y} tiende a…",
);
s("u9_up", "go up", "subir");
s("u9_down", "go down", "bajar");
s("u9_none", "show no clear pattern", "no mostrar un patrón claro");
s(
  "u9_close",
  "That's a close call. The pattern is weak, so both readings can be reasonable. Be ready to explain what you see.",
  "Es difícil decidir. El patrón es débil, así que ambas lecturas pueden ser razonables. Prepárate para explicar lo que ves.",
);
s(
  "u9_trend_wrong1",
  "Follow the dots from left to right. Do they climb, fall, or wander?",
  "Sigue los puntos de izquierda a derecha. ¿Suben, bajan o están dispersos?",
);
s(
  "u9_trend_wrong2",
  "Compare the dots on the far left with the dots on the far right. Which group sits higher?",
  "Compara los puntos del extremo izquierdo con los del extremo derecho. ¿Cuál grupo está más arriba?",
);
s(
  "u9_predictQ",
  "A new classmate has {x} = {xv} {xu}. About what {y} would you expect? Type a number.",
  "Un compañero nuevo tiene {x} = {xv} {xu}. ¿Qué valor de {y} esperarías aproximadamente? Escribe un número.",
);
s(
  "u9_pred_low",
  "That's lower than the dots near {xv}. Look at where they sit.",
  "Es menor que los puntos cerca de {xv}. Mira dónde están.",
);
s(
  "u9_pred_high",
  "That's higher than the dots near {xv}. Look at where they sit.",
  "Es mayor que los puntos cerca de {xv}. Mira dónde están.",
);
s(
  "u9_pred_hint2",
  "The five dots nearest to {xv} are ringed on the graph. Where do they sit up the side?",
  "Los cinco puntos más cercanos a {xv} tienen un aro en la gráfica. ¿Dónde quedan en el eje vertical?",
);
s(
  "u9_okPred",
  "Reasonable! That fits the dots near {xv}.",
  "¡Razonable! Encaja con los puntos cerca de {xv}.",
);

/* ── unit 2 ───────────────────────────────────────────────────────────────── */
s(
  "u2_intro",
  "You find every number yourself. Type it, and we check it against the class data.",
  "Tú encuentras cada número. Escríbelo y lo comparamos con los datos de la clase.",
);
s("u2_median", "What is the median?", "¿Cuál es la mediana?");
s(
  "u2_mean",
  "What is the mean? Round to the nearest tenth.",
  "¿Cuál es la media? Redondea a la décima más cercana.",
);
s("u2_range", "What is the range?", "¿Cuál es el rango?");
s("u2_iqr", "What is the interquartile range (IQR)?", "¿Cuál es el rango intercuartil (RIC)?");
s(
  "u2_median_wrong1",
  "Put the numbers in order from least to greatest, then find the middle one.",
  "Ordena los números de menor a mayor y luego busca el del medio.",
);
s(
  "u2_median_wrong2odd",
  "There are {n} values, so the middle one is number {pos} in the sorted list.",
  "Hay {n} valores, así que el del medio es el número {pos} de la lista ordenada.",
);
s(
  "u2_median_wrong2even",
  "There are {n} values, so find numbers {a} and {b} in the sorted list and take the number halfway between them.",
  "Hay {n} valores, así que busca los números {a} y {b} de la lista ordenada y toma el número que está a la mitad entre ellos.",
);
s(
  "u2_mean_wrong1",
  "Add up all the values, then divide by how many values there are.",
  "Suma todos los valores y luego divide entre cuántos valores hay.",
);
s(
  "u2_mean_wrong2",
  "Divide your total by {n}, because there are {n} values.",
  "Divide tu total entre {n}, porque hay {n} valores.",
);
s(
  "u2_range_wrong1",
  "The range is the greatest value minus the least value.",
  "El rango es el valor mayor menos el valor menor.",
);
s(
  "u2_range_wrong2",
  "In the sorted list, the least value is first and the greatest is last. Find those two.",
  "En la lista ordenada, el menor es el primero y el mayor es el último. Encuentra esos dos.",
);
s(
  "u2_iqr_wrong1",
  "IQR = Q3 − Q1. Q1 is the median of the lower half. Q3 is the median of the upper half.",
  "RIC = Q3 − Q1. Q1 es la mediana de la mitad inferior. Q3 es la mediana de la mitad superior.",
);
s(
  "u2_iqr_wrong2",
  "Split the sorted list into two halves of {m} values each{mid}.",
  "Divide la lista ordenada en dos mitades de {m} valores cada una{mid}.",
);
s("u2_iqr_mid", ", leaving out the middle value", ", sin contar el valor del medio");
s(
  "u2_shapeQ",
  "Look at the histogram. Where does our data bunch up?",
  "Mira el histograma. ¿Dónde se agrupan nuestros datos?",
);
s("u2_balanced", "Balanced: about the same on both sides", "Equilibrada: casi igual a ambos lados");
s(
  "u2_low",
  "Bunched at the low end, with a tail to the right",
  "Agrupada en los valores bajos, con cola a la derecha",
);
s(
  "u2_high",
  "Bunched at the high end, with a tail to the left",
  "Agrupada en los valores altos, con cola a la izquierda",
);
s(
  "u2_shape_close",
  "A close call: both readings can be defended. Be ready to say why.",
  "Es difícil decidir: ambas lecturas se pueden defender. Prepárate para decir por qué.",
);
s(
  "u2_shape_wrong1",
  "Find the tallest bar. Is there a long, low tail on one side?",
  "Busca la barra más alta. ¿Hay una cola larga y baja de un lado?",
);
s(
  "u2_shape_wrong2",
  "Compare the mean and the median you found. The mean gets pulled toward the tail.",
  "Compara la media y la mediana que hallaste. La media se jala hacia la cola.",
);
s("u2_build", "Build it yourself", "Constrúyelo tú");
s("u2_buildHist", "Build the class histogram", "Construye el histograma de la clase");
s("u2_buildBox", "Build the class box plot", "Construye el diagrama de caja de la clase");
s(
  "u2_buildIntro",
  "Build it yourself from our class data. The tool checks your work.",
  "Constrúyelo tú con los datos de nuestra clase. La herramienta revisa tu trabajo.",
);
s(
  "u2_buildUnavailable",
  "The builder isn't available right now.",
  "El constructor no está disponible ahora.",
);
s(
  "u2_needMore",
  "Statistics works best with at least 8 dots. We have {have}.",
  "La estadística funciona mejor con al menos 8 puntos. Tenemos {have}.",
);
s("u2_choose", "Which measurement should we study?", "¿Cuál medida deberíamos estudiar?");

/* ── teacher ──────────────────────────────────────────────────────────────── */
s("tTitle", "Teacher tools", "Herramientas del maestro");
s("tKey", "Teacher key", "Clave del maestro");
s(
  "tKeyHelp",
  "Used only to talk to the class server. Not saved after you close this tab.",
  "Se usa solo para hablar con el servidor de la clase. No se guarda al cerrar esta pestaña.",
);
s("tCreate", "Start a new class", "Crear una clase nueva");
s("tCreateFor", "First question", "Primera pregunta");
s("tCodeIs", "Class code", "Código de la clase");
s(
  "tShare",
  "Share this link or QR code. Write the code on the board.",
  "Comparte este enlace o código QR. Escribe el código en el pizarrón.",
);
s("tUseCode", "Manage this class", "Administrar esta clase");
s("tActive", "Active question", "Pregunta activa");
s("tSetActive", "Make this the active question", "Hacer activa esta pregunta");
s("tOptionHint", "Options for this question", "Opciones para esta pregunta");
s(
  "tOptionLocked",
  "Options can't change once students have added dots.",
  "Las opciones no se pueden cambiar cuando ya hay puntos.",
);
s("tClose", "Stop collecting", "Dejar de recopilar");
s("tReopen", "Collect again", "Recopilar de nuevo");
s("tExport", "Download CSV", "Descargar CSV");
s("tPurge", "Delete data…", "Borrar datos…");
s(
  "tPurgeWarn",
  "This permanently deletes every dot for this question. Type the class code to confirm.",
  "Esto borra para siempre todos los puntos de esta pregunta. Escribe el código de la clase para confirmar.",
);
s(
  "tPurgeAll",
  "Delete the whole class (all questions)",
  "Borrar toda la clase (todas las preguntas)",
);
s("tConfirmCode", "Type the class code", "Escribe el código de la clase");
s("tDo", "Delete", "Borrar");
s("tDone", "Done.", "Listo.");
s("tNeedKey", "Type the teacher key first.", "Primero escribe la clave del maestro.");
s("tWrongKey", "That key was not accepted.", "No se aceptó esa clave.");
s(
  "tNotConfigured",
  "The server has no teacher key set yet.",
  "El servidor todavía no tiene una clave de maestro.",
);
s(
  "tFailed",
  "That didn't work. Try again in a moment.",
  "No funcionó. Inténtalo de nuevo en un momento.",
);
s("tDeleted", "Deleted {n} dots.", "Se borraron {n} puntos.");
s("tSolo", "Pick the question for this device", "Elige la pregunta para este dispositivo");
s(
  "tArmHeight",
  "Include arm span and height (optional)",
  "Incluir envergadura y estatura (opcional)",
);

/* ── home mission (family card) ───────────────────────────────────────────── */
s("hmTitle", "Home Mission: add to our class data", "Misión en casa: suma a los datos de la clase");
s(
  "hmIntro",
  "Optional, and never graded. Measure something at home and add it to our class investigation.",
  "Opcional y nunca se califica. Mide algo en casa y súmalo a la investigación de nuestra clase.",
);
s(
  "hmCodeAsk",
  "Ask your child for the 6-letter class code.",
  "Pídele a tu hijo o hija el código de 6 letras de la clase.",
);
s("hmCodeLabel", "Class code", "Código de la clase");
s("hmConnect", "Connect", "Conectar");
s(
  "hmPrivacy",
  "No names are collected. Only the numbers you type are sent.",
  "No se recopilan nombres. Solo se envían los números que escribes.",
);
s("hmQuestion", "Today's class question", "La pregunta de la clase de hoy");
s("hmAdd", "Add our measurement", "Agregar nuestra medida");
s("hmOpen", "See our class graph", "Ver la gráfica de la clase");
s("hmChange", "Use a different class code", "Usar otro código de clase");
s(
  "hmThanks",
  "Thank you! Your measurement joins the class graph.",
  "¡Gracias! Tu medida se une a la gráfica de la clase.",
);
s(
  "hmNotCollecting",
  "Our class isn't collecting right now. Check back later.",
  "Nuestra clase no está recopilando datos ahora. Vuelve más tarde.",
);
s(
  "hmNoTeacher",
  "Not part of a class yet? You can still try it on your own.",
  "¿Todavía no eres parte de una clase? Aún puedes probarlo por tu cuenta.",
);
s("hmSoloDone", "Saved on this device only.", "Guardado solo en este dispositivo.");

/** The translated string for `key`. Unknown keys return the key (visible in review). */
export function tr(key, lang, vars = {}) {
  const entry = T[key];
  const text = entry ? (entry[lang] ?? entry.en) : key;
  return text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

/** Both languages of a `{ en, es }` pair authored in templates.js. */
export const pick = (pair, lang) => (pair ? (pair[lang] ?? pair.en) : "");

export const KEYS = Object.keys(T);
export const STRINGS = T;

const LANG_KEY = "nt-lang";

/** The site-wide language choice. English until the student says otherwise. */
export function getLang() {
  try {
    const saved = globalThis.localStorage?.getItem(LANG_KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    /* storage blocked: English stands */
  }
  return "en";
}

export function setLang(lang) {
  try {
    if (lang === "es" || lang === "en") globalThis.localStorage?.setItem(LANG_KEY, lang);
  } catch {
    /* choice just won't persist */
  }
  if (typeof document !== "undefined" && (lang === "es" || lang === "en")) {
    document.documentElement.lang = lang;
  }
}

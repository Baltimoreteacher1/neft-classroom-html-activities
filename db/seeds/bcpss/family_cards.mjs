// 162 bilingual EN/ES/AR/FR family cards for the BCPSS Curriculum-to-Language Ecosystem.
// Grade 6 (all 18 units across ELA, Math, Science, Social Studies) features gold-standard
// bespoke multilingual family cards; K-5 and 7-8 build unit-specific cards via _builder.mjs.

import { buildFamilyCard } from "./_builder.mjs";
import { ELA_CONNECTIONS, ELA_UNITS } from "./ela.mjs";
import { MATH_CONNECTIONS, MATH_UNITS } from "./math.mjs";
import { SCIENCE_CONNECTIONS, SCIENCE_UNITS } from "./science.mjs";
import { SOCIAL_STUDIES_CONNECTIONS, SOCIAL_STUDIES_UNITS } from "./social_studies.mjs";

const GRADE_6_BESPOKE_CARDS = {
  "g6-ela-u1": {
    en: {
      title: "Grade 6 ELA: Resilience in the Great Depression",
      summary: "We are reading Bud, Not Buddy and Out of the Dust to explore how families stayed hopeful during the 1930s Great Depression. Students practice cause-and-effect sentences explaining how hardship shaped characters' choices.",
      dinner_question: "What is a challenge our family or community overcame, and what helped us stay resilient?",
      key_words: ["resilience", "hardship", "drought", "dignity"],
    },
    es: {
      title: "Grado 6 · ELA: Resiliencia en la Gran Depresión",
      summary: "Leemos Bud, Not Buddy y Out of the Dust para explorar cómo las familias mantuvieron la esperanza durante la Gran Depresión de los años 1930. Practicamos oraciones de causa y efecto.",
      dinner_question: "¿Qué reto superó nuestra familia o comunidad y qué nos ayudó a mostrar resiliencia?",
      key_words: ["resilience (resiliencia)", "hardship (dificultad)", "drought (sequía)", "dignity (dignidad)"],
    },
    ar: {
      title: "الصف السادس · اللغة الإنجليزية: الصمود في الكساد الكبير",
      summary: "نقرأ قصصاً عن الكساد الكبير في الثلاثينيات لنفهم كيف أظهرت العائلات الصمود والأمل في الأوقات الصعبة، وندرب الطلاب على جمل السبب والنتيجة.",
      dinner_question: "ما التحدي الذي تغلبت عليه عائلتنا، وما الذي ساعدنا على الصمود؟",
      key_words: ["resilience (الصمود)", "hardship (المشقة)", "drought (الجفاف)", "dignity (الكرامة)"],
    },
    fr: {
      title: "6e année · ELA : La résilience pendant la Grande Dépression",
      summary: "Nous lisons Bud, Not Buddy et Out of the Dust pour comprendre comment les familles ont gardé espoir pendant les années 1930. Les élèves pratiquent les phrases de cause à effet.",
      dinner_question: "Quel défi notre famille a-t-elle surmonté et qu'est-ce qui nous a aidés à rester résilients ?",
      key_words: ["resilience (résilience)", "hardship (épreuve)", "drought (sécheresse)", "dignity (dignité)"],
    },
  },
  "g6-ela-u2": {
    en: {
      title: "Grade 6 ELA: A Hero's Journey",
      summary: "Students read The Odyssey and Ramayana to trace how heroes face trials and change along the way. In class, we narrate conflict, choices, and transformation.",
      dinner_question: "Who is a hero from a story or real life in our culture, and what test changed them?",
      key_words: ["archetype", "odyssey", "transformation", "hubris"],
    },
    es: {
      title: "Grado 6 · ELA: El viaje del héroe",
      summary: "Leemos La Odisea y el Ramayana para analizar cómo los héroes enfrentan pruebas y se transforman. Practicamos cómo narrar conflictos y resoluciones.",
      dinner_question: "¿Quién es un héroe de nuestra cultura o familia y qué desafío lo transformó?",
      key_words: ["archetype (arquetipo)", "odyssey (odisea)", "transformation (transformación)", "hubris (orgullo excesivo)"],
    },
    ar: {
      title: "الصف السادس · اللغة الإنجليزية: رحلة البطل",
      summary: "يقرأ الطلاب الأوديسة ورامايانا لتتبع كيف يواجه الأبطال الاختبارات ويتغيرون خلالها، مع التدرب على سرد المشكلة والحل.",
      dinner_question: "من هو البطل في قصصنا أو ثقافتنا، وما الاختبار الذي غيّر شخصيته؟",
      key_words: ["archetype (نموذج أصلي)", "odyssey (ملحمة)", "transformation (تحوّل)", "hubris (غرور)"],
    },
    fr: {
      title: "6e année · ELA : Le voyage du héros",
      summary: "Les élèves étudient L'Odyssée et le Ramayana pour voir comment les épreuves transforment un héros, en structurant le conflit et la résolution.",
      dinner_question: "Qui est un héros dans notre culture ou notre famille, et quelle épreuve l'a transformé ?",
      key_words: ["archetype (archétype)", "odyssey (odyssée)", "transformation", "hubris (orgueil)"],
    },
  },
  "g6-ela-u3": {
    en: {
      title: "Grade 6 ELA: Narrating the Unknown",
      summary: "Through Blood on the River and historical records of Jamestown, students analyze how different narrators tell the same event from different perspectives.",
      dinner_question: "When two people see the same event, why might they tell the story differently?",
      key_words: ["perspective", "colony", "alliance", "bias"],
    },
    es: {
      title: "Grado 6 · ELA: Narrando lo desconocido",
      summary: "Con Blood on the River y fuentes históricas de Jamestown, analizamos cómo distintos narradores cuentan el mismo hecho desde diferentes perspectivas.",
      dinner_question: "Cuando dos personas ven el mismo evento, ¿por qué pueden contarlo de forma diferente?",
      key_words: ["perspective (perspectiva)", "colony (colonia)", "alliance (alianza)", "bias (sesgo)"],
    },
    ar: {
      title: "الصف السادس · اللغة الإنجليزية: سرد المجهول",
      summary: "يدرس الطلاب رواية تاريخية ومصادر عن جيمستاون لفهم كيف يغيّر منظور الراوي طريقة سرد الأحداث التاريخية.",
      dinner_question: "عندما يشهد شخصان الحدث نفسه، لماذا قد يرويه كل منهما بطريقة مختلفة؟",
      key_words: ["perspective (منظور)", "colony (مستعمرة)", "alliance (تحالف)", "bias (تحيّز)"],
    },
    fr: {
      title: "6e année · ELA : Raconter l'inconnu",
      summary: "À travers Blood on the River et des sources sur Jamestown, les élèves analysent comment le point de vue d'un narrateur influence le récit.",
      dinner_question: "Pourquoi deux témoins d'un même événement racontent-ils parfois l'histoire différemment ?",
      key_words: ["perspective", "colony (colonie)", "alliance", "bias (biais)"],
    },
  },
  "g6-ela-u4": {
    en: {
      title: "Grade 6 ELA: Courage in Crisis",
      summary: "Students read about Shackleton's Antarctic shipwreck and Malala Yousafzai to write evidence-based arguments about what true courage looks like during a crisis.",
      dinner_question: "What does everyday courage look like in our family or neighborhood?",
      key_words: ["crisis", "perseverance", "advocacy", "evidence"],
    },
    es: {
      title: "Grado 6 · ELA: Valentía en la crisis",
      summary: "Estudiamos la expedición de Shackleton y la historia de Malala para escribir argumentos con evidencia sobre qué significa la verdadera valentía en una crisis.",
      dinner_question: "¿Cómo se ve la valentía cotidiana en nuestra familia o comunidad?",
      key_words: ["crisis (crisis)", "perseverance (perseverancia)", "advocacy (defensa)", "evidence (evidencia)"],
    },
    ar: {
      title: "الصف السادس · اللغة الإنجليزية: الشجاعة في الأزمات",
      summary: "يقرأ الطلاب عن رحلة شاكلتون وملالا يوسفزاي لكتابة حجج مدعومة بالأدلة حول معنى الشجاعة الحقيقية أثناء الأزمات.",
      dinner_question: "كيف تظهر الشجاعة اليومية في عائلتنا أو حينا؟",
      key_words: ["crisis (أزمة)", "perseverance (مثابرة)", "advocacy (مناصرة)", "evidence (دليل)"],
    },
    fr: {
      title: "6e année · ELA : Le courage dans la crise",
      summary: "Les élèves étudient l'expédition de Shackleton et Malala Yousafzai afin d'argumenter avec des preuves sur ce qu'est le vrai courage en temps de crise.",
      dinner_question: "À quoi ressemble le courage au quotidien dans notre famille ou notre quartier ?",
      key_words: ["crisis (crise)", "perseverance (persévérance)", "advocacy (plaidoyer)", "evidence (preuve)"],
    },
  },
  "g6-math-u1": {
    en: {
      title: "Grade 6 Math: Area, Surface Area & Volume",
      summary: "Students break complex shapes into triangles and rectangles, unfold 3D box nets to find surface area, and calculate volume with fractional dimensions.",
      dinner_question: "If we wrapped a cereal box at home, how could we find out how much paper covers all 6 faces?",
      key_words: ["decompose", "surface area", "net", "polygon"],
    },
    es: {
      title: "Grado 6 · Matemáticas: Área, área de superficie y volumen",
      summary: "Descomponemos figuras en triángulos y rectángulos, abrimos cajas 3D (redes) para hallar el área de superficie y calculamos el volumen.",
      dinner_question: "Si envolviéramos una caja en casa, ¿cómo calcularíamos el papel necesario para cubrir sus 6 caras?",
      key_words: ["decompose (descomponer)", "surface area (área de superficie)", "net (red)", "polygon (polígono)"],
    },
    ar: {
      title: "الصف السادس · الرياضيات: المساحة ومساحة السطح والحجم",
      summary: "يقسم الطلاب الأشكال إلى مثلثات ومستطيلات ويفتحون شبكات المجسمات لحساب مساحة السطح والحجم.",
      dinner_question: "لو أردنا تغليف علبة في المنزل، كيف نحسب كمية الورق اللازمة لتغطية جميع أوجهها الستة؟",
      key_words: ["decompose (تقسيم)", "surface area (مساحة السطح)", "net (شبكة)", "polygon (مضلع)"],
    },
    fr: {
      title: "6e année · Mathématiques : Aire, aire totale et volume",
      summary: "Les élèves décomposent des polygones en triangles et rectangles, déplient des patrons 3D pour calculer l'aire totale et mesurent le volume.",
      dinner_question: "Si on emballait une boîte de céréales, comment calculer la surface de papier pour ses 6 faces ?",
      key_words: ["decompose (décomposer)", "surface area (aire totale)", "net (patron)", "polygon (polygone)"],
    },
  },
  "g6-math-u2": {
    en: {
      title: "Grade 6 Math: Ratios & Rates",
      summary: "Students compare two quantities using ratio tables, tape diagrams, and unit rates ('miles per hour', 'price per ounce') to solve real-world scaling problems.",
      dinner_question: "At the grocery store or when cooking a recipe, how do we find the better unit price or double a recipe evenly?",
      key_words: ["ratio", "unit rate", "equivalent ratio", "tape diagram"],
    },
    es: {
      title: "Grado 6 · Matemáticas: Razones y tasas",
      summary: "Comparamos cantidades con tablas de razones, diagramas de cinta y tasas unitarias (precio por onza, millas por hora) para resolver problemas reales.",
      dinner_question: "Al cocinar o comprar en la tienda, ¿cómo usamos las tasas unitarias para saber qué producto conviene más?",
      key_words: ["ratio (razón)", "unit rate (tasa unitaria)", "equivalent ratio (razón equivalente)", "tape diagram (diagrama de cinta)"],
    },
    ar: {
      title: "الصف السادس · الرياضيات: النسب والمعدلات",
      summary: "يقارن الطلاب بين الكميات باستخدام جداول النسب ومعدل الوحدة (السعر لكل وحدة) لحل مسائل من الحياة اليومية.",
      dinner_question: "عند التسوق أو مضاعفة وصفة طعام، كيف نعرف السعر الأفضل للوحدة الواحدة؟",
      key_words: ["ratio (نسبة)", "unit rate (معدل الوحدة)", "equivalent ratio (نسبة مكافئة)", "tape diagram (مخطط شريطي)"],
    },
    fr: {
      title: "6e année · Mathématiques : Rapports et taux",
      summary: "Les élèves comparent des quantités avec des tableaux de proportionnalité et des taux unitaires (prix au kilo, km par heure) pour résoudre des problèmes concrets.",
      dinner_question: "En faisant les courses ou en doublant une recette, comment comparer le prix unitaire ?",
      key_words: ["ratio (rapport)", "unit rate (taux unitaire)", "equivalent ratio (rapport équivalent)", "tape diagram (schéma en bande)"],
    },
  },
  "g6-math-u3": {
    en: {
      title: "Grade 6 Math: Multi-Digit Numbers & Fraction Division",
      summary: "Students divide fractions by fractions using visual models and compute fluently with multi-digit decimals.",
      dinner_question: "If we have 3/4 of a pan of cornbread and each serving is 1/8 of the pan, how many servings can we make?",
      key_words: ["reciprocal", "quotient", "algorithm", "factor"],
    },
    es: {
      title: "Grado 6 · Matemáticas: Números de varios dígitos y división de fracciones",
      summary: "Dividimos fracciones usando modelos visuales y practicamos operaciones precisas con decimales de varios dígitos.",
      dinner_question: "Si tenemos 3/4 de un pastel y cada porción es 1/8, ¿cuántas porciones salen?",
      key_words: ["reciprocal (recíproco)", "quotient (cociente)", "algorithm (algoritmo)", "factor (factor)"],
    },
    ar: {
      title: "الصف السادس · الرياضيات: قسمة الكسور والأعداد العشرية",
      summary: "يقسم الطلاب الكسور باستخدام النماذج البصرية ويتقنون العمليات على الأعداد العشرية متعددة الأرقام.",
      dinner_question: "إذا كان لدينا ثلاثة أرباع صينية طعام وكل حصة تساوي ثُمناً، فكم حصة يمكننا تقديمها؟",
      key_words: ["reciprocal (مقلوب الكسر)", "quotient (ناتج القسمة)", "algorithm (خوارزمية)", "factor (عامل)"],
    },
    fr: {
      title: "6e année · Mathématiques : Division de fractions et décimaux",
      summary: "Les élèves divisent des fractions à l'aide de modèles visuels et calculent couramment avec des nombres décimaux.",
      dinner_question: "Si nous avons 3/4 d'un gâteau et que chaque part vaut 1/8, combien de parts peut-on couper ?",
      key_words: ["reciprocal (inverse)", "quotient", "algorithm (algorithme)", "factor (facteur)"],
    },
  },
  "g6-math-u4": {
    en: {
      title: "Grade 6 Math: Integers & The Coordinate Plane",
      summary: "Students explore positive and negative numbers (temperatures, elevations, balances), absolute value, and plotting points in all four quadrants.",
      dinner_question: "Which temperature is colder: -3°F or -12°F, and how far is each from 0?",
      key_words: ["integer", "absolute value", "quadrant", "opposite"],
    },
    es: {
      title: "Grado 6 · Matemáticas: Enteros y el plano coordenado",
      summary: "Exploramos números positivos y negativos (temperatura, elevación), el valor absoluto y cómo ubicar puntos en los cuatro cuadrantes.",
      dinner_question: "¿Qué temperatura es más fría: -3 °F o -12 °F, y qué tan lejos está cada una de cero?",
      key_words: ["integer (entero)", "absolute value (valor absoluto)", "quadrant (cuadrante)", "opposite (opuesto)"],
    },
    ar: {
      title: "الصف السادس · الرياضيات: الأعداد الصحيحة والمستوى الإحداثي",
      summary: "يتعلم الطلاب الأعداد الموجبة والسالبة والقيمة المطلقة وتحديد النقاط في الأرباع الأربعة.",
      dinner_question: "أي درجة حرارة أبرد: -3 أم -12، وكم تبعد كل منهما عن الصفر؟",
      key_words: ["integer (عدد صحيح)", "absolute value (القيمة المطلقة)", "quadrant (ربع)", "opposite (معكوس)"],
    },
    fr: {
      title: "6e année · Mathématiques : Entiers relatifs et plan repéré",
      summary: "Les élèves étudient les nombres positifs et négatifs, la valeur absolue et le repérage dans les quatre quadrants.",
      dinner_question: "Quelle température est la plus froide : -3 °C ou -12 °C, et quelle est leur distance à zéro ?",
      key_words: ["integer (entier relatif)", "absolute value (valeur absolue)", "quadrant", "opposite (opposé)"],
    },
  },
  "g6-math-u5": {
    en: {
      title: "Grade 6 Math: Expressions & Equations",
      summary: "Students write algebraic expressions with variables and solve one-step equations and inequalities by keeping both sides balanced.",
      dinner_question: "If 4 tickets cost $36 altogether, what equation represents the price of 1 ticket?",
      key_words: ["variable", "coefficient", "equivalent expression", "inequality"],
    },
    es: {
      title: "Grado 6 · Matemáticas: Expresiones y ecuaciones",
      summary: "Escribimos expresiones algebraicas con variables y resolvemos ecuaciones y desigualdades manteniendo ambos lados equilibrados.",
      dinner_question: "Si 4 boletos cuestan $36 en total, ¿qué ecuación representa el precio de 1 boleto?",
      key_words: ["variable (variable)", "coefficient (coeficiente)", "equivalent expression (expresión equivalente)", "inequality (desigualdad)"],
    },
    ar: {
      title: "الصف السادس · الرياضيات: التعابير والمعادلات الجبرية",
      summary: "يكتب الطلاب تعابير جبرية بمتغيرات ويحلون معادلات ومتباينات من خطوة واحدة بالحفاظ على توازن الطرفين.",
      dinner_question: "إذا كان سعر 4 تذاكر هو 36 دولاراً، فما المعادلة التي تجد سعر التذكرة الواحدة؟",
      key_words: ["variable (متغير)", "coefficient (معامل)", "equivalent expression (تعبير مكافئ)", "inequality (متباينة)"],
    },
    fr: {
      title: "6e année · Mathématiques : Expressions et équations",
      summary: "Les élèves écrivent des expressions algébriques avec des variables et résolvent des équations en gardant les deux membres équilibrés.",
      dinner_question: "Si 4 billets coûtent 36 $ au total, quelle équation permet de trouver le prix d'un billet ?",
      key_words: ["variable", "coefficient", "equivalent expression (expression équivalente)", "inequality (inéquation)"],
    },
  },
  "g6-math-u6": {
    en: {
      title: "Grade 6 Math: Statistics & Data Distributions",
      summary: "Students build dot plots, histograms, and box plots to summarize real data using mean, median, and spread—and spot outliers.",
      dinner_question: "If one person in a group has a much higher score than everyone else, should we use the mean or the median to describe the typical score?",
      key_words: ["distribution", "median", "outlier", "variability"],
    },
    es: {
      title: "Grado 6 · Matemáticas: Estadística y distribuciones de datos",
      summary: "Construimos diagramas de puntos, histogramas y diagramas de caja para describir datos con media, mediana y valores atípicos.",
      dinner_question: "Si un dato es mucho más alto que todos los demás, ¿describe mejor el grupo la media o la mediana?",
      key_words: ["distribution (distribución)", "median (mediana)", "outlier (valor atípico)", "variability (variabilidad)"],
    },
    ar: {
      title: "الصف السادس · الرياضيات: الإحصاء وتوزيع البيانات",
      summary: "ينشئ الطلاب مخططات النقاط والمدرجات التكرارية لمقارنة المتوسط والوسيط والقيم المتطرفة في البيانات.",
      dinner_question: "إذا كانت قيمة واحدة أعلى بكثير من بقية القيم، هل يصف الوسيط أم المتوسط المجموعة بشكل أدق؟",
      key_words: ["distribution (توزيع)", "median (الوسيط)", "outlier (قيمة متطرفة)", "variability (التشتت)"],
    },
    fr: {
      title: "6e année · Mathématiques : Statistiques et distributions",
      summary: "Les élèves créent des histogrammes et boîtes à moustaches pour comparer la moyenne, la médiane et les valeurs aberrantes.",
      dinner_question: "Si une valeur est beaucoup plus élevée que les autres, vaut-il mieux utiliser la moyenne ou la médiane ?",
      key_words: ["distribution", "median (médiane)", "outlier (valeur aberrante)", "variability (variabilité)"],
    },
  },
  "g6-sci-u1": {
    en: {
      title: "Grade 6 Science: Can I Believe My Eyes?",
      summary: "In IQWST Physics, students investigate how light travels, reflects off mirrors, scatters off rough surfaces, and enters our eyes so we see color and objects.",
      dinner_question: "Why can we see our reflection clearly in a mirror or still water, but not on a painted wall?",
      key_words: ["reflection", "absorption", "scattering", "transparent"],
    },
    es: {
      title: "Grado 6 · Ciencias: ¿Puedo creerle a mis ojos?",
      summary: "En IQWST investigamos cómo viaja la luz, cómo se refleja en superficies lisas, se dispersa en superficies rugosas y entra en nuestros ojos.",
      dinner_question: "¿Por qué vemos nuestro reflejo claro en un espejo pero no en una pared pintada?",
      key_words: ["reflection (reflexión)", "absorption (absorción)", "scattering (dispersión)", "transparent (transparente)"],
    },
    ar: {
      title: "الصف السادس · العلوم: هل أصدق عيني؟",
      summary: "يدرس الطلاب كيف ينتقل الضوء وينعكس عن الأسطح الملساء ويتشتت عن الأسطح الخشنة ليصل إلى أعيننا ونرى الأشياء.",
      dinner_question: "لماذا نرى صورتنا بوضوح في المرآة ولا نراها على جدار مطلي؟",
      key_words: ["reflection (انعكاس)", "absorption (امتصاص)", "scattering (تشتت)", "transparent (شفاف)"],
    },
    fr: {
      title: "6e année · Sciences : Puis-je en croire mes yeux ?",
      summary: "En physique IQWST, les élèves étudient comment la lumière se propage, se réfléchit, se diffuse et entre dans nos yeux pour former une image.",
      dinner_question: "Pourquoi voit-on son reflet dans un miroir mais pas sur un mur peint ?",
      key_words: ["reflection (réflexion)", "absorption", "scattering (diffusion)", "transparent"],
    },
  },
  "g6-sci-u2": {
    en: {
      title: "Grade 6 Science: How Can I Smell Things from a Distance?",
      summary: "In IQWST Chemistry, students model invisible moving particles in solids, liquids, and gases to explain why warm food smells travel faster across a room.",
      dinner_question: "Why can you smell hot soup from the kitchen faster than cold leftovers?",
      key_words: ["particle", "diffusion", "phase change", "thermal energy"],
    },
    es: {
      title: "Grado 6 · Ciencias: ¿Cómo puedo oler cosas a distancia?",
      summary: "Modelamos partículas invisibles en movimiento en sólidos, líquidos y gases para explicar por qué los olores viajan más rápido con el calor.",
      dinner_question: "¿Por qué se huele más rápido una sopa caliente desde la cocina que comida fría?",
      key_words: ["particle (partícula)", "diffusion (difusión)", "phase change (cambio de fase)", "thermal energy (energía térmica)"],
    },
    ar: {
      title: "الصف السادس · العلوم: كيف أشم الروائح عن بُعد؟",
      summary: "ينمذج الطلاب حركة الجسيمات الدقيقة في المواد الصلبة والسائلة والغازية لشرح انتشار الروائح وتأثير الطاقة الحرارية.",
      dinner_question: "لماذا نشم رائحة الحساء الساخن أسرع من الطعام البارد؟",
      key_words: ["particle (جسيم)", "diffusion (انتشار)", "phase change (تغير الحالة)", "thermal energy (طاقة حرارية)"],
    },
    fr: {
      title: "6e année · Sciences : Comment sentir des odeurs à distance ?",
      summary: "Les élèves modélisent les particules en mouvement dans les solides, liquides et gaz pour expliquer la diffusion des odeurs et l'énergie thermique.",
      dinner_question: "Pourquoi sent-on une soupe chaude plus vite qu'un plat froid depuis une autre pièce ?",
      key_words: ["particle (particule)", "diffusion", "phase change (changement d'état)", "thermal energy (énergie thermique)"],
    },
  },
  "g6-sci-u3": {
    en: {
      title: "Grade 6 Science: Where Have All the Creatures Gone?",
      summary: "In IQWST Life Science, students examine food webs, predator-prey graphs, and invasive species like the sea lamprey to argue why animal populations rise or fall.",
      dinner_question: "If one animal disappears from a local park or river food web, how could that affect the other living things?",
      key_words: ["invasive species", "competition", "population", "predator"],
    },
    es: {
      title: "Grado 6 · Ciencias: ¿Adónde se fueron todas las criaturas?",
      summary: "Analizamos redes alimenticias, gráficas de poblaciones y especies invasoras para argumentar con datos por qué cambian las poblaciones animales.",
      dinner_question: "Si un animal desaparece de un parque o río cercano, ¿cómo afectaría a los demás seres vivos?",
      key_words: ["invasive species (especie invasora)", "competition (competencia)", "population (población)", "predator (depredador)"],
    },
    ar: {
      title: "الصف السادس · العلوم: أين ذهبت جميع المخلوقات؟",
      summary: "يحلل الطلاب الشبكات الغذائية والأنواع الدخيلة ورسوم أعداد الكائنات الحية لبناء حجج علمية حول التوازن البيئي.",
      dinner_question: "إذا اختفى حيوان من شبكة غذائية في نهر أو حديقة، كيف يتأثر باقي الكائنات؟",
      key_words: ["invasive species (نوع دخيل)", "competition (تنافس)", "population (جماعة حيوية)", "predator (مفترس)"],
    },
    fr: {
      title: "6e année · Sciences : Où sont passées toutes les créatures ?",
      summary: "Les élèves analysent les réseaux trophiques et les espèces invasives à partir de graphiques pour expliquer les variations de populations.",
      dinner_question: "Si un animal disparaît d'une rivière ou d'un parc, comment cela affecte-t-il les autres espèces ?",
      key_words: ["invasive species (espèce invasive)", "competition (compétition)", "population", "predator (prédateur)"],
    },
  },
  "g6-sci-u4": {
    en: {
      title: "Grade 6 Science: How Does Water Shape Our World?",
      summary: "In IQWST Earth Science, students trace the water cycle and investigate how weathering, erosion, and deposition carve valleys and reshape Baltimore's waterways.",
      dinner_question: "After a heavy Baltimore rainstorm, where do you see moving water carrying soil or leaves, and where does it drop them?",
      key_words: ["weathering", "erosion", "deposition", "elevation"],
    },
    es: {
      title: "Grado 6 · Ciencias: ¿Cómo moldea el agua nuestro mundo?",
      summary: "Estudiamos el ciclo del agua y cómo la meteorización, la erosión y la deposición transforman ríos, valles y paisajes con el tiempo.",
      dinner_question: "Después de una lluvia fuerte en Baltimore, ¿dónde ves que el agua arrastra tierra y dónde la deposita?",
      key_words: ["weathering (meteorización)", "erosion (erosión)", "deposition (deposición)", "elevation (elevación)"],
    },
    ar: {
      title: "الصف السادس · العلوم: كيف يشكّل الماء عالمنا؟",
      summary: "يدرس الطلاب دورة الماء وكيف تغير التجوية والتعرية والترسيب شكل الأودية والمجاري المائية عبر الزمن.",
      dinner_question: "بعد مطر غزير، أين تلاحظ أن الماء يجرف التربة وأين يترسب؟",
      key_words: ["weathering (تجوية)", "erosion (تعرية)", "deposition (ترسيب)", "elevation (ارتفاع)"],
    },
    fr: {
      title: "6e année · Sciences : Comment l'eau façonne-t-elle notre monde ?",
      summary: "Les élèves explorent le cycle de l'eau ainsi que l'altération, l'érosion et le dépôt de sédiments qui sculptent les paysages.",
      dinner_question: "Après une forte pluie, où vois-tu l'eau transporter la terre et où la dépose-t-elle ?",
      key_words: ["weathering (altération)", "erosion (érosion)", "deposition (dépôt)", "elevation (altitude)"],
    },
  },
  "g6-ss-u1": {
    en: {
      title: "Grade 6 Social Studies: Early Humans & Agricultural Revolution",
      summary: "Students examine how early humans shifted from hunting and gathering to farming, creating food surpluses, permanent towns, and specialized jobs.",
      dinner_question: "How does having extra food stored at home change how a family spends its time compared to searching for food every day?",
      key_words: ["surplus", "domestication", "specialization", "nomadic"],
    },
    es: {
      title: "Grado 6 · Estudios Sociales: Primeros humanos y Revolución Agrícola",
      summary: "Exploramos cómo el paso de la caza y recolección a la agricultura creó excedentes de alimentos, aldeas permanentes y oficios especializados.",
      dinner_question: "¿Cómo cambia la vida de una comunidad cuando logra producir y guardar excedentes de comida?",
      key_words: ["surplus (excedente)", "domestication (domesticación)", "specialization (especialización)", "nomadic (nómada)"],
    },
    ar: {
      title: "الصف السادس · الدراسات الاجتماعية: الإنسان القديم والثورة الزراعية",
      summary: "يتعلم الطلاب كيف أدى الانتقال إلى الزراعة إلى فائض غذائي واستقرار القرى وظهور المهن المتخصصة.",
      dinner_question: "كيف تغيّر توفر فائض الطعام طريقة حياة الناس مقارنة بالتنقل اليومي للبحث عن الغذاء؟",
      key_words: ["surplus (فائض)", "domestication (تدجين)", "specialization (تخصص)", "nomadic (بدوي/متنقل)"],
    },
    fr: {
      title: "6e année · Études sociales : Premiers humains et révolution agricole",
      summary: "Les élèves découvrent comment le passage à l'agriculture a créé des surplus alimentaires, des villages permanents et la spécialisation des métiers.",
      dinner_question: "En quoi produire un surplus de nourriture change-t-il l'organisation d'une communauté ?",
      key_words: ["surplus", "domestication", "specialization (spécialisation)", "nomadic (nomade)"],
    },
  },
  "g6-ss-u2": {
    en: {
      title: "Grade 6 Social Studies: River Valley Civilizations",
      summary: "Students compare Mesopotamia, Ancient Egypt, and Kush to see how great rivers supported irrigation, writing (cuneiform & hieroglyphics), and law codes.",
      dinner_question: "Why did ancient cities—and modern Baltimore near the harbor—grow right next to water?",
      key_words: ["irrigation", "cuneiform", "dynasty", "civilization"],
    },
    es: {
      title: "Grado 6 · Estudios Sociales: Civilizaciones de valles fluviales",
      summary: "Comparamos Mesopotamia, Egipto y Kush para entender cómo los ríos impulsaron la irrigación, la escritura y las leyes.",
      dinner_question: "¿Por qué las grandes civilizaciones antiguas—y el Baltimore moderno—crecieron cerca del agua?",
      key_words: ["irrigation (irrigación)", "cuneiform (cuneiforme)", "dynasty (dinastía)", "civilization (civilización)"],
    },
    ar: {
      title: "الصف السادس · الدراسات الاجتماعية: حضارات وديان الأنهار",
      summary: "يقارن الطلاب بين بلاد الرافدين ومصر القديمة وكوش لفهم دور الأنهار في الري والكتابة والقوانين.",
      dinner_question: "لماذا نشأت الحضارات القديمة—ومدينة بالتيمور الحديثة—بالقرب من الأنهار والمياه؟",
      key_words: ["irrigation (ري)", "cuneiform (مسمارية)", "dynasty (سلالة)", "civilization (حضارة)"],
    },
    fr: {
      title: "6e année · Études sociales : Civilisations des vallées fluviales",
      summary: "Les élèves comparent la Mésopotamie, l'Égypte antique et Koush pour comprendre le rôle des fleuves dans l'irrigation, l'écriture et les lois.",
      dinner_question: "Pourquoi les grandes civilisations antiques—comme Baltimore aujourd'hui—se sont-elles développées près de l'eau ?",
      key_words: ["irrigation", "cuneiform (cunéiforme)", "dynasty (dynastie)", "civilization (civilisation)"],
    },
  },
  "g6-ss-u3": {
    en: {
      title: "Grade 6 Social Studies: Ancient India, China & The Silk Road",
      summary: "Students trace how empires, philosophies, and Silk Road trade networks spread inventions, art, and ideas across Asia and beyond.",
      dinner_question: "What foods, languages, or traditions in our neighborhood came from cultural exchange across different parts of the world?",
      key_words: ["cultural diffusion", "empire", "philosophy", "monsoon"],
    },
    es: {
      title: "Grado 6 · Estudios Sociales: India, China y la Ruta de la Seda",
      summary: "Estudiamos cómo los imperios, filosofías y el comercio de la Ruta de la Seda compartieron inventos, arte e ideas entre culturas.",
      dinner_question: "¿Qué comidas, palabras o tradiciones de nuestro vecindario nacieron del intercambio entre culturas?",
      key_words: ["cultural diffusion (difusión cultural)", "empire (imperio)", "philosophy (filosofía)", "monsoon (monzón)"],
    },
    ar: {
      title: "الصف السادس · الدراسات الاجتماعية: الهند والصين وطريق الحرير",
      summary: "يتتبع الطلاب كيف نشر طريق الحرير والتجارة القديمة الأفكار والاختراعات والفنون بين الحضارات.",
      dinner_question: "ما الأطعمة أو التقاليد في مجتمعنا التي جاءت من التبادل الثقافي بين الشعوب؟",
      key_words: ["cultural diffusion (انتشار ثقافي)", "empire (إمبراطورية)", "philosophy (فلسفة)", "monsoon (رياح موسمية)"],
    },
    fr: {
      title: "6e année · Études sociales : Inde, Chine et Route de la Soie",
      summary: "Les élèves retracent comment la Route de la Soie a favorisé la diffusion culturelle des inventions, des philosophies et des arts.",
      dinner_question: "Quels plats, mots ou traditions de notre quartier viennent des échanges entre cultures ?",
      key_words: ["cultural diffusion (diffusion culturelle)", "empire", "philosophy (philosophie)", "monsoon (mousson)"],
    },
  },
  "g6-ss-u4": {
    en: {
      title: "Grade 6 Social Studies: Ancient Greece & Rome",
      summary: "Students examine primary sources on Athenian democracy and the Roman Republic to argue who was included or excluded from citizenship.",
      dinner_question: "What makes a government fair, and how can ordinary people have a voice in their community?",
      key_words: ["democracy", "republic", "citizenship", "primary source"],
    },
    es: {
      title: "Grado 6 · Estudios Sociales: Grecia y Roma antiguas",
      summary: "Analizamos fuentes primarias sobre la democracia ateniense y la República romana para debatir quién tenía derechos de ciudadanía.",
      dinner_question: "¿Qué hace que un gobierno sea justo y cómo pueden participar las personas comunes en su comunidad?",
      key_words: ["democracy (democracia)", "republic (república)", "citizenship (ciudadanía)", "primary source (fuente primaria)"],
    },
    ar: {
      title: "الصف السادس · الدراسات الاجتماعية: اليونان وروما القديمتان",
      summary: "يحلل الطلاب مصادر تاريخية حول الديمقراطية في أثينا والجمهورية الرومانية لمناقشة حقوق المواطنة.",
      dinner_question: "ما الذي يجعل الحكومة عادلة، وكيف يشارك الناس في قرارات مجتمعهم؟",
      key_words: ["democracy (ديمقراطية)", "republic (جمهورية)", "citizenship (مواطنة)", "primary source (مصدر أولي)"],
    },
    fr: {
      title: "6e année · Études sociales : Grèce et Rome antiques",
      summary: "Les élèves analysent des sources primaires sur la démocratie athénienne et la République romaine pour débattre des droits de citoyenneté.",
      dinner_question: "Qu'est-ce qui rend un gouvernement juste et comment chacun peut-il faire entendre sa voix ?",
      key_words: ["democracy (démocratie)", "republic (république)", "citizenship (citoyenneté)", "primary source (source primaire)"],
    },
  },
};

const ALL_UNITS = [
  ...ELA_UNITS,
  ...MATH_UNITS,
  ...SCIENCE_UNITS,
  ...SOCIAL_STUDIES_UNITS,
];

const ALL_CONNECTIONS = [
  ...ELA_CONNECTIONS,
  ...MATH_CONNECTIONS,
  ...SCIENCE_CONNECTIONS,
  ...SOCIAL_STUDIES_CONNECTIONS,
];

const CONN_BY_UNIT = new Map(ALL_CONNECTIONS.map((c) => [c.unit_id, c]));

export const FAMILY_CARDS = ALL_UNITS.map((unit) =>
  buildFamilyCard(unit, CONN_BY_UNIT.get(unit.id), GRADE_6_BESPOKE_CARDS[unit.id] || null),
);

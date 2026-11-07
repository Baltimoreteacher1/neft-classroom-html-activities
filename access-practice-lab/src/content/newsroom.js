// Student newsroom story prompts. 24 for band 3-5, 24 for band 6-8.
export const NEWS_PROMPTS = [
  // ---------- Band 3-5 ----------
  {
    id: "np-35-01",
    b: "3-5",
    kind: "news",
    title: "A New Garden Grows at School",
    titleEs: "Un nuevo jardín crece en la escuela",
    seed: "Imagine a class plants a garden behind the gym. Tell readers what happened.",
    seedEs:
      "Imagina que una clase planta un jardín detrás del gimnasio. Cuéntales a los lectores lo que pasó.",
    ask: [
      "Who helped plant the garden?",
      "What will the class do with the vegetables?",
    ],
    askEs: [
      "¿Quién ayudó a plantar el jardín?",
      "¿Qué hará la clase con las verduras?",
    ],
    pic: "garden",
  },
  {
    id: "np-35-02",
    b: "3-5",
    kind: "news",
    title: "Recycling Week Collects Hundreds of Bottles",
    titleEs: "La semana del reciclaje junta cientos de botellas",
    seed: "Your school held a recycling week. Kids brought in bottles and cans from home. Tell what the students did.",
    seedEs:
      "Tu escuela tuvo una semana del reciclaje. Los niños trajeron botellas y latas de casa. Cuenta lo que hicieron los estudiantes.",
    ask: [
      "How many bottles and cans did the students collect?",
      "Where did the recycling go?",
    ],
    askEs: [
      "¿Cuántas botellas y latas juntaron los estudiantes?",
      "¿A dónde fue el reciclaje?",
    ],
    pic: "recycling",
  },
  {
    id: "np-35-03",
    b: "3-5",
    kind: "news",
    title: "Lost Lunchbox Mystery Solved",
    titleEs: "Resuelven el misterio de la lonchera perdida",
    seed: "A blue lunchbox was missing for three days. Then someone found it in a surprising place. Tell the story.",
    seedEs:
      "Una lonchera azul estuvo perdida durante tres días. Luego alguien la encontró en un lugar sorprendente. Cuenta la historia.",
    ask: ["Where was the lunchbox found?", "Who found it?"],
    askEs: ["¿Dónde encontraron la lonchera?", "¿Quién la encontró?"],
    pic: "school",
  },
  {
    id: "np-35-04",
    b: "3-5",
    kind: "news",
    title: "Rainy Day Brings Recess Indoors",
    titleEs: "El día lluvioso lleva el recreo al interior",
    seed: "It rained all day, so recess moved inside. Tell readers how students spent the day.",
    seedEs:
      "Llovió todo el día, así que el recreo fue adentro. Cuéntales a los lectores cómo pasaron el día los estudiantes.",
    ask: [
      "What games did students play inside?",
      "How did the students feel about the rain?",
    ],
    askEs: [
      "¿A qué jugaron los estudiantes adentro?",
      "¿Cómo se sintieron los estudiantes con la lluvia?",
    ],
    pic: "weather",
  },
  {
    id: "np-35-05",
    b: "3-5",
    kind: "news",
    title: "Students Learn a New Bus Safety Song",
    titleEs:
      "Los estudiantes aprenden una nueva canción de seguridad en el autobús",
    seed: "The bus driver taught kids a song about staying safe on the bus. Tell what happened.",
    seedEs:
      "El conductor del autobús enseñó a los niños una canción sobre cómo estar seguros en el autobús. Cuenta lo que pasó.",
    ask: ["Who wrote the song?", "What safety rules are in the song?"],
    askEs: [
      "¿Quién escribió la canción?",
      "¿Qué reglas de seguridad tiene la canción?",
    ],
    pic: "bus",
  },
  {
    id: "np-35-06",
    b: "3-5",
    kind: "feature",
    title: "Meet Biscuit, Our Class Hamster",
    titleEs: "Conoce a Biscuit, el hámster de nuestra clase",
    seed: "Imagine a class has a pet hamster. Write about what the hamster is like and how kids care for it.",
    seedEs:
      "Imagina que una clase tiene un hámster como mascota. Escribe cómo es el hámster y cómo lo cuidan los niños.",
    ask: [
      "What does the hamster like to eat and do?",
      "Who takes care of the hamster each day?",
    ],
    askEs: [
      "¿Qué le gusta comer y hacer al hámster?",
      "¿Quién cuida al hámster cada día?",
    ],
    pic: "animals",
  },
  {
    id: "np-35-07",
    b: "3-5",
    kind: "feature",
    title: "A Cozy Reading Corner Opens",
    titleEs: "Se abre un acogedor rincón de lectura",
    seed: "The library added beanbags, soft lights, and new shelves. Describe the new space for readers.",
    seedEs:
      "La biblioteca agregó pufs, luces suaves y estantes nuevos. Describe el nuevo espacio para los lectores.",
    ask: [
      "What can kids find in the new reading corner?",
      "Why did the library make this change?",
    ],
    askEs: [
      "¿Qué pueden encontrar los niños en el nuevo rincón de lectura?",
      "¿Por qué hizo este cambio la biblioteca?",
    ],
    pic: "library",
  },
  {
    id: "np-35-08",
    b: "3-5",
    kind: "feature",
    title: "Food Day: Dishes From Around the World",
    titleEs: "Día de la comida: platillos de todo el mundo",
    seed: "Families brought dishes from many places for a school food day. Tell readers what it was like.",
    seedEs:
      "Las familias trajeron platillos de muchos lugares para un día de la comida en la escuela. Cuéntales a los lectores cómo fue.",
    ask: [
      "Which dishes did families bring?",
      "What did students learn about each other?",
    ],
    askEs: [
      "¿Qué platillos trajeron las familias?",
      "¿Qué aprendieron los estudiantes unos de otros?",
    ],
    pic: "food",
  },
  {
    id: "np-35-09",
    b: "3-5",
    kind: "feature",
    title: "School Choir Sings in Two Languages",
    titleEs: "El coro de la escuela canta en dos idiomas",
    seed: "The school choir learned a song in English and Spanish. Write about how they practiced and performed.",
    seedEs:
      "El coro de la escuela aprendió una canción en inglés y en español. Escribe cómo practicaron y se presentaron.",
    ask: [
      "How did the choir learn the words?",
      "Where did the choir sing the song?",
    ],
    askEs: [
      "¿Cómo aprendió la letra el coro?",
      "¿Dónde cantó la canción el coro?",
    ],
    pic: "music",
  },
  {
    id: "np-35-10",
    b: "3-5",
    kind: "opinion",
    title: "Art Class Should Be Every Day",
    titleEs: "La clase de arte debería ser todos los días",
    seed: "Do you think kids should have art class every day? Give your opinion and your reasons.",
    seedEs:
      "¿Crees que los niños deberían tener clase de arte todos los días? Da tu opinión y tus razones.",
    ask: [
      "Why is art class important to you?",
      "What would students make if they had art every day?",
    ],
    askEs: [
      "¿Por qué es importante para ti la clase de arte?",
      "¿Qué harían los estudiantes si tuvieran arte todos los días?",
    ],
    pic: "art",
  },
  {
    id: "np-35-11",
    b: "3-5",
    kind: "opinion",
    title: "Recess Should Be Longer",
    titleEs: "El recreo debería ser más largo",
    seed: "Some kids want a longer recess. Tell what you think and give reasons.",
    seedEs:
      "Algunos niños quieren un recreo más largo. Di lo que piensas y da razones.",
    ask: [
      "How long should recess be, and why?",
      "What would students do with the extra time?",
    ],
    askEs: [
      "¿Cuánto debería durar el recreo y por qué?",
      "¿Qué harían los estudiantes con el tiempo extra?",
    ],
    pic: "school",
  },
  {
    id: "np-35-12",
    b: "3-5",
    kind: "opinion",
    title: "More Computer Time for Kids?",
    titleEs: "¿Más tiempo de computadora para los niños?",
    seed: "Should students get more time on school computers? Share your opinion and tell why.",
    seedEs:
      "¿Deberían los estudiantes tener más tiempo en las computadoras de la escuela? Comparte tu opinión y explica por qué.",
    ask: [
      "What can students learn on computers?",
      "What is one problem with too much computer time?",
    ],
    askEs: [
      "¿Qué pueden aprender los estudiantes en las computadoras?",
      "¿Cuál es un problema de usar demasiado la computadora?",
    ],
    pic: "computer",
  },
  {
    id: "np-35-13",
    b: "3-5",
    kind: "how-to",
    title: "How to Learn to Jump Rope",
    titleEs: "Cómo aprender a saltar la cuerda",
    seed: "You know a few tricks for jumping rope. Teach readers how to start, step by step.",
    seedEs:
      "Conoces algunos trucos para saltar la cuerda. Enseña a los lectores cómo empezar, paso a paso.",
    ask: [
      "What do you need to start?",
      "What is the first thing a beginner should do?",
    ],
    askEs: [
      "¿Qué necesitas para empezar?",
      "¿Qué es lo primero que debe hacer un principiante?",
    ],
    pic: "sports",
  },
  {
    id: "np-35-14",
    b: "3-5",
    kind: "how-to",
    title: "How to Grow a Bean Plant",
    titleEs: "Cómo cultivar una planta de frijol",
    seed: "Explain how to grow a bean seed in a cup. Tell the steps in order.",
    seedEs:
      "Explica cómo cultivar una semilla de frijol en un vaso. Cuenta los pasos en orden.",
    ask: [
      "What materials do you need?",
      "How often should you water the bean?",
    ],
    askEs: [
      "¿Qué materiales necesitas?",
      "¿Cada cuánto debes regar el frijol?",
    ],
    pic: "garden",
  },
  {
    id: "np-35-15",
    b: "3-5",
    kind: "how-to",
    title: "How to Make a Baking Soda Volcano",
    titleEs: "Cómo hacer un volcán de bicarbonato",
    seed: "Your class made a model volcano that bubbles. Tell readers how to make one safely.",
    seedEs:
      "Tu clase hizo un volcán de modelo que burbujea. Cuéntales a los lectores cómo hacer uno de forma segura.",
    ask: [
      "What do you mix to make the bubbles?",
      "What safety rule should kids follow?",
    ],
    askEs: [
      "¿Qué mezclas para hacer las burbujas?",
      "¿Qué regla de seguridad deben seguir los niños?",
    ],
    pic: "science",
  },
  {
    id: "np-35-16",
    b: "3-5",
    kind: "interview",
    title: "Our Crossing Guard Keeps Us Safe",
    titleEs: "Nuestro guardia de cruce nos mantiene seguros",
    seed: "Imagine you talk with the person who helps kids cross the street. Plan what you want to learn.",
    seedEs:
      "Imagina que hablas con la persona que ayuda a los niños a cruzar la calle. Planea lo que quieres saber.",
    ask: [
      "What is the hardest part of your job?",
      "What do you want kids to remember about crossing safely?",
    ],
    askEs: [
      "¿Cuál es la parte más difícil de su trabajo?",
      "¿Qué quiere que recuerden los niños sobre cruzar con seguridad?",
    ],
    pic: "community",
  },
  {
    id: "np-35-17",
    b: "3-5",
    kind: "interview",
    title: "A Day With Our Bus Driver",
    titleEs: "Un día con el conductor del autobús",
    seed: "Imagine you ask the bus driver about the job. Write what you learn.",
    seedEs:
      "Imagina que le preguntas al conductor del autobús sobre su trabajo. Escribe lo que aprendes.",
    ask: [
      "How early does your day start?",
      "What is the best part of driving the bus?",
    ],
    askEs: [
      "¿A qué hora empieza su día?",
      "¿Cuál es la mejor parte de manejar el autobús?",
    ],
    pic: "bus",
  },
  {
    id: "np-35-18",
    b: "3-5",
    kind: "interview",
    title: "Our Custodian Keeps School Shining",
    titleEs: "Nuestro conserje mantiene la escuela reluciente",
    seed: "Talk with the person who cleans and fixes the school. Tell readers what the job is like.",
    seedEs:
      "Habla con la persona que limpia y arregla la escuela. Cuéntales a los lectores cómo es el trabajo.",
    ask: [
      "What do you do before students arrive?",
      "What is the funniest thing you ever found?",
    ],
    askEs: [
      "¿Qué hace antes de que lleguen los estudiantes?",
      "¿Qué es lo más gracioso que ha encontrado?",
    ],
    pic: "school",
  },
  {
    id: "np-35-19",
    b: "3-5",
    kind: "sports",
    title: "Field Day Brings Races and Fun",
    titleEs: "El día de deportes trae carreras y diversión",
    seed: "The whole school had a field day with races and games. Tell who played and who won.",
    seedEs:
      "Toda la escuela tuvo un día de deportes con carreras y juegos. Cuenta quién jugó y quién ganó.",
    ask: [
      "Which races and games did students play?",
      "Who cheered the loudest?",
    ],
    askEs: [
      "¿Qué carreras y juegos hicieron los estudiantes?",
      "¿Quién animó más fuerte?",
    ],
    pic: "sports",
  },
  {
    id: "np-35-20",
    b: "3-5",
    kind: "sports",
    title: "Third Graders Splash at Swim Day",
    titleEs: "Los de tercer grado chapotean en el día de natación",
    seed: "A class went to a pool for swim lessons. Tell how the swimmers did.",
    seedEs:
      "Una clase fue a una piscina para tomar clases de natación. Cuenta cómo les fue a los nadadores.",
    ask: [
      "What did the students learn at swim lessons?",
      "How did swimmers stay safe in the water?",
    ],
    askEs: [
      "¿Qué aprendieron los estudiantes en las clases de natación?",
      "¿Cómo se mantuvieron seguros los nadadores en el agua?",
    ],
    pic: "ocean",
  },
  {
    id: "np-35-21",
    b: "3-5",
    kind: "sports",
    title: "Soccer Team Scores First Win",
    titleEs: "El equipo de fútbol logra su primera victoria",
    seed: "The school soccer team played a game against another school. Tell readers how the game went.",
    seedEs:
      "El equipo de fútbol de la escuela jugó contra otra escuela. Cuéntales a los lectores cómo fue el partido.",
    ask: ["What was the final score?", "Which player made the best play?"],
    askEs: [
      "¿Cuál fue el marcador final?",
      "¿Qué jugador hizo la mejor jugada?",
    ],
    pic: "sports",
  },
  {
    id: "np-35-22",
    b: "3-5",
    kind: "review",
    title: "Book Review: A Story You Will Love",
    titleEs: "Reseña de libro: un cuento que te encantará",
    seed: "Pick a book you read. Tell readers if they should read it, and why.",
    seedEs:
      "Elige un libro que leíste. Dile a los lectores si deberían leerlo y por qué.",
    ask: ["What is the book about?", "Who would like this book, and why?"],
    askEs: [
      "¿De qué trata el libro?",
      "¿A quién le gustaría este libro y por qué?",
    ],
    pic: "library",
  },
  {
    id: "np-35-23",
    b: "3-5",
    kind: "review",
    title: "Space Museum Field Trip: Worth It?",
    titleEs: "Excursión al museo del espacio: ¿vale la pena?",
    seed: "Your class visited a space museum. Review the trip for other classes.",
    seedEs:
      "Tu clase visitó un museo del espacio. Escribe una reseña de la excursión para otras clases.",
    ask: [
      "What was the best exhibit?",
      "Would you tell other classes to go? Why?",
    ],
    askEs: [
      "¿Cuál fue la mejor exhibición?",
      "¿Les dirías a otras clases que vayan? ¿Por qué?",
    ],
    pic: "space",
  },
  {
    id: "np-35-24",
    b: "3-5",
    kind: "review",
    title: "Review: A Visit From the Animal Helper",
    titleEs: "Reseña: la visita del ayudante de animales",
    seed: "A visitor brought gentle animals to school. Review the visit for readers.",
    seedEs:
      "Un visitante trajo animales tranquilos a la escuela. Escribe una reseña de la visita para los lectores.",
    ask: [
      "Which animals did the visitor bring?",
      "What did you like best and least?",
    ],
    askEs: [
      "¿Qué animales trajo el visitante?",
      "¿Qué fue lo que más y lo que menos te gustó?",
    ],
    pic: "animals",
  },
  // ---------- Band 6-8 ----------
  {
    id: "np-68-01",
    b: "6-8",
    kind: "news",
    title: "Science Fair Winners Tackle Clean Water",
    titleEs: "Los ganadores de la feria de ciencias abordan el agua limpia",
    seed: "At the school science fair, a team built a water filter from simple materials. Report on the event and the winning project.",
    seedEs:
      "En la feria de ciencias de la escuela, un equipo construyó un filtro de agua con materiales sencillos. Informa sobre el evento y el proyecto ganador.",
    ask: [
      "How does the winning filter work?",
      "What did the judges say made it stand out?",
    ],
    askEs: [
      "¿Cómo funciona el filtro ganador?",
      "¿Qué dijeron los jueces que lo hizo destacar?",
    ],
    pic: "science",
  },
  {
    id: "np-68-02",
    b: "6-8",
    kind: "news",
    title: "New Bike Path Opens Near School",
    titleEs: "Se inaugura una nueva ciclovía cerca de la escuela",
    seed: "A bike path now connects the neighborhood to the school. Report on the opening day and who it helps.",
    seedEs:
      "Una ciclovía ahora conecta el barrio con la escuela. Informa sobre el día de la inauguración y a quién beneficia.",
    ask: [
      "Who planned and built the path?",
      "How will the path change the way students get to school?",
    ],
    askEs: [
      "¿Quién planeó y construyó la ciclovía?",
      "¿Cómo cambiará la ciclovía la manera en que los estudiantes llegan a la escuela?",
    ],
    pic: "community",
  },
  {
    id: "np-68-03",
    b: "6-8",
    kind: "news",
    title: "Cafeteria Composting Cuts Waste in Half",
    titleEs: "El compostaje en la cafetería reduce los desechos a la mitad",
    seed: "The cafeteria began sorting food scraps into compost bins. Report on how it started and what changed.",
    seedEs:
      "La cafetería empezó a separar los restos de comida en recipientes para composta. Informa cómo comenzó y qué cambió.",
    ask: [
      "How much waste has the cafeteria reduced?",
      "What will the compost be used for?",
    ],
    askEs: [
      "¿Cuántos desechos ha reducido la cafetería?",
      "¿Para qué se usará la composta?",
    ],
    pic: "recycling",
  },
  {
    id: "np-68-04",
    b: "6-8",
    kind: "news",
    title: "Heavy Rain Turns Field Into a Pond",
    titleEs: "La lluvia fuerte convierte el campo en un estanque",
    seed: "A big storm soaked the neighborhood overnight. Report on how the school adjusted its day.",
    seedEs:
      "Una tormenta fuerte empapó el barrio durante la noche. Informa cómo ajustó su día la escuela.",
    ask: [
      "How did the school change the schedule?",
      "What did the forecast say about tomorrow?",
    ],
    askEs: [
      "¿Cómo cambió el horario la escuela?",
      "¿Qué decía el pronóstico para mañana?",
    ],
    pic: "weather",
  },
  {
    id: "np-68-05",
    b: "6-8",
    kind: "news",
    title: "Robotics Team Qualifies for Regional Contest",
    titleEs: "El equipo de robótica clasifica para el concurso regional",
    seed: "The school robotics team built a robot that completed every task in the practice round. Report on their success.",
    seedEs:
      "El equipo de robótica de la escuela construyó un robot que completó todas las tareas en la ronda de práctica. Informa sobre su éxito.",
    ask: [
      "What tasks does the robot complete?",
      "How did the team solve its biggest problem?",
    ],
    askEs: [
      "¿Qué tareas completa el robot?",
      "¿Cómo resolvió el equipo su mayor problema?",
    ],
    pic: "computer",
  },
  {
    id: "np-68-06",
    b: "6-8",
    kind: "feature",
    title: "Morning Announcements Now in Two Languages",
    titleEs: "Los anuncios de la mañana ahora son en dos idiomas",
    seed: "Students began reading morning announcements in English and Spanish. Write about how the idea started and how families responded.",
    seedEs:
      "Los estudiantes empezaron a leer los anuncios de la mañana en inglés y en español. Escribe cómo comenzó la idea y cómo respondieron las familias.",
    ask: [
      "Who came up with the idea?",
      "How have students and families reacted?",
    ],
    askEs: [
      "¿A quién se le ocurrió la idea?",
      "¿Cómo han reaccionado los estudiantes y las familias?",
    ],
    pic: "school",
  },
  {
    id: "np-68-07",
    b: "6-8",
    kind: "feature",
    title: "Library Makeover Brings a Maker Space",
    titleEs: "La renovación de la biblioteca trae un taller de creación",
    seed: "The library closed for a week and reopened with new shelves, quiet pods, and a maker space. Describe the changes.",
    seedEs:
      "La biblioteca cerró por una semana y reabrió con estantes nuevos, cabinas silenciosas y un taller de creación. Describe los cambios.",
    ask: [
      "What new tools and spaces can students use?",
      "How did students help plan the redesign?",
    ],
    askEs: [
      "¿Qué herramientas y espacios nuevos pueden usar los estudiantes?",
      "¿Cómo ayudaron los estudiantes a planear el rediseño?",
    ],
    pic: "library",
  },
  {
    id: "np-68-08",
    b: "6-8",
    kind: "feature",
    title: "Community Garden Links Students and Neighbors",
    titleEs: "El huerto comunitario une a estudiantes y vecinos",
    seed: "Students and neighbors share a garden next to the school. Write about the people and the plants.",
    seedEs:
      "Estudiantes y vecinos comparten un huerto junto a la escuela. Escribe sobre las personas y las plantas.",
    ask: [
      "What is grown in the garden, and who tends it?",
      "What have students learned from the neighbors?",
    ],
    askEs: [
      "¿Qué se cultiva en el huerto y quién lo cuida?",
      "¿Qué han aprendido los estudiantes de los vecinos?",
    ],
    pic: "garden",
  },
  {
    id: "np-68-09",
    b: "6-8",
    kind: "feature",
    title: "A Mural That Tells Our Story",
    titleEs: "Un mural que cuenta nuestra historia",
    seed: "Art students painted a hallway mural showing the school community. Write about the design and the painters.",
    seedEs:
      "Los estudiantes de arte pintaron un mural en el pasillo que muestra a la comunidad escolar. Escribe sobre el diseño y los pintores.",
    ask: [
      "What images are in the mural, and why were they chosen?",
      "How did the artists work together?",
    ],
    askEs: [
      "¿Qué imágenes tiene el mural y por qué las eligieron?",
      "¿Cómo trabajaron juntos los artistas?",
    ],
    pic: "art",
  },
  {
    id: "np-68-10",
    b: "6-8",
    kind: "opinion",
    title: "Should Middle Schools Start Later?",
    titleEs: "¿Deberían las escuelas intermedias empezar más tarde?",
    seed: "Some students say a later start time would help them focus. Argue for or against it, with reasons.",
    seedEs:
      "Algunos estudiantes dicen que un horario de entrada más tarde los ayudaría a concentrarse. Argumenta a favor o en contra, con razones.",
    ask: [
      "What evidence supports your position?",
      "How would a later start affect buses and families?",
    ],
    askEs: [
      "¿Qué evidencia apoya tu postura?",
      "¿Cómo afectaría una entrada más tarde a los autobuses y a las familias?",
    ],
    pic: "bus",
  },
  {
    id: "np-68-11",
    b: "6-8",
    kind: "opinion",
    title: "Is Homework Worth the Time?",
    titleEs: "¿Vale la pena el tiempo que lleva la tarea?",
    seed: "Students often disagree about how much homework is fair. Take a side and explain your thinking.",
    seedEs:
      "Los estudiantes a menudo no están de acuerdo sobre cuánta tarea es justa. Elige una postura y explica tu razonamiento.",
    ask: [
      "What kind of homework helps you learn the most?",
      "What would you change about homework, and why?",
    ],
    askEs: [
      "¿Qué tipo de tarea te ayuda más a aprender?",
      "¿Qué cambiarías de la tarea y por qué?",
    ],
    pic: "school",
  },
  {
    id: "np-68-12",
    b: "6-8",
    kind: "opinion",
    title: "Tablets or Textbooks?",
    titleEs: "¿Tabletas o libros de texto?",
    seed: "The school may switch from paper textbooks to tablets. Argue which one is better for learning.",
    seedEs:
      "La escuela podría cambiar de libros de texto en papel a tabletas. Argumenta cuál es mejor para aprender.",
    ask: [
      "What are the biggest benefits of your choice?",
      "What might be a downside, and how could it be fixed?",
    ],
    askEs: [
      "¿Cuáles son los mayores beneficios de tu elección?",
      "¿Cuál podría ser una desventaja y cómo se podría resolver?",
    ],
    pic: "computer",
  },
  {
    id: "np-68-13",
    b: "6-8",
    kind: "how-to",
    title: "How to Build a Paper Bridge That Holds Weight",
    titleEs: "Cómo construir un puente de papel que aguante peso",
    seed: "Your science class built bridges from folded paper. Explain how to design one and test it.",
    seedEs:
      "Tu clase de ciencias construyó puentes con papel doblado. Explica cómo diseñar uno y probarlo.",
    ask: [
      "Which folds make the bridge stronger?",
      "How do you test how much weight it can hold?",
    ],
    askEs: [
      "¿Qué dobleces hacen más fuerte el puente?",
      "¿Cómo pruebas cuánto peso puede aguantar?",
    ],
    pic: "science",
  },
  {
    id: "np-68-14",
    b: "6-8",
    kind: "how-to",
    title: "How to Plan a Cultural Food Fair",
    titleEs: "Cómo organizar una feria de comidas culturales",
    seed: "A club wants to host a food fair where families share traditional dishes. Explain the steps to plan it.",
    seedEs:
      "Un club quiere organizar una feria de comidas donde las familias compartan platillos tradicionales. Explica los pasos para planearla.",
    ask: [
      "What jobs need to be done before the fair?",
      "How can organizers make sure everyone can join in and eat safely?",
    ],
    askEs: [
      "¿Qué tareas hay que hacer antes de la feria?",
      "¿Cómo pueden asegurarse los organizadores de que todos puedan participar y comer sin riesgo?",
    ],
    pic: "food",
  },
  {
    id: "np-68-15",
    b: "6-8",
    kind: "how-to",
    title: "How to Warm Up Before a Race",
    titleEs: "Cómo calentar antes de una carrera",
    seed: "A coach teaches runners how to stretch and warm up. Explain a simple routine.",
    seedEs:
      "Un entrenador enseña a los corredores a estirarse y calentar. Explica una rutina sencilla.",
    ask: [
      "What exercises should runners do first?",
      "Why does warming up matter?",
    ],
    askEs: [
      "¿Qué ejercicios deben hacer primero los corredores?",
      "¿Por qué es importante calentar?",
    ],
    pic: "sports",
  },
  {
    id: "np-68-16",
    b: "6-8",
    kind: "interview",
    title: "Inside the Cafeteria: A Chat With the Kitchen Manager",
    titleEs: "Dentro de la cafetería: una charla con la encargada de la cocina",
    seed: "You interview the person who plans the school lunch menu. Write about what you learn.",
    seedEs:
      "Entrevistas a la persona que planea el menú del almuerzo escolar. Escribe lo que aprendes.",
    ask: [
      "How do you decide what goes on the menu?",
      "What would students be surprised to learn about running a kitchen?",
    ],
    askEs: [
      "¿Cómo decide qué incluir en el menú?",
      "¿Qué sorprendería a los estudiantes saber sobre dirigir una cocina?",
    ],
    pic: "food",
  },
  {
    id: "np-68-17",
    b: "6-8",
    kind: "interview",
    title: "A Crossing Guard's View of the Morning Rush",
    titleEs: "La mañana ajetreada vista por un guardia de cruce",
    seed: "Interview a crossing guard who sees hundreds of students every morning. Share what they have noticed.",
    seedEs:
      "Entrevista a un guardia de cruce que ve a cientos de estudiantes cada mañana. Comparte lo que ha observado.",
    ask: [
      "What has changed on this street since you started?",
      "What advice do you have for drivers and walkers?",
    ],
    askEs: [
      "¿Qué ha cambiado en esta calle desde que empezó?",
      "¿Qué consejos tiene para los conductores y los peatones?",
    ],
    pic: "community",
  },
  {
    id: "np-68-18",
    b: "6-8",
    kind: "interview",
    title: "An Ocean Expert Visits Our Classroom",
    titleEs: "Una experta en el océano visita nuestra aula",
    seed: "A scientist who studies the ocean visited the school. Interview her about her work.",
    seedEs:
      "Una científica que estudia el océano visitó la escuela. Entrevístala sobre su trabajo.",
    ask: [
      "What does a typical day of research look like?",
      "What can students do to protect the ocean?",
    ],
    askEs: [
      "¿Cómo es un día típico de investigación?",
      "¿Qué pueden hacer los estudiantes para proteger el océano?",
    ],
    pic: "ocean",
  },
  {
    id: "np-68-19",
    b: "6-8",
    kind: "sports",
    title: "Eagles Rally to Win Basketball Showdown",
    titleEs: "Las Águilas remontan y ganan el duelo de baloncesto",
    seed: "The school basketball team came from behind in the last quarter. Report on the game.",
    seedEs:
      "El equipo de baloncesto de la escuela remontó en el último cuarto. Informa sobre el partido.",
    ask: ["What turned the game around?", "Which player stood out, and how?"],
    askEs: [
      "¿Qué cambió el rumbo del partido?",
      "¿Qué jugador se destacó y cómo?",
    ],
    pic: "sports",
  },
  {
    id: "np-68-20",
    b: "6-8",
    kind: "sports",
    title: "Track Meet Sets New School Records",
    titleEs: "La competencia de atletismo establece nuevos récords escolares",
    seed: "Runners and jumpers competed at the spring track meet. Report on the top results.",
    seedEs:
      "Corredores y saltadores compitieron en la competencia de atletismo de primavera. Informa sobre los mejores resultados.",
    ask: ["Which school records were broken?", "How did the athletes prepare?"],
    askEs: [
      "¿Qué récords escolares se rompieron?",
      "¿Cómo se prepararon los atletas?",
    ],
    pic: "sports",
  },
  {
    id: "np-68-21",
    b: "6-8",
    kind: "sports",
    title: "Rain Cannot Stop the Cross-Country Meet",
    titleEs: "La lluvia no detiene la carrera de campo traviesa",
    seed: "Runners raced through mud and puddles. Report on how the meet went and how the athletes handled the weather.",
    seedEs:
      "Los corredores compitieron entre lodo y charcos. Informa cómo fue la carrera y cómo manejaron el clima los atletas.",
    ask: [
      "How did the weather affect the race?",
      "Who finished first, and how did that runner feel?",
    ],
    askEs: [
      "¿Cómo afectó el clima a la carrera?",
      "¿Quién llegó primero y cómo se sintió esa persona?",
    ],
    pic: "weather",
  },
  {
    id: "np-68-22",
    b: "6-8",
    kind: "review",
    title: "Spring Concert Review: Strings, Drums, and Voices",
    titleEs: "Reseña del concierto de primavera: cuerdas, tambores y voces",
    seed: "You attended the school's spring concert. Review the performance, naming what worked and what could improve.",
    seedEs:
      "Asististe al concierto de primavera de la escuela. Reseña la presentación e indica qué funcionó y qué se podría mejorar.",
    ask: [
      "Which performance was your favorite, and why?",
      "What would make the next concert even better?",
    ],
    askEs: [
      "¿Cuál presentación fue tu favorita y por qué?",
      "¿Qué haría aún mejor el próximo concierto?",
    ],
    pic: "music",
  },
  {
    id: "np-68-23",
    b: "6-8",
    kind: "review",
    title: "Review: A Science Fiction Novel About Mars",
    titleEs: "Reseña: una novela de ciencia ficción sobre Marte",
    seed: "Choose a space adventure story you have read. Review the plot, the characters, and the writing.",
    seedEs:
      "Elige una historia de aventuras espaciales que hayas leído. Reseña la trama, los personajes y la escritura.",
    ask: [
      "What is the main conflict in the story?",
      "Would you recommend it, and to whom?",
    ],
    askEs: [
      "¿Cuál es el conflicto principal de la historia?",
      "¿La recomendarías y a quién?",
    ],
    pic: "space",
  },
  {
    id: "np-68-24",
    b: "6-8",
    kind: "review",
    title: "Review: A Wildlife Rescue Talk",
    titleEs: "Reseña: una charla sobre rescate de fauna silvestre",
    seed: "A wildlife rescue worker gave a talk with photos of rescued animals. Review the presentation.",
    seedEs:
      "Un trabajador de rescate de fauna silvestre dio una charla con fotos de animales rescatados. Reseña la presentación.",
    ask: [
      "What did you learn about helping injured animals?",
      "How clear and interesting was the presentation?",
    ],
    askEs: [
      "¿Qué aprendiste sobre cómo ayudar a animales heridos?",
      "¿Qué tan clara e interesante fue la presentación?",
    ],
    pic: "animals",
  },
];

// ── Pictures: a built-in set of 16 inline SVG scenes (viewBox 0 0 240 160) a story can use. No files are loaded. ──
export const PICS = {
  school: ["School", "Escuela", `<rect width="240" height="160" fill="#d5e6f2"/><rect y="120" width="240" height="40" fill="#8fc08a"/><rect x="50" y="56" width="140" height="68" fill="#d28b58"/><path d="M40 58 L120 22 L200 58z" fill="#884326"/><rect x="104" y="86" width="32" height="38" fill="#fffdf8"/><g fill="#fffdf8"><rect x="64" y="72" width="24" height="20"/><rect x="152" y="72" width="24" height="20"/></g><path d="M214 124 V40" stroke="#59637f" stroke-width="3"/><path d="M214 40 h18 v12 h-18z" fill="#a24f72"/>`],
  garden: ["Garden", "Jardín", `<rect width="240" height="160" fill="#d5e6f2"/><circle cx="196" cy="34" r="18" fill="#f5d6a8"/><rect y="112" width="240" height="48" fill="#8d5524"/><g stroke="#5a9481" stroke-width="4"><path d="M50 112 V78 M110 112 V66 M170 112 V82"/></g><g fill="#5a9481"><ellipse cx="38" cy="90" rx="12" ry="6"/><ellipse cx="62" cy="96" rx="12" ry="6"/><ellipse cx="98" cy="80" rx="12" ry="6"/><ellipse cx="122" cy="86" rx="12" ry="6"/><ellipse cx="158" cy="94" rx="12" ry="6"/></g><circle cx="110" cy="62" r="11" fill="#d28b58"/><circle cx="50" cy="74" r="9" fill="#a24f72"/><circle cx="170" cy="78" r="9" fill="#f5d6a8"/>`],
  sports: ["Sports", "Deportes", `<rect width="240" height="160" fill="#cfeaf5"/><rect y="100" width="240" height="60" fill="#5a9481"/><path d="M0 130 H240 M120 100 V160" stroke="#fffdf8" stroke-width="3"/><circle cx="120" cy="104" r="34" fill="#fffdf8" stroke="#264e48" stroke-width="3" transform="translate(0 -20)"/><path d="M120 50 l14 10 -5 17 h-18 l-5 -17z" fill="#264e48" transform="translate(0 4)"/><rect x="24" y="64" width="6" height="66" fill="#fffdf8"/><rect x="24" y="64" width="46" height="6" fill="#fffdf8"/>`],
  science: ["Science", "Ciencia", `<rect width="240" height="160" fill="#e2f3f0"/><rect y="124" width="240" height="36" fill="#a87b4f"/><path d="M70 40 h26 v34 l24 44 q4 8 -6 8 h-62 q-10 0 -6 -8 l24 -44z" fill="#91e2d6" stroke="#075568" stroke-width="3"/><rect x="66" y="34" width="34" height="8" rx="3" fill="#075568"/><circle cx="82" cy="104" r="5" fill="#fffdf8"/><circle cx="96" cy="94" r="3" fill="#fffdf8"/><rect x="150" y="60" width="14" height="50" rx="4" fill="#33447c" transform="rotate(20 157 85)"/><rect x="146" y="108" width="50" height="10" rx="3" fill="#33447c"/><circle cx="188" cy="86" r="8" fill="none" stroke="#33447c" stroke-width="4"/>`],
  library: ["Library", "Biblioteca", `<rect width="240" height="160" fill="#efe9e4"/><rect x="20" y="20" width="110" height="110" fill="#7c5a37"/><rect x="26" y="28" width="98" height="28" fill="#a87b4f"/><rect x="26" y="62" width="98" height="28" fill="#a87b4f"/><rect x="26" y="96" width="98" height="28" fill="#a87b4f"/><g><rect x="32" y="30" width="10" height="26" fill="#2e4a94"/><rect x="46" y="34" width="10" height="22" fill="#a24f72"/><rect x="60" y="30" width="10" height="26" fill="#d28b58"/><rect x="40" y="64" width="12" height="26" fill="#5a9481"/><rect x="56" y="68" width="10" height="22" fill="#2e4a94"/><rect x="34" y="98" width="12" height="26" fill="#a24f72"/><rect x="50" y="100" width="10" height="24" fill="#d28b58"/></g><path d="M150 116 Q190 96 230 116 V142 Q190 124 150 142z" fill="#fffdf8" stroke="#33447c" stroke-width="3"/><path d="M190 106 V134" stroke="#33447c" stroke-width="3"/>`],
  bus: ["Bus", "Autobús", `<rect width="240" height="160" fill="#d5e6f2"/><rect y="118" width="240" height="42" fill="#7c8190"/><rect x="20" y="52" width="196" height="68" rx="12" fill="#f5c04a"/><g fill="#bfe3f0"><rect x="32" y="62" width="34" height="26" rx="4"/><rect x="74" y="62" width="34" height="26" rx="4"/><rect x="116" y="62" width="34" height="26" rx="4"/><rect x="158" y="62" width="40" height="26" rx="4"/></g><rect x="20" y="98" width="196" height="6" fill="#33447c"/><circle cx="64" cy="122" r="14" fill="#1d2b58"/><circle cx="170" cy="122" r="14" fill="#1d2b58"/><circle cx="64" cy="122" r="6" fill="#bdb4a6"/><circle cx="170" cy="122" r="6" fill="#bdb4a6"/>`],
  food: ["Food", "Comida", `<rect width="240" height="160" fill="#fdf2d8"/><ellipse cx="120" cy="104" rx="92" ry="34" fill="#fffdf8" stroke="#bdb4a6" stroke-width="3"/><circle cx="90" cy="96" r="20" fill="#d4482c"/><path d="M90 76 q4 -10 12 -12" stroke="#264e48" stroke-width="4" fill="none"/><ellipse cx="136" cy="102" rx="26" ry="18" fill="#f5c04a"/><path d="M120 92 q16 -14 32 0" stroke="#d28b58" stroke-width="4" fill="none"/><circle cx="168" cy="96" r="12" fill="#5a9481"/><circle cx="178" cy="108" r="9" fill="#5a9481"/>`],
  music: ["Music", "Música", `<rect width="240" height="160" fill="#f8ebf0"/><g stroke="#7d3354" stroke-width="2.5"><path d="M20 50 H220 M20 66 H220 M20 82 H220 M20 98 H220 M20 114 H220"/></g><g fill="#7d3354"><ellipse cx="62" cy="98" rx="11" ry="8"/><ellipse cx="110" cy="82" rx="11" ry="8"/><ellipse cx="158" cy="106" rx="11" ry="8"/><ellipse cx="200" cy="66" rx="11" ry="8"/></g><g stroke="#7d3354" stroke-width="4"><path d="M72 98 V40 M120 82 V30 M168 106 V48 M210 66 V20"/></g><path d="M120 30 L168 48 M168 48 v6" stroke="#7d3354" stroke-width="5"/>`],
  animals: ["Animals", "Animales", `<rect width="240" height="160" fill="#d5e6f2"/><rect y="118" width="240" height="42" fill="#8fc08a"/><path d="M52 118 Q52 54 120 54 Q188 54 188 118z" fill="#5a9481" stroke="#264e48" stroke-width="3"/><path d="M84 118 Q84 76 120 76 M120 54 V118 M156 118 Q156 76 120 76" stroke="#264e48" stroke-width="3" fill="none"/><circle cx="198" cy="100" r="18" fill="#8fc08a" stroke="#264e48" stroke-width="3"/><circle cx="204" cy="96" r="3" fill="#264e48"/><rect x="66" y="116" width="22" height="16" rx="5" fill="#8fc08a" stroke="#264e48" stroke-width="3"/><rect x="152" y="116" width="22" height="16" rx="5" fill="#8fc08a" stroke="#264e48" stroke-width="3"/>`],
  weather: ["Weather", "Clima", `<rect width="240" height="160" fill="#cfeaf5"/><circle cx="76" cy="52" r="26" fill="#f5c04a"/><g stroke="#f5c04a" stroke-width="5" stroke-linecap="round"><path d="M76 12 V4 M36 52 H28 M116 52 H124 M48 24 l-6 -6 M104 24 l6 -6"/></g><g fill="#fffdf8" stroke="#9aa6d2" stroke-width="3"><circle cx="124" cy="82" r="24"/><circle cx="152" cy="74" r="28"/><circle cx="182" cy="86" r="22"/><rect x="124" y="82" width="58" height="26" stroke="none"/></g><g stroke="#2e4a94" stroke-width="4" stroke-linecap="round"><path d="M134 120 l-6 16 M156 118 l-6 18 M178 120 l-6 16"/></g>`],
  community: ["Community", "Comunidad", `<rect width="240" height="160" fill="#d5e6f2"/><rect y="116" width="240" height="44" fill="#9aa0ab"/><path d="M0 138 H240" stroke="#fffdf8" stroke-width="4" stroke-dasharray="18 12"/><rect x="18" y="64" width="64" height="52" fill="#d28b58"/><path d="M12 66 L50 38 L88 66z" fill="#884326"/><rect x="42" y="88" width="16" height="28" fill="#fffdf8"/><rect x="100" y="48" width="56" height="68" fill="#a24f72"/><g fill="#fffdf8"><rect x="110" y="60" width="14" height="14"/><rect x="134" y="60" width="14" height="14"/><rect x="110" y="86" width="14" height="14"/><rect x="134" y="86" width="14" height="14"/></g><rect x="198" y="82" width="8" height="34" fill="#7c5a37"/><circle cx="202" cy="70" r="22" fill="#5a9481"/>`],
  computer: ["Computer", "Computadora", `<rect width="240" height="160" fill="#eceef8"/><rect x="52" y="30" width="136" height="88" rx="8" fill="#33447c"/><rect x="60" y="38" width="120" height="72" rx="3" fill="#bfe3f0"/><path d="M70 96 H110 M70 82 H150 M70 68 H130" stroke="#33447c" stroke-width="5" stroke-linecap="round"/><path d="M34 126 H206 L196 140 H44z" fill="#9aa6d2"/><rect x="104" y="124" width="32" height="5" rx="2" fill="#59637f"/>`],
  art: ["Art", "Arte", `<rect width="240" height="160" fill="#fbefe3"/><path d="M120 24 C60 24 28 62 36 100 C42 128 74 134 92 124 C108 116 100 100 114 96 C132 90 144 112 170 110 C206 106 214 60 190 42 C174 30 150 24 120 24z" fill="#f5d6a8" stroke="#884326" stroke-width="3"/><circle cx="78" cy="62" r="11" fill="#d4482c"/><circle cx="114" cy="48" r="11" fill="#2e4a94"/><circle cx="152" cy="54" r="11" fill="#5a9481"/><circle cx="180" cy="78" r="11" fill="#a24f72"/><rect x="170" y="108" width="12" height="46" rx="4" fill="#7c5a37" transform="rotate(30 176 130)"/>`],
  ocean: ["Ocean", "Océano", `<rect width="240" height="160" fill="#cfeaf5"/><rect y="50" width="240" height="110" fill="#15969a"/><path d="M0 50 q15 -10 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#fffdf8" stroke-width="4"/><ellipse cx="100" cy="104" rx="34" ry="18" fill="#f5c04a"/><path d="M132 104 L158 88 V120z" fill="#f5c04a"/><circle cx="84" cy="98" r="4" fill="#1d2b58"/><ellipse cx="180" cy="130" rx="18" ry="9" fill="#a24f72"/><path d="M198 130 l14 -8 v16z" fill="#a24f72"/>`],
  space: ["Space", "Espacio", `<rect width="240" height="160" fill="#121c3f"/><g fill="#fffdf8"><circle cx="30" cy="30" r="2"/><circle cx="90" cy="20" r="1.5"/><circle cx="200" cy="40" r="2"/><circle cx="170" cy="130" r="1.5"/><circle cx="40" cy="120" r="2"/><circle cx="130" cy="60" r="1.5"/></g><circle cx="76" cy="96" r="30" fill="#d28b58"/><ellipse cx="76" cy="96" rx="48" ry="9" fill="none" stroke="#f5d6a8" stroke-width="5" transform="rotate(-20 76 96)"/><path d="M168 118 L190 52 L212 118z" fill="#fffdf8"/><path d="M168 118 L156 134 L176 126z M212 118 L224 134 L204 126z" fill="#a24f72"/><circle cx="190" cy="84" r="7" fill="#15969a"/>`],
  recycling: ["Recycling", "Reciclaje", `<rect width="240" height="160" fill="#e7f1ea"/><rect y="132" width="240" height="28" fill="#bdb4a6"/><g><rect x="26" y="62" width="52" height="72" rx="6" fill="#2e4a94"/><rect x="94" y="62" width="52" height="72" rx="6" fill="#5a9481"/><rect x="162" y="62" width="52" height="72" rx="6" fill="#a87b4f"/></g><g fill="#fffdf8"><rect x="22" y="54" width="60" height="10" rx="3"/><rect x="90" y="54" width="60" height="10" rx="3"/><rect x="158" y="54" width="60" height="10" rx="3"/></g><g fill="none" stroke="#fffdf8" stroke-width="4" stroke-linecap="round"><path d="M52 90 l-10 12 h20 M42 102 l8 10 M62 102 l-6 10"/><path d="M120 86 a14 14 0 1 1 -6 22 M114 108 l-4 -10 l10 -2"/><path d="M188 88 q-12 8 -2 22 q14 -6 2 -22z M188 110 v-14"/></g>`],
};
export const PIC_IDS = Object.keys(PICS);

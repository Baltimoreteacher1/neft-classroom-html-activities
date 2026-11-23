export const READINGS_K = [
  {
    unit_id: "gk-ela-u1",
    title: "Using Our Five Senses",
    genre: "informational",
    texts: {
      "1_2": "We have five senses. We see with our eyes. We hear with our ears. We observe to learn. To observe is to look closely. A detail is a small piece of information. We smell, taste, and feel too.",
      "3_4": "People have five senses. We see with our eyes and hear with our ears. We smell with our nose, taste with our tongue, and feel with our skin. We use our senses to observe the world. To observe means to look closely so we can learn. A detail is a small piece of information, like a color or a sound.",
      "5_6": "People learn about the world through five senses: sight, hearing, smell, taste, and touch. We see with our eyes, hear with our ears, and smell with our nose. We also taste with our tongue and feel with our skin. When we observe, we look closely so that we can learn something new. Careful observers notice each detail, which is a small piece of information such as a color, a sound, or a texture."
    },
    questions: [
      { type: "detail", q: "How many senses do people have?", options: ["Five", "Three", "Ten"], answer: 0, evidence: { "1_2": "We have five senses", "3_4": "People have five senses", "5_6": "through five senses" } },
      { type: "vocab", q: "What does “observe” mean in this reading?", options: ["Run and jump", "Look closely to learn", "Make a loud sound"], answer: 1, evidence: { "1_2": "To observe is to look closely", "3_4": "To observe means to look closely", "5_6": "we look closely so that we can learn something new" } },
      { type: "inference", q: "Why might you look closely at a leaf?", options: ["To hear it sing", "To make it grow", "To find details about it"], answer: 2, evidence: { "1_2": "A detail is a small piece of information", "3_4": "A detail is a small piece of information", "5_6": "a small piece of information" } }
    ]
  },
  {
    unit_id: "gk-ela-u2",
    title: "Meet the Parts of a Story",
    genre: "explanatory",
    texts: {
      "1_2": "A story has parts. A character is a person or animal in a story. A pig can be a character. The setting is where and when a story happens. A farm or a barn can be a setting. The sequence is the order events happen. First, next, last.",
      "3_4": "Every story has important parts. A character is a person or animal in a story, such as a pig or a farmer. The setting is where and when a story happens. A farm or a barn can be a setting. The sequence is the order events happen, like first, next, and last. Readers watch the sequence so they can follow the story.",
      "5_6": "Stories, including classic farm tales, are built from key parts. A character is a person or animal in the story, such as a pig or a farmer. The setting is where and when the story happens, and a farm or a barn can be a setting. The sequence is the order in which events happen, such as first, next, and last. Understanding these parts helps readers follow what happens and why."
    },
    questions: [
      { type: "detail", q: "Which animal does the reading name as a character?", options: ["A duck", "A pig", "A goat"], answer: 1, evidence: { "1_2": "A pig can be a character", "3_4": "such as a pig or a farmer", "5_6": "such as a pig or a farmer" } },
      { type: "vocab", q: "What does “sequence” mean in this reading?", options: ["A place in a story", "A person in a story", "The order events happen"], answer: 2, evidence: { "1_2": "The sequence is the order events happen", "3_4": "The sequence is the order events happen", "5_6": "The sequence is the order in which events happen" } },
      { type: "inference", q: "A story happens in a barn. What part of the story is the barn?", options: ["The setting", "The sequence", "The character"], answer: 0, evidence: { "1_2": "a barn can be a setting", "3_4": "a barn can be a setting", "5_6": "a barn can be a setting" } }
    ]
  },
  {
    unit_id: "gk-ela-u3",
    title: "America Long Ago and Today",
    genre: "informational",
    texts: {
      "1_2": "The past is a time before now. The present is right now. We compare the past and the present. To compare is to tell how things are alike or different. In the past, people rode in wagons pulled by horses. In the present, they ride in cars.",
      "3_4": "The past is a time before now. The present is right now. When we compare the past and the present, we tell how they are alike and different. Long ago, many people traveled in wagons pulled by horses. Today, people ride in cars and buses. Homes and schools have changed too.",
      "5_6": "The past is a time before now, while the present is right now. When we compare the past and the present, we tell how they are alike and how they are different. Long ago, many families traveled in wagons pulled by horses. Today, people ride in cars, buses, and airplanes. Daily life, homes, and schools have also changed over time."
    },
    questions: [
      { type: "detail", q: "How did many people travel in the past?", options: ["In a car", "On a bus", "In a wagon"], answer: 2, evidence: { "1_2": "wagons pulled by horses", "3_4": "wagons pulled by horses", "5_6": "wagons pulled by horses" } },
      { type: "vocab", q: "What does “compare” mean in this reading?", options: ["Tell how two things are alike or different", "Go to a brand new place", "Find out what time it is"], answer: 0, evidence: { "1_2": "To compare is to tell how things are alike or different", "3_4": "we tell how they are alike and different", "5_6": "we tell how they are alike and how they are different" } },
      { type: "inference", q: "What do we learn when we compare a wagon and a car?", options: ["They are exactly the same", "Travel is different in the past and the present", "Nobody travels today"], answer: 1, evidence: { "1_2": "In the present, they ride in cars", "3_4": "Today, people ride in cars and buses", "5_6": "Today, people ride in cars, buses, and airplanes" } }
    ]
  },
  {
    unit_id: "gk-ela-u4",
    title: "Seven Continents to Explore",
    genre: "informational",
    texts: {
      "1_2": "A continent is a very large area of land. There are seven continents. Asia is a continent. A landmark is a famous place. The Great Wall is a landmark in Asia. An opinion is what you think or feel. I think the wall is great.",
      "3_4": "A continent is a very large area of land on Earth. There are seven continents, and Asia is one of them. A landmark is a famous place or feature. The Great Wall is a famous landmark in Asia. An opinion is what someone thinks or feels. A student might think the Great Wall looks amazing, and that is an opinion.",
      "5_6": "Earth has seven continents, which are very large areas of land. Asia is one of them. A landmark is a famous place or feature, such as the Great Wall in Asia or the Eiffel Tower in Europe. When travelers say which place they would like to visit, they share an opinion, which is what someone thinks or feels."
    },
    questions: [
      { type: "detail", q: "How many continents are there?", options: ["Seven", "Five", "Nine"], answer: 0, evidence: { "1_2": "There are seven continents", "3_4": "There are seven continents", "5_6": "Earth has seven continents" } },
      { type: "vocab", q: "What does “landmark” mean in this reading?", options: ["A very small toy", "A famous place or feature", "A kind of food"], answer: 1, evidence: { "1_2": "A landmark is a famous place", "3_4": "A landmark is a famous place or feature", "5_6": "A landmark is a famous place or feature" } },
      { type: "inference", q: "What is true about Asia?", options: ["It is a small town", "It is a person's name", "It is a continent with a famous landmark"], answer: 2, evidence: { "1_2": "The Great Wall is a landmark in Asia", "3_4": "The Great Wall is a famous landmark in Asia", "5_6": "the Great Wall in Asia" } }
    ]
  },
  {
    unit_id: "gk-math-u1",
    title: "Mia Counts Her Apples",
    genre: "explanatory",
    texts: {
      "1_2": "Mia has a group of apples. A group is objects put together. Mia will count the apples. To count is to find how many. She says 1, 2, 3, 4, 5. There are 5 apples. A number shows how many. The number is 5.",
      "3_4": "Mia has a group of apples. A group is objects that are put together. She wants to count them. She touches each apple and says 1, 2, 3, 4, 5. To count is to find how many objects are in a group. A number shows how many. The number 5 tells us there are 5 apples.",
      "5_6": "Mia has a group of apples on the table. A group is a set of objects put together. To count, she touches each apple one at a time. She says 1, 2, 3, 4, 5. The last number she says is 5, so there are 5 apples. A number is a word or symbol showing how many."
    },
    questions: [
      { type: "detail", q: "How many apples does Mia have?", options: ["Four", "Five", "Six"], answer: 1, evidence: { "1_2": "There are 5 apples", "3_4": "there are 5 apples", "5_6": "there are 5 apples" } },
      { type: "vocab", q: "What does “group” mean in this reading?", options: ["A loud noise", "A bright color", "Objects put together"], answer: 2, evidence: { "1_2": "A group is objects put together", "3_4": "A group is objects that are put together", "5_6": "A group is a set of objects put together" } },
      { type: "inference", q: "Mia says 5 at the end. What does 5 tell us?", options: ["How many apples are in the group", "What color the apples are", "How big the apples are"], answer: 0, evidence: { "1_2": "A number shows how many", "3_4": "A number shows how many", "5_6": "A number is a word or symbol showing how many" } }
    ]
  },
  {
    unit_id: "gk-math-u2",
    title: "Who Has More Blocks?",
    genre: "explanatory",
    texts: {
      "1_2": "Sam has 6 blocks. Lia has 4 blocks. Sam has more. 6 is greater than 4. Greater than means more. Lia has fewer. 4 is less than 6. Less than means fewer. Omar has 6 blocks too. Sam and Omar have an equal amount.",
      "3_4": "Sam has 6 blocks. Lia has 4 blocks. 6 is greater than 4, so Sam has more blocks. 4 is less than 6, so Lia has fewer blocks. Omar also has 6 blocks. Sam and Omar have an equal amount.",
      "5_6": "Sam has 6 blocks, Lia has 4 blocks, and Omar has 6 blocks. When we compare the groups, we see who has more or fewer. Because 6 is greater than 4, Sam has more blocks than Lia. Because 4 is less than 6, Lia has fewer blocks than Sam. Sam and Omar each have 6 blocks, so their groups are equal."
    },
    questions: [
      { type: "detail", q: "How many blocks does Lia have?", options: ["Six", "Five", "Four"], answer: 2, evidence: { "1_2": "Lia has 4 blocks", "3_4": "Lia has 4 blocks", "5_6": "Lia has 4 blocks" } },
      { type: "vocab", q: "What does “greater than” mean in this reading?", options: ["More in number or amount", "Fewer in number or amount", "The exact same amount"], answer: 0, evidence: { "1_2": "Greater than means more", "3_4": "6 is greater than 4, so Sam has more blocks", "5_6": "6 is greater than 4, Sam has more blocks than Lia" } },
      { type: "inference", q: "Sam has 6 blocks and Omar has 6 blocks. What is true?", options: ["Sam has less than Omar", "Sam and Omar have an equal amount", "Omar has more than Sam"], answer: 1, evidence: { "1_2": "Sam and Omar have an equal amount", "3_4": "Sam and Omar have an equal amount", "5_6": "Sam and Omar each have 6 blocks, so their groups are equal" } }
    ]
  },
  {
    unit_id: "gk-math-u3",
    title: "Ana Adds Her Crayons",
    genre: "explanatory",
    texts: {
      "1_2": "Ana has 3 red crayons. She gets 2 blue crayons. We add to join the groups. 3 + 2 = 5. This is an equation. An equation is a number sentence with an equal sign. The total is 5. Total means how many altogether.",
      "3_4": "Ana has 3 red crayons. She gets 2 blue crayons. To add means to join groups to find the total. The total is how many there are altogether. We can write 3 + 2 = 5. This is an equation, which is a number sentence with an equal sign.",
      "5_6": "Ana has 3 red crayons, and then she gets 2 blue crayons. To find out how many she has now, she can add the two groups. Adding joins groups to find the total, which is how many there are altogether. She writes the equation 3 + 2 = 5, a number sentence with an equal sign. The total is 5 crayons."
    },
    questions: [
      { type: "detail", q: "How many blue crayons does Ana get?", options: ["Two", "Three", "Five"], answer: 0, evidence: { "1_2": "She gets 2 blue crayons", "3_4": "She gets 2 blue crayons", "5_6": "she gets 2 blue crayons" } },
      { type: "vocab", q: "What does “total” mean in this reading?", options: ["A kind of crayon", "How many there are altogether", "A sign that means take away"], answer: 1, evidence: { "1_2": "Total means how many altogether", "3_4": "The total is how many there are altogether", "5_6": "the total, which is how many there are altogether" } },
      { type: "inference", q: "Which equation shows Ana's crayons?", options: ["2 + 2 = 4", "3 + 3 = 6", "3 + 2 = 5"], answer: 2, evidence: { "1_2": "3 + 2 = 5", "3_4": "3 + 2 = 5", "5_6": "3 + 2 = 5" } }
    ]
  },
  {
    unit_id: "gk-math-u4",
    title: "Ben Gives Apples Away",
    genre: "explanatory",
    texts: {
      "1_2": "Ben has 8 apples. He gives 3 apples away. We subtract to take away part of a group. 8 - 3 = 5. The difference is 5. It is how many are left. We decompose 8 into 3 and 5. To decompose is to break a number into smaller parts.",
      "3_4": "Ben has 8 apples, and he gives 3 apples away. To subtract means to take away part of a group. We write 8 - 3 = 5. The difference is 5, which is how many are left. We can also decompose 8. To decompose is to break a number into smaller parts. We decompose 8 into 3 and 5.",
      "5_6": "Ben has 8 apples on the table, and he gives 3 apples away. To subtract is to take away part of a group, so he writes 8 - 3 = 5. The difference is 5, which tells how many apples are left. Ben can also decompose 8, which means to break a number into smaller parts. For example, he can decompose 8 into 3 and 5."
    },
    questions: [
      { type: "detail", q: "How many apples does Ben give away?", options: ["Five", "Three", "Eight"], answer: 1, evidence: { "1_2": "He gives 3 apples away", "3_4": "he gives 3 apples away", "5_6": "he gives 3 apples away" } },
      { type: "vocab", q: "What does “decompose” mean in this reading?", options: ["To put groups together", "To count by twos", "To break a number into smaller parts"], answer: 2, evidence: { "1_2": "To decompose is to break a number into smaller parts", "3_4": "To decompose is to break a number into smaller parts", "5_6": "to break a number into smaller parts" } },
      { type: "inference", q: "How can we decompose 8?", options: ["Into 3 and 5", "Into 4 and 5", "Into 2 and 7"], answer: 0, evidence: { "1_2": "We decompose 8 into 3 and 5", "3_4": "We decompose 8 into 3 and 5", "5_6": "decompose 8 into 3 and 5" } }
    ]
  },
  {
    unit_id: "gk-math-u5",
    title: "Jo Makes a Ten",
    genre: "explanatory",
    texts: {
      "1_2": "Jo has 14 stickers. A full group of 10 is a ten. The 4 left over are ones. Jo has 1 ten and 4 ones. We compose 14 from 1 ten and 4 ones. To compose is to put parts together to build a number.",
      "3_4": "Jo has 14 stickers. A ten is a full group of 10. Jo makes one full group, so she has 1 ten. The 4 stickers left over are ones. Jo has 1 ten and 4 ones. To compose is to put parts together to build a number. Jo can compose 14 from 1 ten and 4 ones.",
      "5_6": "Jo has 14 stickers. A ten is a full group of 10 ones. Jo fills one group, so she has 1 ten. The 4 stickers left over are single units called ones. To compose a number is to put parts together to build it. Jo can compose 14 from 1 ten and 4 ones. Teen numbers are made this way."
    },
    questions: [
      { type: "detail", q: "How many ones are in the number 14?", options: ["Ten", "One", "Four"], answer: 2, evidence: { "1_2": "1 ten and 4 ones", "3_4": "1 ten and 4 ones", "5_6": "1 ten and 4 ones" } },
      { type: "vocab", q: "What does “compose” mean in this reading?", options: ["Put parts together to build a number", "Take away part of a group", "Count by twos"], answer: 0, evidence: { "1_2": "To compose is to put parts together to build a number", "3_4": "To compose is to put parts together to build a number", "5_6": "To compose a number is to put parts together to build it" } },
      { type: "inference", q: "Jo composes 14. Which parts does she use?", options: ["2 tens and 4 ones", "1 ten and 4 ones", "1 ten and 14 ones"], answer: 1, evidence: { "1_2": "compose 14 from 1 ten and 4 ones", "3_4": "compose 14 from 1 ten and 4 ones", "5_6": "compose 14 from 1 ten and 4 ones" } }
    ]
  },
  {
    unit_id: "gk-math-u6",
    title: "Flat Shapes and Solid Shapes",
    genre: "explanatory",
    texts: {
      "1_2": "Shapes have attributes. An attribute is a feature like size, sides, or corners. A square has 4 sides and 4 corners. A square is flat. A flat shape is 2D, with no thickness. A ball is solid. A solid is a 3D shape you can hold.",
      "3_4": "Every shape has attributes. An attribute is a feature like size, sides, or corners. A square is a flat shape, which is a 2D shape with no thickness. A square has 4 sides and 4 corners. A ball is a solid shape. A solid is a 3D shape you can hold.",
      "5_6": "Shapes can be described by their attributes. An attribute is a feature such as size, sides, or corners. A square is a flat shape, meaning it is 2D and has no thickness, and it has 4 sides and 4 corners. A ball is a solid shape. A solid is a 3D shape that you can hold."
    },
    questions: [
      { type: "detail", q: "How many sides does a square have?", options: ["Four", "Three", "Five"], answer: 0, evidence: { "1_2": "4 sides and 4 corners", "3_4": "4 sides and 4 corners", "5_6": "4 sides and 4 corners" } },
      { type: "vocab", q: "What does “attribute” mean in this reading?", options: ["A very big toy", "A feature like size, sides, or corners", "A shape you can hold"], answer: 1, evidence: { "1_2": "An attribute is a feature like size, sides, or corners", "3_4": "An attribute is a feature like size, sides, or corners", "5_6": "An attribute is a feature such as size, sides, or corners" } },
      { type: "inference", q: "Why is a ball a solid shape?", options: ["It has no thickness", "It is a 2D shape", "It is a 3D shape you can hold"], answer: 2, evidence: { "1_2": "A solid is a 3D shape you can hold", "3_4": "A solid is a 3D shape you can hold", "5_6": "A solid is a 3D shape that you can hold" } }
    ]
  },
  {
    unit_id: "gk-sci-u1",
    title: "Weather Patterns in Baltimore",
    genre: "informational",
    texts: {
      "1_2": "Weather is what the sky and air are like outside. Temperature is how hot or cold something is. The sun warms the ground. In Baltimore, summer is hot and winter is cold. This happens every year. A pattern is something that repeats.",
      "3_4": "Weather is what the sky and air are like outside. Temperature tells how hot or cold something is. The sun warms the ground, so sunny days are often warmer. In Baltimore, summer is usually hot and winter is usually cold. This happens every year. A pattern is something that repeats.",
      "5_6": "Weather is what the sky and air are like outside, and temperature is how hot or cold something is. Sunlight warms the ground and the air, so sunny days are often warmer. In Baltimore, summer is usually hot and winter is usually cold. Because this happens every year, it is a weather pattern. A pattern is something that repeats."
    },
    questions: [
      { type: "detail", q: "What does the sun do to the ground?", options: ["It cools it", "It warms it", "It washes it"], answer: 1, evidence: { "1_2": "The sun warms the ground", "3_4": "The sun warms the ground", "5_6": "Sunlight warms the ground" } },
      { type: "vocab", q: "What does “pattern” mean in this reading?", options: ["A kind of cloud", "A cold wind", "Something that repeats"], answer: 2, evidence: { "1_2": "something that repeats", "3_4": "something that repeats", "5_6": "something that repeats" } },
      { type: "inference", q: "Baltimore has hot summers and cold winters every year. What is this?", options: ["A weather pattern", "A strong storm", "A kind of tool"], answer: 0, evidence: { "1_2": "summer is hot and winter is cold", "3_4": "summer is usually hot and winter is usually cold", "5_6": "summer is usually hot and winter is usually cold" } }
    ]
  },
  {
    unit_id: "gk-sci-u2",
    title: "Pushes and Pulls Make Things Move",
    genre: "explanatory",
    texts: {
      "1_2": "Motion is the act of moving. A push moves something away from you. A pull moves something closer to you. Kai gives a ball a push. Kai gives a wagon a pull. The wagon comes closer. A big push makes the ball go fast.",
      "3_4": "Motion is the act of moving. A push moves something away from you. A pull moves something closer to you. Kai gives a ball a push, so the ball rolls away. Then Kai gives a wagon a pull, so the wagon comes closer. A big push makes the ball go fast.",
      "5_6": "Motion is the act of moving. A push moves an object away from you, while a pull moves an object closer to you. When Kai gives a ball a push, the ball moves away. When she gives a wagon a pull, the wagon comes closer. The strength of a push matters too, because a big push makes the ball go fast."
    },
    questions: [
      { type: "detail", q: "What happens when Kai pulls the wagon?", options: ["It rolls away", "It stops forever", "It comes closer"], answer: 2, evidence: { "1_2": "The wagon comes closer", "3_4": "the wagon comes closer", "5_6": "the wagon comes closer" } },
      { type: "vocab", q: "What does “motion” mean in this reading?", options: ["The act of moving", "The act of sleeping", "The act of sitting still"], answer: 0, evidence: { "1_2": "Motion is the act of moving", "3_4": "Motion is the act of moving", "5_6": "Motion is the act of moving" } },
      { type: "inference", q: "Kai wants the ball to go faster. What should she do?", options: ["Pull it gently", "Give it a bigger push", "Leave it alone"], answer: 1, evidence: { "1_2": "A big push makes the ball go fast", "3_4": "A big push makes the ball go fast", "5_6": "a big push makes the ball go fast" } }
    ]
  },
  {
    unit_id: "gk-sci-u3",
    title: "A Frog's Home in the Pond",
    genre: "informational",
    texts: {
      "1_2": "A habitat is the natural home of a plant or animal. A pond is a habitat for a frog. A frog is living. Living things are alive and grow. They need food and water to survive. To survive is to stay alive.",
      "3_4": "A habitat is the natural home of a plant or animal. A pond is a habitat for a frog. A frog is a living thing, which means it is alive and grows. Living things need food and water to survive. To survive means to stay alive. A rock is not living, so it does not need food.",
      "5_6": "A habitat is the natural home of a plant or animal. A pond is a habitat for a frog, and the frog is a living thing because it is alive and grows. Living things need food and water to survive, which means to stay alive. A rock is not living, so it does not need food or water."
    },
    questions: [
      { type: "detail", q: "Which animal does the reading say lives in a pond habitat?", options: ["A frog", "A bear", "A horse"], answer: 0, evidence: { "1_2": "A pond is a habitat for a frog", "3_4": "A pond is a habitat for a frog", "5_6": "A pond is a habitat for a frog" } },
      { type: "vocab", q: "What does “survive” mean in this reading?", options: ["To get very tall", "To stay alive", "To make a sound"], answer: 1, evidence: { "1_2": "To survive is to stay alive", "3_4": "To survive means to stay alive", "5_6": "which means to stay alive" } },
      { type: "inference", q: "Frogs are living things. What do frogs need to survive?", options: ["Only rocks", "Only toys", "Food and water"], answer: 2, evidence: { "1_2": "need food and water to survive", "3_4": "need food and water to survive", "5_6": "need food and water to survive" } }
    ]
  },
  {
    unit_id: "gk-sci-u4",
    title: "Recycling Paper at Our School",
    genre: "explanatory",
    texts: {
      "1_2": "The environment is the land, water, and air around us. Trash can hurt the environment. Our class has too much paper trash. A solution is a way to fix a problem. We recycle paper. To recycle is to turn used materials into new things.",
      "3_4": "The environment is the land, water, and air around us. When people throw away too much trash, it can hurt the environment. Our class has too much paper trash. A solution is a way to fix a problem. One solution is to recycle paper. To recycle means to turn used materials into new things.",
      "5_6": "The environment is the land, water, and air around us, and people can change it. When we throw away too much trash, we can harm the environment. Our class has too much paper trash. A solution is a way to fix a problem, and one solution is to recycle paper. To recycle is to turn used materials into new things."
    },
    questions: [
      { type: "detail", q: "What does the class have too much of?", options: ["Plastic toys", "Paper trash", "Dirty water"], answer: 1, evidence: { "1_2": "too much paper trash", "3_4": "too much paper trash", "5_6": "too much paper trash" } },
      { type: "vocab", q: "What does “solution” mean in this reading?", options: ["A kind of trash", "A school rule", "A way to fix a problem"], answer: 2, evidence: { "1_2": "A solution is a way to fix a problem", "3_4": "A solution is a way to fix a problem", "5_6": "A solution is a way to fix a problem" } },
      { type: "inference", q: "Why is recycling paper a good solution?", options: ["It turns used paper into new things", "It adds more trash to the land", "It makes the air dirty"], answer: 0, evidence: { "1_2": "turn used materials into new things", "3_4": "turn used materials into new things", "5_6": "turn used materials into new things" } }
    ]
  },
  {
    unit_id: "gk-ss-u1",
    title: "Good Citizens Follow Rules",
    genre: "explanatory",
    texts: {
      "1_2": "A citizen is a member of a community. You are a citizen of your class. Rules keep us safe. A responsibility is a job you are expected to do. Your responsibility is to listen. Fair means treating everyone with respect. We take turns to be fair.",
      "3_4": "A citizen is a member of a community, like your class or your Baltimore neighborhood. Rules keep us safe. Every citizen has a responsibility, which is a job you are expected to do. Fair means treating everyone with respect. We take turns to be fair to each other.",
      "5_6": "A citizen is a member of a community, such as a classroom or a Baltimore neighborhood. Rules in these communities keep us safe. Every citizen also has a responsibility, which is a job you are expected to do. Being fair means treating everyone with respect and equality, so we take turns to be fair to everyone."
    },
    questions: [
      { type: "detail", q: "What do rules do?", options: ["Make us tired", "Make us late", "Keep us safe"], answer: 2, evidence: { "1_2": "keep us safe", "3_4": "keep us safe", "5_6": "keep us safe" } },
      { type: "vocab", q: "What does “citizen” mean in this reading?", options: ["A member of a community", "A kind of rule", "A job at school"], answer: 0, evidence: { "1_2": "A citizen is a member of a community", "3_4": "A citizen is a member of a community", "5_6": "A citizen is a member of a community" } },
      { type: "inference", q: "Why do students take turns?", options: ["To finish faster", "To be fair to everyone", "To get more time alone"], answer: 1, evidence: { "1_2": "take turns to be fair", "3_4": "take turns to be fair", "5_6": "take turns to be fair" } }
    ]
  },
  {
    unit_id: "gk-ss-u2",
    title: "Maps, Globes, and Symbols",
    genre: "informational",
    texts: {
      "1_2": "A map is a drawing of a place from above. A map has symbols. A symbol is a small picture that stands for something. A tree symbol can stand for a park. A globe is a round model of Earth. A globe shows land and water.",
      "3_4": "A map is a drawing of a place from above. Maps use symbols to show where things are. A symbol is a small picture that stands for something. A tree symbol can stand for a park. A globe is a round model of Earth. A globe shows land and water.",
      "5_6": "A map is a drawing of a place as if you looked down from above. Maps use symbols, which are small pictures that stand for something, so a tree symbol can stand for a park. Students can use a map to find their school and their neighborhood in Baltimore. A globe is a round model of Earth, and a globe shows land and water."
    },
    questions: [
      { type: "detail", q: "What does a globe show?", options: ["Land and water", "Only food", "Only cars"], answer: 0, evidence: { "1_2": "A globe shows land and water", "3_4": "A globe shows land and water", "5_6": "a globe shows land and water" } },
      { type: "vocab", q: "What does “symbol” mean in this reading?", options: ["A big round ball", "A small picture that stands for something", "A path to school"], answer: 1, evidence: { "1_2": "A symbol is a small picture that stands for something", "3_4": "A symbol is a small picture that stands for something", "5_6": "small pictures that stand for something" } },
      { type: "inference", q: "A map shows a tree symbol. What might it mean?", options: ["A school", "A river", "A park"], answer: 2, evidence: { "1_2": "A tree symbol can stand for a park", "3_4": "A tree symbol can stand for a park", "5_6": "a tree symbol can stand for a park" } }
    ]
  },
  {
    unit_id: "gk-ss-u3",
    title: "Ben's Family Tradition",
    genre: "narrative",
    texts: {
      "1_2": "A tradition is a special custom a family repeats. Each year, Ben's family bakes bread. That is a tradition. A timeline is a line that shows events in order. Ben can put the baking on a timeline. A community is a group of people living and working together.",
      "3_4": "A tradition is a special custom a family repeats. Each year, Ben's family bakes bread together, and that is a tradition. A timeline is a line that shows events in order. Ben can put the baking on a timeline. A community is a group of people living and working together, like a neighborhood.",
      "5_6": "A tradition is a special custom that a family repeats. Each year, Ben's family bakes bread together, which is a family tradition. A timeline is a line showing events in order, and Ben can place the baking on a timeline with other events in his life. A community is a group of people living and working together, such as a neighborhood."
    },
    questions: [
      { type: "detail", q: "What does Ben's family bake each year?", options: ["Cake", "Bread", "Pie"], answer: 1, evidence: { "1_2": "Ben's family bakes bread", "3_4": "Ben's family bakes bread", "5_6": "Ben's family bakes bread" } },
      { type: "vocab", q: "What does “community” mean in this reading?", options: ["A line with dates", "A special family meal", "A group of people living and working together"], answer: 2, evidence: { "1_2": "A community is a group of people living and working together", "3_4": "A community is a group of people living and working together", "5_6": "A community is a group of people living and working together" } },
      { type: "inference", q: "Ben's family bakes bread every year. What is this?", options: ["A tradition", "A timeline", "A community"], answer: 0, evidence: { "1_2": "A tradition is a special custom a family repeats", "3_4": "A tradition is a special custom a family repeats", "5_6": "A tradition is a special custom that a family repeats" } }
    ]
  },
  {
    unit_id: "gk-ss-u4",
    title: "Needs, Wants, and Helpful Jobs",
    genre: "informational",
    texts: {
      "1_2": "Needs are things people must have to live. People need food and water. Wants are things people would like to have. A toy is a want. A service is work done to help others. A bus driver does a service. A bus driver gives rides in Baltimore.",
      "3_4": "Needs are things people must have to live, such as food and water. Wants are things people would like to have, such as a toy. A service is work done to help others. In Baltimore, a bus driver does a service by giving people rides.",
      "5_6": "Needs are things people must have to live, such as food and water, while wants are things people would like to have, such as a toy. A service is work done to help others. In Baltimore, workers in many jobs provide services for their neighbors. For example, a bus driver does a service by giving people rides."
    },
    questions: [
      { type: "detail", q: "Which one is a need?", options: ["A toy", "A game", "Food and water"], answer: 2, evidence: { "1_2": "People need food and water", "3_4": "such as food and water", "5_6": "such as food and water" } },
      { type: "vocab", q: "What does “needs” mean in this reading?", options: ["Things people must have to live", "Things people would like to have", "Work done to help others"], answer: 0, evidence: { "1_2": "Needs are things people must have to live", "3_4": "Needs are things people must have to live", "5_6": "Needs are things people must have to live" } },
      { type: "inference", q: "A bus driver gives people rides. What kind of work is this?", options: ["A want", "A service", "A toy"], answer: 1, evidence: { "1_2": "A bus driver does a service", "3_4": "a bus driver does a service", "5_6": "a bus driver does a service" } }
    ]
  }
];

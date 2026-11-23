// Grade 5 health: reading a Nutrition Facts label and making a food choice. Original text; pictures are drawn from the invented
// Crunchy Oat Rounds label in data/kits/c8-nutrition-labels.js.
import {
  BOWLS,
  INGREDIENTS,
  NUTRIENT_FOODS,
  SNACK_A,
  labelVisual,
  miniCard,
} from "../kits/c8-nutrition-labels.js";

const T = "Nutrition Facts";
const common = { domains: ["Reading", "Speaking"], klu: "Explain", tier: 2 };

export default {
  id: "g5-health-pe-nutrition-labels-and-choices",
  title: "Nutrition Labels and Choices: Key Words",
  grade: "5",
  band: "3-5",
  subject: "health-pe",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the National Health Education Standards on health information and decision-making; not mapped to a district unit sequence.",
  },
  standards: ["NHES.1", "NHES.3", "NHES.5"],
  entries: [
    {
      id: "nutrition-label",
      word: "Nutrition Facts label",
      pos: "noun phrase",
      pron: "noo-TRISH-un FAKTS LAY-bul",
      def: "A box on a food package that tells what is in one serving of the food.",
      visual: labelVisual(SNACK_A),
      context: "I read the Nutrition Facts label before I chose a snack.",
      nonExample:
        "The picture on the front of the box is not the Nutrition Facts label. The label is the black and white box with numbers.",
      academicSentence:
        "A Nutrition Facts label gives information about one serving so people can compare foods.",
      everyday:
        "Like a report card for a food: it lists facts, and you decide what to do with them.",
      misconception:
        "The label does not say a food is good or bad. It gives facts that help you decide.",
      related: ["serving-size", "calorie", "percent-daily-value"],
      practice: {
        visualPrompt: "Which part of the package is the Nutrition Facts label?",
        speakWrite:
          "Tell a partner one fact you can find on a Nutrition Facts label. Then write it.",
        retrieval: "Yesterday we read a food package. Which box lists facts about one serving?",
      },
      ...common,
    },
    {
      id: "serving-size",
      word: "serving size",
      pos: "noun phrase",
      pron: "SUR-ving SIZE",
      def: "The amount of food that all the numbers on the label are about.",
      visual: miniCard(
        T,
        [
          ["6 servings per container", "", false],
          ["Serving size", "1 cup (40g)", true],
        ],
        1,
        "A piece of a Nutrition Facts label. The line that says Serving size 1 cup (40g) is highlighted.",
      ),
      context: "The serving size is 1 cup, so the calories on the label are for 1 cup.",
      nonExample:
        "A serving size is not the amount you have to eat. You can eat more or less than one serving.",
      academicSentence:
        "All the numbers on a label are for one serving size, not for the whole package.",
      everyday: "Like one scoop on a cone: the numbers are for that one scoop.",
      misconception:
        "Students think the numbers are for the whole package. They are for one serving unless the label says otherwise.",
      morphology: {
        parts: [
          { part: "serv-", meaning: "to give or hand out" },
          { part: "-ing", meaning: "an amount handed out" },
        ],
      },
      related: ["servings-per-container", "portion"],
      practice: {
        visualPrompt: "Which line shows the serving size?",
        speakWrite:
          "Say the serving size on a snack label you know. Then write: One serving is ___.",
        retrieval: "The calories on a label are for how much food?",
      },
      ...common,
    },
    {
      id: "servings-per-container",
      word: "servings per container",
      pos: "noun phrase",
      pron: "SUR-vingz per kun-TAY-ner",
      def: "How many servings are in the whole package.",
      visual: miniCard(
        T,
        [
          ["6 servings per container", "", true],
          ["Serving size", "1 cup (40g)", false],
        ],
        0,
        "A piece of a Nutrition Facts label. The line that says 6 servings per container is highlighted.",
      ),
      context: "There are 6 servings per container, so the box has 6 cups of cereal.",
      nonExample:
        "Servings per container is not the number of calories. It counts how many servings are in the package.",
      academicSentence:
        "To find the whole package, multiply the amount in one serving by the servings per container.",
      everyday: "Like counting how many cookies are in a sleeve when each person gets 2.",
      misconception:
        "Per means for each. Servings per container tells how many servings there are in each container.",
      morphology: { parts: [{ part: "per", meaning: "for each" }] },
      related: ["serving-size", "portion"],
      practice: {
        visualPrompt: "Which line shows how many servings are in the package?",
        speakWrite: "Say: This package has ___ servings. Then write the sentence.",
        retrieval: "Which part of the label tells you how many servings are in the whole package?",
      },
      ...common,
    },
    {
      id: "calorie",
      word: "calorie",
      pos: "noun",
      pron: "KAL-uh-ree",
      def: "A unit that measures the energy in food. Your body uses energy to move, think and grow.",
      visual: miniCard(
        T,
        [
          ["Amount per serving", "", false],
          ["Calories", "150", true],
        ],
        1,
        "A piece of a Nutrition Facts label. The line that says Calories 150 is highlighted.",
      ),
      context: "One serving has 150 calories, so two servings have 300 calories.",
      nonExample:
        "Calories are not weight or grams. Grams measure how much food there is; calories measure energy.",
      academicSentence: "Calories on a label tell how much energy one serving gives.",
      everyday: "Like the fuel in a car: your body needs it to go.",
      misconception:
        "Calories are not bad. Everyone needs energy; the label helps you compare foods.",
      related: ["serving-size", "nutrient"],
      practice: {
        visualPrompt: "Which line shows the calories?",
        speakWrite:
          "Tell a partner how many calories are in one serving of the snack on the card. Write the number with the word calories.",
        retrieval: "What does the word calories measure?",
      },
      ...common,
    },
    {
      id: "percent-daily-value",
      word: "% Daily Value",
      pos: "noun phrase",
      pron: "per-SENT DAY-lee VAL-yoo",
      def: "How much of a day's need for a nutrient one serving gives you. 5% or less is low and 20% or more is high.",
      visual: miniCard(
        T,
        [
          ["Nutrient", "% Daily Value*", true],
          ["Sodium 190mg", "8%", false],
          ["Dietary Fiber 4g", "14%", false],
        ],
        0,
        "A piece of a Nutrition Facts label. The column heading % Daily Value is highlighted above 8 percent for sodium and 14 percent for fiber.",
      ),
      context:
        "The label says 8% Daily Value for sodium, so one serving gives a little of what a person should have in a day.",
      nonExample:
        "A % Daily Value is not the percent of the food that is that nutrient. It compares one serving to a whole day.",
      academicSentence:
        "The % Daily Value shows if a serving is low, medium or high in a nutrient.",
      everyday: "Like a savings goal bar: it shows how much of the day's amount one serving fills.",
      misconception:
        "A high % Daily Value is good for fiber and calcium, but not for added sugars and sodium. Check which kind of nutrient it is.",
      related: ["nutrient", "sodium", "dietary-fiber"],
      practice: {
        visualPrompt: "Which column shows the % Daily Value?",
        speakWrite: "Say: A % Daily Value of 20% or more is ___. Then write the sentence.",
        retrieval: "Is 5% Daily Value low or high?",
      },
      ...common,
      tier: 3,
    },
    {
      id: "nutrient",
      word: "nutrient",
      pos: "noun",
      pron: "NOO-tree-unt",
      def: "A substance in food that your body needs to grow and work, such as protein or calcium.",
      visual: NUTRIENT_FOODS,
      context: "Milk has the nutrient calcium, which helps build strong bones.",
      nonExample:
        "A toy is not a nutrient. A nutrient is something in food that your body uses.",
      academicSentence: "Foods give your body different nutrients.",
      everyday: "Like the building blocks your body picks out of lunch.",
      misconception:
        "Nutrients are not only vitamins. Protein, carbohydrate and fiber are nutrients too.",
      morphology: { parts: [{ part: "nutri-", meaning: "to feed" }] },
      related: ["dietary-fiber", "calorie"],
      practice: {
        visualPrompt: "Which food is shown with the nutrient calcium?",
        speakWrite: "Name a food and one nutrient it gives you. Write: ___ has ___.",
        retrieval: "What is a nutrient? Name one.",
      },
      ...common,
    },
    {
      id: "sodium",
      word: "sodium",
      pos: "noun",
      pron: "SOH-dee-um",
      def: "A part of salt. Your body needs a little, but many packaged foods have a lot.",
      visual: miniCard(
        T,
        [
          ["Total Fat 2g", "3%", false],
          ["Sodium 190mg", "8%", true],
          ["Total Carbohydrate 32g", "12%", false],
        ],
        1,
        "A piece of a Nutrition Facts label. The line that says Sodium 190mg 8 percent is highlighted.",
      ),
      context: "The crackers have 280 milligrams of sodium, so they taste salty.",
      nonExample:
        "Sodium is not sugar. Sodium is a part of salt; sugar is listed on a different line.",
      academicSentence: "Many labels list sodium because too much can be a problem for health.",
      everyday: "Like the salt you can taste in pretzels and chips.",
      misconception:
        "Foods that do not taste salty can still have a lot of sodium. Read the label.",
      related: ["percent-daily-value", "nutrient"],
      practice: {
        visualPrompt: "Which line shows sodium?",
        speakWrite:
          "Tell a partner one food that may have a lot of sodium. Write: ___ may have a lot of sodium.",
        retrieval: "Which line on the label is a part of salt?",
      },
      ...common,
    },
    {
      id: "saturated-fat",
      word: "saturated fat",
      pos: "noun phrase",
      pron: "SACH-uh-ray-tid FAT",
      def: "A kind of fat found in foods like butter and cheese. Health guidelines say to get less of it.",
      visual: miniCard(
        T,
        [
          ["Total Fat 2g", "3%", false],
          ["Saturated Fat 0g", "0%", true],
          ["Sodium 190mg", "8%", false],
        ],
        1,
        "A piece of a Nutrition Facts label. The line that says Saturated Fat 0g 0 percent is highlighted under Total Fat.",
      ),
      context: "The oat cereal has 0 grams of saturated fat, so its % Daily Value is 0%.",
      nonExample:
        "Saturated fat is not the same as total fat. It is one kind of fat listed under total fat.",
      academicSentence: "Saturated fat is listed under total fat, with its own % Daily Value.",
      everyday: "Like the kind of fat that gets hard in a cold fridge, such as butter.",
      misconception:
        "Not all fat is the same. The label lists saturated fat separately because health guidelines say to get less of it.",
      related: ["percent-daily-value", "nutrient"],
      practice: {
        visualPrompt: "Which line shows saturated fat?",
        speakWrite: "Say: Saturated fat is listed under ___. Then write the sentence.",
        retrieval: "Which kind of fat do health guidelines say to get less of?",
      },
      ...common,
      tier: 3,
    },
    {
      id: "dietary-fiber",
      word: "dietary fiber",
      pos: "noun phrase",
      pron: "DY-uh-tehr-ee FY-ber",
      def: "A nutrient from plant foods like oats, beans and fruit that helps your body digest food. Most people need more.",
      visual: miniCard(
        T,
        [
          ["Total Carbohydrate 32g", "12%", false],
          ["Dietary Fiber 4g", "14%", true],
          ["Total Sugars 6g", "", false],
        ],
        1,
        "A piece of a Nutrition Facts label. The line that says Dietary Fiber 4g 14 percent is highlighted under Total Carbohydrate.",
      ),
      context: "The oat cereal has 4 grams of dietary fiber, which is 14% of a day's need.",
      nonExample:
        "Fiber is not sugar. Both are listed under carbohydrate, but they are different lines.",
      academicSentence: "Foods with dietary fiber help you feel full and keep digestion working.",
      everyday: "Like the part of an apple that makes it crunchy.",
      misconception: "A higher % Daily Value is a good sign for fiber, but not for added sugars.",
      related: ["nutrient", "percent-daily-value"],
      practice: {
        visualPrompt: "Which line shows dietary fiber?",
        speakWrite: "Name a food that has fiber. Write: ___ has fiber.",
        retrieval: "Does the label say to get more or less of dietary fiber?",
      },
      ...common,
    },
    {
      id: "added-sugars",
      word: "added sugars",
      pos: "noun phrase",
      pron: "AD-id SHUG-erz",
      def: "Sugar or syrup the maker puts in while making the food. It is listed on its own line.",
      visual: miniCard(
        T,
        [
          ["Total Sugars 6g", "", false],
          ["Includes 5g Added Sugars", "10%", true],
          ["Protein 4g", "", false],
        ],
        1,
        "A piece of a Nutrition Facts label. The line that says Includes 5g Added Sugars 10 percent is highlighted under Total Sugars.",
      ),
      context:
        "The label says Includes 5g Added Sugars, so 5 of the 6 grams of sugar were put in by the maker.",
      nonExample: "The sugar in a plain apple is not added sugar. It is already in the fruit.",
      academicSentence:
        "Added sugars are listed separately so people can see what the maker put in.",
      everyday: "Like the sugar stirred into lemonade, not the sugar that is already in the lemon.",
      misconception:
        "Total sugars and added sugars are not the same. Total sugars includes sugar that is already in the food, and added sugars is part of it.",
      morphology: { parts: [{ part: "added", meaning: "put in" }] },
      related: ["percent-daily-value", "nutrient"],
      practice: {
        visualPrompt: "Which line shows the sugar the maker put in?",
        speakWrite: "Say: Added sugars are sugars that ___. Then write the sentence.",
        retrieval: "What is the difference between total sugars and added sugars?",
      },
      ...common,
      tier: 3,
    },
    {
      id: "ingredient",
      word: "ingredient",
      pos: "noun",
      pron: "in-GREE-dee-unt",
      def: "One of the things a food is made from. The list on the package starts with the one there is most of.",
      visual: INGREDIENTS,
      context:
        "The first ingredient is whole grain oats, so there is more oats than anything else.",
      nonExample:
        "An ingredient is not a nutrient. Oats are an ingredient; fiber is a nutrient in the oats.",
      academicSentence: "Ingredients are listed in order from the most to the least.",
      everyday: "Like the list of what goes into a recipe.",
      misconception:
        "The ingredient list is not the Nutrition Facts label. It is a separate list of what is in the food.",
      related: ["nutrient", "nutrition-label"],
      practice: {
        visualPrompt: "Which ingredient is listed first?",
        speakWrite: "Read the first ingredient on a package. Write: The first ingredient is ___.",
        retrieval: "In what order are ingredients listed?",
      },
      ...common,
    },
    {
      id: "portion",
      word: "portion",
      pos: "noun",
      pron: "POR-shun",
      def: "The amount of food you choose to eat. It may be more or less than one serving.",
      visual: BOWLS,
      context: "My portion was two servings, so I multiplied the calories by two.",
      nonExample:
        "A portion is not the same as a serving size. A serving size is printed on the label; a portion is what you put on your plate.",
      academicSentence:
        "If your portion is bigger than the serving size, the numbers on the label grow too.",
      everyday: "Like how many scoops you put in your own bowl.",
      misconception:
        "People think a portion and a serving are the same. A serving is a measure on the label; a portion is what you eat.",
      related: ["serving-size", "servings-per-container"],
      practice: {
        visualPrompt: "Which bowl shows a portion of two servings?",
        speakWrite:
          "Tell a partner how many servings are in a portion of two cups when one serving is one cup. Write the number.",
        retrieval: "How is a portion different from a serving size?",
      },
      ...common,
    },
  ],
  review: { status: "authored", checks: {} },
};

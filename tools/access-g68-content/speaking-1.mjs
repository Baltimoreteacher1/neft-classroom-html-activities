// Grades 6-8 publisher pass, Speaking batch 1 (sample). Original EduWonderLab prompts.
export default [
  {
    id: "s-c-unit-price-table",
    level: "C",
    gw: "g67-task",
    strand: "Explain with data",
    title: "Which Store Has the Better Price?",
    skill: "Comparing unit prices from a table and explaining which is the better buy",
    dir: "Look at the table of three juice deals. Plan your answer, then record yourself explaining which store has the best price per bottle.",
    q: "Your friend wants to buy juice. Use the table to explain which store has the best price per bottle and how you found each unit price.",
    table: {
      caption: "Juice deals",
      headers: ["Store", "Bottles", "Total price"],
      rows: [
        ["Corner Market", "4", "$6.00"],
        ["Fresh Mart", "6", "$8.40"],
        ["Value Club", "10", "$13.00"],
      ],
    },
    focus: [
      "each unit price (price for one bottle)",
      "a comparison word such as less than or the lowest",
      "a division sentence that shows how you found it",
      "a clear recommendation",
    ],
    models: {
      A: "Value Club is best. It costs $1.30 for one bottle. Corner Market costs $1.50.",
      B: "I divided the total price by the number of bottles. Corner Market is $1.50 per bottle, Fresh Mart is $1.40, and Value Club is $1.30. Value Club has the lowest unit price, so it is the best buy.",
      C: "To compare the stores fairly, I found the unit price at each one by dividing the total price by the number of bottles. Corner Market costs six dollars for four bottles, which is $1.50 per bottle. Fresh Mart costs $8.40 for six bottles, which is $1.40. Value Club costs $13.00 for ten bottles, which is $1.30. Since $1.30 is less than $1.40 and $1.50, Value Club is the best buy per bottle.",
    },
    criteria: [
      "I said the unit price for all three stores.",
      "I explained how I found a unit price by dividing.",
      "I used a comparison word and ended with a clear recommendation.",
    ],
    vocab: [
      ["unit price", "the price for one item", "precio unitario: el precio de un solo artículo"],
      ["divide", "to split into equal groups", "dividir: separar en grupos iguales"],
      [
        "compare",
        "to look at how things are alike or different",
        "comparar: ver en qué se parecen o se diferencian",
      ],
    ],
    frames: [
      "To find the unit price, I divided ___ by ___.",
      "___ costs ___ per bottle, which is less than ___.",
      "The best buy is ___ because ___.",
    ],
    wida: ["Explain: justify a choice with data", "Use comparison language for math reasoning"],
    es: [
      "Comparar precios unitarios con una tabla y explicar cuál es la mejor compra",
      "Mira la tabla de tres ofertas de jugo. Planea tu respuesta y luego grábate explicando qué tienda tiene el mejor precio por botella.",
    ],
    correct:
      "Strong explanation. You named a unit price for every store and used division to show how you found it.",
    hint: "Divide the total price by the number of bottles for one store at a time, then compare the three answers.",
  },
];

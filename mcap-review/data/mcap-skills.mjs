// ── MCAP Grade 6 skill catalog ───────────────────────────────────────────────
// Single source of truth for the MCAP review-packet series. Each domain holds a
// list of skills; each skill drives one downloadable DOCX + HTML study packet
// (guided notes → worked example → guided practice → independent practice →
// MCAP-style items → answer key). Content is math-verified, Grade-6 aligned,
// and ESOL-aware (plain language, no "ESOL" labels).
//
// Consumed by scripts/generate-mcap-packets.mjs.

export const DOMAINS = [
  {
    domain: "RP",
    domainTitle: "Ratios & Proportional Relationships",
    slug: "ratios-proportional-relationships",
    icon: "⚖️",
    color: "1FA6A2",
    skills: [
      {
        code: "6.RP.A.1",
        title: "Understand Ratio Concepts & Language",
        icon: "⚖️",
        summary: "Learn what a ratio is and how to describe a relationship between two amounts using ratio language.",
        vocab: [
          { term: "ratio", def: "A way to compare two amounts. Example: 3 cats to 2 dogs." },
          { term: "term", def: "One of the two numbers being compared in a ratio." },
          { term: "part-to-part", def: "A ratio that compares one group to another group, like boys to girls." },
          { term: "part-to-whole", def: "A ratio that compares one group to the total, like boys to all students." }
        ],
        needToKnow: [
          "A ratio compares two amounts. You can write it 3 ways: 3 to 2, 3:2, or 3/2.",
          "Order matters. The ratio 3:2 is not the same as 2:3.",
          "Part-to-part compares two groups (red marbles to blue marbles).",
          "Part-to-whole compares one group to the total (red marbles to all marbles).",
          "If there are 4 red and 5 blue marbles, there are 9 in all. Red to total is 4:9.",
          "Always include the units or labels when you describe a ratio in words."
        ],
        workedExample: {
          problem: "A fruit bowl has 6 apples and 4 oranges. Write the ratio of apples to oranges, and the ratio of apples to all fruit.",
          steps: [
            "Count each group: 6 apples and 4 oranges.",
            "Apples to oranges is a part-to-part ratio: 6 to 4, or 6:4.",
            "Find the total: 6 + 4 = 10 pieces of fruit.",
            "Apples to all fruit is a part-to-whole ratio: 6 to 10, or 6:10."
          ],
          answer: "Apples to oranges = 6:4. Apples to all fruit = 6:10."
        },
        guided: [
          { problem: "A team has 7 forwards and 5 defenders. Write the ratio of forwards to defenders.", hint: "Write the first amount first. Forwards come first.", answer: "7:5" },
          { problem: "A box has 3 red pens and 8 blue pens. Write the ratio of red pens to all pens.", hint: "Add to get the total first: 3 + 8.", answer: "3:11" },
          { problem: "In a class there are 9 boys and 12 girls. Write the ratio of girls to boys.", hint: "Girls come first, so write 12 first.", answer: "12:9" }
        ],
        independent: [
          { problem: "A garden has 5 roses and 8 tulips. Write the ratio of roses to tulips.", answer: "5:8" },
          { problem: "A snack mix has 10 peanuts and 6 raisins. Write the ratio of raisins to peanuts.", answer: "6:10" },
          { problem: "A bag has 4 green and 7 yellow markers. Write the ratio of green markers to all markers.", answer: "4:11" },
          { problem: "A parking lot has 15 cars and 5 trucks. Write the ratio of trucks to all vehicles.", answer: "5:20" },
          { problem: "True or false: the ratio 2:5 means the same thing as 5:2.", answer: "False (order matters)" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A tank has 8 goldfish and 3 guppies. What is the ratio of guppies to goldfish?", choices: ["8:3", "3:8", "3:11", "8:11"], answer: "B", why: "Guppies come first (3), then goldfish (8)." },
          { type: "multiple-choice", prompt: "A choir has 6 sopranos and 9 altos. Which statement is correct?", choices: ["Sopranos to total is 6:9", "Altos to total is 9:15", "Sopranos to altos is 9:6", "Total is 9 singers"], answer: "B", why: "Total is 6+9=15, so altos to total is 9:15." },
          { type: "short", prompt: "A bowl has 5 limes and 7 lemons. Write the ratio of lemons to limes using a colon.", answer: "7:5", why: "Lemons (7) first, then limes (5)." }
        ]
      },
      {
        code: "6.RP.A.2",
        title: "Understand Unit Rate",
        icon: "🏷️",
        summary: "Learn that a unit rate tells how much of one thing goes with exactly 1 of another thing.",
        vocab: [
          { term: "rate", def: "A ratio that compares two different kinds of amounts, like miles and hours." },
          { term: "unit rate", def: "A rate for exactly 1 unit, like miles per 1 hour." },
          { term: "per", def: "A word that means 'for each 1.' Example: $3 per pound." }
        ],
        needToKnow: [
          "A rate compares two different units, like dollars and pounds.",
          "A unit rate has a 1 as the second amount. Example: 60 miles per 1 hour.",
          "For the ratio a:b, the unit rate is a divided by b.",
          "To find a unit rate, divide the top amount by the bottom amount.",
          "The word 'per' is a clue that you need a unit rate.",
          "Example: 12 cookies for 4 kids is 3 cookies per kid."
        ],
        workedExample: {
          problem: "A car travels 210 miles in 3 hours at a steady speed. What is the unit rate in miles per hour?",
          steps: [
            "Write the rate: 210 miles to 3 hours.",
            "A unit rate is 'per 1 hour,' so divide miles by hours.",
            "210 ÷ 3 = 70."
          ],
          answer: "70 miles per hour"
        },
        guided: [
          { problem: "8 muffins cost $4. What is the unit rate (cost per muffin)?", hint: "Divide the dollars by the number of muffins: 4 ÷ 8.", answer: "$0.50 per muffin" },
          { problem: "A printer makes 90 pages in 6 minutes. How many pages per minute?", hint: "Divide pages by minutes: 90 ÷ 6.", answer: "15 pages per minute" },
          { problem: "A runner goes 12 km in 4 hours. What is the unit rate in km per hour?", hint: "Divide km by hours: 12 ÷ 4.", answer: "3 km per hour" }
        ],
        independent: [
          { problem: "15 apples cost $5. What is the cost per apple?", answer: "$0.33 per apple (or $1 for every 3 apples)" },
          { problem: "A faucet fills 24 liters in 8 minutes. How many liters per minute?", answer: "3 liters per minute" },
          { problem: "A typist types 180 words in 3 minutes. Words per minute?", answer: "60 words per minute" },
          { problem: "5 notebooks cost $7.50. What is the cost per notebook?", answer: "$1.50 per notebook" },
          { problem: "A plane flies 1,200 miles in 4 hours. Miles per hour?", answer: "300 miles per hour" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A store sells 3 pounds of grapes for $7.50. What is the unit price per pound?", choices: ["$2.00", "$2.50", "$3.00", "$22.50"], answer: "B", why: "$7.50 ÷ 3 = $2.50 per pound." },
          { type: "multiple-choice", prompt: "Which situation has a unit rate of 4 per 1?", choices: ["8 pens for 4 boxes", "4 pens for 8 boxes", "12 pens for 4 boxes", "4 pens for 4 boxes"], answer: "C", why: "12 ÷ 4 = 4 pens per box." },
          { type: "short", prompt: "A bus travels 150 miles in 5 hours at a steady speed. Fill in: the unit rate is ____ miles per hour.", answer: "30", why: "150 ÷ 5 = 30 miles per hour." }
        ]
      },
      {
        code: "6.RP.A.3a",
        title: "Ratio Tables & Equivalent Ratios",
        icon: "📊",
        summary: "Make tables of equivalent ratios and use them to compare and find missing values.",
        vocab: [
          { term: "equivalent ratios", def: "Ratios that show the same comparison, like 2:3 and 4:6." },
          { term: "ratio table", def: "A table that lists equivalent ratios in rows or columns." },
          { term: "scale", def: "To multiply or divide both terms of a ratio by the same number." }
        ],
        needToKnow: [
          "Equivalent ratios show the same relationship. 1:2 = 2:4 = 3:6.",
          "To make an equivalent ratio, multiply OR divide both terms by the same number.",
          "Never add the same number to both terms — that changes the ratio.",
          "A ratio table helps you see a pattern and find missing values.",
          "You can multiply a whole column or row by the same number to fill a table.",
          "To compare two ratios, scale them to a matching term."
        ],
        workedExample: {
          problem: "A recipe uses 2 cups of flour for every 3 eggs. Complete the ratio table for 6 cups of flour. How many eggs are needed?",
          steps: [
            "Find how flour changed: 2 cups became 6 cups, so multiply by 3.",
            "Whatever you do to flour, do to eggs. Multiply eggs by 3 too.",
            "3 eggs × 3 = 9 eggs."
          ],
          answer: "9 eggs (the ratio 2:3 scales to 6:9)"
        },
        guided: [
          { problem: "The ratio of dogs to cats is 3:4. If there are 12 dogs, how many cats?", hint: "3 became 12, so multiply by 4. Do the same to 4.", answer: "16 cats" },
          { problem: "Pencils to erasers is 5:2. If there are 6 erasers, how many pencils?", hint: "2 became 6, so multiply by 3. Do the same to 5.", answer: "15 pencils" },
          { problem: "Is the ratio 4:6 equivalent to 6:9? Explain by scaling.", hint: "Simplify both. Divide each by their common factor.", answer: "Yes, both simplify to 2:3" }
        ],
        independent: [
          { problem: "The ratio of red to blue tiles is 2:5. If there are 10 red tiles, how many blue tiles?", answer: "25 blue tiles" },
          { problem: "A mix uses 3 cups water to 1 cup mix. For 9 cups of water, how many cups of mix?", answer: "3 cups of mix" },
          { problem: "Fill the table: 4:7, 8:?, 12:?. Find the two missing numbers.", answer: "14 and 21" },
          { problem: "Is 6:8 equivalent to 9:12? Answer yes or no.", answer: "Yes (both simplify to 3:4)" },
          { problem: "Stickers to students is 7:3. For 21 stickers, how many students?", answer: "9 students" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which ratio is equivalent to 3:5?", choices: ["5:3", "6:8", "9:15", "8:10"], answer: "C", why: "Multiply both terms of 3:5 by 3 to get 9:15." },
          { type: "multiple-choice", prompt: "A ratio table shows 2:6, 4:12, 6:?. What is the missing number?", choices: ["14", "16", "18", "20"], answer: "C", why: "The ratio is 1:3, so 6 × 3 = 18." },
          { type: "short", prompt: "The ratio of teachers to students is 1:18. Fill in: 4 teachers go with ____ students.", answer: "72", why: "18 × 4 = 72 students." }
        ]
      },
      {
        code: "6.RP.A.3b",
        title: "Solve Unit-Rate Problems",
        icon: "🚗",
        summary: "Use unit rates to solve real problems about speed, price, and steady amounts.",
        vocab: [
          { term: "constant speed", def: "A speed that stays the same the whole time." },
          { term: "unit price", def: "The cost of exactly 1 item or 1 unit." },
          { term: "total", def: "The full amount you get after combining all the units." }
        ],
        needToKnow: [
          "First find the unit rate, then multiply to get a bigger amount.",
          "Distance = speed × time when speed stays constant.",
          "To find the better deal, compare the unit prices (cost per 1).",
          "At a steady rate, you can scale up or down to any amount.",
          "Example: if 1 hour = 50 miles, then 4 hours = 50 × 4 = 200 miles.",
          "Lining up the unit (per 1) makes multiplying easy."
        ],
        workedExample: {
          problem: "A train travels at a constant speed of 60 miles per hour. How far does it travel in 4.5 hours?",
          steps: [
            "The unit rate is 60 miles in 1 hour.",
            "Multiply the unit rate by the number of hours: 60 × 4.5.",
            "60 × 4.5 = 270."
          ],
          answer: "270 miles"
        },
        guided: [
          { problem: "Oranges cost $0.40 each. How much do 7 oranges cost?", hint: "Multiply the unit price by the number of oranges: 0.40 × 7.", answer: "$2.80" },
          { problem: "A walker moves at 3 miles per hour. How far in 2.5 hours?", hint: "Multiply 3 by 2.5.", answer: "7.5 miles" },
          { problem: "Store A: 6 pens for $3.00. Store B: 10 pens for $4.50. Which is cheaper per pen?", hint: "Find each unit price: 3.00 ÷ 6 and 4.50 ÷ 10.", answer: "Store B ($0.45 per pen vs $0.50 per pen)" }
        ],
        independent: [
          { problem: "A car goes 55 miles per hour. How far in 3 hours?", answer: "165 miles" },
          { problem: "Bananas cost $0.25 each. How much for 12 bananas?", answer: "$3.00" },
          { problem: "A pump moves 8 gallons per minute. How many gallons in 15 minutes?", answer: "120 gallons" },
          { problem: "A cyclist rides 14 miles per hour. How long to ride 42 miles?", answer: "3 hours" },
          { problem: "Which is the better buy: 4 lbs for $10 or 6 lbs for $13.50?", answer: "6 lbs for $13.50 ($2.25/lb vs $2.50/lb)" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A runner keeps a steady pace of 8 minutes per mile. How long to run 5 miles?", choices: ["13 minutes", "35 minutes", "40 minutes", "45 minutes"], answer: "C", why: "8 minutes × 5 miles = 40 minutes." },
          { type: "multiple-choice", prompt: "Apples are $1.80 for 3 pounds. How much for 5 pounds at the same rate?", choices: ["$2.40", "$3.00", "$5.40", "$9.00"], answer: "B", why: "Unit price is $0.60/lb, so 0.60 × 5 = $3.00." },
          { type: "short", prompt: "A boat travels at a constant 22 miles per hour. Fill in: in 3 hours it travels ____ miles.", answer: "66", why: "22 × 3 = 66 miles." }
        ]
      },
      {
        code: "6.RP.A.3c",
        title: "Percent of a Quantity & Finding the Whole",
        icon: "💯",
        summary: "Find a percent of a number, and find the whole when you know a part and its percent.",
        vocab: [
          { term: "percent", def: "A part out of 100. The symbol is %." },
          { term: "part", def: "The piece of the whole that the percent describes." },
          { term: "whole", def: "The full 100% amount." }
        ],
        needToKnow: [
          "Percent means 'out of 100.' So 25% = 25 out of 100 = 0.25.",
          "To find a percent of a number, change the percent to a decimal and multiply.",
          "Example: 15% of 60 = 0.15 × 60 = 9.",
          "10% is an easy benchmark: just move the decimal one place left.",
          "To find the whole from a part, divide the part by the percent (as a decimal).",
          "Example: if 9 is 25%, the whole is 9 ÷ 0.25 = 36."
        ],
        workedExample: {
          problem: "A jacket is on sale for 30% off. The discount is $24. What was the original price?",
          steps: [
            "The part (discount) is $24 and the percent is 30%.",
            "To find the whole, divide the part by the percent as a decimal: 24 ÷ 0.30.",
            "24 ÷ 0.30 = 80."
          ],
          answer: "$80 original price"
        },
        guided: [
          { problem: "What is 20% of 45?", hint: "Change 20% to 0.20, then multiply by 45.", answer: "9" },
          { problem: "12 is 25% of what number?", hint: "Divide the part by the decimal: 12 ÷ 0.25.", answer: "48" },
          { problem: "A class of 30 students has 40% wearing glasses. How many wear glasses?", hint: "Find 40% of 30: 0.40 × 30.", answer: "12 students" }
        ],
        independent: [
          { problem: "What is 15% of 80?", answer: "12" },
          { problem: "What is 50% of 96?", answer: "48" },
          { problem: "18 is 30% of what number?", answer: "60" },
          { problem: "A $40 meal has a 20% tip added. How much is the tip?", answer: "$8" },
          { problem: "A team won 75% of its games and won 15 games. How many games did it play?", answer: "20 games" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "What is 35% of 200?", choices: ["35", "70", "90", "165"], answer: "B", why: "0.35 × 200 = 70." },
          { type: "multiple-choice", prompt: "A shirt is 60% of the way sold out. 24 shirts are sold. How many shirts were there at the start?", choices: ["14", "30", "40", "60"], answer: "C", why: "24 ÷ 0.60 = 40 shirts." },
          { type: "short", prompt: "In a survey, 45 students said yes. That was 25% of all students. Fill in: there were ____ students in all.", answer: "180", why: "45 ÷ 0.25 = 180 students." }
        ]
      },
      {
        code: "6.RP.A.3d",
        title: "Convert Measurement Units with Ratios",
        icon: "📏",
        summary: "Change from one unit to another using ratio reasoning and conversion facts.",
        vocab: [
          { term: "convert", def: "To change an amount from one unit to another, like feet to inches." },
          { term: "conversion factor", def: "A ratio that shows how two units are equal, like 12 in = 1 ft." },
          { term: "unit", def: "What you are measuring with, like inches, grams, or liters." }
        ],
        needToKnow: [
          "A conversion factor is a ratio of equal amounts, like 1 ft : 12 in.",
          "To go to a smaller unit, multiply. To go to a bigger unit, divide.",
          "Example: 5 feet × 12 = 60 inches (smaller unit, so multiply).",
          "Example: 48 ounces ÷ 16 = 3 pounds (bigger unit, so divide).",
          "Common facts: 1 ft = 12 in, 1 lb = 16 oz, 1 km = 1,000 m, 1 m = 100 cm.",
          "Keep the units labeled so you know if your answer makes sense."
        ],
        workedExample: {
          problem: "A rope is 2.5 meters long. How many centimeters is that? (1 m = 100 cm)",
          steps: [
            "Centimeters are smaller than meters, so multiply.",
            "Use the conversion factor: 1 m = 100 cm.",
            "2.5 × 100 = 250."
          ],
          answer: "250 centimeters"
        },
        guided: [
          { problem: "How many inches are in 4 feet? (1 ft = 12 in)", hint: "Inches are smaller, so multiply by 12.", answer: "48 inches" },
          { problem: "How many pounds are in 64 ounces? (1 lb = 16 oz)", hint: "Pounds are bigger, so divide by 16.", answer: "4 pounds" },
          { problem: "A trail is 3,000 meters long. How many kilometers? (1 km = 1,000 m)", hint: "Kilometers are bigger, so divide by 1,000.", answer: "3 kilometers" }
        ],
        independent: [
          { problem: "How many centimeters are in 7 meters? (1 m = 100 cm)", answer: "700 cm" },
          { problem: "How many ounces are in 5 pounds? (1 lb = 16 oz)", answer: "80 oz" },
          { problem: "How many feet are in 36 inches? (1 ft = 12 in)", answer: "3 feet" },
          { problem: "A bottle holds 2 liters. How many milliliters? (1 L = 1,000 mL)", answer: "2,000 mL" },
          { problem: "How many meters are in 4.5 kilometers? (1 km = 1,000 m)", answer: "4,500 m" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A board is 8 feet long. How many inches is that? (1 ft = 12 in)", choices: ["20 in", "80 in", "96 in", "120 in"], answer: "C", why: "8 × 12 = 96 inches." },
          { type: "multiple-choice", prompt: "A bag of flour weighs 80 ounces. How many pounds is that? (1 lb = 16 oz)", choices: ["4 lb", "5 lb", "6 lb", "64 lb"], answer: "B", why: "80 ÷ 16 = 5 pounds." },
          { type: "short", prompt: "A runner ran 3.2 kilometers. Fill in: that is ____ meters. (1 km = 1,000 m)", answer: "3200", why: "3.2 × 1,000 = 3,200 meters." }
        ]
      }
    ]
  },
  {
    domain: "NS",
    domainTitle: "The Number System",
    slug: "the-number-system",
    icon: "🔢",
    color: "6B4FA0",
    skills: [
      {
        code: "6.NS.A.1",
        title: "Divide Fractions by Fractions",
        icon: "➗",
        summary: "Divide a fraction by a fraction to find how many groups fit, using models and the keep-change-flip rule.",
        vocab: [
          { term: "dividend", def: "The number being split up (it comes first in the division)." },
          { term: "divisor", def: "The number you divide by (it comes after the ÷ sign)." },
          { term: "reciprocal", def: "A fraction flipped upside down; 3/4 becomes 4/3." },
          { term: "quotient", def: "The answer to a division problem." }
        ],
        needToKnow: [
          "Dividing asks 'how many of the divisor fit into the dividend?'",
          "Keep the first fraction, Change ÷ to ×, Flip the second fraction (its reciprocal).",
          "A whole number like 4 can be written as 4/1 before flipping.",
          "Dividing by a fraction smaller than 1 gives an answer larger than the dividend.",
          "Always simplify your final answer and write any improper fraction or mixed number clearly.",
          "A bar model or number line shows the same answer the rule gives."
        ],
        workedExample: {
          problem: "A ribbon is 3/4 yard long. Each bow needs 1/8 yard. How many bows can you make?",
          steps: [
            "Write the division: 3/4 ÷ 1/8.",
            "Keep 3/4, change ÷ to ×, flip 1/8 to 8/1: 3/4 × 8/1.",
            "Multiply: (3 × 8)/(4 × 1) = 24/4, then simplify to 6."
          ],
          answer: "6 bows"
        },
        guided: [
          { problem: "2/3 ÷ 1/6", hint: "Flip 1/6 to 6/1, then multiply 2/3 × 6/1.", answer: "4" },
          { problem: "How many 1/3-cup scoops are in 5/6 cup of flour?", hint: "5/6 ÷ 1/3, flip the divisor to 3/1.", answer: "5/2, or 2 1/2 scoops" },
          { problem: "3/4 ÷ 2/3", hint: "Multiply 3/4 × 3/2; do not simplify too early.", answer: "9/8, or 1 1/8" }
        ],
        independent: [
          { problem: "7/8 ÷ 1/4", answer: "7/2, or 3 1/2" },
          { problem: "4/5 ÷ 2/3", answer: "6/5, or 1 1/5" },
          { problem: "5/8 ÷ 1/2", answer: "5/4, or 1 1/4" },
          { problem: "A board is 2/3 meter long and is cut into 4 equal pieces. How long is each piece?", answer: "1/6 meter" },
          { problem: "How many 2/3-liter bottles can be filled from 6 liters of juice?", answer: "9 bottles" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A baker has 9/10 kg of dough and uses 3/5 kg per loaf. How many loaves can she make?", choices: ["1/2 loaf", "27/50 loaf", "3/2 (1 1/2) loaves", "6 loaves"], answer: "C", why: "9/10 ÷ 3/5 = 9/10 × 5/3 = 45/30 = 3/2, which is 1 1/2 loaves." },
          { type: "multiple-choice", prompt: "Which expression has the same value as 5/6 ÷ 1/3?", choices: ["5/6 × 1/3", "5/6 × 3/1", "6/5 × 1/3", "1/3 × 6/5"], answer: "B", why: "Dividing by 1/3 means multiplying by its reciprocal, 3/1." },
          { type: "short", prompt: "Use a model or the rule: 1/2 ÷ 1/8 = ____.", answer: "4", why: "Shade 1/2 of a whole, then split it into 1/8 pieces; there are 4 eighths inside the half." }
        ]
      },
      {
        code: "6.NS.B.2",
        title: "Divide Multi-Digit Numbers",
        icon: "🧮",
        summary: "Use the standard long-division algorithm to divide multi-digit whole numbers accurately.",
        vocab: [
          { term: "dividend", def: "The number being divided (goes inside the division box)." },
          { term: "divisor", def: "The number you are dividing by (goes outside the box)." },
          { term: "quotient", def: "The result that sits on top of the division box." },
          { term: "remainder", def: "What is left over when the divisor does not divide evenly." }
        ],
        needToKnow: [
          "Follow the steps: Divide, Multiply, Subtract, Bring down, Repeat.",
          "Line up your digits carefully so place values stay in the correct columns.",
          "Write a 0 in the quotient if the divisor does not fit into a partial value.",
          "Check your answer: quotient × divisor + remainder should equal the dividend.",
          "Estimate first so you can tell if your answer is reasonable.",
          "A remainder of 0 means the number divides evenly."
        ],
        workedExample: {
          problem: "Divide 408 ÷ 12.",
          steps: [
            "12 into 40 goes 3 times (3 × 12 = 36); write 3, subtract: 40 − 36 = 4.",
            "Bring down the 8 to make 48; 12 into 48 goes 4 times (4 × 12 = 48).",
            "Subtract: 48 − 48 = 0, so the quotient is 34 with no remainder."
          ],
          answer: "34"
        },
        guided: [
          { problem: "952 ÷ 14", hint: "Start with 14 into 95; it goes 6 times (84).", answer: "68" },
          { problem: "A school orders 3,744 pencils packed 16 to a box. How many boxes?", hint: "Divide 3,744 ÷ 16; begin with 16 into 37.", answer: "234 boxes" },
          { problem: "1,426 ÷ 23", hint: "23 into 142 goes 6 times (138).", answer: "62" }
        ],
        independent: [
          { problem: "725 ÷ 25", answer: "29" },
          { problem: "837 ÷ 27", answer: "31" },
          { problem: "1,000 ÷ 8", answer: "125" },
          { problem: "A stadium has 1,426 seats in 23 equal rows. How many seats per row?", answer: "62 seats" },
          { problem: "Divide 952 ÷ 14 and check using multiplication.", answer: "68 (because 68 × 14 = 952)" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "What is 3,744 ÷ 16?", choices: ["224", "234", "244", "334"], answer: "B", why: "16 × 234 = 3,744, so the quotient is exactly 234." },
          { type: "multiple-choice", prompt: "A factory makes 952 toys and packs them 14 per crate. How many crates are filled?", choices: ["58", "62", "68", "72"], answer: "C", why: "952 ÷ 14 = 68 with no remainder, so 68 crates are filled." },
          { type: "short", prompt: "Find 1,000 ÷ 8.", answer: "125", why: "8 into 10 is 1, then continue the algorithm to get 125; check: 125 × 8 = 1,000." }
        ]
      },
      {
        code: "6.NS.B.3",
        title: "Operations with Multi-Digit Decimals",
        icon: "💲",
        summary: "Add, subtract, multiply, and divide decimals using place value and careful point placement.",
        vocab: [
          { term: "decimal point", def: "The dot that separates whole numbers from parts of a whole." },
          { term: "place value", def: "The value of a digit based on its position, like tenths or hundredths." },
          { term: "product", def: "The answer when you multiply." },
          { term: "quotient", def: "The answer when you divide." }
        ],
        needToKnow: [
          "To add or subtract, line up the decimal points and fill empty spots with zeros.",
          "To multiply, ignore the points first, then count total decimal places in both factors.",
          "To divide by a decimal, move both points right until the divisor is a whole number.",
          "Bring the decimal point straight up into the quotient when doing long division.",
          "Estimate first so a misplaced point is easy to catch.",
          "Money problems usually round to two decimal places (the cents)."
        ],
        workedExample: {
          problem: "Multiply 3.6 × 0.4.",
          steps: [
            "Multiply without points: 36 × 4 = 144.",
            "Count decimal places: 3.6 has 1 and 0.4 has 1, so 2 total.",
            "Place the point 2 spots from the right: 1.44."
          ],
          answer: "1.44"
        },
        guided: [
          { problem: "4.7 + 2.85", hint: "Line up points and write 4.70.", answer: "7.55" },
          { problem: "Find 15.75 − 8.90.", hint: "Align the decimal points before subtracting.", answer: "6.85" },
          { problem: "7.5 ÷ 0.25", hint: "Move both points 2 places: 750 ÷ 25.", answer: "30" }
        ],
        independent: [
          { problem: "8.3 − 5.76", answer: "2.54" },
          { problem: "2.4 × 1.5", answer: "3.6" },
          { problem: "9.6 ÷ 0.8", answer: "12" },
          { problem: "45.6 + 7.89", answer: "53.49" },
          { problem: "Find 12.6 ÷ 0.6.", answer: "21" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Maria pays for lunch with a $20 bill. Her meal costs $15.75. How much change does she get?", choices: ["$4.25", "$4.75", "$5.25", "$5.75"], answer: "A", why: "20.00 − 15.75 = 4.25, so her change is $4.25." },
          { type: "multiple-choice", prompt: "What is 7.5 ÷ 0.25?", choices: ["3", "0.3", "30", "300"], answer: "C", why: "Move both points two places: 750 ÷ 25 = 30." },
          { type: "short", prompt: "A bottle holds 2.4 L and a cup holds 1.5 L. How many liters do they hold together?", answer: "3.9 L", why: "Line up points: 2.4 + 1.5 = 3.9 liters." }
        ]
      },
      {
        code: "6.NS.B.4",
        title: "GCF, LCM, and the Distributive Property",
        icon: "🔢",
        summary: "Find the greatest common factor and least common multiple, then use the GCF to rewrite a sum.",
        vocab: [
          { term: "factor", def: "A whole number that divides evenly into another number." },
          { term: "greatest common factor (GCF)", def: "The largest factor that two numbers share." },
          { term: "least common multiple (LCM)", def: "The smallest multiple that two numbers share." },
          { term: "distributive property", def: "A rule that lets you factor a sum, like 18 + 24 = 6(3 + 4)." }
        ],
        needToKnow: [
          "GCF is the biggest number that divides BOTH numbers with no remainder.",
          "LCM is the smallest number that BOTH numbers divide into evenly.",
          "Listing factors or multiples works; so does prime factorization.",
          "To factor out the GCF, divide each addend by the GCF and write GCF(quotient + quotient).",
          "GCF is never larger than the smaller number; LCM is never smaller than the larger number.",
          "Check a factored form by distributing it back out."
        ],
        workedExample: {
          problem: "Rewrite 18 + 24 using the distributive property and the GCF.",
          steps: [
            "Find the GCF of 18 and 24: shared factors are 1, 2, 3, 6, so the GCF is 6.",
            "Divide each addend by 6: 18 ÷ 6 = 3 and 24 ÷ 6 = 4.",
            "Write it as 6(3 + 4); check: 6 × 7 = 42 = 18 + 24."
          ],
          answer: "6(3 + 4)"
        },
        guided: [
          { problem: "Find the GCF of 24 and 36.", hint: "List factors of each and pick the largest shared one.", answer: "12" },
          { problem: "Find the LCM of 8 and 12.", hint: "List multiples: 8, 16, 24... and 12, 24...", answer: "24" },
          { problem: "Use the GCF to rewrite 15 + 20.", hint: "GCF of 15 and 20 is 5; divide each addend by 5.", answer: "5(3 + 4)" }
        ],
        independent: [
          { problem: "Find the GCF of 40 and 16.", answer: "8" },
          { problem: "Find the LCM of 6 and 9.", answer: "18" },
          { problem: "Rewrite 36 + 8 using the distributive property and the GCF.", answer: "4(9 + 2)" },
          { problem: "Find the GCF of 48 and 60.", answer: "12" },
          { problem: "Find the LCM of 5 and 6.", answer: "30" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which expression is 12 + 8 rewritten with the GCF factored out?", choices: ["2(6 + 4)", "4(3 + 2)", "4(3 + 8)", "8(12 + 1)"], answer: "B", why: "The GCF of 12 and 8 is 4; 12 ÷ 4 = 3 and 8 ÷ 4 = 2, giving 4(3 + 2)." },
          { type: "multiple-choice", prompt: "Hot dogs come in packs of 8 and buns come in packs of 12. What is the fewest of each you must buy to have equal amounts?", choices: ["24", "48", "96", "20"], answer: "A", why: "The LCM of 8 and 12 is 24, so 24 of each is the smallest matching amount." },
          { type: "short", prompt: "Two ropes are 18 ft and 24 ft. They are cut into equal pieces with none left over. What is the longest each piece can be?", answer: "6 feet", why: "The longest equal piece is the GCF of 18 and 24, which is 6 feet." }
        ]
      },
      {
        code: "6.NS.C.5",
        title: "Positive and Negative Numbers in Context",
        icon: "🌡️",
        summary: "Use positive and negative numbers to describe opposite real-world situations like above/below zero.",
        vocab: [
          { term: "positive number", def: "A number greater than zero, often meaning gain, above, or right." },
          { term: "negative number", def: "A number less than zero, often meaning loss, below, or left." },
          { term: "opposite", def: "Two numbers the same distance from zero in different directions, like 5 and −5." },
          { term: "zero", def: "The starting point that separates positive and negative values." }
        ],
        needToKnow: [
          "Negative numbers describe values below or less than zero, like −4°F or a $20 debt.",
          "Positive and negative are opposite directions from a chosen zero point.",
          "Common pairs: above/below sea level, deposit/withdrawal, gain/loss, hotter/colder.",
          "Zero is neither positive nor negative; it is the reference point.",
          "The sign tells direction, and the number tells how far from zero.",
          "Choose what zero means for the situation before assigning signs."
        ],
        workedExample: {
          problem: "A diver is 30 feet below sea level. Write this as an integer and name the opposite situation.",
          steps: [
            "Sea level is zero, and 'below' means negative.",
            "Write the depth as −30.",
            "The opposite, +30, would mean 30 feet above sea level."
          ],
          answer: "−30 feet (opposite: +30 feet above sea level)"
        },
        guided: [
          { problem: "Write an integer for 'withdrew $15 from a bank account.'", hint: "A withdrawal takes money away, so it is below zero.", answer: "−15" },
          { problem: "The temperature is 8 degrees below zero. Write it as an integer.", hint: "Below zero means negative.", answer: "−8" },
          { problem: "What is the opposite of a 12-foot elevation gain when hiking?", hint: "The opposite direction of going up is going down.", answer: "−12 (a 12-foot drop)" }
        ],
        independent: [
          { problem: "Write an integer for 'deposited $50.'", answer: "+50" },
          { problem: "Write an integer for a temperature of 5 degrees below zero.", answer: "−5" },
          { problem: "A submarine sits 200 feet below sea level. Write its position as an integer.", answer: "−200" },
          { problem: "What is the opposite of −7?", answer: "+7" },
          { problem: "A football team loses 6 yards on a play. Write it as an integer.", answer: "−6" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which situation is best represented by the integer −25?", choices: ["Climbing 25 feet up a ladder", "A withdrawal of $25 from savings", "Earning $25 babysitting", "A temperature rise of 25 degrees"], answer: "B", why: "A withdrawal removes money, which is a value below zero, matching −25." },
          { type: "multiple-choice", prompt: "Death Valley is about 282 feet below sea level. Which integer represents this elevation?", choices: ["282", "0", "−282", "−28.2"], answer: "C", why: "Below sea level is negative, so the elevation is −282 feet." },
          { type: "short", prompt: "A thermostat reads −3°F. Describe what its opposite, +3°F, would mean.", answer: "3°F above zero", why: "The opposite of −3 is +3, which is 3 degrees above zero instead of below." }
        ]
      },
      {
        code: "6.NS.C.6",
        title: "Number Lines, Opposites & the Coordinate Plane",
        icon: "📍",
        summary: "Plot rational numbers and ordered pairs, and use signs to find opposites and quadrants.",
        vocab: [
          { term: "coordinate plane", def: "A grid made by a horizontal x-axis and vertical y-axis crossing at the origin." },
          { term: "ordered pair", def: "Two numbers (x, y) that name a point's location." },
          { term: "origin", def: "The point (0, 0) where the two axes cross." },
          { term: "quadrant", def: "One of four regions of the plane, numbered I to IV counterclockwise." }
        ],
        needToKnow: [
          "The opposite of a number flips its sign; the opposite of −6 is 6.",
          "In an ordered pair (x, y), x moves left/right and y moves up/down.",
          "Quadrant I is (+, +), II is (−, +), III is (−, −), and IV is (+, −).",
          "Flipping the sign of one coordinate reflects the point across an axis.",
          "Flipping the signs of both coordinates reflects the point across both axes.",
          "Points on an axis (like (0, 4) or (−3, 0)) are not inside any quadrant."
        ],
        workedExample: {
          problem: "In which quadrant is the point (−4, 3)? Then give its reflection across the y-axis.",
          steps: [
            "The x-value is negative and the y-value is positive: (−, +).",
            "(−, +) is Quadrant II.",
            "Reflecting across the y-axis flips the x-sign: (−4, 3) becomes (4, 3)."
          ],
          answer: "Quadrant II; reflection is (4, 3)"
        },
        guided: [
          { problem: "What is the opposite of 3.5?", hint: "Keep the distance from zero, flip the sign.", answer: "−3.5" },
          { problem: "In which quadrant is (5, −2)?", hint: "Positive x with negative y is (+, −).", answer: "Quadrant IV" },
          { problem: "Reflect (2, 6) across the x-axis.", hint: "Reflecting across the x-axis flips the y-sign.", answer: "(2, −6)" }
        ],
        independent: [
          { problem: "What is the opposite of the opposite of −7?", answer: "−7" },
          { problem: "In which quadrant is the point (−1, −8)?", answer: "Quadrant III" },
          { problem: "Reflect the point (−3, 4) across the y-axis.", answer: "(3, 4)" },
          { problem: "Name the quadrant of (6, 7).", answer: "Quadrant I" },
          { problem: "Is the point (0, −5) in a quadrant? Explain in a few words.", answer: "No; it is on the y-axis." }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Point A is at (−4, 3). Point B is its reflection across the x-axis. What are the coordinates of B?", choices: ["(4, 3)", "(−4, −3)", "(4, −3)", "(−3, 4)"], answer: "B", why: "Reflecting across the x-axis keeps x and flips the y-sign: (−4, 3) to (−4, −3)." },
          { type: "multiple-choice", prompt: "A point has a negative x-coordinate and a positive y-coordinate. Which quadrant is it in?", choices: ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV"], answer: "B", why: "(−, +) is the upper-left region, which is Quadrant II." },
          { type: "short", prompt: "Are (3, −5) and (3, 5) reflections across the x-axis? Explain in a few words.", answer: "Yes — same x, opposite y.", why: "Reflecting across the x-axis keeps the x-coordinate and flips the sign of the y-coordinate." }
        ]
      },
      {
        code: "6.NS.C.7",
        title: "Order Rational Numbers & Absolute Value",
        icon: "↔️",
        summary: "Compare and order rational numbers and use absolute value to describe distance from zero.",
        vocab: [
          { term: "rational number", def: "Any number that can be written as a fraction, including integers and decimals." },
          { term: "absolute value", def: "The distance a number is from zero, always zero or positive; written |x|." },
          { term: "inequality", def: "A statement comparing values using < or >." },
          { term: "magnitude", def: "How big a value is, shown by its absolute value, ignoring its sign." }
        ],
        needToKnow: [
          "On a number line, numbers farther right are greater; farther left are smaller.",
          "Every negative number is less than every positive number.",
          "For negatives, the one closer to zero is larger; −2 > −5.",
          "Absolute value is distance from zero, so |−8| = 8 and |8| = 8.",
          "A statement like −3 < 1 means −3 is to the left of 1 on the number line.",
          "In context, absolute value can show size without direction, like a $40 debt being 'larger' than a $25 debt."
        ],
        workedExample: {
          problem: "Order these temperatures from coldest to warmest: −3, −1.5, 0, 2, −7.",
          steps: [
            "Coldest means smallest, so start farthest left on the number line.",
            "The negatives in order are −7, then −3, then −1.5.",
            "Then come 0 and 2, giving −7, −3, −1.5, 0, 2."
          ],
          answer: "−7, −3, −1.5, 0, 2"
        },
        guided: [
          { problem: "Use < or > to compare −2 and −5.", hint: "On a number line, −2 is to the right of −5.", answer: "−2 > −5" },
          { problem: "Find |−8| and |5|, then tell which is greater.", hint: "Absolute value is distance from zero.", answer: "|−8| = 8 and |5| = 5, so |−8| is greater" },
          { problem: "Order from least to greatest: −2.5, −2, −3.5, −1.", hint: "Most negative is least.", answer: "−3.5, −2.5, −2, −1" }
        ],
        independent: [
          { problem: "Compare using < or >: −9 and −4.", answer: "−9 < −4" },
          { problem: "Find |−12|.", answer: "12" },
          { problem: "Order from greatest to least: 1, −6, 0, −2.", answer: "1, 0, −2, −6" },
          { problem: "Account A owes $40 and Account B owes $25. Which debt is larger?", answer: "Account A, because |−40| > |−25|" },
          { problem: "Which is colder, −4°F or −1°F?", answer: "−4°F" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which list orders the numbers from least to greatest?", choices: ["−1, −3, 0, 2", "2, 0, −1, −3", "−3, −1, 0, 2", "0, −1, 2, −3"], answer: "C", why: "From least to greatest the order is −3, −1, 0, 2, moving left to right on the number line." },
          { type: "multiple-choice", prompt: "Maya owes $30 and Theo owes $18. Which statement is true?", choices: ["−30 > −18", "|−30| > |−18|", "−18 < −30", "|−18| > |−30|"], answer: "B", why: "Maya's debt is larger in size, so |−30| > |−18|, even though −30 < −18 as values." },
          { type: "short", prompt: "Explain why −2 is greater than −5, even though 5 is greater than 2.", answer: "−2 is closer to zero, so it is to the right of −5.", why: "On the number line −2 is to the right of −5, so −2 > −5." }
        ]
      },
      {
        code: "6.NS.C.8",
        title: "Distance on the Coordinate Plane",
        icon: "🗺️",
        summary: "Find the distance between two points that share an x-coordinate or a y-coordinate using absolute value.",
        vocab: [
          { term: "coordinate", def: "One of the two numbers in an ordered pair (x, y)." },
          { term: "absolute value", def: "Distance from zero, used to keep a distance positive; |−5| = 5." },
          { term: "horizontal", def: "Left-to-right direction, along the x-axis." },
          { term: "vertical", def: "Up-and-down direction, along the y-axis." }
        ],
        needToKnow: [
          "Two points with the same x-coordinate lie on a vertical line.",
          "Two points with the same y-coordinate lie on a horizontal line.",
          "For a vertical segment, the distance is the difference of the y-values.",
          "For a horizontal segment, the distance is the difference of the x-values.",
          "Use absolute value so the distance is always positive: |a − b|.",
          "Subtracting a negative is the same as adding, so |3 − (−5)| = |3 + 5| = 8."
        ],
        workedExample: {
          problem: "Find the distance between (3, 2) and (−5, 2).",
          steps: [
            "Both points share the y-value 2, so the segment is horizontal.",
            "Subtract the x-values and take the absolute value: |3 − (−5)|.",
            "|3 + 5| = |8| = 8 units."
          ],
          answer: "8 units"
        },
        guided: [
          { problem: "Find the distance between (2, 7) and (2, 2).", hint: "Same x, so subtract the y-values.", answer: "5 units" },
          { problem: "On a map, a park is at (−4, 1) and a school is at (6, 1). How far apart are they?", hint: "Same y, so use |−4 − 6|.", answer: "10 units" },
          { problem: "Find the distance between (−3, −6) and (−3, −1).", hint: "Same x; subtract the y-values and take absolute value.", answer: "5 units" }
        ],
        independent: [
          { problem: "Distance between (2, −3) and (2, 2).", answer: "5 units" },
          { problem: "Distance between (−6, 4) and (−1, 4).", answer: "5 units" },
          { problem: "Distance between (0, 8) and (0, −2).", answer: "10 units" },
          { problem: "A store is at (7, 5) and a home is at (7, −4). How many blocks apart are they?", answer: "9 blocks" },
          { problem: "Distance between (−5, 3) and (4, 3).", answer: "9 units" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "What is the distance between (−5, 2) and (3, 2)?", choices: ["2 units", "5 units", "8 units", "15 units"], answer: "C", why: "Same y, so distance is |−5 − 3| = |−8| = 8 units." },
          { type: "multiple-choice", prompt: "Two points are at (4, −6) and (4, 3). What is the distance between them?", choices: ["3 units", "6 units", "9 units", "18 units"], answer: "C", why: "Same x, so distance is |3 − (−6)| = |9| = 9 units." },
          { type: "short", prompt: "A bench is at (−3, 5) and a fountain is at (−3, −2). Find the distance between them.", answer: "7 units (vertical)", why: "They share x = −3, so the distance is |5 − (−2)| = 7 units." }
        ]
      }
    ]
  },
  {
    domain: "EE",
    domainTitle: "Expressions & Equations",
    slug: "expressions-equations",
    icon: "✖️",
    color: "12355B",
    skills: [
      {
        code: "6.EE.A.1",
        title: "Write & Evaluate Exponents",
        icon: "🔢",
        summary: "Write repeated multiplication as a power and evaluate powers using whole-number exponents.",
        vocab: [
          { term: "base", def: "The number being multiplied by itself in a power. In 5³, the base is 5." },
          { term: "exponent", def: "The small raised number that tells how many times to use the base as a factor. In 5³, the exponent is 3." },
          { term: "power", def: "A number written with a base and exponent, like 5³ (read 'five to the third power')." },
          { term: "squared", def: "Raised to the second power (used as a factor 2 times), like 6² = 6 × 6." },
          { term: "cubed", def: "Raised to the third power (used as a factor 3 times), like 2³ = 2 × 2 × 2." }
        ],
        needToKnow: [
          "An exponent tells you how many times to multiply the base by itself, NOT base × exponent.",
          "Example: 2³ means 2 × 2 × 2 = 8, not 2 × 3 = 6.",
          "Read 5² as 'five squared' and 4³ as 'four cubed.'",
          "Any base to the first power equals itself: 7¹ = 7.",
          "Powers of 10 are quick: 10² = 100, 10³ = 1000 (the exponent counts the zeros).",
          "Evaluate the exponent first when it appears in a larger expression (order of operations)."
        ],
        workedExample: {
          problem: "Evaluate 3⁴.",
          steps: [
            "The base is 3 and the exponent is 4, so use 3 as a factor 4 times: 3 × 3 × 3 × 3.",
            "Multiply two at a time: 3 × 3 = 9, then 9 × 3 = 27.",
            "Finish: 27 × 3 = 81."
          ],
          answer: "3⁴ = 81"
        },
        guided: [
          { problem: "Write 6 × 6 using an exponent, then evaluate.", hint: "Count how many times 6 is a factor; that number is the exponent.", answer: "6² = 36" },
          { problem: "Evaluate 2⁵.", hint: "Multiply 2 by itself 5 times: 2×2×2×2×2.", answer: "32" },
          { problem: "Evaluate 10³.", hint: "The exponent 3 tells you the number of zeros after the 1.", answer: "1000" }
        ],
        independent: [
          { problem: "Evaluate 4³.", answer: "64" },
          { problem: "Evaluate 5².", answer: "25" },
          { problem: "Write 7 × 7 × 7 as a power.", answer: "7³" },
          { problem: "Evaluate 2⁴.", answer: "16" },
          { problem: "Evaluate 1⁶.", answer: "1" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which expression is equal to 2³?", choices: ["2 × 3", "2 + 2 + 2", "2 × 2 × 2", "3 × 3"], answer: "C", why: "2³ means the base 2 used as a factor 3 times: 2 × 2 × 2 = 8." },
          { type: "multiple-choice", prompt: "What is the value of 5²?", choices: ["7", "10", "25", "52"], answer: "C", why: "5² = 5 × 5 = 25." },
          { type: "short", prompt: "A square floor is 8 tiles by 8 tiles. Write this as a power and find the total number of tiles.", answer: "8² = 64 tiles", why: "An 8-by-8 square is 8 used as a factor twice, which is 8² = 64." }
        ]
      },
      {
        code: "6.EE.A.2",
        title: "Write & Read Algebraic Expressions",
        icon: "✏️",
        summary: "Translate words into algebraic expressions and identify their parts, such as terms and coefficients.",
        vocab: [
          { term: "variable", def: "A letter that stands for an unknown number, like x or n." },
          { term: "term", def: "A single part of an expression separated by + or − signs. In 3x + 5, the terms are 3x and 5." },
          { term: "coefficient", def: "The number multiplied by a variable. In 7y, the coefficient is 7." },
          { term: "constant", def: "A term that is just a number with no variable, like the 5 in 3x + 5." },
          { term: "expression", def: "A math phrase with numbers, variables, and operations but no equal sign." }
        ],
        needToKnow: [
          "'Sum' means add, 'difference' means subtract, 'product' means multiply, 'quotient' means divide.",
          "'More than' and 'increased by' mean add; 'less than' and 'decreased by' mean subtract.",
          "Watch the order: '5 less than x' is x − 5, NOT 5 − x.",
          "A coefficient sits in front of a variable; 'x' alone has a coefficient of 1.",
          "Terms are separated by + or − signs; count them to know how many terms there are.",
          "'Twice a number' means 2 × the number, written 2n."
        ],
        workedExample: {
          problem: "Write an expression for 'the cost of t tickets at $9 each, plus a $4 service fee,' then name the coefficient and constant.",
          steps: [
            "Cost of tickets is $9 times the number of tickets: 9t.",
            "Add the flat $4 service fee: 9t + 4.",
            "The coefficient is 9 (multiplies t) and the constant is 4."
          ],
          answer: "9t + 4; coefficient 9, constant 4"
        },
        guided: [
          { problem: "Write 'a number n decreased by 7' as an expression.", hint: "'Decreased by' means subtract, in the order given.", answer: "n − 7" },
          { problem: "How many terms are in 4x + 2y + 9, and what is the coefficient of y?", hint: "Count parts separated by + signs; the coefficient is the number in front of y.", answer: "3 terms; coefficient of y is 2" },
          { problem: "Write 'the product of 6 and a number x' as an expression.", hint: "'Product' means multiply.", answer: "6x" }
        ],
        independent: [
          { problem: "Write '8 more than a number m' as an expression.", answer: "m + 8" },
          { problem: "Write '3 less than twice a number p' as an expression.", answer: "2p − 3" },
          { problem: "Identify the coefficient and constant in 10g + 15.", answer: "Coefficient 10, constant 15" },
          { problem: "Write 'the quotient of a number y and 5' as an expression.", answer: "y ÷ 5 (or y/5)" },
          { problem: "How many terms are in the expression 5a + 7 − b?", answer: "3 terms" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which expression represents '5 less than a number n'?", choices: ["5 − n", "n − 5", "5n", "n + 5"], answer: "B", why: "'5 less than n' starts with n and subtracts 5, giving n − 5." },
          { type: "multiple-choice", prompt: "In the expression 7x + 12, which statement is true?", choices: ["7 is the constant", "12 is the coefficient", "7 is the coefficient and 12 is the constant", "x is the constant"], answer: "C", why: "7 multiplies the variable x (coefficient) and 12 stands alone (constant)." },
          { type: "short", prompt: "A taxi charges a $3 base fee plus $2 for each mile m. Write an expression for the total cost.", answer: "2m + 3", why: "$2 per mile gives 2m, plus the $3 base fee, so 2m + 3." }
        ]
      },
      {
        code: "6.EE.A.3",
        title: "Generate Equivalent Expressions",
        icon: "🔁",
        summary: "Use the distributive property and combine like terms to write equivalent expressions.",
        vocab: [
          { term: "like terms", def: "Terms with the same variable raised to the same power, like 3x and 5x." },
          { term: "distributive property", def: "A rule that says a(b + c) = ab + ac; multiply the outside number by each term inside." },
          { term: "combine like terms", def: "Add or subtract the coefficients of like terms to simplify, like 3x + 5x = 8x." },
          { term: "equivalent expressions", def: "Two expressions that always have the same value for every value of the variable." }
        ],
        needToKnow: [
          "Distribute by multiplying the outside factor by EVERY term inside the parentheses.",
          "Example: 3(x + 4) = 3·x + 3·4 = 3x + 12.",
          "Only combine like terms: 3x + 5x = 8x, but 3x + 5 cannot be combined.",
          "Constants combine with constants; variable terms combine with matching variable terms.",
          "A variable with no number in front has a coefficient of 1: x = 1x.",
          "You can check equivalence by substituting a number for the variable in both expressions."
        ],
        workedExample: {
          problem: "Simplify 4(x + 2) + 3x.",
          steps: [
            "Distribute the 4: 4·x + 4·2 = 4x + 8.",
            "Rewrite the expression: 4x + 8 + 3x.",
            "Combine like terms 4x and 3x: 7x + 8."
          ],
          answer: "7x + 8"
        },
        guided: [
          { problem: "Use the distributive property to expand 5(n + 3).", hint: "Multiply 5 by n and by 3.", answer: "5n + 15" },
          { problem: "Combine like terms: 6y + 2 + 3y.", hint: "Add the coefficients of the y-terms; the 2 stays separate.", answer: "9y + 2" },
          { problem: "Simplify 2(a + 4) + a.", hint: "Distribute first, then combine the a-terms.", answer: "3a + 8" }
        ],
        independent: [
          { problem: "Expand 3(x + 6).", answer: "3x + 18" },
          { problem: "Combine like terms: 8m + 5m.", answer: "13m" },
          { problem: "Simplify 4y + 7 + 2y + 1.", answer: "6y + 8" },
          { problem: "Expand 6(2k + 1).", answer: "12k + 6" },
          { problem: "Simplify 5(p + 2) + 3p.", answer: "8p + 10" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which expression is equivalent to 3(x + 5)?", choices: ["3x + 5", "x + 15", "3x + 15", "3x + 8"], answer: "C", why: "Distribute the 3 to both terms: 3·x + 3·5 = 3x + 15." },
          { type: "multiple-choice", prompt: "Simplify 7a + 4 + 2a.", choices: ["9a + 4", "13a", "7a + 6a", "9a + 6"], answer: "A", why: "Combine like terms 7a and 2a to get 9a; the constant 4 stays, giving 9a + 4." },
          { type: "short", prompt: "A garden has 2 rows of (p + 3) plants and 4 more plants added. Write the total as a simplified expression.", answer: "2p + 10", why: "2(p + 3) = 2p + 6, then add 4: 2p + 6 + 4 = 2p + 10." }
        ]
      },
      {
        code: "6.EE.A.4",
        title: "Identify Equivalent Expressions",
        icon: "🟰",
        summary: "Decide whether two expressions are equivalent by simplifying or substituting values.",
        vocab: [
          { term: "equivalent", def: "Having the same value for every possible value of the variable." },
          { term: "substitute", def: "Replace a variable with a number to test or evaluate an expression." },
          { term: "simplify", def: "Rewrite an expression in its simplest equal form by combining and distributing." },
          { term: "like terms", def: "Terms with the same variable, which can be combined, like 2x and 6x." }
        ],
        needToKnow: [
          "Two expressions are equivalent if they simplify to the same form.",
          "You can also test equivalence by substituting the same number into both expressions.",
          "If even one substituted value gives different results, the expressions are NOT equivalent.",
          "Equivalent expressions must match for ALL values, not just one lucky number.",
          "Example: 3x + 3x = 6x, so 3x + 3x and 6x are equivalent.",
          "x + x is 2x (not x²); adding a variable to itself doubles it."
        ],
        workedExample: {
          problem: "Are 2(x + 3) and 2x + 6 equivalent?",
          steps: [
            "Simplify the first: 2(x + 3) = 2x + 6 by distributing.",
            "Compare to the second expression: 2x + 6.",
            "Both simplify to 2x + 6, so they match for every value of x."
          ],
          answer: "Yes, they are equivalent."
        },
        guided: [
          { problem: "Are 4x + 2x and 6x equivalent?", hint: "Combine like terms in the first expression.", answer: "Yes; 4x + 2x = 6x" },
          { problem: "Are 3(x + 1) and 3x + 1 equivalent?", hint: "Distribute the 3 to BOTH terms inside.", answer: "No; 3(x + 1) = 3x + 3, not 3x + 1" },
          { problem: "Test x = 2: are x + 5 and 5x equivalent?", hint: "Substitute 2 into each and compare.", answer: "No; x + 5 = 7 but 5x = 10" }
        ],
        independent: [
          { problem: "Are 5x + x and 6x equivalent?", answer: "Yes; 5x + x = 6x" },
          { problem: "Are 2(n + 4) and 2n + 8 equivalent?", answer: "Yes" },
          { problem: "Are 4(y + 2) and 4y + 2 equivalent?", answer: "No; 4(y + 2) = 4y + 8" },
          { problem: "Are 7a − 3a and 4a equivalent?", answer: "Yes; 7a − 3a = 4a" },
          { problem: "Are x + x + x and 3x equivalent?", answer: "Yes" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which expression is equivalent to 6x + 3?", choices: ["3(2x + 1)", "3(2x + 3)", "6(x + 3)", "3(x + 1)"], answer: "A", why: "3(2x + 1) = 6x + 3 when distributed." },
          { type: "multiple-choice", prompt: "Which pair of expressions is NOT equivalent?", choices: ["2x + 2x and 4x", "3(x + 2) and 3x + 6", "x + 5 and 5x", "5x − x and 4x"], answer: "C", why: "x + 5 adds 5 to x, but 5x multiplies x by 5; for x = 2 they give 7 and 10." },
          { type: "short", prompt: "Maya says 4(x + 1) equals 4x + 1. Is she correct? Explain.", answer: "No; 4(x + 1) = 4x + 4.", why: "The distributive property requires multiplying 4 by both x and 1, giving 4x + 4." }
        ]
      },
      {
        code: "6.EE.B.5",
        title: "Solutions by Substitution",
        icon: "🔍",
        summary: "Understand that solving an equation or inequality means finding values that make it true, tested by substitution.",
        vocab: [
          { term: "equation", def: "A math sentence stating two expressions are equal, using an equal sign, like x + 4 = 9." },
          { term: "inequality", def: "A math sentence comparing two expressions with <, >, ≤, or ≥." },
          { term: "solution", def: "A value of the variable that makes the equation or inequality true." },
          { term: "substitute", def: "Replace the variable with a number to check if the sentence is true." }
        ],
        needToKnow: [
          "A solution is any value that makes the equation or inequality TRUE when substituted.",
          "To check, replace the variable with the value and see if both sides match (or the comparison holds).",
          "An equation usually has one solution; an inequality can have many solutions.",
          "Example: x = 5 is a solution to x + 3 = 8 because 5 + 3 = 8 is true.",
          "If substituting gives a false statement, that value is NOT a solution.",
          "For inequalities, test whether the value satisfies < or > (for example, 7 > 4 is true)."
        ],
        workedExample: {
          problem: "Is x = 6 a solution to the equation 2x − 1 = 11?",
          steps: [
            "Substitute 6 for x: 2(6) − 1.",
            "Evaluate the left side: 12 − 1 = 11.",
            "Compare to the right side: 11 = 11 is true, so x = 6 works."
          ],
          answer: "Yes, x = 6 is a solution."
        },
        guided: [
          { problem: "Is n = 4 a solution to n + 7 = 11?", hint: "Substitute 4 and check if both sides equal.", answer: "Yes; 4 + 7 = 11" },
          { problem: "Is x = 3 a solution to the inequality x > 5?", hint: "Check whether 3 is greater than 5.", answer: "No; 3 is not greater than 5" },
          { problem: "Is y = 10 a solution to y − 4 = 5?", hint: "Substitute and compare both sides.", answer: "No; 10 − 4 = 6, not 5" }
        ],
        independent: [
          { problem: "Is x = 8 a solution to x + 5 = 13?", answer: "Yes" },
          { problem: "Is m = 2 a solution to 4m = 12?", answer: "No; 4(2) = 8, not 12" },
          { problem: "Is x = 9 a solution to x > 6?", answer: "Yes" },
          { problem: "Is p = 5 a solution to 3p − 2 = 13?", answer: "Yes; 3(5) − 2 = 13" },
          { problem: "Is n = 1 a solution to n < 1?", answer: "No; 1 is not less than 1" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which value of x makes x + 6 = 14 true?", choices: ["6", "8", "14", "20"], answer: "B", why: "Substituting 8 gives 8 + 6 = 14, a true statement." },
          { type: "multiple-choice", prompt: "Which value is a solution to the inequality x > 7?", choices: ["5", "6", "7", "9"], answer: "D", why: "Only 9 is greater than 7. Note 7 is not a solution because 7 > 7 is false." },
          { type: "short", prompt: "A bus holds 30 students. The expression 30 − s shows empty seats. Is s = 25 a solution to 30 − s = 5?", answer: "Yes; 30 − 25 = 5.", why: "Substituting 25 gives 30 − 25 = 5, which is true." }
        ]
      },
      {
        code: "6.EE.B.6-7",
        title: "Variables & One-Step Equations",
        icon: "⚖️",
        summary: "Use variables to represent numbers and solve one-step equations of the form x + p = q and px = q.",
        vocab: [
          { term: "variable", def: "A letter representing an unknown number you can solve for." },
          { term: "inverse operation", def: "The operation that undoes another: subtraction undoes addition; division undoes multiplication." },
          { term: "isolate the variable", def: "Get the variable alone on one side of the equation to find its value." },
          { term: "solution", def: "The value of the variable that makes the equation true." }
        ],
        needToKnow: [
          "To solve, do the inverse operation to BOTH sides to keep the equation balanced.",
          "For x + p = q, subtract p from both sides.",
          "For x − p = q, add p to both sides.",
          "For px = q, divide both sides by p.",
          "For x ÷ p = q, multiply both sides by p.",
          "Always check your answer by substituting it back into the original equation."
        ],
        workedExample: {
          problem: "Solve 8x = 72.",
          steps: [
            "The variable is multiplied by 8, so use the inverse: divide both sides by 8.",
            "72 ÷ 8 = 9, so x = 9.",
            "Check: 8 × 9 = 72 ✓."
          ],
          answer: "x = 9"
        },
        guided: [
          { problem: "Solve x + 12 = 19.", hint: "Subtract 12 from both sides to undo the addition.", answer: "x = 7" },
          { problem: "Solve x − 3.5 = 10.", hint: "Add 3.5 to both sides.", answer: "x = 13.5" },
          { problem: "Solve (1/4)x = 9.", hint: "Multiply both sides by 4 (the inverse of dividing by 4).", answer: "x = 36" }
        ],
        independent: [
          { problem: "Solve x + 15 = 40.", answer: "x = 25" },
          { problem: "Solve 6x = 54.", answer: "x = 9" },
          { problem: "Solve x − 8 = 11.", answer: "x = 19" },
          { problem: "Solve x/5 = 4.", answer: "x = 20" },
          { problem: "Solve x + 2.5 = 7.", answer: "x = 4.5" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "What is the solution to x + 9 = 21?", choices: ["12", "30", "3", "189"], answer: "A", why: "Subtract 9 from both sides: 21 − 9 = 12, so x = 12." },
          { type: "multiple-choice", prompt: "Solve 7x = 56.", choices: ["49", "63", "8", "9"], answer: "C", why: "Divide both sides by 7: 56 ÷ 7 = 8, so x = 8." },
          { type: "short", prompt: "Jordan bought packs of pencils with 6 pencils each and got 48 total. Write and solve an equation for the number of packs p.", answer: "6p = 48; p = 8", why: "6 pencils per pack times p packs equals 48, so 6p = 48; p = 8." }
        ]
      },
      {
        code: "6.EE.B.8",
        title: "Write & Graph Inequalities",
        icon: "📏",
        summary: "Write inequalities of the form x > c or x < c for real-world constraints and graph them on a number line.",
        vocab: [
          { term: "inequality", def: "A statement comparing values with >, <, ≥, or ≤." },
          { term: "greater than (>)", def: "Larger than; x > 4 means x is any number bigger than 4." },
          { term: "less than (<)", def: "Smaller than; x < 4 means x is any number smaller than 4." },
          { term: "open circle", def: "A hollow dot on a number line showing the endpoint is NOT included (used for > or <)." },
          { term: "at least / at most", def: "'At least' means ≥ (that value or more); 'at most' means ≤ (that value or less)." }
        ],
        needToKnow: [
          "x > c and x < c have infinitely many solutions, not just one number.",
          "Graph with an OPEN circle on c for > or < because c itself is not included.",
          "For x > c, shade to the RIGHT (larger numbers); for x < c, shade to the LEFT (smaller numbers).",
          "'More than' means >, 'less than' means <, 'fewer than' means <.",
          "'At least' means ≥ and 'at most' means ≤, which use a CLOSED (filled) circle.",
          "Read the arrow direction from the variable: x > 5 points the shading toward bigger numbers."
        ],
        workedExample: {
          problem: "A ride requires riders to be more than 48 inches tall. Write and graph an inequality for the allowed height h.",
          steps: [
            "'More than 48' means h is greater than 48: h > 48.",
            "Place an open circle at 48 because exactly 48 is not allowed.",
            "Shade the line to the right of 48 to show all heights greater than 48."
          ],
          answer: "h > 48; open circle at 48, shaded right"
        },
        guided: [
          { problem: "Write an inequality for 'a number x is less than 10' and describe its graph.", hint: "'Less than' uses < and shades toward smaller numbers.", answer: "x < 10; open circle at 10, shaded left" },
          { problem: "A savings goal needs more than $25. Write an inequality for amount m.", hint: "'More than' means greater than.", answer: "m > 25" },
          { problem: "Graph x > 3: filled or open circle, and which way do you shade?", hint: "> uses an open circle; shade toward larger numbers.", answer: "Open circle at 3, shaded right" }
        ],
        independent: [
          { problem: "Write an inequality for 'x is greater than 7.'", answer: "x > 7" },
          { problem: "Write an inequality for 'a number n is fewer than 12.'", answer: "n < 12" },
          { problem: "For x < 5, is the circle open or closed?", answer: "Open" },
          { problem: "A speed limit allows speeds at most 35 mph. Write an inequality for speed s.", answer: "s ≤ 35" },
          { problem: "For x > 0, which direction do you shade?", answer: "Right (toward larger numbers)" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which inequality means 'a number x is greater than 6'?", choices: ["x < 6", "x > 6", "x = 6", "x ≤ 6"], answer: "B", why: "'Greater than 6' is written x > 6, with an open circle at 6." },
          { type: "multiple-choice", prompt: "The graph of x < 4 has which features?", choices: ["Closed circle at 4, shaded right", "Open circle at 4, shaded right", "Open circle at 4, shaded left", "Closed circle at 4, shaded left"], answer: "C", why: "x < 4 uses an open circle (4 not included) and shades left toward smaller numbers." },
          { type: "short", prompt: "To enter a contest, players must be younger than 13. Write an inequality for the age a.", answer: "a < 13", why: "'Younger than 13' means a is less than 13, with an open circle at 13 and shading left." }
        ]
      },
      {
        code: "6.EE.C.9",
        title: "Dependent & Independent Variables",
        icon: "📊",
        summary: "Represent relationships between two quantities using equations, tables, and graphs, identifying dependent and independent variables.",
        vocab: [
          { term: "independent variable", def: "The input quantity that you choose or that changes on its own (often x), like number of hours." },
          { term: "dependent variable", def: "The output quantity that depends on the input (often y), like total cost." },
          { term: "equation", def: "A rule relating two variables, like y = 8x, that lets you find one value from the other." },
          { term: "input/output table", def: "A table that pairs each input value with its matching output value." }
        ],
        needToKnow: [
          "The independent variable is the input; the dependent variable depends on (changes because of) it.",
          "Write the rule as dependent = (something) × independent, like cost c = 8h.",
          "A table lists matching input/output pairs you get by using the equation.",
          "On a graph, the independent variable goes on the x-axis and the dependent on the y-axis.",
          "Find the rule by checking what you do to each input to get its output.",
          "Example: if y = 5x, then when x = 3, y = 15 (substitute the input)."
        ],
        workedExample: {
          problem: "A worker earns $8 per hour. Write an equation, identify the variables, and find earnings for 6 hours.",
          steps: [
            "Earnings depend on hours, so hours h is independent and earnings c is dependent: c = 8h.",
            "Substitute h = 6: c = 8 × 6.",
            "Multiply: c = 48, so 6 hours earns $48."
          ],
          answer: "c = 8h; independent h, dependent c; $48 for 6 hours"
        },
        guided: [
          { problem: "Tickets cost $5 each. Write an equation relating total cost c to number of tickets t.", hint: "Cost depends on how many tickets; multiply price by t.", answer: "c = 5t" },
          { problem: "In d = 60t (distance in miles, t in hours), which variable is independent?", hint: "The input you choose is independent; distance depends on time.", answer: "t (time) is independent" },
          { problem: "For y = 3x, complete the pair when x = 4.", hint: "Substitute 4 for x and multiply.", answer: "y = 12" }
        ],
        independent: [
          { problem: "A book has 9 chapters per part. Write an equation for total chapters c with p parts.", answer: "c = 9p" },
          { problem: "For y = 7x, find y when x = 5.", answer: "y = 35" },
          { problem: "In c = 2.5g (cost for g gallons), which variable is dependent?", answer: "c (cost) is dependent" },
          { problem: "A plant grows 2 cm per week. Write an equation for height h after w weeks.", answer: "h = 2w" },
          { problem: "For y = 4x, complete the table pair when x = 6.", answer: "y = 24" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A printer makes 12 pages per minute. Which equation relates pages p to minutes m?", choices: ["p = m + 12", "p = 12m", "m = 12p", "p = 12 + m"], answer: "B", why: "Pages equal 12 times the number of minutes, so p = 12m." },
          { type: "multiple-choice", prompt: "In y = 6x, if x is the number of boxes and y is total items, which is the independent variable?", choices: ["y, because it is the total", "x, because it is the input you choose", "both x and y", "neither variable"], answer: "B", why: "x (boxes) is the input you select; y depends on x, so x is independent." },
          { type: "short", prompt: "A pool fills at 10 gallons per minute. Write an equation for gallons g after t minutes, then find gallons after 7 minutes.", answer: "g = 10t; 70 gallons", why: "Gallons equal 10 times minutes, so g = 10t; substituting t = 7 gives 70." }
        ]
      }
    ]
  },
  {
    domain: "G",
    domainTitle: "Geometry",
    slug: "geometry",
    icon: "📐",
    color: "B97A12",
    skills: [
      {
        code: "6.G.A.1",
        title: "Area of Triangles & Quadrilaterals",
        icon: "📐",
        summary: "Find the area of triangles, special quadrilaterals, and composite shapes by using formulas and breaking shapes into pieces.",
        vocab: [
          { term: "area", def: "The amount of flat space inside a 2D shape, measured in square units (like square feet, ft²)." },
          { term: "base", def: "A side of a shape you measure from. The height is measured straight up (perpendicular) from the base." },
          { term: "height", def: "The straight-line distance from the base to the top, making a square corner (90°) with the base." },
          { term: "composite figure", def: "A shape made of two or more simple shapes (like a rectangle plus a triangle) joined together." },
          { term: "decompose", def: "To break a shape apart into smaller, simpler shapes that are easier to measure." }
        ],
        needToKnow: [
          "Area of a triangle = 1/2 × base × height. Always use the height that makes a square corner with the base.",
          "Area of a parallelogram = base × height (not the slanted side length).",
          "Area of a trapezoid = 1/2 × (base₁ + base₂) × height, where the two bases are the parallel sides.",
          "For a composite figure, decompose it into rectangles and triangles, find each area, then add them together.",
          "The height is always perpendicular (square corner) to the base, even if drawn inside or outside the shape.",
          "Area is always written in square units, such as cm², in², or m²."
        ],
        workedExample: {
          problem: "A triangle has a base of 12 cm and a height of 5 cm. What is its area?",
          steps: [
            "Write the formula: Area = 1/2 × base × height.",
            "Put in the numbers: Area = 1/2 × 12 × 5.",
            "Multiply 12 × 5 = 60, then take half: 1/2 × 60 = 30."
          ],
          answer: "30 cm²"
        },
        guided: [
          { problem: "A parallelogram has a base of 9 in and a height of 6 in. Find the area.", hint: "For a parallelogram, multiply base × height. Do not use the slanted side.", answer: "54 in²" },
          { problem: "A trapezoid has parallel sides (bases) of 10 m and 6 m, and a height of 4 m. Find the area.", hint: "Add the two bases first, then use 1/2 × (sum) × height.", answer: "32 m²" },
          { problem: "A composite figure is a rectangle 8 ft long and 5 ft tall, with a triangle on top with a base of 8 ft and a height of 3 ft. Find the total area.", hint: "Find the rectangle area and the triangle area separately, then add.", answer: "52 ft²" }
        ],
        independent: [
          { problem: "A triangle has a base of 14 cm and a height of 9 cm. Find the area.", answer: "63 cm²" },
          { problem: "A parallelogram has a base of 11 m and a height of 7 m. Find the area.", answer: "77 m²" },
          { problem: "A trapezoid has bases of 12 in and 8 in and a height of 5 in. Find the area.", answer: "50 in²" },
          { problem: "A triangle has a base of 7 ft and a height of 6 ft. Find the area.", answer: "21 ft²" },
          { problem: "A composite figure is a 10 cm by 4 cm rectangle with a triangle on one short end; the triangle has a base of 4 cm and a height of 6 cm. Find the total area.", answer: "52 cm²" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A triangle has a base of 16 in and a height of 5 in. What is its area?", choices: ["21 in²", "40 in²", "80 in²", "160 in²"], answer: "B", why: "Area = 1/2 × 16 × 5 = 1/2 × 80 = 40 in²." },
          { type: "multiple-choice", prompt: "A trapezoid has parallel bases of 9 cm and 5 cm and a height of 6 cm. What is its area?", choices: ["42 cm²", "70 cm²", "84 cm²", "270 cm²"], answer: "A", why: "Area = 1/2 × (9 + 5) × 6 = 1/2 × 14 × 6 = 42 cm²." },
          { type: "short", prompt: "A garden is a 12 m by 5 m rectangle with a triangle attached to one 12 m side. The triangle has a base of 12 m and a height of 4 m. What is the total area?", answer: "84 m²", why: "Rectangle = 60 m²; triangle = 1/2 × 12 × 4 = 24 m²; total = 84 m²." }
        ]
      },
      {
        code: "6.G.A.2",
        title: "Volume with Fractional Edge Lengths",
        icon: "🧊",
        summary: "Find the volume of right rectangular prisms, including ones with fraction or mixed-number edge lengths, using V = l·w·h and V = B·h.",
        vocab: [
          { term: "volume", def: "The amount of space inside a 3D solid, measured in cubic units (like cubic inches, in³)." },
          { term: "rectangular prism", def: "A box-shaped solid with 6 flat rectangular faces (length, width, and height)." },
          { term: "unit cube", def: "A cube with each edge 1 unit long; its volume is 1 cubic unit." },
          { term: "base area (B)", def: "The area of the bottom face of a prism, found by length × width." }
        ],
        needToKnow: [
          "Volume of a rectangular prism = length × width × height (V = l·w·h).",
          "You can also use V = B·h, where B is the area of the base (length × width) and h is the height.",
          "Both formulas give the same answer because B = l·w, so B·h = l·w·h.",
          "To multiply mixed numbers, change them to improper fractions first (example: 4 1/2 = 9/2).",
          "Multiply across: top × top over bottom × bottom, then simplify or change back to a mixed number.",
          "Volume is always written in cubic units, such as cm³, in³, or m³."
        ],
        workedExample: {
          problem: "A box has a length of 4 1/2 in, a width of 3 in, and a height of 2 1/2 in. Find its volume.",
          steps: [
            "Change mixed numbers to improper fractions: 4 1/2 = 9/2 and 2 1/2 = 5/2.",
            "Use V = l·w·h: V = 9/2 × 3 × 5/2.",
            "Multiply: (9 × 3 × 5) / (2 × 2) = 135/4 = 33 3/4 in³."
          ],
          answer: "33 3/4 in³ (33.75 in³)"
        },
        guided: [
          { problem: "A prism has length 5 cm, width 2 cm, and height 1/2 cm. Find the volume.", hint: "Multiply 5 × 2 first, then multiply by 1/2.", answer: "5 cm³" },
          { problem: "A box has a base area B = 12 ft² and a height of 3 1/2 ft. Find the volume using V = B·h.", hint: "Change 3 1/2 to 7/2, then multiply 12 × 7/2.", answer: "42 ft³" },
          { problem: "A prism has length 3 1/2 in, width 2 in, and height 1 1/2 in. Find the volume.", hint: "Change to improper fractions: 7/2, 2/1, 3/2, then multiply all three.", answer: "10 1/2 in³" }
        ],
        independent: [
          { problem: "A box has length 6 m, width 4 m, and height 3 m. Find the volume.", answer: "72 m³" },
          { problem: "A prism has length 2 1/2 cm, width 4 cm, and height 3 cm. Find the volume.", answer: "30 cm³" },
          { problem: "A box has a base area of 15 in² and a height of 2 1/3 in. Use V = B·h.", answer: "35 in³" },
          { problem: "A prism has length 3/4 ft, width 2 ft, and height 4 ft. Find the volume.", answer: "6 ft³" },
          { problem: "A box has length 4 1/2 cm, width 2 1/2 cm, and height 2 cm. Find the volume.", answer: "22 1/2 cm³" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A rectangular prism has length 3 in, width 2 in, and height 1 1/2 in. What is its volume?", choices: ["6 in³", "6 1/2 in³", "9 in³", "12 in³"], answer: "C", why: "V = 3 × 2 × 3/2 = 6 × 3/2 = 18/2 = 9 in³." },
          { type: "multiple-choice", prompt: "A storage bin has a base area of 8 ft² and a height of 4 1/2 ft. What is its volume?", choices: ["12 1/2 ft³", "18 ft³", "32 ft³", "36 ft³"], answer: "D", why: "V = B·h = 8 × 9/2 = 72/2 = 36 ft³." },
          { type: "short", prompt: "A jewelry box is 2 1/2 in long, 2 in wide, and 1 1/2 in tall. What is its volume?", answer: "7 1/2 in³", why: "V = 5/2 × 2 × 3/2 = 30/4 = 7 1/2 in³." }
        ]
      },
      {
        code: "6.G.A.3",
        title: "Polygons in the Coordinate Plane",
        icon: "📍",
        summary: "Plot polygon vertices on the coordinate plane and find side lengths when points share an x- or y-value.",
        vocab: [
          { term: "coordinate plane", def: "A grid made by a horizontal x-axis and a vertical y-axis crossing at the origin (0, 0)." },
          { term: "ordered pair", def: "Two numbers (x, y) that name a point's location: x tells left/right, y tells up/down." },
          { term: "vertex", def: "A corner point of a polygon where two sides meet (plural: vertices)." },
          { term: "polygon", def: "A closed 2D shape with straight sides, such as a triangle, rectangle, or pentagon." }
        ],
        needToKnow: [
          "A point (x, y) is found by moving x units left/right from the origin, then y units up/down.",
          "If two points share the same y-value, the side is horizontal; its length = the difference of the x-values.",
          "If two points share the same x-value, the side is vertical; its length = the difference of the y-values.",
          "To find a length, subtract the smaller coordinate from the larger one (or count grid units between them).",
          "When points are on opposite sides of 0, the distance is the sum of the absolute values (from −3 to 7 is 10 units).",
          "Add up the side lengths to find the perimeter of a polygon."
        ],
        workedExample: {
          problem: "A rectangle has vertices A(−3, 2), B(7, 2), C(7, −1), and D(−3, −1). Find the length of side AB and side BC.",
          steps: [
            "AB: A and B share y = 2, so it is horizontal. Length = 7 − (−3) = 10 units.",
            "BC: B and C share x = 7, so it is vertical. Length = 2 − (−1) = 3 units.",
            "So AB = 10 units and BC = 3 units."
          ],
          answer: "AB = 10 units, BC = 3 units"
        },
        guided: [
          { problem: "Points P(2, 5) and Q(2, 1) are two vertices of a polygon. How long is side PQ?", hint: "Same x-value means a vertical side; subtract the y-values.", answer: "4 units" },
          { problem: "Points M(−4, 3) and N(6, 3) are connected. How long is side MN?", hint: "Same y-value; the points are on opposite sides of 0, so add 4 + 6.", answer: "10 units" },
          { problem: "A square has vertices (1, 1), (1, 6), (6, 6), and (6, 1). What is the length of one side?", hint: "Pick two vertices that share an x- or y-value and find the difference.", answer: "5 units" }
        ],
        independent: [
          { problem: "Find the length of the side joining (3, 8) and (3, 2).", answer: "6 units" },
          { problem: "Find the length of the side joining (−5, 4) and (4, 4).", answer: "9 units" },
          { problem: "A rectangle has vertices (−2, 5), (6, 5), (6, −3), and (−2, −3). Find its length and width.", answer: "8 units by 8 units (it is a square)" },
          { problem: "Find the perimeter of a rectangle with vertices (0, 0), (9, 0), (9, 4), and (0, 4).", answer: "26 units" },
          { problem: "Points (−6, −2) and (5, −2) are two vertices. How far apart are they?", answer: "11 units" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A side of a polygon connects the points (−4, 1) and (8, 1). What is the length of this side?", choices: ["4 units", "8 units", "12 units", "32 units"], answer: "C", why: "Same y-value, so it is horizontal. From −4 to 8 is 8 − (−4) = 12 units." },
          { type: "multiple-choice", prompt: "A rectangle has vertices (2, 7), (2, −1), (5, −1), and (5, 7). What is its perimeter?", choices: ["11 units", "16 units", "22 units", "24 units"], answer: "C", why: "Vertical sides = 8 units; horizontal sides = 3 units. Perimeter = 8 + 8 + 3 + 3 = 22 units." },
          { type: "short", prompt: "A triangle has vertices A(1, 2), B(1, 9), and C(6, 2). Find the length of vertical side AB and horizontal side AC.", answer: "AB = 7 units, AC = 5 units", why: "A and B share x = 1 (AB = 9 − 2 = 7); A and C share y = 2 (AC = 6 − 1 = 5)." }
        ]
      },
      {
        code: "6.G.A.4",
        title: "Surface Area Using Nets",
        icon: "📦",
        summary: "Use nets to find the surface area of prisms and pyramids by finding the area of every face and adding them.",
        vocab: [
          { term: "net", def: "A flat (2D) pattern that folds up to make a 3D solid; it shows every face laid out flat." },
          { term: "surface area", def: "The total area of all the faces (outside surfaces) of a 3D solid, in square units." },
          { term: "face", def: "One of the flat surfaces of a 3D solid, such as one side of a box." },
          { term: "slant height", def: "On a pyramid, the height of a triangular face measured from the base edge to the top point." }
        ],
        needToKnow: [
          "Surface area = the sum of the areas of all the faces. A net helps you see and count every face.",
          "A rectangular prism has 6 faces in 3 matching pairs: surface area = 2(lw + lh + wh).",
          "A cube has 6 equal square faces: surface area = 6 × (edge × edge).",
          "A triangular prism has 2 triangle faces plus 3 rectangle faces; add all 5 areas.",
          "A square pyramid has 1 square base plus 4 triangles: area = base + 4 × (1/2 × base edge × slant height).",
          "Surface area is always written in square units, such as cm², in², or m²."
        ],
        workedExample: {
          problem: "A rectangular prism (box) is 5 cm long, 3 cm wide, and 4 cm tall. Find its surface area.",
          steps: [
            "Find the three different face areas: lw = 15, lh = 20, wh = 12.",
            "Each face has a matching pair, so add them: 15 + 20 + 12 = 47.",
            "Surface area = 2 × 47 = 94 cm²."
          ],
          answer: "94 cm²"
        },
        guided: [
          { problem: "A cube has edges of 7 in. Find its surface area.", hint: "All 6 faces are equal squares: 6 × (7 × 7).", answer: "294 in²" },
          { problem: "A square pyramid has a base 6 m on each side and a slant height of 5 m. Find the surface area.", hint: "Base area = 6 × 6. Each triangle = 1/2 × 6 × 5; there are 4 of them.", answer: "96 m²" },
          { problem: "A triangular prism has two triangular faces, each with a base of 6 ft and a height of 4 ft. Find the combined area of just the two triangle faces.", hint: "One triangle = 1/2 × 6 × 4; you need two of them.", answer: "24 ft²" }
        ],
        independent: [
          { problem: "A rectangular prism is 6 cm by 2 cm by 3 cm. Find its surface area.", answer: "72 cm²" },
          { problem: "A cube has edges of 5 in. Find its surface area.", answer: "150 in²" },
          { problem: "A square pyramid has a base 8 m on each side and a slant height of 6 m. Find its surface area.", answer: "160 m²" },
          { problem: "A rectangular prism is 10 in by 4 in by 4 in. Find its surface area.", answer: "192 in²" },
          { problem: "A box is 2 cm by 2 cm by 9 cm. Find its surface area.", answer: "80 cm²" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A cube has edges of 4 cm. What is its surface area?", choices: ["16 cm²", "64 cm²", "96 cm²", "384 cm²"], answer: "C", why: "A cube has 6 equal faces: 6 × (4 × 4) = 6 × 16 = 96 cm²." },
          { type: "multiple-choice", prompt: "A rectangular prism is 5 in long, 2 in wide, and 3 in tall. What is its surface area?", choices: ["30 in²", "31 in²", "47 in²", "62 in²"], answer: "D", why: "Surface area = 2(lw + lh + wh) = 2(10 + 15 + 6) = 2 × 31 = 62 in²." },
          { type: "short", prompt: "A square pyramid has a base 10 ft on each side and a slant height of 4 ft. Find the total surface area.", answer: "180 ft²", why: "Base = 100 ft²; four triangles = 4 × (1/2 × 10 × 4) = 80 ft²; total = 180 ft²." }
        ]
      }
    ]
  },
  {
    domain: "SP",
    domainTitle: "Statistics & Probability",
    slug: "statistics",
    icon: "📊",
    color: "C0392B",
    skills: [
      {
        code: "6.SP.A.1",
        title: "Recognize Statistical Questions",
        icon: "📊",
        summary: "A statistical question is one you expect to get different answers (variability) when you collect data.",
        vocab: [
          { term: "statistical question", def: "A question you answer by collecting data and that you expect to have a range of different answers." },
          { term: "data", def: "Information you collect, often as numbers, to answer a question." },
          { term: "variability", def: "How much the answers or values differ from one another." },
          { term: "non-statistical question", def: "A question with one single, fixed answer (no variability)." }
        ],
        needToKnow: [
          "A statistical question expects MANY different answers, not just one.",
          "Ask yourself: 'Would the answer change from person to person (or day to day)?' If yes, it is statistical.",
          "'How old am I?' has one answer, so it is NOT statistical.",
          "'How old are the students in my class?' has many answers, so it IS statistical.",
          "Words like 'on average', 'typical', or 'range' often signal a statistical question.",
          "A question about one specific thing at one specific time is usually non-statistical."
        ],
        workedExample: {
          problem: "Is 'How tall are the players on the basketball team?' a statistical question? Explain.",
          steps: [
            "Ask: will every player have the same height? No, heights will vary.",
            "Because the answers vary from player to player, we expect a range of data.",
            "A question that expects varying answers is a statistical question."
          ],
          answer: "Yes, because the players' heights will vary."
        },
        guided: [
          { problem: "Is 'How many pets does Maria have?' statistical or not?", hint: "Is there one answer or many?", answer: "Not statistical — it has one single answer for Maria." },
          { problem: "Is 'How many pets do students in Grade 6 have?' statistical or not?", hint: "Would different students give different answers?", answer: "Statistical — answers will vary from student to student." },
          { problem: "Rewrite 'What is my shoe size?' so it becomes a statistical question.", hint: "Make it about a whole group, not just you.", answer: "Example: 'What are the shoe sizes of students in my class?'" }
        ],
        independent: [
          { problem: "Is 'How many minutes did I sleep last night?' statistical? Yes or no.", answer: "No — one fixed answer." },
          { problem: "Is 'How many minutes do sixth graders sleep each night?' statistical? Yes or no.", answer: "Yes — answers vary from person to person." },
          { problem: "Is 'What color is my backpack?' statistical? Yes or no.", answer: "No — one fixed answer." },
          { problem: "Is 'How many books did each student in the class read this month?' statistical? Yes or no.", answer: "Yes — answers vary from student to student." },
          { problem: "Rewrite 'How tall is my teacher?' as a statistical question.", answer: "Example: 'How tall are the teachers at my school?'" }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which of these is a statistical question?", choices: ["How many days are in June?", "How many hours of TV do students in Grade 6 watch each day?", "What time does school start?", "How many wheels are on a car?"], answer: "B", why: "Only B expects a range of different answers (variability); the others each have one fixed answer." },
          { type: "multiple-choice", prompt: "Why is 'How many siblings does each student in my class have?' a statistical question?", choices: ["It can only have one answer.", "It is about the teacher only.", "The answers will vary from student to student.", "It cannot be answered with data."], answer: "C", why: "A statistical question is expected to produce varying answers across the group." },
          { type: "short", prompt: "Explain why 'What is the height of the tallest tree in the park?' is NOT a statistical question.", answer: "It has one single, fixed answer, so there is no variability.", why: "There is only one tallest tree with one height, so we do not expect a range of answers." }
        ]
      },
      {
        code: "6.SP.A.2",
        title: "Describe a Distribution",
        icon: "📈",
        summary: "Describe a set of data by its center, its spread, and its overall shape.",
        vocab: [
          { term: "distribution", def: "The way data values are spread out or grouped across all the possible values." },
          { term: "center", def: "A single value that is 'typical' for the data, such as the mean or median." },
          { term: "spread", def: "How far apart the data values are; also called variability." },
          { term: "shape", def: "The overall pattern of the data, such as symmetric, skewed, or having clusters or peaks." },
          { term: "outlier", def: "A value that is much higher or much lower than most of the data." }
        ],
        needToKnow: [
          "To describe a distribution, always talk about CENTER, SPREAD, and SHAPE.",
          "Center = what is typical (mean or median).",
          "Spread = how much the values vary (range, IQR, or MAD).",
          "Shape words: symmetric (balanced both sides), skewed (a tail pulls one way), peaks, gaps, and clusters.",
          "An outlier is far from the rest of the data and can pull the mean toward it.",
          "Skewed right = tail goes toward larger values; skewed left = tail goes toward smaller values."
        ],
        workedExample: {
          problem: "A dot plot of pets per student shows: 0,1,1,2,2,2,3,3,4,5. Describe its center, spread, and shape.",
          steps: [
            "Center: the data piles up most at 2 (the peak), and the median is 2, so a typical value is about 2 pets.",
            "Spread: values run from 0 to 5, so the range is 5 − 0 = 5.",
            "Shape: most values are small with a tail stretching to 5, so it is skewed right."
          ],
          answer: "Center ≈ 2 pets, range = 5, shape is skewed right."
        },
        guided: [
          { problem: "Data: 1,2,2,2,3 — what is the shape near the center?", hint: "Where does the data pile up?", answer: "It peaks at 2 and is fairly symmetric around 2." },
          { problem: "Data: 1,1,1,2,9 — name the value that is an outlier.", hint: "Which value is far from the rest?", answer: "9 is an outlier; it is much larger than the others." },
          { problem: "Data: 2,3,3,4,4,4,9 — is it skewed left or right?", hint: "Which side has the long tail toward the extreme value?", answer: "Skewed right — the tail stretches toward the larger value 9." }
        ],
        independent: [
          { problem: "Data: 5,6,6,6,7,7,8. Is the shape roughly symmetric or skewed?", answer: "Roughly symmetric — balanced around the peak at 6." },
          { problem: "Data: 10,11,11,12,20. Identify the outlier.", answer: "20 is the outlier." },
          { problem: "Data: 1,5,5,5,5,6. Where is the peak (most common value)?", answer: "The peak is at 5." },
          { problem: "Data: 2,2,3,3,4,15. Skewed left or skewed right?", answer: "Skewed right (tail toward 15)." },
          { problem: "Data: 3,4,4,5,5,5,6,6,7. Give the range as a measure of spread.", answer: "Range = 7 − 3 = 4." }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A distribution has a long tail stretching toward the high values. How is it described?", choices: ["Symmetric", "Skewed left", "Skewed right", "Has no shape"], answer: "C", why: "When the tail points toward larger values, the distribution is skewed right." },
          { type: "multiple-choice", prompt: "Which three things should you describe about a distribution?", choices: ["Color, size, weight", "Center, spread, shape", "Mean only", "Mode and color"], answer: "B", why: "A distribution is described by its center, spread, and overall shape." },
          { type: "short", prompt: "Data set: 4,4,5,5,5,6,18. Name the outlier and tell how it affects the shape.", answer: "18 is the outlier; it makes the distribution skewed right.", why: "18 is far above the rest, creating a tail toward the high end (skewed right)." }
        ]
      },
      {
        code: "6.SP.A.3",
        title: "Center vs. Variability",
        icon: "⚖️",
        summary: "Measures of center (mean, median) tell what is typical; measures of variability (range, IQR, MAD) tell how spread out the data is.",
        vocab: [
          { term: "mean", def: "The average: add all values, then divide by how many values there are." },
          { term: "median", def: "The middle value when the data is in order (average the two middle values if the count is even)." },
          { term: "range", def: "The largest value minus the smallest value." },
          { term: "interquartile range (IQR)", def: "Q3 minus Q1; the spread of the middle half of the data." },
          { term: "mean absolute deviation (MAD)", def: "The average distance of each value from the mean." }
        ],
        needToKnow: [
          "A SINGLE measure of center (mean or median) summarizes the whole data set with one typical value.",
          "A SINGLE measure of variability (range, IQR, or MAD) summarizes how spread out the data is with one number.",
          "Mean = sum of values ÷ number of values.",
          "Median: put values in order, find the middle; for an even count, average the two middle values.",
          "IQR: find the median, then Q1 (median of lower half) and Q3 (median of upper half); IQR = Q3 − Q1.",
          "MAD: find the mean, then average how far each value is from the mean (use positive distances)."
        ],
        workedExample: {
          problem: "Data: 4, 8, 6, 10, 2. Find the mean, median, and range.",
          steps: [
            "Mean: 4+8+6+10+2 = 30, then 30 ÷ 5 = 6.",
            "Median: order the values → 2,4,6,8,10; the middle value is 6.",
            "Range: largest − smallest = 10 − 2 = 8."
          ],
          answer: "Mean = 6, Median = 6, Range = 8."
        },
        guided: [
          { problem: "Data: 4,6,9,11,15. Find the IQR.", hint: "Median is 9; lower half is 4,6 and upper half is 11,15.", answer: "Q1 = 5, Q3 = 13, so IQR = 8." },
          { problem: "Data: 2,4,6,8,10. The mean is 6. Find the MAD.", hint: "Distances from 6 are 4,2,0,2,4. Add them and divide by 5.", answer: "Sum = 12; MAD = 12 ÷ 5 = 2.4." },
          { problem: "Data: 3,5,5,7,10. Find the mean and the median.", hint: "Sum is 30; the middle value in order is the 3rd one.", answer: "Mean = 6; Median = 5." }
        ],
        independent: [
          { problem: "Data: 7,7,8,10,13. Find the mean.", answer: "Mean = 45 ÷ 5 = 9." },
          { problem: "Data: 12,15,11,14,18,10. Find the median.", answer: "Order: 10,11,12,14,15,18; median = (12+14)/2 = 13." },
          { problem: "Data: 5,9,12,4,20. Find the range.", answer: "Range = 20 − 4 = 16." },
          { problem: "Data: 3,5,7,8,12,14,18,20. Find the IQR.", answer: "Median = 10, Q1 = 6, Q3 = 16, IQR = 10." },
          { problem: "Data: 1,3,5,7,9. The mean is 5. Find the MAD.", answer: "Distances 4,2,0,2,4 sum to 12; MAD = 2.4." }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which of these is a measure of variability (spread)?", choices: ["Mean", "Median", "Mode", "Interquartile range"], answer: "D", why: "The IQR measures spread; mean, median, and mode are measures of center." },
          { type: "multiple-choice", prompt: "Data: 6, 10, 8, 12, 4. What is the mean?", choices: ["8", "10", "6", "12"], answer: "A", why: "6+10+8+12+4 = 40, and 40 ÷ 5 = 8." },
          { type: "short", prompt: "Data: 2, 5, 5, 8, 10. Find the median and the range.", answer: "Median = 5, Range = 8.", why: "In order 2,5,5,8,10 the middle value is 5; range = 10 − 2 = 8." }
        ]
      },
      {
        code: "6.SP.B.4",
        title: "Display Data: Dot Plots, Histograms & Box Plots",
        icon: "📉",
        summary: "Numerical data can be shown with dot plots, histograms, and box plots, each useful for seeing center, spread, and shape.",
        vocab: [
          { term: "dot plot", def: "A graph that shows each data value as a dot above a number line." },
          { term: "histogram", def: "A bar graph that shows how many values fall into equal intervals (bins); bars touch." },
          { term: "box plot", def: "A graph that shows the minimum, Q1, median, Q3, and maximum (the five-number summary)." },
          { term: "frequency", def: "How many times a value or interval occurs in the data." },
          { term: "five-number summary", def: "The minimum, Q1, median, Q3, and maximum of a data set." }
        ],
        needToKnow: [
          "Dot plot: one dot per data value; tall stacks show the most common values. Best for small data sets.",
          "Histogram: bars show how many values fall in each equal interval (bin); the bars touch and you read frequency.",
          "Box plot: the box goes from Q1 to Q3, a line inside marks the median, and 'whiskers' reach the min and max.",
          "In a box plot, the box length is the IQR and the whisker ends show the full range.",
          "Dot plots and histograms show shape (peaks, gaps, skew); box plots show spread by quarters.",
          "To make any display, first order the data and find the values you need (counts, bins, or the five-number summary)."
        ],
        workedExample: {
          problem: "Data (minutes read): 10,12,15,15,18,20,22,25,25,28,30,35. Find the five-number summary for a box plot.",
          steps: [
            "12 values. Median = average of 6th and 7th values = (20+22)/2 = 21.",
            "Lower half (first 6): 10,12,15,15,18,20 → Q1 = (15+15)/2 = 15.",
            "Upper half (last 6): 22,25,25,28,30,35 → Q3 = (25+28)/2 = 26.5; min = 10, max = 35."
          ],
          answer: "Min 10, Q1 15, Median 21, Q3 26.5, Max 35."
        },
        guided: [
          { problem: "For a dot plot of 3,3,4,4,4,5, which value has the tallest stack?", hint: "Which value appears most often?", answer: "4 — it appears 3 times, the tallest stack." },
          { problem: "A histogram has bins 0–9, 10–19, 20–29. The value 14 goes in which bin?", hint: "Which interval contains 14?", answer: "The 10–19 bin." },
          { problem: "Data: 2,4,6,8,10,12. Find the median for a box plot.", hint: "Six values: average the 3rd and 4th.", answer: "Median = (6+8)/2 = 7." }
        ],
        independent: [
          { problem: "Data: 1,2,2,3,3,3,4. For a dot plot, how many dots go above the value 3?", answer: "3 dots." },
          { problem: "Histogram bins 0–4, 5–9, 10–14. In which bin does the value 9 belong?", answer: "The 5–9 bin." },
          { problem: "Data: 5,7,9,11,13. Find the median for a box plot.", answer: "Median = 9 (the middle value)." },
          { problem: "Data: 4,6,8,10,12,14,16,18. Find Q1 and Q3 for a box plot.", answer: "Median = 11; Q1 = 7, Q3 = 15." },
          { problem: "Which display best shows each individual data value for a small set of 8 numbers — a dot plot or a histogram?", answer: "A dot plot, because it shows every single value as a dot." }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "Which display groups data into equal intervals and uses bars that touch?", choices: ["Dot plot", "Histogram", "Box plot", "Number line"], answer: "B", why: "A histogram bins data into equal intervals with touching bars showing frequency." },
          { type: "multiple-choice", prompt: "In a box plot, what does the line inside the box represent?", choices: ["The mean", "The median", "The maximum", "The range"], answer: "B", why: "The line inside the box marks the median; the box edges are Q1 and Q3." },
          { type: "short", prompt: "Data: 8,10,12,14,16,18. Give the five-number summary for a box plot.", answer: "Min 8, Q1 10, Median 13, Q3 16, Max 18.", why: "Median = (12+14)/2 = 13; lower half gives Q1 = 10; upper half gives Q3 = 16." }
        ]
      },
      {
        code: "6.SP.B.5",
        title: "Summarize a Data Set in Context",
        icon: "📝",
        summary: "A full summary reports the count, what was measured and its units, measures of center and spread, and what they mean in context.",
        vocab: [
          { term: "attribute", def: "The thing being measured or counted in a data set (for example, number of books)." },
          { term: "units", def: "The measurement label, such as books, minutes, or centimeters." },
          { term: "count", def: "How many data values (observations) were collected." },
          { term: "context", def: "The real-world situation the data comes from, which gives the numbers meaning." }
        ],
        needToKnow: [
          "A complete summary tells: (1) how many values, (2) what was measured and the units, (3) a measure of center, (4) a measure of variability, and (5) what it all means in context.",
          "Choose the median and IQR when there are outliers or skew; choose the mean and MAD when data is fairly symmetric.",
          "Always include the units so the numbers make sense (e.g., 'a typical student read 4 books').",
          "Center answers 'What is typical?'; spread answers 'How much do values differ?'",
          "Explain the measure in plain words tied to the situation, not just a number.",
          "An outlier can make the mean misleading, so the median may better describe a typical value."
        ],
        workedExample: {
          problem: "Eight students recorded books read: 2,3,3,4,4,4,5,7. Summarize the data.",
          steps: [
            "Count and attribute: 8 students; the attribute is number of books read (units = books).",
            "Center: mean = 32 ÷ 8 = 4 books; median = (4+4)/2 = 4 books.",
            "Spread: range = 7 − 2 = 5 books. In context, a typical student read about 4 books."
          ],
          answer: "8 students; center = 4 books (mean and median); range = 5 books."
        },
        guided: [
          { problem: "Data (ages in years): 11,12,12,12,13. State the count and the attribute with units.", hint: "How many values, and what is being measured?", answer: "Count = 5 students; attribute = age in years." },
          { problem: "For 11,12,12,12,13, find the mean (center) in years.", hint: "Sum is 60; divide by 5.", answer: "Mean = 12 years." },
          { problem: "Data: 4,4,5,5,30 (minutes). Should you use mean or median to describe a typical value? Why?", hint: "Is there an outlier?", answer: "Median (= 5 minutes), because the outlier 30 pulls the mean too high." }
        ],
        independent: [
          { problem: "Data (pets): 0,1,1,2,2,2,3. State the count and the units.", answer: "Count = 7 students; units = pets." },
          { problem: "Data (minutes): 6,8,10,12,14. Find the mean and the units.", answer: "Mean = 10 minutes." },
          { problem: "Data (points): 8,8,9,10,10,11. Find the median.", answer: "Median = (9+10)/2 = 9.5 points." },
          { problem: "Data (hours): 2,3,3,4,4,4,5. Find the range and state its meaning.", answer: "Range = 3 hours; values differ by 3 hours from least to most." },
          { problem: "Data (steps): 100,100,100,100,900. Which measure of center best describes a typical value, mean or median? Why?", answer: "Median = 100 steps; the outlier 900 makes the mean misleading." }
        ],
        mcapItems: [
          { type: "multiple-choice", prompt: "A data set of test scores has one very low outlier. Which pair best describes a typical score and its spread?", choices: ["Mean and MAD", "Median and IQR", "Mode and range", "Mean and range"], answer: "B", why: "With an outlier, the median and IQR resist extremes and best describe center and spread." },
          { type: "multiple-choice", prompt: "Data (books): 1,2,2,3,3,3,4,5. What is the median number of books?", choices: ["2", "2.5", "3", "3.5"], answer: "C", why: "With 8 values, the median is the average of the 4th and 5th values: (3+3)/2 = 3." },
          { type: "short", prompt: "Data (minutes of exercise): 10,10,15,20,25,30. Give the count, mean, and range with units.", answer: "Count = 6; mean ≈ 18.3 minutes; range = 20 minutes.", why: "Sum is 110 over 6 values for the mean; range is 30 − 10 = 20 minutes." }
        ]
      }
    ]
  }
];

// Convenience: flat list of every skill with its domain attached.
export const ALL_SKILLS = DOMAINS.flatMap((d) =>
  d.skills.map((s) => ({ ...s, domain: d.domain, domainTitle: d.domainTitle, domainSlug: d.slug, domainColor: d.color }))
);

export function skillFileSlug(code) {
  return code.replace(/\./g, "-").toLowerCase();
}

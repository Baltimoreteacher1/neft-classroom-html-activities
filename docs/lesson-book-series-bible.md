# Lesson Book Series Bible (Units 2–9), v2

Goal: one graphic novel per lesson (70 new books; 6-3 and 6-4 already exist in Axiom City), each its own episode with
its own stakes. A new cast and a new "show" per unit. Units 1 and 10 are out of scope.

v2 replaces the first draft, which read like a textbook. Worlds now come from what Grade 6 students watch, play and
talk about.

## Rules

1. **Each unit is a show.** One world, four kids with distinct personalities, one companion, a running gag, and a light
   season arc. Every book is a complete episode that works alone and may end on a one-panel teaser.
2. **The story has stakes and jokes.** Rivals, a bad plan, a public embarrassment, a prize, a glitch. Kids talk like
   kids. No lecturing narrator.
3. **No clocks.** No countdowns, timers or beat-the-clock pressure (standing rule: no timed games). Tension comes from
   rivals, surprises and mistakes.
4. **No real brands or franchises.** Everything is generic: "block world", "creator channel", "limited sneaker drop".
5. **Genre never repeats inside a unit,** and each book uses one **mechanic** from the catalog, chosen to fit the skill.
6. **Every book traps one real misconception** and answers it with named feedback, like the Axiom City gates.
7. **Format:** 8–10 panels, 3 reader gates and a boss gate. Free-read: gates coach but never block. Easy read,
   vocabulary pop-ups, Spanish and screen-reader text keep working because no text is inside a picture.
8. **Math comes from the lesson** (objective, vocabulary, standard from `lessons/<id>/config.json`) and is recomputed
   by an independent pass before art starts.
9. **One look per world** (palette and line style), so the covers read as eight different shelves.
10. **Students help choose.** For each unit, offer two world options in a class poll. That poll is itself a lesson-2-1
    statistical question.

## Genre catalog (14)

Mystery · Heist · Sports · Race · Market · Expedition · Courtroom · Newsroom · Repair · Quest · Studio · Escape room ·
Game show · Rescue

## Mechanic catalog (6)

| Code   | Mechanic             | What the student does                             |
| ------ | -------------------- | ------------------------------------------------- |
| FIX    | Fix the broken work  | Find and repair a character's error               |
| TOOL   | Choose the tool      | Pick the right method or model first, then use it |
| BRANCH | Branching story      | Choices change the next scene; wrong paths teach  |
| BUILD  | Build it             | Drag, plot, fold, bin or scale something          |
| JUDGE  | Judge the claims     | Decide whose reasoning holds, with evidence       |
| EST    | Estimate, then check | Commit to an estimate, then verify it             |

## The eight shows

| Unit | Show                  | Premise                                                                                                                                       | Kids                                                                                                  | Companion                                 | Running gag                                   |
| ---- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| 2    | **Clip Squad**        | Four kids run a rising video channel and fight to stay ahead of a rival creator. Data is views, polls, watch time and a suspicious "average". | Nova (director, perfectionist), Dex (stunt kid, reckless), Mei (editor, data nerd), Jaylen (hype man) | Blink, a camera drone with opinions       | Dex's stunts always end in a replay           |
| 3    | **Drift League**      | Hover-kart street racing for kids: boost mixes, pit stops, rival crews, track maps.                                                           | Zara (driver), Beck (mechanic), Lin (strategist), Omar (commentator)                                  | Spark, a kart AI that trash-talks         | Omar commentates everything, even lunch       |
| 4    | **Drop Day**          | The crew runs a limited sneaker and merch drop: discounts, hype, sellouts, resale scams.                                                      | Tasha (designer), Ruben (hype), Hye-jin (accountant), Cole (collector)                                | Kicks, a pigeon living in the shop window | Hye-jin's calculator is always right          |
| 5    | **Cubeland**          | A giant build-anything block world; the kids enter a build-off against the Server's best teams.                                               | Ana (architect), Kai (redstone-style tinkerer), Moss (decorator), Dree (speed-builder)                | Gel, a bouncing cube slime                | Gel eats the blueprints                       |
| 6    | **Agent Academy**     | A secret school for junior agents: codes, safes, gadgets, rival cadets and a mole in the class.                                               | Ivy (codebreaker), Ozzie (gadget kid), Farah (field ops), Teo (rookie)                                | Chip, a color-changing gecko              | Teo says "that's classified" about everything |
| 7    | **Dungeon Delvers**   | Kids dive an endless dungeon whose floors go below zero: loot, traps, bosses, mirror rooms.                                                   | Anya (scout), Kwame (tank), Sol (mapmaker), Bao (healer)                                              | Pip, a lantern sprite who lights the way  | Kwame always walks into the trap first        |
| 8    | **Screamline Park**   | Summer interns keep a chaotic theme park running: broken rides, ride-height rules, prize booths.                                              | Rafi (ride tech), Hana (booth boss), Gus (mascot costume), Odalys (park reporter)                     | Bandit, a raccoon who steals funnel cake  | Gus is always stuck in the mascot head        |
| 9    | **Mars Colony Alpha** | The first kid crew at a Mars colony: oxygen, rovers, storms and a mystery signal.                                                             | Esme (engineer), Takoda (pilot), Leilani (botanist), Idris (radio)                                    | Pebble, a small rover                     | Pebble keeps bringing back rocks              |

Axiom City's 6-3 (The Power Dial) and 6-4 (The Order Lock) stay as they are. Optionally re-skin them to Agent Academy
later.

## Lesson table

Column key: **Gates** lists gate 1 · gate 2 · gate 3 → boss.

### Unit 2: Clip Squad (12)

| Lesson | Book                  | Genre · Mechanic    | Hook                                                                                       | Misconception trapped                                                           | Gates                                                                                                |
| ------ | --------------------- | ------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 2-1    | Poll Position         | Newsroom · TOOL     | Dex's live Q&A poll asks "What's my favorite color?" and gets one answer                   | A question with numbers is statistical even when it has one answer              | Sort questions · rewrite a one-answer question · spot variability → pick the question for the stream |
| 2-2    | Who Left at 2:00?     | Mystery · BUILD     | Viewers keep vanishing mid-video and the watch-time data holds the clue                    | Counting a boundary value in the wrong bin; reading bar height as a time        | Bin 18 watch times · read the tallest bin · compare two bin widths → find the dead spot              |
| 2-3    | Stunt Rank            | Sports · FIX        | Dex says his "middle" stunt score proves he's consistent                                   | Taking the middle of an unsorted list; ignoring the pair when the count is even | Sort then find · even count · fix Dex's board → rank the stunts                                      |
| 2-4    | Algorithm Escape Room | Escape room · BUILD | The channel is locked inside a rival's escape room; every lock wants a five-number summary | Halves that include the median; confusing Q1 with the minimum                   | Min/median/max · Q1 and Q3 · build the box → open the last lock                                      |
| 2-5    | Creator Court         | Courtroom · JUDGE   | Two creators argue whose views are steadier, in a mock trial judged by the school          | Confusing range with IQR; letting one viral outlier decide                      | Compute range · compute IQR · compare spread → verdict                                               |
| 2-6    | Tour Van Math         | Expedition · BRANCH | The squad's merch van must ship 1,248 hoodies in boxes of 24 across a road trip            | Dropping a zero in the quotient; a remainder means one more box                 | Divide with a zero hole · what the remainder means · pick the route → deliver the hoodies            |
| 2-7    | The Giveaway Heist    | Heist · TOOL        | The rival's prize pool vanished; the squad stages a sting to split what's left exactly     | Not making the divisor whole; shifting one number only                          | Shift both · divide · check by multiplying → split the pool                                          |
| 2-8    | Fair Share Showdown   | Game show · BUILD   | Four creators level their subscriber stacks on a game show                                 | Mean is the middle value; a missing value has no total constraint               | Level the stacks · find the mean · find the missing value → final round                              |
| 2-9    | The Wobbly Drone      | Repair · FIX        | Blink's footage wobbles and Mei measures how far it strays                                 | Letting negative deviations cancel to zero; forgetting to divide                | Find the mean · absolute deviations · MAD → pick the steadier drone                                  |
| 2-10   | The Fake Average      | Quest · JUDGE       | A rival brags about "2 million average views" thanks to one viral clip                     | Using the mean when one huge value drags it                                     | Spot the outlier · pick the measure · justify → expose the claim                                     |
| 2-11   | Budget Boss           | Studio · BUILD      | The channel's new set must fit a budget in tenths and hundredths of dollars                | Lining up the last digits, not the decimal points                               | Fill the place-value chart · add · subtract with a zero → balance the budget                         |
| 2-12   | Receipt Rewind        | Market · EST        | Hye-jin-style receipts are wrong and the crew has to audit them                            | Misplacing the decimal point in the product                                     | Estimate first · multiply · count places → audit the receipt                                         |

### Unit 3: Drift League (10)

| Lesson | Book                   | Genre · Mechanic   | Hook                                                                                                 | Misconception trapped                                         | Gates                                                               |
| ------ | ---------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| 3-1    | Paint Job              | Studio · TOOL      | Zara's kart needs a livery: 2 parts blue to 5 parts white, and the paint shop's order slip is a mess | Reading part-to-part as part-to-whole; swapping the order     | Write the ratio · part vs whole · scale the mix → paint the kart    |
| 3-2    | Who's Actually Faster? | Race · JUDGE       | Two drivers each claim the fastest lap on different tracks                                           | Farther means faster; ignoring the "per"                      | Rate language · unit rate · compare two drivers → call the race     |
| 3-3    | Pit Stop Table         | Repair · BUILD     | Beck's boost-fuel table has holes and the crew chief is yelling                                      | Adding the same amount instead of multiplying                 | Complete the table · find the factor · fix the row → fuel the fleet |
| 3-4    | The Secret Shortcut    | Expedition · BUILD | Lin spots a shortcut on the track map, but only if the points line up                                | Swapping x and y; connecting points that are not equivalent   | Plot the pairs · read the line · extend it → file the route         |
| 3-5    | Rival Crews            | Courtroom · JUDGE  | Two pit crews each claim the best time and want the trophy                                           | Comparing differences, not ratios                             | Unit rate · common scale · judge → rule on the claim                |
| 3-6    | Garage Lock-In         | Escape room · TOOL | A prank locks the crew in the garage; each lock is a unit conversion                                 | Multiplying when the conversion needs dividing                | Pick the factor · convert · chain two steps → open the garage       |
| 3-7    | International Cup Quiz | Game show · EST    | Quiz night on miles, kilometers, inches and centimeters                                              | Using the factor in the wrong direction                       | Estimate which is longer · convert · check → final round            |
| 3-8    | Parts Shop Showdown    | Market · TOOL      | Two bulk deals at the parts shop; Omar insists the cheaper one is cheaper                            | The lower total is the better buy even with different amounts | Unit price · compare · decide the cart → equip the team             |
| 3-9    | Signal Boost Rescue    | Rescue · FIX       | A stranded kart's radio message is a ratio puzzle                                                    | Adding the same number to both terms                          | Multiply both · divide both · check the pair → send the answer      |
| 3-10   | Race Day Report        | Newsroom · BRANCH  | Omar must file the story, and the units he picks change the headline                                 | Skipping a unit in a multi-step chain                         | Choose the chain · convert · cancel the units → file the story      |

### Unit 4: Drop Day (5)

| Lesson | Book                  | Genre · Mechanic | Hook                                                                               | Misconception trapped                                                          | Gates                                                                       |
| ------ | --------------------- | ---------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 4-1    | The Hundred-Pair Wall | Quest · BUILD    | A wall of exactly 100 sneakers tells the drop's story, and restocks push past 100% | A percent is the count even when the whole is not 100; over 100% is impossible | Shade the wall · read the percent · restock past 100% → count the drop      |
| 4-2    | The Price Tag Code    | Heist · TOOL     | The vault code is hidden as a fraction, a decimal and a percent on three tags      | 0.08 is 80%; 13/20 is 13%                                                      | Fraction to percent · decimal to percent · match all three → crack the code |
| 4-3    | Eyeball the Discount  | Race · EST       | The crew bets on who can guess the sale price closest before the register shows it | 25% means divide by 25                                                         | 10% jump · 25% and 50% · compatible numbers → win the guess                 |
| 4-4    | Flash Sale Fail       | Market · FIX     | The store's sale price came out higher than the original                           | Multiplying by 30 instead of 0.30                                              | Percent of a number · fix the math · compare deals → rescue the sale        |
| 4-5    | The Sold-Out Mystery  | Mystery · JUDGE  | 30 pairs vanished and that was exactly 25% of the drop. How big was the drop?      | Multiplying the part by the percent instead of dividing                        | Build the table · find the whole · check by multiplying → size the drop     |

### Unit 5: Cubeland (10)

| Lesson | Book                          | Genre · Mechanic    | Hook                                                                         | Misconception trapped                         | Gates                                                                          |
| ------ | ----------------------------- | ------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| 5-1    | The Slanted Roof              | Repair · BUILD      | Ana's roof is a parallelogram and Gel keeps eating the blueprint             | Using the slanted side as the height          | Shear to a rectangle · find the height · compute → order the blocks            |
| 5-2    | Half the Roof, Whole the Bill | Mystery · FIX       | A triangle sign is billed at double the right area                           | Forgetting the one-half                       | Compose a parallelogram · compute · find the culprit → settle the bill         |
| 5-3    | The Bridge Build-Off          | Race · TOOL         | Two teams build a trapezoid bridge and only one area wins the build-off      | Using one base times height                   | Average the bases · compute · compare methods → win the build-off              |
| 5-4    | The Mega Plaza                | Studio · BUILD      | The plaza is L-shaped with a fountain hole and a hexagon garden              | Adding perimeters; double-counting overlap    | Split the figure · subtract the hole · hexagon into triangles → cost the plaza |
| 5-5    | Fill the Vault                | Escape room · BUILD | The vault only opens when it is filled with exactly the right cubes          | Mixing surface area and volume; wrong units   | Count the layers · length × width × height · unit check → fill the vault       |
| 5-6    | Fold-or-Fail Papercraft       | Game show · BUILD   | Contestants fold flat nets into boxes on a build show                        | Any six squares make a cube                   | Test nets · name the faces · match to solid → final fold                       |
| 5-7    | The Gift-Wrap Trial           | Courtroom · JUDGE   | A kid claims one sheet of wrap covers the whole box; the class holds a trial | Forgetting to double matching faces           | Net areas · add faces · find the missing faces → rule on the wrap              |
| 5-8    | Pyramid Raid                  | Expedition · BRANCH | The crew paints a giant gold pyramid and picks which measure to trust        | Slant height vs height; leaving out the base  | Choose the slant height · lateral area · add the base → cover the pyramid      |
| 5-9    | Hex Arena                     | Sports · TOOL       | A six-sided arena needs seating, and one wrong triangle breaks the plan      | Triangles counted wrong; apothem used as side | Count the triangles · area of one · total → plan the seats                     |
| 5-10   | The Sandbox Order             | Market · EST        | A sandbox with fractional edges is ordered by volume                         | Dropping the fractional part                  | Estimate · compute · compare to the order → place the order                    |

### Unit 6: Agent Academy (13 new)

| Lesson | Book                         | Genre · Mechanic    | Hook                                                                             | Misconception trapped                            | Gates                                                                   |
| ------ | ---------------------------- | ------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| 6-1    | Snack Ops                    | Quest · BUILD       | A mission ration pack must be split into quarter-kilo portions                   | 3 ÷ ¼ = ¾                                        | Model it · find the quotient · check by multiplying → fill the packs    |
| 6-2    | Duel of the Decoders         | Game show · TOOL    | Rival cadets duel with fraction-by-fraction codes                                | Inverting the wrong fraction or neither          | Common denominators · reciprocal · pick a method → win the duel         |
| 6-5    | The Cipher Writer            | Heist · TOOL        | Ivy must write the code that opens a rival vault                                 | "7 less than twice n" becomes 7 − 2n             | Translate · evaluate · fix the order → write the code                   |
| 6-6    | The Twin Messages            | Courtroom · JUDGE   | Two coded messages look different; the academy must decide if they match         | 2(y − 3) = 2y − 3                                | Test values · combine like terms · judge → rule                         |
| 6-7    | The Two-Key Safe             | Escape room · TOOL  | A safe needs two keys, and the code is a common factor and a common multiple     | Swapping GCF and LCM                             | List factors · list multiples · pick GCF or LCM → open the safe         |
| 6-8    | The Broken Code Machine      | Repair · FIX        | Ozzie's code machine swaps the order and breaks messages                         | Subtraction is commutative                       | Commutative · associative · identity → repair the machine               |
| 6-9    | Bigger Than You Think        | Race · EST          | Cadets race to estimate quotients; the answer is bigger than the whole           | Dividing always makes it smaller                 | Estimate first · compute · check → win                                  |
| 6-10   | The Case of the Mixed-Up Mix | Mystery · FIX       | A gadget's recipe mixes a mixed number with a fraction and someone divided wrong | Dividing the whole and fraction parts separately | Convert · divide · simplify → find the error                            |
| 6-11   | Mission Planner              | Expedition · BRANCH | A mission map branches on groups-or-amount-per-group                             | Using the wrong meaning of the division          | Groups or amount per group · write the equation · check → reach the end |
| 6-12   | Meet on the Rooftop          | Rescue · BUILD      | Two agents on different patrol cycles must meet to pull off a rescue             | Using the product as the LCM                     | List multiples · find the first match · apply → plan the meeting        |
| 6-13   | The Academy Gazette Scoop    | Newsroom · BUILD    | The school paper maps a secret code as a factor tree                             | Stopping at a composite number; calling 1 prime  | Build the tree · list the primes · write the product → print the scoop  |
| 6-14   | The Gadget Blueprint         | Studio · BUILD      | An area model splits a gadget into two parts                                     | Distributing to only the first term              | Expand · factor · check with the model → finish the blueprint           |
| 6-15   | The Spy Swap Meet            | Market · FIX        | A trader combines unlike terms in a trade of gadget parts                        | 3x + 4y = 7xy                                    | Spot like terms · combine · fix the claim → close the trade             |

### Unit 7: Dungeon Delvers (9)

| Lesson | Book                     | Genre · Mechanic    | Hook                                                               | Misconception trapped                        | Gates                                                                  |
| ------ | ------------------------ | ------------------- | ------------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------- |
| 7-1    | Floor Minus Three        | Expedition · BRANCH | The elevator in the dungeon goes down, and Kwame presses −3        | Negatives are above zero; 0 has no meaning   | Place floors · opposite · explain zero → map the climb                 |
| 7-2    | The Loot Ledger          | Mystery · TOOL      | A ledger lists fraction and decimal gains and losses               | Placing −¾ by its denominator                | Place the numbers · pair opposites · check → read the ledger           |
| 7-3    | The Closest Exit         | Rescue · JUDGE      | Which exit is closer, −6 or 4? The party's life bar depends on it  | Negative means closer or smaller distance    | Distance from zero · compare · justify → send the rescue               |
| 7-4    | The Boss Health Bar      | Game show · EST     | A health bar shows damage and heals, and the party must order them | −3 > −2 because 3 > 2                        | Estimate · order · check on the line → final round                     |
| 7-5    | The Map Room             | Heist · BUILD       | Sol plots a secret treasure map point by point                     | Swapping x and y                             | Plot · name the point · fix the swap → light the path                  |
| 7-6    | The Rope Bridge          | Repair · TOOL       | The rope bridge must be cut to the right length across the map     | Adding when both points are on the same side | Same side · opposite sides · choose → cut the rope                     |
| 7-7    | Design Your Dungeon Room | Studio · BUILD      | The party designs a new room as a polygon on the map               | Mixing perimeter and area                    | Plot the vertices · side lengths · perimeter and area → build the room |
| 7-8    | Portal Jump              | Quest · BRANCH      | A portal sends the party across all four quadrants                 | Sign errors by quadrant                      | Name the quadrant · plot · navigate → reach the portal                 |
| 7-9    | Mirror World Escape      | Escape room · BUILD | The party escapes by reflecting points across the mirror line      | Reflecting over the x-axis changes x         | Over the x-axis · over the y-axis · both → open the gate               |

### Unit 8: Screamline Park (7)

| Lesson | Book                    | Genre · Mechanic | Hook                                                                         | Misconception trapped                                 | Gates                                                    |
| ------ | ----------------------- | ---------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| 8-1    | The Is-It-True Booth    | Mystery · TOOL   | A booth lights up when a number makes a statement true, and Bandit rigged it | The equal sign means "the answer comes next"          | Substitute · test · write the equation → crack the booth |
| 8-2    | The Wobbly Balance Ride | Repair · BUILD   | A balance ride is lopsided and Rafi must level it                            | Changing only one side; adding instead of subtracting | Balance · inverse · solve → fix the ride                 |
| 8-3    | The Prize Machine Hack  | Heist · FIX      | Gus finds a claw machine whose gears hide the prize code                     | Subtracting instead of dividing                       | Multiply or divide · solve · check → win the prize       |
| 8-4    | The Height Rule Hall    | Game show · TOOL | Ride signs read "at least" and "no more than" and Gus keeps ignoring them    | Wrong direction; leaving out the boundary             | Write the rule · test values · fix → final question      |
| 8-5    | The Sign Shop           | Studio · BUILD   | Hana paints the number-line signs for every ride                             | Open versus closed circle, wrong direction            | Open or closed · direction · graph → hang the signs      |
| 8-6    | The Coaster Queue       | Race · BRANCH    | Interns race to set the queue rules and the solution set is a range          | Treating it as one answer                             | Solve · graph · test → open the coaster                  |
| 8-7    | The Park Report         | Newsroom · JUDGE | Odalys must decide equation or inequality for the park's incident report     | Using the wrong model                                 | Choose the model · solve · justify → file the report     |

### Unit 9: Mars Colony Alpha (4)

| Lesson | Book                  | Genre · Mechanic   | Hook                                                                                 | Misconception trapped                            | Gates                                                         |
| ------ | --------------------- | ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------- |
| 9-1    | Who Depends on Whom?  | Mystery · TOOL     | The oxygen supply drops as crew grows, and the colony must name what depends on what | Swapping independent and dependent               | Name the variables · cause and effect · explain → solve it    |
| 9-2    | The Rover Trail       | Expedition · BUILD | Pebble's trail forms a graph and Esme must read it                                   | Reading a flat segment as no change in the story | Read the graph · build one · match to a story → map the trail |
| 9-3    | Hack the Habitat Door | Heist · FIX        | The door's code hides in a table of numbers                                          | Choosing y = x + 3 when the table shows y = 3x   | Find the rule · write the equation · check → crack the door   |
| 9-4    | The Last Supply Drop  | Rescue · BRANCH    | An equation predicts how long supplies last and the crew must choose                 | Using the equation backwards                     | Substitute · solve · predict "at least" → send the drop       |

## Coverage summary

- 70 books, 8 shows, 32 kids, 8 companions.
- Genre never repeats within a unit.
- Counts by mechanic and genre are checked by script at the end of this draft.

## Next steps

1. Review the shows and hooks. Cut or swap any world you don't think Grade 6 would love, and offer two options per
   unit to students.
2. Choose the pilot books, one per mechanic, from different shows.
3. Move approved rows into per-lesson spec files and replace the hardcoded `LESSON_BOOKS` array with a data-driven
   registry.
4. Run the art test on the same panel across `gemini-2.5-flash-image`, `gemini-3.1-flash-image` and
   `gemini-3-pro-image`.

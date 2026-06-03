/* STORY · Unit 4 · Graphic Novel #2 (Enrichment) · Shopping Mall Mogul
   Full novel on the comic engine. Enrichment tier: harder numbers, optional
   "Mogul's Bonus" rounds (non-gating, still scored), English-only (source has
   no Spanish). All math/answers/distractors/glossary carried verbatim from
   graphic-novels/unit4/graphic-novel-2.html (6.RP.2).
   New: panels, speech, PENNY-voices-the-misconception, vocab pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 4,
    version: 2,
    level: "Enrichment",
    title: "Shopping Mall Mogul &#128717;&#65039;",
    standard: "6.RP.2",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U4 #2: Shopping Mall Mogul",
    artBase: "../_art/unit4/",
    home: "../index.html",
  },

  cast: {
    mogul: {
      name: "The Mogul",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "&#128717;&#65039;",
      avatar: null,
      blurb: "You",
    },
    penny: {
      name: "PENNY",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "&#129297;",
      avatar: null,
      blurb: "Bargain-hunter sidekick · grabs the bigger package as 'cheaper'",
    },
    helper: { name: "Floor Manager", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young entrepreneur smiles in front of a bright futuristic shopping mall with floating price tags",
    blurbEn:
      "You just took over the Nexus Galleria, the city&rsquo;s most ambitious smart-mall. Every shop you want to open is gated behind a pricing puzzle. To out-negotiate rival retailers and pack the galleria, you must master <b>unit rates</b>, <b>percent markdowns</b>, and the slippery world of percents <b>over 100%</b> and <b>under 1%</b>. PENNY rides along, always reaching for the jumbo size on instinct &mdash; sharpen your deal-making and the best bargain hunter wins the mall.",
    blurbEs: "",
    startLabel: "Take the Reins &#128717;&#65039;",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Best Buy",
      kicker: "Act 1 · Rates & Unit Rates",
      title: "The Best Buy",
      advanceLabel: "Open the shop &#128722;",
      steps: [
        {
          type: "beats",
          art: "unit-rate.png",
          alt: "Mateo weighs two products, deciding which is the better deal",
          lastLabel: "Check PENNY ▶",
          beats: [
            {
              who: "helper",
              caption: true,
              en: "Welcome to the Nexus Galleria, boss. Suppliers are bidding for shelf space &mdash; but only the sharpest VALUE wins shoppers.",
            },
            {
              who: "helper",
              caption: true,
              en: "Remember: a jumbo size only wins if its price per unit is lower. Bulk and value are not the same thing &mdash; the unit rate is what decides every shelf.",
            },
            {
              who: "mogul",
              en: "Then I reduce every offer to a unit rate &mdash; price per millilitre, per gram, per item. Whoever's cheaper per unit gets the shelf.",
              vocab: [
                {
                  term: "unit rate",
                  en: "A rate expressed per single unit (per 1). Computed as quantity-A ÷ quantity-B, e.g. price ÷ amount = $0.04 per gram.",
                },
              ],
            },
            {
              who: "penny",
              misconception: true,
              en: "Vendor B's bottle is 1.25 litres — way more than 750 mL. Bigger bottle, better deal. Grab Vendor A? No, B's the cheap one because it's HUGE!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "helper",
            en: "First bid is on the energy drinks. Different sizes, different prices. Pick the real best value. Two suppliers pitch the same energy drink. Vendor A: a <b>750 mL</b> bottle for <b>$4.50</b>. Vendor B: a <b>1.25 L</b> (1250 mL) bottle for <b>$6.25</b>. Stock the better value &mdash; compare the price per millilitre.",
          },
          choices: [
            {
              en: 'Vendor A &mdash; 750 mL for $4.50<span class="calc">4.50 &divide; 750 = $0.0060/mL</span>',
              correct: false,
            },
            {
              en: 'Vendor B &mdash; 1.25 L for $6.25<span class="calc">6.25 &divide; 1250 = $0.0050/mL (cheaper)</span>',
              correct: true,
            },
          ],
          goodEn:
            "&#9989; Vendor B wins: $6.25 &divide; 1250 mL = $0.0050/mL beats $4.50 &divide; 750 mL = $0.0060/mL. Shelf secured.",
          badEn:
            "&#10060; Compare the same unit. Divide each price by its millilitres &mdash; the lower price per mL is the better value.",
          solveBeat: {
            who: "mogul",
            en: "Shelf secured. Next, the roastery quotes a bulk price &mdash; I'll express it per 100 grams so shoppers can compare instantly.",
          },
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "helper",
            en: "The Mogul vows to <b>reduce</b> every offer to a unit rate. In this context, <b>reduce</b> most nearly means to &mdash;",
          },
          choices: [
            {
              en: "rewrite each offer as a single price per one unit so deals can be compared.",
              correct: true,
            },
            {
              en: "lower the price the supplier is charging for the product.",
              correct: false,
            },
            {
              en: "throw away the larger of the two packages on the shelf.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Exactly. Here <i>reduce</i> means to express each deal as one comparable rate &mdash; the price for a single unit.",
          badEn:
            "❌ In this context, <i>reduce</i> means to boil each offer down to a price per one unit, not to lower a price or discard a package.",
        },
        {
          type: "challenge",
          id: "1b",
          art: "unit-rate.png",
          alt: "Mateo weighs two products, deciding which is the better deal",
          ask: {
            who: "mogul",
            en: "The roastery offers <b>240 g</b> of premium coffee for <b>$9.60</b>. Shoppers compare prices <b>per 100 g</b>. What is the unit rate per 100 g?",
          },
          choices: [
            {
              en: '$4.00 per 100 g<span class="calc">9.60 &divide; 240 = $0.04/g &rarr; &times;100 = $4.00</span>',
              correct: true,
            },
            {
              en: '$2.50 per 100 g<span class="calc">240 &divide; 9.60 (inverted)</span>',
              correct: false,
            },
            {
              en: '$0.40 per 100 g<span class="calc">off by a factor of 10</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#9989; $9.60 &divide; 240 g = $0.04/g, so per 100 g it's $4.00. Clear, comparable pricing &mdash; shoppers love it.",
          badEn:
            "&#10060; Find price per gram first ($9.60 &divide; 240), then scale up to 100 g.",
          solveArt: "unlock.png",
          solveAlt:
            "Mateo celebrates as a new shop unlocks with golden light and confetti",
          solveBeat: {
            who: "helper",
            en: "Optional: a loyalty boutique wants the absolute best notebook reorder. Crunch it if you want the bonus &mdash; not required to open.",
          },
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1b",
          ask: {
            who: "helper",
            en: "According to the roastery's quote, how much premium coffee do you get for $9.60?",
          },
          choices: [
            {
              en: "240 grams of coffee.",
              correct: true,
            },
            {
              en: "100 grams of coffee.",
              correct: false,
            },
            {
              en: "1250 millilitres of coffee.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Correct &mdash; the roastery offers 240 g for $9.60, which is what you scaled to a per-100-g price.",
          badEn:
            "❌ Reread the quote: the roastery offers 240 g for $9.60. The 100 g was the unit you compared in, and 1250 mL was the earlier energy-drink bottle.",
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "helper",
            en: "A boutique reorders notebooks. Pack X: <b>5</b> for <b>$7.50</b>. Pack Y: <b>8</b> for <b>$11.20</b>. Which is the better buy, and by how much per notebook?",
          },
          choices: [
            {
              en: 'Pack X, by $0.10<span class="calc">7.50 &divide; 5 = $1.50 each</span>',
              correct: false,
            },
            {
              en: 'Pack Y, by $0.10<span class="calc">$1.50 vs 11.20 &divide; 8 = $1.40; saves $0.10/book</span>',
              correct: true,
            },
            {
              en: 'They cost the same per notebook<span class="calc">$1.50 &ne; $1.40</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#11088; Pack Y: $11.20 &divide; 8 = $1.40 vs Pack X's $7.50 &divide; 5 = $1.50 &mdash; $0.10 cheaper per notebook. Bonus claimed!",
          badEn:
            "&#10060; Compute both unit prices ($7.50 &divide; 5 and $11.20 &divide; 8) and compare. (Optional &mdash; you can still advance.)",
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 3,
          interaction: "evidence",
          passageRef: "act1.beat1",
          ask: {
            who: "helper",
            en: "Claim: <b>PENNY chooses a deal by its size instead of its real value.</b> Tap the line that <b>best proves</b> this claim.",
          },
          choices: [
            {
              en: "&ldquo;Bigger bottle, better deal&hellip; B's the cheap one because it's HUGE!&rdquo;",
              correct: true,
            },
            {
              en: "&ldquo;Whoever's cheaper per unit gets the shelf.&rdquo;",
              correct: false,
            },
            {
              en: "&ldquo;I'll express it per 100 grams so shoppers can compare instantly.&rdquo;",
              correct: false,
            },
          ],
          goodEn:
            "✅ Strong evidence &mdash; PENNY calls the bottle &ldquo;the cheap one because it's HUGE,&rdquo; judging by size, not price per unit.",
          badEn:
            "❌ Those lines describe the Mogul's careful unit-rate method. Find PENNY's line that picks a deal just because the package is bigger.",
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Markdowns",
      kicker: "Act 2 · Fractions, Decimals & Percents",
      title: "The Markdown War",
      advanceLabel: "Launch the sale &#127881;",
      steps: [
        {
          type: "beats",
          art: "discount.png",
          alt: "Mateo presents a storefront covered in bright percent-off sale signs",
          lastLabel: "Set the price ▶",
          beats: [
            {
              who: "helper",
              caption: true,
              en: "A rival across the atrium just slashed prices. It's a markdown war, and shoppers are watching the percent signs.",
            },
            {
              who: "helper",
              caption: true,
              en: "Shoppers compare the percent on each sign, but the real savings is a percent OF the price. A bigger sticker price means a bigger dollar discount for the same percent.",
            },
            {
              who: "mogul",
              en: "Discounts are just percents of the price. Convert the percent to a decimal, multiply, subtract &mdash; or multiply by what remains. Let's counter.",
              vocab: [
                {
                  term: "percents",
                  en: "A ratio out of 100. 35% = 35/100 = 0.35. Percents can exceed 100% or be less than 1%.",
                },
              ],
            },
            {
              who: "penny",
              misconception: true,
              en: "35% off $80? Just knock off $28 and pay $28 — that's the sale price!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "mogul",
            en: "A rival drops sneaker prices, so you counter. Your sneakers list at <b>$80</b> and you mark them <b>35% off</b>. What is the <b>sale price</b> shoppers pay?",
          },
          choices: [
            {
              en: '$52.00<span class="calc">80 &times; (1 &minus; 0.35) = 80 &times; 0.65</span>',
              correct: true,
            },
            {
              en: '$28.00<span class="calc">that is the discount, not the price</span>',
              correct: false,
            },
            {
              en: '$45.00<span class="calc">not 80 &times; 0.65</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#9989; $80 &times; 0.65 = $52.00 (you keep 65% after taking 35% off). Rival countered.",
          badEn:
            "&#10060; Sale price = original &times; (1 &minus; 0.35) = 80 &times; 0.65. $28 is only the discount itself.",
          solveBeat: {
            who: "mogul",
            en: "My dashboard is throwing huge growth numbers and microscopic fees. Percents over 100% and under 1% &mdash; I have to read them precisely.",
          },
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act2",
          ask: {
            who: "helper",
            en: "What is the Mogul mainly trying to do in this chapter?",
          },
          choices: [
            {
              en: "Use percents accurately to set winning sale prices in the markdown war.",
              correct: true,
            },
            {
              en: "Find the price per millilitre of a bottled energy drink.",
              correct: false,
            },
            {
              en: "Grab the jumbo package because it looks like the bigger value.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Right &mdash; the whole chapter is about converting percents correctly to mark prices down and beat the rival.",
          badEn:
            "❌ Per-millilitre pricing was Act 1, and grabbing the jumbo size is PENNY's mistake. This chapter is about pricing with percents.",
        },
        {
          type: "challenge",
          id: "2b",
          art: "discount.png",
          alt: "Mateo presents a storefront covered in bright percent-off sale signs",
          ask: {
            who: "mogul",
            en: "Your dashboard shows growth of <b>250%</b> and a tiny transaction-fee of <b>0.5%</b>. Percents can be greater than 100% or less than 1%. Which row converts <b>both</b> correctly?",
            vocab: [
              {
                term: "250%",
                en: "Values greater than the whole. 250% = 2.5 = 5/2; e.g. 250% of 40 is 100.",
              },
            ],
          },
          choices: [
            {
              en: "250% = 2.5 = 5/2 &nbsp;and&nbsp; 0.5% = 0.005 = 1/200",
              correct: true,
            },
            {
              en: "250% = 25 &nbsp;and&nbsp; 0.5% = 0.5",
              correct: false,
            },
            {
              en: "250% = 0.25 &nbsp;and&nbsp; 0.5% = 0.05",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; 250% = 2.5 = 5/2 and 0.5% = 0.005 = 1/200. Percents above 100% and below 1% handled cleanly.",
          badEn:
            "&#10060; Divide each percent by 100: 250 &divide; 100 = 2.5; 0.5 &divide; 100 = 0.005.",
          solveBeat: {
            who: "helper",
            en: "Optional puzzle: a shopper asks what a coat originally cost before its sale. Reverse the markdown for the bonus &mdash; or skip ahead.",
          },
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "helper",
            en: "A designer coat is on the rack at <b>$60</b> after a <b>25% off</b> sale. Working backward, what was the <b>original price</b>?",
          },
          choices: [
            {
              en: '$80<span class="calc">60 &divide; 0.75 = 80 (since 60 = 75% of original)</span>',
              correct: true,
            },
            {
              en: '$75<span class="calc">added 25% of 60, not the right base</span>',
              correct: false,
            },
            {
              en: '$85<span class="calc">60 &divide; 0.75 &ne; 85</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#11088; $60 is 75% of the original, so original = 60 &divide; 0.75 = $80. Reverse markdown solved!",
          badEn:
            "&#10060; The $60 equals 75% of the original. Divide: 60 &divide; 0.75. (Optional &mdash; you can still advance.)",
        },
        {
          type: "comprehension",
          id: "c5",
          skill: "sequence",
          standard: "RI.6.3",
          dok: 2,
          interaction: "sequence",
          passageRef: "act2.2a",
          ask: {
            who: "helper",
            en: "Order the steps the Mogul used to find the $52 sale price on the $80 sneakers at 35% off.",
          },
          items: [
            {
              en: "Convert 35% off to the decimal you keep: 1 &minus; 0.35 = 0.65.",
              order: 1,
            },
            {
              en: "Multiply the original price: $80 &times; 0.65.",
              order: 2,
            },
            {
              en: "Read the result as the sale price shoppers pay: $52.00.",
              order: 3,
            },
          ],
          goodEn:
            "✅ Convert the percent, multiply by the original, then read the sale price &mdash; that's the markdown procedure.",
          badEn:
            "❌ Not quite. First turn 35% off into 0.65, then multiply $80 by it, and only then read off the $52 sale price.",
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Grand Opening",
      kicker: "Grand Opening · Boss",
      title: "The Headline Deal",
      advanceLabel: "Open the mall! &#127775;",
      steps: [
        {
          type: "beats",
          art: "final-challenge.png",
          alt: "Mateo stands before a giant mall command console covered in deal charts",
          lastLabel: "Build the deal ▶",
          beats: [
            {
              who: "helper",
              caption: true,
              en: "Grand opening, boss. The headline deal goes on every billboard &mdash; it has to fuse a unit rate with a percent markdown, flawlessly.",
            },
            {
              who: "helper",
              caption: true,
              en: "Order matters here, boss. Find the price for ONE first, then apply the percent off &mdash; do it backward and the headline number will be wrong.",
            },
            {
              who: "mogul",
              en: "Per-unit price first, then the discount. One clean number for one bulb. Let's give this city the deal of the year.",
            },
            {
              who: "penny",
              misconception: true,
              en: "A 6-pack at $48 with 15% off? Just take 10% off — close enough — about $7.20 a bulb!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "mogul",
            en: "The grand-opening special: a <b>6-pack</b> of smart bulbs at <b>$48</b>, then <b>15% off</b>. Find the final price for <b>one bulb</b>.",
          },
          choices: [
            {
              en: '$6.80<span class="calc">48 &divide; 6 = $8 &rarr; 8 &times; 0.85 = $6.80</span>',
              correct: true,
            },
            {
              en: '$8.00<span class="calc">unit rate before the discount</span>',
              correct: false,
            },
            {
              en: '$7.20<span class="calc">subtracted 10%, not 15%</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#9989; $48 &divide; 6 = $8 per bulb, then $8 &times; 0.85 = $6.80. Unit rate and markdown fused perfectly.",
          badEn:
            "&#10060; Two steps: $48 &divide; 6 = $8, then take 15% off ($8 &times; 0.85 = $6.80).",
          solveBeat: {
            who: "helper",
            en: "Optional extra credit &mdash; the mall opens whether or not you solve it. A competitor counters your bulb deal.",
          },
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "helper",
            en: "A competitor counters your bulb deal. <b>Deal A</b> (yours): 6 for $48, then 15% off. <b>Deal B</b> (theirs): 4 for $30, then 10% off. Which deal is the better value <b>per bulb</b>?",
          },
          choices: [
            {
              en: 'Deal B<span class="calc">B: (30 &divide; 4) &times; 0.90 = $6.75 &lt; A&rsquo;s $6.80</span>',
              correct: true,
            },
            {
              en: 'Deal A<span class="calc">$6.80 is higher than $6.75</span>',
              correct: false,
            },
            {
              en: 'They are identical per bulb<span class="calc">$6.80 &ne; $6.75</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#11088; Deal B: ($30 &divide; 4) &times; 0.90 = $7.50 &times; 0.90 = $6.75 per bulb, beating your $6.80. A true mogul knows when the rival is right!",
          badEn:
            "&#10060; Reduce each to a final per-bulb price: A = $6.80, B = (30 &divide; 4) &times; 0.90 = $6.75. (Optional &mdash; you can still finish.)",
          solveBeat: {
            who: "mogul",
            en: "Even the rival's deal teaches me something. The galleria opens stronger than ever.",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 3,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "helper",
            en: "Throughout the galleria, PENNY reaches for the jumbo size and rounds the percent. What can you <b>infer</b> about why PENNY's deals keep coming out wrong?",
          },
          choices: [
            {
              en: "PENNY trusts quick instincts about size and rounding instead of doing the per-unit and percent math, so the real best deal slips by.",
              correct: true,
            },
            {
              en: "PENNY is secretly working for the rival mall and wants the Mogul to lose.",
              correct: false,
            },
            {
              en: "Every price tag in the galleria is printed incorrectly.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Good inference &mdash; PENNY leans on gut reactions (bigger = cheaper, round the percent) rather than the unit-rate and percent steps, so the numbers miss.",
          badEn:
            "❌ Nothing shows PENNY is disloyal or that the tags are wrong. The pattern is that PENNY guesses by size and rounding instead of computing.",
        },
        {
          type: "comprehension",
          id: "c7",
          skill: "prediction",
          standard: "RL.6.3",
          dok: 2,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "helper",
            en: "The Nexus Galleria is open and investors are calling. What will the Mogul most likely need to do next?",
          },
          choices: [
            {
              en: "Keep using unit rates and percent markdowns to negotiate new deals and grow the empire.",
              correct: true,
            },
            {
              en: "Shut down the shelves and shops that just opened in Act 1.",
              correct: false,
            },
            {
              en: "Stop comparing prices and let suppliers charge whatever they want.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Likely &mdash; the story ends with the empire &ldquo;just getting started,&rdquo; so the Mogul keeps using these pricing skills to grow.",
          badEn:
            "❌ Closing shops or ignoring prices would undo everything the Mogul built. The ending points to more deal-making ahead.",
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "&#128181;",
      en: "Rate",
      def: "A ratio comparing two quantities with different units, such as $6.25 per 1250 mL or 240 g per $9.60.",
    },
    {
      ico: "&#49;&#65039;&#8419;",
      en: "Unit rate",
      def: "A rate expressed per single unit (per 1). Computed as quantity-A &divide; quantity-B, e.g. price &divide; amount = $0.04 per gram.",
    },
    {
      ico: "&#128722;",
      en: "Best buy",
      def: "The option with the lowest unit rate. Comparisons are only valid in the same unit (per mL, per 100 g, per item).",
    },
    {
      ico: "&#37;",
      en: "Percent",
      def: "A ratio out of 100. 35% = 35/100 = 0.35. Percents can exceed 100% or be less than 1%.",
    },
    {
      ico: "&#128201;",
      en: "Markdown / Discount",
      def: "An amount subtracted from the original price. A p% discount gives sale price = original &times; (1 &minus; p/100).",
    },
    {
      ico: "&#128200;",
      en: "Percent over 100%",
      def: "Values greater than the whole. 250% = 2.5 = 5/2; e.g. 250% of 40 is 100.",
    },
    {
      ico: "&#128302;",
      en: "Percent under 1%",
      def: "Values smaller than one hundredth of the whole. 0.5% = 0.005 = 1/200.",
    },
    {
      ico: "&#128260;",
      en: "Equivalent forms",
      def: "Fractions, decimals, and percents can name the same value: 3/4 = 0.75 = 75%.",
    },
    {
      ico: "&#9194;",
      en: "Reverse percent",
      def: "Finding an original amount from a result. If $60 is 75% of the original, original = 60 &divide; 0.75 = $80.",
    },
    {
      ico: "&#9878;&#65039;",
      en: "Value comparison",
      def: "Comparing deals by reducing each to a final unit price, then choosing the lowest.",
    },
  ],

  complete: {
    art: "finish.png",
    alt: "Mateo celebrates on the balcony of his thriving mall with confetti and a cheering crowd",
    badge: "&#127881;&#128717;&#65039;&#11088;",
    titleEn: "Galleria Launched &mdash; Mission Complete!",
    en: "The Nexus Galleria is the busiest mall in the city. You out-priced every rival with sharp <b>unit-rate</b> comparisons, ran precise <b>percent markdowns</b>, and even handled percents beyond 100% and below 1%. Investors are calling, Mogul &mdash; the empire is just getting started.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Calculate complex savings: A designer coat costs <strong>$80</strong> but is on sale for <strong>25% off</strong>. If the store charges <strong>5% sales tax</strong> on the final sale price, what is the final cost?",
      promptEs: "",
      choices: [
        {
          en: "A) $60.00 &nbsp;(this is the sale price without tax)",
          correct: false,
        },
        {
          en: "B) $63.00 &nbsp;(sale price $60 + $3.00 tax) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) $64.00 &nbsp;(calculated 5% tax on original $80 price)",
          correct: false,
        },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      badEn:
        "❌ That is incorrect. Review your calculations and try another option!",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};

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

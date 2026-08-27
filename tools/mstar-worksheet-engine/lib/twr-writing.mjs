/**
 * twr-writing.mjs — The Writing Revolution (TWR) & Domain Argumentation Engine
 *
 * Provides lesson-specific, standards-aligned mathematical writing scaffolds:
 *   1. TWR Sentence Expansion (Because / But / So)
 *   2. Domain-Specific Argumentation Frames (CER 2.0)
 *   3. Contextual Discourse Prompts (replacing generic Partner A/B)
 *   4. Misconception Refutation Guides
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Generates standard-specific TWR Because/But/So sentence stems.
 */
export function getTWRStems(standard, topic, lessonData = {}) {
  if (lessonData.twrStems) return lessonData.twrStems;

  const std = String(standard || "").toUpperCase();

  if (std.includes("DS") || std.includes("SP") || std.includes("STAT")) {
    return {
      because: `A question is statistical **because** it expects varied answers from different people rather than a single fixed fact.`,
      but: `"What time does school start?" is about our school, **but** it is not statistical **because** there is only one exact answer.`,
      so: `The athletic coach wants to know how active the team is outside of practice, **so** he asked the statistical question: "How many hours do you exercise each week?"`
    };
  }

  if (std.includes("RP") || std.includes("AT.1") || std.includes("RATIO") || std.includes("RATE")) {
    return {
      because: `The ratio of green beads to red beads is 3:5 **because** for every 3 green beads, there are exactly 5 red beads.`,
      but: `A ratio compares two quantities, **but** changing the order of the numbers changes the meaning of the comparison.`,
      so: `The store sells 4 juice bottles for $8, **so** the unit rate is $2 per bottle because $8 divided by 4 equals $2.`
    };
  }

  if (std.includes("PERC") || std.includes("RP.3C")) {
    return {
      because: `A percent represents a rate per 100 **because** the word percent literally means "per hundred" (out of 100 equal parts).`,
      but: `120% is greater than 100%, **but** it is still a valid percent because it describes an amount that is larger than one whole.`,
      so: `The student got 18 out of 20 questions correct, **so** her score was 90% because multiplying both terms by 5 gives 90/100.`
    };
  }

  if (std.includes("G.") || std.includes("AREA") || std.includes("VOL")) {
    return {
      because: `The area of a parallelogram is calculated using base × perpendicular height **because** a triangle cut from one side can slide to form a rectangle.`,
      but: `The slanted side of a parallelogram has a length, **but** it cannot be used as the height because height must be measured perpendicular (at 90°) to the base.`,
      so: `The base is 10 cm and the perpendicular height is 6 cm, **so** the total area is 60 cm² because 10 × 6 = 60.`
    };
  }

  if (std.includes("NS.1") || std.includes("FRAC")) {
    return {
      because: `Dividing 3 by 1/4 equals 12 **because** twelve 1/4-sized pieces fit inside 3 whole units.`,
      but: `Multiplying by a whole number makes a value larger, **but** dividing by a unit fraction (less than 1) creates a larger quotient because smaller pieces are being counted.`,
      so: `Chef Mia has 4 cups of sugar and each cake needs 1/2 cup, **so** she can bake 8 cakes because 4 ÷ (1/2) = 8.`
    };
  }

  if (std.includes("NS") || std.includes("INT") || std.includes("COORD")) {
    return {
      because: `The opposite of -8 is +8 **because** both numbers are exactly 8 units away from 0 on the number line in opposite directions.`,
      but: `Zero is an integer, **but** it is neither positive nor negative because it serves as the neutral origin point.`,
      so: `The diver descended 25 feet below sea level, **so** her elevation is represented by the integer -25 because sea level is 0.`
    };
  }

  if (std.includes("EE") || std.includes("EQ") || std.includes("EXP")) {
    return {
      because: `The equation x + 7 = 15 is balanced **because** performing the inverse operation of subtracting 7 from both sides isolates x = 8.`,
      but: `An expression like 3x + 5 has numbers and a variable, **but** it cannot be solved for a single value because it has no equal sign.`,
      so: `A movie ticket costs $12 and the group spent $60, **so** the equation is 12t = 60 and the number of tickets purchased is 5.`
    };
  }

  // Default General Stem
  return {
    because: `This mathematical model proves the solution **because** each step follows the precise rules of operations and properties of equality.`,
    but: `An estimate gives a quick check, **but** exact calculation is required to verify precision and units.`,
    so: `The student organized the given facts into a structured diagram, **so** the unknown value could be determined with certainty.`
  };
}

/**
 * Renders the TWR Writing Block HTML.
 */
export function renderTWRSectionHtml(standard, topic, lessonData = {}) {
  const stems = getTWRStems(standard, topic, lessonData);

  return `
    <section class="ws-twr-section" style="background:#f8fafc;border:1.5px solid #cbd5e1;border-left:5px solid #0f766e;border-radius:8px;padding:14px 18px;margin:16px 0;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:11.5px;font-weight:800;color:#0f766e;letter-spacing:0.04em;text-transform:uppercase;">✍️ The Writing Revolution (TWR) · Mathematical Sentence Expansion</span>
        <span style="font-size:10.5px;font-weight:700;color:#475569;">Because · But · So</span>
      </div>
      <p style="font-size:12.5px;font-weight:600;color:#1e293b;margin-bottom:10px;">Complete each sentence stem to demonstrate precise mathematical reasoning:</p>
      
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;">
          <div style="font-size:12px;font-weight:700;color:#0f172a;line-height:1.6;">
            <span style="display:inline-block;background:#ccfbf1;color:#0f766e;font-weight:800;padding:1px 6px;border-radius:4px;font-size:11px;margin-right:4px;">BECAUSE</span>
            ${stems.because}
          </div>
        </div>

        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;">
          <div style="font-size:12px;font-weight:700;color:#0f172a;line-height:1.6;">
            <span style="display:inline-block;background:#fef3c7;color:#b45309;font-weight:800;padding:1px 6px;border-radius:4px;font-size:11px;margin-right:4px;">BUT</span>
            ${stems.but}
          </div>
        </div>

        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;">
          <div style="font-size:12px;font-weight:700;color:#0f172a;line-height:1.6;">
            <span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-weight:800;padding:1px 6px;border-radius:4px;font-size:11px;margin-right:4px;">SO</span>
            ${stems.so}
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Renders Domain-Specific CER 2.0 Argumentation Matrix with Cloze Sentence Frames.
 */
export function renderDomainCERHtml(cfg = {}) {
  const claimPrompt = cfg.claimPrompt || "My mathematical claim is that the solution is...";
  const evidencePrompt = cfg.evidencePrompt || "The evidence from the model/table shows that...";
  const reasoningPrompt = cfg.reasoningPrompt || "This proves my claim because the mathematical definition of...";

  return `
    <section class="ws-cer-section" style="background:#ffffff;border:1.5px solid #cbd5e1;border-radius:8px;padding:14px 18px;margin:16px 0;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1.5px solid #e2e8f0;padding-bottom:6px;">
        <span style="font-size:11.5px;font-weight:800;color:#0f172a;letter-spacing:0.04em;">📐 MATHEMATICAL PROOF &amp; JUSTIFICATION MATRIX (CER 2.0)</span>
        <span style="font-size:10.5px;font-weight:700;color:#64748b;">SMP.3 / Construct Viable Arguments</span>
      </div>
      <p style="font-size:12px;font-weight:600;color:#334155;margin-bottom:10px;"><b>Task:</b> Use complete mathematical sentences, precise units, and rule citations to justify your final solution.</p>
      
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;align-items:flex-start;">
          <div style="width:90px;font-size:11.5px;font-weight:800;color:#0f766e;flex-shrink:0;"><b>C</b> Claim</div>
          <div style="flex:1;">
            <span style="font-size:11px;color:#64748b;font-style:italic;display:block;margin-bottom:4px;">Starter: ${esc(claimPrompt)}</span>
            <div style="border-bottom:1.5px solid #cbd5e1;height:24px;"></div>
          </div>
        </div>

        <div style="display:flex;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;align-items:flex-start;">
          <div style="width:90px;font-size:11.5px;font-weight:800;color:#b45309;flex-shrink:0;"><b>E</b> Evidence</div>
          <div style="flex:1;">
            <span style="font-size:11px;color:#64748b;font-style:italic;display:block;margin-bottom:4px;">Starter: ${esc(evidencePrompt)}</span>
            <div style="border-bottom:1.5px solid #cbd5e1;height:24px;"></div>
            <div style="border-bottom:1.5px solid #cbd5e1;height:24px;"></div>
          </div>
        </div>

        <div style="display:flex;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;align-items:flex-start;">
          <div style="width:90px;font-size:11.5px;font-weight:800;color:#1d4ed8;flex-shrink:0;"><b>R</b> Reasoning</div>
          <div style="flex:1;">
            <span style="font-size:11px;color:#64748b;font-style:italic;display:block;margin-bottom:4px;">Starter: ${esc(reasoningPrompt)}</span>
            <div style="border-bottom:1.5px solid #cbd5e1;height:24px;"></div>
            <div style="border-bottom:1.5px solid #cbd5e1;height:24px;"></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Contextual Talk Moves for Mathematical Discourse.
 */
export function renderContextualDiscourseHtml(promptText, partnerA = "", partnerB = "") {
  const pA = partnerA || "I decomposed this problem by...";
  const pB = partnerB || "I agree/disagree with your step because the math rule states...";

  return `
    <section class="ws-discourse-box" style="background:#f0fdfa;border:1.5px solid #99f6e4;border-radius:8px;padding:12px 16px;margin:14px 0;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:800;color:#0f766e;letter-spacing:0.04em;">🗣️ MATHEMATICAL DISCOURSE &amp; SOCRATIC TALK MOVES</span>
        <span style="font-size:10px;font-weight:700;color:#134e4a;">Collaborative Reasoning</span>
      </div>
      <p style="font-size:12px;font-weight:600;margin-bottom:8px;color:#134e4a;"><b>Discussion Prompt:</b> ${esc(promptText)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:#ffffff;border:1px solid #ccfbf1;border-radius:6px;padding:8px 10px;font-size:11.5px;color:#115e59;">
          <b>🗣️ Partner A:</b> "${esc(pA)}"
        </div>
        <div style="background:#ffffff;border:1px solid #ccfbf1;border-radius:6px;padding:8px 10px;font-size:11.5px;color:#115e59;">
          <b>👂 Partner B:</b> "${esc(pB)}"
        </div>
      </div>
    </section>
  `;
}

// TWR connector meanings in kid language — ONE source for the Language Studio player
// (bcpss-teachers/language-studio/studio-kinds/sentence_combine.js) and the printed workbook
// (functions/_lib/bcpss/studio-doc-activities.js). Unknown connectors get no hint rather than a wrong one.
// Each entry: [connector pattern, screen wording (full sentence), print wording (compact mini key)].
const TABLE = [
  ["because|since", "gives a reason. It answers why?", "gives a reason (why?)"],
  ["so that", "tells the purpose. It answers what for?", "tells the purpose (what for?)"],
  [
    "so|as a result( of)?|therefore|consequently|(which )?(leads|led) to|leading to|which led|(which )?causes",
    "tells a result. It answers what happened because of it?",
    "tells a result (what happened?)",
  ],
  [
    "but|yet|however|even so",
    "changes direction. The next idea is different.",
    "changes direction (a different idea)",
  ],
  [
    "although|even though|though",
    "shows a surprise. One idea is true even with the other.",
    "shows a surprise (true anyway)",
  ],
  [
    "whereas|in contrast|unlike",
    "shows a contrast. It puts two different things side by side.",
    "shows a contrast (two different things)",
  ],
  [
    "while",
    "shows a contrast, or two things at the same time.",
    "shows a contrast, or two things at the same time",
  ],
  [
    "when|after|before|(and )?then|later|eventually|meanwhile",
    "tells time. It answers when?",
    "tells time (when?)",
  ],
  ["and|also|both", "adds another idea.", "adds another idea"],
  [
    "which|that|that has|which (means|shows|shows that|helps|makes|proves that)",
    "adds information about the thing you just named.",
    "adds information about a thing",
  ],
  [
    "according to|as shown by|for example",
    "names the evidence. It answers how do you know?",
    "names the evidence (how do you know?)",
  ],
].map(([k, screen, print]) => ({ re: new RegExp(`^(${k})$`), screen, print }));

/** Meaning of a connector; `form` is "screen" (default) or "print". Empty string when unknown. */
export function connectorMeaning(connector, form = "screen") {
  const hit = TABLE.find((row) =>
    row.re.test(
      String(connector ?? "")
        .trim()
        .toLowerCase(),
    ),
  );
  return hit ? hit[form] || "" : "";
}

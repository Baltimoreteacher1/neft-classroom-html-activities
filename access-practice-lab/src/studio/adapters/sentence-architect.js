// Adapter: Sentence Architect Studio (ARCHITECT_KERNELS in src/platform/data/platformData.js, /architect). The studio is
// one page, so it is one source (ref "studio"). Each kernel sentence becomes its parts (who or what, action, why or
// how) and its phrase blocks by slot with their Developing / Expanding tier, then one open writing response: expand the
// kernel with the blocks. The studio has no single right sentence, so nothing here is graded.

import { fitter, openQuestion, practiceDraft, textBlock, withSpanish } from "./practice-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../platform/data/platformData.js");

function kernelBlocks(k, n, cue, fit) {
  const slots = [...new Set(list(k.blocks).map((b) => b.slot))];
  const lines = slots.map(
    (slot) =>
      `${slot}: ${list(k.blocks)
        .filter((b) => b.slot === slot)
        .map((b) => `"${text(b.text)}" (${text(b.category)}, ${text(b.tier)})`)
        .join("; ")}`,
  );
  return [
    textBlock(
      `k${n}`,
      `**${text(k.subject)} · ${text(k.klu)}**\nKernel: ${text(k.kernel)}\nWho or what: ${text(k.whoWhat)} · Action: ${text(k.action)} · Why or how: ${text(k.whyHow)}\n\n${lines.join("\n")}`,
      "body",
      fit,
    ),
    openQuestion(
      fit,
      {
        id: `kernel${n}`,
        prompt: `Expand the kernel sentence "${text(k.kernel)}" with blocks from the list. Tell why or how: ${text(k.whyHow)}.`,
        hint: withSpanish("", cue, 400),
        skill: "sentence expansion",
      },
      { kind: "write", rubric: ["I kept the kernel's who or what and action.", "I added a block that tells why or how."] },
    ),
  ];
}

export default {
  family: "sentence-architect",
  label: t("Sentence Architect Studio", "Estudio Arquitecto de oraciones"),
  note: t(
    "Copies the studio's kernel sentences and their phrase blocks into a draft you can edit.",
    "Copia las oraciones núcleo del estudio y sus bloques de frases en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "prompts",
    "hints",
    "rubric",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("Snapping blocks onto the sentence and the level meter", "Encajar bloques en la oración y el medidor de nivel"),
      why: t(
        "The studio builds and rates the sentence on screen; the draft lists the blocks and asks for the expanded sentence.",
        "El estudio construye y valora la oración en pantalla; el borrador muestra los bloques y pide la oración ampliada.",
      ),
    },
  ],

  async list() {
    const { ARCHITECT_KERNELS } = await load();
    return [
      {
        id: "studio",
        title: "Sentence Architect Studio",
        grade: "K-8",
        subject: "",
        domain: "Writing",
        description: "Kernel sentences with Developing and Expanding phrase blocks.",
        count: ARCHITECT_KERNELS.length,
      },
    ];
  },

  url: () => "/access-practice-lab/architect",

  async extract(ref) {
    if (ref !== "studio") throw new Error("not-found");
    const { ARCHITECT_KERNELS, L1_AUDIO_CUES } = await load();
    const { fit, overflow } = fitter();
    return {
      activity: practiceDraft(fit, overflow, {
        title: "Sentence Architect: expand kernel sentences",
        description: "Expand short kernel sentences with connector, verb, place and evidence blocks.",
        grade: "K-8",
        objective: "Expand a kernel sentence with precise words and a why or how clause.",
        sourceNote: "Copied from the Sentence Architect Studio.",
        spanish: Boolean(text(L1_AUDIO_CUES?.es)),
        blocks: ARCHITECT_KERNELS.flatMap((k, i) => kernelBlocks(k, i + 1, L1_AUDIO_CUES?.es, fit)),
        teacher: [
          "Copied from the Sentence Architect Studio: every kernel, K-2 to 6-8, with its eight blocks (two tiers per slot).",
          "The self-check lines restate the studio's structure (kernel parts plus a why or how block); the studio's level meter is not carried.",
        ],
      }),
      notes: [
        t(
          "Not carried: snapping blocks onto the sentence, the level meter and the home-language audio cues other than Spanish.",
          "No se conserva: encajar bloques en la oración, el medidor de nivel ni las pistas de audio en otros idiomas además del español.",
        ),
      ],
      source: ARCHITECT_KERNELS,
      url: "/access-practice-lab/architect",
      sourceTitle: "Sentence Architect Studio",
    };
  },
};

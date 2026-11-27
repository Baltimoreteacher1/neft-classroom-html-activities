// Shared fixtures for the Studio X wiring checks (studio-x-wire.test.mjs and studio-x-wire-e2e.mjs).
import { Document, Packer, Paragraph, TextRun } from "docx";

export const VOCAB_REQUEST = `Create a worksheet about ecosystems with visual vocabulary and sentence frames
habitat - the place where an animal lives
producer - a living thing that makes its own food
consumer - a living thing that eats other living things
decomposer - a living thing that breaks down dead matter
predator - an animal that hunts other animals
prey - an animal that is hunted by other animals`;

/** Three numbered multiple-choice questions; the second has NO marked answer. */
export const MC_TEXT = `1. What is a producer?
a) An animal that hunts
*b) A living thing that makes its own food
c) A thing that breaks down matter

2. What is a consumer?
a) A thing that eats other living things
b) A thing that makes its own food
c) A thing that breaks down matter

3. What is a decomposer?
a) A living thing that breaks down dead matter
*b) An animal that hunts
c) A thing that makes food
`;

/** A small real Word file made with the installed `docx` package. Returns a Buffer. */
export async function makeDocx(lines = MC_TEXT.trim().split("\n")) {
  const doc = new Document({
    sections: [
      {
        children: lines.map((t) => new Paragraph({ children: [new TextRun(t)] })),
      },
    ],
  });
  return Packer.toBuffer(doc);
}

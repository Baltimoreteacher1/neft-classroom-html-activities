# Axiom City — character sheet for generated comic art

Source of truth for every image prompt. `tools/gn-art.mjs` reads the `prompt:` lines below by key
(`{{maya}}`, `{{vex}}` …) and substitutes them into each panel prompt, so a look is described once
and reused word for word in every panel of every book. Derived from the SVG symbols every book
carries (`#sym-maya`, `#sym-theo`, `#sym-zara`, `#sym-dev`, `#sym-vex`, `#sym-glitch`), using the
colours as drawn (the symbol comments disagree in places; the drawn fills win).

The four crew symbols are the same four kids in every book; some books give them different names.
Map the speaker in a balloon to its symbol before writing a prompt.

| Symbol        | Vol 1-5 name | Unit 6 episodes name | Seed |
| ------------- | ------------ | -------------------- | ---- |
| `#sym-maya`   | Maya Chen    | Keiko                | 1101 |
| `#sym-theo`   | Theo Okafor  | Andre                | 2202 |
| `#sym-zara`   | Zara Quinn   | Layla                | 3303 |
| `#sym-dev`    | Dev Patel    | Mateo                | 4404 |
| `#sym-vex`    | VEX          | VEX                  | 5505 |
| `#sym-glitch` | the glitch   | the glitch           | 6606 |

All four kids are sixth graders (about 11-12 years old), drawn with simple round cartoon faces, dot
eyes and big expressions, the same proportions, never older-looking.

## Prompt fragments

- style: Middle-grade graphic novel panel, clean cel-shaded coloring, bold black ink outlines, rounded cartoon characters with big expressive faces, navy teal amber and coral palette
- notext: Wordless art, all surfaces blank, no lettering, no numbers, no speech bubbles
- maya: a girl age 11 with light peach skin, black hair in a high round bun, crimson red zip jacket
- theo: a boy age 11 with deep dark brown skin, short black flat-top hair, royal blue hoodie
- zara: a girl age 11 with tan skin, dark brown hair in a top bun, emerald green sweatshirt
- dev: a boy age 11 with medium brown skin, spiky black hair, burnt orange t-shirt
- vex: a small floating dark teal hexagon robot orb with exactly one big round glowing golden eye in the center of its front face, cyan glow, no limbs
- glitch: the glitch, a scribbly teal chalk-cloud creature with round yellow eyes, coral eyebrows and a sly yellow grin
- vault: an underground stone vault under an old library, dark blue stone, brass pipes, glowing brass lanterns
- ring: a giant round stone dial on the wall with a smooth plain navy face, gold rim, a circle of plain glowing cyan dots and a gold hub

## Rules for every prompt

1. Start with `{{style}}. {{notext}}.` FLUX reads at most 256 T5 tokens, so anything past that is cut; the
   rules that must survive go first. Keep a prompt under ~190 words once expanded.
2. Never put a name in a prompt: the model letters it into the picture ("VEX" came back painted on a wall).
   Name each kid by symbol key (`{{theo}}`), never by story name: the model has no idea who Andre is.
3. Leave room for lettering: say where the empty area is ("empty dark stone wall across the top third").
4. A sign, chalkboard or plate the story writes on is drawn BLANK; the words are live HTML on top.
5. One to three characters per panel; four only in establishing shots, where faces stay small.

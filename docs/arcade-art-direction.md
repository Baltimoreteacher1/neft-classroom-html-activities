# EduWonderLab Arcade art direction

The Arcade is a connected archipelago of mathematical worlds. The map illustration lives at `math/games/shared/art/arcade-archipelago.webp`. Every unit Expedition has an original environment painting inside its actual mission scene: Decimal Dash, Factor Frenzy, Fraction Frenzy, Ratio Rush, Percent Power, Area Attack, Expression Express, Equation Quest, Data Dash, Coordinate Quest, and Volume Blast. All 12 images were generated for this project and optimized as WebP. Keep source code and gameplay legible over the paintings.

## Palette and materials

- Deep ocean `#061e32`, panel navy `#071c31`, warm white `#f5f8fb`.
- Navigational gold `#ffe1a1` signals destinations and progress; sea teal `#8ce5e0` signals active flow.
- Use stone, glass, brushed metal, foliage, and water as world-specific materials. Mathematical objects need distinct edges and enough contrast to be counted or compared.
- Use the CSS tokens in `math/games/practice-arcade/world-art.css` for map chrome. In Phaser expeditions, reuse `kit.sky`, `kit.illustration`, `kit.panel`, and the game definition's accent.

## Gameplay composition

- Put high-detail landmarks near the edges. Reserve the middle for manipulable models, labels, and feedback.
- Place authored environment paintings behind the engine's mathematical objects at depth `-97`. Progress and student inputs should continue to change the drawn world above the painting.
- Every world image needs a text route, readable controls, and an accessible description. Art never carries required mathematical information by itself.
- Respect reduced motion. Keep visual effects brief and subordinate to the math model.

## Asset production

- Use original or licensed images. Do not copy reference art or include text baked into illustrations.
- Optimize display images to WebP; retain the dimensions in HTML so the page has a stable layout.
- Check actual mission and map screenshots at desktop, Chromebook, tablet, and phone sizes before release.

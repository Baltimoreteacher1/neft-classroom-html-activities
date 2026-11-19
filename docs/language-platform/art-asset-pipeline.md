# Original environmental art pipeline

The Museum and Newsroom paintings were generated for this project with the built-in image-generation tool. They are original environments, not copied competitor screenshots. No student information or uploaded classroom records were used. Other new scenes/portraits are project-authored SVGs.

Direction: coherent harbor setting, sage and ivory architecture, deep navy furniture, warm oak, restrained brass lighting, readable spatial composition, no embedded interface text or solution clues. Keep instructional text, evidence choices and progress in semantic HTML; do not bake them into an image.

Runtime assets live in `access-practice-lab/pictures/premium/`:

- `museum-gallery.jpg` / `museum-gallery-640.jpg`
- `newsroom-editorial.jpg` / `newsroom-editorial-640.jpg`
- Original family/student SVG illustrations.

The 1440px variants are under 320,000 bytes each. The 640px variants are under 90,000 bytes each. Image elements declare dimensions, responsive `srcset`/`sizes`, asynchronous decoding and lazy loading. These assets are used only on their relevant scene, not on ordinary teacher pages. Existing scene mechanics remain code-native; these backgrounds do not imply free-roaming 3D gameplay.

For a new raster environment: generate an original scene in the same direction; visually inspect for misleading text or artifacts; retain the original source; create 1440px and 640px delivery variants with standard image encoding tools; enforce the byte budgets; add semantic controls separately; regenerate the shell cache with `node tools/sync-access-shell.mjs`; inspect desktop/tablet/mobile renders and reduced-motion behavior. Keep source illustration and delivery format independent so content and controls stay editable.

The current generated source PNGs are retained in Codex's generated-image archive. Runtime assets are included in this repository. Future changes should create new versioned assets rather than overwrite unrelated teacher artwork.

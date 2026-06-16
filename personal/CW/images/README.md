# Images folder

Drop your real photos here. The site is designed to look polished **without**
any real photos (it uses tasteful CSS placeholders), so nothing breaks if these
folders are empty. Replace placeholders gradually as you collect real images.

## Suggested structure

- `hero/` — large hero/banner background images (landscape, ~1600×900px)
- `gallery/` — gallery photos grouped by event type
- `american/` — images specific to the American branch
- `filipino/` — images specific to the Filipino branch
- `icons/` — small icons (SVG preferred)
- `og-default.png` — social-share preview image (1200×630px). Referenced by the
  SEO meta tags as a PLACEHOLDER path. Add this file before launch.

## Tips

- Prefer `.webp` or optimized `.jpg` for photos, `.svg` for icons/logos.
- Always keep images reasonably sized (web-optimized) for fast loading.
- When you add real images, wire them into the relevant `.astro` page or the
  `src/data/gallery.ts` file and give every image meaningful `alt` text.

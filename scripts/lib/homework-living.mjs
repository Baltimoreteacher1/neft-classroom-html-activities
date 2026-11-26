import { interactiveVisualHost } from "@eduwonderlab/engine/core/interactive-visual.js";

/**
 * The lesson's living scene (launch.conceptIntro.livingScene) on the family
 * page: a short See it, Try it, Explain it film the student steps through.
 * One source of truth with the lesson's Learn It and the Practice Studio, so a
 * family and a classroom see the same model with the same numbers. Lessons
 * that author none render nothing. The film mounts from
 * engine/homework-lesson-models.js and re-mounts in the new language when the
 * page language changes (progress is kept, so it reopens on the same scene).
 */
export function renderLivingScene(config) {
  const living = config?.launch?.conceptIntro?.livingScene;
  if (!living || living.kind !== "living-scene") return "";
  const host = interactiveVisualHost(
    { ...living, lessonId: `family-${config.lessonId || config.id || ""}` },
    {
      ariaLabel: "Interactive scene: see it, try it, explain it",
      fallback: "Turn on JavaScript to step through this interactive scene.",
    },
  );
  if (!host) return "";
  return `<section class="fp-living" aria-labelledby="hw_living_label">
        <p class="fp-label" id="hw_living_label"><span class="lang-en">See it, try it, explain it · about 3 minutes</span><span class="lang-es" lang="es">Míralo, pruébalo, explícalo · unos 3 minutos</span></p>
        <div data-living-host>${host}</div>
      </section>`;
}

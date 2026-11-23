// Lesson player view (/vocabulary-academy/grade/<G>/lesson/<N>/<a-h>). Learner-facing; teacher-only fields are never read.
// Interface: render(ctx, va) → { title, html }; mount(root, ctx, va); unmount(va); onClick/onChange/onInput/onKey (the player
// attaches its own listeners to the lesson container, so these only report "not handled").
import { BASE, html } from "../../util.js";
import { sectionTitle } from "../contract.js";
import { crumbs, lessonTrail, notPublishedPanel } from "../ui.js";
import { gradeHref, lessonHref } from "../data.js";
import { closeSession, mountSession, openLesson, shellHTML } from "../lessons/player.js";
import { ensureLessonCss } from "../lessons/ui.js";

let session = null;

export async function render(ctx, va) {
  closeSession(session);
  session = null;
  const { I } = va;
  const { grade, n, letter } = va.params;
  const section = I.S(...sectionTitle(letter, n));
  const trail = lessonTrail(I, grade, n, 0);
  const [res] = await Promise.all([openLesson({ grade, n, letter }, va), ensureLessonCss(BASE)]);
  if (res.error === "deps")
    return {
      title: I.S("Lesson", "Lección"),
      html: html`${crumbs(I, [...trail, [section, ""]])}${notPublishedPanel(I, {
        title: I.T("This lesson is not ready yet", "Esta lección todavía no está lista"),
        text: I.T("Part of the Academy is still loading. Your progress is safe. Try again in a moment.", "Una parte de la Academia todavía se está cargando. Tu progreso está a salvo. Inténtalo de nuevo en un momento."),
        href: lessonHref(grade, n),
        label: I.T("Back to the lesson", "Volver a la lección"),
      })}`,
    };
  if (res.error === "unit")
    return {
      title: I.S("Lesson", "Lección"),
      html: html`${crumbs(I, [...trail, [section, ""]])}${notPublishedPanel(I, {
        title: I.T("This lesson is not published yet", "Esta lección todavía no está publicada"),
        text: I.T("The words for this lesson are still being written. Pick another lesson from the grade page.", "Las palabras de esta lección todavía se están escribiendo. Elige otra lección en la página del grado."),
        href: gradeHref(grade),
        label: I.T("Back to the grade", "Volver al grado"),
      })}`,
    };
  session = res.S;
  return { title: `${section} · ${session.unit.title}`, html: shellHTML(session) };
}

export function mount(root) {
  if (session) mountSession(session, root);
}

export function unmount() {
  closeSession(session);
  session = null;
}

export const onClick = () => false;
export const onChange = () => false;
export const onInput = () => false;
export const onKey = () => false;

// Optional original scene paintings. Import the bytes through the same sanitising image
// pipeline as an uploaded picture; project/EPUB exports therefore carry the actual media.
import { MediaError, prepareImage } from './editor-media.js';
export const CURATED_SCENES = Object.freeze([
  Object.freeze({ id: 'museum-gallery', en: 'Museum gallery', es: 'Galería del museo',
    altEn: 'A sunlit museum gallery with display cases, a model ship, and an empty glass case at the centre.',
    altEs: 'Una galería de museo iluminada con vitrinas, un barco en miniatura y una vitrina vacía en el centro.' }),
  Object.freeze({ id: 'newsroom-editorial', en: 'Newsroom editorial desk', es: 'Mesa de redacción',
    altEn: 'A newsroom workspace with reporting desks, microphones, a camera and an evidence board.',
    altEs: 'Una redacción con mesas de trabajo, micrófonos, una cámara y un tablero de evidencia.' }),
]);
export const sceneOf = (id) => CURATED_SCENES.find((scene) => scene.id === id) || null;
export const sceneSource = (id, preview = false) => sceneOf(id)
  ? `/access-practice-lab/pictures/premium/${id}${preview ? '-640' : ''}.jpg` : '';
export async function importCuratedScene(id, fetcher = fetch, prepare = prepareImage) {
  if (!sceneOf(id)) throw new MediaError('scene', 'Choose a scene from this gallery.', 'Elige una escena de esta galería.');
  const response = await fetcher(sceneSource(id), { credentials: 'same-origin' });
  if (!response.ok) throw new MediaError('scene-load', 'This scene is unavailable. Reconnect and try again, or upload a picture.', 'Esta escena no está disponible. Reconecta e inténtalo de nuevo, o sube una imagen.');
  const bytes = await response.blob();
  const file = new File([bytes], `${id}.jpg`, { type: 'image/jpeg' });
  return prepare(file);
}

/** Pick an opaque backing with the stronger WCAG contrast against the authored text colour. */
export function readableSceneBacking(colour = '#17324d') {
  const value = /^#[0-9a-f]{6}$/i.test(colour) ? colour.slice(1)
    : /^#[0-9a-f]{3}$/i.test(colour) ? [...colour.slice(1)].map(c => c + c).join('') : '17324d';
  const rgb = [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16) / 255)
    .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  const luminance = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  return (1.05 / (luminance + .05)) >= ((luminance + .05) / .05) ? '#ffffff' : '#000000';
}

// The studio video card on the Language Page app's own routes (data/studio-videos.json `pages`).
// The routes come from studio-video-routes.js, generated from that manifest, so a route with no video
// costs one object lookup and no network request. The card and its player load only for a mapped route.
import { STUDIO_VIDEO_ROUTES, STUDIO_VIDEOS } from "./studio-video-routes.js";

const PLAYER = "/assets/studio-video/studio-video.js";
const STYLES = "/assets/studio-video/studio-video.css";

/** The card for a pathname, or null. "/x/" and "/x" are the same route. */
export function studioVideoFor(pathname) {
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const id = STUDIO_VIDEO_ROUTES[key];
  return id ? STUDIO_VIDEOS[id] : null;
}

/**
 * Append the card to `root` when this route has one. `isCurrent()` is checked after the player loads so a
 * slow import cannot add a card to the next screen.
 */
export async function mountStudioVideo(root, pathname, isCurrent = () => true) {
  const entry = studioVideoFor(pathname);
  if (!entry) return;
  if (!document.querySelector(`link[href="${STYLES}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLES;
    document.head.append(link);
  }
  try {
    const player = await import(PLAYER);
    if (!isCurrent() || root.querySelector(`studio-video[data-id="${entry.id}"]`)) return;
    player.mountStudioVideo(root, entry);
  } catch (error) {
    // The video is an extra: a failed load must never break the practice screen.
    console.warn("[access-lab] studio video unavailable", error);
  }
}

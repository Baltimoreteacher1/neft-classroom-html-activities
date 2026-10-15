// Connects a learning lab to Curriculum 2.0 without changing how the lab itself works.
//  - When the student finishes the lab's core work (investigate + practice), the mission stage "lab" is marked
//    for each connected lesson in EWLStateStore, so the Today's Mission cockpit shows it.
// Learning labs hold only learning-lab content, so there is no "Go deeper" card: the Living Math Canvas and
// Math Reality Lab are reached from each lesson's page, not from inside a lab.
// Everything here is optional: if the shared scripts or the map cannot load, the lab behaves exactly as before.
const CORE = ['rational.js', 'state-store.js'];
const LESSON = /^[1-9]\d?-\d{1,2}$/;

function loadScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src; s.async = false; s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

async function loadCore() {
  if (window.EWLStateStore) return window.EWLStateStore;
  for (const f of CORE) if (!(await loadScript(`/assets/ewl/${f}`))) return null;
  return window.EWLStateStore || null;
}

export async function connect(lab, getLang) {
  loadScript('/assets/ewl/reference-loader.js');
  const store = await loadCore();
  const lessons = (lab.lessons || []).map((l) => l.id).filter((id) => LESSON.test(id));
  return {
    progress(overview) {
      if (!store) return;
      const core = ['investigate', 'practice'].map((id) => overview.items.find((i) => i.id === id));
      if (core.every((i) => i?.status === 'done')) for (const id of lessons) { try { store.markStage(id, 'lab'); } catch { /* ignore bad id */ } }
    },
  };
}

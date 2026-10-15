// Connects a learning lab to Curriculum 2.0 without changing how the lab itself works.
//  - When the student finishes the lab's core work (investigate + practice), the mission stage "lab" is marked
//    for each connected lesson in EWLStateStore, so the Today's Mission cockpit shows it.
//  - A "Go deeper" card links to the Living Math Canvas scenes and Math Reality Lab investigations that extend
//    this lab's lessons (data/ewl/integration-map.json, derived from those pages' own data).
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

async function loadMap() {
  try {
    const r = await fetch('/data/ewl/integration-map.json', { credentials: 'same-origin' });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

const text = (es, en, spanish) => (es ? spanish : en);

function card(links, es) {
  const section = document.createElement('section');
  section.className = 'ewl-deeper';
  section.setAttribute('aria-labelledby', 'ewl-deeper-title');
  const h = document.createElement('h3');
  h.id = 'ewl-deeper-title';
  h.textContent = text(es, 'Go deeper', 'Ve más a fondo');
  const p = document.createElement('p');
  p.textContent = text(es, 'Two more ways to work with the same ideas.', 'Dos maneras más de trabajar con las mismas ideas.');
  const ul = document.createElement('ul');
  for (const l of links) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = l.href; a.textContent = text(es, l.en, l.es);
    li.appendChild(a);
    ul.appendChild(li);
  }
  section.append(h, p, ul);
  return section;
}

export async function connect(lab, getLang) {
  loadScript('/assets/ewl/reference-loader.js');
  const [store, map] = await Promise.all([loadCore(), loadMap()]);
  const lessons = (lab.lessons || []).map((l) => l.id).filter((id) => LESSON.test(id));
  const entry = map?.learningLabs?.[lab.id] || null;
  return {
    progress(overview) {
      if (!store) return;
      const core = ['investigate', 'practice'].map((id) => overview.items.find((i) => i.id === id));
      if (core.every((i) => i?.status === 'done')) for (const id of lessons) { try { store.markStage(id, 'lab'); } catch { /* ignore bad id */ } }
    },
    deeper(host) {
      if (!entry || host.querySelector('.ewl-deeper')) return;
      const q = `lesson=${encodeURIComponent(lessons[0] || '')}`;
      const links = [];
      for (const scene of entry.canvas || []) links.push({ href: `/curriculum/math-canvas/?scene=${encodeURIComponent(scene)}&${q}`, en: `Explore it in the Living Math Canvas (${scene.replace(/-/g, ' ')})`, es: `Explóralo en el Lienzo Matemático Vivo (${scene.replace(/-/g, ' ')})` });
      for (const inv of entry.lab || []) links.push({ href: `/curriculum/reality-lab/?inv=${encodeURIComponent(inv)}&${q}`, en: `Test a claim in the Math Reality Lab (${inv.replace(/-/g, ' ')})`, es: `Prueba una afirmación en el Laboratorio de Realidad Matemática (${inv.replace(/-/g, ' ')})` });
      const modes = [['forge', 'bot', 'Counterexample Forge', 'Fragua de contraejemplos'], ['invariant', 'hunt', 'Invariant Hunter', 'Cazador de invariantes'], ['sketch', 'story', 'Sketch it', 'Dibújalo']];
      for (const [kind, param, en, es] of modes)
        for (const id of entry[kind] || []) links.push({ href: `/curriculum/reality-lab/?mode=${kind}&${param}=${encodeURIComponent(id)}&${q}`, en: `${en} (${id.replace(/-/g, ' ')})`, es: `${es} (${id.replace(/-/g, ' ')})` });
      if (links.length) host.appendChild(card(links.slice(0, 4), getLang?.() === 'es'));
    },
  };
}

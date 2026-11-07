// Small DOM helpers and shared copy for the class views. The views build their own DOM after mount (they poll),
// so nothing here goes through the lab's html`` renderer.

export function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) node.append(kid);
  return node;
}

/** Plain-string error copy for the codes the class server and shared contract return. */
export function errorText(S, code) {
  const map = {
    "invalid-code": S("That class code is not right. It has 6 letters and numbers.", "Ese código de clase no es correcto. Tiene 6 letras y números."),
    "class-not-found": S("No class has that code. Check it with your teacher.", "Ninguna clase tiene ese código. Revísalo con tu maestro o maestra."),
    "alias-too-short": S("Pick a nickname with at least 2 letters.", "Elige un apodo de al menos 2 letras."),
    "alias-too-long": S("Pick a shorter nickname (20 characters or fewer).", "Elige un apodo más corto (20 caracteres o menos)."),
    "alias-contact": S("A nickname cannot include an email, a link or a phone number.", "Un apodo no puede incluir un correo, un enlace ni un número de teléfono."),
    "alias-characters": S("Use letters, numbers, spaces, - or ' only.", "Usa solo letras, números, espacios, - o '."),
    "alias-too-many-words": S("A nickname is one or two words, not a full name.", "Un apodo tiene una o dos palabras, no un nombre completo."),
    "alias-taken": S("Someone already uses that nickname. Add your student key to rejoin as yourself, or pick another.", "Alguien ya usa ese apodo. Agrega tu clave de estudiante para volver como tú, o elige otro."),
    "class-full": S("This class is full.", "Esta clase está llena."),
    unauthorized: S("Your class sign-in did not work. Rejoin with your nickname and student key.", "No funcionó tu ingreso a la clase. Vuelve a entrar con tu apodo y tu clave de estudiante."),
    offline: S("No connection right now. Your work is safe on this device.", "No hay conexión ahora. Tu trabajo está seguro en este dispositivo."),
    "backend-not-configured": S("Classes are not turned on for this site yet. Your work still saves on this device.", "Las clases aún no están activadas en este sitio. Tu trabajo se sigue guardando en este dispositivo."),
  };
  return map[code] || S("Something went wrong. Your work is safe on this device.", "Algo salió mal. Tu trabajo está seguro en este dispositivo.");
}

export function statusText(S, status) {
  if (!status) return S("Not synced yet.", "Aún no se sincroniza.");
  if (status.state === "synced") return S("Saved to your class.", "Guardado en tu clase.");
  if (status.state === "offline") return S("Offline. It will sync when you are back online.", "Sin conexión. Se sincronizará cuando vuelvas a estar en línea.");
  return S("Could not sync. Your work is safe on this device.", "No se pudo sincronizar. Tu trabajo está seguro en este dispositivo.");
}

export async function toBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

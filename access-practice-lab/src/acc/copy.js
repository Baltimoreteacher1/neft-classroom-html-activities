// Ecosystem chrome copy. Practice-material disclaimers are stated once, here, in every locale the
// ecosystem ships. Never claim WIDA/DRC affiliation, certification, official scoring or compliance.
export const CHROME = {
  en: {
    brand: "ACCESS Practice Lab",
    brandSub: "by EduWonderLab",
    navLabel: "ACCESS sections",
    crumbLabel: "Breadcrumb",
    footerNav: "ACCESS links",
    skip: "Skip to content",
    disclaimerLead: "Independent practice material.",
    disclaimer:
      "The ACCESS Practice Lab is made by EduWonderLab for classroom practice. It is not an official WIDA or DRC assessment, it does not produce an official ACCESS for ELLs score or proficiency level, and it is not affiliated with or endorsed by WIDA, the Board of Regents of the University of Wisconsin System, or Data Recognition Corporation. Practice results describe practice only and must not be used alone for reclassification, special education, Section 504 or IEP decisions.",
    local: "Student work stays in this browser unless you export it.",
  },
  es: {
    brand: "Laboratorio de práctica ACCESS",
    brandSub: "de EduWonderLab",
    navLabel: "Secciones de ACCESS",
    crumbLabel: "Ruta de navegación",
    footerNav: "Enlaces de ACCESS",
    skip: "Saltar al contenido",
    disclaimerLead: "Material de práctica independiente.",
    disclaimer:
      "El Laboratorio de práctica ACCESS es de EduWonderLab y sirve para practicar en clase. No es una evaluación oficial de WIDA ni de DRC, no da un puntaje ni un nivel oficial de ACCESS, y no está afiliado a WIDA ni a DRC ni cuenta con su respaldo. Los resultados de práctica describen solo la práctica y no deben usarse por sí solos para decidir reclasificación, educación especial, Sección 504 o IEP.",
    local: "El trabajo de los estudiantes se queda en este navegador a menos que lo exportes.",
  },
};

export const chrome = (lang) => CHROME[lang] || CHROME.en;

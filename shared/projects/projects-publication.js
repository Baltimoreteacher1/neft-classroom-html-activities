/* projects-publication.js — evidence and publishing layer for culminating projects.
 * Additive, local-only, bilingual, and defensive: this layer must never break
 * project navigation, math, save/resume, coaching, or teacher tools.
 */
(function () {
  "use strict";

  var STORE_KEY = "nt-publication:v1:" + location.pathname;
  var records = [];
  var qualityPanel = null;
  var studioStatus = null;
  var state = loadState();
  state.research = state.research || {};
  state.meta = state.meta || {};

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (_error) {
      return {};
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (_error) {
      // Storage is optional; the activity remains fully usable without it.
    }
  }

  function debounce(fn, wait) {
    var timer;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(null, args);
      }, wait);
    };
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bilingual(en, es) {
    return '<span class="pps-en">' + esc(en) + '</span><span class="pps-es">' + esc(es) + "</span>";
  }

  function isSpanish() {
    return (
      document.body.classList.contains("es") ||
      (document.body.id === "body" && document.body.classList.contains("lang-es"))
    );
  }

  function text(en, es) {
    return isSpanish() ? es : en;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function safeUrl(value) {
    try {
      var url = new URL(value, location.href);
      return /^https?:$/.test(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function labelFor(field) {
    if (field.id) {
      var explicit = document.querySelector('label[for="' + CSS.escape(field.id) + '"]');
      if (explicit) return explicit.textContent.trim();
    }
    var wrapped = field.closest("label");
    if (wrapped && field.type === "checkbox") return wrapped.textContent.trim();
    if (wrapped) return wrapped.textContent.replace(field.value || "", "").trim();
    return (
      field.getAttribute("aria-label") ||
      field.placeholder ||
      field.id ||
      text("Response", "Respuesta")
    );
  }

  function researchStatus(record) {
    var parts = [
      (record.finding.value || "").trim().length >= 3,
      record.claim.value.trim().length >= 12,
      record.credibility.value.trim().length >= 12,
      Boolean(record.accessed.value),
      Boolean(record.url),
    ];
    var complete = parts.filter(Boolean).length;
    if (complete === 0) return { level: "empty", en: "Not started", es: "Sin comenzar" };
    if (complete === parts.length)
      return { level: "ready", en: "Publication ready", es: "Lista para publicar" };
    return {
      level: "developing",
      en: complete + " of 5 evidence details complete",
      es: complete + " de 5 detalles completos",
    };
  }

  function updateRecord(record) {
    state.research[record.key] = {
      claim: record.claim.value,
      credibility: record.credibility.value,
      accessed: record.accessed.value,
    };
    saveState();
    var status = researchStatus(record);
    record.ledger.dataset.status = status.level;
    record.status.innerHTML = bilingual(status.en, status.es);
    refreshQuality();
  }

  function mountResearchLedger(block, index) {
    if (block.querySelector(".pps-ledger")) return;
    var finding = block.querySelector("[data-research-find]");
    var link = block.querySelector('a[href^="http://"], a[href^="https://"]');
    if (!finding || !link) return;
    var key = finding.id || "research-" + (index + 1);
    var saved = state.research[key] || {};
    var ledger = document.createElement("details");
    ledger.className = "pps-ledger no-print";
    ledger.innerHTML =
      '<summary><span aria-hidden="true">◆</span> ' +
      bilingual("Research Evidence Ledger", "Registro de evidencia") +
      '<span class="pps-ledger__badge"></span></summary>' +
      '<p class="pps-ledger__intro">' +
      bilingual(
        "Turn a web result into evidence a reader can verify.",
        "Convierte un resultado web en evidencia que un lector pueda verificar.",
      ) +
      "</p>" +
      '<div class="pps-ledger__fields">' +
      "<label>" +
      bilingual(
        "Claim or decision this source supports",
        "Afirmación o decisión que apoya esta fuente",
      ) +
      '<textarea rows="2" data-pps-field="claim"></textarea></label>' +
      "<label>" +
      bilingual(
        "Why this source is useful and trustworthy",
        "Por qué esta fuente es útil y confiable",
      ) +
      '<textarea rows="2" data-pps-field="credibility"></textarea></label>' +
      '<label class="pps-ledger__date">' +
      bilingual("Date accessed", "Fecha de consulta") +
      '<input type="date" data-pps-field="accessed"></label>' +
      "</div>" +
      '<p class="pps-ledger__status" role="status" aria-live="polite"></p>';
    block.appendChild(ledger);

    var record = {
      key: key,
      block: block,
      finding: finding,
      link: link,
      url: safeUrl(link.href),
      sourceLabel: link.textContent.trim() || link.hostname || "Source",
      ledger: ledger,
      claim: ledger.querySelector('[data-pps-field="claim"]'),
      credibility: ledger.querySelector('[data-pps-field="credibility"]'),
      accessed: ledger.querySelector('[data-pps-field="accessed"]'),
      status: ledger.querySelector(".pps-ledger__status"),
    };
    record.claim.value = saved.claim || "";
    record.credibility.value = saved.credibility || "";
    record.accessed.value = saved.accessed || ((finding.value || "").trim() ? today() : "");
    records.push(record);

    var onChange = debounce(function () {
      if (!record.accessed.value && (finding.value || "").trim()) record.accessed.value = today();
      updateRecord(record);
    }, 180);
    [finding, record.claim, record.credibility, record.accessed].forEach(function (field) {
      field.addEventListener("input", onChange);
      field.addEventListener("change", onChange);
    });
    updateRecord(record);
  }

  function usableFields() {
    return Array.prototype.filter.call(
      document.querySelectorAll(
        '.step-panel input[type="text"], .step-panel input[type="number"], .step-panel textarea',
      ),
      function (field) {
        return !field.closest(
          ".pps-ledger, .pps-studio, .pps-dialog, .ntf-reflect, .pub-selfassess, .mw-card, .ntc-panel, #teacher-console",
        );
      },
    );
  }

  function filled(fields, minimum) {
    return fields.filter(function (field) {
      return (field.value || "").trim().length >= minimum;
    });
  }

  function qualitySnapshot() {
    var work = usableFields();
    var substantive = filled(work, 3);
    var reasoningFields = Array.prototype.slice.call(
      document.querySelectorAll(".ntf-reflect textarea"),
    );
    var reasoning = filled(reasoningFields, 12);
    var readyResearch = records.filter(function (record) {
      return researchStatus(record).level === "ready";
    });
    var rubricRows = document.querySelectorAll(".pub-sa-row").length;
    var ratings = document.querySelectorAll('.pub-sa-btn[aria-pressed="true"]').length;
    var checks = Array.prototype.slice.call(
      document.querySelectorAll('.checklist input[type="checkbox"]'),
    );
    var checked = checks.filter(function (box) {
      return box.checked;
    });
    var awardEvidence =
      window.NeftAwardStudio && typeof window.NeftAwardStudio.getEvidence === "function"
        ? window.NeftAwardStudio.getEvidence()
        : null;
    // biome-ignore format: compact policy table keeps this focused browser file under the project line cap.
    return [
      { key: "work", ready: substantive.length >= 3, count: substantive.length, en: "Project work", es: "Trabajo del proyecto", detailEn: substantive.length + " completed responses", detailEs: substantive.length + " respuestas completas", target: work.find(function (field) { return !(field.value || "").trim(); }) },
      { key: "reasoning", ready: reasoning.length >= 1, count: reasoning.length, en: "Reasoning", es: "Razonamiento", detailEn: reasoning.length + " explanation reflections", detailEs: reasoning.length + " reflexiones explicativas", target: reasoningFields.find(function (field) { return (field.value || "").trim().length < 12; }) },
      { key: "research", ready: records.length === 0 || readyResearch.length === records.length, optional: records.length === 0, count: readyResearch.length, en: "Cited research", es: "Investigación citada", detailEn: records.length ? readyResearch.length + " of " + records.length + " sources ready" : "Not used in this project", detailEs: records.length ? readyResearch.length + " de " + records.length + " fuentes listas" : "No se usa en este proyecto", target: records.find(function (record) { return researchStatus(record).level !== "ready"; }) },
      { key: "rubric", ready: rubricRows === 0 || ratings >= rubricRows, optional: rubricRows === 0, count: ratings, en: "Rubric self-check", es: "Autoevaluación", detailEn: rubricRows ? ratings + " of " + rubricRows + " criteria rated" : "Not used in this project", detailEs: rubricRows ? ratings + " de " + rubricRows + " criterios evaluados" : "No se usa en este proyecto", target: document.querySelector(".pub-selfassess") },
      { key: "checklist", ready: checks.length === 0 || checked.length === checks.length, optional: checks.length === 0, count: checked.length, en: "Project checklist", es: "Lista del proyecto", detailEn: checks.length ? checked.length + " of " + checks.length + " items checked" : "Not used in this project", detailEs: checks.length ? checked.length + " de " + checks.length + " elementos marcados" : "No se usa en este proyecto", target: checks.find(function (box) { return !box.checked; }) },
      { key: "modeling", ready: Boolean(awardEvidence && awardEvidence.completion.ready), optional: !awardEvidence, count: awardEvidence ? awardEvidence.completion.completed : 0, en: "Modeling + revision evidence", es: "Evidencia de modelación + revisión", detailEn: awardEvidence ? awardEvidence.completion.completed + " of " + awardEvidence.completion.total + " evidence parts ready" : "Not used in this project", detailEs: awardEvidence ? awardEvidence.completion.completed + " de " + awardEvidence.completion.total + " partes listas" : "No se usa en este proyecto", target: document.querySelector(".cms-studio") },
    ];
  }

  function focusTarget(item) {
    var target = item.target && item.target.block ? item.target.ledger : item.target;
    if (!target) return;
    var panel = target.closest(".step-panel");
    if (panel && typeof window.goStep === "function") {
      var panels = Array.prototype.slice.call(document.querySelectorAll(".step-panel"));
      window.goStep(panels.indexOf(panel) + 1);
    }
    setTimeout(function () {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (target.tagName === "DETAILS") target.open = true;
      var focusable = target.matches("input, textarea, button")
        ? target
        : target.querySelector("input, textarea, button, summary");
      if (focusable) focusable.focus({ preventScroll: true });
    }, 100);
  }

  function refreshQuality() {
    if (!qualityPanel) return;
    var snapshot = qualitySnapshot();
    var required = snapshot.filter(function (item) {
      return !item.optional;
    });
    var ready = required.every(function (item) {
      return item.ready;
    });
    qualityPanel.dataset.ready = ready ? "true" : "false";
    qualityPanel.querySelector(".pps-quality__state").innerHTML = ready
      ? bilingual("Ready for final review", "Lista para la revisión final")
      : bilingual(
          "Keep polishing — your next steps are below",
          "Sigue mejorando — tus próximos pasos están abajo",
        );
    var list = qualityPanel.querySelector(".pps-quality__list");
    list.replaceChildren();
    snapshot.forEach(function (item) {
      var li = document.createElement("li");
      li.className = item.ready ? "is-ready" : "needs-work";
      li.innerHTML =
        '<span aria-hidden="true">' +
        (item.ready ? "✓" : "→") +
        "</span><div><strong>" +
        bilingual(item.en, item.es) +
        "</strong><small>" +
        bilingual(item.detailEn, item.detailEs) +
        "</small></div>";
      if (!item.ready && item.target) {
        var button = document.createElement("button");
        button.type = "button";
        button.innerHTML = bilingual("Take me there", "Llévame allí");
        button.addEventListener("click", function () {
          focusTarget(item);
        });
        li.appendChild(button);
      }
      list.appendChild(li);
    });
  }

  function mountQuality(host) {
    qualityPanel = document.createElement("aside");
    qualityPanel.className = "pps-quality no-print";
    qualityPanel.setAttribute("aria-labelledby", "pps-quality-title");
    qualityPanel.innerHTML =
      '<p class="pps-kicker">' +
      bilingual("Publication quality check", "Control de calidad editorial") +
      '</p><h3 id="pps-quality-title">' +
      bilingual(
        "Is your work ready for an audience?",
        "¿Está tu trabajo listo para una audiencia?",
      ) +
      '</h3><p class="pps-quality__note">' +
      bilingual(
        "This checks for visible evidence and completeness—not whether every answer is correct.",
        "Esto comprueba evidencia visible y que esté completo, no si cada respuesta es correcta.",
      ) +
      '</p><p class="pps-quality__state" role="status" aria-live="polite"></p><ul class="pps-quality__list"></ul>';
    host.appendChild(qualityPanel);
    refreshQuality();
  }

  function collectWork() {
    return usableFields()
      .filter(function (field) {
        return (field.value || "").trim();
      })
      .map(function (field) {
        return { label: labelFor(field), value: field.value.trim() };
      });
  }

  function collectReflections() {
    return Array.prototype.map
      .call(document.querySelectorAll(".ntf-reflect textarea"), function (field, index) {
        return { label: text("Step", "Paso") + " " + (index + 1), value: field.value.trim() };
      })
      .filter(function (item) {
        return item.value;
      });
  }

  function collectChecklist() {
    return Array.prototype.map.call(
      document.querySelectorAll('.checklist input[type="checkbox"]'),
      function (box) {
        return { label: labelFor(box), checked: box.checked };
      },
    );
  }

  function collectRubric() {
    return Array.prototype.map
      .call(document.querySelectorAll(".pub-sa-row"), function (row) {
        var pressed = row.querySelector('.pub-sa-btn[aria-pressed="true"]');
        return {
          criterion: (row.querySelector(".pub-sa-name") || row).textContent.trim(),
          rating: pressed ? pressed.textContent.trim() : "",
        };
      })
      .filter(function (item) {
        return item.rating;
      });
  }

  function packetModel() {
    return {
      schemaVersion: 1,
      path: location.pathname,
      generatedAt: new Date().toISOString(),
      projectTitle:
        String(state.meta.title || "").trim() || document.title.replace(/\s*[—|].*$/, "").trim(),
      byline: String(state.meta.byline || "").trim(),
      summary: String(state.meta.summary || "").trim(),
      quality: qualitySnapshot().map(function (item) {
        return {
          key: item.key,
          ready: item.ready,
          optional: Boolean(item.optional),
          count: item.count,
        };
      }),
      research: records.map(function (record) {
        return {
          source: record.sourceLabel,
          url: record.url,
          finding: record.finding.value.trim(),
          claim: record.claim.value.trim(),
          credibility: record.credibility.value.trim(),
          accessed: record.accessed.value,
        };
      }),
      work: collectWork(),
      reflections: collectReflections(),
      checklist: collectChecklist(),
      selfAssessment: collectRubric(),
    };
  }

  function appendSection(root, title, items, render) {
    if (!items.length) return;
    var section = document.createElement("section");
    var heading = document.createElement("h3");
    heading.textContent = title;
    section.appendChild(heading);
    items.forEach(function (item) {
      render(section, item);
    });
    root.appendChild(section);
  }

  function renderPreview() {
    var model = packetModel();
    var root = document.querySelector(".pps-dialog__document");
    root.replaceChildren();
    var title = document.createElement("h2");
    title.id = "pps-dialog-title";
    title.textContent = model.projectTitle;
    root.appendChild(title);
    if (model.byline) {
      var byline = document.createElement("p");
      byline.className = "pps-document__byline";
      byline.textContent = text("By ", "Por ") + model.byline;
      root.appendChild(byline);
    }
    if (model.summary) {
      var summary = document.createElement("p");
      summary.className = "pps-document__summary";
      summary.textContent = model.summary;
      root.appendChild(summary);
    }
    appendSection(
      root,
      text("Research Evidence", "Evidencia de investigación"),
      model.research,
      function (section, item) {
        var article = document.createElement("article");
        var heading = document.createElement("h4");
        heading.textContent = item.claim || item.source;
        article.appendChild(heading);
        [item.finding, item.credibility].filter(Boolean).forEach(function (value) {
          var p = document.createElement("p");
          p.textContent = value;
          article.appendChild(p);
        });
        var cite = document.createElement("p");
        cite.className = "pps-document__source";
        var link = document.createElement("a");
        link.href = item.url;
        link.textContent = item.source;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        cite.appendChild(link);
        cite.appendChild(
          document.createTextNode(
            item.accessed ? " · " + text("Accessed ", "Consultado ") + item.accessed : "",
          ),
        );
        article.appendChild(cite);
        section.appendChild(article);
      },
    );
    appendSection(
      root,
      text("Project Work", "Trabajo del proyecto"),
      model.work,
      renderLabeledItem,
    );
    appendSection(root, text("Reflection", "Reflexión"), model.reflections, renderLabeledItem);
    appendSection(
      root,
      text("Self-Assessment", "Autoevaluación"),
      model.selfAssessment,
      function (section, item) {
        renderLabeledItem(section, { label: item.criterion, value: item.rating });
      },
    );
    return model;
  }

  function renderLabeledItem(section, item) {
    var article = document.createElement("article");
    var heading = document.createElement("h4");
    heading.textContent = item.label;
    var body = document.createElement("p");
    body.textContent = item.value;
    article.appendChild(heading);
    article.appendChild(body);
    section.appendChild(article);
  }

  function plainText(model) {
    var lines = [model.projectTitle];
    if (model.byline) lines.push(text("By ", "Por ") + model.byline);
    if (model.summary) lines.push("", model.summary);
    function section(title, items, formatter) {
      if (!items.length) return;
      lines.push("", title.toUpperCase());
      items.forEach(function (item) {
        lines.push(formatter(item));
      });
    }
    section(
      text("Research Evidence", "Evidencia de investigación"),
      model.research,
      function (item) {
        return (
          "- " +
          (item.claim || item.source) +
          ": " +
          item.finding +
          "\n  " +
          item.source +
          " — " +
          item.url +
          (item.accessed ? " (" + item.accessed + ")" : "")
        );
      },
    );
    section(text("Project Work", "Trabajo del proyecto"), model.work, function (item) {
      return "- " + item.label + ": " + item.value;
    });
    section(text("Reflection", "Reflexión"), model.reflections, function (item) {
      return "- " + item.label + ": " + item.value;
    });
    section(text("Self-Assessment", "Autoevaluación"), model.selfAssessment, function (item) {
      return "- " + item.criterion + ": " + item.rating;
    });
    return lines.join("\n");
  }

  function announce(en, es, error) {
    if (!studioStatus) return;
    studioStatus.classList.toggle("is-error", Boolean(error));
    studioStatus.innerHTML = bilingual(en, es);
  }

  function download(content, type, filename) {
    try {
      var url = URL.createObjectURL(new Blob([content], { type: type }));
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 500);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function filename(ext) {
    var base =
      (state.meta.title || document.title || "project-publication")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "project-publication";
    return base + "." + ext;
  }

  function copyPacket() {
    var value = plainText(packetModel());
    var promise =
      navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(value)
        : Promise.reject(new Error("clipboard unavailable"));
    promise
      .catch(function () {
        var area = document.createElement("textarea");
        area.value = value;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        var ok = document.execCommand && document.execCommand("copy");
        area.remove();
        if (!ok) throw new Error("copy failed");
      })
      .then(function () {
        announce("Publication copied.", "Publicación copiada.");
      })
      .catch(function () {
        announce(
          "Copy was blocked. Use Download instead.",
          "La copia fue bloqueada. Usa Descargar.",
          true,
        );
      });
  }

  function printableHtml(model) {
    var body = document.querySelector(".pps-dialog__document").innerHTML;
    return (
      "<!doctype html><html lang='" +
      (isSpanish() ? "es" : "en") +
      "'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>" +
      esc(model.projectTitle) +
      "</title><style>body{font:16px/1.55 Georgia,serif;color:#18252d;max-width:760px;margin:40px auto;padding:0 24px}h2{font:800 34px/1.1 system-ui;color:#123b52;border-bottom:4px solid #c69214;padding-bottom:14px}h3{font:750 22px system-ui;margin-top:32px;border-bottom:1px solid #9baab3;padding-bottom:6px}h4{font:700 16px system-ui;margin-bottom:4px}article{break-inside:avoid;margin:18px 0}a{color:#075e74;overflow-wrap:anywhere}.pps-document__byline{font-style:italic}.pps-document__summary{font-size:18px}.pps-document__source{font-size:13px;color:#465a66}@media print{body{margin:0;max-width:none}}</style></head><body>" +
      body +
      "</body></html>"
    );
  }

  function printPacket() {
    var model = renderPreview();
    var html = printableHtml(model);
    var popup = window.open("", "_blank", "noopener,noreferrer");
    if (popup) {
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      popup.print();
      announce("Print view opened.", "Vista de impresión abierta.");
    } else if (download(html, "text/html;charset=utf-8", filename("html"))) {
      announce(
        "Popup blocked; a printable file was downloaded.",
        "Ventana bloqueada; se descargó un archivo imprimible.",
      );
    } else announce("Print view could not open.", "No se pudo abrir la vista de impresión.", true);
  }

  function bindMeta(studio) {
    ["title", "byline", "summary"].forEach(function (key) {
      var field = studio.querySelector('[data-pps-meta="' + key + '"]');
      field.value = state.meta[key] || "";
      field.addEventListener(
        "input",
        debounce(function () {
          state.meta[key] = field.value;
          saveState();
        }, 180),
      );
    });
  }

  function mountDialog() {
    var dialog = document.createElement("dialog");
    dialog.className = "pps-dialog";
    dialog.setAttribute("aria-labelledby", "pps-dialog-title");
    dialog.innerHTML =
      '<form method="dialog" class="pps-dialog__shell"><button class="pps-dialog__close" aria-label="Close publication preview">×</button><div class="pps-dialog__document"></div><div class="pps-dialog__actions no-print"><button type="button" data-pps-action="print">' +
      bilingual("Print publication", "Imprimir publicación") +
      '</button><button type="submit">' +
      bilingual("Keep editing", "Seguir editando") +
      "</button></div></form>";
    document.body.appendChild(dialog);
    dialog.querySelector('[data-pps-action="print"]').addEventListener("click", printPacket);
    return dialog;
  }

  function mountStudio(host) {
    var dialog = mountDialog();
    var studio = document.createElement("section");
    studio.className = "pps-studio no-print";
    studio.setAttribute("aria-labelledby", "pps-studio-title");
    studio.innerHTML =
      '<p class="pps-kicker">' +
      bilingual("Publication Studio", "Estudio de publicación") +
      '</p><h3 id="pps-studio-title">' +
      bilingual(
        "Turn your project into a professional publication",
        "Convierte tu proyecto en una publicación profesional",
      ) +
      "</h3><p>" +
      bilingual(
        "Add optional publication details, then preview or export a reader-ready packet.",
        "Agrega detalles opcionales y luego revisa o exporta un documento listo para lectores.",
      ) +
      '</p><div class="pps-studio__fields"><label>' +
      bilingual("Publication title (optional)", "Título de la publicación (opcional)") +
      '<input type="text" data-pps-meta="title"></label><label>' +
      bilingual(
        "Byline (optional, stored only on this device)",
        "Autoría (opcional, guardada solo en este dispositivo)",
      ) +
      '<input type="text" data-pps-meta="byline"></label><label class="pps-studio__summary">' +
      bilingual("Executive summary (optional)", "Resumen ejecutivo (opcional)") +
      '<textarea rows="3" data-pps-meta="summary"></textarea></label></div><div class="pps-studio__actions"><button type="button" data-pps-action="preview">' +
      bilingual("Preview publication", "Vista previa") +
      '</button><button type="button" data-pps-action="copy">' +
      bilingual("Copy report", "Copiar informe") +
      '</button><button type="button" data-pps-action="text">' +
      bilingual("Download .txt", "Descargar .txt") +
      '</button><button type="button" data-pps-action="json">' +
      bilingual("Backup .json", "Copia .json") +
      '</button></div><p class="pps-studio__status" role="status" aria-live="polite"></p>';
    host.appendChild(studio);
    studioStatus = studio.querySelector(".pps-studio__status");
    bindMeta(studio);
    studio.querySelector('[data-pps-action="preview"]').addEventListener("click", function () {
      renderPreview();
      refreshQuality();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "open");
    });
    studio.querySelector('[data-pps-action="copy"]').addEventListener("click", copyPacket);
    studio.querySelector('[data-pps-action="text"]').addEventListener("click", function () {
      var ok = download(plainText(packetModel()), "text/plain;charset=utf-8", filename("txt"));
      announce(
        ok ? "Text publication downloaded." : "Download failed.",
        ok ? "Publicación de texto descargada." : "La descarga falló.",
        !ok,
      );
    });
    studio.querySelector('[data-pps-action="json"]').addEventListener("click", function () {
      var ok = download(
        JSON.stringify(packetModel(), null, 2),
        "application/json;charset=utf-8",
        filename("json"),
      );
      announce(
        ok ? "Backup downloaded." : "Backup failed.",
        ok ? "Copia descargada." : "La copia falló.",
        !ok,
      );
    });
  }

  function init() {
    if (!document.body || document.body.dataset.publicationInit === "1") return;
    document.body.dataset.publicationInit = "1";
    Array.prototype.forEach.call(document.querySelectorAll(".step-research"), mountResearchLedger);
    var panels = document.querySelectorAll(".step-panel");
    var host = panels[panels.length - 1];
    if (host) {
      mountQuality(host);
      mountStudio(host);
    }
    document.addEventListener("input", debounce(refreshQuality, 100));
    document.addEventListener("change", debounce(refreshQuality, 100));
    document.addEventListener("click", function (event) {
      if (event.target.closest(".pub-sa-btn, .level-btn, .lang-btn"))
        setTimeout(refreshQuality, 30);
    });
    window.ProjectPublication = {
      packet: packetModel,
      quality: qualitySnapshot,
      refresh: refreshQuality,
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

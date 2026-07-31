/*!
 * voice-native-lesson.js — Neft Lesson Platform · Voice-Native Bilingual Assistant.
 *
 * Talk to the lesson, it talks back — bilingual (EN/ES), using the lesson's own
 * vocabulary bank so language is consistent with the printed page.
 */
(function (global) {
  "use strict";

  if (global.NTVoiceLesson && global.NTVoiceLesson.__booted) return;

  var currentLang = "en"; // 'en' | 'es'
  var isListening = false;
  var recognition = null;
  var widgetEl = null;
  var micBtn = null;
  var statusEl = null;
  var vocabBank = [];
  var booted = false;

  function safe(fn) {
    try {
      return fn();
    } catch (_e) {
      return null;
    }
  }

  function init() {
    if (booted) return;
    booted = true;

    loadLessonVocab();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupVoiceWidget);
    } else {
      setupVoiceWidget();
    }
  }

  function loadLessonVocab() {
    // Collect lesson vocabulary from page/schema
    var terms = document.querySelectorAll(".vocab-term, [data-vocab], .glossary-item");
    terms.forEach(function (t) {
      var text = t.textContent.trim();
      if (text && vocabBank.indexOf(text) === -1) {
        vocabBank.push(text);
      }
    });

    if (!vocabBank.length) {
      vocabBank = ["ratio", "rate", "unit rate", "proportion", "fraction", "percent", "equation"];
    }
  }

  function setupVoiceWidget() {
    if (widgetEl) return;

    widgetEl = document.createElement("div");
    widgetEl.className = "voice-lesson-widget";
    widgetEl.setAttribute("aria-label", "Voice-native lesson assistant");

    micBtn = document.createElement("button");
    micBtn.className = "voice-lesson-mic-btn";
    micBtn.type = "button";
    micBtn.setAttribute("aria-label", "Toggle voice listening");
    micBtn.innerHTML = '<span aria-hidden="true">🎙️</span>';
    micBtn.addEventListener("click", toggleListening);

    var langToggle = document.createElement("button");
    langToggle.className = "voice-lesson-lang-toggle";
    langToggle.type = "button";
    langToggle.textContent = currentLang.toUpperCase();
    langToggle.addEventListener("click", function () {
      currentLang = currentLang === "en" ? "es" : "en";
      langToggle.textContent = currentLang.toUpperCase();
      speak(
        currentLang === "es"
          ? "Asistente en español activado."
          : "English voice assistant enabled."
      );
    });

    statusEl = document.createElement("div");
    statusEl.className = "voice-lesson-status";
    statusEl.textContent = "Voice Assistant";

    widgetEl.appendChild(micBtn);
    widgetEl.appendChild(langToggle);
    widgetEl.appendChild(statusEl);

    document.body.appendChild(widgetEl);

    // Initialize Web Speech Recognition if available
    var SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = function () {
        isListening = true;
        micBtn.classList.add("is-listening");
        statusEl.textContent = currentLang === "es" ? "Escuchando..." : "Listening...";
      };

      recognition.onresult = function (event) {
        var transcript = event.results[0][0].transcript;
        statusEl.textContent = transcript;
        processVoiceInput(transcript);
      };

      recognition.onerror = function () {
        stopListening();
        statusEl.textContent = "Voice ready";
      };

      recognition.onend = function () {
        stopListening();
      };
    }
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function startListening() {
    if (!recognition) {
      // Fallback prompt if SpeechRecognition is not supported natively in environment
      var promptText =
        currentLang === "es"
          ? "Escribe lo que quieres decir a la lección:"
          : "Type what you'd like to ask the lesson:";
      var text = prompt(promptText);
      if (text) {
        statusEl.textContent = text;
        processVoiceInput(text);
      }
      return;
    }

    recognition.lang = currentLang === "es" ? "es-ES" : "en-US";
    try {
      recognition.start();
    } catch (_e) {
      /* recognition already running */
    }
  }

  function stopListening() {
    isListening = false;
    if (micBtn) micBtn.classList.remove("is-listening");
    if (statusEl && statusEl.textContent.includes("Listening")) {
      statusEl.textContent = "Voice Assistant";
    }
    if (recognition) {
      try {
        recognition.stop();
      } catch (_e) {}
    }
  }

  function processVoiceInput(text) {
    var lower = text.toLowerCase();
    var matchedTerm = null;

    vocabBank.forEach(function (term) {
      if (lower.includes(term.toLowerCase())) {
        matchedTerm = term;
      }
    });

    var responseText = "";
    if (matchedTerm) {
      responseText =
        currentLang === "es"
          ? "Excelente uso del término '" + matchedTerm + "'. ¿Cómo se relaciona con tu cálculo?"
          : "Great use of the vocabulary term '" + matchedTerm + "'. How does it apply to this step?";
    } else {
      responseText =
        currentLang === "es"
          ? "Te escucho. Revisa el banco de vocabulario impreso en la página."
          : "I hear you. Check your lesson's vocabulary bank on the page to build your answer.";
    }

    speak(responseText);

    if (global.NTtelemetry && typeof global.NTtelemetry.track === "function") {
      safe(function () {
        global.NTtelemetry.track("voice_input_processed", {
          transcript: text,
          matchedTerm: matchedTerm,
          lang: currentLang,
        });
      });
    }
  }

  function speak(text) {
    if (!global.speechSynthesis) return;
    safe(function () {
      global.speechSynthesis.cancel();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLang === "es" ? "es-ES" : "en-US";
      global.speechSynthesis.speak(utterance);
    });
  }

  global.NTVoiceLesson = {
    __booted: true,
    init: init,
    speak: speak,
    setLang: function (lang) {
      currentLang = lang === "es" ? "es" : "en";
    },
  };

  init();
})(typeof window !== "undefined" ? window : this);

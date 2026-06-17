(function () {
  // Global Subject State
  var subject = document.body.dataset.subject || "hub";
  var storageKey = "ewl-aviad-" + subject + "-v2";
  
  var state = {
    done: {},
    notes: {},
    interactive: {} // Stores responses for matching/sorting/solving
  };

  try {
    var stored = localStorage.getItem(storageKey);
    if (stored) {
      state = JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load local state:", error);
  }

  // Web Audio Chime Synthesizer
  var audioCtx = null;
  function playRewardSound(isFail) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      var now = audioCtx.currentTime;
      if (isFail) {
        // Play a quick "not quite" buzz
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else {
        // Play a beautiful ascending chime
        var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach(function (freq, i) {
          var osc = audioCtx.createOscillator();
          var gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.08, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.35);
        });
      }
    } catch (err) {
      console.warn("Web Audio failed to initialize or play sound:", err);
    }
  }

  // Update Page Progress
  function updateProgress() {
    var cards = Array.from(document.querySelectorAll(".activity"));
    if (!cards.length) return;
    
    var doneCount = 0;
    cards.forEach(function (card) {
      var id = card.dataset.id;
      var area = card.querySelector("textarea");
      var isCompleted = Boolean(state.done[id]);
      
      card.classList.toggle("done", isCompleted);
      
      // Load saved notes if textarea is empty or reset
      if (area && !area.value && state.notes[id]) {
        area.value = state.notes[id];
      }
      
      if (isCompleted) {
        doneCount += 1;
      }
    });

    var pct = Math.round((doneCount / cards.length) * 100);
    
    var xpEl = document.getElementById("xp");
    var doneEl = document.getElementById("done");
    
    if (xpEl) xpEl.textContent = (doneCount * 50) + " XP";
    if (doneEl) doneEl.textContent = pct + "%";
    
    // Save state back to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {}

    // Save subject progress to global registry for main hub
    try {
      var hubRegistry = JSON.parse(localStorage.getItem("ewl-aviad-registry-v2")) || {};
      hubRegistry[subject] = {
        doneCount: doneCount,
        totalCount: cards.length,
        pct: pct
      };
      localStorage.setItem("ewl-aviad-registry-v2", JSON.stringify(hubRegistry));
    } catch (e) {}
  }

  // Drag and Drop Engine
  function initDragAndDrop() {
    var draggedItem = null;

    document.addEventListener("dragstart", function (e) {
      if (e.target.matches(".drag-item")) {
        draggedItem = e.target;
        e.target.classList.add("dragging");
        e.dataTransfer.setData("text/plain", e.target.dataset.val || e.target.textContent);
      }
    });

    document.addEventListener("dragend", function (e) {
      if (e.target.matches(".drag-item")) {
        e.target.classList.remove("dragging");
      }
    });

    document.addEventListener("dragover", function (e) {
      var container = e.target.closest(".drop-container");
      if (container) {
        e.preventDefault();
        container.classList.add("dragover");
      }
    });

    document.addEventListener("dragleave", function (e) {
      var container = e.target.closest(".drop-container");
      if (container && !container.contains(e.relatedTarget)) {
        container.classList.remove("dragover");
      }
    });

    document.addEventListener("drop", function (e) {
      var container = e.target.closest(".drop-container");
      if (container) {
        e.preventDefault();
        container.classList.remove("dragover");
        if (draggedItem) {
          // If container has single-item limit, return previous item to drawer
          var maxItems = parseInt(container.dataset.max, 10) || Infinity;
          var currentItems = container.querySelectorAll(".drag-item");
          
          if (currentItems.length >= maxItems) {
            // Find parent drawer to send back
            var drawerId = currentItems[0].dataset.drawer;
            var drawer = document.getElementById(drawerId);
            if (drawer) {
              drawer.appendChild(currentItems[0]);
            } else {
              currentItems[0].remove();
            }
          }
          
          container.appendChild(draggedItem);
          
          // Trigger validation check on parent activity
          var activity = container.closest(".activity");
          if (activity && typeof window.validateActivityState === "function") {
            window.validateActivityState(activity);
          }
        }
      }
    });
  }

  // Click Event Listeners
  document.addEventListener("click", function (event) {
    var target = event.target;

    // 1. Tab Filter clicks
    if (target.matches("[data-filter]")) {
      document.querySelectorAll("[data-filter]").forEach(function (button) {
        button.setAttribute("aria-selected", String(button === target));
      });
      document.querySelectorAll(".activity").forEach(function (card) {
        card.style.display = (target.dataset.filter === "all" || card.dataset.type === target.dataset.filter) ? "flex" : "none";
      });
    }

    // 2. Save Workspace clicks
    if (target.matches("[data-save]")) {
      var saveCard = target.closest(".activity");
      var id = saveCard.dataset.id;
      var area = saveCard.querySelector("textarea");
      if (area) {
        state.notes[id] = area.value;
      }
      
      // Save current answers state if any page custom logic exists
      if (typeof window.getInteractiveState === "function") {
        state.interactive[id] = window.getInteractiveState(saveCard);
      }
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {}

      target.textContent = "Saved";
      target.style.background = "#059669";
      target.style.color = "#ffffff";
      setTimeout(function () {
        target.textContent = "Save workspace";
        target.style.background = "";
        target.style.color = "";
      }, 1000);
    }

    // 3. Complete clicks
    if (target.matches("[data-complete]")) {
      var card = target.closest(".activity");
      var id = card.dataset.id;
      var area = card.querySelector("textarea");
      
      // Validate if we need interactive completion first
      if (typeof window.checkInteractiveComplete === "function") {
        var validation = window.checkInteractiveComplete(card);
        if (!validation.success) {
          playRewardSound(true);
          alert(validation.message || "Complete the interactive elements first!");
          return;
        }
      } else {
        // Default text evidence validation
        var textVal = area ? area.value.trim() : "";
        if (!state.done[id] && textVal.length < 20) {
          playRewardSound(true);
          if (area) {
            area.placeholder = "Please enter real evidence here first (at least 20 letters) so your parent or teacher can see your work!";
            area.focus();
          }
          return;
        }
      }

      // Toggle Done state
      state.done[id] = !state.done[id];
      if (area) {
        state.notes[id] = area.value;
      }
      
      if (state.done[id]) {
        playRewardSound(false);
      }
      
      updateProgress();
      
      // Refresh UI representation
      target.textContent = state.done[id] ? "Mark Incomplete" : "Complete with evidence";
      target.classList.toggle("secondary", state.done[id]);
    }
  });

  // Expose API
  window.EWL = {
    state: state,
    save: function() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {}
    },
    updateProgress: updateProgress,
    playAudio: playRewardSound
  };

  // Initialize
  updateProgress();
  initDragAndDrop();
  
  // Update button labels initially based on saved status
  setTimeout(function() {
    document.querySelectorAll(".activity").forEach(function(card) {
      var id = card.dataset.id;
      var completeBtn = card.querySelector("[data-complete]");
      if (completeBtn && state.done[id]) {
        completeBtn.textContent = "Mark Incomplete";
        completeBtn.classList.add("secondary");
      }
      
      // Restore interactive data if page-specific restore function exists
      if (state.interactive[id] && typeof window.restoreInteractiveState === "function") {
        window.restoreInteractiveState(card, state.interactive[id]);
      }
    });
  }, 100);
})();

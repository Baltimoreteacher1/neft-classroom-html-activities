/* Neft Teacher — Homework Visual Math Models Library.
 * Provides interactive visual models (fraction bars, decimal number lines,
 * area decomposition grids, coordinate planes) for lesson homework pages.
 */
(function() {
  "use strict";
  window.NeftHomeworkModels = window.NeftHomeworkModels || {
    renderFractionBar: function(container, parts, shaded) {
      if (!container) return;
      var html = '<div class="hw-frac-bar" style="display:flex; border:1px solid #1e293b; border-radius:6px; overflow:hidden; height:32px;">';
      for (var i = 0; i < parts; i++) {
        var bg = i < shaded ? '#38bdf8' : '#f1f5f9';
        html += '<div style="flex:1; background:' + bg + '; border-right:1px solid #cbd5e1;"></div>';
      }
      html += '</div>';
      container.innerHTML = html;
    }
  };
})();

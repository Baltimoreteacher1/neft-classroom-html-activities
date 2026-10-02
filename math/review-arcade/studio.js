(() => {
  'use strict';
  if (!window.GameStudio || !window.ReviewStudio) return;
  window.GameStudio.register({title:'Review Arcade',instructions:['Choose a skill or the mixed Boss Battle. Practice mode lets you finish every question; choose Challenge mode for three lives.', 'Tap an answer or press 1–4. Read each explanation, then choose Next.', 'Adventures save after every answer on this browser. Resume from the home screen.', 'Results include every explanation and a focused replay of questions to revisit.'],pause:()=>window.ReviewStudio.pause(),resume:()=>window.ReviewStudio.resume()});
})();

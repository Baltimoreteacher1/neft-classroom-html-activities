/** A local, untimed raid campaign. Class health still uses the existing API. */
export function mountRaidCampaign({ host, week, attacks, language, focus }) {
  const key = `ewl.raid-campaign.v1.${week}`;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch {}
  const state = {
    charges: attacks.map((a, i) => Math.max(0, Math.min(3, Math.floor(Number(saved.charges?.[i]) || 0)))),
    wards: attacks.map((a, i) => saved.wards?.[i] === true),
    active: Math.max(0, Math.min(attacks.length - 1, Math.floor(Number(saved.active) || 0))),
  };
  const panel = document.createElement('section'); panel.className = 'raid-campaign';
  host.append(panel);
  const store = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} };
  const copy = (en, spanish) => language() === 'es' ? spanish : en;
  const names = () => language() === 'es' ? ['Puerta del bosque', 'Puente de piedra', 'Faro del cielo'] : ['Forest gate', 'Stone bridge', 'Sky beacon'];
  function render(message = '') {
    const restored = state.wards.filter(Boolean).length;
    panel.replaceChildren();
    const title = document.createElement('h2'); title.textContent = copy('Citadel of the three wards', 'Ciudadela de los tres sellos');
    const description = document.createElement('p');
    description.textContent = copy('Choose a ward to defend. Solve three challenges from its attack, then spend those three charges to restore it. The whole class still shares every hit.', 'Elige un sello. Resuelve tres desafíos de su ataque y usa las tres cargas para restaurarlo. La clase sigue compartiendo cada acierto.');
    const art = document.createElement('div'); art.className = 'raid-campaign-art';
    const towers = state.wards.map((lit, i) => `<g transform="translate(${80+i*145} ${i===1?82:116})"><path d="M-32 105V0h13v-15h13V0h13v-15h13V0h13v105Z" fill="${lit?'#699585':'#405168'}" stroke="#a9bac9" stroke-width="2"/><path d="M-7 75V45a8 8 0 0 1 16 0v30" fill="${lit?'#ffe7a1':'#152435'}"/><circle cy="-32" r="${lit?15:9}" fill="${lit?'#f4d67f':'#6c7e93'}"/>${state.active===i?'<path d="m-10 120 10-12 10 12" fill="none" stroke="#b6eeed" stroke-width="4"/>':''}</g>`).join('');
    art.innerHTML=`<svg viewBox="0 0 450 255" role="img" aria-label="${restored} / ${attacks.length} ${copy('wards restored','sellos restaurados')}"><rect width="450" height="255" fill="#132539"/><circle cx="350" cy="45" r="28" fill="#bac9bc"/><path d="M0 205 60 85l90 120L265 45l135 165 50-45v90H0" fill="#273c50"/><path d="M0 226q100-35 210 0t240 0v29H0" fill="#36595c"/>${towers}</svg>`;
    const actions=document.createElement('div');actions.className='raid-ward-actions';
    attacks.forEach((attack,i)=>{
      const row=document.createElement('div');row.className='raid-ward';
      const button=document.createElement('button');button.type='button';button.dataset.ward=String(i);
      button.setAttribute('aria-pressed',String(state.active===i));
      button.textContent=`${names()[i]} · ${state.wards[i]?copy('restored','restaurado'):`${state.charges[i]}/3`}`;
      button.onclick=()=>{state.active=i;store();focus(attack.tag);render(copy('Target selected. Your next question practices this ward’s attack.', 'Objetivo elegido. La próxima pregunta practica el ataque de este sello.'));panel.querySelector(`[data-ward="${i}"]`)?.focus({preventScroll:true});};
      const label=document.createElement('small');label.textContent=attack.name[language()] || attack.name.en;
      const repair=document.createElement('button');repair.type='button';repair.className='raid-restore';repair.dataset.restore=String(i);
      repair.textContent=copy('Restore · 3 charges','Restaurar · 3 cargas');repair.disabled=state.charges[i]<3||state.wards[i];
      repair.onclick=()=>{if(state.charges[i]<3||state.wards[i])return;state.charges[i]-=3;state.wards[i]=true;store();render(copy(`${names()[i]} restored. Its light is protecting the citadel.`,`${names()[i]} restaurado. Su luz protege la ciudadela.`));panel.querySelector(`[data-ward="${i}"]`)?.focus({preventScroll:true});};
      row.append(button,label,repair);actions.append(row);
    });
    const status=document.createElement('p');status.className='raid-campaign-status';status.setAttribute('role','status');status.textContent=message || (restored===attacks.length?copy('The citadel is restored! Your crew earned the Warden of Light badge. Keep helping the class defeat the boss.', '¡Ciudadela restaurada! Tu equipo ganó la insignia Guardián de la Luz. Sigue ayudando a la clase a vencer al jefe.'):copy(`${restored}/${attacks.length} wards restored. Expedition progress saves on this device.`,`${restored}/${attacks.length} sellos restaurados. El progreso se guarda en este dispositivo.`));
    panel.append(title,description,art,actions,status);
  }
  render();
  return { refresh: render, solved(tag) {
    const i=attacks.findIndex(a=>a.tag===tag);
    if(i<0||state.wards[i]||state.charges[i]>=3)return;
    state.charges[i]++;store();render(copy(`Charge recovered for ${names()[i]}. ${state.charges[i]}/3 ready.`, `Carga recuperada para ${names()[i]}. ${state.charges[i]}/3 listas.`));
  }};
}

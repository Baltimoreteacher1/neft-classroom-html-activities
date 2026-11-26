/* Unit Rate Market Mission · Deal Lab entry. Mounts the three stations into #dealLab and keeps
 * their state inside the page's own save (localStorage "unitRateMarketMissionV1", field `lab`),
 * so Save/Resume and "Reset Activity" cover the lab exactly as they cover every other tab. */
import { mountCreate, mountShopper } from "./deal-lab-cases.mjs";
import { mountWhatIf } from "./deal-lab-whatif.mjs";

const STATIONS = [
  { id: "whatif", label: "1. What-If Lab", mount: mountWhatIf },
  { id: "shopper", label: "2. Almost-Right Shopper", mount: mountShopper },
  { id: "create", label: "3. Create a Deal", mount: mountCreate },
];

function ctx() {
  const host = window.URM;
  return {
    lab() {
      const s = host.state;
      if (!s.lab || typeof s.lab !== "object") s.lab = { station: "whatif" };
      return s.lab;
    },
    save: () => host.save(),
    battles: () => host.battles(),
  };
}

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function summary(lab) {
  const w = lab.whatif || {};
  const sh = lab.shopper || {};
  const cr = lab.create || {};
  return [
    ["What-If Lab", `${count(w.explained || 0, "change", "changes")} explained${w.flips ? " · switched the best buy" : ""}`, (w.explained || 0) >= 3 && w.flips > 0],
    ["Almost-Right Shopper", `${count(sh.cases || 0, "case", "cases")} closed (${sh.independent || 0} solved on your own first try)`, (sh.cases || 0) >= 2],
    ["Create a Deal", `${count(cr.built || 0, "deal", "deals")} built`, (cr.built || 0) >= 3],
  ];
}

function renderResults(lab) {
  const host = document.getElementById("labResults");
  if (!host) return;
  host.innerHTML = `<h5>Deal Lab</h5><ul>${summary(lab)
    .map(([name, text, met]) => `<li><strong>${name}:</strong> ${text}${met ? " ✓" : ""}</li>`)
    .join("")}</ul>`;
}

export function render() {
  const root = document.getElementById("dealLab");
  if (!root || !window.URM) return;
  const c = ctx();
  const lab = c.lab();
  const active = STATIONS.find((s) => s.id === lab.station) || STATIONS[0];
  root.innerHTML = `<div class="dl-nav" role="group" aria-label="Deal Lab stations">${STATIONS.map(
    (s) => `<button type="button" class="dl-nav-btn" data-station="${s.id}" aria-pressed="${s.id === active.id}">${s.label}</button>`,
  ).join("")}</div><p class="dl-progress small"></p><div class="dl-station"></div>`;
  const progress = () => {
    root.querySelector(".dl-progress").textContent = summary(c.lab())
      .map(([n, t]) => `${n}: ${t}`)
      .join(" · ");
    renderResults(c.lab());
  };
  const wrapped = { ...c, save: () => (c.save(), progress()) };
  root.querySelectorAll(".dl-nav-btn").forEach((b) =>
    b.addEventListener("click", () => {
      c.lab().station = b.dataset.station;
      c.save();
      render();
      root.querySelector(`.dl-nav-btn[data-station="${b.dataset.station}"]`)?.focus();
    }),
  );
  active.mount(root.querySelector(".dl-station"), wrapped);
  progress();
}

window.DealLab = { render };
render();

// Style guide demos: swatch colors, a toast and a progress bar.
import { $, $$, toast } from "./lib.js";

for (const s of $$("[data-swatch]")) s.style.background = s.dataset.swatch;
$("[data-demo-toast]")?.addEventListener("click", () => toast("Saved on this device."));
const bar = $("[data-progress-demo]");
if (bar) bar.style.width = "50%";

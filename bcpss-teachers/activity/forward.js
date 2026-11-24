// The legacy single-activity viewer was replaced by the Language Studio player.
// Old links (/bcpss-teachers/activity/?unit=…&activity=…&wida=…) keep working: forward them.
const params = new URLSearchParams(window.location.search);
const target = new URL("/bcpss-teachers/language-studio/", window.location.origin);
const unit = (params.get("unit") || "").trim();
if (unit) target.searchParams.set("unit", unit);
const wida = (params.get("wida") || "").trim();
if (["1_2", "3_4", "5_6"].includes(wida)) target.searchParams.set("level", `l${wida}`);
const activity = (params.get("activity") || "").match(/-s?(\d{1,2})$/);
if (unit && activity) target.searchParams.set("a", String(Number(activity[1])));
const link = document.getElementById("go");
if (link) link.href = target.href;
window.location.replace(target.href);

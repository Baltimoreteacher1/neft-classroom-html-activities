// Entry for session.html: ?grade=&profile=&lang=&minutes=&skill=<game>:<skill>&new=1
// @fm2 FM-003 FM-004 FM-005 FM-030
import { getLang, setLang } from "../lang.js";
import { runGuided } from "./guided-ui.js";

const params = new URLSearchParams(location.search);
const asked = params.get("lang");
if (asked === "en" || asked === "es") setLang(asked, { persist: false });
runGuided({ stage: document.querySelector("#gs-step"), params, lang: getLang() }).catch((error) => {
  console.error(error);
  document.querySelector("#gs-step").innerHTML =
    '<section class="fm-card" role="alert" data-testid="session-error"><h1>Something went wrong · Algo salió mal</h1><p>Reload, or go back to family math. · Recarguen o vuelvan a matemáticas en familia.</p><a class="fm-btn fm-btn--primary" href="./">Family math · Matemáticas en familia</a></section>';
});

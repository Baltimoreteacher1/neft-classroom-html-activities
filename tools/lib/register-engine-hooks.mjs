// register-engine-hooks.mjs — side-effect import that installs engine-hooks.mjs
// for every DYNAMIC import that follows. See engine-hooks.mjs for what and why.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(new URL("./engine-hooks.mjs", import.meta.url), pathToFileURL("./"));

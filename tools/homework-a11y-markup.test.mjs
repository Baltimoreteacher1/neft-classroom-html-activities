// The accessibility markup pass and the delegated-action helper: pure functions, no browser.
import assert from "node:assert/strict";
import test from "node:test";
import {
  a11yMarkup,
  hideDecorativeEmoji,
  splitBilingualAttributes,
} from "../scripts/lib/homework-a11y.mjs";
import { act, actOn, EL, EV } from "../scripts/lib/homework-actions.mjs";

test("act() writes data attributes, never code", () => {
  assert.equal(act("toggleScratchpad"), 'data-act="toggleScratchpad"');
  assert.equal(
    act("switchHomeworkTab", "check"),
    `data-act="switchHomeworkTab" data-args='["check"]'`,
  );
  assert.equal(act("checkProblem", 3), `data-act="checkProblem" data-args='[3]'`);
  assert.equal(
    actOn("drop", "handleDrop", [EV, 4, "the-part"]),
    `data-act-drop="handleDrop" data-args-drop='["$ev",4,"the-part"]'`,
  );
  assert.equal(
    actOn("click", "startHomework", [], { prevent: true }),
    'data-act="startHomework" data-prevent',
  );
  assert.equal(
    actOn("click", "markVocabCardKnown", [2, true], { stop: true }),
    `data-act="markVocabCardKnown" data-args='[2,true]' data-stop`,
  );
  assert.match(act("selectFeeling", EL, "smooth"), /\["\$el","smooth"\]/);
});

test("act() escapes values and writes a literal leading dollar as $$", () => {
  assert.match(act("speak", `it's "5" & <b>`), /&#39;|\\"/);
  assert.doesNotMatch(act("speak", "a'b"), /'b/);
  assert.match(act("speak", "$5.00"), /"\$\$5\.00"/);
});

test("act() refuses a bad event or action name", () => {
  assert.throws(() => actOn("hover", "x"), /unsupported event/);
  assert.throws(() => act("alert(1)"), /bad action name/);
});

test("decorative emoji in headings and control labels is hidden from the accessibility tree", () => {
  const out = hideDecorativeEmoji(
    '<h2 class="t">🎯 Goal</h2><button type="button">🔊 <span class="lang-en">Listen</span></button>',
  );
  assert.match(out, /<h2 class="t"><span aria-hidden="true">🎯<\/span> Goal<\/h2>/);
  assert.match(out, /<span aria-hidden="true">🔊<\/span> <span class="lang-en">Listen<\/span>/);
});

test("a control that is only an emoji, and script text, are left alone", () => {
  const html = '<button aria-label="Sound">🔊</button><script>var s="<h2>🎯 x</h2>"</script>';
  assert.equal(hideDecorativeEmoji(html), html);
});

test('"English / Español" in one attribute becomes one language plus a pair for the switcher', () => {
  const out = splitBilingualAttributes(
    '<button aria-label="Close / Cerrar" title="Listen / Escuchar">x</button>',
  );
  assert.match(out, /aria-label="Close" data-aria-en="Close" data-aria-es="Cerrar"/);
  assert.match(out, /title="Listen" data-title-en="Listen" data-title-es="Escuchar"/);
});

test("slash labels that are not bilingual pairs are untouched; identical halves collapse", () => {
  const same = '<p aria-label="Part / Whole">x</p>';
  assert.equal(splitBilingualAttributes(same), same);
  assert.equal(
    splitBilingualAttributes('<p aria-label="the price / the price">x</p>'),
    '<p aria-label="the price">x</p>',
  );
});

test("a11yMarkup does not touch script or style bodies", () => {
  const html =
    '<style>.a::after{content:"🎯 x / Cerrar"}</style><script>el.title="Close / Cerrar"</script>';
  assert.equal(a11yMarkup(html), html);
});

// What a student SAYS must land in the answer box as what they would have
// TYPED: number words become digits, nothing is ever calculated.
import assert from "node:assert/strict";
import test from "node:test";
import { spokenToNumberAnswer, spokenToText } from "./ls-spoken-number.js";

const EN = [
  ["twelve", "12"],
  ["twelve point five", "12.5"],
  ["zero point zero five", "0.05"],
  ["negative seven", "-7"],
  ["minus 3", "-3"],
  ["forty percent", "40%"],
  ["40 percent", "40%"],
  ["three fourths", "3/4"],
  ["one half", "1/2"],
  ["a half", "1/2"],
  ["two thirds", "2/3"],
  ["seven over twelve", "7/12"],
  ["three and one half", "3 1/2"],
  ["one hundred and five", "105"],
  ["two thousand three hundred forty five", "2345"],
  ["twenty one", "21"],
  ["12.5", "12.5"],
  ["three plus four", "3 + 4"],
  ["nine minus four", "9 - 4"],
  ["six times seven", "6 × 7"],
  ["eight divided by two", "8 ÷ 2"],
  ["x equals seven", "x = 7"],
  ["the answer is twelve", "the answer is 12"],
];
const ES = [
  ["doce", "12"],
  ["doce coma cinco", "12.5"],
  ["menos siete", "-7"],
  ["cuarenta por ciento", "40%"],
  ["tres cuartos", "3/4"],
  ["un medio", "1/2"],
  ["dos tercios", "2/3"],
  ["siete sobre doce", "7/12"],
  ["tres y medio", "3 1/2"],
  ["treinta y cinco", "35"],
  ["veintiuno", "21"],
  ["ciento veinte", "120"],
  ["dos mil trescientos cuarenta y cinco", "2345"],
  ["quinientos", "500"],
  ["tres más cuatro", "3 + 4"],
  ["nueve menos cuatro", "9 - 4"],
  ["seis por siete", "6 × 7"],
  ["ocho dividido entre dos", "8 ÷ 2"],
];

test("English number words become what a student would type", () => {
  for (const [said, typed] of EN) assert.equal(spokenToText(said, "en"), typed, said);
});

test("Spanish number words become what a student would type", () => {
  for (const [said, typed] of ES) assert.equal(spokenToText(said, "es"), typed, said);
});

test("it never works anything out", () => {
  assert.equal(spokenToText("three plus four", "en"), "3 + 4");
  assert.notEqual(spokenToText("three plus four", "en"), "7");
  assert.equal(spokenToText("tres más cuatro", "es"), "3 + 4");
});

test("words that are not numbers keep the speaker's own spelling", () => {
  assert.equal(spokenToText("Because the ratio is three to four", "en"), "Because the ratio is 3 to 4");
  assert.equal(spokenToText("", "en"), "");
});

test("a number field only accepts a clean numeric answer", () => {
  assert.equal(spokenToNumberAnswer("twelve point five", "en"), "12.5");
  assert.equal(spokenToNumberAnswer("I think it is forty percent", "en"), "40%");
  assert.equal(spokenToNumberAnswer("no idea", "en"), "");
  assert.equal(spokenToNumberAnswer("tres cuartos", "es"), "3/4");
});

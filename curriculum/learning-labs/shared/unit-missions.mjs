// Unit-specific mathematical tasks share only their placement in the lab flow.
import { mountUnit2, unit2Challenge } from './unit2.mjs';
import { mountUnit3, unit3Challenge } from './unit3.mjs';
import { mountUnit4, unit4Challenge } from './unit4.mjs';
import { mountUnit5, unit5Challenge } from './unit5.mjs';
import { mountUnit6, unit6Challenge } from './unit6.mjs';
import { mountUnit7, unit7Challenge } from './unit7.mjs';
import { mountUnit8, unit8Challenge } from './unit8.mjs';
import { mountUnit9, unit9Challenge } from './unit9.mjs';

const missions = new Map([
  [2, [unit2Challenge, mountUnit2]],
  [3, [unit3Challenge, mountUnit3]],
  [4, [unit4Challenge, mountUnit4]],
  [5, [unit5Challenge, mountUnit5]],
  [6, [unit6Challenge, mountUnit6]],
  [7, [unit7Challenge, mountUnit7]],
  [8, [unit8Challenge, mountUnit8]],
  [9, [unit9Challenge, mountUnit9]],
]);

export function unitMission(lab) {
  const pair = missions.get(lab.unit);
  if (!pair) return null;
  const challenge = pair[0](lab);
  return challenge ? { challenge, mount: pair[1] } : null;
}

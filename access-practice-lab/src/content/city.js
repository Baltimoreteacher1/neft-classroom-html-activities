// Language City content: 6 buildings and 12 missions (two per building), 72 steps of real language tasks.
// Authoring helpers: city-kit.js. One file per building keeps each under the size cap.
import { CAFE_MISSIONS } from "./city-cafe.js";
import { CLINIC_MISSIONS } from "./city-clinic.js";
import { LIBRARY_MISSIONS } from "./city-library.js";
import { MARKET_MISSIONS } from "./city-market.js";
import { BUILDINGS, buildingOf } from "./city-places.js";
import { SCHOOL_OFFICE_MISSIONS } from "./city-school-office.js";
import { STATION_MISSIONS } from "./city-station.js";

export { BUILDINGS, buildingOf };

export const MISSIONS = [
  ...CAFE_MISSIONS,
  ...LIBRARY_MISSIONS,
  ...CLINIC_MISSIONS,
  ...MARKET_MISSIONS,
  ...SCHOOL_OFFICE_MISSIONS,
  ...STATION_MISSIONS,
];

export const missionsAt = (placeId) => MISSIONS.filter((m) => m.place === placeId);
export const missionOf = (placeId, id) =>
  MISSIONS.find((m) => m.place === placeId && m.id === id) || null;

import type { SchemeTemplate } from "./types";

export const SCHEMES: SchemeTemplate[] = [
  {
    name: "Rowhouses",
    minLotAreaSqFt: 3000,
    minLotWidthFt: 30,
    typicalStories: 2,
    baseUnits: 4,
    footprintPerUnitSqFt: 600,
    parkingPerUnit: 1,
    constCostPerGfa: 175,
    salePriceOrRentPerUnit: 375000,
  },
  {
    name: "DuplexRear",
    minLotAreaSqFt: 3500,
    minLotWidthFt: 35,
    typicalStories: 2,
    baseUnits: 3,
    footprintPerUnitSqFt: 700,
    parkingPerUnit: 1,
    constCostPerGfa: 170,
    salePriceOrRentPerUnit: 395000,
  },
  {
    name: "TriplexStack",
    minLotAreaSqFt: 3500,
    minLotWidthFt: 35,
    typicalStories: 3,
    baseUnits: 3,
    footprintPerUnitSqFt: 750,
    parkingPerUnit: 1,
    constCostPerGfa: 165,
    salePriceOrRentPerUnit: 365000,
  },
  {
    name: "Apt5Story",
    minLotAreaSqFt: 8000,
    minLotWidthFt: 60,
    typicalStories: 5,
    baseUnits: 20,
    footprintPerUnitSqFt: 600,
    parkingPerUnit: 0.5,
    constCostPerGfa: 210,
    salePriceOrRentPerUnit: 21000, // annual rent per unit
  },
];

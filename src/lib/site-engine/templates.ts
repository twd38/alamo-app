import type { SchemeTemplate } from "./types";

export const SCHEMES: SchemeTemplate[] = [
  {
    name: "Rowhouses",
    minLotAreaSqFt: 6000,
    minLotWidthFt: 60,
    typicalStories: 3,
    baseUnits: 4,
    footprintPerUnitSqFt: 1800,
    parkingPerUnit: 0,
    constCostPerGfa: 175,
    salePriceOrRentPerUnit: 375000,
  },
  {
    name: "DuplexRear",
    minLotAreaSqFt: 5750,
    minLotWidthFt: 60,
    typicalStories: 3,
    baseUnits: 3,
    footprintPerUnitSqFt: 1800,
    parkingPerUnit: 0,
    constCostPerGfa: 170,
    salePriceOrRentPerUnit: 395000,
  },
  {
    name: "TriplexStack",
    minLotAreaSqFt: 3500,
    minLotWidthFt: 60,
    typicalStories: 3,
    baseUnits: 3,
    footprintPerUnitSqFt: 750,
    parkingPerUnit: 0,
    constCostPerGfa: 165,
    salePriceOrRentPerUnit: 365000,
  },
  {
    name: "Apt5Story",
    minLotAreaSqFt: 8000,
    minLotWidthFt: 60,
    typicalStories: 5,
    baseUnits: 20,
    footprintPerUnitSqFt: 1200,
    parkingPerUnit: 0,
    constCostPerGfa: 210,
    salePriceOrRentPerUnit: 21000, // annual rent per unit
  },
];

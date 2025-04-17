// shared by all three modules
export type Setbacks = { front: number; rear: number; side: number }; // ft

export interface Lot {
  id: string;
  zoning: string;
  areaSqFt: number;
  widthFt: number;
  depthFt: number;
  heightLimitFt: number | null;
  farLimit: number | null;
  coverageLimit: number | null;   // decimal (0‑1) or null
  unitLimit: number | null;
  parkingMinPerUnit: number;      // e.g. 1.0
  setbacks: Setbacks;
  landCost: number;               // $ – optional but handy for pro‑forma
}

export interface SchemeTemplate {
  name: "Rowhouses" | "DuplexRear" | "TriplexStack" | "Apt5Story";
  minLotAreaSqFt: number;
  minLotWidthFt: number;
  typicalStories: number;
  baseUnits: number;              // units BEFORE yield scaling
  footprintPerUnitSqFt: number;   // finished floorplate per unit
  parkingPerUnit: number;
  constCostPerGfa: number;        // $/ft² (hard)
  salePriceOrRentPerUnit: number; // $ (sale) or $/yr (rent)
}

export interface FeasibilityResult {
  feasible: boolean;
  blocking: string[];             // empty → feasible
}

export interface YieldResult {
  units: number;
  stories: number;
  gfa: number;                    // gross floor area ft²
  stalls: number;
  coverageUsed: number;           // 0‑1
  farUsed: number;                // decimal FAR
}

export interface FinanceResult {
  profit: number;                 // $ (before tax)
  irr: number;                    // decimal
  residualLandValue: number;      // $ (what you *could* pay for land)
}

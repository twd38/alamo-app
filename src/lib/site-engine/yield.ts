import type { Lot, SchemeTemplate, YieldResult } from "./types";

export function buildYield(lot: Lot, scheme: SchemeTemplate): YieldResult {
  // 1. setbacks → buildable envelope
  const buildWidth = Math.max(lot.widthFt - 2 * lot.setbacks.side, 0);
  const buildDepth = Math.max(lot.depthFt - lot.setbacks.front - lot.setbacks.rear, 0);
  const footprintMax = buildWidth * buildDepth;

  // 2. scale row count / footprint
  let units = scheme.baseUnits;
  let footprint = units * scheme.footprintPerUnitSqFt;

  // crude width scaling for rowhouses
  if (scheme.name === "Rowhouses") {
    const rowsThatFit = Math.floor(buildWidth / (scheme.footprintPerUnitSqFt / buildDepth));
    units = Math.max(rowsThatFit, 0);
    footprint = units * scheme.footprintPerUnitSqFt;
  }

  // 3. enforce FAR + coverage iteratively (could optimise later)
  let stories = scheme.typicalStories;
  let gfa = footprint * stories;

  // shrink stories if we bust FAR or height
  const maxStoriesByHeight =
    lot.heightLimitFt ? Math.floor(lot.heightLimitFt / 10) : Number.POSITIVE_INFINITY;

  const farLimit = lot.farLimit ?? Number.POSITIVE_INFINITY;
  const coverageLimit = lot.coverageLimit ?? 1;

  while (
    (gfa / lot.areaSqFt > farLimit || footprint / lot.areaSqFt > coverageLimit) &&
    stories > 0
  ) {
    stories -= 1;
    gfa = footprint * stories;
  }

  // 4. parking after scaling
  const stalls = Math.ceil(units * Math.max(lot.parkingMinPerUnit, scheme.parkingPerUnit));

  return {
    units,
    stories,
    gfa,
    stalls,
    coverageUsed: footprint / lot.areaSqFt,
    farUsed: gfa / lot.areaSqFt,
  };
}

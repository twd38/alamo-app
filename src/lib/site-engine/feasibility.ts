import type { Lot, SchemeTemplate, FeasibilityResult } from './types';

export function checkFeasibility(
  lot: Lot,
  scheme: SchemeTemplate
): FeasibilityResult {
  const b: string[] = [];

  if (lot.areaSqFt < scheme.minLotAreaSqFt) b.push('lot too small');
  if (lot.widthFt < scheme.minLotWidthFt) b.push('lot too narrow');
  if (lot.unitLimit !== null && scheme.baseUnits > lot.unitLimit)
    b.push('unit cap exceeded');

  const storiesNeeded = scheme.typicalStories;
  const heightNeeded = storiesNeeded * 10; // assume 10 ft per story
  if (lot.heightLimitFt !== null && heightNeeded > lot.heightLimitFt)
    b.push(`height > ${lot.heightLimitFt} ft`);

  // parking check (base units; may change after yield scaling)
  const stallsNeeded =
    scheme.baseUnits * Math.max(lot.parkingMinPerUnit, scheme.parkingPerUnit);
  if (stallsNeeded > scheme.baseUnits) {
    /* Example heuristic: if parking/unit exceeds 1, note it here – we’ll recalc later */
  }

  return { feasible: b.length === 0, blocking: b };
}

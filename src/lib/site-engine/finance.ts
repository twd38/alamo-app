import type { FinanceResult, Lot, SchemeTemplate, YieldResult } from './types';

/** very thin assumptions object – extend as you wish */
export interface FinanceAssumptions {
  softCostPct: number; // e.g. 0.25
  contingencyPct: number; // e.g. 0.05
  discountRate: number; // for residual land value
  sellCapRate: number; // for rental income valuation
}

export function runFinance(
  lot: Lot,
  scheme: SchemeTemplate,
  yld: YieldResult,
  a: FinanceAssumptions
): FinanceResult {
  const revenue =
    scheme.name === 'Apt5Story'
      ? // ‑‑ rental product: capitalise NOI
        (scheme.salePriceOrRentPerUnit * yld.units) / a.sellCapRate
      : // ‑‑ for‑sale product: unit × sale price
        scheme.salePriceOrRentPerUnit * yld.units;

  const hardCost = scheme.constCostPerGfa * yld.gfa;
  const softCost = hardCost * a.softCostPct;
  const totalDevCost = hardCost + softCost + hardCost * a.contingencyPct;
  const profit = revenue - totalDevCost - lot.landCost;

  // IRR: two‑period approximation (‑land, +profit in year X)
  const irr = approximateIrr(-lot.landCost - totalDevCost, revenue, 2.0);

  // residual land value = PV(project) – totalDevCost
  const residualLandValue = revenue / (1 + a.discountRate) - totalDevCost;

  return { profit, irr, residualLandValue };
}

/** quick IRR helper (one outflow, one inflow) */
function approximateIrr(c0: number, c1: number, years = 1): number {
  if (c0 >= 0) return 0;
  return Math.pow(c1 / -c0, 1 / years) - 1;
}

/**
 * Centralised financial and regulatory assumptions for the site‑selection engine.
 * All monetary values are in US dollars.
 * Percentages are expressed as decimals (0.25 == 25%).
 *
 * This module is imported server‑side only.
 */

export interface FinanceAssumptions {
  /** Soft costs as a fraction of hard construction cost */
  softCostPct: number;
  /** Contingency applied to hard cost */
  contingencyPct: number;
  /** Discount rate used in residual‑land calculations */
  discountRate: number;
  /** Exit capitalization rate for rental (income) products */
  sellCapRate: number;
}

/**
 * Default assumptions, tuned for Austin‑metro infill as of 2025‑Q2.
 * These can be overri`dden per environment (see `withOverrides`).
 */
export const assumptions: FinanceAssumptions = {
  softCostPct: 0.25, // 25 % soft costs
  contingencyPct: 0.05, // 5 % contingency
  discountRate: 0.12, // 12 % discount rate
  sellCapRate: 0.06 // 6 % cap rate
};

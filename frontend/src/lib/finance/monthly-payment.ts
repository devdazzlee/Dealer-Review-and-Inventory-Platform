/** Default assumptions for estimated auto loan payments (illustrative only). */
export const PAYMENT_DEFAULTS = {
  downPaymentPercent: 10,
  annualRatePercent: 6.25,
  termMonths: 60,
} as const;

export const LOAN_TERM_OPTIONS = [36, 48, 60, 72] as const;

export type LoanTermMonths = (typeof LOAN_TERM_OPTIONS)[number];

export interface MonthlyPaymentInput {
  price: number;
  downPayment: number;
  annualRatePercent: number;
  termMonths: number;
}

/**
 * Standard amortizing loan payment (EMI):
 * P × r × (1+r)^n / ((1+r)^n − 1)
 */
export function calculateMonthlyPayment({
  price,
  downPayment,
  annualRatePercent,
  termMonths,
}: MonthlyPaymentInput): number {
  const principal = Math.max(0, price - Math.max(0, downPayment));
  if (principal === 0 || termMonths <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;

  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function defaultDownPayment(price: number): number {
  return Math.round((price * PAYMENT_DEFAULTS.downPaymentPercent) / 100);
}

/** Quick estimate using site-wide defaults — for PDP price row display. */
export function estimateMonthlyPayment(price: number): number {
  return calculateMonthlyPayment({
    price,
    downPayment: defaultDownPayment(price),
    annualRatePercent: PAYMENT_DEFAULTS.annualRatePercent,
    termMonths: PAYMENT_DEFAULTS.termMonths,
  });
}

export function formatMonthlyEstimate(amount: number): string {
  return `Est. $${Math.round(amount).toLocaleString("en-US")}/mo`;
}

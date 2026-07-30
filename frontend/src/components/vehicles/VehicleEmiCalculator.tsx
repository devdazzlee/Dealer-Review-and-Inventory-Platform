"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Calculator, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils/format";
import {
  calculateMonthlyPayment,
  defaultDownPayment,
  LOAN_TERM_OPTIONS,
  PAYMENT_DEFAULTS,
  type LoanTermMonths,
} from "@/lib/finance/monthly-payment";

interface VehicleEmiCalculatorProps {
  vehiclePrice: number;
  vehicleLabel: string;
  onClose: () => void;
}

export function VehicleEmiCalculator({
  vehiclePrice,
  vehicleLabel,
  onClose,
}: VehicleEmiCalculatorProps) {
  const titleId = useId();
  const [downPayment, setDownPayment] = useState(() =>
    defaultDownPayment(vehiclePrice)
  );
  const [apr, setApr] = useState<number>(PAYMENT_DEFAULTS.annualRatePercent);
  const [termMonths, setTermMonths] = useState<LoanTermMonths>(
    PAYMENT_DEFAULTS.termMonths
  );

  const monthly = calculateMonthlyPayment({
    price: vehiclePrice,
    downPayment,
    annualRatePercent: apr,
    termMonths,
  });
  const financed = Math.max(0, vehiclePrice - Math.max(0, downPayment));
  const totalInterest = Math.max(0, monthly * termMonths - financed);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[min(92dvh,40rem)] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 p-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="flex items-center gap-2 text-lg font-bold text-primary"
            >
              <Calculator className="h-5 w-5 shrink-0" />
              Monthly Payment Calculator
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {vehicleLabel} · {formatPrice(vehiclePrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/60 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estimated monthly payment
              </p>
              <p className="mt-1 text-3xl font-extrabold text-price">
                {formatPrice(Math.round(monthly))}
                <span className="text-base font-semibold text-muted-foreground">
                  /mo
                </span>
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                Down payment
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  max={vehiclePrice}
                  step={100}
                  value={downPayment}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) return;
                    setDownPayment(
                      Math.min(vehiclePrice, Math.max(0, Math.round(next)))
                    );
                  }}
                  className="h-11 w-full rounded-lg border border-input bg-white pl-7 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                Interest rate (APR)
              </span>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.1}
                  value={apr}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) return;
                    setApr(Math.min(30, Math.max(0, next)));
                  }}
                  className="h-11 w-full rounded-lg border border-input bg-white px-3 pr-8 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                Loan term
              </span>
              <Select
                value={String(termMonths)}
                onValueChange={(value) =>
                  setTermMonths(Number(value) as LoanTermMonths)
                }
              >
                <SelectTrigger aria-label="Loan term" className="h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {LOAN_TERM_OPTIONS.map((months) => (
                    <SelectItem key={months} value={String(months)}>
                      {months} months
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 p-3.5 text-sm">
              <div>
                <dt className="text-muted-foreground">Amount financed</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {formatPrice(Math.round(financed))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Est. total interest</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {formatPrice(Math.round(totalInterest))}
                </dd>
              </div>
            </dl>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Estimates only. Actual rates, taxes, fees, and terms vary by
              lender and credit. Confirm figures with the dealer before making a
              decision.
            </p>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

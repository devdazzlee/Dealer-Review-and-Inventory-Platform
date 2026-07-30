"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calculator,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Phone,
  X,
} from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { formatPhone, formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleEmiCalculator } from "@/components/vehicles/VehicleEmiCalculator";

type ModalKind = "contact" | "testdrive" | "emi" | null;

function fieldClass() {
  return "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
}

const TIME_SLOTS = [
  "Morning (9AM – 12PM)",
  "Afternoon (12PM – 4PM)",
  "Evening (4PM – 7PM)",
];

interface VehicleContactActionsProps {
  vehicle: Vehicle;
}

export function VehicleContactActions({ vehicle }: VehicleContactActionsProps) {
  const [modal, setModal] = useState<ModalKind>(null);
  const carLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <>
      <div
        className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3"
        role="group"
        aria-label="Vehicle actions"
      >
        <Button
          type="button"
          variant="gold"
          size="lg"
          className="w-full min-w-0 px-2.5"
          onClick={() => setModal("contact")}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          Book This Car
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full min-w-0 px-2.5"
          onClick={() => setModal("testdrive")}
        >
          <CalendarClock className="h-4 w-4 shrink-0" />
          Book a Test Drive
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full min-w-0 border-primary/40 bg-[hsl(219_48%_88%)] px-2.5 text-primary hover:border-primary/50 hover:bg-[hsl(219_48%_82%)] hover:text-primary"
          onClick={() => setModal("emi")}
        >
          <Calculator className="h-4 w-4 shrink-0" />
          Calculate EMI
        </Button>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border/70 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{carLabel}</p>
          <p className="text-lg font-extrabold text-price">
            {formatPrice(vehicle.price)}
          </p>
        </div>
        <Button
          type="button"
          variant="gold"
          className="shrink-0"
          onClick={() => setModal("contact")}
        >
          <MessageSquare className="h-4 w-4" />
          Book This Car
        </Button>
      </div>

      <AnimatePresence>
        {(modal === "contact" || modal === "testdrive") && (
          <ContactModal
            kind={modal}
            vehicle={vehicle}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "emi" && (
          <VehicleEmiCalculator
            vehiclePrice={vehicle.price}
            vehicleLabel={carLabel}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ContactModal({
  kind,
  vehicle,
  onClose,
}: {
  kind: "contact" | "testdrive";
  vehicle: Vehicle;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<"form" | "sending" | "sent">("form");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [dateError, setDateError] = useState(false);

  const title =
    kind === "contact" ? "Book This Car" : "Book a Test Drive";
  const carLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const digits = vehicle.dealer.phone.replace(/\D/g, "");

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "testdrive" && !date) {
      setDateError(true);
      return;
    }
    setStatus("sending");
    // Demo only, no backend endpoint. Simulate a successful request.
    window.setTimeout(() => setStatus("sent"), 750);
  }

  const sending = status === "sending";

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
      aria-label={title}
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
            <h2 className="text-lg font-bold text-primary">{title}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {carLabel} · {formatPrice(vehicle.price)}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {vehicle.dealer.name}, {vehicle.dealer.city},{" "}
              {vehicle.dealer.state}
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {status === "sent" ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h3 className="text-lg font-bold text-primary">
                {kind === "contact"
                  ? "Request sent!"
                  : "Test drive requested!"}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                {vehicle.dealer.name} has received your request and will reach
                out shortly to confirm details for the {carLabel}.
              </p>
              <a
                href={`tel:${digits}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                Prefer to call? {formatPhone(vehicle.dealer.phone)}
              </a>
              <Button
                type="button"
                variant="outline"
                className="mt-5 w-full"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    Full name
                  </span>
                  <input
                    required
                    name="name"
                    className={fieldClass()}
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    Phone
                  </span>
                  <input
                    required
                    type="tel"
                    name="phone"
                    className={fieldClass()}
                    placeholder="(555) 123-4567"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  Email
                </span>
                <input
                  required
                  type="email"
                  name="email"
                  className={fieldClass()}
                  placeholder="jane@example.com"
                />
              </label>

              {kind === "testdrive" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      Preferred date
                    </span>
                    <DatePicker
                      value={date}
                      onChange={(d) => {
                        setDate(d);
                        setDateError(false);
                      }}
                      placeholder="Pick a date"
                      contentClassName="z-[200]"
                    />
                    {dateError && (
                      <span className="text-xs font-medium text-destructive">
                        Please choose a date.
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      Preferred time
                    </span>
                    <Select value={time} onValueChange={setTime}>
                      <SelectTrigger aria-label="Preferred time" className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  Message
                </span>
                <textarea
                  name="message"
                  rows={3}
                  className="w-full resize-y rounded-lg border border-input bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  defaultValue={
                    kind === "contact"
                      ? `Hi, I'm interested in the ${carLabel}. Please send me more details and current availability.`
                      : `Hi, I'd like to schedule a test drive for the ${carLabel}. Please confirm a time that works.`
                  }
                />
              </label>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : kind === "contact" ? (
                  "Send Request"
                ) : (
                  "Request Test Drive"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Or call {vehicle.dealer.name} at{" "}
                <a
                  href={`tel:${digits}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {formatPhone(vehicle.dealer.phone)}
                </a>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

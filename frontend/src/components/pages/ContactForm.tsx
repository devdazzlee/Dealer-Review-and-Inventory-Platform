"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUBJECTS = [
  "General question",
  "Help finding a car",
  "Dealer / listing issue",
  "Report a review",
  "List my dealership",
  "Press or partnership",
];

function fieldClass() {
  return "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
}

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [subject, setSubject] = useState(SUBJECTS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    // Demo only, no backend endpoint. Simulate a successful submission.
    window.setTimeout(() => setStatus("sent"), 700);
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-success/30 bg-success/5 px-6 py-14 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="text-xl font-bold text-primary">Message sent!</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Thanks for reaching out. Our team typically replies within one
          business day.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setStatus("idle")}
        >
          Send another message
        </Button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/70 bg-white p-6 shadow-card"
    >
      <h2 className="text-xl font-bold text-primary">Send us a message</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill out the form and we&apos;ll get back to you shortly.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <span className="text-sm font-semibold text-foreground">Email</span>
          <input
            required
            type="email"
            name="email"
            className={fieldClass()}
            placeholder="jane@example.com"
          />
        </label>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold text-foreground">Subject</span>
          <input type="hidden" name="subject" value={subject} />
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger aria-label="Subject" className="h-11 rounded-lg border-input bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold text-foreground">Message</span>
          <textarea
            required
            name="message"
            rows={5}
            className="w-full resize-y rounded-lg border border-input bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="How can we help?"
          />
        </label>
      </div>

      <Button
        type="submit"
        variant="gold"
        size="lg"
        className="mt-5 w-full sm:w-auto"
        disabled={sending}
      >
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}

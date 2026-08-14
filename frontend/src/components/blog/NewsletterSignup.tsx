"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";

export function NewsletterSignup({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/blog/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Could not subscribe");
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <p className="text-sm font-bold text-primary">Get buying guides</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Practical car-shopping notes. No spam.
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@email.com"
        className="mt-3 w-full rounded-md border border-input px-3 py-2 text-sm"
      />
      <Button type="submit" size="sm" className="mt-2 w-full" disabled={status === "saving"}>
        {status === "saving" ? "Subscribing…" : "Subscribe"}
      </Button>
      {status === "done" && (
        <p className="mt-2 text-xs text-success">You are on the list.</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs text-destructive">Could not subscribe. Try again.</p>
      )}
    </form>
  );
}

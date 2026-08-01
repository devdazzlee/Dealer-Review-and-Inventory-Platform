"use client";

import { Button } from "@/components/ui/button";

export function ClientPrint() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      Print / Download
    </Button>
  );
}

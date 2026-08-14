"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const btn =
    "inline-flex items-center rounded-md border border-border/70 bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary/40";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className={btn}
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noreferrer"
      >
        Twitter
      </a>
      <a
        className={btn}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noreferrer"
      >
        Facebook
      </a>
      <a
        className={btn}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noreferrer"
      >
        LinkedIn
      </a>
      <button type="button" className={btn} onClick={() => void copy()}>
        <Link2 className="mr-1 h-3.5 w-3.5" />
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

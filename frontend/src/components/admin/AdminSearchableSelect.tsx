"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchableOption = { value: string; label: string };

interface AdminSearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  allOption?: SearchableOption;
  className?: string;
  disabled?: boolean;
}

/**
 * Filterable single-select for long admin lists.
 *
 * Root cause of Dialog bugs: Radix Dialog's RemoveScroll + FocusScope only
 * allow focus/wheel inside Dialog.Content. A default Popover portals to
 * <body>, so the menu is "outside" the dialog — search can't take focus and
 * the list can't scroll.
 *
 * Fix: portal the menu into the nearest [role=dialog] when nested, so it
 * stays inside the dialog's scroll/focus boundary.
 */
export function AdminSearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
  allOption,
  className,
  disabled,
}: AdminSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selectedLabel = useMemo(() => {
    if (allOption && value === allOption.value) return allOption.label;
    return options.find((o) => o.value === value)?.label ?? placeholder;
  }, [allOption, options, placeholder, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = allOption ? [allOption, ...options] : options;
    if (!q) return base;
    return base.filter((o) => o.label.toLowerCase().includes(q));
  }, [allOption, options, query]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  function handleOpenChange(next: boolean) {
    if (next) {
      // Resolve before paint so the menu never mounts under <body> inside a Dialog.
      setPortalContainer(
        triggerRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null
      );
    } else {
      setPortalContainer(null);
      setQuery("");
    }
    setOpen(next);
  }

  function choose(next: string) {
    onValueChange(next);
    setQuery("");
    setOpen(false);
    setPortalContainer(null);
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <PopoverPrimitive.Trigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          className={cn(
            "h-10 w-full justify-between border-input bg-white px-3 font-normal text-foreground",
            "hover:bg-secondary hover:text-foreground",
            "data-[state=open]:bg-secondary data-[state=open]:text-foreground",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className={cn(
            "z-[220] w-[var(--radix-popover-trigger-width)] rounded-lg border border-border/70 bg-white p-2 text-popover-foreground shadow-card outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
              aria-label={searchPlaceholder}
              autoComplete="off"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-60 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            {filtered.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </li>
            ) : (
              filtered.map((option) => {
                const selected = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground",
                        "hover:bg-secondary hover:text-foreground",
                        selected && "bg-secondary font-medium text-foreground"
                      )}
                      onClick={() => choose(option.value)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

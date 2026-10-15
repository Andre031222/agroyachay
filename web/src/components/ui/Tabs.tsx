"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "md" | "sm";
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, label, size = "md", className }: TabsProps<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (event: KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + items.length) % items.length;
    onChange(items[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={cn("no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-[980px] bg-surface p-1", className)}>
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={`${id}-${item.value}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(event) => onKey(event, index)}
            onClick={() => onChange(item.value)}
            className={cn(
              "whitespace-nowrap rounded-[980px] font-medium transition-colors",
              size === "md" ? "min-h-12 px-4 text-[17px]" : "min-h-12 px-3 text-[15px]",
              selected ? "border border-line bg-bg text-text" : "border border-transparent text-muted hover:text-text",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

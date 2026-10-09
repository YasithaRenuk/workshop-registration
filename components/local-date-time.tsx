"use client";

import { useMounted } from "@/lib/use-mounted";

export function LocalDateTime({ value }: { value: string | Date }) {
  const mounted = useMounted();
  const d = new Date(value);
  return (
    <time dateTime={d.toISOString()} className="whitespace-nowrap">
      {mounted
        ? d.toLocaleString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "\u00A0"}
    </time>
  );
}
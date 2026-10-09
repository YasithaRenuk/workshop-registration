"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { endOfDayISO, isoToDateInput, presetRange, startOfDayISO } from "@/lib/date";
import { useMounted } from "@/lib/use-mounted";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function WorkshopFilters({ showDrafts }: { showDrafts: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const mounted = useMounted();

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page"); // any filter change goes back to page 1
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const applyPreset = (kind: "today" | "week" | "next7") => update(presetRange(kind));
  const hasFilters = params.toString().length > 0;

  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Quick range:</span>
        <Button variant="outline" size="sm" onClick={() => applyPreset("today")}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyPreset("week")}>
          This week
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyPreset("next7")}>
          Next 7 days
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)}>
            Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <form
          className="space-y-2 lg:col-span-2"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            update({ q: q || null });
          }}
        >
          <Label htmlFor="q">Search (press Enter)</Label>
          <Input
            id="q"
            name="q"
            key={params.get("q") ?? ""}
            defaultValue={params.get("q") ?? ""}
            placeholder="Title, code or instructor"
          />
        </form>

        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={mounted ? isoToDateInput(params.get("from")) : ""}
            onChange={(e) =>
              update({ from: e.target.value ? startOfDayISO(e.target.value) : null })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={mounted ? isoToDateInput(params.get("to")) : ""}
            onChange={(e) =>
              update({ to: e.target.value ? endOfDayISO(e.target.value) : null })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className={selectClass}
            value={params.get("status") ?? ""}
            onChange={(e) => update({ status: e.target.value || null })}
          >
            <option value="">All</option>
            <option value="OPEN">Open</option>
            {showDrafts && <option value="DRAFT">Draft</option>}
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="hasSeats"
          checked={params.get("hasSeats") === "true"}
          onCheckedChange={(c) => update({ hasSeats: c ? "true" : null })}
        />
        <Label htmlFor="hasSeats">Only workshops with free seats</Label>
      </div>
    </div>
  );
}
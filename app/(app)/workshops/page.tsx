export const instant = false;

import Link from "next/link";
import { Suspense } from "react";
import type { Role } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocalDateTime } from "@/components/local-date-time";
import { StatusBadge } from "@/components/workshop-status-badge";
import { WorkshopFilters } from "@/components/workshop-filters";
import { can } from "@/lib/permissions";
import { requirePage } from "@/lib/session";
import { workshopListQuery } from "@/lib/validation";
import { listWorkshops } from "@/lib/workshops";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function WorkshopsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePage("workshop:read");
  const role = session.user.role as Role;
  const isManager = can(role, "workshop:write");

  // Normalise the URL params; a bad value falls back to defaults instead of crashing
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(await searchParams)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) raw[k] = val;
  }
  const parsed = workshopListQuery.safeParse(raw);
  const query = parsed.success ? parsed.data : workshopListQuery.parse({});

  const { items, total, page, pageSize } = await listWorkshops(query, role);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (p: number) => {
    const sp = new URLSearchParams(raw);
    sp.set("page", String(p));
    return `/workshops?${sp.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Workshops</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "workshop" : "workshops"}
          </p>
        </div>
        {isManager && (
          <Link href="/workshops/new" className={buttonVariants()}>
            New workshop
          </Link>
        )}
      </div>

      <Suspense>
        <WorkshopFilters showDrafts={isManager} />
      </Suspense>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workshop</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No workshops match these filters.
                </TableCell>
              </TableRow>
            )}
            {items.map((w) => (
              <TableRow key={w.id}>
                <TableCell>
                  <Link href={`/workshops/${w.id}`} className="font-medium hover:underline">
                    {w.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">{w.code}</div>
                </TableCell>
                <TableCell>{w.instructor}</TableCell>
                <TableCell>
                  <LocalDateTime value={w.startsAt} />
                </TableCell>
                <TableCell>{w.location}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">
                      {w.activeCount}/{w.capacity}
                    </span>
                    {w.isFull ? (
                      <Badge variant="destructive">Full</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {w.seatsAvailable} left
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={w.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
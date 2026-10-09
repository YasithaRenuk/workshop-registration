export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CancelRegistrationButton } from "@/components/cancel-registration-button";
import { LocalDateTime } from "@/components/local-date-time";
import { RegisterForm } from "@/components/register-form";
import { RegStatusBadge, WhoWhen } from "@/components/registration-bits";
import { StatusBadge } from "@/components/workshop-status-badge";
import { ApiError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { listWorkshopRegistrations } from "@/lib/registrations";
import { requirePage } from "@/lib/session";
import { cn } from "@/lib/utils";
import { registrationListQuery } from "@/lib/validation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const session = await requirePage("workshop:read");
  const role = session.user.role as Role;
  const canWrite = can(role, "registration:write");
  const isManager = can(role, "workshop:write");
  const { id } = await params;

  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(await searchParams)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) raw[k] = val;
  }
  const parsed = registrationListQuery.safeParse(raw);
  const query = parsed.success ? parsed.data : registrationListQuery.parse({});

  let data;
  try {
    data = await listWorkshopRegistrations(id, query, role);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const { workshop: w, items, total, page, pageSize } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pct = Math.min(100, Math.round((w.activeCount / w.capacity) * 100));
  const editable = w.status === "OPEN" || w.status === "DRAFT";

  const href = (over: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status: query.status, q: query.q, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return `/workshops/${id}${qs ? `?${qs}` : ""}`;
  };

  const tabs: { label: string; status?: string }[] = [
    { label: "All" },
    { label: "Active", status: "ACTIVE" },
    { label: "Cancelled", status: "CANCELLED" },
  ];

  return (
    <div className="space-y-6">
      <Link href="/workshops" className="text-sm text-muted-foreground hover:underline">
        &larr; Workshops
      </Link>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{w.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{w.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={w.status} />
              {isManager && editable && (
                <Link
                  href={`/workshops/${w.id}/edit`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Edit
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Instructor</dt>
              <dd className="font-medium">{w.instructor}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Starts</dt>
              <dd className="font-medium">
                <LocalDateTime value={w.startsAt} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ends</dt>
              <dd className="font-medium">
                {w.endsAt ? <LocalDateTime value={w.endsAt} /> : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="font-medium">{w.location}</dd>
            </div>
          </dl>
          {w.description && <p className="text-sm">{w.description}</p>}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium tabular-nums">
                {w.activeCount} of {w.capacity} seats taken
              </span>
              {w.isFull ? (
                <Badge variant="destructive">Full</Badge>
              ) : (
                <span className="text-muted-foreground">{w.seatsAvailable} left</span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full", w.isFull ? "bg-destructive" : "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Register */}
      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>Register an attendee</CardTitle>
          </CardHeader>
          <CardContent>
            {w.status !== "OPEN" ? (
              <p className="text-sm text-muted-foreground">
                Registration is closed because this workshop is{" "}
                {w.status.toLowerCase()}.
              </p>
            ) : w.isFull ? (
              <p className="text-sm text-muted-foreground">
                This workshop is full. Cancel an existing registration to free a seat.
              </p>
            ) : (
              <RegisterForm workshopId={w.id} />
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Registrations &amp; history</CardTitle>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-1">
              {tabs.map((t) => (
                <Link
                  key={t.label}
                  href={href({ status: t.status, page: undefined })}
                  className={buttonVariants({
                    variant: (query.status ?? undefined) === t.status ? "default" : "outline",
                    size: "sm",
                  })}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <form action={`/workshops/${id}`} method="get" className="flex gap-2">
              {query.status && <input type="hidden" name="status" value={query.status} />}
              <Input
                name="q"
                defaultValue={query.q ?? ""}
                placeholder="Search name or email"
                className="w-56"
              />
              <button type="submit" className={buttonVariants({ variant: "outline" })}>
                Search
              </button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attendee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered by</TableHead>
                <TableHead>Cancelled by</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No registrations yet.
                  </TableCell>
                </TableRow>
              )}
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.attendeeName}</div>
                    <div className="text-xs text-muted-foreground">{r.attendeeEmail}</div>
                  </TableCell>
                  <TableCell>
                    <RegStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <WhoWhen name={r.registeredBy.name} at={r.registeredAt} />
                  </TableCell>
                  <TableCell>
                    <WhoWhen name={r.cancelledBy?.name} at={r.cancelledAt} />
                    {r.cancelReason && (
                      <div className="mt-1 text-xs italic text-muted-foreground">
                        &ldquo;{r.cancelReason}&rdquo;
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "ACTIVE" && canWrite && (
                      <CancelRegistrationButton
                        registrationId={r.id}
                        attendeeName={r.attendeeName}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={href({ page: String(page - 1) })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={href({ page: String(page + 1) })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
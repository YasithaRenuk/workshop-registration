import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocalDateTime } from "@/components/local-date-time";
import { RegStatusBadge, WhoWhen } from "@/components/registration-bits";
import { searchRegistrations } from "@/lib/registrations";
import { requirePage } from "@/lib/session";
import { registrationListQuery } from "@/lib/validation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePage("registration:read");
  const role = session.user.role as Role;

  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(await searchParams)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) raw[k] = val;
  }
  const parsed = registrationListQuery.safeParse(raw);
  const query = parsed.success ? parsed.data : registrationListQuery.parse({});

  const { items, total, page, pageSize } = await searchRegistrations(query, role);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (p: number) => {
    const sp = new URLSearchParams(raw);
    sp.set("page", String(p));
    return `/registrations?${sp.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Registrations</h1>
        <p className="text-sm text-muted-foreground">
          Every registration across all workshops, including cancelled ones. {total} found.
        </p>
      </div>

      <form
        action="/registrations"
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-background p-4"
      >
        <div className="min-w-48 flex-1 space-y-2">
          <Label htmlFor="q">Attendee name or email</Label>
          <Input id="q" name="q" defaultValue={query.q ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={query.status ?? ""} className={selectClass}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button type="submit" className={buttonVariants()}>
          Search
        </button>
        <Link href="/registrations" className={buttonVariants({ variant: "ghost" })}>
          Clear
        </Link>
      </form>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Workshop</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered by</TableHead>
              <TableHead>Cancelled by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No registrations found.
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
                  <Link href={`/workshops/${r.workshop.id}`} className="font-medium hover:underline">
                    {r.workshop.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {r.workshop.code} · <LocalDateTime value={r.workshop.startsAt} />
                  </div>
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
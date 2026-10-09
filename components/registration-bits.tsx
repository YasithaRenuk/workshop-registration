import { Badge } from "@/components/ui/badge";
import { LocalDateTime } from "@/components/local-date-time";

export function RegStatusBadge({ status }: { status: string }) {
  return status === "ACTIVE" ? (
    <Badge>Active</Badge>
  ) : (
    <Badge variant="secondary">Cancelled</Badge>
  );
}

export function WhoWhen({
  name,
  at,
}: {
  name?: string | null;
  at?: Date | string | null;
}) {
  if (!at) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="text-sm">
      <div>{name ?? "Unknown"}</div>
      <div className="text-xs text-muted-foreground">
        <LocalDateTime value={at} />
      </div>
    </div>
  );
}
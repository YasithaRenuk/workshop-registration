"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ClientApiError, errorMessage, type FieldErrors } from "@/lib/client-api";
import { toDateTimeLocal } from "@/lib/date";
import { useMounted } from "@/lib/use-mounted";

export type WorkshopInitial = {
  id: string;
  code: string;
  title: string;
  instructor: string;
  description: string | null;
  location: string;
  startsAt: string | Date;
  endsAt: string | Date | null;
  capacity: number;
  status: string;
};

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

const toIso = (v: FormDataEntryValue | null) =>
  v ? new Date(String(v)).toISOString() : undefined;

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-sm text-red-600">{msg}</p> : null;
}

export function WorkshopForm({ initial }: { initial?: WorkshopInitial }) {
  const router = useRouter();
  const mounted = useMounted();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const editing = !!initial;

  // datetime local values depend on the browsers timezone so wait for mount
  if (!mounted) return <Skeleton className="h-96 w-full" />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      code: String(fd.get("code") ?? ""),
      title: String(fd.get("title") ?? ""),
      instructor: String(fd.get("instructor") ?? ""),
      location: String(fd.get("location") ?? ""),
      description: String(fd.get("description") ?? "").trim() || null,
      startsAt: toIso(fd.get("startsAt")),
      endsAt: toIso(fd.get("endsAt")) ?? null,
      capacity: Number(fd.get("capacity")),
      status: String(fd.get("status")),
    };

    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      const saved = await apiFetch<{ id: string }>(
        editing ? `/api/workshops/${initial!.id}` : "/api/workshops",
        { method: editing ? "PATCH" : "POST", body }
      );
      toast.success(editing ? "Workshop updated" : "Workshop created");
      router.push(`/workshops/${saved.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && Object.keys(err.fields).length) {
        setErrors(err.fields);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">Workshop code</Label>
            <Input id="code" name="code" required defaultValue={initial?.code} placeholder="POT-101" />
            <Err msg={errors.code} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={initial?.title} />
            <Err msg={errors.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor</Label>
            <Input id="instructor" name="instructor" required defaultValue={initial?.instructor} />
            <Err msg={errors.instructor} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" required defaultValue={initial?.location} />
            <Err msg={errors.location} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startsAt">Starts</Label>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(initial?.startsAt)}
            />
            <Err msg={errors.startsAt} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">Ends (optional)</Label>
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initial?.endsAt)}
            />
            <Err msg={errors.endsAt} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (seats)</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={1000}
              required
              defaultValue={initial?.capacity ?? 10}
            />
            <Err msg={errors.capacity} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className={selectClass}
              defaultValue={initial?.status ?? "OPEN"}
            >
              <option value="OPEN">Open (accepting registrations)</option>
              <option value="DRAFT">Draft (hidden from front desk)</option>
              {editing && <option value="CANCELLED">Cancelled</option>}
              {editing && <option value="COMPLETED">Completed</option>}
            </select>
            <Err msg={errors.status} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={initial?.description ?? ""}
            />
            <Err msg={errors.description} />
          </div>

          {formError && (
            <p className="text-sm text-red-600 sm:col-span-2">{formError}</p>
          )}
          {editing && (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Setting a workshop to Cancelled or Completed makes it read-only. Existing
              registrations and history are kept.
            </p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : editing ? "Save changes" : "Create workshop"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
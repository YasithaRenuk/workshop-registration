"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ClientApiError, errorMessage, type FieldErrors } from "@/lib/client-api";

export function RegisterForm({ workshopId }: { workshopId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; // capture before the await
    const fd = new FormData(form);
    setBusy(true);
    setErrors({});
    try {
      await apiFetch(`/api/workshops/${workshopId}/registrations`, {
        method: "POST",
        body: { name: String(fd.get("name")), email: String(fd.get("email")) },
      });
      toast.success("Attendee registered");
      form.reset();
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && Object.keys(err.fields).length) {
        setErrors(err.fields);
      } else {
        toast.error(errorMessage(err));
      }
      if (
        err instanceof ClientApiError &&
        ["WORKSHOP_FULL", "WORKSHOP_NOT_OPEN"].includes(err.code)
      ) {
        router.refresh(); // show the real, current state
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="name">Attendee name</Label>
        <Input id="name" name="name" required autoComplete="off" />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Attendee email</Label>
        <Input id="email" name="email" type="email" required autoComplete="off" />
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Registering..." : "Register"}
      </Button>
    </form>
  );
}
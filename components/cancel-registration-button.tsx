"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, errorMessage } from "@/lib/client-api";

export function CancelRegistrationButton({
  registrationId,
  attendeeName,
}: {
  registrationId: string;
  attendeeName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await apiFetch(`/api/registrations/${registrationId}/cancel`, {
        method: "POST",
        body: { reason: reason.trim() || undefined },
      });
      toast.success("Registration cancelled, seat freed");
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
      router.refresh();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cancel
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this registration?</AlertDialogTitle>
            <AlertDialogDescription>
              {attendeeName} will lose their seat. The record is kept in the history
              with your name and the time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="e.g. Called to say they can't make it"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep registration</AlertDialogCancel>
            <Button variant="destructive" onClick={confirm} disabled={busy}>
              {busy ? "Cancelling..." : "Cancel registration"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
import { NextResponse } from "next/server";
import { route, readJsonOrEmpty } from "@/lib/api";
import { requirePermission } from "@/lib/guard";
import { cancelRegistration } from "@/lib/registrations";
import { cancelSchema } from "@/lib/validation";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requirePermission("registration:write");
  const { id } = await params;
  const { reason } = cancelSchema.parse(await readJsonOrEmpty(req));
  const cancelled = await cancelRegistration({
    registrationId: id,
    actorId: user.id,
    reason,
  });
  return NextResponse.json(cancelled);
});
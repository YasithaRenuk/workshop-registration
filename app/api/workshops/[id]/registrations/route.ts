import { NextResponse } from "next/server";
import { route, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/guard";
import { listWorkshopRegistrations, registerAttendee } from "@/lib/registrations";
import { registerSchema, registrationListQuery } from "@/lib/validation";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requirePermission("registration:read");
  const { id } = await params;
  const query = registrationListQuery.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  return NextResponse.json(await listWorkshopRegistrations(id, query, user.role));
});

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requirePermission("registration:write");
  const { id } = await params;
  const data = registerSchema.parse(await readJson(req));
  const created = await registerAttendee({
    workshopId: id,
    name: data.name,
    email: data.email,
    actorId: user.id,
  });
  return NextResponse.json(created, { status: 201 });
});
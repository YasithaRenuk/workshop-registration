import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { requirePermission } from "@/lib/guard";
import { searchRegistrations } from "@/lib/registrations";
import { registrationListQuery } from "@/lib/validation";

export const GET = route(async (req) => {
  const user = await requirePermission("registration:read");
  const query = registrationListQuery.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  return NextResponse.json(await searchRegistrations(query, user.role));
});
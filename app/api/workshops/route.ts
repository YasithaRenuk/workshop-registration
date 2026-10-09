import { NextResponse } from "next/server";
import { route, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/guard";
import { createWorkshopSchema, workshopListQuery } from "@/lib/validation";
import { createWorkshop, listWorkshops } from "@/lib/workshops";

export const GET = route(async (req) => {
  const user = await requirePermission("workshop:read");
  const query = workshopListQuery.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  return NextResponse.json(await listWorkshops(query, user.role));
});

export const POST = route(async (req) => {
  const user = await requirePermission("workshop:write");
  const data = createWorkshopSchema.parse(await readJson(req));
  return NextResponse.json(await createWorkshop(data, user.id), { status: 201 });
});
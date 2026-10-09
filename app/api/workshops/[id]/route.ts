import { NextResponse } from "next/server";
import { route, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/guard";
import { updateWorkshopSchema } from "@/lib/validation";
import { getWorkshop, updateWorkshop } from "@/lib/workshops";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const user = await requirePermission("workshop:read");
  const { id } = await params;
  return NextResponse.json(await getWorkshop(id, user.role));
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requirePermission("workshop:write");
  const { id } = await params;
  const patch = updateWorkshopSchema.parse(await readJson(req));
  return NextResponse.json(await updateWorkshop(id, patch));
});
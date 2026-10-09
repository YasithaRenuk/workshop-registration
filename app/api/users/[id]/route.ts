import { NextResponse } from "next/server";
import { route, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/guard";
import { updateUser } from "@/lib/users";
import { updateUserSchema } from "@/lib/validation";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requirePermission("user:manage");
  const { id } = await params;
  const patch = updateUserSchema.parse(await readJson(req));
  return NextResponse.json(await updateUser(id, patch, admin.id));
});
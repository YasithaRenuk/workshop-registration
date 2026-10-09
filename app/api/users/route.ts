import { NextResponse } from "next/server";
import { route, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/guard";
import { createUserWithPassword } from "@/lib/create-user";
import { listUsers } from "@/lib/users";
import { createUserSchema } from "@/lib/validation";

export const GET = route(async () => {
  await requirePermission("user:manage");
  return NextResponse.json({ items: await listUsers() });
});

export const POST = route(async (req) => {
  await requirePermission("user:manage");
  const data = createUserSchema.parse(await readJson(req));
  return NextResponse.json(await createUserWithPassword(data), { status: 201 });
});
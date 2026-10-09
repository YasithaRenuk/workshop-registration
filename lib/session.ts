import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { can, type Permission } from "./permissions";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session && !session.user.disabled ? session : null;
});

export async function requirePage(permission: Permission) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.user.role, permission)) redirect("/");
  return session;
}
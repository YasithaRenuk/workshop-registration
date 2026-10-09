export const instant = false;

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { can } from "@/lib/permissions";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(can(session.user.role, "workshop:read") ? "/workshops" : "/users");
}
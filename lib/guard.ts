import { headers } from "next/headers";
import { auth } from "./auth";
import { ApiError } from "./errors";
import { can, type Permission } from "./permissions";
import type { Role } from "./generated/prisma/enums";

export async function requirePermission(permission: Permission) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "Please sign in.");
  }
  if (session.user.disabled) {
    throw new ApiError(403, "ACCOUNT_DISABLED", "This account has been disabled.");
  }
  if (!can(session.user.role, permission)) {
    throw new ApiError(403, "FORBIDDEN", "You don't have permission to do this.");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as Role,
  };
}
import { prisma } from "./db";
import { auth } from "./auth";
import { ApiError } from "./errors";
import type { UpdateUserInput } from "./validation";

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  disabled: true,
  createdAt: true,
} as const;

export function listUsers() {
  return prisma.user.findMany({
    select: publicUser,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

export async function updateUser(id: string, patch: UpdateUserInput, actorId: string) {
  // Hash outside the transaction
  const passwordHash = patch.password
    ? await (await auth.$context).password.hash(patch.password)
    : null;

  return prisma.$transaction(async (tx) => {
    // Serialize all admin changes so two Admins cant demote each other at once
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(7001)`;

    const target = await tx.user.findUnique({ where: { id } });
    if (!target) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");

    const changesRole = patch.role !== undefined && patch.role !== target.role;
    const disabling = patch.disabled === true && !target.disabled;

    if (id === actorId && (changesRole || disabling)) {
      throw new ApiError(
        409,
        "CANNOT_MODIFY_SELF",
        "You can't change your own role or disable your own account."
      );
    }

    // Never allow the system to end up with no usable Admin
    if (target.role === "ADMIN" && !target.disabled && (changesRole || disabling)) {
      const others = await tx.user.count({
        where: { role: "ADMIN", disabled: false, id: { not: id } },
      });
      if (others === 0) {
        throw new ApiError(409, "LAST_ADMIN", "There must be at least one active Admin.");
      }
    }

    const updated = await tx.user.update({
      where: { id },
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.role !== undefined && { role: patch.role }),
        ...(patch.disabled !== undefined && { disabled: patch.disabled }),
      },
      select: publicUser,
    });

    if (passwordHash) {
      await tx.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { password: passwordHash },
      });
    }

    // Force re-login after a password reset or disable
    if (passwordHash || disabling) {
      await tx.session.deleteMany({ where: { userId: id } });
    }

    return updated;
  });
}
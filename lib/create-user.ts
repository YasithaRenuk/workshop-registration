import { randomUUID } from "crypto";
import { auth } from "./auth";
import { prisma } from "./db";
import type { Role } from "./generated/prisma/enums";
import { ApiError, isUniqueViolation } from "./errors";

const emailTaken = () =>
  new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists.");

export async function createUserWithPassword(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw emailTaken();

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(input.password);
  const id = randomUUID();
  try {
    return prisma.user.create({
      data: {
        id,
        name: input.name.trim(),
        email,
        emailVerified: true,
        role: input.role,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: id,
            providerId: "credential",
            password: hash,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });
  }catch (e) {
    if (isUniqueViolation(e)) throw emailTaken();
    throw e;
  }
}
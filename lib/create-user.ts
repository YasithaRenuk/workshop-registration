import { randomUUID } from "crypto";
import { auth } from "./auth";
import { prisma } from "./db";
import type { Role } from "@/generated/prisma/enums";

export async function createUserWithPassword(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("EMAIL_TAKEN");

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(input.password);
  const id = randomUUID();

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
}
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // no public signup, Admins create accounts
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STAFF",
        input: false, // clients can never set their own role
      },
      disabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const u = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { disabled: true },
          });
          if (u?.disabled) return false; // refuse to create a session
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
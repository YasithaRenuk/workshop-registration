import "dotenv/config";
import { prisma } from "../lib/db";
import { createUserWithPassword } from "../lib/create-user";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await createUserWithPassword({
      name: "Admin",
      email,
      password,
      role: "ADMIN",
    });
    console.log(`Seeded admin: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
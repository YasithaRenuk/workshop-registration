import "dotenv/config";
import { prisma } from "../lib/db";
import { createUserWithPassword } from "../lib/create-user";

async function upsertUser(args: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}) {
  const existing = await prisma.user.findUnique({
    where: { email: args.email.toLowerCase() },
  });
  if (existing) {
    console.log(`User already exists: ${args.email}`);
    return existing;
  }
  const user = await createUserWithPassword(args);
  console.log(`Seeded ${args.role.toLowerCase()}: ${args.email}`);
  return user;
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  }

  // ── Users ────────────────────────────────────────────────────────────────
  const admin = await upsertUser({
    name: "Admin",
    email,
    password,
    role: "ADMIN",
  });

  const manager = await upsertUser({
    name: "Workshop Manager",
    email: "manager@example.com",
    password: "manager1234",
    role: "MANAGER",
  });

  await upsertUser({
    name: "Staff User",
    email: "staff@example.com",
    password: "staff1234",
    role: "STAFF",
  });

  // ── Sample workshops ──────────────────────────────────────────────────────
  const now = new Date();
  const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

  const workshops = [
    {
      code: "WS-REACT-101",
      title: "React Fundamentals",
      instructor: "Sarah Chen",
      description:
        "A hands-on introduction to React: components, hooks, and state management.",
      location: "Room A1 – Training Centre",
      startsAt: days(7),
      endsAt: days(7),
      capacity: 20,
      status: "OPEN" as const,
    },
    {
      code: "WS-NODE-201",
      title: "Node.js & REST APIs",
      instructor: "James Okafor",
      description:
        "Build production-ready REST APIs with Node.js, Express, and PostgreSQL.",
      location: "Room B3 – Training Centre",
      startsAt: days(14),
      endsAt: days(14),
      capacity: 15,
      status: "OPEN" as const,
    },
    {
      code: "WS-DOCKER-301",
      title: "Docker & Containerisation",
      instructor: "Priya Nair",
      description:
        "Containerise applications with Docker, write Compose files, and ship confidently.",
      location: "Remote – Zoom",
      startsAt: days(21),
      endsAt: days(21),
      capacity: 30,
      status: "OPEN" as const,
    },
    {
      code: "WS-AGILE-DFT",
      title: "Agile for Developers (Draft)",
      instructor: "Tom Briggs",
      description: "Draft workshop – not yet published.",
      location: "TBD",
      startsAt: days(30),
      endsAt: null,
      capacity: 25,
      status: "DRAFT" as const,
    },
  ];

  for (const w of workshops) {
    const found = await prisma.workshop.findUnique({ where: { code: w.code } });
    if (found) {
      console.log(`Workshop already exists: ${w.code}`);
      continue;
    }
    await prisma.workshop.create({
      data: { ...w, createdById: manager.id },
    });
    console.log(`Seeded workshop: ${w.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
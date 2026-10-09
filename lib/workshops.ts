import { Prisma } from "./generated/prisma/client";
import type { Role } from "./generated/prisma/enums";
import { prisma } from "./db";
import { ApiError, isUniqueViolation } from "./errors";
import type {
  CreateWorkshopInput,
  UpdateWorkshopInput,
  WorkshopListQuery,
} from "./validation";

export function withSeats<T extends { capacity: number }>(w: T, activeCount: number) {
  const seatsAvailable = Math.max(0, w.capacity - activeCount);
  return { ...w, activeCount, seatsAvailable, isFull: seatsAvailable === 0 };
}

const codeTaken = () =>
  new ApiError(409, "CODE_TAKEN", "A workshop with this code already exists.");

//list
export async function listWorkshops(q: WorkshopListQuery, role: Role) {
  const conditions: Prisma.Sql[] = [];

  // Drafts are only visible to Managers
  if (role !== "MANAGER") conditions.push(Prisma.sql`w."status" <> 'DRAFT'`);

  if (q.from) conditions.push(Prisma.sql`w."startsAt" >= ${q.from.toISOString()}::timestamp`);
  if (q.to) conditions.push(Prisma.sql`w."startsAt" <= ${q.to.toISOString()}::timestamp`);

  if (q.status?.length) {
    conditions.push(Prisma.sql`w."status"::text IN (${Prisma.join(q.status)})`);
  }
  if (q.hasSeats) {
    conditions.push(Prisma.sql`w."capacity" > COALESCE(r."active", 0)`);
  }
  if (q.q) {
    const like = `%${q.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      Prisma.sql`(w."title" ILIKE ${like} OR w."code" ILIKE ${like} OR w."instructor" ILIKE ${like})`
    );
  }

  const where = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;

  // One query computes the active count per workshop (no N+1)
  const from = Prisma.sql`
    FROM "workshop" w
    LEFT JOIN (
      SELECT "workshopId", COUNT(*)::int AS "active"
      FROM "registration"
      WHERE "status" = 'ACTIVE'
      GROUP BY "workshopId"
    ) r ON r."workshopId" = w."id"`;

  const offset = (q.page - 1) * q.pageSize;

  const [rows, totalRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: string;
        code: string;
        title: string;
        instructor: string;
        description: string | null;
        location: string;
        startsAt: Date;
        endsAt: Date | null;
        capacity: number;
        status: string;
        activeCount: number;
      }>
    >(Prisma.sql`
      SELECT w."id", w."code", w."title", w."instructor", w."description",
             w."location", w."startsAt", w."endsAt", w."capacity",
             w."status"::text AS "status",
             COALESCE(r."active", 0)::int AS "activeCount"
      ${from} ${where}
      ORDER BY w."startsAt" ASC, w."id" ASC
      LIMIT ${q.pageSize} OFFSET ${offset}`),
    prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`SELECT COUNT(*)::int AS "total" ${from} ${where}`
    ),
  ]);

  return {
    items: rows.map(({ activeCount, ...w }) => withSeats(w, activeCount)),
    total: totalRows[0]?.total ?? 0,
    page: q.page,
    pageSize: q.pageSize,
  };
}

//get
export async function getWorkshop(id: string, role: Role) {
  const w = await prisma.workshop.findUnique({ where: { id } });
  if (!w || (w.status === "DRAFT" && role !== "MANAGER")) {
    throw new ApiError(404, "WORKSHOP_NOT_FOUND", "Workshop not found.");
  }
  const active = await prisma.registration.count({
    where: { workshopId: id, status: "ACTIVE" },
  });
  return withSeats(w, active);
}

// create
export async function createWorkshop(input: CreateWorkshopInput, actorId: string) {
  try {
    const w = await prisma.workshop.create({
      data: { ...input, createdById: actorId },
    });
    return withSeats(w, 0);
  } catch (e) {
    if (isUniqueViolation(e)) throw codeTaken();
    throw e;
  }
}

// update
export async function updateWorkshop(id: string, patch: UpdateWorkshopInput) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        // Same row lock as registerAttendee: an edit can't race with a registration
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id" FROM "workshop" WHERE "id" = ${id} FOR UPDATE`;
        if (!locked[0]) {
          throw new ApiError(404, "WORKSHOP_NOT_FOUND", "Workshop not found.");
        }

        const current = await tx.workshop.findUniqueOrThrow({ where: { id } });
        if (current.status === "CANCELLED" || current.status === "COMPLETED") {
          throw new ApiError(
            409,
            "WORKSHOP_CLOSED",
            "Cancelled or completed workshops can't be edited."
          );
        }

        const active = await tx.registration.count({
          where: { workshopId: id, status: "ACTIVE" },
        });

        if (patch.capacity !== undefined && patch.capacity < active) {
          throw new ApiError(
            409,
            "CAPACITY_BELOW_REGISTERED",
            `Capacity can't be lower than the ${active} active registration(s).`
          );
        }
        if (patch.status === "DRAFT" && active > 0) {
          throw new ApiError(
            409,
            "HAS_REGISTRATIONS",
            "A workshop with active registrations can't go back to draft."
          );
        }

        const startsAt = patch.startsAt ?? current.startsAt;
        const endsAt = patch.endsAt === undefined ? current.endsAt : patch.endsAt;
        if (endsAt && endsAt <= startsAt) {
          throw new ApiError(400, "VALIDATION_ERROR", "End must be after start.");
        }

        const updated = await tx.workshop.update({ where: { id }, data: patch });
        return withSeats(updated, active);
      },
      { maxWait: 10_000, timeout: 10_000 }
    );
  } catch (e) {
    if (isUniqueViolation(e)) throw codeTaken();
    throw e;
  }
}
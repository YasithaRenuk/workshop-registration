import { prisma } from "./db";
import { ApiError } from "./errors";

function isUniqueViolation(e: unknown) {
  return (
    typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002"
  );
}

export async function registerAttendee(input: {
  workshopId: string;
  name: string;
  email: string;
  actorId: string;
}) {
  const attendeeName = input.name.trim();
  const attendeeEmail = input.email.trim().toLowerCase();

  try {
    return await prisma.$transaction(
      async (tx) => {
        //Lock this workshops row Any other registration attempt for the SAME workshop waits here until we commit or roll back
        const rows = await tx.$queryRaw<
          { id: string; capacity: number; status: string }[]
        >`SELECT "id", "capacity", "status"::text AS "status"
          FROM "workshop" WHERE "id" = ${input.workshopId} FOR UPDATE`;

        const workshop = rows[0];
        if (!workshop) {
          throw new ApiError(404, "WORKSHOP_NOT_FOUND", "Workshop not found.");
        }
        if (workshop.status !== "OPEN") {
          throw new ApiError(
            409,
            "WORKSHOP_NOT_OPEN",
            "This workshop is not open for registration."
          );
        }

        //Count seats while holding the lock so the number do not change
        const active = await tx.registration.count({
          where: { workshopId: input.workshopId, status: "ACTIVE" },
        });
        if (active >= workshop.capacity) {
          throw new ApiError(409, "WORKSHOP_FULL", "This workshop is full.");
        }

        // Safe insert
        return tx.registration.create({
          data: {
            workshopId: input.workshopId,
            attendeeName,
            attendeeEmail,
            registeredById: input.actorId,
          },
        });
      },
      { maxWait: 10_000, timeout: 10_000 }
    );
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw new ApiError(
        409,
        "ALREADY_REGISTERED",
        "This person already has an active registration for this workshop."
      );
    }
    throw e;
  }
}

export async function cancelRegistration(input: {
  registrationId: string;
  actorId: string;
  reason?: string;
}) {
  // Conditional update: only one concurrent cancel can win
  const result = await prisma.registration.updateMany({
    where: { id: input.registrationId, status: "ACTIVE" },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledById: input.actorId,
      cancelReason: input.reason?.trim() || null,
    },
  });

  if (result.count === 0) {
    const exists = await prisma.registration.findUnique({
      where: { id: input.registrationId },
      select: { id: true },
    });
    throw exists
      ? new ApiError(409, "ALREADY_CANCELLED", "Registration is already cancelled.")
      : new ApiError(404, "REGISTRATION_NOT_FOUND", "Registration not found.");
  }

  return prisma.registration.findUniqueOrThrow({
    where: { id: input.registrationId },
  });
}
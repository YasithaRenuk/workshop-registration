-- CreateEnum
CREATE TYPE "WorkshopStatus" AS ENUM ('DRAFT', 'OPEN', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "workshop" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "capacity" INTEGER NOT NULL,
    "status" "WorkshopStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "attendeeName" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "registeredById" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,

    CONSTRAINT "registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshop_code_key" ON "workshop"("code");

-- CreateIndex
CREATE INDEX "workshop_startsAt_idx" ON "workshop"("startsAt");

-- CreateIndex
CREATE INDEX "workshop_status_idx" ON "workshop"("status");

-- CreateIndex
CREATE INDEX "registration_workshopId_status_idx" ON "registration"("workshopId", "status");

-- AddForeignKey
ALTER TABLE "workshop" ADD CONSTRAINT "workshop_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Capacity must be a positive number
ALTER TABLE "workshop"
  ADD CONSTRAINT "workshop_capacity_positive" CHECK ("capacity" > 0);

-- The same attendee can't hold two ACTIVE seats in one workshop
-- (a cancelled one doesn't count, so they can re-register later)
CREATE UNIQUE INDEX "registration_one_active_per_email"
  ON "registration" ("workshopId", "attendeeEmail")
  WHERE "status" = 'ACTIVE';

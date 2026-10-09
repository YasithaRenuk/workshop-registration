import { z } from "zod";

export const WORKSHOP_STATUSES = ["DRAFT", "OPEN", "CANCELLED", "COMPLETED"] as const;

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const workshopListQuery = z.object({
  from: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  to: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  status: z.preprocess(
    (v) => (typeof v === "string" && v ? v.split(",") : undefined),
    z.array(z.enum(WORKSHOP_STATUSES)).optional()
  ),
  hasSeats: z
    .preprocess(emptyToUndefined, z.enum(["true", "false"]).optional())
    .transform((v) => v === "true"),
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type WorkshopListQuery = z.infer<typeof workshopListQuery>;


const base = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only")
    .transform((s) => s.toUpperCase()),
  title: z.string().trim().min(1).max(120),
  instructor: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  location: z.string().trim().min(1).max(120),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(1000),
});

const endAfterStart = {
  message: "End must be after start",
  path: ["endsAt"],
};

export const createWorkshopSchema = base
  .extend({ status: z.enum(["DRAFT", "OPEN"]).default("OPEN") })
  .refine((d) => !d.endsAt || d.endsAt > d.startsAt, endAfterStart);

export const updateWorkshopSchema = base
  .partial()
  .extend({ status: z.enum(WORKSHOP_STATUSES).optional() })
  .refine((d) => !d.startsAt || !d.endsAt || d.endsAt > d.startsAt, endAfterStart);

export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;
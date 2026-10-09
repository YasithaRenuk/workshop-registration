import { notFound, redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { WorkshopForm } from "@/components/workshop-form";
import { ApiError } from "@/lib/errors";
import { requirePage } from "@/lib/session";
import { getWorkshop } from "@/lib/workshops";

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePage("workshop:write");
  const { id } = await params;

  let w;
  try {
    w = await getWorkshop(id, session.user.role as Role);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (w.status === "CANCELLED" || w.status === "COMPLETED") redirect(`/workshops/${id}`);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Edit {w.code}</h1>
      <p className="text-sm text-muted-foreground">
        {w.activeCount} active registration(s). Capacity can't go below that number.
      </p>
      <WorkshopForm
        initial={{
          id: w.id,
          code: w.code,
          title: w.title,
          instructor: w.instructor,
          description: w.description,
          location: w.location,
          startsAt: w.startsAt,
          endsAt: w.endsAt,
          capacity: w.capacity,
          status: w.status,
        }}
      />
    </div>
  );
}
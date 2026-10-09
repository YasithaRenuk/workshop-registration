export const instant = false;

import { WorkshopForm } from "@/components/workshop-form";
import { requirePage } from "@/lib/session";

export default async function NewWorkshopPage() {
  await requirePage("workshop:write");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">New workshop</h1>
      <WorkshopForm />
    </div>
  );
}
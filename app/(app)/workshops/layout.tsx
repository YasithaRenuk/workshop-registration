import { requirePage } from "@/lib/session";

export default async function WorkshopsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePage("workshop:read");
  return <>{children}</>;
}
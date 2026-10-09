import { requirePage } from "@/lib/session";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePage("user:manage");
  return <>{children}</>;
}
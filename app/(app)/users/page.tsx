import { UsersManager } from "@/components/users-manager";
import { requirePage } from "@/lib/session";
import { listUsers } from "@/lib/users";

export default async function UsersPage() {
  const session = await requirePage("user:manage");
  const users = await listUsers();
  return <UsersManager users={users} currentUserId={session.user.id} />;
}
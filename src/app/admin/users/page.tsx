import { AdminUsersPage } from "@/components/coaching/admin-pages";
import { getAdminUsers } from "@/services/admin-service";

export default async function Page() {
  const users = await getAdminUsers();

  return <AdminUsersPage users={users} />;
}

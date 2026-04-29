import type { Metadata } from "next";
import { AdminDashboard } from "@/components/coaching/admin-pages";
import { getAdminDashboardData } from "@/services/admin-service";

export const metadata: Metadata = {
  title: "Admin | Coaching Platform",
  description: "Espace admin Coaching Platform.",
};

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return <AdminDashboard data={data} />;
}

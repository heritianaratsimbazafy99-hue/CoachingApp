import type { Metadata } from "next";
import { AdminDashboard } from "@/components/coaching/admin-pages";

export const metadata: Metadata = {
  title: "Admin | Coaching Platform",
  description: "Espace admin Coaching Platform.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}

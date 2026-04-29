import type { Metadata } from "next";
import { PlaceholderDashboard } from "@/components/dashboard/placeholder-dashboard";

export const metadata: Metadata = {
  title: "Admin | Coaching Platform",
  description: "Espace admin Coaching Platform.",
};

export default function AdminPage() {
  return (
    <PlaceholderDashboard
      description="Cet espace accueillera la gestion des coachs, des coachés, des contenus et des paramètres de la plateforme."
      title="Espace admin"
    />
  );
}

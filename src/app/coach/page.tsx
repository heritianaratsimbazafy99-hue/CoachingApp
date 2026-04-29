import type { Metadata } from "next";
import { PlaceholderDashboard } from "@/components/dashboard/placeholder-dashboard";

export const metadata: Metadata = {
  title: "Coach | Coaching Platform",
  description: "Espace coach Coaching Platform.",
};

export default function CoachPage() {
  return (
    <PlaceholderDashboard
      description="Cet espace regroupera les coachés, les rendez-vous, les corrections et les actions de suivi prioritaires."
      title="Espace coach"
    />
  );
}

import type { Metadata } from "next";
import { PlaceholderDashboard } from "@/components/dashboard/placeholder-dashboard";

export const metadata: Metadata = {
  title: "Coaché | Coaching Platform",
  description: "Espace coaché Coaching Platform.",
};

export default function CoacheePage() {
  return (
    <PlaceholderDashboard
      description="Cet espace affichera les contenus assignés, les quiz, les deadlines et les prochains rendez-vous de coaching."
      title="Espace coaché"
    />
  );
}

import type { Metadata } from "next";
import { CoacheeDashboard } from "@/components/coaching/coachee-dashboard";

export const metadata: Metadata = {
  title: "Coaché | Coaching Platform",
  description: "Espace coaché Coaching Platform.",
};

export default function CoacheePage() {
  return <CoacheeDashboard />;
}

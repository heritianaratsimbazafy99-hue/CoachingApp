import type { Metadata } from "next";
import { CoachDashboard } from "@/components/coaching/coach-dashboard";

export const metadata: Metadata = {
  title: "Coach | Coaching Platform",
  description: "Espace coach Coaching Platform.",
};

export default function CoachPage() {
  return <CoachDashboard />;
}

import type { Metadata } from "next";
import { CoachDashboard } from "@/components/coaching/coach-dashboard";
import { getCoachDashboardData } from "@/services/coach-service";

export const metadata: Metadata = {
  title: "Coach | Coaching Platform",
  description: "Espace coach Coaching Platform.",
};

export default async function CoachPage() {
  const data = await getCoachDashboardData();

  return <CoachDashboard data={data} />;
}

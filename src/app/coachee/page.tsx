import type { Metadata } from "next";
import { CoacheeDashboard } from "@/components/coaching/coachee-dashboard";
import { getCoacheeDashboardData } from "@/services/coachee-service";

export const metadata: Metadata = {
  title: "Coaché | Coaching Platform",
  description: "Espace coaché Coaching Platform.",
};

export default async function CoacheePage() {
  const data = await getCoacheeDashboardData();

  return <CoacheeDashboard data={data} />;
}

import type { Metadata } from "next";
import { CoachNotificationsPage } from "@/components/coaching/coach-notifications-page";
import { getCoachNotificationsData } from "@/services/coach-service";

export const metadata: Metadata = {
  title: "Notifications coach | Coaching Platform",
  description: "Centre de notifications coach Coaching Platform.",
};

export default async function Page() {
  const data = await getCoachNotificationsData();

  return <CoachNotificationsPage data={data} />;
}

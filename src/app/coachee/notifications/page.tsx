import type { Metadata } from "next";
import { CoacheeNotificationsPage } from "@/components/coaching/coachee-notifications-page";
import { getCoacheeNotificationsData } from "@/services/coachee-service";

export const metadata: Metadata = {
  title: "Notifications coaché | Coaching Platform",
  description: "Centre de notifications coaché Coaching Platform.",
};

export default async function Page() {
  const data = await getCoacheeNotificationsData();

  return <CoacheeNotificationsPage data={data} />;
}

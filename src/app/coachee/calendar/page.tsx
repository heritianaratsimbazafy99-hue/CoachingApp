import { CalendarPage } from "@/components/coaching/communication-pages";
import { getCoacheeCalendarData } from "@/services/calendar-service";

export default async function Page() {
  const data = await getCoacheeCalendarData();

  return <CalendarPage data={data} />;
}

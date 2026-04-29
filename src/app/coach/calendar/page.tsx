import { CalendarPage } from "@/components/coaching/communication-pages";
import { getCoachCalendarData } from "@/services/calendar-service";

type CalendarSearchParams = Promise<{
  status?: string | string[];
  target?: string | string[];
  type?: string | string[];
}>;

export default async function Page({
  searchParams,
}: {
  searchParams: CalendarSearchParams;
}) {
  const data = await getCoachCalendarData(await searchParams);

  return <CalendarPage data={data} />;
}

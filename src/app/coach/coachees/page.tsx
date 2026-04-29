import { CoacheesPage } from "@/components/coaching/coachee-pages";
import { getCoachCoacheesData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachCoacheesData();

  return <CoacheesPage data={data} />;
}

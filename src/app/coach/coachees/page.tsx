import { CoacheesPage } from "@/components/coaching/coachee-pages";
import { getCoachCoachees } from "@/services/coach-service";

export default async function Page() {
  const coachees = await getCoachCoachees();

  return <CoacheesPage coachees={coachees} />;
}

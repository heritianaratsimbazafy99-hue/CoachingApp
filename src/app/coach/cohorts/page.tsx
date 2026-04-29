import { CohortsPage } from "@/components/coaching/cohort-pages";
import { getCoachCohorts } from "@/services/coach-service";

export default async function Page() {
  const cohorts = await getCoachCohorts();

  return <CohortsPage cohorts={cohorts} />;
}

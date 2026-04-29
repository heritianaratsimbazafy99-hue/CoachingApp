import { CorrectionsPage } from "@/components/coaching/quiz-pages";
import { getCoachCorrectionsData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachCorrectionsData();

  return <CorrectionsPage data={data} />;
}

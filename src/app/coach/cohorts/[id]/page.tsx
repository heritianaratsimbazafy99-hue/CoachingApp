import { notFound } from "next/navigation";
import { CohortDetailPage } from "@/components/coaching/cohort-pages";
import { getCoachCohortDetail } from "@/services/coach-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const cohort = await getCoachCohortDetail(id);

  if (!cohort) {
    notFound();
  }

  return <CohortDetailPage cohort={cohort} />;
}

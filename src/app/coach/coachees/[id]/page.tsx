import { notFound } from "next/navigation";
import { CoacheeProfilePage } from "@/components/coaching/coachee-pages";
import { getCoachCoacheeDetail } from "@/services/coach-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await getCoachCoacheeDetail(id);

  if (!data) {
    notFound();
  }

  return <CoacheeProfilePage data={data} />;
}

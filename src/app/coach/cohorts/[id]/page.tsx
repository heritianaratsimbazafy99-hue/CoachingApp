import { CohortDetailPage } from "@/components/coaching/cohort-pages";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <CohortDetailPage id={id} />;
}

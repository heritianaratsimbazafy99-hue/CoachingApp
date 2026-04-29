import { CoacheeProfilePage } from "@/components/coaching/coachee-pages";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <CoacheeProfilePage id={id} />;
}

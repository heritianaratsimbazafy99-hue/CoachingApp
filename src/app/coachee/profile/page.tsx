import { CoacheeProfilePage } from "@/components/coaching/coachee-learning-pages";
import { getCoacheeProfileData } from "@/services/profile-service";

export default async function Page() {
  const data = await getCoacheeProfileData();

  return <CoacheeProfilePage data={data} />;
}

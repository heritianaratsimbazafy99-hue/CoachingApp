import { SettingsPage } from "@/components/coaching/communication-pages";
import { getCoachSettingsData } from "@/services/profile-service";

export default async function Page() {
  const data = await getCoachSettingsData();

  return <SettingsPage data={data} />;
}

import { ContentEditorPage } from "@/components/coaching/library-pages";
import { getCoachContentEditorData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachContentEditorData();

  return <ContentEditorPage data={data} />;
}

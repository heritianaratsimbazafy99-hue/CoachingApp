import { LibraryPage } from "@/components/coaching/library-pages";
import { getCoachLibraryData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachLibraryData();

  return <LibraryPage data={data} />;
}

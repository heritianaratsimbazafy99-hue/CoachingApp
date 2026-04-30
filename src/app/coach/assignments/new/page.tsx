import { AssignmentComposerPage } from "@/components/coaching/assignment-pages";
import { getCoachAssignmentComposerData } from "@/services/coach-service";

type AssignmentComposerSearchParams = Promise<{
  target?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: AssignmentComposerSearchParams;
}) {
  const query = await searchParams;
  const data = await getCoachAssignmentComposerData();

  return (
    <AssignmentComposerPage
      data={data}
      initialTarget={firstValue(query.target)}
    />
  );
}

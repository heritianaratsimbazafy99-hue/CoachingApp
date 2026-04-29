import { MessagesPage } from "@/components/coaching/communication-pages";
import { getMessagingData } from "@/services/messaging-service";

type PageProps = {
  searchParams: Promise<{ conversation?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: PageProps) {
  const query = await searchParams;
  const data = await getMessagingData({
    selectedUserId: firstParam(query.conversation),
    variant: "coachee",
  });

  return <MessagesPage data={data} />;
}

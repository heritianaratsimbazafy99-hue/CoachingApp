import { cache } from "react";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/coaching";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type ProfileRow = {
  avatar_url: string | null;
  created_at: string;
  full_name: string;
  id: string;
  role: UserRole;
  user_id: string;
};

type CohortRow = {
  coach_id: string;
  id: string;
};

type CohortMemberRow = {
  cohort_id: string;
  id: string;
  user_id: string;
};

type MessageRow = {
  body: string;
  created_at: string;
  id: string;
  read_at: string | null;
  receiver_id: string;
  sender_id: string;
};

export type MessagingVariant = "coach" | "coachee";

export type MessagingParticipant = {
  avatarUrl: string;
  fullName: string;
  href: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  role: UserRole;
  unreadCount: number;
  userId: string;
};

export type MessagingMessage = {
  body: string;
  createdAt: string;
  id: string;
  isOwn: boolean;
  readAt: string | null;
  receiverId: string;
  senderId: string;
};

export type MessagingData = {
  currentUserId: string;
  messages: MessagingMessage[];
  participants: MessagingParticipant[];
  selectedParticipant: MessagingParticipant | null;
  variant: MessagingVariant;
};

type MessagingAccessContext = {
  currentUserId: string;
  partnerIds: string[];
  role: UserRole;
};

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

async function getRows<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as T[];
}

async function fetchVisibleCohorts(supabase: SupabaseServerClient) {
  return getRows<CohortRow>(supabase.from("cohorts").select("id,coach_id"));
}

async function fetchVisibleMembers(
  supabase: SupabaseServerClient,
  cohortIds: string[],
) {
  if (!cohortIds.length) {
    return [];
  }

  return getRows<CohortMemberRow>(
    supabase
      .from("cohort_members")
      .select("id,cohort_id,user_id")
      .in("cohort_id", cohortIds),
  );
}

async function fetchProfilesByUserIds(userIds: string[]) {
  const filteredIds = unique(userIds);

  if (!filteredIds.length) {
    return [];
  }

  return getRows<ProfileRow>(
    createServiceSupabaseClient()
      .from("profiles")
      .select("id,user_id,full_name,role,avatar_url,created_at")
      .in("user_id", filteredIds)
      .order("full_name", { ascending: true }),
  );
}

async function fetchAllMessageableProfiles(currentUserId: string) {
  return getRows<ProfileRow>(
    createServiceSupabaseClient()
      .from("profiles")
      .select("id,user_id,full_name,role,avatar_url,created_at")
      .neq("user_id", currentUserId)
      .order("full_name", { ascending: true }),
  );
}

async function fetchMessages(currentUserId: string) {
  return getRows<MessageRow>(
    createServiceSupabaseClient()
      .from("messages")
      .select("id,sender_id,receiver_id,body,read_at,created_at")
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order("created_at", { ascending: true })
      .limit(500),
  );
}

async function getMessagingAccessContext(): Promise<MessagingAccessContext> {
  const currentUser = await requireRole(["admin", "coach", "coachee"]);
  const supabase = await createServerSupabaseClient();
  const currentUserId = currentUser.user.id;

  if (currentUser.role === "admin") {
    const profiles = await fetchAllMessageableProfiles(currentUserId);

    return {
      currentUserId,
      partnerIds: profiles.map((profile) => profile.user_id),
      role: currentUser.role,
    };
  }

  const cohorts = await fetchVisibleCohorts(supabase);
  const members = await fetchVisibleMembers(
    supabase,
    cohorts.map((cohort) => cohort.id),
  );
  const partnerIds =
    currentUser.role === "coach"
      ? members.map((member) => member.user_id)
      : cohorts.map((cohort) => cohort.coach_id);

  return {
    currentUserId,
    partnerIds: unique(partnerIds).filter((id) => id !== currentUserId),
    role: currentUser.role,
  };
}

export async function canMessageUser(targetUserId: string) {
  const context = await getMessagingAccessContext();

  return (
    targetUserId !== context.currentUserId &&
    (context.role === "admin" || context.partnerIds.includes(targetUserId))
  );
}

export const getMessagingData = cache(
  async ({
    selectedUserId,
    variant,
  }: {
    selectedUserId?: string;
    variant: MessagingVariant;
  }): Promise<MessagingData> => {
    const context = await getMessagingAccessContext();
    const [profiles, messages] = await Promise.all([
      fetchProfilesByUserIds(context.partnerIds),
      fetchMessages(context.currentUserId),
    ]);
    const profileByUserId = new Map(
      profiles.map((profile) => [profile.user_id, profile]),
    );
    const messagesByPartner = new Map<string, MessageRow[]>();

    messages.forEach((message) => {
      const partnerId =
        message.sender_id === context.currentUserId
          ? message.receiver_id
          : message.sender_id;

      if (!context.partnerIds.includes(partnerId)) {
        return;
      }

      const bucket = messagesByPartner.get(partnerId) ?? [];
      bucket.push(message);
      messagesByPartner.set(partnerId, bucket);
    });

    const participants = context.partnerIds
      .map((userId) => {
        const profile = profileByUserId.get(userId);
        const partnerMessages = messagesByPartner.get(userId) ?? [];
        const lastMessage = partnerMessages.at(-1);

        return {
          avatarUrl: profile?.avatar_url ?? "",
          fullName: profile?.full_name ?? "Utilisateur",
          href:
            variant === "coach"
              ? `/coach/messages?conversation=${userId}`
              : `/coachee/messages?conversation=${userId}`,
          lastMessageAt: lastMessage?.created_at ?? null,
          lastMessagePreview: lastMessage?.body ?? "Aucun message pour le moment.",
          role: profile?.role ?? "coachee",
          unreadCount: partnerMessages.filter(
            (message) =>
              message.receiver_id === context.currentUserId && !message.read_at,
          ).length,
          userId,
        };
      })
      .toSorted((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) {
          return a.fullName.localeCompare(b.fullName);
        }

        return (
          new Date(b.lastMessageAt ?? 0).getTime() -
          new Date(a.lastMessageAt ?? 0).getTime()
        );
      });

    const selectedParticipant =
      participants.find((participant) => participant.userId === selectedUserId) ??
      participants[0] ??
      null;
    const selectedMessages = selectedParticipant
      ? messagesByPartner.get(selectedParticipant.userId) ?? []
      : [];

    return {
      currentUserId: context.currentUserId,
      messages: selectedMessages.map((message) => ({
        body: message.body,
        createdAt: message.created_at,
        id: message.id,
        isOwn: message.sender_id === context.currentUserId,
        readAt: message.read_at,
        receiverId: message.receiver_id,
        senderId: message.sender_id,
      })),
      participants,
      selectedParticipant,
      variant,
    };
  },
);

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markConversationReadAction } from "@/app/messages/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function MessageRealtimeBridge({
  currentUserId,
  selectedParticipantId,
}: {
  currentUserId: string;
  selectedParticipantId: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!selectedParticipantId) {
      return;
    }

    void markConversationReadAction(selectedParticipantId).then(() => {
      router.refresh();
    });
  }, [router, selectedParticipantId]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`messages:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `receiver_id=eq.${currentUserId}`,
          schema: "public",
          table: "messages",
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `sender_id=eq.${currentUserId}`,
          schema: "public",
          table: "messages",
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `receiver_id=eq.${currentUserId}`,
          schema: "public",
          table: "messages",
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, router]);

  return null;
}

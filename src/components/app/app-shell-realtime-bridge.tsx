"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/coaching";

const REFRESH_DEBOUNCE_MS = 700;
const FOCUS_REFRESH_INTERVAL_MS = 15000;

export function AppShellRealtimeBridge({
  role,
  userId,
}: {
  role: UserRole;
  userId?: string;
}) {
  const router = useRouter();
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    if (!userId || role === "admin") {
      return;
    }

    function scheduleRefresh() {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        lastRefreshAtRef.current = Date.now();
        router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    }

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`app-shell-signals:${role}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `receiver_id=eq.${userId}`,
          schema: "public",
          table: "messages",
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `receiver_id=eq.${userId}`,
          schema: "public",
          table: "messages",
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `sender_id=eq.${userId}`,
          schema: "public",
          table: "messages",
        },
        scheduleRefresh,
      );

    if (role === "coachee") {
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            filter: `user_id=eq.${userId}`,
            schema: "public",
            table: "assignment_progress",
          },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            filter: `user_id=eq.${userId}`,
            schema: "public",
            table: "content_progress",
          },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            filter: `user_id=eq.${userId}`,
            schema: "public",
            table: "quiz_attempts",
          },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            filter: `user_id=eq.${userId}`,
            schema: "public",
            table: "activity_logs",
          },
          scheduleRefresh,
        );
    }

    if (role === "coach") {
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "assignment_progress",
          },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "content_progress",
          },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "quiz_attempts",
          },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_logs",
          },
          scheduleRefresh,
        );
    }

    channel.subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [role, router, userId]);

  useEffect(() => {
    if (!userId || role === "admin") {
      return;
    }

    function refreshWhenBack() {
      if (document.visibilityState === "hidden") {
        return;
      }

      const now = Date.now();

      if (now - lastRefreshAtRef.current < FOCUS_REFRESH_INTERVAL_MS) {
        return;
      }

      lastRefreshAtRef.current = now;
      router.refresh();
    }

    window.addEventListener("focus", refreshWhenBack);
    document.addEventListener("visibilitychange", refreshWhenBack);

    return () => {
      window.removeEventListener("focus", refreshWhenBack);
      document.removeEventListener("visibilitychange", refreshWhenBack);
    };
  }, [role, router, userId]);

  return null;
}

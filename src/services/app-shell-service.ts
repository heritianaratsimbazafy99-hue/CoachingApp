import { cache } from "react";
import {
  getCoachLearningPathData,
  getCoacheeLearningPathData,
} from "@/services/learning-path-service";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppShellAlert, AppShellSignals } from "@/types/coaching";

type CountQuery = PromiseLike<{
  count: number | null;
  error: { message: string } | null;
}>;

export const emptyAppShellSignals: AppShellSignals = {
  alerts: [],
  navBadges: {},
  notificationCount: 0,
};

async function safeCount(query: CountQuery) {
  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count ?? 0;
}

function totalAlertCount(alerts: AppShellAlert[]) {
  return alerts.reduce((total, alert) => total + alert.count, 0);
}

function activeAlerts(alerts: AppShellAlert[]) {
  return alerts.filter((alert) => alert.count > 0);
}

export const getCoachShellSignals = cache(
  async (userId: string): Promise<AppShellSignals> => {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createServiceSupabaseClient();
    const [
      blockedPathData,
      lateAssignmentsCount,
      pendingCorrectionsCount,
      unreadMessagesCount,
    ] = await Promise.all([
      getCoachLearningPathData(),
      safeCount(
        supabase
          .from("assignment_progress")
          .select("id", { count: "exact", head: true })
          .or("status.eq.late,is_late.eq.true"),
      ),
      safeCount(
        supabase
          .from("quiz_attempts")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_correction"),
      ),
      safeCount(
        adminSupabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", userId)
          .is("read_at", null),
      ),
    ]);
    const blockedLearningPathsCount =
      blockedPathData.metrics.blockedLearnersCount;
    const alerts = activeAlerts([
      {
        count: unreadMessagesCount,
        href: "/coach/messages",
        label: "Messages",
        title: "Messages non lus",
        tone: "sky",
      },
      {
        count: pendingCorrectionsCount,
        href: "/coach/corrections",
        label: "Corrections",
        title: "Corrections en attente",
        tone: "indigo",
      },
      {
        count: blockedLearningPathsCount,
        href: "/coach/paths",
        label: "Parcours",
        title: "Coachés bloqués",
        tone: "rose",
      },
      {
        count: lateAssignmentsCount,
        href: "/coach/assignments",
        label: "Retards",
        title: "Assignations en retard",
        tone: "amber",
      },
    ]);
    const notificationCount = totalAlertCount(alerts);

    return {
      alerts,
      navBadges: {
        "/coach/assignments": lateAssignmentsCount,
        "/coach/corrections": pendingCorrectionsCount,
        "/coach/messages": unreadMessagesCount,
        "/coach/notifications": notificationCount,
        "/coach/paths": blockedLearningPathsCount,
      },
      notificationCount,
    };
  },
);

export const getCoacheeShellSignals = cache(
  async (userId: string): Promise<AppShellSignals> => {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createServiceSupabaseClient();
    const [learningPathData, openTasksCount, pendingResultsCount, unreadMessagesCount] =
      await Promise.all([
        getCoacheeLearningPathData(),
        safeCount(
          supabase
            .from("assignments")
            .select("id", { count: "exact", head: true })
            .in("status", ["assigned", "in_progress", "late"]),
        ),
        safeCount(
          supabase
            .from("quiz_attempts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "pending_correction"),
        ),
        safeCount(
          adminSupabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("receiver_id", userId)
            .is("read_at", null),
        ),
      ]);
    const activePathsCount = learningPathData.paths.filter(
      (path) => (path.progress?.percentage ?? 0) < 100,
    ).length;
    const alerts = activeAlerts([
      {
        count: unreadMessagesCount,
        href: "/coachee/messages",
        label: "Messages",
        title: "Messages non lus",
        tone: "sky",
      },
      {
        count: openTasksCount,
        href: "/coachee/tasks",
        label: "Tâches",
        title: "Tâches à traiter",
        tone: "amber",
      },
      {
        count: activePathsCount,
        href: "/coachee/paths",
        label: "Parcours",
        title: "Parcours à poursuivre",
        tone: "indigo",
      },
      {
        count: pendingResultsCount,
        href: "/coachee/results",
        label: "Résultats",
        title: "Résultats en correction",
        tone: "rose",
      },
    ]);
    const notificationCount = totalAlertCount(alerts);

    return {
      alerts,
      navBadges: {
        "/coachee/messages": unreadMessagesCount,
        "/coachee/notifications": notificationCount,
        "/coachee/paths": activePathsCount,
        "/coachee/results": pendingResultsCount,
        "/coachee/tasks": openTasksCount,
      },
      notificationCount,
    };
  },
);

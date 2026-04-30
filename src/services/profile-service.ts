import { cache } from "react";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/coaching";
import {
  getNotificationPreferenceCategories,
  parseNotificationPreferenceMap,
  type NotificationPreferenceMap,
  type NotificationRole,
} from "@/utils/notification-preferences";
import {
  parseReminderTemplateTitle,
  type ReminderTemplateUsage,
} from "@/utils/reminders";

type ProfileRow = {
  avatar_url: string | null;
  created_at: string;
  full_name: string;
  id: string;
  notification_preferences?: unknown;
  role: UserRole;
  user_id: string;
};

type ReminderTemplateRow = {
  body: string;
  created_at: string;
  id: string;
  title: string;
};

type CoacheeGoalRow = {
  created_at: string;
  due_date: string | null;
  id: string;
  status: string;
  title: string;
};

export type AccountProfile = {
  avatarUrl: string;
  createdAt: string;
  email: string;
  fullName: string;
  notificationPreferences: NotificationPreferenceMap;
  role: UserRole;
  userId: string;
};

export type ReminderTemplate = {
  body: string;
  createdAt: string;
  id: string;
  title: string;
  usage: ReminderTemplateUsage;
};

export type CoacheeGoal = {
  createdAt: string;
  dueDate: string | null;
  id: string;
  status: string;
  title: string;
};

export type CoachSettingsData = {
  profile: AccountProfile;
  reminderTemplates: ReminderTemplate[];
};

export type CoacheeProfileData = {
  goals: CoacheeGoal[];
  metrics: {
    activeGoalsCount: number;
    completedGoalsCount: number;
    goalsCount: number;
  };
  profile: AccountProfile;
};

function isMissingNotificationPreferencesColumn(error: {
  code?: string;
  message?: string;
} | null) {
  return Boolean(
    error?.code === "PGRST204" ||
      error?.message?.includes("notification_preferences"),
  );
}

async function getProfileRow(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,user_id,full_name,role,avatar_url,notification_preferences,created_at",
    )
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  if (error && isMissingNotificationPreferencesColumn(error)) {
    const fallback = await supabase
      .from("profiles")
      .select("id,user_id,full_name,role,avatar_url,created_at")
      .eq("user_id", userId)
      .maybeSingle<ProfileRow>();

    if (fallback.error) {
      throw new Error(fallback.error.message);
    }

    return fallback.data;
  }

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function mapAccountProfile({
  email,
  fallbackName,
  fallbackRole,
  profile,
  userId,
}: {
  email: string;
  fallbackName: string;
  fallbackRole: UserRole;
  profile: ProfileRow | null;
  userId: string;
}): AccountProfile {
  return {
    avatarUrl: profile?.avatar_url ?? "",
    createdAt: profile?.created_at ?? new Date(0).toISOString(),
    email,
    fullName: profile?.full_name ?? fallbackName,
    notificationPreferences: parseNotificationPreferenceMap(
      profile?.notification_preferences,
    ),
    role: profile?.role ?? fallbackRole,
    userId,
  };
}

export async function getUserNotificationPreferenceCategories({
  role,
  userId,
}: {
  role: NotificationRole;
  userId: string;
}) {
  const profile = await getProfileRow(userId);

  return getNotificationPreferenceCategories(
    parseNotificationPreferenceMap(profile?.notification_preferences),
    role,
  );
}

export const getCoachSettingsData = cache(
  async (): Promise<CoachSettingsData> => {
    const currentUser = await requireRole(["admin", "coach"]);
    const supabase = await createServerSupabaseClient();
    const [profile, templatesResponse] = await Promise.all([
      getProfileRow(currentUser.user.id),
      supabase
        .from("reminder_templates")
        .select("id,title,body,created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (templatesResponse.error) {
      throw new Error(templatesResponse.error.message);
    }

    return {
      profile: mapAccountProfile({
        email: currentUser.user.email ?? "Email non disponible",
        fallbackName: currentUser.user.email ?? "Coach",
        fallbackRole: currentUser.role,
        profile,
        userId: currentUser.user.id,
      }),
      reminderTemplates: ((templatesResponse.data ?? []) as ReminderTemplateRow[]).map(
        (template) => {
          const parsedTitle = parseReminderTemplateTitle(template.title);

          return {
            body: template.body,
            createdAt: template.created_at,
            id: template.id,
            title: parsedTitle.title,
            usage: parsedTitle.usage,
          };
        },
      ),
    };
  },
);

export const getCoacheeProfileData = cache(
  async (): Promise<CoacheeProfileData> => {
    const currentUser = await requireRole(["admin", "coachee"]);
    const supabase = await createServerSupabaseClient();
    const [profile, goalsResponse] = await Promise.all([
      getProfileRow(currentUser.user.id),
      supabase
        .from("coachee_goals")
        .select("id,title,status,due_date,created_at")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
    ]);

    if (goalsResponse.error) {
      throw new Error(goalsResponse.error.message);
    }

    const goals = ((goalsResponse.data ?? []) as CoacheeGoalRow[]).map((goal) => ({
      createdAt: goal.created_at,
      dueDate: goal.due_date,
      id: goal.id,
      status: goal.status,
      title: goal.title,
    }));

    return {
      goals,
      metrics: {
        activeGoalsCount: goals.filter((goal) => goal.status === "active").length,
        completedGoalsCount: goals.filter(
          (goal) => goal.status === "completed",
        ).length,
        goalsCount: goals.length,
      },
      profile: mapAccountProfile({
        email: currentUser.user.email ?? "Email non disponible",
        fallbackName: currentUser.profile?.full_name ?? "Coaché",
        fallbackRole: currentUser.role,
        profile,
        userId: currentUser.user.id,
      }),
    };
  },
);

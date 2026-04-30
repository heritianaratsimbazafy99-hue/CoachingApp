import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth/session";
import { normalizeRole, type UserRole } from "@/lib/auth/roles";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AssignmentStatus, QuizAttemptStatus } from "@/types/coaching";

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
  created_at: string;
  description: string | null;
  end_date: string | null;
  id: string;
  name: string;
  start_date: string | null;
};

type CohortMemberRow = {
  cohort_id: string;
  user_id: string;
};

type AssignmentRow = {
  assigned_to_cohort_id: string | null;
  id: string;
  status: AssignmentStatus;
};

type AssignmentProgressRow = {
  assignment_id: string;
  status: AssignmentStatus;
};

type QuizAttemptRow = {
  percentage: number;
  status: QuizAttemptStatus;
};

export type AdminUser = {
  avatarUrl: string | null;
  bannedUntil: string | null;
  confirmationSentAt: string | null;
  createdAt: string;
  email: string;
  emailConfirmedAt: string | null;
  fullName: string;
  id: string;
  invitedAt: string | null;
  lastSignInAt: string | null;
  profileId: string | null;
  recoverySentAt: string | null;
  role: UserRole;
};

export type AdminCohort = {
  assignmentCount: number;
  coachId: string;
  coachName: string;
  description: string;
  endDate: string | null;
  id: string;
  memberCount: number;
  members: AdminCohortMember[];
  name: string;
  progress: number;
  startDate: string | null;
};

export type AdminCohortMember = {
  email: string;
  fullName: string;
  id: string;
};

export type AdminMetrics = {
  adminsCount: number;
  assignmentsCount: number;
  coachesCount: number;
  coacheesCount: number;
  cohortsCount: number;
  completionRate: number;
  contentsCount: number;
  lateAssignmentsCount: number;
  pendingCorrectionsCount: number;
  quizzesCount: number;
  quizScoreAverage: number;
  usersCount: number;
};

export type AdminDashboardData = {
  cohorts: AdminCohort[];
  metrics: AdminMetrics;
  users: AdminUser[];
};

export type AdminCoacheeCohortAssignment = {
  coachId: string;
  coachName: string;
  id: string;
  isCoachActive: boolean;
  name: string;
};

export type AdminCoacheeAssignment = {
  cohorts: AdminCoacheeCohortAssignment[];
  createdAt: string;
  email: string;
  fullName: string;
  hasActiveCoach: boolean;
  hasCohort: boolean;
  id: string;
  isDisabled: boolean;
  lastSignInAt: string | null;
};

export type AdminCoacheeAssignmentsData = {
  coachees: AdminCoacheeAssignment[];
  cohorts: AdminCohort[];
  coaches: AdminUser[];
  metrics: {
    disabledCount: number;
    totalCoachees: number;
    withoutActiveCoachCount: number;
    withoutCohortCount: number;
  };
};

function isUserDisabled(user?: Pick<AdminUser, "bannedUntil"> | null) {
  if (!user?.bannedUntil) {
    return false;
  }

  return new Date(user.bannedUntil).getTime() > Date.now();
}

function getProfileRole(profileRole: unknown, user?: User): UserRole {
  return (
    normalizeRole(profileRole) ??
    normalizeRole(user?.app_metadata?.role) ??
    normalizeRole(user?.user_metadata?.role) ??
    "coachee"
  );
}

function getUserDisplayName(profile: ProfileRow | undefined, user?: User) {
  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";

  return profile?.full_name || metadataName || user?.email || "Utilisateur";
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

async function getAuthUsersSafely() {
  try {
    const adminSupabase = createServiceSupabaseClient();
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("Supabase Auth Admin listUsers failed:", error.message);
      return [];
    }

    return data.users;
  } catch (error) {
    console.error("Supabase Auth Admin unavailable:", error);
    return [];
  }
}

export const getAdminUsers = cache(async (): Promise<AdminUser[]> => {
  await requireRole("admin");

  const supabase = await createServerSupabaseClient();

  const [profilesResponse, authUsers] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,user_id,full_name,role,avatar_url,created_at")
      .order("created_at", { ascending: false }),
    getAuthUsersSafely(),
  ]);

  if (profilesResponse.error) {
    throw profilesResponse.error;
  }

  const profiles = (profilesResponse.data ?? []) as ProfileRow[];
  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.user_id, profile]),
  );
  const authUsersById = new Map(authUsers.map((user) => [user.id, user]));
  const userIds = [
    ...new Set([
      ...profiles.map((profile) => profile.user_id),
      ...authUsers.map((user) => user.id),
    ]),
  ];

  return userIds
    .map((userId) => {
      const profile = profilesByUserId.get(userId);
      const user = authUsersById.get(userId);

      return {
        avatarUrl: profile?.avatar_url ?? null,
        bannedUntil: user?.banned_until ?? null,
        confirmationSentAt: user?.confirmation_sent_at ?? null,
        createdAt: profile?.created_at ?? user?.created_at ?? new Date(0).toISOString(),
        email: user?.email ?? "Email non disponible",
        emailConfirmedAt:
          user?.email_confirmed_at ?? user?.confirmed_at ?? null,
        fullName: getUserDisplayName(profile, user),
        id: userId,
        invitedAt: user?.invited_at ?? null,
        lastSignInAt: user?.last_sign_in_at ?? null,
        profileId: profile?.id ?? null,
        recoverySentAt: user?.recovery_sent_at ?? null,
        role: getProfileRole(profile?.role, user),
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "fr"));
});

export const getAdminCoacheeAssignments =
  cache(async (): Promise<AdminCoacheeAssignmentsData> => {
    await requireRole("admin");

    const [users, cohorts] = await Promise.all([
      getAdminUsers(),
      getAdminCohorts(),
    ]);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const coaches = users
      .filter((user) => user.role === "coach" && !isUserDisabled(user))
      .toSorted((a, b) => a.fullName.localeCompare(b.fullName, "fr"));
    const coachees = users
      .filter((user) => user.role === "coachee")
      .map((coachee) => {
        const assignedCohorts = cohorts
          .filter((cohort) =>
            cohort.members.some((member) => member.id === coachee.id),
          )
          .map((cohort) => {
            const coach = usersById.get(cohort.coachId);

            return {
              coachId: cohort.coachId,
              coachName: cohort.coachName,
              id: cohort.id,
              isCoachActive: !isUserDisabled(coach),
              name: cohort.name,
            };
          })
          .toSorted((a, b) => a.name.localeCompare(b.name, "fr"));
        const hasActiveCoach = assignedCohorts.some(
          (cohort) => cohort.isCoachActive,
        );

        return {
          cohorts: assignedCohorts,
          createdAt: coachee.createdAt,
          email: coachee.email,
          fullName: coachee.fullName,
          hasActiveCoach,
          hasCohort: assignedCohorts.length > 0,
          id: coachee.id,
          isDisabled: isUserDisabled(coachee),
          lastSignInAt: coachee.lastSignInAt,
        };
      })
      .toSorted((a, b) => a.fullName.localeCompare(b.fullName, "fr"));

    return {
      coachees,
      coaches,
      cohorts,
      metrics: {
        disabledCount: coachees.filter((coachee) => coachee.isDisabled)
          .length,
        totalCoachees: coachees.length,
        withoutActiveCoachCount: coachees.filter(
          (coachee) => !coachee.hasActiveCoach,
        ).length,
        withoutCohortCount: coachees.filter((coachee) => !coachee.hasCohort)
          .length,
      },
    };
  });

export const getAdminCohorts = cache(async (): Promise<AdminCohort[]> => {
  await requireRole("admin");

  const supabase = await createServerSupabaseClient();
  const [cohortsResponse, membersResponse, assignmentsResponse, progressResponse] =
    await Promise.all([
      supabase
        .from("cohorts")
        .select("id,name,description,start_date,end_date,coach_id,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("cohort_members").select("cohort_id,user_id"),
      supabase
        .from("assignments")
        .select("id,assigned_to_cohort_id,status")
        .not("assigned_to_cohort_id", "is", null),
      supabase.from("assignment_progress").select("assignment_id,status"),
    ]);

  if (cohortsResponse.error) {
    throw cohortsResponse.error;
  }

  if (membersResponse.error) {
    throw membersResponse.error;
  }

  if (assignmentsResponse.error) {
    throw assignmentsResponse.error;
  }

  if (progressResponse.error) {
    throw progressResponse.error;
  }

  const users = await getAdminUsers();
  const usersById = new Map(users.map((user) => [user.id, user]));
  const membersByCohort = new Map<string, AdminCohortMember[]>();
  const memberCounts = new Map<string, number>();
  const assignmentCounts = new Map<string, number>();
  const assignmentToCohort = new Map<string, string>();
  const progressByCohort = new Map<string, AssignmentProgressRow[]>();

  ((membersResponse.data ?? []) as CohortMemberRow[]).forEach((member) => {
    const user = usersById.get(member.user_id);

    if (user) {
      const cohortMembers = membersByCohort.get(member.cohort_id) ?? [];
      cohortMembers.push({
        email: user.email,
        fullName: user.fullName,
        id: user.id,
      });
      membersByCohort.set(member.cohort_id, cohortMembers);
    }

    memberCounts.set(
      member.cohort_id,
      (memberCounts.get(member.cohort_id) ?? 0) + 1,
    );
  });

  ((assignmentsResponse.data ?? []) as AssignmentRow[]).forEach((assignment) => {
    if (assignment.assigned_to_cohort_id) {
      assignmentToCohort.set(assignment.id, assignment.assigned_to_cohort_id);
      assignmentCounts.set(
        assignment.assigned_to_cohort_id,
        (assignmentCounts.get(assignment.assigned_to_cohort_id) ?? 0) + 1,
      );
    }
  });

  ((progressResponse.data ?? []) as AssignmentProgressRow[]).forEach(
    (progress) => {
      const cohortId = assignmentToCohort.get(progress.assignment_id);

      if (!cohortId) {
        return;
      }

      const cohortProgress = progressByCohort.get(cohortId) ?? [];
      cohortProgress.push(progress);
      progressByCohort.set(cohortId, cohortProgress);
    },
  );

  return ((cohortsResponse.data ?? []) as CohortRow[]).map((cohort) => {
    const progressRows = progressByCohort.get(cohort.id) ?? [];
    const completed = progressRows.filter(
      (progress) => progress.status === "completed",
    ).length;
    const progress = progressRows.length
      ? Math.round((completed / progressRows.length) * 100)
      : 0;

    return {
      assignmentCount: assignmentCounts.get(cohort.id) ?? 0,
      coachId: cohort.coach_id,
      coachName: usersById.get(cohort.coach_id)?.fullName ?? "Coach inconnu",
      description: cohort.description ?? "Aucune description renseignée.",
      endDate: cohort.end_date,
      id: cohort.id,
      memberCount: memberCounts.get(cohort.id) ?? 0,
      members: (membersByCohort.get(cohort.id) ?? []).toSorted((a, b) =>
        a.fullName.localeCompare(b.fullName, "fr"),
      ),
      name: cohort.name,
      progress,
      startDate: cohort.start_date,
    };
  });
});

export const getAdminMetrics = cache(async (): Promise<AdminMetrics> => {
  await requireRole("admin");

  const supabase = await createServerSupabaseClient();
  const [users, cohorts, contentsResponse, quizzesResponse, assignmentsResponse, progressResponse, attemptsResponse] =
    await Promise.all([
      getAdminUsers(),
      getAdminCohorts(),
      supabase.from("contents").select("id"),
      supabase.from("quizzes").select("id"),
      supabase.from("assignments").select("id,status"),
      supabase.from("assignment_progress").select("status"),
      supabase.from("quiz_attempts").select("percentage,status"),
    ]);

  if (contentsResponse.error) {
    throw contentsResponse.error;
  }

  if (quizzesResponse.error) {
    throw quizzesResponse.error;
  }

  if (assignmentsResponse.error) {
    throw assignmentsResponse.error;
  }

  if (progressResponse.error) {
    throw progressResponse.error;
  }

  if (attemptsResponse.error) {
    throw attemptsResponse.error;
  }

  const assignments = (assignmentsResponse.data ?? []) as Pick<
    AssignmentRow,
    "id" | "status"
  >[];
  const progressRows = (progressResponse.data ?? []) as Pick<
    AssignmentProgressRow,
    "status"
  >[];
  const attempts = (attemptsResponse.data ?? []) as QuizAttemptRow[];
  const completed = progressRows.filter(
    (progress) => progress.status === "completed",
  ).length;

  return {
    adminsCount: users.filter((user) => user.role === "admin").length,
    assignmentsCount: assignments.length,
    coachesCount: users.filter((user) => user.role === "coach").length,
    coacheesCount: users.filter((user) => user.role === "coachee").length,
    cohortsCount: cohorts.length,
    completionRate: progressRows.length
      ? Math.round((completed / progressRows.length) * 100)
      : 0,
    contentsCount: contentsResponse.data?.length ?? 0,
    lateAssignmentsCount: assignments.filter(
      (assignment) => assignment.status === "late",
    ).length,
    pendingCorrectionsCount: attempts.filter(
      (attempt) => attempt.status === "pending_correction",
    ).length,
    quizzesCount: quizzesResponse.data?.length ?? 0,
    quizScoreAverage: average(
      attempts.map((attempt) => Number(attempt.percentage ?? 0)),
    ),
    usersCount: users.length,
  };
});

export const getAdminDashboardData =
  cache(async (): Promise<AdminDashboardData> => {
    const [users, cohorts, metrics] = await Promise.all([
      getAdminUsers(),
      getAdminCohorts(),
      getAdminMetrics(),
    ]);

    return {
      cohorts,
      metrics,
      users,
    };
  });

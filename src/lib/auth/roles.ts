import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "coach" | "coachee";

export const dashboardByRole: Record<UserRole, string> = {
  admin: "/admin",
  coach: "/coach",
  coachee: "/coachee",
};

export function normalizeRole(role: unknown): UserRole | null {
  if (role === "admin" || role === "coach" || role === "coachee") {
    return role;
  }

  return null;
}

export function getDashboardPath(role: UserRole) {
  return dashboardByRole[role];
}

export function getUserRole(user: User, profileRole?: unknown): UserRole {
  return (
    normalizeRole(user.app_metadata?.role) ??
    normalizeRole(profileRole) ??
    normalizeRole(user.user_metadata?.role) ??
    "coachee"
  );
}

export function getRoleRedirectPath(user: User) {
  return getDashboardPath(getUserRole(user));
}

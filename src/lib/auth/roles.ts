import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "coach" | "coachee";

const dashboardByRole: Record<UserRole, string> = {
  admin: "/admin",
  coach: "/coach",
  coachee: "/coachee",
};

function normalizeRole(role: unknown): UserRole | null {
  if (role === "admin" || role === "coach" || role === "coachee") {
    return role;
  }

  return null;
}

export function getRoleRedirectPath(user: User) {
  const role =
    normalizeRole(user.app_metadata?.role) ??
    normalizeRole(user.user_metadata?.role) ??
    "coachee";

  return dashboardByRole[role];
}

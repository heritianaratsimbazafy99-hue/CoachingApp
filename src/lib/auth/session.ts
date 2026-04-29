import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getDashboardPath, getUserRole, type UserRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthProfile = {
  avatar_url: string | null;
  created_at: string;
  full_name: string;
  id: string;
  role: UserRole;
  user_id: string;
};

export type AuthenticatedUser = {
  profile: AuthProfile | null;
  role: UserRole;
  user: User;
};

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,user_id,full_name,role,avatar_url,created_at")
    .eq("user_id", data.user.id)
    .maybeSingle<AuthProfile>();

  return {
    profile,
    role: getUserRole(data.user, profile?.role),
    user: data.user,
  };
});

export async function requireUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return currentUser;
}

export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  const currentUser = await requireUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(currentUser.role)) {
    redirect(getDashboardPath(currentUser.role));
  }

  return currentUser;
}

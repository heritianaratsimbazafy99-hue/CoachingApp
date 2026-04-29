"use server";

import { revalidatePath } from "next/cache";
import { normalizeRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export type UpdateUserRoleState = {
  message: string;
  status: "error" | "idle" | "success";
};

export const initialUpdateUserRoleState: UpdateUserRoleState = {
  message: "",
  status: "idle",
};

export async function updateUserRoleAction(
  _previousState: UpdateUserRoleState,
  formData: FormData,
): Promise<UpdateUserRoleState> {
  const currentUser = await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  const role = normalizeRole(formData.get("role"));

  if (!userId || !role) {
    return {
      message: "Utilisateur ou rôle invalide.",
      status: "error",
    };
  }

  if (currentUser.user.id === userId && role !== "admin") {
    return {
      message: "Vous ne pouvez pas retirer votre propre rôle admin.",
      status: "error",
    };
  }

  const adminSupabase = createServiceSupabaseClient();
  const { data: userResponse, error: getUserError } =
    await adminSupabase.auth.admin.getUserById(userId);

  if (getUserError || !userResponse.user) {
    return {
      message: getUserError?.message ?? "Utilisateur introuvable.",
      status: "error",
    };
  }

  const { error: authError } = await adminSupabase.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        ...userResponse.user.app_metadata,
        role,
      },
    },
  );

  if (authError) {
    return {
      message: authError.message,
      status: "error",
    };
  }

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);

  if (profileError) {
    return {
      message: profileError.message,
      status: "error",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/coaches");

  return {
    message: "Rôle mis à jour.",
    status: "success",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/coaching";

export type UpdateUserRoleState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type CreateAdminUserState = {
  message: string;
  status: "error" | "idle" | "success";
};

export const initialUpdateUserRoleState: UpdateUserRoleState = {
  message: "",
  status: "idle",
};

export const initialCreateAdminUserState: CreateAdminUserState = {
  message: "",
  status: "idle",
};

const createAdminUserSchema = z.object({
  email: z.string().trim().email("Email invalide."),
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(120, "Le nom est trop long."),
  password: z
    .string()
    .min(8, "Le mot de passe temporaire doit contenir au moins 8 caractères."),
  role: z.enum(["admin", "coach", "coachee"]),
});

function revalidateAdminUserPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/cohorts");
  revalidatePath("/admin/stats");
}

function userCreationErrorMessage(message: string) {
  if (message.toLowerCase().includes("database error creating new user")) {
    return "Supabase bloque la création du profil. Exécutez supabase/fix-auth-user-profile-trigger.sql puis réessayez.";
  }

  return message;
}

export async function createAdminUserAction(
  _previousState: CreateAdminUserState,
  formData: FormData,
): Promise<CreateAdminUserState> {
  const currentUser = await requireRole("admin");
  const parsed = createAdminUserSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs utilisateur sont invalides.",
      status: "error",
    };
  }

  const { email, fullName, password, role } = parsed.data;
  const adminSupabase = createServiceSupabaseClient();
  const { data, error } = await adminSupabase.auth.admin.createUser({
    app_metadata: { role },
    email,
    email_confirm: true,
    password,
    user_metadata: {
      full_name: fullName,
      name: fullName,
    },
  });

  if (error || !data.user) {
    return {
      message: userCreationErrorMessage(
        error?.message ?? "Impossible de créer l'utilisateur.",
      ),
      status: "error",
    };
  }

  const { error: profileError } = await adminSupabase.from("profiles").upsert(
    {
      full_name: fullName,
      notification_preferences: {},
      role,
      user_id: data.user.id,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    return {
      message: profileError.message,
      status: "error",
    };
  }

  await adminSupabase.from("activity_logs").insert({
    action: `Utilisateur créé : ${fullName}`,
    entity_id: data.user.id,
    entity_type: "profile",
    metadata: {
      createdUserEmail: email,
      createdUserRole: role,
    },
    user_id: currentUser.user.id,
  });

  revalidateAdminUserPages();

  return {
    message: `Utilisateur créé avec le rôle ${role}.`,
    status: "success",
  };
}

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
    .update({ role: role as UserRole })
    .eq("user_id", userId);

  if (profileError) {
    return {
      message: profileError.message,
      status: "error",
    };
  }

  revalidateAdminUserPages();

  return {
    message: "Rôle mis à jour.",
    status: "success",
  };
}

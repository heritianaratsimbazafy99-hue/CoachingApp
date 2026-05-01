"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { normalizeRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { recordExternalTransactionalEmail } from "@/services/transactional-email-service";
import type { UserRole } from "@/types/coaching";

export type UpdateUserRoleState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type CreateAdminUserState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type AdminAuthEmailState = {
  message: string;
  status: "error" | "idle" | "success";
};

const createAdminUserBaseSchema = z.object({
  email: z.string().trim().email("Email invalide."),
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(120, "Le nom est trop long."),
  role: z.enum(["admin", "coach", "coachee"]),
});

const createAdminUserSchema = z.discriminatedUnion("creationMode", [
  createAdminUserBaseSchema.extend({
    creationMode: z.literal("invite"),
    password: z.string().optional(),
  }),
  createAdminUserBaseSchema.extend({
    creationMode: z.literal("password"),
    password: z
      .string()
      .min(
        8,
        "Le mot de passe temporaire doit contenir au moins 8 caractères.",
      ),
  }),
]);

const adminUserEmailActionSchema = z.object({
  userId: z.string().uuid("Utilisateur invalide."),
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

function invitationErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("already") || lowerMessage.includes("registered")) {
    return "Supabase ne peut pas renvoyer une invitation à ce compte déjà enregistré. Utilisez plutôt la réinitialisation du mot de passe.";
  }

  return message;
}

function roleUpdateErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("admin_set_user_role") ||
    lowerMessage.includes("could not find the function")
  ) {
    return "La fonction SQL admin_set_user_role est manquante. Exécutez supabase/fix-admin-role-updates.sql puis réessayez.";
  }

  if (
    lowerMessage.includes("modification non autorisée") ||
    lowerMessage.includes("protected profile")
  ) {
    return "Supabase bloque la mise à jour du rôle. Exécutez supabase/fix-admin-role-updates.sql puis réessayez.";
  }

  return message;
}

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  const withProtocol = value.startsWith("http") ? value : `https://${value}`;

  return withProtocol.replace(/\/+$/, "");
}

async function getPasswordSetupRedirectUrl() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");

  if (host) {
    const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
    const protocol =
      forwardedProtocol ??
      (host.startsWith("localhost") || host.startsWith("127.")
        ? "http"
        : "https");

    return new URL("/update-password", `${protocol}://${host}`).toString();
  }

  const configuredBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.VERCEL_URL,
  );

  return configuredBaseUrl
    ? new URL("/update-password", configuredBaseUrl).toString()
    : undefined;
}

type AdminSupabaseClient = ReturnType<typeof createServiceSupabaseClient>;

async function syncUserProfile({
  adminSupabase,
  fullName,
  role,
  userId,
}: {
  adminSupabase: AdminSupabaseClient;
  fullName: string;
  role: UserRole;
  userId: string;
}) {
  const { error } = await adminSupabase.from("profiles").upsert(
    {
      full_name: fullName,
      notification_preferences: {},
      role,
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  return error;
}

async function setAdminUserRole({
  adminSupabase,
  role,
  userId,
}: {
  adminSupabase: AdminSupabaseClient;
  role: UserRole;
  userId: string;
}) {
  const { error } = await adminSupabase.rpc("admin_set_user_role", {
    target_role: role,
    target_user_id: userId,
  });

  return error;
}

async function logAdminUserActivity({
  action,
  adminSupabase,
  currentUserId,
  metadata,
  userId,
}: {
  action: string;
  adminSupabase: AdminSupabaseClient;
  currentUserId: string;
  metadata: Record<string, string>;
  userId: string;
}) {
  await adminSupabase.from("activity_logs").insert({
    action,
    entity_id: userId,
    entity_type: "profile",
    metadata,
    user_id: currentUserId,
  });
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
    creationMode:
      formData.get("creationMode") === "password" ? "password" : "invite",
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

  const { creationMode, email, fullName, role } = parsed.data;
  const adminSupabase = createServiceSupabaseClient();
  const redirectTo = await getPasswordSetupRedirectUrl();
  const userMetadata = {
    full_name: fullName,
    name: fullName,
  };

  const { data, error } =
    creationMode === "invite"
      ? await adminSupabase.auth.admin.inviteUserByEmail(email, {
          data: userMetadata,
          redirectTo,
        })
      : await adminSupabase.auth.admin.createUser({
          app_metadata: { role },
          email,
          email_confirm: true,
          password: parsed.data.password,
          user_metadata: userMetadata,
        });

  if (error || !data.user) {
    return {
      message: userCreationErrorMessage(
        error?.message ?? "Impossible de créer l'utilisateur.",
      ),
      status: "error",
    };
  }

  const roleError = await setAdminUserRole({
    adminSupabase,
    role,
    userId: data.user.id,
  });

  if (roleError) {
    return {
      message: roleUpdateErrorMessage(roleError.message),
      status: "error",
    };
  }

  const profileError = await syncUserProfile(
    {
      adminSupabase,
      fullName,
      role,
      userId: data.user.id,
    },
  );

  if (profileError) {
    return {
      message: roleUpdateErrorMessage(profileError.message),
      status: "error",
    };
  }

  await logAdminUserActivity({
    action:
      creationMode === "invite"
        ? `Invitation utilisateur envoyée : ${fullName}`
        : `Utilisateur créé : ${fullName}`,
    adminSupabase,
    currentUserId: currentUser.user.id,
    metadata: {
      createdUserEmail: email,
      createdUserOnboardingMode: creationMode,
      createdUserRole: role,
    },
    userId: data.user.id,
  });

  if (creationMode === "invite") {
    await recordExternalTransactionalEmail({
      metadata: {
        createdBy: currentUser.user.id,
        role,
      },
      provider: "supabase-auth",
      recipientEmail: email,
      recipientUserId: data.user.id,
      subject: "Invitation CoachingApp",
      type: "invitation",
    });
  }

  revalidateAdminUserPages();

  return {
    message:
      creationMode === "invite"
        ? `Invitation envoyée à ${email}.`
        : `Utilisateur créé avec le rôle ${role}.`,
    status: "success",
  };
}

export async function sendUserInvitationAction(
  _previousState: AdminAuthEmailState,
  formData: FormData,
): Promise<AdminAuthEmailState> {
  const currentUser = await requireRole("admin");
  const parsed = adminUserEmailActionSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Utilisateur invalide.",
      status: "error",
    };
  }

  const adminSupabase = createServiceSupabaseClient();
  const { data, error } = await adminSupabase.auth.admin.getUserById(
    parsed.data.userId,
  );

  if (error || !data.user) {
    return {
      message: error?.message ?? "Utilisateur introuvable.",
      status: "error",
    };
  }

  if (!data.user.email) {
    return {
      message: "Cet utilisateur n'a pas d'email Supabase.",
      status: "error",
    };
  }

  if (data.user.email_confirmed_at) {
    return {
      message:
        "Ce compte est déjà confirmé. Utilisez la réinitialisation du mot de passe si nécessaire.",
      status: "error",
    };
  }

  const redirectTo = await getPasswordSetupRedirectUrl();
  const { error: inviteError } =
    await adminSupabase.auth.admin.inviteUserByEmail(data.user.email, {
      data: data.user.user_metadata,
      redirectTo,
    });

  if (inviteError) {
    return {
      message: invitationErrorMessage(inviteError.message),
      status: "error",
    };
  }

  await logAdminUserActivity({
    action: "Invitation utilisateur renvoyée",
    adminSupabase,
    currentUserId: currentUser.user.id,
    metadata: {
      invitedUserEmail: data.user.email,
    },
    userId: data.user.id,
  });

  await recordExternalTransactionalEmail({
    metadata: {
      invitedBy: currentUser.user.id,
    },
    provider: "supabase-auth",
    recipientEmail: data.user.email,
    recipientUserId: data.user.id,
    subject: "Invitation CoachingApp",
    type: "invitation",
  });

  revalidateAdminUserPages();

  return {
    message: `Invitation renvoyée à ${data.user.email}.`,
    status: "success",
  };
}

export async function sendPasswordResetAction(
  _previousState: AdminAuthEmailState,
  formData: FormData,
): Promise<AdminAuthEmailState> {
  const currentUser = await requireRole("admin");
  const parsed = adminUserEmailActionSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Utilisateur invalide.",
      status: "error",
    };
  }

  const adminSupabase = createServiceSupabaseClient();
  const { data, error } = await adminSupabase.auth.admin.getUserById(
    parsed.data.userId,
  );

  if (error || !data.user) {
    return {
      message: error?.message ?? "Utilisateur introuvable.",
      status: "error",
    };
  }

  if (!data.user.email) {
    return {
      message: "Cet utilisateur n'a pas d'email Supabase.",
      status: "error",
    };
  }

  const redirectTo = await getPasswordSetupRedirectUrl();
  const { error: resetError } = await adminSupabase.auth.resetPasswordForEmail(
    data.user.email,
    { redirectTo },
  );

  if (resetError) {
    return {
      message: resetError.message,
      status: "error",
    };
  }

  await logAdminUserActivity({
    action: "Lien de réinitialisation mot de passe envoyé",
    adminSupabase,
    currentUserId: currentUser.user.id,
    metadata: {
      resetUserEmail: data.user.email,
    },
    userId: data.user.id,
  });

  await recordExternalTransactionalEmail({
    metadata: {
      requestedBy: currentUser.user.id,
    },
    provider: "supabase-auth",
    recipientEmail: data.user.email,
    recipientUserId: data.user.id,
    subject: "Réinitialisation du mot de passe CoachingApp",
    type: "password_reset",
  });

  revalidateAdminUserPages();

  return {
    message: `Lien de réinitialisation envoyé à ${data.user.email}.`,
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

  const roleError = await setAdminUserRole({
    adminSupabase,
    role,
    userId,
  });

  if (roleError) {
    return {
      message: roleUpdateErrorMessage(roleError.message),
      status: "error",
    };
  }

  revalidateAdminUserPages();

  return {
    message: "Rôle mis à jour.",
    status: "success",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const profileSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().url().safeParse(value).success, {
      message: "L'URL de l'avatar est invalide.",
    }),
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom est trop long."),
});

const reminderTemplateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(5, "Le message doit contenir au moins 5 caractères.")
    .max(1200, "Le message est trop long."),
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(120, "Le titre est trop long."),
});

const deleteReminderTemplateSchema = z.object({
  templateId: z.string().trim().regex(uuidPattern, "Template invalide."),
});

export type ProfileActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type ReminderTemplateActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

function nullableText(value: string) {
  return value.trim() ? value.trim() : null;
}

function revalidateProfilePaths() {
  revalidatePath("/coach");
  revalidatePath("/coach/settings");
  revalidatePath("/coachee");
  revalidatePath("/coachee/profile");
}

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const currentUser = await requireRole(["admin", "coach", "coachee"]);
  const parsed = profileSchema.safeParse({
    avatarUrl: formData.get("avatarUrl"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs du profil sont invalides.",
      status: "error",
    };
  }

  const values = parsed.data;
  const supabase = await createServerSupabaseClient();
  const payload = {
    avatar_url: nullableText(values.avatarUrl),
    full_name: values.fullName,
  };
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("user_id", currentUser.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  if (!data) {
    const { error: insertError } = await supabase.from("profiles").insert({
      ...payload,
      role: currentUser.role,
      user_id: currentUser.user.id,
    });

    if (insertError) {
      return {
        message: insertError.message,
        status: "error",
      };
    }
  }

  await supabase.from("activity_logs").insert({
    action: "Profil mis à jour",
    entity_id: currentUser.user.id,
    entity_type: "profile",
    user_id: currentUser.user.id,
  });

  revalidateProfilePaths();

  return {
    message: "Profil enregistré.",
    status: "success",
  };
}

export async function createReminderTemplateAction(
  _previousState: ReminderTemplateActionState,
  formData: FormData,
): Promise<ReminderTemplateActionState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = reminderTemplateSchema.safeParse({
    body: formData.get("body"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs du template sont invalides.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reminder_templates")
    .insert({
      body: parsed.data.body,
      coach_id: currentUser.user.id,
      title: parsed.data.title,
    })
    .select("id")
    .single();

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  await supabase.from("activity_logs").insert({
    action: `Template de relance créé : ${parsed.data.title}`,
    entity_id: data.id,
    entity_type: "reminder_template",
    user_id: currentUser.user.id,
  });

  revalidatePath("/coach/settings");

  return {
    message: "Template créé.",
    status: "success",
  };
}

export async function deleteReminderTemplateAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = deleteReminderTemplateSchema.safeParse({
    templateId: formData.get("templateId"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("reminder_templates")
    .delete()
    .eq("id", parsed.data.templateId);

  if (currentUser.role !== "admin") {
    query = query.eq("coach_id", currentUser.user.id);
  }

  await query;
  revalidatePath("/coach/settings");
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canMessageUser } from "@/services/messaging-service";
import {
  parseReminderTemplateTitle,
  renderReminderTemplateBody,
  type ReminderTemplateUsage,
} from "@/utils/reminders";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const pathSchema = z.object({
  cohortId: z.string().trim().regex(uuidPattern, "Cohorte invalide."),
  description: z.string().trim().max(1200, "La description est trop longue."),
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(140, "Le titre est trop long."),
});

const deletePathSchema = z.object({
  pathId: z.string().trim().regex(uuidPattern, "Parcours invalide."),
});

const reminderSchema = z.object({
  coacheeId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
  pathTitle: z
    .string()
    .trim()
    .min(2, "Parcours invalide.")
    .max(160, "Le titre du parcours est trop long."),
  reason: z
    .string()
    .trim()
    .min(2, "Motif invalide.")
    .max(180, "Le motif est trop long."),
  reminderType: z.enum(["blocked", "correction"]),
});

const updatePathSchema = pathSchema.extend({
  pathId: z.string().trim().regex(uuidPattern, "Parcours invalide."),
});

export type LearningPathActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

type ReminderTemplateRow = {
  body: string;
  id: string;
  title: string;
};

function nullableText(value: string) {
  return value.trim() ? value.trim() : null;
}

function parseItem(value: FormDataEntryValue) {
  const [kind, id] = String(value).split(":");

  if ((kind !== "content" && kind !== "quiz") || !uuidPattern.test(id ?? "")) {
    return null;
  }

  return {
    id,
    kind,
  };
}

function revalidateLearningPathRoutes() {
  revalidatePath("/coach");
  revalidatePath("/coach/paths");
  revalidatePath("/coachee");
  revalidatePath("/coachee/paths");
}

const reminderUsageByType: Record<
  z.infer<typeof reminderSchema>["reminderType"],
  ReminderTemplateUsage
> = {
  blocked: "path_blocked",
  correction: "path_correction",
};

function defaultLearningPathReminderBody({
  pathTitle,
  reason,
  reminderType,
}: z.infer<typeof reminderSchema>) {
  if (reminderType === "correction") {
    return [
      `Bonjour, petit point sur votre parcours "${pathTitle}".`,
      `${reason}. Je reviens vers vous dès que la correction est traitée.`,
      "Vous pouvez continuer les autres étapes disponibles si elles sont ouvertes.",
    ].join("\n\n");
  }

  return [
    `Bonjour, j'ai vu que vous êtes bloqué sur le parcours "${pathTitle}".`,
    `${reason}. Reprenez la prochaine étape quand vous êtes disponible.`,
    "Écrivez-moi ici si quelque chose bloque, je vous aiderai à avancer.",
  ].join("\n\n");
}

async function getLearningPathReminderTemplate({
  currentUserId,
  isAdmin,
  usage,
}: {
  currentUserId: string;
  isAdmin: boolean;
  usage: ReminderTemplateUsage;
}) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("reminder_templates")
    .select("id,title,body")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("coach_id", currentUserId);
  }

  const { data, error } = await query;

  if (error) {
    return null;
  }

  return ((data ?? []) as ReminderTemplateRow[])
    .map((template) => {
      const parsedTitle = parseReminderTemplateTitle(template.title);

      return {
        body: template.body,
        id: template.id,
        title: parsedTitle.title,
        usage: parsedTitle.usage,
      };
    })
    .find((template) => template.usage === usage);
}

function uniqueItems(items: Array<{ id: string; kind: "content" | "quiz" }>) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.kind}:${item.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

function getItemsFromForm(formData: FormData) {
  return uniqueItems(
    formData
      .getAll("items")
      .map(parseItem)
      .filter(Boolean) as Array<{ id: string; kind: "content" | "quiz" }>,
  );
}

function itemRows(pathId: string, items: Array<{ id: string; kind: "content" | "quiz" }>) {
  return items.map((item, index) => ({
    content_id: item.kind === "content" ? item.id : null,
    learning_path_id: pathId,
    position: index + 1,
    quiz_id: item.kind === "quiz" ? item.id : null,
  }));
}

async function getWritablePath(
  pathId: string,
  userId: string,
  isAdmin: boolean,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("learning_paths")
    .select("id,title,description,cohort_id")
    .eq("id", pathId);

  if (!isAdmin) {
    query = query.eq("created_by", userId);
  }

  const { data, error } = await query.maybeSingle<{
    cohort_id: string | null;
    description: string | null;
    id: string;
    title: string;
  }>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getAllowedCohort(
  cohortId: string,
  userId: string,
  isAdmin: boolean,
) {
  const supabase = await createServerSupabaseClient();
  let cohortQuery = supabase.from("cohorts").select("id,name").eq("id", cohortId);

  if (!isAdmin) {
    cohortQuery = cohortQuery.eq("coach_id", userId);
  }

  const { data: cohort, error } = await cohortQuery.maybeSingle<{
    id: string;
    name: string;
  }>();

  if (error) {
    throw new Error(error.message);
  }

  return cohort;
}

async function getAllowedCount(
  table: "contents" | "quizzes",
  ids: string[],
  userId: string,
  isAdmin: boolean,
) {
  if (!ids.length) {
    return 0;
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase.from(table).select("id").in("id", ids);

  if (!isAdmin) {
    query = query.eq("created_by", userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data?.length ?? 0;
}

async function validateItems(
  items: Array<{ id: string; kind: "content" | "quiz" }>,
  userId: string,
  isAdmin: boolean,
) {
  const contentIds = [
    ...new Set(
      items.filter((item) => item.kind === "content").map((item) => item.id),
    ),
  ];
  const quizIds = [
    ...new Set(items.filter((item) => item.kind === "quiz").map((item) => item.id)),
  ];

  const [allowedContents, allowedQuizzes] = await Promise.all([
    getAllowedCount("contents", contentIds, userId, isAdmin),
    getAllowedCount("quizzes", quizIds, userId, isAdmin),
  ]);

  return allowedContents === contentIds.length && allowedQuizzes === quizIds.length;
}

export async function createLearningPathAction(
  _previousState: LearningPathActionState,
  formData: FormData,
): Promise<LearningPathActionState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = pathSchema.safeParse({
    cohortId: formData.get("cohortId"),
    description: formData.get("description"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs du parcours sont invalides.",
      status: "error",
    };
  }

  const items = getItemsFromForm(formData);

  if (!items.length) {
    return {
      message: "Ajoutez au moins un contenu ou un quiz au parcours.",
      status: "error",
    };
  }

  const isAdmin = currentUser.role === "admin";
  const supabase = await createServerSupabaseClient();
  let cohort: { id: string; name: string } | null = null;

  try {
    const [allowedCohort, itemsAreAllowed] = await Promise.all([
      getAllowedCohort(parsed.data.cohortId, currentUser.user.id, isAdmin),
      validateItems(items, currentUser.user.id, isAdmin),
    ]);

    cohort = allowedCohort;

    if (!allowedCohort) {
      return {
        message: "Cohorte introuvable ou non autorisée.",
        status: "error",
      };
    }

    if (!itemsAreAllowed) {
      return {
        message: "Certains éléments du parcours sont introuvables ou non autorisés.",
        status: "error",
      };
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Validation impossible.",
      status: "error",
    };
  }

  const cohortName = cohort?.name ?? "la cohorte";
  const { data: path, error: pathError } = await supabase
    .from("learning_paths")
    .insert({
      cohort_id: parsed.data.cohortId,
      created_by: currentUser.user.id,
      description: nullableText(parsed.data.description),
      title: parsed.data.title,
    })
    .select("id,title")
    .single<{ id: string; title: string }>();

  if (pathError) {
    return { message: pathError.message, status: "error" };
  }

  const { error: itemError } = await supabase.from("learning_path_items").insert(
    itemRows(path.id, items),
  );

  if (itemError) {
    await supabase.from("learning_paths").delete().eq("id", path.id);

    return { message: itemError.message, status: "error" };
  }

  await supabase.from("activity_logs").insert({
    action: `Parcours créé : ${path.title}`,
    entity_id: path.id,
    entity_type: "learning_path",
    user_id: currentUser.user.id,
  });

  revalidateLearningPathRoutes();

  return {
    message: `Parcours créé pour ${cohortName}.`,
    status: "success",
  };
}

export async function updateLearningPathAction(
  _previousState: LearningPathActionState,
  formData: FormData,
): Promise<LearningPathActionState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = updatePathSchema.safeParse({
    cohortId: formData.get("cohortId"),
    description: formData.get("description"),
    pathId: formData.get("pathId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs du parcours sont invalides.",
      status: "error",
    };
  }

  const items = getItemsFromForm(formData);

  if (!items.length) {
    return {
      message: "Ajoutez au moins un contenu ou un quiz au parcours.",
      status: "error",
    };
  }

  const isAdmin = currentUser.role === "admin";
  const supabase = await createServerSupabaseClient();

  try {
    const [path, cohort, itemsAreAllowed] = await Promise.all([
      getWritablePath(parsed.data.pathId, currentUser.user.id, isAdmin),
      getAllowedCohort(parsed.data.cohortId, currentUser.user.id, isAdmin),
      validateItems(items, currentUser.user.id, isAdmin),
    ]);

    if (!path) {
      return {
        message: "Parcours introuvable ou non autorisé.",
        status: "error",
      };
    }

    if (!cohort) {
      return {
        message: "Cohorte introuvable ou non autorisée.",
        status: "error",
      };
    }

    if (!itemsAreAllowed) {
      return {
        message: "Certains éléments du parcours sont introuvables ou non autorisés.",
        status: "error",
      };
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Validation impossible.",
      status: "error",
    };
  }

  const { error: pathError } = await supabase
    .from("learning_paths")
    .update({
      cohort_id: parsed.data.cohortId,
      description: nullableText(parsed.data.description),
      title: parsed.data.title,
    })
    .eq("id", parsed.data.pathId);

  if (pathError) {
    return { message: pathError.message, status: "error" };
  }

  const { error: deleteError } = await supabase
    .from("learning_path_items")
    .delete()
    .eq("learning_path_id", parsed.data.pathId);

  if (deleteError) {
    return { message: deleteError.message, status: "error" };
  }

  const { error: itemError } = await supabase
    .from("learning_path_items")
    .insert(itemRows(parsed.data.pathId, items));

  if (itemError) {
    return { message: itemError.message, status: "error" };
  }

  await supabase.from("activity_logs").insert({
    action: `Parcours modifié : ${parsed.data.title}`,
    entity_id: parsed.data.pathId,
    entity_type: "learning_path",
    user_id: currentUser.user.id,
  });

  revalidateLearningPathRoutes();
  revalidatePath(`/coach/paths/${parsed.data.pathId}/edit`);

  return {
    message: "Parcours mis à jour.",
    status: "success",
  };
}

export async function duplicateLearningPathAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = deletePathSchema.safeParse({
    pathId: formData.get("pathId"),
  });

  if (!parsed.success) {
    return;
  }

  const isAdmin = currentUser.role === "admin";
  const path = await getWritablePath(
    parsed.data.pathId,
    currentUser.user.id,
    isAdmin,
  );

  if (!path) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { data: items, error: itemFetchError } = await supabase
    .from("learning_path_items")
    .select("content_id,quiz_id,position")
    .eq("learning_path_id", path.id)
    .order("position", { ascending: true });

  if (itemFetchError || !items?.length) {
    return;
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("learning_paths")
    .insert({
      cohort_id: path.cohort_id,
      created_by: currentUser.user.id,
      description: path.description,
      title: `Copie de ${path.title}`.slice(0, 140),
    })
    .select("id,title")
    .single<{ id: string; title: string }>();

  if (duplicateError) {
    return;
  }

  const { error: duplicateItemsError } = await supabase
    .from("learning_path_items")
    .insert(
      items.map((item, index) => ({
        content_id: item.content_id,
        learning_path_id: duplicate.id,
        position: index + 1,
        quiz_id: item.quiz_id,
      })),
    );

  if (duplicateItemsError) {
    await supabase.from("learning_paths").delete().eq("id", duplicate.id);

    return;
  }

  await supabase.from("activity_logs").insert({
    action: `Parcours dupliqué : ${path.title}`,
    entity_id: duplicate.id,
    entity_type: "learning_path",
    user_id: currentUser.user.id,
  });

  revalidateLearningPathRoutes();
}

export async function sendLearningPathReminderAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = reminderSchema.safeParse({
    coacheeId: formData.get("coacheeId"),
    pathTitle: formData.get("pathTitle"),
    reason: formData.get("reason"),
    reminderType: formData.get("reminderType"),
  });

  if (!parsed.success) {
    return;
  }

  const allowed = await canMessageUser(parsed.data.coacheeId);

  if (!allowed) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const templateUsage = reminderUsageByType[parsed.data.reminderType];
  const template = await getLearningPathReminderTemplate({
    currentUserId: currentUser.user.id,
    isAdmin: currentUser.role === "admin",
    usage: templateUsage,
  });
  const body = template
    ? renderReminderTemplateBody(template.body, {
        motif: parsed.data.reason,
        parcours: parsed.data.pathTitle,
        type_relance:
          parsed.data.reminderType === "correction" ? "correction" : "blocage",
      })
    : defaultLearningPathReminderBody(parsed.data);
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      body,
      receiver_id: parsed.data.coacheeId,
      sender_id: currentUser.user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return;
  }

  await supabase.from("activity_logs").insert({
    action:
      parsed.data.reminderType === "correction"
        ? `Message correction parcours : ${parsed.data.pathTitle}`
        : `Relance parcours envoyée : ${parsed.data.pathTitle}`,
    entity_id: message.id,
    entity_type: "message",
    metadata: {
      coacheeId: parsed.data.coacheeId,
      learningPathTitle: parsed.data.pathTitle,
      reason: parsed.data.reason,
      reminderTemplateId: template?.id ?? null,
      reminderTitle: template?.title ?? null,
      reminderType: parsed.data.reminderType,
      reminderUsage: templateUsage,
    },
    user_id: currentUser.user.id,
  });

  revalidatePath("/coach/messages");
  revalidatePath("/coachee/messages");
  revalidateLearningPathRoutes();
}

export async function deleteLearningPathAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = deletePathSchema.safeParse({
    pathId: formData.get("pathId"),
  });

  if (!parsed.success) {
    return;
  }

  const isAdmin = currentUser.role === "admin";
  const path = await getWritablePath(
    parsed.data.pathId,
    currentUser.user.id,
    isAdmin,
  );

  if (!path) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("learning_paths").delete().eq("id", path.id);
  await supabase.from("activity_logs").insert({
    action: `Parcours supprimé : ${path.title}`,
    entity_id: path.id,
    entity_type: "learning_path",
    user_id: currentUser.user.id,
  });

  revalidateLearningPathRoutes();
}

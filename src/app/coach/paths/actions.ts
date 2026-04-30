"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export type LearningPathActionState = {
  message: string;
  status: "error" | "idle" | "success";
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

async function getWritablePath(pathId: string, userId: string, isAdmin: boolean) {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("learning_paths").select("id,title").eq("id", pathId);

  if (!isAdmin) {
    query = query.eq("created_by", userId);
  }

  const { data, error } = await query.maybeSingle<{
    id: string;
    title: string;
  }>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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

  const items = formData
    .getAll("items")
    .map(parseItem)
    .filter(Boolean) as Array<{ id: string; kind: "content" | "quiz" }>;

  if (!items.length) {
    return {
      message: "Ajoutez au moins un contenu ou un quiz au parcours.",
      status: "error",
    };
  }

  const isAdmin = currentUser.role === "admin";
  const supabase = await createServerSupabaseClient();
  let cohortQuery = supabase
    .from("cohorts")
    .select("id,name")
    .eq("id", parsed.data.cohortId);

  if (!isAdmin) {
    cohortQuery = cohortQuery.eq("coach_id", currentUser.user.id);
  }

  const { data: cohort, error: cohortError } = await cohortQuery.maybeSingle<{
    id: string;
    name: string;
  }>();

  if (cohortError) {
    return { message: cohortError.message, status: "error" };
  }

  if (!cohort) {
    return {
      message: "Cohorte introuvable ou non autorisée.",
      status: "error",
    };
  }

  const contentIds = [...new Set(items.filter((item) => item.kind === "content").map((item) => item.id))];
  const quizIds = [...new Set(items.filter((item) => item.kind === "quiz").map((item) => item.id))];

  try {
    const [allowedContents, allowedQuizzes] = await Promise.all([
      getAllowedCount("contents", contentIds, currentUser.user.id, isAdmin),
      getAllowedCount("quizzes", quizIds, currentUser.user.id, isAdmin),
    ]);

    if (allowedContents !== contentIds.length || allowedQuizzes !== quizIds.length) {
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

  const { data: path, error: pathError } = await supabase
    .from("learning_paths")
    .insert({
      cohort_id: cohort.id,
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
    items.map((item, index) => ({
      content_id: item.kind === "content" ? item.id : null,
      learning_path_id: path.id,
      position: index + 1,
      quiz_id: item.kind === "quiz" ? item.id : null,
    })),
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
    message: `Parcours créé pour ${cohort.name}.`,
    status: "success",
  };
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

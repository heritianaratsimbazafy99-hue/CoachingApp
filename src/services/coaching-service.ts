import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type SupabaseTable =
  | "activity_logs"
  | "assignment_progress"
  | "assignments"
  | "calendar_events"
  | "coach_notes"
  | "cohort_members"
  | "cohorts"
  | "content_progress"
  | "contents"
  | "messages"
  | "profiles"
  | "quiz_answers"
  | "quiz_attempts"
  | "quiz_options"
  | "quiz_questions"
  | "quizzes"
  | "subthemes"
  | "themes";

export async function listRecords<T>(table: SupabaseTable) {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.from(table).select("*");

  if (error) {
    throw error;
  }

  return (data ?? []) as T[];
}

export async function createRecord<TInput extends object>(
  table: SupabaseTable,
  payload: TInput,
) {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.from(table).insert(payload).select();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateRecord<TInput extends object>(
  table: SupabaseTable,
  id: string,
  payload: TInput,
) {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select();

  if (error) {
    throw error;
  }

  return data;
}

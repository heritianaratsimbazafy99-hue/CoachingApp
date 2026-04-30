"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export type MarkCoacheeNotificationsReadState = {
  message: string;
  status: "error" | "idle" | "success";
};

export async function markCoacheeNotificationMessagesReadAction(
  previousState: MarkCoacheeNotificationsReadState,
  formData: FormData,
): Promise<MarkCoacheeNotificationsReadState> {
  void previousState;
  void formData;

  const currentUser = await requireRole(["admin", "coachee"]);
  const { data, error } = await createServiceSupabaseClient()
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", currentUser.user.id)
    .is("read_at", null)
    .select("id");

  if (error) {
    return {
      message: `Impossible de marquer les messages comme lus : ${error.message}`,
      status: "error",
    };
  }

  revalidatePath("/coach/messages");
  revalidatePath("/coachee", "layout");
  revalidatePath("/coachee");
  revalidatePath("/coachee/messages");
  revalidatePath("/coachee/notifications");

  const updatedCount = (data ?? []).length;

  return {
    message: updatedCount
      ? `${updatedCount} message${updatedCount > 1 ? "s" : ""} marqué${
          updatedCount > 1 ? "s" : ""
        } comme lu${updatedCount > 1 ? "s" : ""}.`
      : "Aucun message non lu.",
    status: "success",
  };
}

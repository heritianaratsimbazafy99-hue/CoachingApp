"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canMessageUser } from "@/services/messaging-service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Le message est vide.")
    .max(2000, "Le message est trop long."),
  receiverId: z.string().trim().regex(uuidPattern, "Destinataire invalide."),
});

function revalidateMessagingPaths() {
  revalidatePath("/coach/messages");
  revalidatePath("/coachee/messages");
}

export type SendMessageState = {
  message: string;
  status: "error" | "idle" | "success";
};

export async function sendMessageAction(
  _previousState: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const currentUser = await requireRole(["admin", "coach", "coachee"]);
  const parsed = sendMessageSchema.safeParse({
    body: formData.get("body"),
    receiverId: formData.get("receiverId"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Le message contient des champs invalides.",
      status: "error",
    };
  }

  const { body, receiverId } = parsed.data;
  const allowed = await canMessageUser(receiverId);

  if (!allowed) {
    return {
      message: "Cette conversation n'est pas autorisée.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("messages").insert({
    body,
    receiver_id: receiverId,
    sender_id: currentUser.user.id,
  });

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  await supabase.from("activity_logs").insert({
    action: "Message envoyé",
    entity_id: receiverId,
    entity_type: "message",
    user_id: currentUser.user.id,
  });

  revalidateMessagingPaths();

  return {
    message: "Message envoyé.",
    status: "success",
  };
}

export async function markConversationReadAction(participantId: string) {
  const currentUser = await requireRole(["admin", "coach", "coachee"]);

  if (!uuidPattern.test(participantId)) {
    return;
  }

  const allowed = await canMessageUser(participantId);

  if (!allowed) {
    return;
  }

  await createServiceSupabaseClient()
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", participantId)
    .eq("receiver_id", currentUser.user.id)
    .is("read_at", null);

  revalidateMessagingPaths();
}

import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { CalendarEventType, UserRole } from "@/types/coaching";
import { eventTypeLabel, formatDateTime } from "@/utils/format";
import {
  coachNotificationPreferenceOptions,
  coacheeNotificationPreferenceOptions,
  getNotificationPreferenceCategories,
  parseNotificationPreferenceMap,
} from "@/utils/notification-preferences";
import type { ReminderTemplateUsage } from "@/utils/reminders";

export type TransactionalEmailType =
  | "calendar_event"
  | "calendar_event_reminder"
  | "invitation"
  | "message_received"
  | "password_reset"
  | "path_reminder"
  | "quiz_correction";

type EmailDeliveryStatus = "failed" | "sent" | "skipped";
type AdminSupabaseClient = ReturnType<typeof createServiceSupabaseClient>;
type EmailMetadata = Record<string, boolean | number | string | null | undefined>;

type EmailRecipient = {
  email: string;
  fullName: string;
  notificationPreferences: unknown;
  role: UserRole;
  userId: string;
};

type EmailLogInput = {
  errorMessage?: string;
  metadata?: EmailMetadata;
  provider?: string;
  providerMessageId?: string;
  recipientEmail: string;
  recipientUserId?: string;
  status: EmailDeliveryStatus;
  subject: string;
  type: TransactionalEmailType;
};

type SendEmailInput = {
  actionLabel?: string;
  actionUrl?: string;
  dedupeMetadata?: EmailMetadata;
  html: string;
  metadata?: EmailMetadata;
  preferenceCategory?: string;
  recipientEmail?: string;
  recipientProfile?: EmailRecipient | null;
  recipientUserId?: string;
  subject: string;
  text: string;
  type: TransactionalEmailType;
};

type CalendarEventEmailRow = {
  coach_id: string;
  coachee_id: string | null;
  cohort_id: string | null;
  description: string | null;
  end_time: string;
  id: string;
  start_time: string;
  status: string;
  title: string;
  type: CalendarEventType;
};

type CalendarEmailKind = "reminder" | "scheduled";

const appName = "CoachingApp";
const resendApiUrl = "https://api.resend.com/emails";
const coachPreferenceCategories = new Set<string>(
  coachNotificationPreferenceOptions.map((option) => option.category),
);
const coacheePreferenceCategories = new Set<string>(
  coacheeNotificationPreferenceOptions.map((option) => option.category),
);

function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "coach" || value === "coachee";
}

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return "http://localhost:3000";
  }

  const withProtocol = value.startsWith("http") ? value : `https://${value}`;

  return withProtocol.replace(/\/+$/, "");
}

function appUrl(path: string) {
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.VERCEL_URL,
  );

  return new URL(path, baseUrl).toString();
}

function compactMetadata(metadata: EmailMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#39;",
      "<": "&lt;",
      ">": "&gt;",
    };

    return entities[character] ?? character;
  });
}

function truncateText(value: string, maxLength = 420) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function renderParagraphs(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return "";
  }

  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;color:#334155;line-height:1.6;">${escapeHtml(
          paragraph,
        )}</p>`,
    )
    .join("");
}

function renderEmailLayout({
  actionLabel,
  actionUrl,
  bodyHtml,
  intro,
  title,
}: {
  actionLabel?: string;
  actionUrl?: string;
  bodyHtml: string;
  intro: string;
  title: string;
}) {
  const action =
    actionLabel && actionUrl
      ? `<p style="margin:26px 0 0;"><a href="${escapeHtml(
          actionUrl,
        )}" style="background:#111827;border-radius:8px;color:#ffffff;display:inline-block;font-weight:700;padding:12px 18px;text-decoration:none;">${escapeHtml(
          actionLabel,
        )}</a></p>`
      : "";

  return `<!doctype html>
<html lang="fr">
  <body style="background:#f8fafc;font-family:Arial,Helvetica,sans-serif;margin:0;padding:32px;">
    <main style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;margin:0 auto;max-width:620px;padding:30px;">
      <p style="color:#64748b;font-size:13px;font-weight:700;letter-spacing:.04em;margin:0 0 14px;text-transform:uppercase;">${appName}</p>
      <h1 style="color:#0f172a;font-size:24px;line-height:1.25;margin:0 0 16px;">${escapeHtml(
        title,
      )}</h1>
      <p style="color:#334155;line-height:1.6;margin:0 0 16px;">${escapeHtml(
        intro,
      )}</p>
      ${bodyHtml}
      ${action}
      <p style="border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;margin:28px 0 0;padding-top:18px;">Cet email est envoyé automatiquement par ${appName}.</p>
    </main>
  </body>
</html>`;
}

function renderTextEmail({
  actionUrl,
  lines,
  title,
}: {
  actionUrl?: string;
  lines: string[];
  title: string;
}) {
  return [title, "", ...lines, actionUrl ? `Ouvrir : ${actionUrl}` : ""]
    .filter(Boolean)
    .join("\n");
}

function getMetadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function resolveEmailRecipient(
  adminSupabase: AdminSupabaseClient,
  userId: string,
): Promise<EmailRecipient | null> {
  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.getUserById(userId);

  if (authError || !authData.user?.email) {
    return null;
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("full_name,notification_preferences,role,user_id")
    .eq("user_id", userId)
    .maybeSingle<{
      full_name: string | null;
      notification_preferences: unknown;
      role: UserRole | null;
      user_id: string;
    }>();

  const authRole = authData.user.app_metadata?.role;
  const role = isUserRole(profile?.role)
    ? profile.role
    : isUserRole(authRole)
      ? authRole
      : "coachee";
  const fullName =
    profile?.full_name ??
    getMetadataValue(authData.user.user_metadata, "full_name") ??
    getMetadataValue(authData.user.user_metadata, "name") ??
    authData.user.email;

  return {
    email: authData.user.email,
    fullName,
    notificationPreferences: profile?.notification_preferences,
    role,
    userId,
  };
}

function isPreferenceEnabled(recipient: EmailRecipient, category?: string) {
  if (!category || recipient.role === "admin") {
    return true;
  }

  const preferences = parseNotificationPreferenceMap(
    recipient.notificationPreferences,
  );

  if (recipient.role === "coach" && coachPreferenceCategories.has(category)) {
    return getNotificationPreferenceCategories(preferences, "coach").some(
      (selectedCategory) => selectedCategory === category,
    );
  }

  if (
    recipient.role === "coachee" &&
    coacheePreferenceCategories.has(category)
  ) {
    return getNotificationPreferenceCategories(preferences, "coachee").some(
      (selectedCategory) => selectedCategory === category,
    );
  }

  return true;
}

async function recordEmailLog(
  adminSupabase: AdminSupabaseClient,
  input: EmailLogInput,
) {
  await adminSupabase.from("email_logs").insert({
    email_type: input.type,
    error_message: input.errorMessage ?? null,
    metadata: compactMetadata(input.metadata),
    provider: input.provider ?? null,
    provider_message_id: input.providerMessageId ?? null,
    recipient_email: input.recipientEmail,
    recipient_user_id: input.recipientUserId ?? null,
    status: input.status,
    subject: input.subject,
  });
}

async function safeRecordEmailLog(
  adminSupabase: AdminSupabaseClient,
  input: EmailLogInput,
) {
  try {
    await recordEmailLog(adminSupabase, input);
  } catch {
    // Email logs are operational telemetry; they should never block a user flow.
  }
}

async function hasExistingEmailLog(
  adminSupabase: AdminSupabaseClient,
  input: {
    metadata: EmailMetadata;
    recipientUserId?: string;
    type: TransactionalEmailType;
  },
) {
  if (!input.recipientUserId) {
    return false;
  }

  const { data, error } = await adminSupabase
    .from("email_logs")
    .select("id")
    .eq("email_type", input.type)
    .eq("recipient_user_id", input.recipientUserId)
    .contains("metadata", compactMetadata(input.metadata))
    .limit(1);

  if (error) {
    return false;
  }

  return Boolean(data?.length);
}

function getResendMessageId(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const id = (payload as Record<string, unknown>).id;

  return typeof id === "string" ? id : undefined;
}

function getResendError(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Réponse email invalide.";
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string") {
    return record.message;
  }

  if (typeof record.error === "string") {
    return record.error;
  }

  return "Le provider email a refusé l'envoi.";
}

async function sendTransactionalEmailWithClient(
  adminSupabase: AdminSupabaseClient,
  input: SendEmailInput,
) {
  const metadata = compactMetadata(input.metadata);
  const dedupeMetadata = input.dedupeMetadata
    ? compactMetadata(input.dedupeMetadata)
    : null;

  if (
    dedupeMetadata &&
    (await hasExistingEmailLog(adminSupabase, {
      metadata: dedupeMetadata,
      recipientUserId: input.recipientUserId,
      type: input.type,
    }))
  ) {
    return { status: "skipped" as const };
  }

  const recipient =
    input.recipientProfile ??
    (input.recipientUserId
      ? await resolveEmailRecipient(adminSupabase, input.recipientUserId)
      : null);
  const recipientEmail = recipient?.email ?? input.recipientEmail;

  if (!recipientEmail) {
    await safeRecordEmailLog(adminSupabase, {
      errorMessage: "Email destinataire introuvable.",
      metadata,
      recipientEmail: "unknown",
      recipientUserId: input.recipientUserId,
      status: "skipped",
      subject: input.subject,
      type: input.type,
    });

    return { status: "skipped" as const };
  }

  if (
    recipient &&
    !isPreferenceEnabled(recipient, input.preferenceCategory)
  ) {
    await safeRecordEmailLog(adminSupabase, {
      errorMessage: "Préférence email désactivée.",
      metadata,
      recipientEmail,
      recipientUserId: recipient.userId,
      status: "skipped",
      subject: input.subject,
      type: input.type,
    });

    return { status: "skipped" as const };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.TRANSACTIONAL_EMAIL_FROM ??
    process.env.EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    await safeRecordEmailLog(adminSupabase, {
      errorMessage:
        "Provider email non configuré. Ajoutez RESEND_API_KEY et TRANSACTIONAL_EMAIL_FROM.",
      metadata,
      provider: "resend",
      recipientEmail,
      recipientUserId: recipient?.userId ?? input.recipientUserId,
      status: "skipped",
      subject: input.subject,
      type: input.type,
    });

    return { status: "skipped" as const };
  }

  try {
    const response = await fetch(resendApiUrl, {
      body: JSON.stringify({
        from,
        html: input.html,
        subject: input.subject,
        text: input.text,
        to: [recipientEmail],
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      await safeRecordEmailLog(adminSupabase, {
        errorMessage: getResendError(payload),
        metadata,
        provider: "resend",
        recipientEmail,
        recipientUserId: recipient?.userId ?? input.recipientUserId,
        status: "failed",
        subject: input.subject,
        type: input.type,
      });

      return { status: "failed" as const };
    }

    await safeRecordEmailLog(adminSupabase, {
      metadata,
      provider: "resend",
      providerMessageId: getResendMessageId(payload),
      recipientEmail,
      recipientUserId: recipient?.userId ?? input.recipientUserId,
      status: "sent",
      subject: input.subject,
      type: input.type,
    });

    return { status: "sent" as const };
  } catch (error) {
    await safeRecordEmailLog(adminSupabase, {
      errorMessage:
        error instanceof Error ? error.message : "Envoi email impossible.",
      metadata,
      provider: "resend",
      recipientEmail,
      recipientUserId: recipient?.userId ?? input.recipientUserId,
      status: "failed",
      subject: input.subject,
      type: input.type,
    });

    return { status: "failed" as const };
  }
}

export async function recordExternalTransactionalEmail(input: {
  metadata?: EmailMetadata;
  provider: string;
  providerMessageId?: string;
  recipientEmail: string;
  recipientUserId?: string;
  subject: string;
  type: Extract<TransactionalEmailType, "invitation" | "password_reset">;
}) {
  const adminSupabase = createServiceSupabaseClient();

  await safeRecordEmailLog(adminSupabase, {
    metadata: input.metadata,
    provider: input.provider,
    providerMessageId: input.providerMessageId,
    recipientEmail: input.recipientEmail,
    recipientUserId: input.recipientUserId,
    status: "sent",
    subject: input.subject,
    type: input.type,
  });
}

export async function sendMessageReceivedEmail(input: {
  body: string;
  receiverId: string;
  senderId: string;
}) {
  const adminSupabase = createServiceSupabaseClient();
  const [receiver, sender] = await Promise.all([
    resolveEmailRecipient(adminSupabase, input.receiverId),
    resolveEmailRecipient(adminSupabase, input.senderId),
  ]);

  if (!receiver) {
    return;
  }

  const senderName = sender?.fullName ?? "Un membre";
  const actionUrl = appUrl(
    receiver.role === "coachee"
      ? `/coachee/messages?conversation=${input.senderId}`
      : `/coach/messages?conversation=${input.senderId}`,
  );
  const preview = truncateText(input.body);
  const title = `Nouveau message de ${senderName}`;
  const html = renderEmailLayout({
    actionLabel: "Ouvrir la conversation",
    actionUrl,
    bodyHtml: renderParagraphs(preview),
    intro: "Un nouveau message vous attend dans votre espace de coaching.",
    title,
  });
  const text = renderTextEmail({
    actionUrl,
    lines: [
      "Un nouveau message vous attend dans votre espace de coaching.",
      preview,
    ],
    title,
  });

  await sendTransactionalEmailWithClient(adminSupabase, {
    actionLabel: "Ouvrir la conversation",
    actionUrl,
    html,
    metadata: {
      senderId: input.senderId,
      senderName,
    },
    preferenceCategory: "messages",
    recipientProfile: receiver,
    recipientUserId: input.receiverId,
    subject: title,
    text,
    type: "message_received",
  });
}

export async function sendPathReminderEmail(input: {
  body: string;
  coachId: string;
  coacheeId: string;
  reminderTemplateId: string;
  title: string;
  usage: ReminderTemplateUsage;
}) {
  const adminSupabase = createServiceSupabaseClient();
  const [coachee, coach] = await Promise.all([
    resolveEmailRecipient(adminSupabase, input.coacheeId),
    resolveEmailRecipient(adminSupabase, input.coachId),
  ]);

  if (!coachee) {
    return;
  }

  const isPathReminder = input.usage !== "general";
  const actionUrl = appUrl(
    isPathReminder
      ? "/coachee/paths"
      : `/coachee/messages?conversation=${input.coachId}`,
  );
  const coachName = coach?.fullName ?? "Votre coach";
  const subject = isPathReminder
    ? `Relance parcours : ${input.title}`
    : `Relance de coaching : ${input.title}`;
  const intro = `${coachName} vous a envoyé une relance.`;
  const html = renderEmailLayout({
    actionLabel: isPathReminder ? "Voir mes parcours" : "Ouvrir le message",
    actionUrl,
    bodyHtml: renderParagraphs(input.body),
    intro,
    title: subject,
  });
  const text = renderTextEmail({
    actionUrl,
    lines: [intro, input.body],
    title: subject,
  });

  await sendTransactionalEmailWithClient(adminSupabase, {
    actionUrl,
    html,
    metadata: {
      coachId: input.coachId,
      reminderTemplateId: input.reminderTemplateId,
      reminderUsage: input.usage,
    },
    preferenceCategory: isPathReminder ? "paths" : "messages",
    recipientProfile: coachee,
    recipientUserId: input.coacheeId,
    subject,
    text,
    type: "path_reminder",
  });
}

export async function sendQuizCorrectionAvailableEmail(input: {
  attemptId: string;
  coachId: string;
  coacheeId: string;
  percentage: number;
  quizTitle: string;
  status: string;
}) {
  const actionUrl = appUrl("/coachee/results");
  const subject = `Correction disponible : ${input.quizTitle}`;
  const summary =
    input.status === "passed"
      ? `Votre correction est disponible. Score : ${Math.round(
          input.percentage,
        )}%.`
      : `Votre correction est disponible. Score : ${Math.round(
          input.percentage,
        )}%. Vous pouvez consulter le retour et reprendre si nécessaire.`;
  const html = renderEmailLayout({
    actionLabel: "Voir mes résultats",
    actionUrl,
    bodyHtml: renderParagraphs(summary),
    intro: "Votre coach a terminé la correction d'une réponse ouverte.",
    title: subject,
  });
  const text = renderTextEmail({
    actionUrl,
    lines: [
      "Votre coach a terminé la correction d'une réponse ouverte.",
      summary,
    ],
    title: subject,
  });
  const adminSupabase = createServiceSupabaseClient();

  await sendTransactionalEmailWithClient(adminSupabase, {
    actionUrl,
    dedupeMetadata: {
      attemptId: input.attemptId,
      notificationKind: "correction_available",
    },
    html,
    metadata: {
      attemptId: input.attemptId,
      coachId: input.coachId,
      notificationKind: "correction_available",
      percentage: Math.round(input.percentage),
      status: input.status,
    },
    preferenceCategory: "results",
    recipientUserId: input.coacheeId,
    subject,
    text,
    type: "quiz_correction",
  });
}

async function fetchCalendarEvent(
  adminSupabase: AdminSupabaseClient,
  eventId: string,
) {
  const { data, error } = await adminSupabase
    .from("calendar_events")
    .select(
      "coach_id,coachee_id,cohort_id,description,end_time,id,start_time,status,title,type",
    )
    .eq("id", eventId)
    .maybeSingle<CalendarEventEmailRow>();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getCalendarRecipientIds(
  adminSupabase: AdminSupabaseClient,
  event: CalendarEventEmailRow,
  options: { includeCoach: boolean },
) {
  const recipientIds = new Set<string>();

  if (options.includeCoach) {
    recipientIds.add(event.coach_id);
  }

  if (event.coachee_id) {
    recipientIds.add(event.coachee_id);
  }

  if (event.cohort_id) {
    const { data } = await adminSupabase
      .from("cohort_members")
      .select("user_id")
      .eq("cohort_id", event.cohort_id);

    (data ?? []).forEach((member) => {
      if (typeof member.user_id === "string") {
        recipientIds.add(member.user_id);
      }
    });
  }

  return [...recipientIds];
}

async function sendCalendarEventEmail(
  adminSupabase: AdminSupabaseClient,
  input: {
    event: CalendarEventEmailRow;
    kind: CalendarEmailKind;
    recipientUserId: string;
  },
) {
  const recipient = await resolveEmailRecipient(
    adminSupabase,
    input.recipientUserId,
  );

  if (!recipient) {
    return { status: "skipped" as const };
  }

  const isReminder = input.kind === "reminder";
  const notificationKind = isReminder ? "upcoming_24h" : "scheduled";
  const actionUrl = appUrl(
    recipient.role === "coachee" ? "/coachee/calendar" : "/coach/calendar",
  );
  const subject = isReminder
    ? `Rappel agenda : ${input.event.title}`
    : `Nouvel événement agenda : ${input.event.title}`;
  const when = `${formatDateTime(input.event.start_time)} - ${formatDateTime(
    input.event.end_time,
  )}`;
  const details = [
    `Type : ${eventTypeLabel[input.event.type]}`,
    `Créneau : ${when}`,
    input.event.description
      ? `Description : ${input.event.description}`
      : null,
  ].filter(Boolean) as string[];
  const intro = isReminder
    ? "Un événement agenda commence bientôt."
    : "Un nouvel événement a été ajouté à votre agenda.";
  const html = renderEmailLayout({
    actionLabel: "Voir mon agenda",
    actionUrl,
    bodyHtml: renderParagraphs(details.join("\n\n")),
    intro,
    title: subject,
  });
  const text = renderTextEmail({
    actionUrl,
    lines: [intro, ...details],
    title: subject,
  });

  return sendTransactionalEmailWithClient(adminSupabase, {
    actionUrl,
    dedupeMetadata: {
      eventId: input.event.id,
      notificationKind,
    },
    html,
    metadata: {
      eventId: input.event.id,
      eventType: input.event.type,
      notificationKind,
      startTime: input.event.start_time,
    },
    preferenceCategory: "agenda",
    recipientProfile: recipient,
    recipientUserId: input.recipientUserId,
    subject,
    text,
    type: isReminder ? "calendar_event_reminder" : "calendar_event",
  });
}

async function sendCalendarEmailsForEvent(
  adminSupabase: AdminSupabaseClient,
  event: CalendarEventEmailRow,
  kind: CalendarEmailKind,
) {
  const recipientIds = await getCalendarRecipientIds(adminSupabase, event, {
    includeCoach: kind === "reminder",
  });
  const counters = {
    failed: 0,
    sent: 0,
    skipped: 0,
  };

  for (const recipientUserId of recipientIds) {
    const result = await sendCalendarEventEmail(adminSupabase, {
      event,
      kind,
      recipientUserId,
    });

    counters[result.status] += 1;
  }

  return counters;
}

export async function sendCalendarEventScheduledEmails(input: {
  eventId: string;
}) {
  const adminSupabase = createServiceSupabaseClient();
  const event = await fetchCalendarEvent(adminSupabase, input.eventId);

  if (!event || event.status !== "scheduled") {
    return { failed: 0, sent: 0, skipped: 0 };
  }

  return sendCalendarEmailsForEvent(adminSupabase, event, "scheduled");
}

export async function sendUpcomingCalendarEventReminderEmails(
  windowHours = 24,
) {
  const adminSupabase = createServiceSupabaseClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
  const { data, error } = await adminSupabase
    .from("calendar_events")
    .select(
      "coach_id,coachee_id,cohort_id,description,end_time,id,start_time,status,title,type",
    )
    .eq("status", "scheduled")
    .gte("start_time", now.toISOString())
    .lte("start_time", windowEnd.toISOString())
    .order("start_time", { ascending: true })
    .returns<CalendarEventEmailRow[]>();

  if (error) {
    return {
      error: error.message,
      events: 0,
      failed: 0,
      sent: 0,
      skipped: 0,
    };
  }

  const totals = {
    events: data?.length ?? 0,
    failed: 0,
    sent: 0,
    skipped: 0,
  };

  for (const event of data ?? []) {
    const result = await sendCalendarEmailsForEvent(
      adminSupabase,
      event,
      "reminder",
    );

    totals.failed += result.failed;
    totals.sent += result.sent;
    totals.skipped += result.skipped;
  }

  return totals;
}

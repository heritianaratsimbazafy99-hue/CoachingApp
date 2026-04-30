import { NextResponse } from "next/server";
import { sendUpcomingCalendarEventReminderEmails } from "@/services/transactional-email-service";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET manquant sur le serveur." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await sendUpcomingCalendarEventReminderEmails();

  return NextResponse.json(result);
}
